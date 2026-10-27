"""Nettoyage de la base, fait par Insight Medics (offre « Analyses + résultats »).

L'étudiant n'a pas à renvoyer une base nettoyée : nous partons de la base qu'il a
envoyée à l'audit (ou de celle qu'il a corrigée, s'il en dépose une), et nous la
nettoyons nous-mêmes. L'IA propose les corrections dans le plan (JSON fermé, ci-dessous),
Dr Hamza les valide avec le plan, le code les applique à une copie et consigne chaque
cellule modifiée dans le journal des corrections, remis avec la base d'analyse.

Règles (méthodologie de Hamza) :
- le fichier d'origine n'est jamais modifié ; aucune ligne n'est supprimée (une ligne
  écartée l'est par une exclusion du plan, qui alimente le diagramme de flux) ;
- rien n'est inventé : une valeur impossible ou illisible devient une case vide ; une
  valeur n'est remplacée que par celle que l'étudiant a relevée dans le dossier
  (`set_value`, avec sa source) ;
- chaque correction est vérifiable : motif, nombre de cellules, lignes du fichier Excel,
  exemples « avant → après ».
"""

from __future__ import annotations

import re
from typing import Any, Literal

import numpy as np
import pandas as pd
from pydantic import BaseModel

from .expr import evaluate

CorrectionKind = Literal["missing_codes", "harmonize", "to_number", "to_date", "set_missing",
                         "set_value"]
FIRST_DATA_LINE = 2   # ligne Excel de la première ligne de données (ligne 1 = en-têtes)
MAX_LINES_SHOWN = 30
MAX_EXAMPLES = 5


class Correction(BaseModel):
    """Une correction de la base, appliquée à une copie avant les colonnes calculées."""
    kind: CorrectionKind
    column: str
    reason: str = ""                                  # motif lu dans le journal
    values: list[str | float | int] = []              # missing_codes : 999, « NR », « - »
    mapping: dict[str, str | float | int | None] = {}  # harmonize : valeur lue → valeur
    where: str | None = None                          # set_missing / set_value : condition
    lines: list[int] = []                             # set_missing / set_value : lignes Excel
    value: str | float | int | None = None            # set_value : valeur du dossier
    source: str = ""                                  # set_value : d'où vient la valeur
    dayfirst: bool = True                             # to_date : 03/04 = 3 avril


def _key(v: Any) -> str:
    """Clé de comparaison : casse, espaces et « 999 » / 999 / 999.0 confondus."""
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return re.sub(r"\s+", " ", str(v)).strip().lower()


def _show(v: Any) -> str:
    if v is None or (isinstance(v, float) and np.isnan(v)) or v is pd.NaT or v is pd.NA:
        return "vide"
    if isinstance(v, pd.Timestamp):
        return v.strftime("%d/%m/%Y")
    if isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, bool):
        f = float(v)
        return str(int(f)) if f.is_integer() else f"{f:g}".replace(".", ",")
    return f"« {v} »"


def _lines(mask: pd.Series) -> list[int]:
    positions = np.flatnonzero(mask.to_numpy())
    return [int(p) + FIRST_DATA_LINE for p in positions]


def _entry(c: Correction | None, column: str, kind: str, reason: str, before: pd.Series,
           after: pd.Series, mask: pd.Series, **extra: Any) -> dict[str, Any]:
    lines = _lines(mask)
    examples: list[str] = []
    for pos in np.flatnonzero(mask.to_numpy()):
        ex = f"{_show(before.iloc[pos])} → {_show(after.iloc[pos])}"
        if ex not in examples:
            examples.append(ex)
        if len(examples) >= MAX_EXAMPLES:
            break
    entry: dict[str, Any] = {"step": "correction", "kind": kind, "column": column,
                             "reason": reason, "n": len(lines),
                             "lines": lines[:MAX_LINES_SHOWN], "examples": examples, **extra}
    if c is not None and c.kind == "set_value" and c.source:
        entry["source"] = c.source
    return entry


def _cell(v: Any) -> str:
    """Contenu exact d'une cellule ; seuls les nombres sont normalisés (450.0 = « 450 »)."""
    if isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, bool):
        f = float(v)
        return str(int(f)) if f.is_integer() else repr(f)
    return str(v)


def _changed(before: pd.Series, after: pd.Series) -> pd.Series:
    """Cellules dont le contenu change (« 450 » → 450 n'est pas un changement)."""
    b_na, a_na = before.isna().to_numpy(), after.isna().to_numpy()
    out = [bool(bn != an or (not bn and _cell(b) != _cell(a)))
           for b, a, bn, an in zip(before.tolist(), after.tolist(), b_na, a_na, strict=True)]
    return pd.Series(out, index=before.index, dtype=bool)


def _selection(c: Correction, df: pd.DataFrame) -> pd.Series:
    """Lignes visées par une correction ponctuelle : condition et/ou lignes du fichier."""
    mask = pd.Series(False, index=df.index)
    if c.lines:
        bad = [n for n in c.lines if not FIRST_DATA_LINE <= n < FIRST_DATA_LINE + len(df)]
        if bad:
            raise ValueError(f"correction de « {c.column} » : ligne(s) {bad} hors du fichier "
                             f"(lignes {FIRST_DATA_LINE} à {FIRST_DATA_LINE + len(df) - 1})")
        mask.iloc[[n - FIRST_DATA_LINE for n in c.lines]] = True
    if c.where:
        res = evaluate(c.where, df)
        cond = (res if isinstance(res, pd.Series) else pd.Series(bool(res), index=df.index))
        mask |= cond.astype("boolean").fillna(False).astype(bool)
    return mask


