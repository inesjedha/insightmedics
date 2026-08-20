"""Endpoints /audit — contrat de src/lib/api/client.ts.

POST /audit/upload est synchrone : rapide sans audit IA, mais potentiellement plusieurs
minutes lorsque l'IA (LLM-1/LLM-2) est active. Passage en traitement asynchrone
(file d'attente + polling) prévu comme amélioration.
"""

import logging
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..config import settings
from ..db import get_db
from ..models import Audit, utcnow_iso
from ..pipeline.ingest import IngestError
from ..pipeline.runner import run_audit, run_preview
from ..schemas import AuditEvent, AuditResult

logger = logging.getLogger(__name__)

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
        status=a.status, is_preview=a.status != "done",
        paid=bool(a.paid), token=a.token,
    )


@router.post("/upload", response_model=AuditResult, response_model_by_alias=True)
def upload_and_audit(file: UploadFile, protocol: UploadFile | None = None,
                     db: Session = Depends(get_db)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(415, f"Format non supporté : {ext or 'inconnu'}. "
                                 "Formats acceptés : .sav, .xlsx, .xls, .csv")

    audit_id = f"audit_{secrets.token_hex(8)}"
    token = secrets.token_urlsafe(32)  # lien privé (256 bits, non devinable)
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

    # Protocole optionnel : sauvegardé pour l'audit complet (déblocage payant), et validé
    # dès maintenant pour signaler tôt un fichier illisible.
    if protocol and protocol.filename:
        from ..pipeline.docs_extract import extract_text

        pdest = dest_dir / f"protocol{Path(protocol.filename).suffix.lower()}"
        with open(pdest, "wb") as out:
            out.write(protocol.file.read())
        try:
            extract_text(pdest)
        except ValueError as exc:
            raise HTTPException(415, str(exc)) from exc

    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=settings.file_retention_days)
    ).isoformat()
    audit = Audit(id=audit_id, file_name=file.filename or dest.name, file_size=size,
                  stored_path=str(dest), started_at=utcnow_iso(), token=token,
                  status="preview", paid=False, expires_at=expires_at)
    db.add(audit)
    db.commit()

    # Aperçu gratuit : 100 % déterministe, aucun appel IA (l'IA ne tourne qu'après paiement).
    try:
        r = run_preview(dest, file.filename or dest.name)
    except IngestError as exc:
        audit.status, audit.error, audit.finished_at = "failed", str(exc), utcnow_iso()
        db.commit()
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        logger.exception("Échec de l'aperçu %s", audit_id)
        audit.status, audit.error, audit.finished_at = "failed", str(exc), utcnow_iso()
        db.commit()
        # On ne divulgue pas le détail interne au client ; il est tracé côté serveur.
        raise HTTPException(500, "Erreur interne pendant l'aperçu") from exc

    audit.status = "preview"
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
    audit.ai_audit = r["ai_audit"]  # None en aperçu ; renseigné après l'audit complet
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


@router.get("/{audit_id}/profiling", dependencies=[Depends(require_admin)])
def get_profiling(audit_id: str, db: Session = Depends(get_db)):
    """Profiling complet (admin uniquement : peut contenir des valeurs identifiantes)."""
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


@router.get("/{audit_id}/assessment")
def get_assessment(audit_id: str, db: Session = Depends(get_db)):
    """Jugement IA (findings, verdict, synthèse) extrait de l'audit IA."""
    a = db.get(Audit, audit_id)
    assessment = (a.ai_audit or {}).get("assessment") if a else None
    if not assessment:
        raise HTTPException(404, "Jugement IA indisponible pour cet audit")
    return assessment


@router.get("/{audit_id}/report.pdf")
def get_report(audit_id: str):
    # Le rapport est disponible au format Word (/report.docx) ; l'export PDF n'est pas
    # encore implémenté.
    raise HTTPException(501, "Export PDF non disponible — utiliser /report.docx")


# ---------------------------------------------------------------- livrables M6/M8

def _load_or_404(audit_id: str, db: Session) -> Audit:
    a = db.get(Audit, audit_id)
    if not a or not a.profiling or not a.score_detail:
        raise HTTPException(404, "Audit introuvable ou incomplet")
    return a


def _run_cleaning(a: Audit) -> dict | None:
    """Rejoue le nettoyage déterministe (M8) à partir du fichier source persisté."""
    if not a.stored_path or not Path(a.stored_path).exists():
        return None
    from ..pipeline.cleaning import clean
    from ..pipeline.ingest import ingest

    assert a.profiling is not None  # garanti par _load_or_404
    df, _ = ingest(a.stored_path, a.file_name)
    # opérations non-auto_safe validées par le client : à brancher sur l'UI ; ici aucune.
    return clean(df, a.profiling, a.ai_audit, approved_op_ids=set())


