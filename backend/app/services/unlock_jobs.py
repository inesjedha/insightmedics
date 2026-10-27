"""Exécution de l'audit IA complet (payant) en tâche de fond, sans double exécution.

Le problème : un audit IA dure 5 à 10 minutes et coûte de l'argent. Il ne doit jamais
tourner deux fois, y compris pendant un déploiement Railway où l'ancienne et la nouvelle
instance du serveur tournent côte à côte quelques instants.

La solution : un verrou à bail (« lease ») stocké sur la ligne de l'audit.
1. `claim` : en UNE requête atomique, passe l'audit en `processing` et y inscrit un
   identifiant de tâche unique (`job_id`) — seulement s'il n'est pas déjà pris.
   Deux demandes simultanées, même sur deux serveurs, ne peuvent pas réussir toutes
   les deux.
2. `run` : seule la tâche qui détient ce `job_id` peut écrire le résultat (écriture
   conditionnée au `job_id`, atomique elle aussi). Une tâche dépossédée ne fait rien.
3. Battement de cœur : tant que l'audit IA tourne, le bail est renouvelé chaque minute.
   Un audit lent (API qui rame, nouvelles tentatives) garde donc son verrou.
4. `release_stale_claims` : un bail non renouvelé depuis `UNLOCK_LEASE_MINUTES`
   (serveur arrêté en plein audit) est libéré, l'audit revient en aperçu et peut être
   relancé. Appelé par la maintenance périodique du serveur.

Relance d'un audit déjà livré (`claim_rerun`, après un changement des prompts) : même
verrou, mais l'audit reste `done` pendant la relance, pour que le lien de l'étudiant
continue d'afficher l'ancien bilan. Le nouveau résultat le remplace seulement s'il est
complet ; en cas d'échec, l'ancien bilan reste en place et l'erreur est notée.
"""

from __future__ import annotations

import logging
import secrets
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import or_, update
from sqlalchemy.orm import Session

from ..config import settings
from ..db import SessionLocal, execute_update
from ..models import Audit, AuditStatus, utcnow_iso
from ..pipeline.runner import run_audit
from .audits import (
    SourceFileMissingError,
    UnlockNotAllowedError,
    link_expiry,
    protocol_text,
    result_values,
)

logger = logging.getLogger(__name__)

# Un seul audit IA à la fois par serveur : coût, quotas d'API et mémoire prévisibles.
_AI_AUDIT_SLOT = threading.Semaphore(1)
HEARTBEAT_SECONDS = 60


def claim(db: Session, audit: Audit) -> str | None:
    """Réserve l'audit pour un audit IA. Retourne le `job_id` à passer à `run`, ou None
    si l'audit est déjà terminé ou déjà en cours (aucune nouvelle exécution)."""
    if audit.status in (AuditStatus.DONE, AuditStatus.PROCESSING):
        return None
    if audit.purged_at or not Path(audit.stored_path).exists():
        raise SourceFileMissingError("Fichier source expiré ou introuvable")
    if not audit.profiling:
        raise UnlockNotAllowedError("L'aperçu de cet audit a échoué : rien à débloquer.")

    job_id = secrets.token_hex(8)
    claimed = execute_update(db, (
        update(Audit)
        .where(Audit.id == audit.id,
               Audit.status.in_([AuditStatus.PREVIEW, AuditStatus.FAILED]),
               Audit.purged_at.is_(None))
        .values(status=AuditStatus.PROCESSING, job_id=job_id,
                job_started_at=utcnow_iso(), error=None)))
    db.commit()
    db.refresh(audit)
    return job_id if claimed == 1 else None


def claim_rerun(db: Session, audit: Audit) -> str | None:
    """Réserve un audit LIVRÉ pour une nouvelle exécution de l'audit IA. Retourne le
    `job_id`, ou None si une relance est déjà en cours."""
    if audit.status != AuditStatus.DONE:
        raise UnlockNotAllowedError("Seul un audit livré peut être relancé.")
    if audit.purged_at or not Path(audit.stored_path).exists():
        raise SourceFileMissingError("Fichier source expiré ou introuvable")
    job_id = secrets.token_hex(8)
    claimed = execute_update(db, (
        update(Audit)
        .where(Audit.id == audit.id, Audit.status == AuditStatus.DONE,
               Audit.job_id.is_(None), Audit.purged_at.is_(None))
        .values(job_id=job_id, job_started_at=utcnow_iso(), error=None)))
    db.commit()
    db.refresh(audit)
    return job_id if claimed == 1 else None


def _owned(audit_id: str, job_id: str) -> Any:
    """Condition SQL : l'audit est toujours réservé par cette tâche (identifiant unique ;
    statut `processing` pour un déblocage, `done` pour une relance)."""
    return ((Audit.id == audit_id) & (Audit.job_id == job_id) & Audit.purged_at.is_(None)
            & Audit.status.in_([AuditStatus.PROCESSING, AuditStatus.DONE]))


