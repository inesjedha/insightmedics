"""Éléments du bilan client calculés par le code (bilan v3 de Hamza, 27/10/2026).

- Numéros de ligne : l'étudiant retrouve une ligne par son numéro dans le fichier, en
  plus de son numéro d'inclusion (« ligne 36 du fichier (inclusion n° 34) »). Le modèle
  ne connaît que les identifiants ; le code fait la correspondance.
- Le « jeu des différences » : deux lignes jumelles côte à côte, prises dans la base, sur
  quelques colonnes non identifiantes.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

import pandas as pd

if TYPE_CHECKING:  # pragma: no cover
    from .llm2 import ChecklistItem

# Excel et CSV : ligne 1 = en-têtes, donc la ligne de données n° p (à partir de 0) est la
# ligne p + 2 du fichier. SPSS : « cas n° p + 1 ».
_FIRST_DATA_LINE = 2
MAX_TWIN_COLUMNS = 10
MAX_CELL_CHARS = 14


def _is_spss(profiling: dict[str, Any]) -> bool:
    return (profiling.get("file") or {}).get("format") == "sav"


def file_line(position: int, profiling: dict[str, Any]) -> int:
    """Numéro de la ligne dans le fichier (ou du cas SPSS) d'une ligne de données."""
    return position + (1 if _is_spss(profiling) else _FIRST_DATA_LINE)


def _ranges(numbers: list[int]) -> str:
    """[6, 7, 8, 36] → « 6 à 8 et 36 »."""
    runs: list[list[int]] = []
    for n in sorted(set(numbers)):
        if runs and n == runs[-1][-1] + 1:
            runs[-1].append(n)
        else:
            runs.append([n])
    parts = [str(r[0]) if len(r) == 1 else f"{r[0]} et {r[1]}" if len(r) == 2
             else f"{r[0]} à {r[-1]}" for r in runs]
    return ", ".join(parts[:-1]) + " et " + parts[-1] if len(parts) > 1 else parts[0]


def lines_label(positions: list[int], profiling: dict[str, Any]) -> str:
    """« ligne 36 », « lignes 6 à 19 et 36 à 49 », « cas n° 34 » (SPSS)."""
    if not positions:
        return ""
    lines = [file_line(p, profiling) for p in positions]
    if _is_spss(profiling):
        return f"cas n° {_ranges(lines)}"
    plural = len(set(lines)) > 1
    return f"ligne{'s' if plural else ''} {_ranges(lines)}"


def _positions_by_id(df: pd.DataFrame, id_col: str | None) -> dict[str, list[int]]:
    if not id_col or id_col not in df.columns:
        return {}
    out: dict[str, list[int]] = {}
    for pos, v in enumerate(df[id_col].tolist()):
        if pd.isna(v):
            continue
        key = _norm_id(v)
        out.setdefault(key, []).append(pos)
    return out


def _norm_id(v: Any) -> str:
    """« 34 », 34, 34.0 → « 34 »."""
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v).strip()


def fill_checklist_lines(items: list[ChecklistItem], df: pd.DataFrame,
                         profiling: dict[str, Any]) -> None:
    """Renseigne `lignes` à partir des identifiants donnés par le modèle (en place).
    Identifiant inconnu : on n'invente pas de ligne."""
    index = _positions_by_id(df, (profiling.get("structure") or {}).get("id_column"))
    if not index:
        return
    for item in items:
        positions = [p for rid in item.row_ids for p in index.get(_norm_id(rid), [])]
        item.lignes = lines_label(positions, profiling)


# ---------------------------------------------------------- jeu des différences

def _fmt(v: Any) -> str:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return "—"
    if isinstance(v, float):
        v = int(v) if v.is_integer() else round(v, 2)
    text = str(v).replace(".", ",") if isinstance(v, float) else str(v).strip()
    return text if len(text) <= MAX_CELL_CHARS else text[: MAX_CELL_CHARS - 1] + "…"


def _same(a: Any, b: Any) -> bool:
    if pd.isna(a) and pd.isna(b):
        return True
    return bool(a == b) if not (pd.isna(a) or pd.isna(b)) else False


