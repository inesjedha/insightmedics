"""Règles de cohérence intégrées, ajoutées par le programme à celles de LLM-1.

Ce sont des contrôles certains, connus à l'avance, qu'il serait risqué de laisser au
modèle (formule à reconstituer à chaque audit). Ils sont exprimés dans le même DSL que
les règles de LLM-1 et exécutés par le même moteur : leurs violations comptent donc dans
le domaine 4 du score et remontent à LLM-2 comme les autres.

Contrôles actuels (proposés par Hamza, audit v2 d'Amine, 26/10/2026) :
- l'IGS II (SAPS II) ne peut pas être inférieur aux points apportés par le seul Glasgow
  (26 si < 6, 13 de 6 à 8, 7 de 9 à 10, 5 de 11 à 13, 0 à 14-15) ;
- l'APACHE II ne peut pas être inférieur à 15 − Glasgow (sa composante neurologique).
"""

from __future__ import annotations

import re
from typing import Any

import pandas as pd

GCS_RE = re.compile(r"glasgow|(?<![a-z])(gcs|gsc)(?![a-z])", re.I)
# Composantes du Glasgow (yeux, verbal, moteur) : ce ne sont pas le score total.
GCS_COMPONENT_RE = re.compile(r"yeux|oculaire|verbal|moteur|motric|eye|motor|(?<![a-z])[yvm]$", re.I)
IGS2_RE = re.compile(r"(?<![a-z])(igs|saps)\s*[-_ ]?\s*(ii|2)(?![a-z0-9])", re.I)
APACHE2_RE = re.compile(r"apache\s*[-_ ]?\s*(ii|2)(?![a-z0-9])", re.I)

# Points du Glasgow dans l'IGS II : (Glasgow strictement inférieur à, points minimum).
IGS2_GCS_POINTS = [(6, 26), (9, 13), (11, 7), (14, 5)]


def _descriptions(columns: list[dict],
                  dictionary: list[dict]) -> dict[str, tuple[str, str]]:
    """Par colonne : (nom + libellé SPSS, même texte + signification donnée par LLM-1)."""
    meaning = {d.get("name"): d.get("meaning") or "" for d in dictionary}
    out = {}
    for c in columns:
        core = " ".join(filter(None, [c["name"], c.get("spss_label") or ""]))
        out[c["name"]] = (core, f"{core} {meaning.get(c['name'], '')}".strip())
    return out


def _find(df: pd.DataFrame, texts: dict[str, tuple[str, str]], pattern: re.Pattern[str],
          lo: float, hi: float, exclude: re.Pattern[str] | None = None,
          min_max: float | None = None) -> str | None:
    """Première colonne numérique dont la description correspond et dont les valeurs
    restent dans les bornes du score (sinon ce n'est probablement pas ce score).
    L'exclusion ne porte que sur le nom et le libellé : la signification rédigée par le
    modèle peut citer les composantes d'un score total."""
    for name, (core, full) in texts.items():
        if name not in df.columns or not pattern.search(full):
            continue
        if exclude is not None and exclude.search(core):
            continue
        values = pd.to_numeric(df[name], errors="coerce").dropna()
        if not len(values) or values.between(lo, hi).mean() < 0.95:
            continue
        if min_max is not None and values.max() <= min_max:
            continue
        return name
    return None


def _cmp(op: str, col: str, value: float) -> dict[str, Any]:
    return {"op": op, "left": {"col": col}, "right": {"value": value}}


def severity_score_rules(df: pd.DataFrame, columns: list[dict],
                         dictionary: list[dict]) -> list[dict[str, Any]]:
    """Règles Glasgow ↔ IGS II / APACHE II, si les colonnes sont identifiables."""
    texts = _descriptions(columns, dictionary)
    # Un Glasgow total dépasse forcément 6 quelque part ; une composante (yeux 1-4,
    # verbal 1-5, moteur 1-6) jamais.
    gcs = _find(df, texts, GCS_RE, 3, 15, exclude=GCS_COMPONENT_RE, min_max=6)
    if gcs is None:
        return []
    rules: list[dict[str, Any]] = []
    igs = _find(df, texts, IGS2_RE, 0, 163)
    if igs is not None:
        rules.append({
            "id": "RB-IGS2-GCS",
            "description": f"L'IGS II ({igs}) ne peut pas être inférieur aux points apportés par "
                           f"le seul Glasgow ({gcs}) : 26 si < 6, 13 de 6 à 8, 7 de 9 à 10, "
                           "5 de 11 à 13",
            "severity": "major", "category": "clinical",
            "rule": {"op": "all", "rules": [
                {"op": "implies", "if": _cmp("lt", gcs, below), "then": _cmp("gte", igs, pts)}
                for below, pts in IGS2_GCS_POINTS]},
        })
    apache = _find(df, texts, APACHE2_RE, 0, 71)
    if apache is not None:
        rules.append({
            "id": "RB-APACHE2-GCS",
            "description": f"L'APACHE II ({apache}) ne peut pas être inférieur à 15 − Glasgow "
                           f"({gcs}), sa seule composante neurologique",
            "severity": "major", "category": "clinical",
            "rule": {"op": "all", "rules": [
                {"op": "implies", "if": _cmp("lte", gcs, g), "then": _cmp("gte", apache, 15 - g)}
                for g in range(3, 15)]},
        })
    return rules
