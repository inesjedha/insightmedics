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

# 2 183 · 86,1 · 0,05 · −3 · 1 000 (espaces simples, insécables ou fines comme séparateurs)
_NUMBER_RE = re.compile(r"(?<![\w,.])[−-]?\d{1,3}(?:[   ]\d{3})+(?:,\d+)?"
                        r"|(?<![\w,.])[−-]?\d+(?:[.,]\d+)?")
# Expressions dont les nombres ne sont pas des résultats : retirées avant le contrôle.
_FIXED_RE = re.compile(r"(?:IC|intervalle de confiance)\s*(?:à\s*)?95\s*%|"
                       r"(?:Tableau|Figure)\s+\d+|seuil[^.]{0,40}?0,05|p\s*[<≤]\s*0,05\b",
                       re.IGNORECASE)
_SP = "[   ]*"
# « 31/36 (86,1 %) », « 31 patients sur 36 (86,1 %) », « 3 (8,3 %) »
_TRIPLE_RE = re.compile(rf"(\d+){_SP}(?:/|(?:patients?|cas|lignes?)?{_SP}sur){_SP}(\d+){_SP}"
                        rf"\({_SP}(\d+(?:,\d+)?){_SP}%")
_PAIR_RE = re.compile(rf"(?<![/\d])(\d+){_SP}(?:patients?|cas)?{_SP}\({_SP}(\d+(?:,\d+)?){_SP}%")
# « p = 0,120 », « p < 0,001 »
_P_RE = re.compile(rf"\bp{_SP}([=<>≤≥]){_SP}(\d+,\d+)")


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
    return {normalize(m) for m in _NUMBER_RE.findall(_FIXED_RE.sub(" ", text))}


def _texts(out: ResultsText) -> list[str]:
    return [out.methods_paragraph, out.flow_paragraph,
            *(p for s in out.sections for p in [*s.paragraphs, s.table_title, s.heading])]


def allowed_numbers(context: Any) -> set[str]:
    """Tous les nombres présents dans les résultats (tableaux, faits, flux, titres)."""
    found = {normalize(m) for m in _NUMBER_RE.findall(
        json.dumps(context, ensure_ascii=False, default=str))}
    # Un nombre négatif est aussi permis sous sa forme positive (« diminution de 3 »).
    return found | {n.lstrip("-") for n in found} | {"0.05"}


def unknown_numbers(out: ResultsText, allowed: set[str]) -> list[str]:
    """Nombres du texte absents des résultats (hors « IC 95 % », « Tableau N », seuil)."""
    bad: list[str] = []
    for text in _texts(out):
        for n in sorted(numbers_in(text)):
            if n not in allowed and n not in bad:
                bad.append(n)
    return bad


def _strings(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        return [s for v in value.values() for s in _strings(v)]
    if isinstance(value, list):
        return [s for v in value for s in _strings(v)]
    return []


def _p_key(text: str) -> str:
    """« < 0,001 » → « <0.001 » ; « 0,120 » ou « p = 0,120 » → « =0.12 »."""
    t = text.replace("p", "").strip()
    if t.startswith(("<", "≤")):
        return "<" + normalize(t.lstrip("<≤ ").strip())
    return "=" + normalize(t.lstrip("= ").strip())


def _facts(context: Any) -> tuple[set[tuple[str, str, str]], set[tuple[str, str]], set[str]]:
    """Ce que les résultats autorisent : (n, N, %), (n, %) et les p (« =0.12 », « <0.001 »)."""
    triples: set[tuple[str, str, str]] = set()
    pairs: set[tuple[str, str]] = set()
    pvalues: set[str] = {"<0.05"}
    for a in (context or {}).get("analyses") or []:
        for f in a.get("facts") or []:
            if not isinstance(f, dict):
                continue
            n = f.get("k", f.get("n"))
            big = f.get("n") if "k" in f else f.get("N")
            pc = f.get("pct")
            if n is not None and pc is not None:
                pairs.add((normalize(str(n)), normalize(str(pc))))
                if big is not None:
                    triples.add((normalize(str(n)), normalize(str(big)), normalize(str(pc))))
            for key in ("p", "p_brut", "p_ajuste"):
                if isinstance(f.get(key), str) and f[key] not in ("—", ""):
                    pvalues.add(_p_key(f[key]))
        table = a.get("table") or {}
        p_cols = [i for i, c in enumerate(table.get("columns") or []) if str(c).strip() == "p"]
        for row in table.get("rows") or []:
            for i in p_cols:
                if i < len(row) and row[i] and row[i] != "—":
                    pvalues.add(_p_key(str(row[i])))
    for s in _strings(context):
        for k, big, pc in _TRIPLE_RE.findall(s):
            triples.add((k, big, normalize(pc)))
            pairs.add((k, normalize(pc)))
        for k, pc in _PAIR_RE.findall(s):
            pairs.add((k, normalize(pc)))
        for op, val in _P_RE.findall(s):
            pvalues.add(("<" if op in "<≤" else "=") + normalize(val))
    return triples, pairs, pvalues


def inconsistencies(out: ResultsText, context: Any) -> list[str]:
    """Tout ce qui, dans le texte, ne correspond pas aux résultats calculés : nombres
    inconnus, effectif et pourcentage qui ne vont pas ensemble, p mal recopié."""
    triples, pairs, pvalues = _facts(context)
    problems = [f"nombre absent des résultats : {n}"
                for n in unknown_numbers(out, allowed_numbers(context))]
    for text in _texts(out):
        for k, big, pc in _TRIPLE_RE.findall(text):
            if (k, big, normalize(pc)) not in triples:
                problems.append(f"« {k}/{big} ({pc} %) » ne correspond à aucun résultat")
        for k, pc in _PAIR_RE.findall(_TRIPLE_RE.sub(" ", text)):
            if (k, normalize(pc)) not in pairs:
                problems.append(f"« {k} ({pc} %) » ne correspond à aucun résultat")
        for op, val in _P_RE.findall(text):
            key = ("<" if op in "<≤" else "=") + normalize(val)
            if key not in pvalues:
                problems.append(f"« p {op} {val} » ne correspond à aucun p calculé")
    return list(dict.fromkeys(problems))


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

    def _post(out: ResultsText) -> tuple[ResultsText, list[str]]:
        bad = inconsistencies(out, context)
        if bad:
            raise ValueError("; ".join(bad[:15]) + ". Recopie uniquement les chiffres "
                             "fournis, en chiffres, avec leur effectif et leur p exacts.")
        return out, [f"{len(out.sections)} section(s) rédigée(s), chiffres contrôlés"]

    out, notes = call_and_validate(system, user, ResultsText, post=_post)
    return out, ["Rédaction IA : " + n for n in notes]
