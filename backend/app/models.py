"""Modèles ORM — alignés sur src/lib/api/types.ts du front."""

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


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
    status: Mapped[str] = mapped_column(String, default="running")  # running|done|failed
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    events: Mapped[list | None] = mapped_column(JSON, nullable=True)
