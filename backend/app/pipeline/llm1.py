"""Étape 3 — LLM-1 : dictionnaire des variables + règles de cohérence (jalon M4).

Principes : jamais la base complète à l'API (échantillon ≤ 50 lignes, colonnes PII
masquées), sortie JSON validée strictement (2 retries), l'IA propose / le code
exécute. Prompt versionné dans app/prompts/llm1_system.md.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Literal

import pandas as pd
from pydantic import BaseModel

from .llm_client import call_and_validate

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "llm1_system.md"
ALLOWED_OPS = {"gte", "lte", "gt", "lt", "eq", "neq", "not_null", "in_set",
               "implies", "bounds", "formula_match", "chrono_order"}


# ---------------------------------------------------------------- schémas

class Bounds(BaseModel):
    min: float | None = None
    max: float | None = None


class DictEntry(BaseModel):
    name: str
    meaning: str
    clinical_domain: str
    analytic_role: Literal["identifier", "exposure", "outcome", "confounder",
                           "score", "descriptive", "derived", "unknown"]
    expected_unit: str | None = None
    theoretical_bounds: Bounds | None = None
    plausible_bounds: Bounds | None = None
    suspected_missing_codes: list[float | int | str] = []
    confidence: Literal["high", "medium", "low"]
    ambiguities: str | None = None


class Rule(BaseModel):
    id: str
    description: str
    severity: Literal["critical", "major", "moderate", "minor"]
    category: Literal["chrono", "clinical", "synthetic", "totals", "derived"]
    rule: dict


class DerivedVar(BaseModel):
    name: str
    sources: list[str] = []
    formula: str | None = None
    formula_source: str | None = None


class Endpoint(BaseModel):
    description: str
    candidate_columns: list[str] = []
    confidence: Literal["high", "medium", "low"]


class Study(BaseModel):
    design: str | None = None
    primary_objective: str | None = None
    secondary_objectives: list[str] = []
    primary_endpoint: Endpoint | None = None


class Llm1Output(BaseModel):
    study: Study | None = None
    dictionary: list[DictEntry] = []
    coherence_rules: list[Rule] = []
    derived_variables: list[DerivedVar] = []


def _validate_rule_ast(node: Any) -> bool:
    if not isinstance(node, dict) or node.get("op") not in ALLOWED_OPS:
        return False
    if node["op"] == "implies":
        return _validate_rule_ast(node.get("if")) and _validate_rule_ast(node.get("then"))
    return True


# ---------------------------------------------------------------- entrée

def _mask_pii(df: pd.DataFrame, pii_columns: list[str]) -> pd.DataFrame:
    out = df.copy()
    for c in pii_columns:
        if c in out.columns:
            out[c] = "[MASQUÉ]"
    return out


def build_user_message(profiling: dict, df: pd.DataFrame,
                       protocol_text: str | None, sample_rows: int = 50) -> str:
    pii_cols = [p["column"] for p in profiling.get("pii_candidates", [])]
    n = min(sample_rows, len(df))
    sample = _mask_pii(df.sample(n, random_state=42) if len(df) > n else df, pii_cols)

    cols_summary = []
    for c in profiling["columns"]:
        entry = {k: c.get(k) for k in ("name", "spss_label", "value_labels",
                                       "stat_type_guess", "pct_missing", "n_distinct",
                                       "suspected_missing_codes")}
        if c.get("numeric_stats"):
            ns = c["numeric_stats"]
            entry["stats_observees"] = {k: ns.get(k) for k in ("mean", "median", "min", "max")}
        cols_summary.append(entry)

    parts = [
        "## VARIABLES (nom, label SPSS, labels de valeurs, type ; stats_observees "
        "DÉCRIVENT les données, ce ne sont PAS des bornes)",
        json.dumps(cols_summary, ensure_ascii=False),
        f"\n## STRUCTURE\n{json.dumps(profiling['structure'], ensure_ascii=False, default=str)}",
        f"\n## ÉCHANTILLON ({n} lignes, colonnes identifiantes masquées)",
        sample.to_csv(index=False)[:30000],
    ]
    if protocol_text:
        parts.append(f"\n## PROTOCOLE DE RECHERCHE\n{protocol_text[:20000]}")
    else:
        parts.append("\n## PROTOCOLE : non fourni (study à null, confidence=low)")
    return "\n".join(parts)


# ---------------------------------------------------------------- appel

def run_llm1(profiling: dict, df: pd.DataFrame,
             protocol_text: str | None = None) -> tuple[Llm1Output | None, list[str]]:
    """Retourne (sortie validée | None, notes). None si pas de clé API ou échec."""
    system = PROMPT_PATH.read_text(encoding="utf-8")
    user = build_user_message(profiling, df, protocol_text)
    known_cols = {c["name"] for c in profiling["columns"]}

    def _filter_rules(out: Llm1Output) -> tuple[Llm1Output, list[str]]:
        kept, rejected = [], 0
        for r in out.coherence_rules:
            cols_in_rule = re.findall(r'"col":\s*"([^"]+)"', json.dumps(r.rule))
            if r.rule.get("op") == "chrono_order":
                cols_in_rule += r.rule.get("cols", [])
            if r.rule.get("op") == "bounds":
                cols_in_rule.append(r.rule.get("col", ""))
            if _validate_rule_ast(r.rule) and all(c in known_cols for c in cols_in_rule if c):
                kept.append(r)
            else:
                rejected += 1
        out.coherence_rules = kept
        extra = [f"{len(out.dictionary)} variables documentées, {len(kept)} règles retenues"]
        if rejected:
            extra.append(f"{rejected} règle(s) rejetée(s) (hors DSL ou colonne inconnue)")
        return out, extra

    out, notes = call_and_validate(system, user, Llm1Output, post=_filter_rules)
    return out, ["LLM-1 : " + n for n in notes]
