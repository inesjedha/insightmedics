"""Étape 2 — PROFILE : profiling déterministe (jalon M2).

Implémente les checks des phases 2, 4, 5 et 6 du prompt maître qui sont
calculables sans IA. Sortie : dict `profiling` (voir doc d'architecture §6.1).
Aucune modification des données : tout est calculé sur des copies.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from typing import Any

import numpy as np
import pandas as pd

# Codes fréquemment utilisés comme "valeur manquante" non déclarée (§13).
SUSPECT_NUMERIC_CODES = [9, 99, 999, 9999, -1, -9, -99]
SUSPECT_TEXT_CODES = {"na", "n/a", "nd", "nr", "inconnu", "non applicable", "-", "?", ""}

ID_NAME_RE = re.compile(r"(?:^|_)(id|num|matricule|dossier|identifiant|patient)(?:_|$|\d)", re.I)
PII_NAME_RE = {
    "name": re.compile(r"\b(nom|prenom|prénom|initiales?)\b", re.I),
    "phone": re.compile(r"\b(tel|téléphone|telephone|gsm|portable)\b", re.I),
    "email": re.compile(r"\b(mail|email|courriel)\b", re.I),
    "address": re.compile(r"\b(adresse)\b", re.I),
    "national_id": re.compile(r"\b(cin|cnss|passeport)\b", re.I),
    "birth_date": re.compile(r"\b(date.{0,3}naissance|ddn)\b", re.I),
}
SEX_NAME_RE = re.compile(r"(?:^|_)(sexe?|genre|gender)(?:_|$)", re.I)
PHONE_CONTENT_RE = re.compile(r"^\+?\d[\d\s.-]{7,14}$")
EMAIL_CONTENT_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-z]{2,}$", re.I)

# Doublons avancés (phase 2 du prompt d'audit v2) : une ligne doit porter au moins ce
# nombre de valeurs hors identifiant pour être comparée, sinon deux lignes presque vides
# passeraient pour des copies.
MIN_FILLED_FOR_COPY = 5
MAX_EXAMPLES = 10

# Fonction qui traduit un masque ou un index de lignes en identifiants (au plus 20).
RowIds = Callable[[Any], list]


def _py(v: Any) -> Any:
    """Convertit les types numpy en types JSON-sérialisables."""
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return None if np.isnan(v) else round(float(v), 4)
    if isinstance(v, np.bool_):
        return bool(v)
    return v


def _detect_id_column(df: pd.DataFrame) -> str | None:
    # Une colonne au nom d'identifiant reste l'identifiant même si elle contient
    # des doublons : c'est précisément une anomalie à signaler, pas à masquer.
    candidates = [c for c in df.columns if ID_NAME_RE.search(str(c))]
    best, best_ratio = None, 0.0
    for c in candidates:
        s = df[c].dropna()
        ratio = s.nunique() / len(s) if len(s) else 0.0
        if ratio > best_ratio:
            best, best_ratio = str(c), ratio
    if best and best_ratio >= 0.5:
        return best
    # Repli : première colonne strictement unique
    first = df.columns[0]
    s = df[first].dropna()
    if len(s) and s.nunique() == len(s):
        return str(first)
    return None


def _stat_type(s: pd.Series, value_labels: dict | None) -> str:
    if pd.api.types.is_datetime64_any_dtype(s):
        return "date"
    if pd.api.types.is_numeric_dtype(s):
        nun = s.nunique(dropna=True)
        if value_labels:
            return "binary" if nun <= 2 else "nominal"
        if nun <= 2:
            return "binary"
        if nun <= 10 and (s.dropna() % 1 == 0).all():
            return "discrete"
        return "continuous"
    nun = s.nunique(dropna=True)
    if nun <= 2:
        return "binary"
    return "nominal" if nun <= max(20, 0.05 * len(s)) else "text"


def _suspect_missing_codes(s: pd.Series, declared: Any) -> list:
    found: list[Any] = []
    if pd.api.types.is_numeric_dtype(s):
        vals = s.dropna()
        if len(vals) == 0:
            return found
        for code in SUSPECT_NUMERIC_CODES:
            n = int((vals == code).sum())
            # Suspect si présent ET nettement hors de la distribution du reste
            if n > 0:
                rest = vals[vals != code]
                if len(rest) and (code > rest.quantile(0.99) * 1.5 or code < 0 <= rest.min()):
                    found.append(code)
    else:
        lowered = s.dropna().astype(str).str.strip().str.lower()
        for text_code in sorted(SUSPECT_TEXT_CODES - {""}):
            if (lowered == text_code).any():
                found.append(text_code)
    return found


def _numeric_flags(s: pd.Series) -> list[str]:
    flags = []
    if s.dtype == object:
        stripped = s.dropna().astype(str).str.strip()
        if len(stripped):
            as_num = pd.to_numeric(stripped.str.replace(",", ".", regex=False), errors="coerce")
            if as_num.notna().mean() > 0.8:
                flags.append("numeric_stored_as_text")
            if (stripped != s.dropna().astype(str)).any():
                flags.append("leading_trailing_whitespace")
    return flags


def _row_hash(frame: pd.DataFrame) -> pd.Series:
    """Empreinte de chaque ligne (valeurs manquantes comprises), pour comparer des lignes."""
    as_text = frame.astype(object).where(frame.notna(), "__na__").astype(str)
    return pd.util.hash_pandas_object(as_text, index=False)


def _id_conflicts(df: pd.DataFrame, id_col: str) -> dict[str, Any]:
    """Identifiants répétés : lignes identiques (vrai doublon) ou profils différents
    (probablement deux patients sous un même numéro)."""
    repeated = df[df[id_col].notna() & df[id_col].duplicated(keep=False)]
    n_identical, n_conflicts = 0, 0
    examples: list[dict[str, Any]] = []
    for id_value, group in repeated.groupby(id_col, sort=False):
        others = group.drop(columns=[id_col])
        differing = [str(c) for c in others.columns if others[c].nunique(dropna=False) > 1]
        if not differing:
            n_identical += 1
            continue
        n_conflicts += 1
        if len(examples) < MAX_EXAMPLES:
            examples.append({"id": _py(id_value), "n_rows": len(group),
                             "n_differing_columns": len(differing),
                             "differing_columns": differing[:8]})
    return {"id_conflicts": {"n_ids": n_conflicts, "examples": examples},
            "same_id_identical_rows": n_identical}


def _same_profile_different_ids(df: pd.DataFrame, id_col: str | None,
                                row_ids: RowIds) -> dict[str, Any]:
    """Identifiants différents mais même date de naissance, même sexe et mêmes dates :
    doublon possible, à vérifier au dossier. Non évaluable sans date de naissance ni au
    moins deux autres dates."""
    dob = [c for c in df.columns if PII_NAME_RE["birth_date"].search(str(c))][:1]
    sex = [c for c in df.columns if SEX_NAME_RE.search(str(c))][:1]
    dates = [c for c in df.columns
             if pd.api.types.is_datetime64_any_dtype(df[c]) and c not in dob]
    if not dob and len(dates) < 2:
        return {"key_columns": [], "n_groups": 0, "n_rows": 0, "examples": []}
    key = dob + sex + dates
    usable = df[dob[0]].notna() if dob else df[dates].notna().sum(axis=1) >= 2
    hashes = _row_hash(df[key])[usable]
    body = df.drop(columns=[id_col]) if id_col else df
    groups = []
    for _, idx in hashes.groupby(hashes).groups.items():
        if len(idx) < 2:
            continue
        if id_col and df.loc[idx, id_col].nunique(dropna=True) < 2:
            continue  # même identifiant : déjà couvert par id_conflicts
        if body.loc[idx].duplicated(keep=False).all():
            continue  # lignes identiques (hors identifiant) : déjà couvertes par _copies
        groups.append(idx)
    return {"key_columns": [str(c) for c in key], "n_groups": len(groups),
            "n_rows": sum(len(g) for g in groups),
            "examples": [{"row_ids": row_ids(g)} for g in groups[:MAX_EXAMPLES]]}


def _copies(df: pd.DataFrame, id_col: str | None, row_ids: RowIds) -> dict[str, Any]:
    """Lignes identiques sauf l'identifiant, et blocs de lignes consécutives recopiés."""
    body = df.drop(columns=[id_col]) if id_col else df
    filled = body.notna().sum(axis=1) >= MIN_FILLED_FOR_COPY
    hashes = _row_hash(body)[filled]
    hashes = hashes[hashes.duplicated(keep=False)]

    identical: list[pd.Index] = []
    pairs: set[tuple[int, int]] = set()
    pos = {label: i for i, label in enumerate(df.index)}
    for _, idx in hashes.groupby(hashes).groups.items():
        if id_col and df.loc[idx, id_col].nunique(dropna=True) >= 2:
            identical.append(idx)
        p = sorted(pos[i] for i in idx)[:50]
        pairs.update((a, b - a) for k, a in enumerate(p) for b in p[k + 1:])

    # Bloc = au moins 2 lignes consécutives qui reproduisent, avec le même décalage,
    # une suite de lignes consécutives située plus haut.
    blocks: list[dict[str, Any]] = []
    for a, d in sorted(pairs):
        if (a - 1, d) in pairs:
            continue  # pas le début d'un bloc
        length = 1
        while (a + length, d) in pairs:
            length += 1
        if length >= 2:
            blocks.append({"length": length,
                           "source_lines": [a + 1, a + length],
                           "copy_lines": [a + d + 1, a + d + length]})
    blocks.sort(key=lambda b: b["length"], reverse=True)
    return {
        "identical_except_id": {"n_groups": len(identical),
                                "n_rows": sum(len(g) for g in identical),
                                "examples": [{"row_ids": row_ids(g)}
                                             for g in identical[:MAX_EXAMPLES]]},
        "copied_blocks": blocks[:MAX_EXAMPLES],
    }


