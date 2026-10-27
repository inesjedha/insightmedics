"""Chaîne « Analyses + résultats » (offre à 500 DT) : logique métier, indépendante de HTTP.

Cycle de vie (models.AnalysisStatus) :
  awaiting_base (« à préparer ») → (« préparer le plan ») planning → plan_ready
  → (plan validé par Dr Hamza) computing → review → (relu) delivered.

La base de départ est celle de l'audit : c'est nous qui la nettoyons (corrections du
plan, analysis/clean.py). Si l'étudiant renvoie une base qu'il a corrigée lui-même,
l'admin peut la déposer : elle remplace alors la base de l'audit, et un contre-audit la
compare à l'audit.
Les deux étapes longues (plan par l'IA ; calculs puis rédaction par l'IA) tournent en
tâche de fond, protégées par un verrou à bail comme l'audit (services/unlock_jobs.py) :
jamais deux exécutions en même temps, résultat écrit seulement par la tâche propriétaire.
Le plan peut aussi être écrit ou corrigé à la main (JSON), sans IA.
"""

from __future__ import annotations

import logging
import secrets
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, BinaryIO

import pandas as pd
from pydantic import ValidationError
from sqlalchemy import or_, update
from sqlalchemy.orm import Session

from ..analysis.llm_plan import run_plan_llm
from ..analysis.llm_write import build_context, run_write_llm
from ..analysis.plan import AnalysisPlan, plan_problems
from ..analysis.prepare import analysed as included_rows
from ..analysis.prepare import dry_run, prepare
from ..analysis.recheck import recheck
from ..analysis.report import build_results_docx, build_results_xlsx
from ..analysis.stats import run_plan
from ..config import settings
from ..db import SessionLocal, execute_update
from ..models import Analysis, AnalysisStatus, Audit, AuditStatus, utcnow_iso
from ..pipeline.ingest import ingest
from ..pipeline.profile import profile
from .audits import (
    AuditError,
    check_data_extension,
    link_expiry,
    protocol_text,
    save_stream,
)

logger = logging.getLogger(__name__)

_SLOT = threading.Semaphore(1)  # une étape IA d'analyse à la fois par serveur
HEARTBEAT_SECONDS = 60
MAX_BASE_BYTES = 50 * 1024 * 1024


class AnalysisError(AuditError):
    """Erreur métier ; le message est destiné à l'admin."""


# ---------------------------------------------------------------- création et dépôt

def new_id() -> str:
    return "ana_" + secrets.token_hex(8)


def for_audit(db: Session, audit_id: str) -> Analysis | None:
    """La dernière analyse commandée pour cet audit."""
    return (db.query(Analysis).filter(Analysis.audit_id == audit_id)
            .order_by(Analysis.created_at.desc()).first())


def create(db: Session, audit: Audit) -> Analysis:
    """Commande l'analyse d'un audit livré. Idempotent : renvoie l'analyse existante."""
    if audit.status != AuditStatus.DONE or audit.purged_at:
        raise AnalysisError("L'analyse se commande sur un audit complet livré et non expiré.")
    existing = for_audit(db, audit.id)
    if existing and existing.status != AnalysisStatus.FAILED:
        return existing
    analysis = Analysis(id=new_id(), audit_id=audit.id, events=[])
    # Le lien privé (et les fichiers) restent disponibles le temps de l'analyse.
    audit.expires_at = link_expiry()
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    _event(db, analysis, "info", "Analyse commandée (offre Analyses + résultats). Base de "
                                 "départ : celle de l'audit, nettoyée par nos soins.")
    return analysis


def _dir(analysis: Analysis) -> Path:
    return settings.storage_dir / analysis.audit_id / analysis.id


def save_base(db: Session, analysis: Analysis, src: BinaryIO, file_name: str) -> Analysis:
    """Facultatif : base corrigée par l'étudiant, qui remplace celle de l'audit. Vérifie
    tout de suite qu'elle se lit."""
    if analysis.status not in (AnalysisStatus.AWAITING_BASE, AnalysisStatus.PLAN_READY,
                               AnalysisStatus.FAILED):
        raise AnalysisError("La base ne se remplace qu'avant la validation du plan.")
    ext = check_data_extension(file_name)
    dest = _dir(analysis) / f"base_corrigee{ext}"
    for old in _dir(analysis).glob("base_corrigee.*"):
        old.unlink()
    save_stream(src, dest, max_bytes=MAX_BASE_BYTES)
    try:
        df, _ = ingest(dest, file_name)
    except Exception as exc:
        dest.unlink(missing_ok=True)
        raise AnalysisError(f"Base illisible : {exc}") from exc
    analysis.file_name, analysis.stored_path = file_name, str(dest)
    analysis.status, analysis.error = AnalysisStatus.AWAITING_BASE, None
    analysis.updated_at = utcnow_iso()
    db.commit()
    _event(db, analysis, "info", f"Base corrigée déposée : {file_name} "
                                 f"({len(df)} lignes, {len(df.columns)} colonnes).")
    return analysis