def _attach(data: bytes, filename: str, media: str):
    from fastapi import Response
    return Response(content=data, media_type=media,
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/{audit_id}/workbook.xlsx")
def get_workbook(audit_id: str, db: Session = Depends(get_db)):
    """Classeur d'audit Excel (10 onglets) — inclut Base analyse et Source anonymisée."""
    a = _load_or_404(audit_id, db)
    assert a.profiling is not None and a.score_detail is not None  # garanti par _load_or_404
    from ..pipeline.report_xlsx import build_workbook

    data = build_workbook(a.profiling, a.score_detail, a.ai_audit, cleaning=_run_cleaning(a))
    return _attach(data, f"{audit_id}_classeur_audit.xlsx",
                   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@router.get("/{audit_id}/report.docx")
def get_report_docx(audit_id: str, db: Session = Depends(get_db)):
    """Rapport d'audit Word (11 sections) au format du livrable de Hamza."""
    a = _load_or_404(audit_id, db)
    assert a.profiling is not None and a.score_detail is not None  # garanti par _load_or_404
    from ..pipeline.report_docx import build_report

    data = build_report(a.profiling, a.score_detail, a.ai_audit)
    return _attach(data, f"{audit_id}_rapport_audit.docx",
                   "application/vnd.openxmlformats-officedocument.wordprocessingml.document")


@router.get("/{audit_id}/base_analyse.csv")
def get_base_csv(audit_id: str, db: Session = Depends(get_db)):
    """Base nettoyée et anonymisée (CSV). Original inchangé."""
    a = _load_or_404(audit_id, db)
    res = _run_cleaning(a)
    if not res:
        raise HTTPException(404, "Fichier source indisponible pour le nettoyage")
    from ..pipeline.cleaning import to_csv_bytes

    return _attach(to_csv_bytes(res["base_analyse"]),
                   f"{audit_id}_base_analyse.csv", "text/csv")


@router.get("/{audit_id}/base_analyse.sav")
def get_base_sav(audit_id: str, db: Session = Depends(get_db)):
    """Base nettoyée et anonymisée (SPSS .sav)."""
    a = _load_or_404(audit_id, db)
    res = _run_cleaning(a)
    if not res:
        raise HTTPException(404, "Fichier source indisponible pour le nettoyage")
    from ..pipeline.cleaning import to_sav_bytes

    return _attach(to_sav_bytes(res["base_analyse"]),
                   f"{audit_id}_base_analyse.sav", "application/octet-stream")


# ---------------------------------------------------------------- admin (déblocage)

def _protocol_text_for(a: Audit) -> str | None:
    """Ré-extrait le texte du protocole depuis le fichier stocké, s'il existe."""
    if not a.stored_path:
        return None
    from ..pipeline.docs_extract import extract_text

    for p in Path(a.stored_path).parent.glob("protocol.*"):
        try:
            return extract_text(p)
        except ValueError:
            return None
    return None


@router.get("", response_model=list[AuditResult], response_model_by_alias=True,
            dependencies=[Depends(require_admin)])
def list_audits(db: Session = Depends(get_db)):
    """Liste des audits (admin), du plus récent au plus ancien."""
    rows = db.query(Audit).order_by(Audit.started_at.desc()).all()
    return [_to_result(a) for a in rows]


@router.post("/{audit_id}/unlock", response_model=AuditResult, response_model_by_alias=True,
             dependencies=[Depends(require_admin)])
def unlock_audit(audit_id: str, db: Session = Depends(get_db)):
    """Débloque un audit après paiement (admin) : lance l'audit IA complet + livrables."""
    a = db.get(Audit, audit_id)
    if not a:
        raise HTTPException(404, "Audit introuvable")
    if a.status == "done" and a.paid:
        return _to_result(a)  # déjà débloqué : idempotent
    if not a.stored_path or not Path(a.stored_path).exists():
        raise HTTPException(410, "Fichier source expiré ou introuvable")

    a.status = "processing"
    db.commit()
    try:
        r = run_audit(a.stored_path, a.file_name, _protocol_text_for(a))
    except Exception as exc:
        logger.exception("Échec du déblocage %s", audit_id)
        a.status, a.error, a.finished_at = "failed", str(exc), utcnow_iso()
        db.commit()
        raise HTTPException(500, "Erreur interne pendant l'audit complet") from exc

    a.status = "done"
    a.paid = True
    # Le lien privé du client devient valide maintenant et expire dans N jours.
    a.expires_at = (
        datetime.now(timezone.utc) + timedelta(days=settings.file_retention_days)
    ).isoformat()
    a.started_at = r["started_at"]
    a.finished_at = r["finished_at"]
    a.score = r["score"]
    a.row_count = r["row_count"]
    a.column_count = r["column_count"]
    a.missing_pct = r["missing_pct"]
    a.duplicates_pct = r["duplicates_pct"]
    a.issues = r["issues"]
    a.needs_human_review = _needs_human_review(
        r["score"], r["missing_pct"], r["duplicates_pct"], r["critical_issues"])
    a.profiling = r["profiling"]
    a.score_detail = r["score_detail"]
    a.ai_audit = r["ai_audit"]
    a.events = r["events"]
    db.commit()
    db.refresh(a)
    return _to_result(a)


# ---------------------------------------------------------------- accès client (lien privé)
#
# Endpoints publics protégés par le TOKEN (256 bits) et non par la clé admin :
# le client ouvre son lien /r/<token> sans compte. Accès accordé uniquement si
# l'audit est payé, terminé et non expiré. Toute autre situation renvoie une
# erreur générique pour ne pas révéler l'existence d'un audit.

client_router = APIRouter(prefix="/r", tags=["client"])


def _load_paid_by_token(token: str, db: Session) -> Audit:
    a = db.query(Audit).filter(Audit.token == token).first()
    if not a or not a.paid or a.status != "done":
        raise HTTPException(404, "Lien invalide ou audit indisponible")
    if a.expires_at:
        try:
            exp = datetime.fromisoformat(a.expires_at)
        except ValueError:
            exp = None
        if exp is not None:
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > exp:
                raise HTTPException(410, "Ce lien a expiré")
    return a


@client_router.get("/{token}", response_model=AuditResult, response_model_by_alias=True)
def client_result(token: str, db: Session = Depends(get_db)):
    """Résumé de l'audit complet pour le client (score, observations, méta)."""
    return _to_result(_load_paid_by_token(token, db))


@client_router.get("/{token}/score")
def client_score(token: str, db: Session = Depends(get_db)):
    """Décomposition du score par domaine."""
    a = _load_paid_by_token(token, db)
    if not a.score_detail:
        raise HTTPException(404, "Détail du score indisponible")
    return a.score_detail


@client_router.get("/{token}/assessment")
def client_assessment(token: str, db: Session = Depends(get_db)):
    """Jugement IA (anomalies, verdict, synthèse) pour le client."""
    a = _load_paid_by_token(token, db)
    assessment = (a.ai_audit or {}).get("assessment")
    if not assessment:
        raise HTTPException(404, "Jugement IA indisponible")
    return assessment


@client_router.get("/{token}/workbook.xlsx")
def client_workbook(token: str, db: Session = Depends(get_db)):
    """Classeur d'audit Excel (anonymisé)."""
    a = _load_paid_by_token(token, db)
    if not a.profiling or not a.score_detail:
        raise HTTPException(404, "Livrable indisponible")
    from ..pipeline.report_xlsx import build_workbook

    data = build_workbook(a.profiling, a.score_detail, a.ai_audit, cleaning=_run_cleaning(a))
    return _attach(data, f"{a.id}_classeur_audit.xlsx",
                   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@client_router.get("/{token}/report.docx")
def client_report(token: str, db: Session = Depends(get_db)):
    """Rapport d'audit Word (anonymisé)."""
    a = _load_paid_by_token(token, db)
    if not a.profiling or not a.score_detail:
        raise HTTPException(404, "Livrable indisponible")
    from ..pipeline.report_docx import build_report

    data = build_report(a.profiling, a.score_detail, a.ai_audit)
    return _attach(data, f"{a.id}_rapport_audit.docx",
                   "application/vnd.openxmlformats-officedocument.wordprocessingml.document")


@client_router.get("/{token}/base_analyse.csv")
def client_base_csv(token: str, db: Session = Depends(get_db)):
    """Base nettoyée et anonymisée (CSV)."""
    a = _load_paid_by_token(token, db)
    res = _run_cleaning(a)
    if not res:
        raise HTTPException(404, "Fichier source indisponible")
    from ..pipeline.cleaning import to_csv_bytes

    return _attach(to_csv_bytes(res["base_analyse"]), f"{a.id}_base_analyse.csv", "text/csv")


@client_router.get("/{token}/base_analyse.sav")
def client_base_sav(token: str, db: Session = Depends(get_db)):
    """Base nettoyée et anonymisée (SPSS .sav)."""
    a = _load_paid_by_token(token, db)
    res = _run_cleaning(a)
    if not res:
        raise HTTPException(404, "Fichier source indisponible")
    from ..pipeline.cleaning import to_sav_bytes

    return _attach(to_sav_bytes(res["base_analyse"]), f"{a.id}_base_analyse.sav",
                   "application/octet-stream")
