"""Contre-audit de la base corrigée : ce qui a changé depuis l'audit.

Le profiling de l'audit est rejoué sur la base renvoyée par l'étudiant, puis comparé :
effectif, lignes recopiées, fiche vierge, données manquantes ; et, pour chaque entrée de
la liste de vérification de l'audit qui vise une colonne et une ligne précises, la
valeur d'avant et celle d'aujourd'hui. Aucun jugement : « modifiée », « inchangée » ou
« introuvable », à relire par l'équipe."""

from __future__ import annotations

import re
from typing import Any

import pandas as pd

from ..pipeline.client_view import _norm_id
from ..pipeline.summary import copies_view, key_counts


def _canon(v: Any) -> str:
    """« 2 183 », 2183, « 2183.0 » → « 2183 » ; textes en minuscules sans espaces."""
    text = str(v).strip().lower().replace(" ", "").replace(" ", "")
    text = re.sub(r"^«|»$", "", text).strip("«» ")
    try:
        f = float(text.replace(",", "."))
        return str(int(f)) if f.is_integer() else str(f)
    except ValueError:
        return text


def _value_at(df: pd.DataFrame, id_col: str | None, rid: str, column: str) -> Any:
    if not id_col or id_col not in df.columns or column not in df.columns:
        return None
    hits = df[df[id_col].map(lambda v: _norm_id(v) if pd.notna(v) else "") == _norm_id(rid)]
    return None if hits.empty else hits.iloc[0][column]


def recheck(old_profiling: dict[str, Any] | None, old_assessment: dict[str, Any] | None,
            new_df: pd.DataFrame, new_profiling: dict[str, Any]) -> dict[str, Any]:
    before, after = key_counts(old_profiling), key_counts(new_profiling)
    id_col = (new_profiling.get("structure") or {}).get("id_column")
    items: list[dict[str, Any]] = []
    for c in (old_assessment or {}).get("checklist") or []:
        col, rids = c.get("colonne") or "", c.get("row_ids") or []
        if len(rids) != 1 or not col or col.lower() == "toutes":
            continue
        now = _value_at(new_df, id_col, rids[0], col)
        status = ("à vérifier à la main" if now is None
                  else "inchangée" if _canon(now) == _canon(c.get("valeur", ""))
                  else "modifiée")
        items.append({"patients": c.get("patients", ""), "colonne": col,
                      "avant": c.get("valeur", ""),
                      "maintenant": "" if now is None or pd.isna(now) else str(now),
                      "statut": status})
    return {
        "before": before, "after": after,
        "copies_after": copies_view(new_profiling),
        "checked_values": items,
        "columns_added": sorted(set(map(str, new_df.columns))
                                - {c.get("name") for c in (old_profiling or {}).get("columns") or []}),
    }
