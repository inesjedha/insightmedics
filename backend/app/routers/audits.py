"""Endpoints /audit : upload et aperçu publics ; audit IA, livrables et déblocage réservés
à l'admin (les clients passent par leur lien privé, voir routers/client.py).

La logique métier vit dans `app/services/audits.py` ; ce module ne fait que la
traduction HTTP (validation d'entrée, codes d'erreur, sérialisation).
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..db import get_db
from ..models import Audit, AuditStatus
from ..pipeline.ingest import IngestError
from ..schemas import AuditEvent, AuditResult
from ..services import audits as service
from ..services.audits import DeliverableKind
from .downloads import deliverable_response

router = APIRouter(prefix="/audit", tags=["audit"])


def _get_or_404(db: Session, audit_id: str) -> Audit:
    audit = db.get(Audit, audit_id)
    if not audit:
        raise HTTPException(404, "Audit introuvable")
    return audit


# ---------------------------------------------------------------- admin

@router.get("", response_model=list[AuditResult], response_model_by_alias=True,
            dependencies=[Depends(require_admin)])
def list_audits(db: Session = Depends(get_db)) -> list[AuditResult]:
    """Tous les audits, du plus récent au plus ancien."""
    rows = db.query(Audit).order_by(Audit.started_at.desc()).all()
    return [AuditResult.from_audit(a, include_token=True) for a in rows]


@router.post("/{audit_id}/unlock", response_model=AuditResult, response_model_by_alias=True,
             dependencies=[Depends(require_admin)])
def unlock_audit(audit_id: str, db: Session = Depends(get_db)) -> AuditResult:
    """Après paiement : lance l'audit IA complet et active le lien privé du client."""
    audit = _get_or_404(db, audit_id)
    try:
        audit = service.unlock(db, audit)
    except service.SourceFileMissingError as exc:
        raise HTTPException(410, str(exc)) from exc
    except Exception as exc:
        # Détail tracé côté serveur par le service, jamais renvoyé au client.
        raise HTTPException(500, "Erreur interne pendant l'audit complet") from exc
    return AuditResult.from_audit(audit, include_token=True)


@router.get("/{audit_id}/profiling", dependencies=[Depends(require_admin)])
def get_profiling(audit_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Profiling complet (admin : peut contenir des valeurs identifiantes)."""
    audit = db.get(Audit, audit_id)
    if not audit or not audit.profiling:
        raise HTTPException(404, "Audit introuvable")
    return audit.profiling


# ---------------------------------------------------------------- public

@router.post("/upload", response_model=AuditResult, response_model_by_alias=True)
def upload_and_preview(file: UploadFile, protocol: UploadFile | None = None,
                       db: Session = Depends(get_db)) -> AuditResult:
    """Téléverse une base (+ protocole optionnel) et renvoie l'aperçu gratuit."""
    file_name = file.filename or "base"
    audit_id = service.new_audit_id()
    try:
        ext = service.check_data_extension(file_name)
        data_path = service.data_path(audit_id, ext)
        size = service.save_stream(file.file, data_path, max_bytes=service.MAX_UPLOAD_BYTES)
        # Protocole : conservé pour l'audit complet, validé dès maintenant pour signaler
        # tôt un fichier illisible.
        if protocol and protocol.filename:
            service.save_protocol(audit_id, protocol.file, protocol.filename)
    except service.UnsupportedFormatError as exc:
        service.discard_upload(audit_id)
        raise HTTPException(415, str(exc)) from exc
    except service.FileTooLargeError as exc:
        service.discard_upload(audit_id)
        raise HTTPException(413, str(exc)) from exc

    try:
        audit = service.create_preview(db, audit_id, data_path, file_name, size)
    except IngestError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, "Erreur interne pendant l'aperçu") from exc
    return AuditResult.from_audit(audit)


@router.get("/{audit_id}", response_model=AuditResult, response_model_by_alias=True)
def get_audit(audit_id: str, db: Session = Depends(get_db)) -> AuditResult:
    audit = _get_or_404(db, audit_id)
    if audit.status == AuditStatus.FAILED:
        raise HTTPException(404, "Audit introuvable")
    return AuditResult.from_audit(audit)


@router.get("/{audit_id}/events", response_model=list[AuditEvent],
            response_model_by_alias=True)
def get_events(audit_id: str, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    return _get_or_404(db, audit_id).events or []


@router.get("/{audit_id}/score")
def get_score_detail(audit_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Décomposition du score : 8 domaines, critères, plafonds, confiance."""
    audit = db.get(Audit, audit_id)
    if not audit or not audit.score_detail:
        raise HTTPException(404, "Audit introuvable")
    return audit.score_detail


@router.get("/{audit_id}/assessment", dependencies=[Depends(require_admin)])
def get_assessment(audit_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Jugement IA (contenu payant) ; le client y accède par /r/{token}/assessment."""
    audit = db.get(Audit, audit_id)
    assessment = (audit.ai_audit or {}).get("assessment") if audit else None
    if not assessment:
        raise HTTPException(404, "Jugement IA indisponible pour cet audit")
    return assessment


@router.get("/{audit_id}/ai", dependencies=[Depends(require_admin)])
def get_ai_audit(audit_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Audit IA brut : étude reconstruite, dictionnaire, règles et violations."""
    audit = _get_or_404(db, audit_id)
    if not audit.ai_audit:
        raise HTTPException(404, "Audit IA non exécuté pour cet audit")
    return audit.ai_audit


# Route générique déclarée en dernier : les routes fixes (/score, /events…) passent avant.
@router.get("/{audit_id}/{kind}", dependencies=[Depends(require_admin)])
def download_deliverable(audit_id: str, kind: DeliverableKind,
                         db: Session = Depends(get_db)) -> Response:
    """Livrables (admin). Les clients téléchargent via leur lien privé /r/{token}, qui
    vérifie le paiement : l'identifiant d'audit, connu dès l'aperçu, ne suffit pas."""
    return deliverable_response(_get_or_404(db, audit_id), kind)
