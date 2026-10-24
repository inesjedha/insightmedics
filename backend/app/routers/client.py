"""Endpoints /r/{token} : espace client accessible par lien privé, sans compte.

Protégés par le jeton (256 bits) et non par la clé admin. Accès accordé uniquement si
l'audit est payé, terminé et non expiré. Un lien inconnu et un audit non payé renvoient
la même erreur, pour ne pas révéler l'existence d'un audit.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Audit
from ..schemas import AuditResult
from ..services import audits as service
from ..services.audits import DeliverableKind
from .audits import deliverable_response

router = APIRouter(prefix="/r", tags=["client"])


def paid_audit(token: str, db: Session = Depends(get_db)) -> Audit:
    """Dépendance : l'audit payé correspondant au jeton du chemin."""
    try:
        return service.find_paid_by_token(db, token)
    except service.LinkNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    except service.LinkExpiredError as exc:
        raise HTTPException(410, str(exc)) from exc


@router.get("/{token}", response_model=AuditResult, response_model_by_alias=True)
def client_result(audit: Audit = Depends(paid_audit)) -> AuditResult:
    """Résumé de l'audit complet (score, observations, méta)."""
    return AuditResult.from_audit(audit)


@router.get("/{token}/score")
def client_score(audit: Audit = Depends(paid_audit)) -> dict[str, Any]:
    if not audit.score_detail:
        raise HTTPException(404, "Détail du score indisponible")
    return audit.score_detail


@router.get("/{token}/assessment")
def client_assessment(audit: Audit = Depends(paid_audit)) -> dict[str, Any]:
    assessment = (audit.ai_audit or {}).get("assessment")
    if not assessment:
        raise HTTPException(404, "Jugement IA indisponible")
    return assessment


@router.get("/{token}/{kind}")
def client_deliverable(kind: DeliverableKind, audit: Audit = Depends(paid_audit)) -> Response:
    """Livrables anonymisés : classeur Excel, rapport Word, base nettoyée."""
    return deliverable_response(audit, kind)
