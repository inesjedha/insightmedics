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

Format faculté (app/theses, prompts de Dr Hamza) : quand la fiche de mission indique la
faculté, la rédaction suit son plan et sa charte, et les livrables sont deux Word à la
charte (« Analyse statistique » à insérer dans le M&M, chapitre « Résultats ») plus le
classeur. « Tout lancer » (`launch`) enchaîne plan, calculs et rédaction sans arrêt,
sauf si le plan pose des questions à trancher (doublons suspects, critère principal…) :
il s'arrête alors au plan, comme avant. La livraison reste un clic de l'équipe, après
relecture, et elle est refusée tant qu'un contrôle bloquant n'est pas levé.
"""

from __future__ import annotations

import logging
import secrets
import tempfile
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
from ..analysis.prepare import dry_run, first_data_line, prepare
from ..analysis.recheck import recheck
from ..analysis.report import build_results_docx, build_results_xlsx
from ..analysis.stats import run_plan
from ..config import settings
from ..db import SessionLocal, execute_update
from ..models import Analysis, AnalysisStatus, Audit, AuditStatus, utcnow_iso
from ..pipeline.ingest import ingest
from ..pipeline.profile import profile
from ..theses import fiche as fiche_mod
from ..theses.controles import Check, blocking, check_text
from ..theses.redaction import ResultsDraft, run_results_writer
from ..theses.render_docx import RenderError, plain_text
from ..theses.resultats import build_docs, figure_candidates, render_both, subject_slug
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
    analysis.status, analysis.error = AnalysisStatus.AWAITING_BASE, _plan_outdated(analysis)
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
    analysis.status, analysis.error = AnalysisStatus.AWAITING_BASE, _plan_outdated(analysis)
    analysis.updated_at = utcnow_iso()
    db.commit()
    _event(db, analysis, "info", "Retour à la base de l'audit.")
    return analysis


def _plan_outdated(analysis: Analysis) -> str | None:
    """Base changée : un plan existant ne peut plus être lancé tel quel (ses corrections par
    numéro de ligne visent peut-être d'autres patients). Il faut le refaire ou le relire et
    le réenregistrer."""
    if not analysis.plan:
        return None
    analysis.plan_validated_at = None
    return ("Base changée : refaites le plan, ou relisez-le et réenregistrez-le (les "
            "corrections par numéro de ligne visent peut-être d'autres patients).")


def set_instructions(db: Session, analysis: Analysis, text: str) -> Analysis:
    analysis.instructions = text.strip()[:20000]
    analysis.updated_at = utcnow_iso()
    db.commit()
    return analysis


# ---------------------------------------------------------------- fiche de mission

def faculty_format(analysis: Analysis) -> bool:
    """La fiche indique la faculté : rédaction et livrables au format de la faculté."""
    return fiche_mod.faculty(analysis.fiche) is not None


def faculty_ready(analysis: Analysis) -> bool:
    """Format faculté réellement applicable : faculté choisie, champs obligatoires remplis,
    langue prise en charge. Sinon, la chaîne reste au format simple (une fiche à moitié
    remplie par l'étudiant ne doit pas changer le livrable en cours de route)."""
    return (faculty_format(analysis) and not fiche_mod.missing_for_launch(analysis.fiche)
            and not fiche_mod.unsupported(analysis.fiche))


def set_fiche(db: Session, analysis: Analysis, data: dict[str, Any], *,
              student: bool = False) -> Analysis:
    """Mise à jour partielle de la fiche (une valeur vide efface le champ). L'étudiant ne
    remplit que ses champs, et seulement avant les calculs."""
    if analysis.status in (AnalysisStatus.PLANNING, AnalysisStatus.COMPUTING):
        raise AnalysisError("Traitement en cours : la fiche se modifie après.")
    if analysis.status == AnalysisStatus.DELIVERED or (
            student and analysis.status == AnalysisStatus.REVIEW):
        raise AnalysisError("L'analyse est déjà rédigée : écrivez-nous pour toute modification.")
    try:
        clean = fiche_mod.validate(data, student=student)
    except fiche_mod.FicheError as exc:
        raise AnalysisError("Fiche invalide : " + " ; ".join(exc.problems[:6])) from exc
    if student:
        locked = fiche_mod.validated_by_team(analysis.fiche, data)
        if locked:
            raise AnalysisError("Déjà validé avec l'équipe : " + ", ".join(locked)
                                + ". Écrivez-nous pour le modifier.")
    analysis.fiche = fiche_mod.merge(analysis.fiche, {k: clean.get(k) for k in data})
    analysis.updated_at = utcnow_iso()
    db.commit()
    _event(db, analysis, "info", "Fiche de mission complétée par l'étudiant." if student
           else "Fiche de mission mise à jour.")
    return analysis


def launch(db: Session, analysis: Analysis) -> str:
    """« Tout lancer » : plan, puis calculs et rédaction sans attendre de validation, sauf
    question à trancher. Vérifie d'abord que la fiche permet de rédiger."""
    if not faculty_format(analysis):
        raise AnalysisError("Choisissez la faculté de la thèse avant de tout lancer : elle "
                            "décide du plan, de la charte et du rendu.")
    missing = fiche_mod.missing_for_launch(analysis.fiche)
    if missing:
        raise AnalysisError("Fiche de mission incomplète : " + ", ".join(missing) + ".")
    unsupported = fiche_mod.unsupported(analysis.fiche)
    if unsupported:
        raise AnalysisError("À traiter à la main : " + " ; ".join(unsupported) + ".")
    job_id = claim(db, analysis, "plan")
    analysis.auto_run = True
    db.commit()
    return job_id


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
    df, prof = _load_base(analysis, audit)
    problems = (plan_problems(plan, [str(c) for c in df.columns])
                or dry_run(df, plan, first_data_line(prof)))
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
    if blocking(analysis.checks or []):
        errors = [c["message"] for c in analysis.checks or [] if c.get("level") == "error"]
        raise AnalysisError("Contrôles bloquants à lever avant la livraison (relancer la "
                            "rédaction) : " + " ; ".join(errors[:5]))
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
                # Une étape lancée à la main n'enchaîne jamais seule (« Tout lancer » remet
                # le drapeau juste après).
                **({"auto_run": False} if step == "plan" else {}),
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


def _advance(analysis_id: str, job_id: str, values: dict[str, Any],
             event: tuple[str, str]) -> bool:
    """Passe à l'étape suivante sans rendre le verrou (enchaînement de « Tout lancer »)."""
    with SessionLocal() as db:
        n = execute_update(db, update(Analysis).where(_owned(analysis_id, job_id))
                           .values(**values, job_started_at=utcnow_iso(),
                                   updated_at=utcnow_iso()))
        db.commit()
        if n:
            a = db.get(Analysis, analysis_id)
            if a is not None:
                _event(db, a, *event)
    return n == 1


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
            values = {"recheck": check, "plan": plan.model_dump(mode="json"),
                      "plan_notes": notes}
            if analysis.auto_run and not plan.questions:
                if _advance(analysis_id, job_id,
                            {**values, "status": AnalysisStatus.COMPUTING,
                             "plan_validated_at": utcnow_iso()},
                            ("info", "Plan proposé sans question à trancher : calculs et "
                                     "rédaction enchaînés.")):
                    _compute_and_write(analysis_id, job_id)
                return
            _finish(analysis_id, job_id, {**values, "status": AnalysisStatus.PLAN_READY},
                    ("success", "Nettoyage et plan proposés : à valider par Dr Hamza."
                     + (f" Questions à trancher avant de calculer : {len(plan.questions)}."
                        if plan.questions else "")))
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
    base, flow, log = prepare(df, plan, auto_exclusions(prof), first_data_line(prof))
    return base, flow, log, run_plan(plan, included_rows(base)), prof


def run_computing(analysis_id: str, job_id: str) -> None:
    """Calculs (code) puis rédaction (IA, chiffres contrôlés). Ne lève jamais."""
    with _SLOT:
        _compute_and_write(analysis_id, job_id)


def _compute_and_write(analysis_id: str, job_id: str) -> None:
    """Corps de l'étape de calcul ; appelé avec la place (`_SLOT`) déjà prise."""
    try:
        analysis, audit = _context(analysis_id)
        with _heartbeat(analysis_id, job_id):
            base, flow, log, results, _ = compute(analysis, audit)
            context = build_context(analysis.plan or {}, flow, results, log)
            if faculty_ready(analysis):
                values = _write_faculty(analysis, audit, base, flow, results, context)
            else:
                text, notes = run_write_llm(context)
                values = {"text": text.model_dump() if text else None, "draft": None,
                          "checks": [],
                          "error": None if text else "Rédaction IA non produite : "
                          + "; ".join(notes)[:400]}
        written = bool(values.get("draft") or values.get("text"))
        _finish(analysis_id, job_id,
                {"status": AnalysisStatus.REVIEW, "flow": flow, "derived_log": log,
                 "results": results, **values},
                ("success" if written else "warn",
                 "Résultats calculés et rédigés : à relire." if written else
                 "Résultats calculés ; rédaction IA non produite (tableaux seuls)."))
    except Exception as exc:
        logger.exception("Échec des calculs de l'analyse %s", analysis_id)
        _fail(analysis_id, job_id, exc)


def _write_faculty(analysis: Analysis, audit: Audit, base: pd.DataFrame,
                   flow: list[dict[str, Any]], results: list[dict[str, Any]],
                   context: dict[str, Any]) -> dict[str, Any]:
    """Rédaction au format de la faculté, puis mise en page d'essai et contrôles."""
    plan = analysis.plan or {}
    figures = figure_candidates(plan, results, included_rows(base))
    draft, notes = run_results_writer(context, analysis.fiche, figures, results,
                                      analysis.instructions or "")
    if draft is None:
        return {"draft": None, "checks": [],
                "error": "Rédaction IA non produite : " + "; ".join(notes)[:400]}
    checks = faculty_checks(analysis.fiche, plan, flow, results, included_rows(base), draft)
    return {"draft": draft.model_dump(mode="json"),
            "checks": [c.model_dump() for c in checks], "error": None}


def faculty_checks(fiche: dict[str, Any] | None, plan: dict[str, Any],
                   flow: list[dict[str, Any]], results: list[dict[str, Any]],
                   base: pd.DataFrame, draft: ResultsDraft) -> list[Check]:
    """Met en page les deux Word et contrôle leur texte (§ 14 de Hamza)."""
    lang = fiche_mod.language(fiche)
    with tempfile.TemporaryDirectory() as tmp:
        try:
            methods, results_doc, charte = build_docs(plan, flow, results, base, draft, fiche,
                                                      Path(tmp))
            files = render_both(methods, results_doc, charte)
        except (RenderError, ValueError, KeyError) as exc:
            return [Check(level="error", message=f"mise en page impossible : {exc}")]
    paragraphs = [t for f in files for t in plain_text(f)]
    return check_text(paragraphs, lang)


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
FACULTY_DELIVERABLES = ("analyse_statistique.docx", "resultats.docx", "resultats.xlsx")
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def deliverables(analysis: Analysis) -> list[str]:
    """Les fichiers de l'analyse : au format de la faculté s'il y a un brouillon."""
    if faculty_ready(analysis) and analysis.draft:
        return list(FACULTY_DELIVERABLES)
    return sorted(DELIVERABLES)


def download_name(analysis: Analysis, kind: str) -> str:
    """Noms des livrables de Hamza (« Resultats_These_Hemothorax.docx »)."""
    if not (faculty_ready(analysis) and analysis.draft):
        return kind
    subject = subject_slug(analysis.fiche)
    return {"analyse_statistique.docx": f"Analyse_statistique_These_{subject}.docx",
            "resultats.docx": f"Resultats_These_{subject}.docx",
            "resultats.xlsx": f"Classeur_resultats_These_{subject}.xlsx"}.get(kind, kind)


def build_deliverable(analysis: Analysis, audit: Audit, kind: str) -> tuple[bytes, str]:
    if not analysis.results:
        raise AnalysisError("Aucun résultat calculé.")
    if kind not in deliverables(analysis):
        raise AnalysisError("Livrable inconnu.")
    # Tableaux et chiffres : ceux calculés et relus (`analysis.results`), jamais recalculés
    # au téléchargement (une mise à jour du moteur ne doit pas changer un livrable relu).
    # Seule la base d'analyse (figures, onglet de l'Excel) est reconstruite.
    if kind.endswith(".docx") and faculty_ready(analysis) and analysis.draft:
        base, _, _, _, _ = compute(analysis, audit)
        draft = ResultsDraft.model_validate(analysis.draft)
        with tempfile.TemporaryDirectory() as tmp:
            methods, results_doc, charte = build_docs(analysis.plan or {}, analysis.flow or [],
                                                      analysis.results, included_rows(base),
                                                      draft, analysis.fiche, Path(tmp))
            stats_docx, results_docx = render_both(methods, results_doc, charte)
        return (stats_docx if kind == "analyse_statistique.docx" else results_docx), DOCX
    if kind == "resultats.docx":
        return (build_results_docx(analysis.plan or {}, analysis.flow or [], analysis.results,
                                   analysis.text), DOCX)
    base, flow, log, _, prof = compute(analysis, audit)
    pii = {p.get("column") for p in prof.get("pii_candidates") or []}
    return (build_results_xlsx(base, pii, analysis.flow or flow, analysis.results,
                               analysis.derived_log or log, analysis.plan or {},
                               analysis.text), XLSX)


def _event(db: Session, analysis: Analysis, level: str, message: str) -> None:
    analysis.events = [*(analysis.events or []),
                       {"ts": utcnow_iso(), "level": level, "message": message}]
    db.commit()