def _is_text(s: pd.Series) -> bool:
    """Colonne de texte (object, ou type « str » de pandas 3)."""
    return s.dtype == object or pd.api.types.is_string_dtype(s)


def _parse_dates(s: pd.Series, dayfirst: bool) -> pd.Series:
    if pd.api.types.is_datetime64_any_dtype(s):
        return s
    out = []
    for v in s.tolist():
        if v is None or (isinstance(v, float) and np.isnan(v)) or str(v).strip() == "":
            out.append(pd.NaT)
        elif isinstance(v, pd.Timestamp):
            out.append(v)
        else:
            out.append(pd.to_datetime(str(v).strip(), dayfirst=dayfirst, errors="coerce"))
    return pd.Series(out, index=s.index, dtype="datetime64[ns]")


def _trim(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any] | None]:
    """Espaces en trop et cellules blanches (automatique, sans jugement)."""
    out = df.copy()
    n, columns = 0, []
    for col in out.columns:
        s = out[col]
        if not _is_text(s):
            continue
        cleaned = s.map(lambda v: (re.sub(r"\s+", " ", v).strip() or np.nan)
                        if isinstance(v, str) else v)
        changed = _changed(s, cleaned)
        if changed.any():
            n += int(changed.sum())
            columns.append(str(col))
            out[col] = cleaned
    if not n:
        return out, None
    return out, {"step": "correction", "kind": "trim", "column": ", ".join(columns[:12])
                 + (" …" if len(columns) > 12 else ""), "reason": "Espaces en trop et "
                 "cellules blanches (automatique)", "n": n, "lines": [], "examples": []}


def apply_corrections(df: pd.DataFrame, corrections: list[Correction]
                      ) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    """Applique les corrections à une copie ; retourne (base nettoyée, journal). Lève
    ValueError si une correction est inapplicable (colonne inconnue, ligne hors fichier)."""
    from .prepare import _parse_number  # même lecture des nombres que les colonnes calculées

    base, trim_entry = _trim(df)
    journal: list[dict[str, Any]] = [trim_entry] if trim_entry else []
    for c in corrections:
        if c.column not in base.columns:
            raise ValueError(f"correction : colonne inconnue « {c.column} »")
        before = base[c.column].copy()
        extra: dict[str, Any] = {}
        if c.kind == "missing_codes":
            keys = {_key(v) for v in c.values}
            hit = before.map(lambda v, keys=keys: pd.notna(v) and _key(v) in keys).astype(bool)
            after = before.mask(hit, np.nan)
            if _is_text(after):
                numeric = pd.to_numeric(after, errors="coerce")
                if numeric.notna().sum() == after.notna().sum():
                    after = numeric       # colonne redevenue entièrement numérique
        elif c.kind == "harmonize":
            mapping = {_key(k): v for k, v in c.mapping.items()}
            after = before.map(
                lambda v, mapping=mapping: mapping.get(_key(v), v) if pd.notna(v) else v)
        elif c.kind == "to_number":
            after, counts = _parse_number(before)
            unreadable = before.notna() & after.isna()
            extra = {"illisibles": _lines(unreadable)[:MAX_LINES_SHOWN],
                     **{k: v for k, v in counts.items() if v}}
        elif c.kind == "to_date":
            after = _parse_dates(before, c.dayfirst)
            unreadable = before.notna() & after.isna()
            extra = {"illisibles": _lines(unreadable)[:MAX_LINES_SHOWN]}
        else:  # set_missing, set_value
            if not c.lines and not c.where:
                raise ValueError(f"correction de « {c.column} » : indiquer les lignes ou la "
                                 "condition")
            target = _selection(c, base)
            if c.kind == "set_missing":
                after = before.mask(target, np.nan)
            else:
                if c.value is None:
                    raise ValueError(f"correction de « {c.column} » : valeur manquante "
                                     "(pour vider une case, utiliser set_missing)")
                value: Any = c.value
                if pd.api.types.is_numeric_dtype(before):
                    try:
                        value = float(str(value).replace(",", "."))
                    except ValueError:
                        raise ValueError(f"correction de « {c.column} » : « {c.value} » "
                                         "n'est pas un nombre") from None
                after = before.astype("object").mask(target, value)
                if pd.api.types.is_numeric_dtype(before):
                    after = pd.to_numeric(after)
        changed = _changed(before, after)
        base[c.column] = after
        journal.append(_entry(c, c.column, c.kind, c.reason, before, after, changed, **extra))
    return base, journal


def correction_problems(corrections: list[Correction], columns: list[str]) -> list[str]:
    """Contrôle sans exécution (colonnes connues, champs requis)."""
    from .expr import ExprError, columns_used

    known = set(columns)
    problems: list[str] = []
    for i, c in enumerate(corrections, start=1):
        where = f"correction n° {i} ({c.kind}, « {c.column} »)"
        if c.column not in known:
            problems.append(f"{where} : colonne inconnue")
        if c.kind == "missing_codes" and not c.values:
            problems.append(f"{where} : aucune valeur à vider")
        if c.kind == "harmonize" and not c.mapping:
            problems.append(f"{where} : correspondances vides")
        if c.kind in ("set_missing", "set_value"):
            if not c.lines and not c.where:
                problems.append(f"{where} : indiquer les lignes ou la condition")
            if c.kind == "set_value" and (c.value is None or not c.source.strip()):
                problems.append(f"{where} : valeur et source (dossier vérifié par "
                                "l'étudiant) obligatoires")
        if c.where:
            try:
                for name in columns_used(c.where):
                    if name not in known:
                        problems.append(f"{where} : colonne inconnue « {name} » dans la "
                                        "condition")
            except ExprError as exc:
                problems.append(f"{where} : {exc}")
    return problems