def drop_base(db: Session, analysis: Analysis) -> Analysis:
    """Revient à la base de l'audit (la base corrigée déposée est supprimée)."""
    if analysis.status not in (AnalysisStatus.AWAITING_BASE, AnalysisStatus.PLAN_READY,
                               AnalysisStatus.FAILED):
        raise AnalysisError("La base ne se change qu'avant la validation du plan.")
    for old in _dir(analysis).glob("base_corrigee.*"):
        old.unlink()
    analysis.file_name, analysis.stored_path, analysis.recheck = None, None, None
    analysis.status, analysis.error = AnalysisStatus.AWAITING_BASE, None
    analysis.updated_at = utcnow_iso()
    db.commit()
    _event(db, analysis, "info", "Retour à la base de l'audit.")
    return analysis


def set_instructions(db: Session, analysis: Analysis, text: str) -> Analysis:
    analysis.instructions = text.strip()[:20000]
    analysis.updated_at = utcnow_iso()
    db.commit()
    return analysis


def _load_base(analysis: Analysis, audit: Audit) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Base de départ : la base corrigée par l'étudiant si elle a été déposée, sinon celle
    de l'audit (que nous nettoyons)."""
    if analysis.stored_path:
        path, name = analysis.stored_path, analysis.file_name or "base"
    else:
        path, name = audit.stored_path, audit.file_name
    if not path or not Path(path).exists():
        raise AnalysisError("Base introuvable (fichier expiré ou supprimé).")
    df, meta = ingest(path, name)
    return df, profile(df, meta)


def save_plan(db: Session, analysis: Analysis, audit: Audit, raw: dict[str, Any]) -> Analysis:
    """Plan écrit ou corrigé à la main : validé (schéma et colonnes) avant d'être gardé."""
    if analysis.status not in (AnalysisStatus.AWAITING_BASE, AnalysisStatus.PLAN_READY,
                               AnalysisStatus.FAILED, AnalysisStatus.REVIEW):
        raise AnalysisError("Le plan ne se modifie pas pendant un traitement ni après livraison.")
    try:
        plan = AnalysisPlan.model_validate(raw)
    except ValidationError as exc:
        raise AnalysisError(f"Plan invalide : {exc.errors()[:3]}") from exc
    df, _ = _load_base(analysis, audit)
    problems = plan_problems(plan, [str(c) for c in df.columns]) or dry_run(df, plan)
    if problems:
        raise AnalysisError("Plan incohérent : " + " ; ".join(problems[:8]))
    analysis.plan = plan.model_dump(mode="json")
    analysis.status, analysis.error = AnalysisStatus.PLAN_READY, None
    analysis.plan_validated_at = None
    analysis.updated_at = utcnow_iso()
    db.commit()
    _event(db, analysis, "info", "Plan enregistré (modifié à la main).")
    return analysis


def deliver(db: Session, analysis: Analysis, audit: Audit) -> Analysis:
    if analysis.status != AnalysisStatus.REVIEW:
        raise AnalysisError("Seule une analyse relue (« à relire ») peut être livrée.")
    analysis.status, analysis.delivered_at = AnalysisStatus.DELIVERED, utcnow_iso()
    analysis.updated_at = utcnow_iso()
    audit.expires_at = link_expiry()  # 30 jours pour télécharger à partir de la livraison
    db.commit()
    _event(db, analysis, "success", "Livrée sur le lien privé de l'étudiant.")
    return analysis


# ---------------------------------------------------------------- tâches de fond

