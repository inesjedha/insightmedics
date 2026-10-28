"""Contrôles avant livraison, automatisés (prompts de Dr Hamza, § 14 et `03_Livrables`
§ 8) : termes proscrits, restes de calcul, traces de travail, mentions à confirmer.

Deux niveaux : « error » bloque la livraison (un outil de programmation cité, un « nan »
resté dans le texte) ; « warn » est signalé au relecteur, qui juge (« erreur » peut être
un terme médical : « erreur diagnostique »).
"""

from __future__ import annotations

import re
from typing import Any, Literal

from pydantic import BaseModel


class Check(BaseModel):
    level: Literal["error", "warn"]
    message: str


# Outils et traces de travail : jamais dans un livrable (erreur).
_TOOLS = ["python", "pandas", "statsmodels", "scipy", "matplotlib", "openpyxl", "numpy",
          "script", "chatgpt"]
# Mots de correction de base : la trace reste interne (avertissement : peut être médical).
_TRACES = ["corrigé", "corrigée", "reclassé", "recodé", "doublon", "aberrant", "aberrante",
           "incohérence", "imputé", "imputée", "erreur de saisie"]
# Statistiques et style (§ 9.5).
_STATS_FR = ["tendance", "marginalement significatif", "hautement significatif", "prouve",
             "démontre", "entraîne", "favorise", "protège"]
_STYLE_FR = ["crucial", "cruciale", "essentiel", "essentielle", "joue un rôle",
             "souligne l'importance", "souligne l’importance", "met en lumière", "s'inscrit dans",
             "s’inscrit dans", "témoigne", "révèle", "non seulement", "follow-up", "design",
             "outcome", "flatus"]
_STATS_EN = ["trend", "marginally significant", "highly significant", "proves", "demonstrates"]
_CONTRACTIONS = re.compile(r"\b(de le|de les|à le|à les)\b", re.IGNORECASE)
_LEFTOVERS = re.compile(r"\bnan\b|\bNone\b|\{\{|\}\}|\{|\}|\b0,000\b|\b0\.000\b")


def _find(words: list[str], text: str) -> list[str]:
    low = text.lower()
    return [w for w in words if re.search(rf"(?<![\w-]){re.escape(w)}(?![\w-])", low)]


def forbidden_terms(text: str, lang: str = "fr") -> list[str]:
    """Termes à proscrire trouvés (outils, statistiques, style) : utilisé pour refuser un
    brouillon de l'IA avant même la mise en page."""
    found = _find(_TOOLS, text)
    if lang == "en":
        return found + _find(_STATS_EN, text)
    found += _find(_STATS_FR + _STYLE_FR, text)
    if "—" in text:
        found.append("— (tiret cadratin)")
    return found


def check_text(paragraphs: list[str], lang: str = "fr") -> list[Check]:
    """Contrôles sur le texte final du livrable (corps et tableaux)."""
    text = "\n".join(paragraphs)
    checks: list[Check] = []
    for word in _find(_TOOLS, text):
        checks.append(Check(level="error", message=f"outil ou trace de travail cité : « {word} »"))
    leftover = _LEFTOVERS.search(text)
    if leftover:
        checks.append(Check(level="error",
                            message=f"reste de calcul dans le texte : « {leftover.group(0)} »"))
    for word in _find(_TRACES, text):
        checks.append(Check(level="warn",
                            message=f"mot de correction de base : « {word} » (la trace reste "
                                    "interne ; garder seulement si c'est un terme médical)"))
    words = _STATS_EN if lang == "en" else _STATS_FR + _STYLE_FR
    for word in _find(words, text):
        checks.append(Check(level="warn", message=f"terme proscrit : « {word} »"))
    if lang == "fr":
        for found in sorted({c.group(0).lower() for c in _CONTRACTIONS.finditer(text)}):
            checks.append(Check(level="warn", message=f"contraction oubliée : « {found} »"))
        if "—" in text:
            checks.append(Check(level="warn", message="tiret cadratin (—) dans le texte"))
    else:
        if re.search(r"\d,\d", text):
            checks.append(Check(level="error", message="virgule décimale dans un texte anglais"))
    if re.search(r"[^\s] {2,}[^\s]", text):
        checks.append(Check(level="warn", message="double espace"))
    if re.search(r"\s[,.](?!\d)", text):
        checks.append(Check(level="warn", message="espace avant une virgule ou un point"))
    pending = re.findall(r"\[(?:À CONFIRMER|À COMPLÉTER|TO BE CONFIRMED)[^\]]*\]", text)
    if pending:
        checks.append(Check(level="warn",
                            message=f"{len(pending)} mention(s) à confirmer avec l'étudiant : "
                                    + " ; ".join(dict.fromkeys(pending))[:400]))
    return checks


def blocking(checks: list[Check] | list[dict[str, Any]]) -> bool:
    return any((c.level if isinstance(c, Check) else c.get("level")) == "error" for c in checks)
