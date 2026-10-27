"""Rédaction de la partie Résultats par l'IA (prompt app/prompts/analysis_write.md), à
partir des seuls résultats calculés. Contrôle par le code : chaque nombre du texte doit
exister dans les résultats ; sinon le texte est refusé et redemandé avec la liste des
nombres en cause."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from ..pipeline.llm_client import call_and_validate

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "analysis_write.md"

# 2 183 · 86,1 · 0,05 · −3 · 1 000 (espaces fines ou insécables comme séparateurs)
_NUMBER_RE = re.compile(r"(?<![\w,.])[−-]?\d{1,3}(?:[   ]\d{3})+(?:,\d+)?|(?<![\w,.])[−-]?\d+(?:[.,]\d+)?")
# Nombres toujours permis : seuil, intervalle de confiance, numéros de tableau.
_ALWAYS = {"0.05", "5", "95", "100"}


class Section(BaseModel):
    analysis_id: str
    heading: str
    table_title: str = ""
    paragraphs: list[str] = []


class ResultsText(BaseModel):
    methods_paragraph: str = ""
    flow_paragraph: str = ""
    sections: list[Section] = []
    missing: list[str] = []


def normalize(token: str) -> str:
    """« 2 183 » → « 2183 », « 86,1 » → « 86.1 », « −3 » → « -3 », « 15,0 » → « 15 »."""
    t = re.sub(r"[   ]", "", token).replace("−", "-").replace(",", ".")
    try:
        f = float(t)
    except ValueError:
        return t
    return str(int(f)) if f.is_integer() else repr(round(f, 6)).rstrip("0").rstrip(".")


def numbers_in(text: str) -> set[str]:
    return {normalize(m) for m in _NUMBER_RE.findall(text)}


def allowed_numbers(context: Any) -> set[str]:
    """Tous les nombres présents dans les résultats (tableaux, faits, flux, titres)."""
    found = numbers_in(json.dumps(context, ensure_ascii=False, default=str))
    # Un nombre négatif est aussi permis sous sa forme positive (« diminution de 3 »).
    return found | {n.lstrip("-") for n in found} | _ALWAYS


def unknown_numbers(out: ResultsText, allowed: set[str], n_tables: int) -> list[str]:
    tables = {str(i) for i in range(1, n_tables + 1)}
    texts = [out.methods_paragraph, out.flow_paragraph,
             *(p for s in out.sections for p in [*s.paragraphs, s.table_title, s.heading])]
    bad: list[str] = []
    for text in texts:
        for n in sorted(numbers_in(text)):
            if n not in allowed and n not in tables and n not in bad:
                bad.append(n)
    return bad


def build_context(plan: dict[str, Any], flow: list[dict[str, Any]],
                  results: list[dict[str, Any]], derived_log: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "titre": plan.get("title"),
        "population": (plan.get("population") or {}).get("description"),
        "diagramme_de_flux": flow,
        "analyses": [{k: r.get(k) for k in ("id", "title", "primary", "n", "methods", "table",
                                            "facts", "warnings", "error")} for r in results],
        "colonnes_calculees": derived_log,
        "not_supported": plan.get("not_supported") or [],
    }


def run_write_llm(context: dict[str, Any]) -> tuple[ResultsText | None, list[str]]:
    system = PROMPT_PATH.read_text(encoding="utf-8")
    user = "## RÉSULTATS CALCULÉS\n" + json.dumps(context, ensure_ascii=False, default=str)
    allowed = allowed_numbers(context)
    n_tables = len(context.get("analyses") or [])

    def _post(out: ResultsText) -> tuple[ResultsText, list[str]]:
        bad = unknown_numbers(out, allowed, n_tables)
        if bad:
            raise ValueError("nombres absents des résultats : " + ", ".join(bad[:20])
                             + ". Recopie uniquement les chiffres fournis.")
        return out, [f"{len(out.sections)} section(s) rédigée(s), chiffres contrôlés"]

    out, notes = call_and_validate(system, user, ResultsText, post=_post)
    return out, ["Rédaction IA : " + n for n in notes]