def claim(db: Session, analysis: Analysis, step: str) -> str:
    """Réserve l'analyse pour une étape longue (« plan » ou « compute »). Lève une
    erreur si l'étape ne peut pas démarrer (déjà en cours, mauvaise étape)."""
    if step == "plan":
        allowed, target = ([AnalysisStatus.AWAITING_BASE, AnalysisStatus.PLAN_READY,
                            AnalysisStatus.FAILED], AnalysisStatus.PLANNING)
    else:
        if not analysis.plan:
            raise AnalysisError("Aucun plan à exécuter.")
        allowed, target = ([AnalysisStatus.PLAN_READY, AnalysisStatus.REVIEW,
                            AnalysisStatus.FAILED], AnalysisStatus.COMPUTING)
    job_id = secrets.token_hex(8)
    claimed = execute_update(db, (
        update(Analysis)
        .where(Analysis.id == analysis.id, Analysis.status.in_(allowed),
               Analysis.purged_at.is_(None))
        .values(status=target, job_id=job_id, job_started_at=utcnow_iso(), error=None,
                updated_at=utcnow_iso(),
                **({"plan_validated_at": utcnow_iso()} if step == "compute" else {}))))
    db.commit()
    db.refresh(analysis)
    if claimed != 1:
        raise AnalysisError("Étape déjà en cours, ou impossible à cette étape.")
    return job_id


def _owned(analysis_id: str, job_id: str) -> Any:
    return ((Analysis.id == analysis_id) & (Analysis.job_id == job_id)
            & Analysis.status.in_([AnalysisStatus.PLANNING, AnalysisStatus.COMPUTING]))


def _renew(analysis_id: str, job_id: str) -> bool:
    with SessionLocal() as db:
        n = execute_update(db, update(Analysis).where(_owned(analysis_id, job_id))
                           .values(job_started_at=utcnow_iso()))
        db.commit()
    return n == 1


@contextmanager
def _heartbeat(analysis_id: str, job_id: str) -> Iterator[None]:
    stop = threading.Event()

    def beat() -> None:
        while not stop.wait(HEARTBEAT_SECONDS):
            try:
                if not _renew(analysis_id, job_id):
                    return
            except Exception:
                logger.exception("Battement de cœur en échec pour l'analyse %s", analysis_id)

    thread = threading.Thread(target=beat, name=f"lease-{analysis_id}", daemon=True)
    thread.start()
    try:
        yield
    finally:
        stop.set()
        thread.join(timeout=5)


def _finish(analysis_id: str, job_id: str, values: dict[str, Any],
            event: tuple[str, str]) -> None:
    with SessionLocal() as db:
        n = execute_update(db, update(Analysis).where(_owned(analysis_id, job_id))
                           .values(**values, job_id=None, updated_at=utcnow_iso()))
        db.commit()
        if n:
            a = db.get(Analysis, analysis_id)
            if a is not None:
                _event(db, a, *event)
        else:
            logger.warning("Analyse %s : résultat de la tâche %s ignoré", analysis_id, job_id)


def _fail(analysis_id: str, job_id: str, exc: Exception) -> None:
    try:
        _finish(analysis_id, job_id, {"status": AnalysisStatus.FAILED, "error": str(exc)[:500]},
                ("warn", f"Échec : {str(exc)[:300]}"))
    except Exception:
        logger.exception("Impossible d'enregistrer l'échec de l'analyse %s", analysis_id)


def _context(analysis_id: str) -> tuple[Analysis, Audit]:
    with SessionLocal() as db:
        analysis, audit = db.get(Analysis, analysis_id), None
        if analysis is not None:
            audit = db.get(Audit, analysis.audit_id)
        if analysis is None or audit is None:
            raise AnalysisError("Analyse ou audit introuvable")
        db.expunge(analysis)
        db.expunge(audit)
    return analysis, audit


def auto_exclusions(profiling: dict[str, Any]) -> list[tuple[str, list[int]]]:
    """Lignes écartées par le code avant le plan : fiche vierge, lignes vides."""
    s = profiling.get("structure") or {}
    out: list[tuple[str, list[int]]] = []
    for key, label in (("template_rows", "Fiche de recueil vierge restée dans le tableau"),
                       ("empty_rows", "Ligne vide")):
        lines = (s.get(key) or {}).get("lines") or []
        if lines:
            out.append((label, [int(n) - 1 for n in lines]))
    return out


