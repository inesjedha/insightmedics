"""Schémas Pydantic — sérialisation camelCase, identique aux types TS du front
(`src/lib/api/types.ts`)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

if TYPE_CHECKING:
    from .models import Audit

IssueLevel = Literal["info", "warn", "critical"]
EventLevel = Literal["info", "warn", "critical", "success"]
AuditStatusValue = Literal["preview", "processing", "done", "failed"]
AuditView = Literal["public", "client", "admin"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True,
                              from_attributes=True)


LeadSource = Literal["contact", "audit"]
LeadPriority = Literal["normal", "high"]
LeadStatus = Literal["new", "contacted", "won", "lost"]


class LeadCreate(CamelModel):
    """Champs qu'un formulaire public a le droit de fournir."""

    source: LeadSource = "contact"
    name: str | None = Field(default=None, max_length=100)
    email: str = Field(max_length=255)
    phone: str = Field(default="", max_length=30)
    subject: str | None = Field(default=None, max_length=150)
    problem: str | None = Field(default=None, max_length=1000)
    objective: str | None = Field(default=None, max_length=1000)
    message: str | None = Field(default=None, max_length=2500)
    audit_id: str | None = None


class LeadSchema(CamelModel):
    """Lead complet, tel que vu par l'admin (CRM)."""

    id: str
    created_at: str
    source: LeadSource
    priority: LeadPriority
    name: str | None = None
    email: str
    phone: str
    subject: str | None = None
    problem: str | None = None
    objective: str | None = None
    message: str | None = None
    audit_id: str | None = None
    audit_score: float | None = None
    status: LeadStatus
    last_contact_at: str | None = None
    next_follow_up_at: str | None = None
    notes: str | None = None


class LeadPatch(CamelModel):
    """Mise à jour CRM (admin) : seuls les champs de suivi sont modifiables."""

    priority: LeadPriority | None = None
    status: LeadStatus | None = None
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

    # Vue admin uniquement
    error: str | None = None
    purged: bool = False

    @classmethod
    def from_audit(cls, a: Audit, *, view: AuditView) -> AuditResult:
        """`view` décide des champs sensibles exposés :
        - public : aperçu accessible par id — jamais le jeton du lien privé ;
        - client : déjà authentifié par son jeton ;
        - admin : jeton (pour envoyer le lien), erreur et état de purge en plus."""
        from .models import AuditStatus

        return cls(
            id=a.id, file_name=a.file_name, file_size=a.file_size,
            started_at=a.started_at, finished_at=a.finished_at,
            score=a.score or 0, row_count=a.row_count or 0, column_count=a.column_count or 0,
            missing_pct=a.missing_pct or 0, duplicates_pct=a.duplicates_pct or 0,
            issues=[AuditIssue(**i) for i in a.issues or []],
            needs_human_review=bool(a.needs_human_review),
            status=a.status,  # type: ignore[arg-type]  # colonne String, valeurs AuditStatus
            is_preview=a.status != AuditStatus.DONE, paid=bool(a.paid),
            token=a.token if view in ("client", "admin") else None,
            error=a.error if view == "admin" else None,
            purged=bool(a.purged_at) if view == "admin" else False,
        )


class AuditEvent(CamelModel):
    ts: str
    level: EventLevel
    message: str
