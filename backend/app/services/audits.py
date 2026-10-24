"""Logique métier des audits, indépendante de HTTP.

Les routers (`app/routers/`) traduisent les requêtes HTTP en appels à ce module et les
exceptions ci-dessous en codes d'erreur. Ici : stockage des fichiers, cycle de vie d'un
audit (aperçu → déblocage), accès par lien privé et fabrication des livrables.
"""

from __future__ import annotations

import logging
import secrets
import shutil
import threading
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from pathlib import Path
from typing import Any, BinaryIO

from sqlalchemy.orm import Session

from ..config import settings
from ..db import SessionLocal
from ..models import Audit, AuditStatus, utcnow_iso
from ..pipeline.cleaning import clean, to_csv_bytes, to_sav_bytes
from ..pipeline.docs_extract import extract_text
from ..pipeline.ingest import IngestError, ingest
from ..pipeline.report_docx import build_report
from ..pipeline.report_xlsx import build_workbook
from ..pipeline.runner import run_audit, run_preview

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 50 * 1024 * 1024
ALLOWED_DATA_EXTENSIONS = (".sav", ".xlsx", ".xls", ".csv")

# Seuils qui déclenchent l'alerte « relecture par un expert humain ».
REVIEW_MIN_SCORE = 70
REVIEW_MAX_MISSING_PCT = 25
REVIEW_MAX_DUPLICATES_PCT = 5


# ---------------------------------------------------------------- erreurs métier

class AuditError(Exception):
    """Base des erreurs métier ; le message est destiné à l'utilisateur."""


class UnsupportedFormatError(AuditError):
    pass


class FileTooLargeError(AuditError):
    pass


class SourceFileMissingError(AuditError):
    """Le fichier source a expiré ou a disparu du stockage."""


class DeliverableUnavailableError(AuditError):
    pass


class LinkNotFoundError(AuditError):
    """Lien privé inconnu, ou audit pas encore payé/terminé (indiscernables exprès)."""


class LinkExpiredError(AuditError):
    pass


# ---------------------------------------------------------------- stockage

def _audit_dir(audit_id: str) -> Path:
    return settings.storage_dir / audit_id


def data_path(audit_id: str, ext: str) -> Path:
    """Emplacement du fichier source téléversé (jamais modifié ensuite)."""
    return _audit_dir(audit_id) / f"original{ext}"


def _link_expiry() -> str:
    return (datetime.now(UTC) + timedelta(days=settings.file_retention_days)).isoformat()


def check_data_extension(file_name: str) -> str:
    """Retourne l'extension (minuscule) si elle est acceptée, sinon lève une erreur."""
    ext = Path(file_name).suffix.lower()
    if ext not in ALLOWED_DATA_EXTENSIONS:
        raise UnsupportedFormatError(
            f"Format non supporté : {ext or 'inconnu'}. "
            f"Formats acceptés : {', '.join(ALLOWED_DATA_EXTENSIONS)}")
    return ext


def save_stream(src: BinaryIO, dest: Path, max_bytes: int | None = None) -> int:
    """Copie `src` dans `dest` par blocs de 1 Mo ; retourne la taille écrite."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    size = 0
    with open(dest, "wb") as out:
        while chunk := src.read(1 << 20):
            size += len(chunk)
            if max_bytes is not None and size > max_bytes:
                break
            out.write(chunk)
    if max_bytes is not None and size > max_bytes:
        dest.unlink()  # on ne garde pas de fichier partiel sur le disque
        raise FileTooLargeError(f"Fichier trop volumineux (max {max_bytes // (1024 * 1024)} MB)")
    return size


def save_protocol(audit_id: str, src: BinaryIO, file_name: str) -> Path:
    """Enregistre le protocole et vérifie tout de suite qu'il est lisible."""
    dest = _audit_dir(audit_id) / f"protocol{Path(file_name).suffix.lower()}"
    save_stream(src, dest)
    try:
        extract_text(dest)
    except ValueError as exc:
        raise UnsupportedFormatError(str(exc)) from exc
    return dest


def _protocol_text(audit: Audit) -> str | None:
    """Ré-extrait le texte du protocole stocké à côté du fichier source, s'il existe."""
    for path in Path(audit.stored_path).parent.glob("protocol.*"):
        try:
            return extract_text(path)
        except ValueError:
            return None
    return None


# ---------------------------------------------------------------- cycle de vie

def needs_human_review(score: float, missing_pct: float, duplicates_pct: float,
                       critical_issues: int) -> bool:
    return (score < REVIEW_MIN_SCORE
            or missing_pct > REVIEW_MAX_MISSING_PCT
            or duplicates_pct > REVIEW_MAX_DUPLICATES_PCT
            or critical_issues > 0)


_RESULT_FIELDS = ("started_at", "finished_at", "score", "row_count", "column_count",
                  "missing_pct", "duplicates_pct", "issues", "profiling", "score_detail",
                  "ai_audit", "events")


def _apply_result(audit: Audit, result: dict[str, Any]) -> None:
    """Recopie le résultat du pipeline (`runner`) sur l'audit."""
    for field in _RESULT_FIELDS:
        setattr(audit, field, result[field])
    audit.needs_human_review = needs_human_review(
        result["score"], result["missing_pct"], result["duplicates_pct"],
        result["critical_issues"])


def _mark_failed(db: Session, audit: Audit, exc: Exception) -> None:
    audit.status, audit.error, audit.finished_at = AuditStatus.FAILED, str(exc), utcnow_iso()
    db.commit()


def discard_upload(audit_id: str) -> None:
    """Supprime les fichiers d'un upload rejeté avant la création de l'audit."""
    shutil.rmtree(_audit_dir(audit_id), ignore_errors=True)


def new_audit_id() -> str:
    return f"audit_{secrets.token_hex(8)}"


def create_preview(db: Session, audit_id: str, data_path: Path, file_name: str,
                   file_size: int) -> Audit:
    """Enregistre l'audit et calcule l'aperçu gratuit (100 % déterministe, sans IA).

    Lève `IngestError` si le fichier est illisible ; l'audit est alors marqué `failed`.
    """
    audit = Audit(id=audit_id, file_name=file_name, file_size=file_size,
                  stored_path=str(data_path), started_at=utcnow_iso(),
                  token=secrets.token_urlsafe(32),  # lien privé : 256 bits, non devinable
                  status=AuditStatus.PREVIEW, paid=False, expires_at=_link_expiry())
    db.add(audit)
    db.commit()
    try:
        result = run_preview(data_path, file_name)
    except IngestError as exc:  # fichier illisible : erreur de l'utilisateur, pas un bug
        _mark_failed(db, audit, exc)
        raise
    except Exception as exc:
        logger.exception("Échec de l'aperçu %s", audit_id)
        _mark_failed(db, audit, exc)
        raise
    _apply_result(audit, result)
    db.commit()
    db.refresh(audit)
    return audit


def start_unlock(db: Session, audit: Audit) -> bool:
    """Après paiement : passe l'audit en `processing`. Retourne True si l'audit IA doit
    être lancé (par `complete_unlock`, en tâche de fond), False s'il est déjà terminé ou
    déjà en cours — un double clic ne déclenche donc jamais deux audits IA payants.
    """
    if audit.status in (AuditStatus.DONE, AuditStatus.PROCESSING):
        return False
    if audit.purged_at or not Path(audit.stored_path).exists():
        raise SourceFileMissingError("Fichier source expiré ou introuvable")
    audit.status = AuditStatus.PROCESSING
    audit.error = None
    db.commit()
    return True


# Un seul audit IA à la fois : coût et quotas de l'API restent prévisibles, et la mémoire
# du serveur n'est pas saturée par plusieurs grosses bases en parallèle.
_AI_AUDIT_SLOT = threading.Semaphore(1)


def complete_unlock(audit_id: str) -> None:
    """Tâche de fond : exécute l'audit IA complet et ouvre le lien privé du client.

    Ouvre sa propre session (celle de la requête HTTP est déjà fermée). Ne lève jamais :
    un échec est enregistré sur l'audit (`failed` + message), visible dans l'admin, et
    le déblocage peut être relancé.
    """
    with _AI_AUDIT_SLOT, SessionLocal() as db:
        audit = db.get(Audit, audit_id)
        if audit is None or audit.status != AuditStatus.PROCESSING:
            return
        try:
            result = run_audit(audit.stored_path, audit.file_name, _protocol_text(audit))
        except Exception as exc:
            logger.exception("Échec de l'audit complet %s", audit_id)
            _mark_failed(db, audit, exc)
            return
        _finish_unlock(db, audit, result)


def _finish_unlock(db: Session, audit: Audit, result: dict[str, Any]) -> None:
    _apply_result(audit, result)
    audit.status = AuditStatus.DONE
    audit.paid = True
    audit.expires_at = _link_expiry()  # le lien client expire N jours après le déblocage
    db.commit()


def recover_interrupted(db: Session) -> int:
    """Au démarrage : un audit resté `processing` a été interrompu (redémarrage ou
    déploiement pendant l'audit IA). On le remet en aperçu pour qu'il soit relancé."""
    stuck = db.query(Audit).filter(Audit.status == AuditStatus.PROCESSING).all()
    for audit in stuck:
        audit.status = AuditStatus.PREVIEW
        audit.error = "Audit IA interrompu par un redémarrage du serveur : relancer le déblocage."
        logger.warning("Audit %s interrompu, remis en aperçu", audit.id)
    db.commit()
    return len(stuck)


def find_paid_by_token(db: Session, token: str) -> Audit:
    """Audit accessible par lien privé : payé, terminé et non expiré."""
    audit = db.query(Audit).filter(Audit.token == token).first()
    if not audit or not audit.paid or audit.status != AuditStatus.DONE:
        raise LinkNotFoundError("Lien invalide ou audit indisponible")
    if audit.expires_at and _is_past(audit.expires_at):
        raise LinkExpiredError("Ce lien a expiré")
    return audit


def _is_past(iso: str) -> bool:
    try:
        moment = datetime.fromisoformat(iso)
    except ValueError:
        return False
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=UTC)
    return datetime.now(UTC) > moment


# ---------------------------------------------------------------- livrables

class DeliverableKind(StrEnum):
    """Livrables téléchargeables ; la valeur est le suffixe d'URL."""

    WORKBOOK = "workbook.xlsx"
    REPORT = "report.docx"
    BASE_CSV = "base_analyse.csv"
    BASE_SAV = "base_analyse.sav"


@dataclass(frozen=True)
class Deliverable:
    content: bytes
    filename: str
    media_type: str


# Pour chaque livrable : (suffixe du nom de fichier téléchargé, type MIME).
_DELIVERABLE_FILES: dict[DeliverableKind, tuple[str, str]] = {
    DeliverableKind.WORKBOOK: (
        "classeur_audit.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    DeliverableKind.REPORT: (
        "rapport_audit.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    DeliverableKind.BASE_CSV: ("base_analyse.csv", "text/csv"),
    DeliverableKind.BASE_SAV: ("base_analyse.sav", "application/octet-stream"),
}


def _cleaning(audit: Audit) -> dict[str, Any] | None:
    """Rejoue le nettoyage déterministe à partir du fichier source persisté."""
    if not Path(audit.stored_path).exists():
        return None
    df, _ = ingest(audit.stored_path, audit.file_name)
    # Opérations non auto_safe validées par le client : pas encore d'UI, donc aucune.
    return clean(df, audit.profiling or {}, audit.ai_audit, approved_op_ids=set())


def _deliverable_content(audit: Audit, kind: DeliverableKind) -> bytes:
    assert audit.profiling is not None and audit.score_detail is not None
    if kind is DeliverableKind.REPORT:
        return build_report(audit.profiling, audit.score_detail, audit.ai_audit)
    cleaning = _cleaning(audit)
    if kind is DeliverableKind.WORKBOOK:  # sans fichier source : classeur sans les bases
        return build_workbook(audit.profiling, audit.score_detail, audit.ai_audit,
                              cleaning=cleaning)
    if cleaning is None:
        raise DeliverableUnavailableError("Fichier source indisponible pour le nettoyage")
    if kind is DeliverableKind.BASE_CSV:
        return to_csv_bytes(cleaning["base_analyse"])
    return to_sav_bytes(cleaning["base_analyse"])


def build_deliverable(audit: Audit, kind: DeliverableKind) -> Deliverable:
    """Fabrique un livrable à la volée. Lève `DeliverableUnavailableError` si impossible."""
    if not audit.profiling or not audit.score_detail:
        raise DeliverableUnavailableError("Audit introuvable ou incomplet")
    suffix, media_type = _DELIVERABLE_FILES[kind]
    return Deliverable(_deliverable_content(audit, kind), f"{audit.id}_{suffix}", media_type)
