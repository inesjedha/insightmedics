"""Base d'analyse : corrections (nettoyage), colonnes calculées et exclusions du plan,
appliquées à une copie.

Rien n'est supprimé : chaque ligne garde `INCLUS_ANALYSE` (1/0) et son motif
d'exclusion, qui alimentent le diagramme de flux. Rien n'est inventé : une valeur
illisible ou non prévue devient manquante, et elle est comptée dans le journal.
"""

from __future__ import annotations

import re
from typing import Any

import numpy as np
import pandas as pd

from .clean import apply_corrections
from .expr import evaluate
from .plan import AnalysisPlan, Derived

INCLUDED = "INCLUS_ANALYSE"
REASON = "MOTIF_EXCLUSION"
_NUMBER_RE = re.compile(r"[-+]?\d+(?:[.,]\d+)?")
# « 1 200 », « 1 200,5 » : milliers séparés par une espace (simple, insécable ou fine).
_THOUSANDS_RE = re.compile(r"(?<!\d)(\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,](\d+))?(?!\d)")
_CENSORED_RE = re.compile(r"^\s*[<>≤≥]")


def _key(v: Any) -> str:
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v).strip().lower()


def _parse_number(s: pd.Series) -> tuple[pd.Series, dict[str, int]]:
    """« 10h » → 10, « 7 jours » → 7, « 2,5 » → 2.5. Une valeur notée « > 400 » ou
    « < 100 » n'est pas un chiffre : elle devient manquante, et elle est comptée."""
    if pd.api.types.is_numeric_dtype(s):
        return pd.to_numeric(s, errors="coerce"), {"censored": 0, "unreadable": 0}
    out, censored, unreadable = [], 0, 0
    for v in s.tolist():
        if v is None or (isinstance(v, float) and np.isnan(v)) or str(v).strip() == "":
            out.append(np.nan)
            continue
        text = str(v)
        if _CENSORED_RE.match(text):
            censored += 1
            out.append(np.nan)
            continue
        t = _THOUSANDS_RE.search(text)
        if t:
            text = text[:t.start()] + re.sub(r"[ \u00a0\u202f]", "", t.group(1)) \
                + (f".{t.group(2)}" if t.group(2) else "") + text[t.end():]
        found = _NUMBER_RE.findall(text)
        # Un seul nombre attendu : « 10-15 », « 2 ou 3 » sont ambigus, donc illisibles.
        if len(found) == 1:
            out.append(float(found[0].replace(",", ".")))
        else:
            unreadable += 1
            out.append(np.nan)
    return pd.Series(out, index=s.index, dtype="float64"), {"censored": censored,
                                                            "unreadable": unreadable}


def _derive(d: Derived, df: pd.DataFrame) -> tuple[pd.Series, dict[str, Any]]:
    note: dict[str, Any] = {}
    if d.kind == "formula":
        assert d.expr is not None
        out = evaluate(d.expr, df)
        if not isinstance(out, pd.Series):
            out = pd.Series(out, index=df.index)
        if out.dtype == "boolean":
            out = out.astype("Float64")  # vrai/faux → 1/0, manquant conservé
    elif d.kind == "recode":
        assert d.source is not None
        mapping = {_key(k): v for k, v in d.mapping.items()}
        src = df[d.source]
        out = src.map(lambda v: mapping.get(_key(v), np.nan) if pd.notna(v) else np.nan)
        unmapped = sorted({str(v) for v in src.dropna() if _key(v) not in mapping})
        if unmapped:
            note["valeurs_non_prevues"] = unmapped[:10]
            note["n_non_prevues"] = int(sum(_key(v) not in mapping for v in src.dropna()))
    elif d.kind == "bins":
        assert d.source is not None
        values = pd.to_numeric(df[d.source], errors="coerce")
        # Catégorie ordonnée : les tableaux suivent l'ordre des classes, pas l'alphabet.
        out = pd.cut(values, bins=d.cuts, labels=d.labels, right=False)
        outside = int((values.notna() & out.isna()).sum())
        if outside:
            note["hors_classes"] = outside
    elif d.kind == "parse_number":
        assert d.source is not None
        out, counts = _parse_number(df[d.source])
        note.update({k: v for k, v in counts.items() if v})
    else:  # pct_change
        base = pd.to_numeric(df[d.baseline], errors="coerce")
        follow = pd.to_numeric(df[d.follow_up], errors="coerce")
        out = (follow - base) / base.where(base != 0) * 100
    if d.type == "quantitative" and d.kind != "bins":
        converted = pd.to_numeric(out, errors="coerce")
        lost = int((out.notna() & converted.isna()).sum())
        if lost and d.kind in ("formula", "recode"):
            raise ValueError(f"colonne « {d.name} » : {lost} valeur(s) non numériques ; "
                             "déclarez-la qualitative (type categorical)")
        out = converted
    note["n_renseignes"] = int(out.notna().sum())
    return out, note


def prepare(df: pd.DataFrame, plan: AnalysisPlan,
            auto_exclusions: list[tuple[str, list[int]]] | None = None,
            first_line: int = 2,
            ) -> tuple[pd.DataFrame, list[dict[str, Any]], list[dict[str, Any]]]:
    """Retourne (base d'analyse complète, diagramme de flux, journal). Le journal liste
    les corrections (`step` = « correction ») puis les colonnes calculées (`step` =
    « derived »). `auto_exclusions` : motifs repérés par le code avant le plan (fiche
    vierge, lignes vides), en positions de ligne. `first_line` : numéro de la première
    ligne de données dans le fichier (2 dans Excel, 1 pour un cas SPSS)."""
    base, log = apply_corrections(df, plan.corrections, first_line)
    for d in plan.derived:
        series, note = _derive(d, base)
        base[d.name] = series
        log.append({"step": "derived", "name": d.name, "label": d.label, "kind": d.kind,
                    **note})

    included = pd.Series(True, index=base.index)
    reason = pd.Series("", index=base.index, dtype="object")
    flow: list[dict[str, Any]] = [{"label": "Lignes de la base", "n": len(base)}]
    steps: list[tuple[str, pd.Series]] = []
    for label, positions in auto_exclusions or []:
        mask = pd.Series(False, index=base.index)
        mask.iloc[[p for p in positions if p < len(base)]] = True
        steps.append((label, mask))
    for e in plan.population.exclusions:
        res = evaluate(e.expr, base)
        mask = (res if isinstance(res, pd.Series)
                else pd.Series(bool(res), index=base.index)).astype("boolean").fillna(False)
        steps.append((e.label, mask.astype(bool)))
    for label, mask in steps:
        newly = mask & included
        reason[newly] = label
        included &= ~mask
        flow.append({"label": label, "excluded": int(newly.sum()),
                     "remaining": int(included.sum())})
    flow.append({"label": "Patients analysés", "n": int(included.sum()),
                 "excluded_total": int((~included).sum())})
    base[INCLUDED] = included.astype(int)
    base[REASON] = reason
    return base, flow, log


def analysed(base: pd.DataFrame) -> pd.DataFrame:
    """Les lignes incluses dans l'analyse."""
    return base[base[INCLUDED] == 1]


def first_data_line(profiling: dict[str, Any]) -> int:
    """Numéro de la première ligne de données : 1 pour un cas SPSS, 2 dans Excel ou CSV
    (même convention que la liste de vérification de l'audit)."""
    return 1 if (profiling.get("file") or {}).get("format") == "sav" else 2


def dry_run(df: pd.DataFrame, plan: AnalysisPlan, first_line: int = 2) -> list[str]:
    """Applique le plan à blanc (colonnes calculées et exclusions) ; retourne les erreurs
    (colonne déclarée quantitative qui contient du texte, expression invalide…)."""
    try:
        prepare(df, plan, first_line=first_line)
    except ValueError as exc:  # ExprError hérite de ValueError
        return [str(exc)]
    return []
