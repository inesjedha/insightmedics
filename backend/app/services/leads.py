"""Logique métier des leads (prospects) : création depuis les formulaires publics."""

from __future__ import annotations

import secrets

from sqlalchemy.orm import Session

from ..models import Audit, Lead
from ..schemas import LeadCreate


def create_lead(db: Session, data: LeadCreate) -> Lead:
    """Crée un lead. Identifiant, date, statut et priorité sont fixés par le serveur.

    Pour une demande liée à un audit, score et priorité sont lus depuis l'audit en base :
    on ne fait jamais confiance au navigateur pour ces valeurs.
    """
    lead = Lead(id=f"lead_{secrets.token_hex(8)}", **data.model_dump())
    audit = db.get(Audit, data.audit_id) if data.audit_id else None
    if audit is not None:
        lead.audit_score = audit.score
        if audit.needs_human_review:
            n_critical = sum(1 for i in audit.issues or [] if i["level"] == "critical")
            lead.priority = "high"
            lead.notes = (f"Audit {audit.score}/100 — relecture humaine requise "
                          f"({n_critical} alerte(s) critique(s)).")
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead
