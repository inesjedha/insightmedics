"""Endpoints /audit — contrat de src/lib/api/client.ts.

POST /audit/upload est synchrone (M1+M2 : quelques secondes). À passer en
asynchrone quand les appels IA (M4/M5) allongeront le traitement.
"""

import secrets
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import Audit, utcnow_iso
from ..pipeline.ingest import IngestError
from ..pipeline.runner import run_audit
from ..schemas import AuditEvent, AuditResult

router = APIRouter(prefix="/audit", tags=["audit"])

MAX_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXT = {".sav", ".xlsx", ".xls", ".csv"}

# Seuils identiques à src/lib/audit/thresholds.ts
THRESHOLDS = {"min_score": 70, "max_missing_pct": 25, "max_duplicates_pct": 5}


def _needs_human_review(score: float, missing: float, dups: float, critical: int) -> bool:
    return (
        score < THRESHOLDS["min_score"]
        or missing > THRESHOLDS["max_missing_pct"]
        or dups > THRESHOLDS["max_duplicates_pct"]
        or critical > 0
    )


def _to_result(a: Audit) -> AuditResult:
    return AuditResult(
        id=a.id, file_name=a.file_name, file_size=a.file_size,
        started_at=a.started_at, finished_at=a.finished_at,
        score=a.score or 0, row_count=a.row_count or 0, column_count=a.column_count or 0,
        missing_pct=a.missing_pct or 0, duplicates_pct=a.duplicates_pct or 0,
        issues=a.issues or [], needs_human_review=bool(a.needs_human_review),
    )


@router.post("/upload", response_model=AuditResult, response_model_by_alias=True)
def upload_and_audit(file: UploadFile, protocol: UploadFile | None = None,
                     db: Session = Depends(get_db)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(415, f"Format non supporté : {ext or 'inconnu'}. "
                                 "Formats acceptés : .sav, .xlsx, .xls, .csv")

    audit_id = f"audit_{secrets.token_hex(8)}"
    dest_dir = settings.storage_dir / audit_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"original{ext}"
    size = 0
    with open(dest, "wb") as out:
        while chunk := file.file.read(1 << 20):
            size += len(chunk)
            if size > MAX_SIZE:
                out.close()
                raise HTTPException(413, "Fichier trop volumineux (max 50 MB)")
            out.write(chunk)

    # Protocole optionnel : extrait en texte pour l'audit IA
    protocol_text = None
    if protocol and protocol.filename:
        from ..pipeline.docs_extract import extract_text

        pdest = dest_dir / f"protocol{Path(protocol.filename).suffix.lower()}"
        with open(pdest, "wb") as out:
            out.write(protocol.file.read())
        try:
            protocol_text = extract_text(pdest)
        except ValueError as exc:
            raise HTTPException(415, str(exc)) from exc

    audit = Audit(id=audit_id, file_name=file.filename or dest.name,
                  file_size=size, stored_path=str(dest), started_at=utcnow_iso())
    db.add(audit)
    db.commit()

    try:
        r = run_audit(dest, file.filename or dest.name, protocol_text)
    except IngestError as exc:
        audit.status, audit.error, audit.finished_at = "failed", str(exc), utcnow_iso()
        db.commit()
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        audit.status, audit.error, audit.finished_at = "failed", str(exc), utcnow_iso()
        db.commit()
        shutil.rmtree(dest_dir, ignore_errors=True)
        raise HTTPException(500, "Erreur interne pendant l'audit") from exc

    audit.status = "done"
    audit.started_at = r["started_at"]
    audit.finished_at = r["finished_at"]
    audit.score = r["score"]
    audit.row_count = r["row_count"]
    audit.column_count = r["column_count"]
    audit.missing_pct = r["missing_pct"]
    audit.duplicates_pct = r["duplicates_pct"]
    audit.issues = r["issues"]
    audit.needs_human_review = _needs_human_review(
        r["score"], r["missing_pct"], r["duplicates_pct"], r["critical_issues"]
    )
    audit.profiling = r["profiling"]
    audit.score_detail = r["score_detail"]
    audit.ai_audit = r["ai_audit"]
    audit.events = r["events"]
    db.commit()
    db.refresh(audit)
    return _to_result(audit)


@router.get("/{audit_id}", response_model=AuditResult, response_model_by_alias=True)
def get_audit(audit_id: str, db: Session = Depends(get_db)):
    a = db.get(Audit, audit_id)
    if not a or a.status == "failed":
        raise HTTPException(404, "Audit introuvable")
    return _to_result(a)


@router.get("/{audit_id}/events", response_model=list[AuditEvent],
            response_model_by_alias=True)
def get_events(audit_id: str, db: Session = Depends(get_db)):
    a = db.get(Audit, audit_id)
    if not a:
        raise HTTPException(404, "Audit introuvable")
    return a.events or []


@router.get("/{audit_id}/profiling")
def get_profiling(audit_id: str, db: Session = Depends(get_db)):
    """Profiling complet (interne/admin — pas utilisé par le front public)."""
    a = db.get(Audit, audit_id)
    if not a or not a.profiling:
        raise HTTPException(404, "Audit introuvable")
    return a.profiling


@router.get("/{audit_id}/score")
def get_score_detail(audit_id: str, db: Session = Depends(get_db)):
    """Décomposition complète du score : 8 domaines, critères, plafonds, confiance."""
    a = db.get(Audit, audit_id)
    if not a or not a.score_detail:
        raise HTTPException(404, "Audit introuvable")
    return a.score_detail


@router.get("/{audit_id}/ai")
def get_ai_audit(audit_id: str, db: Session = Depends(get_db)):
    """Audit IA : étude reconstruite, dictionnaire, règles et violations."""
    a = db.get(Audit, audit_id)
    if not a:
        raise HTTPException(404, "Audit introuvable")
    if not a.ai_audit:
        raise HTTPException(404, "Audit IA non exécuté pour cet audit "
                                 "(clé API absente au moment du traitement ?)")
    return a.ai_audit


@router.get("/{audit_id}/report.pdf")
def get_report(audit_id: str):
    raise HTTPException(501, "Rapport PDF : jalon M6 (à venir)")
