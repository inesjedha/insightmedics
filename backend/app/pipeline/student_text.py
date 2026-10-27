"""Mise en forme des textes de LLM-2 destinés à l'étudiant.

Le prompt fixe des longueurs et interdit le jargon interne ; ce module est le filet de
sécurité côté code, appliqué après validation :
- retire les codes internes entre parenthèses (« (F02) », « (voir R018) ») et remplace les
  expressions de travail (« décision client n° 3 », « le dictionnaire », « medium ») ;
- coupe un texte trop long, de préférence à la fin d'une phrase.

Les plafonds sont un peu plus larges que ceux du prompt : ils ne doivent couper qu'un texte
qui déborde nettement, pas réécrire chaque réponse.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from .llm2 import Llm2Output

_CODE = r"(?:[FRC]\d{2,3}|op\d{1,3})"
# « (F02) », « (voir F24) », « (R003, R005 à R007) »
_PAREN_CODES_RE = re.compile(
    rf"\s*\((?:voir\s+|opérations?\s+|règles?\s+)?{_CODE}(?:\s*(?:,|et|à|–|-)\s*(?:{_CODE}|\d{{2,3}}))*\)")
# « opérations C01 à C09, » en tête d'une parenthèse : on garde la suite de la parenthèse
_PAREN_OPS_PREFIX_RE = re.compile(
    r"\(opérations?\s+C\d{2}(?:\s*(?:à|–|-|,|et)\s*C\d{2})*\s*,\s*")
# « les opérations C01 à C09 » dans une phrase : remplacé par une formule lisible
_OPS_RE = re.compile(r"\bopérations?\s+C\d{2}(?:\s*(?:à|–|-|,|et)\s*C\d{2})*")
_REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bdécisions? client (n°|no)", re.I), r"question \1"),
    (re.compile(r"\bdécisions? client\b", re.I), "question"),
    (re.compile(r"\bSelon le dictionnaire,\s*"), ""),
    (re.compile(r"\bLe dictionnaire\b"), "L'audit"),
    (re.compile(r"\ble dictionnaire\b"), "l'audit"),
    (re.compile(r"\bdu dictionnaire\b"), "de l'audit"),
    (re.compile(r"«\s*medium\s*»|\bmedium\b"), "moyenne"),
    (re.compile(r"«\s*high\s*»"), "élevée"),
    (re.compile(r"«\s*low\s*»"), "faible"),
]
_SPACE_BEFORE_PUNCT_RE = re.compile(r" +([,.)])")
_MULTI_SPACE_RE = re.compile(r"[ \t]{2,}")


def clean(text: str | None) -> str:
    """Retire le jargon interne d'un texte."""
    if not text:
        return ""
    # Un code isolé au milieu d'une phrase n'est pas retiré (la phrase deviendrait
    # bancale) : le prompt les interdit, ce filet ne traite que les formes sûres.
    out = _PAREN_CODES_RE.sub("", text)
    out = _PAREN_OPS_PREFIX_RE.sub("(", out)
    out = _OPS_RE.sub("opérations de nettoyage proposées", out)
    for pattern, repl in _REPLACEMENTS:
        out = pattern.sub(repl, out)
    out = _SPACE_BEFORE_PUNCT_RE.sub(r"\1", out)
    out = _MULTI_SPACE_RE.sub(" ", out)
    return out.strip()


def shorten(text: str | None, max_words: int) -> str:
    """Coupe à `max_words` mots, à la dernière fin de phrase si elle garde l'essentiel."""
    text = clean(text)
    words = text.split()
    if len(words) <= max_words:
        return text
    cut = " ".join(words[:max_words])
    end = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
    if cut.endswith((".", "!", "?")):
        return cut
    if end >= 0 and len(cut[: end + 1].split()) >= 0.6 * max_words:
        return cut[: end + 1]
    return cut.rstrip(",;:– ") + "…"


def _short_list(items: list[str], max_items: int, max_words: int) -> list[str]:
    return [s for s in (shorten(i, max_words) for i in items[:max_items]) if s]


def tidy_output(out: Llm2Output) -> Llm2Output:
    """Applique nettoyage et plafonds à tous les textes lus par l'étudiant (en place)."""
    if out.headline is not None:
        out.headline.title = shorten(out.headline.title, 12)
        out.headline.subtitle = shorten(out.headline.subtitle, 56)
    out.blocking_points = out.blocking_points[:3]
    for bp in out.blocking_points:
        bp.title = shorten(bp.title, 16)
        bp.what = shorten(bp.what, 60)
        bp.why = shorten(bp.why, 35)
        bp.todo = shorten(bp.todo, 35)
        bp.refs = _short_list(bp.refs, 6, 4)
    amap = out.analysis_map
    amap.realisable = _short_list(amap.realisable, 6, 18)
    amap.avec_reserves = _short_list(amap.avec_reserves, 6, 18)
    amap.apres_decisions = _short_list(amap.apres_decisions, 6, 18)
    amap.impossible = _short_list(amap.impossible, 6, 18)
    for f in out.findings:
        f.title_fr = shorten(f.title_fr, 16)
        f.explanation_fr = shorten(f.explanation_fr, 56)
        f.check_fr = shorten(f.check_fr, 16)
        f.rows_fr = shorten(f.rows_fr, 12)
        if f.proposed_correction:
            f.proposed_correction = shorten(f.proposed_correction, 35)
    for d in out.client_decisions:
        d.question_fr = shorten(d.question_fr, 45)
        d.options = _short_list(d.options, 5, 9)
        d.consequence_fr = shorten(d.consequence_fr, 45)
        d.recommendation_fr = shorten(d.recommendation_fr, 45)
    if out.exploitability_verdict is not None:
        out.exploitability_verdict.label = shorten(out.exploitability_verdict.label, 12)
        out.exploitability_verdict.justification_fr = shorten(
            out.exploitability_verdict.justification_fr, 56)
    out.executive_summary_fr = shorten(out.executive_summary_fr, 110)
    for p in out.pii_assessment:
        p.recommendation_fr = shorten(p.recommendation_fr, 35)
    return out
