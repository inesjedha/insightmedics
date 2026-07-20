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
from pydantic import BaseModel, ValidationError

from ..config import settings

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
            entry["stats"] = {k: ns.get(k) for k in ("mean", "median", "min", "max")}
        cols_summary.append(entry)

    parts = [
        "## VARIABLES (nom, label SPSS, labels de valeurs, type, stats)",
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

def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.S)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Aucun JSON dans la réponse")
    return json.loads(text[start:end + 1])


def _call_llm(system: str, user: str) -> str:
    """Appelle le fournisseur configuré (anthropic ou openai) et retourne le texte."""
    provider = settings.resolved_provider
    model = settings.resolved_model
    if provider == "anthropic":
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        resp = client.messages.create(
            model=model, max_tokens=16000, temperature=0,
            system=system, messages=[{"role": "user", "content": user}],
        )
        return "".join(b.text for b in resp.content if b.type == "text")
    if provider == "openai":
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.chat.completions.create(
            model=model, temperature=0,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": user}],
        )
        return resp.choices[0].message.content or ""
    raise RuntimeError(f"Fournisseur IA inconnu : {provider}")


def run_llm1(profiling: dict, df: pd.DataFrame,
             protocol_text: str | None = None) -> tuple[Llm1Output | None, list[str]]:
    """Retourne (sortie validée | None, notes). None si pas de clé API ou échec."""
    notes: list[str] = []
    if not settings.resolved_provider:
        notes.append("Aucune clé API IA configurée (ANTHROPIC_API_KEY ou "
                     "OPENAI_API_KEY) : audit IA sauté")
        return None, notes

    system = PROMPT_PATH.read_text(encoding="utf-8")
    user = build_user_message(profiling, df, protocol_text)
    known_cols = {c["name"] for c in profiling["columns"]}

    last_error = ""
    for attempt in range(3):
        msg = user if attempt == 0 else (
            user + f"\n\n## CORRECTION DEMANDÉE\nTa réponse précédente était invalide"
                   f" ({last_error}). Renvoie UNIQUEMENT le JSON conforme au schéma.")
        raw = _call_llm(system, msg)
        try:
            out = Llm1Output.model_validate(_extract_json(raw))
        except (ValueError, ValidationError, json.JSONDecodeError) as exc:
            last_error = str(exc)[:300]
            continue
        # Filtrage strict : DSL valide + colonnes existantes uniquement
        kept, rejected = [], 0
        for r in out.coherence_rules:
            cols_in_rule = re.findall(r'"col":\s*"([^"]+)"', json.dumps(r.rule))
            cols_in_rule += r.rule.get("cols", []) if r.rule.get("op") == "chrono_order" else []
            if r.rule.get("op") == "bounds":
                cols_in_rule.append(r.rule.get("col", ""))
            if _validate_rule_ast(r.rule) and all(c in known_cols for c in cols_in_rule if c):
                kept.append(r)
            else:
                rejected += 1
        if rejected:
            notes.append(f"{rejected} règle(s) rejetée(s) (hors DSL ou colonne inconnue)")
        out.coherence_rules = kept
        notes.append(f"LLM-1 OK ({settings.resolved_provider}/{settings.resolved_model}) : "
                     f"{len(out.dictionary)} variables documentées, "
                     f"{len(kept)} règles retenues (tentative {attempt + 1})")
        return out, notes

    notes.append(f"LLM-1 : échec après 3 tentatives ({last_error})")
    return None, notes
