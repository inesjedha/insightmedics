"""Schémas Pydantic — sérialisation camelCase, identique aux types TS du front."""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


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
    level: str  # info | warn | critical
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


class AuditEvent(CamelModel):
    ts: str
    level: str  # info | warn | critical | success
    message: str
