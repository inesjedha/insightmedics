"""Rétention des données : purge des audits expirés (engagement de la page confidentialité).

Un audit expire `FILE_RETENTION_DAYS` jours après l'aperçu, ou après la livraison de
l'audit complet (le lien client devient alors invalide). La purge supprime les fichiers
(base source, protocole) et efface en base tout ce qui peut contenir des données de
patients (profiling avec identifiants de lignes, audit IA). On conserve le résumé non
identifiant (nom de fichier, score, compteurs) pour le suivi commercial.

Idempotente : peut tourner plusieurs fois, sur plusieurs serveurs, sans effet de bord.
"""

from __future__ import annotations

import logging
import shutil
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path

from sqlalchemy import update
from sqlalchemy.orm import Session

from ..config import settings
from ..db import execute_update
from ..models import Audit, AuditStatus, utcnow_iso

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PurgeReport:
    audits: int          # audits expirés purgés
    orphan_dirs: int     # dossiers de stockage sans audit en base (uploads rejetés anciens)


def _parse(iso: str) -> datetime | None:
    try:
        moment = datetime.fromisoformat(iso)
    except ValueError:
        return None
    return moment if moment.tzinfo else moment.replace(tzinfo=UTC)


def _delete_audit_files(audit: Audit) -> None:
    """Supprime le dossier de l'audit (là où il a été stocké, même si STORAGE_DIR a changé)."""
    folder = Path(audit.stored_path).parent
    if folder.name == audit.id:  # garde-fou : ne jamais supprimer un dossier inattendu
        shutil.rmtree(folder, ignore_errors=True)


def purge_expired(db: Session, now: datetime | None = None) -> PurgeReport:
    now = now or datetime.now(UTC)
    candidates = (db.query(Audit)
                  .filter(Audit.purged_at.is_(None), Audit.expires_at.is_not(None),
                          Audit.status != AuditStatus.PROCESSING)
                  .all())
    purged = 0
    for audit in candidates:
        expires = _parse(audit.expires_at or "")
        if expires is None or expires > now:
            continue
        # Écriture conditionnelle et atomique : si un déblocage a démarré (ou prolongé
        # l'expiration) entre la lecture et maintenant, on ne touche à rien.
        marked = execute_update(db, (
            update(Audit)
            .where(Audit.id == audit.id, Audit.purged_at.is_(None),
                   Audit.status != AuditStatus.PROCESSING,
                   Audit.expires_at == audit.expires_at)
            .values(profiling=None, ai_audit=None, purged_at=utcnow_iso())))
        db.commit()
        if marked:
            _delete_audit_files(audit)
            purged += 1

    known_ids = {a for (a,) in db.query(Audit.id).all()}
    cutoff = (now - timedelta(days=settings.file_retention_days)).timestamp()
    orphans = 0
    if settings.storage_dir.exists():
        for path in settings.storage_dir.iterdir():
            if path.is_dir() and path.name not in known_ids and path.stat().st_mtime < cutoff:
                shutil.rmtree(path, ignore_errors=True)
                orphans += 1

    if purged or orphans:
        logger.info("Purge : %d audit(s) expiré(s), %d dossier(s) orphelin(s)", purged, orphans)
    return PurgeReport(purged, orphans)