def run_planning(analysis_id: str, job_id: str) -> None:
    """Contre-audit de la base corrigée, puis plan proposé par l'IA. Ne lève jamais."""
    with _SLOT:
        try:
            analysis, audit = _context(analysis_id)
            with _heartbeat(analysis_id, job_id):
                df, prof = _load_base(analysis, audit)
                corrected = bool(analysis.stored_path)
                # Contre-audit seulement pour une base corrigée par l'étudiant.
                check = (recheck(audit.profiling, (audit.ai_audit or {}).get("assessment"),
                                 df, prof) if corrected else None)
                plan, notes = run_plan_llm(df, prof, audit.ai_audit, protocol_text(audit),
                                           analysis.instructions or "", check, corrected)
            if plan is None:
                _finish(analysis_id, job_id,
                        {"status": AnalysisStatus.AWAITING_BASE, "recheck": check,
                         "plan_notes": notes,
                         "error": "Plan IA non produit : " + "; ".join(notes)[:400]
                         + " (le plan peut être écrit à la main)."},
                        ("warn", "Plan IA non produit (il peut être écrit à la main)."))
                return
            _finish(analysis_id, job_id,
                    {"status": AnalysisStatus.PLAN_READY, "recheck": check,
                     "plan": plan.model_dump(mode="json"), "plan_notes": notes},
                    ("success", "Nettoyage et plan proposés : à valider par Dr Hamza."))
        except Exception as exc:
            logger.exception("Échec du plan de l'analyse %s", analysis_id)
            _fail(analysis_id, job_id, exc)


def compute(analysis: Analysis, audit: Audit) -> tuple[pd.DataFrame, list[dict[str, Any]],
                                                       list[dict[str, Any]],
                                                       list[dict[str, Any]], dict[str, Any]]:
    """Base d'analyse, flux, journal (corrections et colonnes calculées), résultats,
    profiling (déterministe)."""
    df, prof = _load_base(analysis, audit)
    plan = AnalysisPlan.model_validate(analysis.plan)
    base, flow, log = prepare(df, plan, auto_exclusions(prof))
    return base, flow, log, run_plan(plan, included_rows(base)), prof


def run_computing(analysis_id: str, job_id: str) -> None:
    """Calculs (code) puis rédaction (IA, chiffres contrôlés). Ne lève jamais."""
    with _SLOT:
        try:
            analysis, audit = _context(analysis_id)
            with _heartbeat(analysis_id, job_id):
                _, flow, log, results, _ = compute(analysis, audit)
                text, notes = run_write_llm(build_context(analysis.plan or {}, flow, results, log))
            _finish(analysis_id, job_id,
                    {"status": AnalysisStatus.REVIEW, "flow": flow, "derived_log": log,
                     "results": results, "text": text.model_dump() if text else None,
                     "error": None if text else "Rédaction IA non produite : "
                     + "; ".join(notes)[:400]},
                    ("success" if text else "warn",
                     "Résultats calculés et rédigés : à relire." if text else
                     "Résultats calculés ; rédaction IA non produite (tableaux seuls)."))
        except Exception as exc:
            logger.exception("Échec des calculs de l'analyse %s", analysis_id)
            _fail(analysis_id, job_id, exc)


def release_stale(db: Session, now: datetime | None = None) -> int:
    """Étapes interrompues (serveur arrêté) : passées en échec, à relancer."""
    cutoff = ((now or datetime.now(UTC))
              - timedelta(minutes=settings.unlock_lease_minutes)).isoformat()
    n = execute_update(db, (
        update(Analysis)
        .where(Analysis.status.in_([AnalysisStatus.PLANNING, AnalysisStatus.COMPUTING]),
               or_(Analysis.job_started_at.is_(None), Analysis.job_started_at < cutoff))
        .values(status=AnalysisStatus.FAILED, job_id=None,
                error="Étape interrompue (serveur arrêté pendant le traitement) : relancer.")))
    db.commit()
    return n


# ---------------------------------------------------------------- livrables

DELIVERABLES = {"resultats.docx", "resultats.xlsx"}


def build_deliverable(analysis: Analysis, audit: Audit, kind: str) -> tuple[bytes, str]:
    if not analysis.results:
        raise AnalysisError("Aucun résultat calculé.")
    if kind == "resultats.docx":
        return (build_results_docx(analysis.plan or {}, analysis.flow or [], analysis.results,
                                   analysis.text),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    base, flow, log, results, prof = compute(analysis, audit)
    pii = {p.get("column") for p in prof.get("pii_candidates") or []}
    return (build_results_xlsx(base, pii, flow, results, log, analysis.plan or {}),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


def _event(db: Session, analysis: Analysis, level: str, message: str) -> None:
    analysis.events = [*(analysis.events or []),
                       {"ts": utcnow_iso(), "level": level, "message": message}]
    db.commit()
