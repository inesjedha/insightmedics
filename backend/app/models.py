"""Modèles ORM — alignés sur src/lib/api/types.ts du front."""

from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import JSON, Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def utcnow_iso() -> str:
    return datetime.now(UTC).isoformat()


class AuditStatus(StrEnum):
    """Cycle de vie d'un audit : aperçu gratuit → (paiement) → audit IA → terminé."""

    PREVIEW = "preview"        # aperçu gratuit calculé, en attente de paiement
    PROCESSING = "processing"  # audit IA complet en cours
    DONE = "done"              # audit complet terminé (après paiement)
    FAILED = "failed"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[str] = mapped_column(String, default=utcnow_iso)
    source: Mapped[str] = mapped_column(String, default="contact")  # contact | audit
    priority: Mapped[str] = mapped_column(String, default="normal")  # normal | high
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, default="")
    phone: Mapped[str] = mapped_column(String, default="")
    subject: Mapped[str | None] = mapped_column(String, nullable=True)
    problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    objective: Mapped[str | None] = mapped_column(Text, nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Comment l'étudiant nous a connus (formulaire de contact) : canal d'acquisition.
    referral: Mapped[str | None] = mapped_column(String, nullable=True)
    audit_id: Mapped[str | None] = mapped_column(String, nullable=True)
    audit_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="new")  # new|contacted|won|lost
    last_contact_at: Mapped[str | None] = mapped_column(String, nullable=True)
    next_follow_up_at: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    file_name: Mapped[str] = mapped_column(String)
    file_size: Mapped[int] = mapped_column(Integer)
    stored_path: Mapped[str] = mapped_column(String)
    started_at: Mapped[str] = mapped_column(String, default=utcnow_iso)
    finished_at: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default=AuditStatus.PREVIEW)  # AuditStatus
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Accès privé + paywall (parcours preview → paiement manuel → audit complet)
    token: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    paid: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[str | None] = mapped_column(String, nullable=True)
    # Verrou à bail de l'audit IA en cours (voir services/unlock_jobs.py).
    job_id: Mapped[str | None] = mapped_column(String, nullable=True)
    job_started_at: Mapped[str | None] = mapped_column(String, nullable=True)
    # Date de purge : fichiers supprimés et détail (profiling, audit IA) effacé.
    purged_at: Mapped[str | None] = mapped_column(String, nullable=True)

    # Résumé pour le front (AuditResult)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    row_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    column_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    missing_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    duplicates_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    issues: Mapped[list | None] = mapped_column(JSON, nullable=True)
    needs_human_review: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Détail complet (interne / futur rapport)
    profiling: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    score_detail: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_audit: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    events: Mapped[list | None] = mapped_column(JSON, nullable=True)


class AnalysisStatus(StrEnum):
    """Chaîne « Analyses + résultats » (docs/analyse-resultats.md)."""

    AWAITING_BASE = "awaiting_base"  # commandée, en attente de la base corrigée
    PLANNING = "planning"            # contre-audit puis plan proposé par l'IA, en cours
    PLAN_READY = "plan_ready"        # plan à valider par Dr Hamza
    COMPUTING = "computing"          # calculs puis rédaction par l'IA, en cours
    REVIEW = "review"                # résultats rédigés, à relire avant livraison
    DELIVERED = "delivered"          # livré sur le lien privé de l'étudiant
    FAILED = "failed"


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    audit_id: Mapped[str] = mapped_column(String, index=True)
    created_at: Mapped[str] = mapped_column(String, default=utcnow_iso)
    updated_at: Mapped[str] = mapped_column(String, default=utcnow_iso)
    status: Mapped[str] = mapped_column(String, default=AnalysisStatus.AWAITING_BASE)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Base corrigée renvoyée par l'étudiant (le fichier de l'audit reste intact)
    file_name: Mapped[str | None] = mapped_column(String, nullable=True)
    stored_path: Mapped[str | None] = mapped_column(String, nullable=True)
    # Consignes de l'équipe : réponses du directeur, définitions validées, demandes
    instructions: Mapped[str] = mapped_column(Text, default="")
    # Verrou à bail de l'étape IA en cours (même mécanisme que l'audit)
    job_id: Mapped[str | None] = mapped_column(String, nullable=True)
    job_started_at: Mapped[str | None] = mapped_column(String, nullable=True)
    # Contenu, étape par étape
    recheck: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    plan: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    plan_notes: Mapped[list | None] = mapped_column(JSON, nullable=True)
    plan_validated_at: Mapped[str | None] = mapped_column(String, nullable=True)
    flow: Mapped[list | None] = mapped_column(JSON, nullable=True)
    derived_log: Mapped[list | None] = mapped_column(JSON, nullable=True)
    results: Mapped[list | None] = mapped_column(JSON, nullable=True)
    text: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Format faculté (app/theses) : fiche de mission (clés de Dr Hamza), lancement en un
    # bouton (plan puis calculs sans arrêt s'il n'y a rien à trancher), brouillon rédigé
    # par l'IA et contrôles avant livraison.
    fiche: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    auto_run: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=False)
    draft: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    checks: Mapped[list | None] = mapped_column(JSON, nullable=True)
    delivered_at: Mapped[str | None] = mapped_column(String, nullable=True)
    purged_at: Mapped[str | None] = mapped_column(String, nullable=True)
    events: Mapped[list | None] = mapped_column(JSON, nullable=True)
