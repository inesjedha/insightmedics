"""Mise en forme des textes de LLM-2 destinés à l'étudiant.

Le prompt fixe des longueurs et interdit le jargon interne ; ce module est le filet de
sécurité côté code, appliqué après validation :
- retire les codes internes entre parenthèses (« (F02) », « (voir R018) ») et remplace les
  expressions de travail (« décision client n° 3 », « le dictionnaire », « medium ») ;
- retire les phrases de trop d'un texte trop long, sans jamais couper une phrase.

Les plafonds sont un peu plus larges que ceux du prompt : ils ne doivent couper qu'un texte
qui déborde nettement, pas réécrire chaque réponse.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel

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
    # Mots à remplacer du bilan client v3 de Hamza (formes sûres seulement)
    (re.compile(r"\bcritère composite\b"), "critère qui combine plusieurs éléments"),
    (re.compile(r"\b[Ll]a ligne[- ]modèle\b"), "la fiche vierge restée dans le tableau"),
    (re.compile(r"\b[Dd]e façon opérationnelle\b"), "précisément"),
    (re.compile(r"\bopérationnellement\b"), "précisément"),
    (re.compile(r"\bvariables dérivées\b"), "colonnes calculées"),
    (re.compile(r"\bvariable dérivée\b"), "colonne calculée"),
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


_SENTENCE_RE = re.compile(r"[^.!?]+(?:[.!?]+|$)")


def shorten(text: str | None, max_words: int) -> str:
    """Garde des phrases entières tant qu'on reste sous `max_words` mots.

    Ne coupe JAMAIS au milieu d'une phrase (une phrase coupée a l'air d'un bug) : si la
    première phrase dépasse à elle seule le plafond, elle est gardée entière. Le prompt
    impose les longueurs ; ce filet ne retire que des phrases de trop.
    """
    text = clean(text)
    if len(text.split()) <= max_words:
        return text
    kept: list[str] = []
    n_words = 0
    for sentence in (s.strip() for s in _SENTENCE_RE.findall(text)):
        if not sentence:
            continue
        n = len(sentence.split())
        if kept and n_words + n > max_words:
            break
        kept.append(sentence)
        n_words += n
    return " ".join(kept)


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
    out.missions = out.missions[:8]  # triées et ramenées à 5 par sync_missions
    for m in out.missions:
        m.title = shorten(m.title, 14)
        m.vu = shorten(m.vu, 50)
        m.pourquoi = shorten(m.pourquoi, 35)
        m.a_faire = _short_list(m.a_faire, 4, 25)
        m.a_rouvrir = shorten(m.a_rouvrir, 12)
        m.qui = shorten(m.qui, 6)
        m.termine_quand = shorten(m.termine_quand, 25)
        m.refs = _short_list(m.refs, 6, 4)
    out.deja_en_ordre = _short_list(out.deja_en_ordre, 4, 25)
    out.nous_corrigeons = _short_list(out.nous_corrigeons, 5, 25)
    out.le_saviez_vous = shorten(out.le_saviez_vous, 60)
    out.lexique = [e for e in out.lexique[:5] if e.mot.strip()]
    for e in out.lexique:
        e.sens = shorten(e.sens, 25)
    out.highlights = out.highlights[:3]
    for h in out.highlights:
        h.title = shorten(h.title, 16)
        h.detail = shorten(h.detail, 35)
    out.checklist = out.checklist[:40]
    for c in out.checklist:
        c.patients = shorten(c.patients, 8)
        c.check = shorten(c.check, 20)
        c.colonne = shorten(c.colonne, 10)
        c.valeur = shorten(c.valeur, 10)
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
        d.choices = d.choices[:3]
        for ch in d.choices:
            ch.label = shorten(ch.label, 25)
            ch.consequence = shorten(ch.consequence, 30)
    if out.exploitability_verdict is not None:
        out.exploitability_verdict.label = shorten(out.exploitability_verdict.label, 12)
        out.exploitability_verdict.justification_fr = shorten(
            out.exploitability_verdict.justification_fr, 56)
    out.executive_summary_fr = shorten(out.executive_summary_fr, 110)
    for p in out.pii_assessment:
        p.recommendation_fr = shorten(p.recommendation_fr, 35)
    return out


def identifying_values(df: Any, profiling: dict) -> set[str]:
    """Valeurs des colonnes identifiantes qui pourraient se glisser dans un texte : numéros
    de dossier, téléphones, identifiant retenu s'il est lui-même identifiant. Seules les
    valeurs contenant un chiffre (et d'au moins 4 caractères) sont retenues, pour ne pas
    masquer des mots ordinaires (des initiales comme « Age » ou « Mra »)."""
    cols = {p["column"] for p in profiling.get("pii_candidates") or []}
    values: set[str] = set()
    for c in cols:
        if c not in df.columns:
            continue
        for v in df[c].dropna().astype(str).str.strip().unique():
            if len(v) >= 4 and any(ch.isdigit() for ch in v):
                values.add(v)
    return values


# Numéro de dossier hospitalier au format « 220/2026 » : masqué même s'il n'est dans
# aucune colonne repérée comme identifiante (contrôle demandé par Hamza, bilan v3).
_DOSSIER_RE = r"(?<![\w/])\d{3,}/(?:19|20)\d\d(?![\w/])"


def redact_output(out: Llm2Output, secrets: set[str]) -> Llm2Output:
    """Remplace dans tous les textes de LLM-2 chaque valeur identifiante, et tout numéro
    de dossier au format « 220/2026 », par « [masqué] » (en place)."""
    alternatives = [rf"(?<![\w/]){re.escape(s)}(?![\w/])"
                    for s in sorted(secrets, key=len, reverse=True)] + [_DOSSIER_RE]
    pattern = re.compile("|".join(alternatives))

    def scrub(value: Any) -> Any:
        if isinstance(value, str):
            return pattern.sub("[masqué]", value)
        if isinstance(value, list):
            return [scrub(v) for v in value]
        if isinstance(value, BaseModel):
            for name in type(value).model_fields:
                setattr(value, name, scrub(getattr(value, name)))
            return value
        return value

    scrub(out)
    return out


_DOSSIER_PATTERN = re.compile(_DOSSIER_RE)


def mask_dossier_numbers(value: Any) -> Any:
    """Copie de `value` (dict, liste, texte) où tout numéro de dossier au format
    « 220/2026 » est remplacé par « [masqué] ». Appliqué aussi à la lecture : les audits
    produits avant ce filet en contiennent parfois."""
    if isinstance(value, str):
        return _DOSSIER_PATTERN.sub("[masqué]", value)
    if isinstance(value, list):
        return [mask_dossier_numbers(v) for v in value]
    if isinstance(value, dict):
        return {k: mask_dossier_numbers(v) for k, v in value.items()}
    return value
