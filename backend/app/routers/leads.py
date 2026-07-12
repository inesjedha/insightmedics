"""CRUD /leads — contrat de src/lib/api/client.ts."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Lead
from ..schemas import LeadPatch, LeadSchema

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadSchema, response_model_by_alias=True)
def create_lead(lead: LeadSchema, db: Session = Depends(get_db)):
    if db.get(Lead, lead.id):
        raise HTTPException(409, "Lead déjà existant")
    obj = Lead(**lead.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("", response_model=list[LeadSchema], response_model_by_alias=True)
def list_leads(db: Session = Depends(get_db)):
    return db.query(Lead).order_by(Lead.created_at.desc()).all()


@router.get("/{lead_id}", response_model=LeadSchema, response_model_by_alias=True)
def get_lead(lead_id: str, db: Session = Depends(get_db)):
    obj = db.get(Lead, lead_id)
    if not obj:
        raise HTTPException(404, "Lead introuvable")
    return obj


@router.patch("/{lead_id}", response_model=LeadSchema, response_model_by_alias=True)
def update_lead(lead_id: str, patch: LeadPatch, db: Session = Depends(get_db)):
    obj = db.get(Lead, lead_id)
    if not obj:
        raise HTTPException(404, "Lead introuvable")
    for k, v in patch.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj
