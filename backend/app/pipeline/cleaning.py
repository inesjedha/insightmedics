"""Jalon M8 — Moteur de nettoyage (copie dérivée, format Hamza).

Principe non négociable : la base ORIGINALE n'est jamais modifiée. On produit une copie
« Source anonymisée » (toutes les colonnes, identifiants directs retirés, id_anonyme
P001…N + ligne_source) et une copie « Base analyse » (nettoyée : colonnes vides exclues,
opérations de nettoyage validées appliquées, variables dérivées d'analyse créées). Chaque
transformation est consignée dans un journal traçable. Aucune imputation.

Les valeurs extrêmes ne sont jamais écrasées : une variable dérivée « <col>_analyse » met
la valeur à manquant tout en conservant l'originale (méthode de Hamza).
"""

from __future__ import annotations

import io
from typing import Any

import numpy as np
import pandas as pd

from .rules_engine import eval_formula

# Opérations appliquées d'office (auto_safe) ; les autres exigent une validation explicite.
_ENUM = {"recode_missing", "drop_duplicates", "cast_type", "trim_whitespace",
         "standardize_dates", "standardize_categories", "drop_constant_column",
         "drop_empty_column", "rename_column", "remove_outliers", "recode_value"}


def _iqr_outlier_mask(s: pd.Series) -> pd.Series:
    v = pd.to_numeric(s, errors="coerce")
    q1, q3 = v.quantile(0.25), v.quantile(0.75)
    iqr = q3 - q1
    return (v < q1 - 3 * iqr) | (v > q3 + 3 * iqr)


def clean(df: pd.DataFrame, profiling: dict, ai_audit: dict | None,
          approved_op_ids: set[str] | None = None) -> dict[str, Any]:
    """Retourne {source_anonymisee, base_analyse (DataFrames), journal (list)}.

    approved_op_ids : op_id des opérations NON auto_safe explicitement validées par le
    client. Les opérations auto_safe sont toujours appliquées.
    """
    approved = approved_op_ids or set()
    ai = ai_audit or {}
    assess = ai.get("assessment", {}) or {}
    struct = profiling["structure"]
    journal: list[dict] = []
    cid = 0

    def log(variable: str, action: str, raison: str, methode: str, n: int) -> None:
        nonlocal cid
        cid += 1
        journal.append({
            "id_correction": f"C{cid:03d}", "variable": variable,
            "action_appliquee_dans_copie": action, "raison": raison,
            "methode": methode, "n_concerne": n, "verification_dossier_necessaire": "Non",
        })

    n = len(df)
    ids = [f"P{i:03d}" for i in range(1, n + 1)]
    ligne_source = list(range(1, n + 1))

    # --- Source anonymisée : toutes les colonnes sauf identifiants directs ---
    pii_cols = [p["column"] for p in profiling.get("pii_candidates", []) if p["column"] in df.columns]
    id_col = struct.get("id_column")
    to_remove = set(pii_cols)
    if id_col and id_col in df.columns:
        to_remove.add(id_col)  # l'identifiant hospitalier direct est retiré
    source = df.drop(columns=[c for c in to_remove if c in df.columns]).copy()
    source.insert(0, "ligne_source", ligne_source)
    source.insert(0, "id_anonyme", ids)
    if to_remove:
        log("; ".join(sorted(to_remove)), "Exclue(s) de la copie",
            "Identifiant direct / donnée identifiante", "Anonymisation, source inchangée", n)
    log("id_anonyme; ligne_source", "Ajoutées", "Traçabilité sans identifiant direct",
        "P001…Pxxx selon l'ordre source", n)

    # --- Base analyse : on part de la source anonymisée ---
    base = source.copy()

    # 1) Exclure les colonnes entièrement vides
    empty = [c for c in struct["empty_columns"] if c in base.columns]
    if empty:
        base = base.drop(columns=empty)
        log(f"{len(empty)} variable(s) vide(s)", "Exclues", "Aucune information exploitable",
            "Colonnes conservées dans la source anonymisée uniquement", len(empty))

    # 2) Appliquer les opérations de nettoyage validées (enum fermé)
    for op in assess.get("cleaning_plan", []):
        name = op.get("operation")
        if name not in _ENUM:
            continue
        if not op.get("auto_safe") and op.get("op_id") not in approved:
            continue  # opération sensible non validée : ignorée
        col = op.get("column")
        params = op.get("params") or {}
        raison = op.get("rationale_fr", "")
        try:
            if name == "recode_missing" and col in base.columns:
                codes = params.get("codes", [])
                mask = base[col].isin(codes)
                base.loc[mask, col] = np.nan
                log(col, "Codes de valeur manquante mis à NaN", raison,
                    f"valeurs {codes} → manquant", int(mask.sum()))
            elif name == "trim_whitespace" and col in base.columns:
                base[col] = base[col].astype(str).str.strip()
                log(col, "Espaces parasites retirés", raison, "strip", n)
            elif name == "cast_type" and col in base.columns:
                target = params.get("type", "float")
                if target in ("int", "float"):
                    base[col] = pd.to_numeric(base[col], errors="coerce")
                elif target == "date":
                    base[col] = pd.to_datetime(base[col], errors="coerce")
                else:
                    base[col] = base[col].astype(str)
                log(col, f"Type converti en {target}", raison, "cast", n)
            elif name in ("drop_empty_column", "drop_constant_column") and col in base.columns:
                base = base.drop(columns=[col])
                log(col, "Colonne retirée", raison, name, n)
            elif name == "rename_column" and col in base.columns:
                new = params.get("new_name")
                if new:
                    base = base.rename(columns={col: new})
                    log(col, f"Renommée en {new}", raison, "rename", n)
            elif name == "standardize_categories" and col in base.columns:
                mapping = params.get("mapping", {})
                if mapping:
                    base[col] = base[col].replace(mapping)
                    log(col, "Modalités standardisées", raison, "mapping", n)
            elif name == "standardize_dates" and col in base.columns:
                base[col] = pd.to_datetime(base[col], errors="coerce")
                log(col, "Dates normalisées (ISO)", raison, "to_datetime", n)
            elif name == "remove_outliers" and col in base.columns:
                # jamais destructif : nouvelle colonne <col>_analyse, original conservé
                mask = _iqr_outlier_mask(base[col])
                new_col = f"{col}_analyse"
                base[new_col] = pd.to_numeric(base[col], errors="coerce")
                base.loc[mask, new_col] = np.nan
                log(new_col, "Créée ; valeur(s) extrême(s) mise(s) à manquant",
                    raison, "au-delà de Q3+3×IQR, original conservé", int(mask.sum()))
            elif name == "recode_value" and col in base.columns:
                before, after = params.get("before"), params.get("after")
                m = base[col] == before
                base.loc[m, col] = after
                log(col, f"Valeur {before} → {after}", raison, "recode ponctuel", int(m.sum()))
        except Exception:  # noqa: BLE001 — une opération qui échoue est ignorée, jamais fatale
            continue

    # 3) Variables dérivées documentées/évidentes (formules de LLM-1) → colonnes calculées
    for dv in ai.get("derived_variables", []):
        formula, name_dv = dv.get("formula"), dv.get("name")
        target = f"{name_dv}_calc" if name_dv in base.columns else name_dv
        if formula and name_dv and all(c in base.columns for c in dv.get("sources", [])):
            try:
                base[target] = eval_formula(formula, base)
                log(target, "Variable dérivée calculée", f"formule : {formula}",
                    "recalcul de contrôle", int(base[target].notna().sum()))
            except Exception:  # noqa: BLE001
                continue

    # 4) Variables dérivées d'ANALYSE proposées par l'IA (méthode Hamza : recodage binaire,
    #    % de perte longitudinale, somme de contrôle). L'IA propose, le code exécute.
    for dv in ai.get("derived_analysis_variables", []):
        _apply_derived_analysis(base, dv, log)

    return {"source_anonymisee": source, "base_analyse": base, "journal": journal}


def _apply_derived_analysis(base: pd.DataFrame, dv: dict, log) -> None:
    """Exécute une variable dérivée d'analyse (enum fermé de « kinds »). Jamais destructif :
    on ajoute toujours une nouvelle colonne, on n'écrase jamais une source."""
    kind, name = dv.get("kind"), dv.get("name")
    if not name or name in base.columns:
        return
    try:
        if kind == "binary_recode":
            src, pos = dv.get("source"), set(dv.get("positive_values", []))
            if src not in base.columns:
                return
            col = base[src]
            out = col.apply(lambda v: np.nan if pd.isna(v) else (1 if v in pos else 0))
            base[name] = out
            log(name, "Recodage binaire", f"{src} ∈ {sorted(pos)} → 1, sinon 0 (manquant conservé)",
                "recodage 0/1", int(out.notna().sum()))
        elif kind == "pct_change":
            b, f = dv.get("baseline"), dv.get("follow_up")
            if b not in base.columns or f not in base.columns:
                return
            bl = pd.to_numeric(base[b], errors="coerce")
            fu = pd.to_numeric(base[f], errors="coerce")
            # direction : "loss" (perte, valeur positive quand ça diminue) / "gain" / "change"
            direction = dv.get("direction", "change")
            if direction == "loss":
                base[name] = (bl - fu) / bl * 100
                expr = f"({b} − {f}) / {b} × 100"
            else:
                base[name] = (fu - bl) / bl * 100
                expr = f"({f} − {b}) / {b} × 100"
            log(name, "Pourcentage de variation", expr,
                "évolution longitudinale", int(base[name].notna().sum()))
        elif kind == "row_sum":
            srcs = [c for c in dv.get("sources", []) if c in base.columns]
            if not srcs:
                return
            base[name] = sum(pd.to_numeric(base[c], errors="coerce").fillna(0) for c in srcs)
            log(name, "Somme de contrôle", "somme de " + ", ".join(srcs),
                "somme ligne à ligne", int(base[name].notna().sum()))
        elif kind == "formula":
            formula = dv.get("formula")
            if formula:
                base[name] = eval_formula(formula, base)
                log(name, "Variable dérivée calculée", f"formule : {formula}",
                    "calcul déterministe", int(base[name].notna().sum()))
    except Exception:  # noqa: BLE001 — une dérivation qui échoue est ignorée, jamais fatale
        return


# ---------------------------------------------------------------- export

def to_csv_bytes(df: pd.DataFrame) -> bytes:
    return df.to_csv(index=False).encode("utf-8")


def to_sav_bytes(df: pd.DataFrame) -> bytes:
    """Écrit un .sav via pyreadstat (nécessite un fichier temporaire)."""
    import tempfile
    import os
    import pyreadstat

    # pyreadstat n'aime pas les colonnes object mixtes : normaliser en str/num
    out = df.copy()
    for c in out.columns:
        if out[c].dtype == object:
            out[c] = out[c].astype(str).replace({"nan": "", "None": ""})
    with tempfile.NamedTemporaryFile(suffix=".sav", delete=False) as tmp:
        path = tmp.name
    try:
        pyreadstat.write_sav(out, path)
        with open(path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(path):
            os.remove(path)