def _candidate_pairs(profiling: dict[str, Any]) -> list[tuple[int, int]]:
    """Paires (positions) de lignes jumelles : d'abord celles des blocs recopiés."""
    dups = (profiling.get("structure") or {}).get("duplicates") or {}
    pairs: list[tuple[int, int]] = []
    for b in dups.get("copied_blocks") or []:
        src, cpy = b.get("source_lines") or [], b.get("copy_lines") or []
        if len(src) == 2 and len(cpy) == 2:
            # source_lines / copy_lines : positions à partir de 1
            pairs += [(src[0] - 1 + i, cpy[0] - 1 + i) for i in range(b.get("length", 0))]
    return pairs


def twin_example(df: pd.DataFrame, profiling: dict[str, Any]) -> dict[str, Any] | None:
    """Deux lignes jumelles côte à côte sur quelques colonnes non identifiantes, ou None.

    On préfère une paire identique sauf l'identifiant (« seul le numéro change ») ;
    sinon la plus ressemblante. Aucune colonne identifiante ni date n'est montrée."""
    pairs = [(a, b) for a, b in _candidate_pairs(profiling) if a < len(df) and b < len(df)]
    if not pairs:
        return None
    s = profiling.get("structure") or {}
    id_col = s.get("id_column")
    pii = {p.get("column") for p in profiling.get("pii_candidates") or []}
    empty = set(s.get("empty_columns") or [])
    shown_id = id_col if id_col and id_col not in pii and id_col in df.columns else None
    usable = [c for c in df.columns
              if c != id_col and c not in pii and str(c) not in empty
              and not pd.api.types.is_datetime64_any_dtype(df[c])]
    if not usable:
        return None

    def n_diff(pair: tuple[int, int]) -> int:
        a, b = df.iloc[pair[0]], df.iloc[pair[1]]
        return sum(not _same(a[c], b[c]) for c in usable)

    best = min(pairs, key=n_diff)
    ra, rb = df.iloc[best[0]], df.iloc[best[1]]
    filled = [c for c in usable if not (pd.isna(ra[c]) and pd.isna(rb[c]))]
    differing = [c for c in filled if not _same(ra[c], rb[c])]
    # Colonnes parlantes : renseignées, valeurs courtes, qui varient d'un patient à
    # l'autre (une colonne constante ne prouve rien), dans l'ordre du fichier : les
    # premières sont en général le profil du patient (âge, sexe, mécanisme…). Les doublons
    # de nom renumérotés par la lecture (« PaO2.1 ») sont évités.
    varied = [c for c in filled if c not in differing
              and not re.search(r"\.\d+$", str(c))
              and df[c].nunique(dropna=True) > 1
              and len(str(ra[c]).strip()) <= MAX_CELL_CHARS]
    n_slots = MAX_TWIN_COLUMNS - (1 if shown_id else 0)
    keep = set(differing[:3]) | set(varied[: max(0, n_slots - len(differing[:3]))])
    columns = ([shown_id] if shown_id else []) + [c for c in df.columns if c in keep]

    def row(pos: int, r: pd.Series) -> dict[str, Any]:
        inclusion = f" (inclusion n° {_norm_id(r[shown_id])})" if shown_id else ""
        return {"label": f"{lines_label([pos], profiling).capitalize()}{inclusion}",
                "values": [_fmt(r[c]) for c in columns]}

    median = ((s.get("duplicates") or {}).get("near_identical_rows") or {}).get(
        "median_similarity")
    usual = (f" Deux patients pris au hasard dans votre base n'ont qu'environ "
             f"{round(median * 10)} colonnes sur 10 en commun." if median else "")
    if not differing:
        answer = (f"Seul le numéro d'inclusion change : les {len(filled)} autres colonnes "
                  f"renseignées sont identiques.{usual}") if shown_id else (
                  f"Aucune : les {len(filled)} colonnes renseignées sont identiques.{usual}")
    else:
        names = ", ".join(str(c) for c in differing[:3])
        answer = (f"Elles ne diffèrent que sur {len(differing)} colonne"
                  f"{'s' if len(differing) > 1 else ''} sur {len(filled)} ({names}).{usual}")
    return {
        "columns": [str(c) for c in columns],
        "rows": [row(best[0], ra), row(best[1], rb)],
        "differing": [str(c) for c in differing if c in keep],
        "answer": answer,
    }
