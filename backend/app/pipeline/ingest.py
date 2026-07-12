"""Étape 1 — INGEST : parsing .sav / .xlsx / .xls / .csv.

Lecture seule : le fichier original n'est jamais modifié (principe du prompt maître §2.1).
"""

from __future__ import annotations

import csv as csv_mod
import hashlib
from pathlib import Path
from typing import Any

import pandas as pd


class IngestError(Exception):
    """Fichier illisible ou format non supporté."""


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _read_sav(path: Path) -> tuple[pd.DataFrame, dict[str, Any]]:
    import pyreadstat

    df, meta = pyreadstat.read_sav(str(path))
    file_meta = {
        "spss_column_labels": dict(zip(meta.column_names, meta.column_labels)),
        "spss_value_labels": meta.variable_value_labels or {},
        "spss_missing_ranges": meta.missing_ranges or {},
        "spss_variable_measure": getattr(meta, "variable_measure", {}) or {},
        "sheets": [],
    }
    return df, file_meta


def _read_excel(path: Path) -> tuple[pd.DataFrame, dict[str, Any]]:
    xls = pd.ExcelFile(path)
    sheets_info = []
    best = None
    for name in xls.sheet_names:
        sheet_df = xls.parse(name)
        sheets_info.append(
            {"name": name, "n_rows": len(sheet_df), "n_cols": len(sheet_df.columns)}
        )
        if best is None or len(sheet_df) * max(len(sheet_df.columns), 1) > best[1]:
            best = (sheet_df, len(sheet_df) * max(len(sheet_df.columns), 1), name)
    if best is None or best[0].empty and best[1] == 0:
        raise IngestError("Aucune feuille contenant des données.")
    hidden = []
    if path.suffix.lower() == ".xlsx":
        try:
            from openpyxl import load_workbook

            wb = load_workbook(path, read_only=True)
            hidden = [ws.title for ws in wb.worksheets if ws.sheet_state != "visible"]
        except Exception:
            pass
    return best[0], {
        "sheets": sheets_info,
        "main_sheet": best[2],
        "hidden_sheets": hidden,
        "spss_column_labels": {},
        "spss_value_labels": {},
        "spss_missing_ranges": {},
    }


def _read_csv(path: Path) -> tuple[pd.DataFrame, dict[str, Any]]:
    from charset_normalizer import from_path

    guess = from_path(path).best()
    encoding = guess.encoding if guess else "utf-8"
    sample = path.read_text(encoding=encoding, errors="replace")[:8192]
    try:
        sep = csv_mod.Sniffer().sniff(sample, delimiters=",;\t|").delimiter
    except csv_mod.Error:
        sep = ";" if sample.count(";") > sample.count(",") else ","
    df = pd.read_csv(path, sep=sep, encoding=encoding, low_memory=False)
    return df, {
        "encoding": encoding,
        "separator": sep,
        "sheets": [],
        "spss_column_labels": {},
        "spss_value_labels": {},
        "spss_missing_ranges": {},
    }


READERS = {".sav": _read_sav, ".xlsx": _read_excel, ".xls": _read_excel, ".csv": _read_csv}


def ingest(path: str | Path, original_name: str | None = None) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Parse le fichier et retourne (DataFrame, metadata).

    Lève IngestError si le format n'est pas supporté ou si la base est vide
    (garde-fou §4.2 du prompt maître : ne jamais auditer des données inexistantes).
    """
    path = Path(path)
    name = original_name or path.name
    ext = Path(name).suffix.lower() or path.suffix.lower()
    reader = READERS.get(ext)
    if reader is None:
        raise IngestError(
            f"Format non supporté : {ext}. Formats acceptés : .sav, .xlsx, .xls, .csv"
        )
    try:
        df, meta = reader(path)
    except IngestError:
        raise
    except Exception as exc:  # noqa: BLE001 — remonté proprement à l'API
        raise IngestError(f"Fichier illisible ({ext}) : {exc}") from exc

    meta.update(
        {
            "file_name": name,
            "format": ext.lstrip("."),
            "size_bytes": path.stat().st_size,
            "sha256": _sha256(path),
            "parse_warnings": [],
        }
    )
    if df.empty or len(df.columns) == 0:
        raise IngestError(
            "La base ne contient aucune observation individuelle : audit de structure "
            "seul possible (score plafonné à 10/100)."
        )
    return df, meta
