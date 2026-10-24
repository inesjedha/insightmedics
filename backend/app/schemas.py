"""Schémas Pydantic — sérialisation camelCase, identique aux types TS du front
(`src/lib/api/types.ts`)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

if TYPE_CHECKING:
    from .models import Audit

IssueLevel = Literal["info", "warn", "critical"]
EventLevel = Literal["info", "warn", "critical", "success"]
AuditStatusValue = Literal["preview", "processing", "done", "failed"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class LeadSchema(CamelModel):
    id: str
    created_at: str
    source: str = "contact"
    priority: str = "normal"
    name: str | None = None
    email: str = ""
    phone: str = ""
    subject: str | None = None
    problem: str | None = None
    objective: str | None = None
    message: str | None = None
    audit_id: str | None = None
    audit_score: float | None = None
    status: str = "new"
    last_contact_at: str | None = None
    next_follow_up_at: str | None = None
    notes: str | None = None


class LeadPatch(CamelModel):
    source: str | None = None
    priority: str | None = None
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    subject: str | None = None
    problem: str | None = None
    objective: str | None = None
    message: str | None = None
    audit_id: str | None = None
    audit_score: float | None = None
    status: str | None = None
    last_contact_at: str | None = None
    next_follow_up_at: str | None = None
    notes: str | None = None


class AuditIssue(CamelModel):
    level: IssueLevel
    label: str


class AuditResult(CamelModel):
    id: str
    file_name: str
    file_size: int
    started_at: str
    finished_at: str | None = None
    score: float
    row_count: int
    column_count: int
    missing_pct: float
    duplicates_pct: float
    issues: list[AuditIssue]
    needs_human_review: bool
    # Parcours aperçu → paiement : statut, accès privé, déblocage
    status: AuditStatusValue = "preview"
    is_preview: bool = True
    paid: bool = False
    token: str | None = None

    @classmethod
    def from_audit(cls, a: Audit) -> AuditResult:
        return cls(
            id=a.id, file_name=a.file_name, file_size=a.file_size,
            started_at=a.started_at, finished_at=a.finished_at,
            score=a.score or 0, row_count=a.row_count or 0, column_count=a.column_count or 0,
            missing_pct=a.missing_pct or 0, duplicates_pct=a.duplicates_pct or 0,
            issues=[AuditIssue(**i) for i in a.issues or []],
            needs_human_review=bool(a.needs_human_review),
            status=a.status,  # type: ignore[arg-type]  # colonne String, valeurs AuditStatus
            is_preview=a.status != "done", paid=bool(a.paid), token=a.token,
        )


class AuditEvent(CamelModel):
    ts: str
    level: EventLevel
    message: str
