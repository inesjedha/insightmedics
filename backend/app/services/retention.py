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

from sqlalchemy.orm import Session

from ..config import settings
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
        shutil.rmtree(settings.storage_dir / audit.id, ignore_errors=True)
        audit.profiling = None
        audit.ai_audit = None
        audit.purged_at = utcnow_iso()
        purged += 1
    db.commit()

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
