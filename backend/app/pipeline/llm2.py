"""Étape 5 — LLM-2 : classification des anomalies, jugements de score, verdict,
rédaction française (jalon M5).

Entrées : profiling condensé, dictionnaire (LLM-1), violations des règles, écarts sur
dérivées, candidats PII, étude reconstruite. Sortie validée strictement. Les
scoring_inputs alimentent la grille de score (domaines 5/6/8 + confiance).
Prompt versionné dans app/prompts/llm2_system.md.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel

from .llm_client import call_and_validate

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "llm2_system.md"


# ---------------------------------------------------------------- schémas

class Finding(BaseModel):
    id: str
    anomaly_class: Literal["A", "B", "C", "D"]
    severity: Literal["critique", "majeure", "moderee", "mineure"]
    certainty: Literal["certain", "probable", "possible"]
    column: str | None = None
    affected_columns: list[str] = []   # familles consolidées : toutes les variables visées
    n_affected: int | None = None      # nombre d'items regroupés (colonnes/lignes)
    row_ids: list[str] = []
    observed: str | None = None
    rule_violated: str | None = None
    title_fr: str
    explanation_fr: str
    proposed_correction: str | None = None
    requires_source_verification: bool = False


class ScoringInputs(BaseModel):
    statistical_unit_clear: bool | None = None
    structure_fits_study: bool | None = None
    primary_endpoint_status: str | None = None
    primary_objective_vars_available: str | None = None
    secondary_objectives_vars_available: str | None = None
    inclusion_criteria_verifiable: bool | None = None
    groups_reconstructible: str | None = None
    derived_vars_reliability: str | None = None
    planned_analyses_feasibility: str | None = None
    units_consistent: bool | None = None
    adjustment_vars_available: bool | None = None
    major_errors_on_primary_endpoint: bool | None = None


class ClientDecision(BaseModel):
    question_fr: str
    column: str | None = None
    row_ids: list[str] = []
    options: list[str] = []
    consequence_fr: str = ""
    recommendation_fr: str = ""


class CleaningOp(BaseModel):
    op_id: str
    operation: str
    column: str | None = None
    params: dict = {}
    rationale_fr: str = ""
    auto_safe: bool = False


class Verdict(BaseModel):
    level: int
    label: str
    justification_fr: str


class ReportSections(BaseModel):
    limites: str = ""
    plan_action: str = ""
    plan_analyse_conditionnel: str = ""


class PiiAssessment(BaseModel):
    column: str
    risk: Literal["eleve", "modere", "faible"]
    recommendation_fr: str = ""


class Llm2Output(BaseModel):
    findings: list[Finding] = []
    scoring_inputs: ScoringInputs = ScoringInputs()
    client_decisions: list[ClientDecision] = []
    cleaning_plan: list[CleaningOp] = []
    exploitability_verdict: Verdict | None = None
    executive_summary_fr: str = ""
    report_sections_fr: ReportSections = ReportSections()
    pii_assessment: list[PiiAssessment] = []


CLEANING_OPS = {"recode_missing", "drop_duplicates", "cast_type", "trim_whitespace",
                "standardize_dates", "standardize_categories", "drop_constant_column",
                "drop_empty_column", "rename_column", "remove_outliers", "recode_value"}


# ---------------------------------------------------------------- entrée

def build_user_message(profiling: dict, ai_audit: dict) -> str:
    """Condense les faits pour LLM-2 (jamais la base complète)."""
    m = profiling["missing_summary"]
    s = profiling["structure"]
    cols_light = [{k: c.get(k) for k in ("name", "spss_label", "stat_type_guess",
                                         "pct_missing", "suspected_missing_codes", "flags")}
                  for c in profiling["columns"]]
    payload = {
        "structure": s,
        "manquants": m,
        "colonnes": cols_light,
        "dates": profiling.get("dates_audit", []),
        "pii_candidats": profiling.get("pii_candidates", []),
        "etude_reconstruite": ai_audit.get("study"),
        "dictionnaire": ai_audit.get("dictionary", []),
        "violations_regles": ai_audit.get("violations"),
        "variables_derivees": ai_audit.get("derived_variables", []),
    }
    return ("## FAITS D'AUDIT (calculés par programme, fiables)\n"
            + json.dumps(payload, ensure_ascii=False, default=str)[:120000])


# ---------------------------------------------------------------- appel

def run_llm2(profiling: dict, ai_audit: dict) -> tuple[Llm2Output | None, list[str]]:
    """Retourne (sortie validée | None, notes). None si pas de clé API ou échec."""
    system = PROMPT_PATH.read_text(encoding="utf-8")
    user = build_user_message(profiling, ai_audit)

    def _post(out: Llm2Output) -> tuple[Llm2Output, list[str]]:
        # Filtre le plan de nettoyage sur l'enum autorisé
        before = len(out.cleaning_plan)
        out.cleaning_plan = [op for op in out.cleaning_plan if op.operation in CLEANING_OPS]
        dropped = before - len(out.cleaning_plan)
        n_crit = sum(1 for f in out.findings if f.severity == "critique")
        extra = [f"{len(out.findings)} anomalie(s) classée(s) dont {n_crit} critique(s), "
                 f"verdict niveau {out.exploitability_verdict.level if out.exploitability_verdict else '?'}"]
        if dropped:
            extra.append(f"{dropped} opération(s) de nettoyage hors enum rejetée(s)")
        return out, extra

    out, notes = call_and_validate(system, user, Llm2Output, post=_post)
    return out, ["LLM-2 : " + n for n in notes]