def run(audit_id: str, job_id: str, *, rerun: bool = False) -> None:
    """Tâche de fond : exécute l'audit IA et enregistre le résultat. Ne lève jamais.

    Aucune session n'est ouverte pendant l'appel IA (plusieurs minutes) : on lit ce qu'il
    faut, on referme, puis on rouvre une session courte pour écrire le résultat.
    """
    with _AI_AUDIT_SLOT:
        try:
            # Bail renouvelé une fois le créneau obtenu (l'attente ne compte pas).
            if not _renew_lease(audit_id, job_id):
                logger.warning("Audit %s : tâche %s dépossédée, abandon", audit_id, job_id)
                return
            with SessionLocal() as db:
                audit = db.get(Audit, audit_id)
                assert audit is not None
                path, name, protocol = audit.stored_path, audit.file_name, protocol_text(audit)

            with _heartbeat(audit_id, job_id):
                result = run_audit(path, name, protocol)
            _require_ai_assessment(result)

            values: dict[str, Any] = {**result_values(result), "status": AuditStatus.DONE,
                                      "paid": True, "error": None, "job_id": None}
            if not rerun:
                # Le lien client expire N jours après la livraison (une relance ne
                # prolonge pas la conservation des données).
                values["expires_at"] = link_expiry()
            with SessionLocal() as db:
                written = execute_update(db, (
                    update(Audit).where(_owned(audit_id, job_id)).values(**values)))
                db.commit()
            if not written:
                logger.warning("Audit %s : résultat de la tâche %s ignoré (dépossédée)",
                               audit_id, job_id)
        except Exception as exc:
            logger.exception("Échec de l'audit complet %s", audit_id)
            _mark_failed(audit_id, job_id, exc, rerun=rerun)


def _require_ai_assessment(result: dict[str, Any]) -> None:
    """Un audit payé doit contenir le jugement IA. Si l'IA est configurée mais n'a rien
    produit (refus, JSON invalide après relances…), on échoue au lieu de livrer un
    audit incomplet ; le message vient du journal de l'audit. Sans clé IA (dev, tests),
    l'audit complet reste déterministe."""
    if not settings.ai_enabled:
        return
    if (result.get("ai_audit") or {}).get("assessment"):
        return
    reasons = [e["message"] for e in result.get("events", [])
               if e["level"] == "warn" and "IA" in e["message"]]
    raise RuntimeError("Audit IA incomplet : " + ("; ".join(reasons) or "aucun jugement produit"))


def _renew_lease(audit_id: str, job_id: str) -> bool:
    """Renouvelle le bail ; False si la tâche n'est plus propriétaire de l'audit."""
    with SessionLocal() as db:
        renewed = execute_update(db, (
            update(Audit).where(_owned(audit_id, job_id))
            .values(job_started_at=utcnow_iso())))
        db.commit()
    return renewed == 1


@contextmanager
def _heartbeat(audit_id: str, job_id: str) -> Iterator[None]:
    """Renouvelle le bail toutes les HEARTBEAT_SECONDS pendant le bloc (thread dédié)."""
    stop = threading.Event()

    def beat() -> None:
        while not stop.wait(HEARTBEAT_SECONDS):
            try:
                if not _renew_lease(audit_id, job_id):
                    return  # dépossédée : le résultat sera de toute façon ignoré
            except Exception:
                logger.exception("Battement de cœur en échec pour l'audit %s", audit_id)

    thread = threading.Thread(target=beat, name=f"lease-{audit_id}", daemon=True)
    thread.start()
    try:
        yield
    finally:
        stop.set()
        thread.join(timeout=5)


def _mark_failed(audit_id: str, job_id: str, exc: Exception, *, rerun: bool = False) -> None:
    """Enregistre l'échec (session neuve : l'ancienne peut être cassée). Best effort.
    Relance : l'audit reste livré avec son ancien bilan, seule l'erreur est notée."""
    values: dict[str, Any] = (
        {"error": f"Relance échouée, ancien bilan conservé : {exc}"[:500], "job_id": None}
        if rerun else
        {"status": AuditStatus.FAILED, "error": str(exc)[:500], "finished_at": utcnow_iso(),
         "job_id": None})
    try:
        with SessionLocal() as db:
            execute_update(db, (
                update(Audit).where(_owned(audit_id, job_id)).values(**values)))
            db.commit()
    except Exception:
        # Base injoignable : le bail expirera et `release_stale_claims` libérera l'audit.
        logger.exception("Impossible d'enregistrer l'échec de l'audit %s", audit_id)


def release_stale_claims(db: Session, now: datetime | None = None) -> int:
    """Libère les audits `processing` dont le bail a expiré (serveur arrêté en plein
    audit). Ils reviennent en aperçu, avec un message, et peuvent être relancés."""
    cutoff = ((now or datetime.now(UTC))
              - timedelta(minutes=settings.unlock_lease_minutes)).isoformat()
    released = execute_update(db, (
        update(Audit)
        .where(Audit.status == AuditStatus.PROCESSING,
               or_(Audit.job_started_at.is_(None), Audit.job_started_at < cutoff))
        .values(status=AuditStatus.PREVIEW, job_id=None,
                error="Audit IA interrompu (serveur arrêté pendant le traitement) : "
                      "relancer le déblocage.")))
    # Relance d'un audit livré interrompue : l'ancien bilan reste, le verrou est levé.
    released_reruns = execute_update(db, (
        update(Audit)
        .where(Audit.status == AuditStatus.DONE, Audit.job_id.is_not(None),
               or_(Audit.job_started_at.is_(None), Audit.job_started_at < cutoff))
        .values(job_id=None, error="Relance interrompue (serveur arrêté) : ancien bilan "
                                  "conservé, relancer si besoin.")))
    db.commit()
    if released:
        logger.warning("%d audit(s) interrompu(s) remis en aperçu", released)
    if released_reruns:
        logger.warning("%d relance(s) d'audit interrompue(s)", released_reruns)
    return released + released_reruns