def profile(df: pd.DataFrame, meta: dict[str, Any]) -> dict[str, Any]:
    n_rows, n_cols = len(df), len(df.columns)
    labels = meta.get("spss_column_labels", {})
    value_labels_all = meta.get("spss_value_labels", {})
    declared_missing = meta.get("spss_missing_ranges", {})

    id_col = _detect_id_column(df)
    ids = df[id_col] if id_col else pd.Series(range(n_rows))

    def row_ids(mask_or_index) -> list:
        idx = mask_or_index if isinstance(mask_or_index, pd.Index) else df.index[mask_or_index]
        return [_py(v) for v in ids.loc[idx].head(20).tolist()]

    # --- Structure ---
    exact_dup_mask = df.duplicated(keep=False)
    dup_ids = 0
    if id_col:
        dup_ids = int(df[id_col].dropna().duplicated().sum())
    empty_cols = [str(c) for c in df.columns if df[c].isna().all()]
    constant_cols = [
        str(c) for c in df.columns if c not in empty_cols and df[c].dropna().nunique() == 1
    ]
    near_constant = []
    for c in df.columns:
        s = df[c].dropna()
        if len(s) > 10 and str(c) not in constant_cols:
            top_pct = s.value_counts(normalize=True).iloc[0] * 100
            if top_pct >= 95:
                near_constant.append({"col": str(c), "dominant_pct": round(float(top_pct), 1)})
    # Colonnes au contenu strictement identique sous deux noms (§9)
    dup_col_mask = df.T.duplicated(keep=False)
    duplicated_columns: list[list[str]] = []
    if dup_col_mask.any():
        groups: dict[int, list[str]] = {}
        for c in df.columns[dup_col_mask]:
            key = hash(tuple(df[c].fillna("__na__").astype(str).tolist()))
            groups.setdefault(key, []).append(str(c))
        duplicated_columns = [g for g in groups.values() if len(g) >= 2]

    # Lignes vides (aucune valeur hors identifiant), fréquentes en fin de .sav ou d'Excel.
    body = df.drop(columns=[id_col]) if id_col else df
    empty_row_pos = [i + 1 for i, empty in enumerate(body.isna().all(axis=1)) if empty]

    advanced_dups: dict[str, Any] = {}
    if id_col:
        advanced_dups.update(_id_conflicts(df, id_col))
    advanced_dups["same_profile_different_ids"] = _same_profile_different_ids(df, id_col, row_ids)
    advanced_dups.update(_copies(df, id_col, row_ids))

    structure = {
        "n_rows": n_rows,
        "n_cols": n_cols,
        "id_column": id_col,
        "n_unique_ids": int(ids.nunique(dropna=True)),
        "duplicates": {
            "exact_rows": int(df.duplicated().sum()),
            "duplicate_ids": dup_ids,
            "example_row_ids": row_ids(exact_dup_mask),
            **advanced_dups,
        },
        "empty_rows": {"n": len(empty_row_pos), "lines": empty_row_pos[:20]},
        "empty_columns": empty_cols,
        "constant_columns": constant_cols,
        "near_constant_columns": near_constant,
        "duplicated_columns": duplicated_columns,
    }

    # --- Colonnes ---
    columns = []
    for c in df.columns:
        s = df[c]
        vlabels = value_labels_all.get(c)
        col: dict[str, Any] = {
            "name": str(c),
            "spss_label": labels.get(c) or None,
            "value_labels": {str(k): v for k, v in vlabels.items()} if vlabels else None,
            "declared_missing_values": declared_missing.get(c) or None,
            "dtype": str(s.dtype),
            "stat_type_guess": _stat_type(s, vlabels),
            "n": n_rows,
            "n_missing": int(s.isna().sum()),
            "pct_missing": round(float(s.isna().mean() * 100), 1),
            "n_distinct": int(s.nunique(dropna=True)),
            "suspected_missing_codes": _suspect_missing_codes(s, declared_missing.get(c)),
            "flags": _numeric_flags(s),
        }
        if pd.api.types.is_numeric_dtype(s) and col["stat_type_guess"] in (
            "continuous",
            "discrete",
        ):
            v = s.dropna().astype(float)
            if len(v):
                q1, q3 = v.quantile(0.25), v.quantile(0.75)
                iqr = q3 - q1
                out_mask = (s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)
                col["numeric_stats"] = {
                    k: _py(x)
                    for k, x in {
                        "mean": v.mean(), "sd": v.std(), "median": v.median(),
                        "q1": q1, "q3": q3, "min": v.min(), "max": v.max(),
                        "skew": v.skew() if len(v) > 2 else None,
                        "kurtosis": v.kurt() if len(v) > 3 else None,
                        "n_zeros": (v == 0).sum(), "n_negative": (v < 0).sum(),
                    }.items()
                }
                col["outliers_iqr"] = {"n": int(out_mask.sum()), "row_ids": row_ids(out_mask)}
                if col["outliers_iqr"]["n"] > 0:
                    col["flags"].append("outliers_iqr")
        elif col["stat_type_guess"] in ("binary", "nominal", "ordinal"):
            counts = s.dropna().astype(str).value_counts()
            col["categories"] = [
                {"value": k, "n": int(n), "pct": round(float(n) / max(len(s.dropna()), 1) * 100, 1)}
                for k, n in counts.head(30).items()
            ]
            rare = [cat for cat in col["categories"] if cat["n"] < 5]
            if rare and len(counts) > 2:
                col["flags"].append("rare_categories")
        if col["suspected_missing_codes"]:
            col["flags"].append("suspected_missing_code_in_values")
        # Valeurs observées absentes des libellés de valeurs SPSS déclarés (§13)
        if vlabels:
            declared = {str(k) for k in vlabels} | {str(float(k)) for k in vlabels
                                                    if str(k).lstrip("-").isdigit()}
            observed = {str(v) for v in s.dropna().unique()}
            outside = sorted(observed - declared)[:10]
            if outside:
                col["values_outside_labels"] = outside
                col["flags"].append("values_outside_labels")
        columns.append(col)

    # --- Manquants ---
    na = df.isna()
    per_patient = na.sum(axis=1)
    # Blocs : colonnes partageant exactement le même motif de manquants
    blocks: dict[int, list[str]] = {}
    for c in df.columns:
        if df[c].isna().any() and not df[c].isna().all():
            key = hash(tuple(na[c].values.tolist()))
            blocks.setdefault(key, []).append(str(c))
    missing_blocks = [
        {"columns": cols, "n_rows": int(na[cols[0]].sum())}
        for cols in blocks.values()
        if len(cols) >= 2
    ]
    missing_summary = {
        "total_cells": int(n_rows * n_cols),
        "missing_cells": int(na.values.sum()),
        "pct_global": round(float(na.values.mean() * 100), 1),
        "patients_with_missing": int((per_patient > 0).sum()),
        "complete_cases": int((per_patient == 0).sum()),
        "median_missing_per_patient": _py(per_patient.median()),
        "missing_blocks": missing_blocks[:20],
        "declared_missing_in_file": bool(declared_missing),
    }

    # --- Dates ---
    dates_audit = []
    now = pd.Timestamp.now()
    for c in df.columns:
        s = df[c]
        if pd.api.types.is_datetime64_any_dtype(s):
            future = s > now
            too_old = s < pd.Timestamp("1900-01-01")
            dates_audit.append(
                {
                    "column": str(c),
                    "n_future": int(future.sum()),
                    "n_before_1900": int(too_old.sum()),
                    "row_ids_future": row_ids(future),
                }
            )

    # --- PII ---
    pii = []
    for c in df.columns:
        kinds = [k for k, rx in PII_NAME_RE.items() if rx.search(str(c))]
        s = df[c].dropna().astype(str).str.strip()
        if len(s):
            if s.str.match(PHONE_CONTENT_RE).mean() > 0.5:
                kinds.append("phone_content")
            if s.str.match(EMAIL_CONTENT_RE).mean() > 0.5:
                kinds.append("email_content")
        if kinds:
            pii.append({"column": str(c), "kinds": sorted(set(kinds)), "n_values": len(s)})

    return {
        "file": {k: meta.get(k) for k in ("file_name", "format", "size_bytes", "sha256",
                                          "sheets", "hidden_sheets", "encoding", "separator")},
        "structure": structure,
        "columns": columns,
        "missing_summary": missing_summary,
        "dates_audit": dates_audit,
        "pii_candidates": pii,
    }
