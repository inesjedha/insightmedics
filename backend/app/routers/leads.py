"""Endpoints /leads : création publique (formulaires), lecture et suivi réservés à l'admin."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..db import get_db
from ..models import Audit, Lead
from ..schemas import LeadCreate, LeadPatch, LeadSchema
from ..services import leads as service
from ..services import notify, student_mail

router = APIRouter(prefix="/leads", tags=["leads"])


def _get_or_404(db: Session, lead_id: str) -> Lead:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead introuvable")
    return lead


@router.post("", response_model=LeadSchema, response_model_by_alias=True, status_code=201)
def create_lead(data: LeadCreate, background: BackgroundTasks,
                db: Session = Depends(get_db)) -> Lead:
    """Public : alimenté par le formulaire de contact, la demande de déblocage d'audit et
    l'inscription au webinaire.

    Après la réponse (un échec d'envoi n'affecte jamais le formulaire) : un mail prévient
    l'équipe, un autre confirme la demande à l'étudiant."""
    lead = service.create_lead(db, data)
    if notify.enabled():
        background.add_task(notify.send, notify.lead_message(lead))
    if student_mail.enabled():
        audit = db.get(Audit, lead.audit_id) if lead.audit_id else None
        message = student_mail.mail_for_lead(lead, audit)
        if message is not None:
            background.add_task(student_mail.send, message)
    return lead


@router.get("", response_model=list[LeadSchema], response_model_by_alias=True,
            dependencies=[Depends(require_admin)])
def list_leads(db: Session = Depends(get_db)) -> list[Lead]:
    return db.query(Lead).order_by(Lead.created_at.desc()).all()


@router.get("/{lead_id}", response_model=LeadSchema, response_model_by_alias=True,
            dependencies=[Depends(require_admin)])
def get_lead(lead_id: str, db: Session = Depends(get_db)) -> Lead:
    return _get_or_404(db, lead_id)


@router.patch("/{lead_id}", response_model=LeadSchema, response_model_by_alias=True,
              dependencies=[Depends(require_admin)])
def update_lead(lead_id: str, patch: LeadPatch, db: Session = Depends(get_db)) -> Lead:
    lead = _get_or_404(db, lead_id)
    for field, value in patch.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead
