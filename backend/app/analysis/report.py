"""Livrables de l'analyse : la partie Résultats (Word) et le classeur (Excel).

Word : paragraphe « Analyse statistique » à insérer dans le Matériel et méthodes,
population et diagramme de flux, puis une sous-partie par analyse (texte, tableau à trois
traits, figure pour les évolutions). Excel : les tableaux, la base d'analyse (colonnes
calculées, INCLUS_ANALYSE et motif, sans colonne identifiante), le diagramme de flux et
le journal des colonnes calculées.
"""

from __future__ import annotations

import io
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

BRAND = "1F3FD1"
MUTED = RGBColor(0x6B, 0x72, 0x80)


# ---------------------------------------------------------------- Word

def _border(cell: Any, **sides: str) -> None:
    """Trait horizontal d'une cellule (tableau à trois traits, style des thèses)."""
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.find(qn("w:tcBorders"))
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for side, size in sides.items():
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), size)
        el.set(qn("w:color"), "000000")
        borders.append(el)


def _table(doc: Any, columns: list[str], rows: list[list[Any]]) -> None:
    table = doc.add_table(rows=1 + len(rows), cols=len(columns))
    table.autofit = True
    for j, title in enumerate(columns):
        cell = table.rows[0].cells[j]
        cell.text = ""
        run = cell.paragraphs[0].add_run(str(title))
        run.bold = True
        run.font.size = Pt(9.5)
        _border(cell, top="12", bottom="6")
    for i, row in enumerate(rows, start=1):
        for j, value in enumerate(row):
            cell = table.rows[i].cells[j]
            cell.text = ""
            text = str(value)
            run = cell.paragraphs[0].add_run(text.strip() if j == 0 else text)
            run.font.size = Pt(9.5)
            if j == 0 and text.startswith("    "):
                cell.paragraphs[0].paragraph_format.left_indent = Cm(0.4)
            elif j == 0 and len(row) > 1 and all(str(v) == "" for v in row[1:]):
                run.bold = True  # en-tête d'une variable qualitative
            if i == len(rows):
                _border(cell, bottom="12")


def _figure(fig_spec: dict[str, Any]) -> io.BytesIO:
    fig, ax = plt.subplots(figsize=(5.2, 2.8), dpi=200)
    ax.plot(fig_spec["times"], fig_spec["values"], marker="o", color=f"#{BRAND}")
    ax.set_ylabel(f"{fig_spec['label']} ({fig_spec['stat']})")
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf


def _note(doc: Any, text: str) -> None:
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.italic = True
    run.font.size = Pt(9)
    run.font.color.rgb = MUTED


def build_results_docx(plan: dict[str, Any], flow: list[dict[str, Any]],
                       results: list[dict[str, Any]], text: dict[str, Any] | None) -> bytes:
    text = text or {}
    sections = {s["analysis_id"]: s for s in text.get("sections") or []}
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(12)

    doc.add_heading("Résultats", level=0)
    if plan.get("title"):
        _note(doc, plan["title"])

    if text.get("methods_paragraph"):
        doc.add_heading("Analyse statistique (à insérer dans le Matériel et méthodes)", level=2)
        doc.add_paragraph(text["methods_paragraph"])

    doc.add_heading("Population étudiée", level=1)
    if text.get("flow_paragraph"):
        doc.add_paragraph(text["flow_paragraph"])
    flow_rows = [[f["label"], str(f.get("excluded", "")),
                  str(f.get("remaining", f.get("n", "")))] for f in flow]
    _note(doc, "Diagramme de flux")
    _table(doc, ["Étape", "Lignes écartées", "Lignes restantes"], flow_rows)

    for k, r in enumerate(results, start=1):
        if r.get("error") or not r["table"]["rows"]:
            continue
        s = sections.get(r["id"], {})
        doc.add_heading(s.get("heading") or r["title"], level=1)
        for para in s.get("paragraphs") or []:
            doc.add_paragraph(para)
        caption = doc.add_paragraph()
        cap = caption.add_run(s.get("table_title") or f"Tableau {k} : {r['title']}")
        cap.bold = True
        cap.font.size = Pt(10)
        _table(doc, r["table"]["columns"], r["table"]["rows"])
        for w in r.get("warnings") or []:
            _note(doc, f"Note : {w}")
        if r.get("figure"):
            doc.add_picture(_figure(r["figure"]), width=Cm(13))
            doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
            _note(doc, f"Figure : évolution de {r['figure']['label']} "
                       f"({r['figure']['stat']} par temps).")

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ---------------------------------------------------------------- Excel

def _xl_table(ws: Any, row: int, title: str, columns: list[str], rows: list[list[Any]]) -> int:
    ws.cell(row=row, column=1, value=title).font = Font(bold=True, size=12)
    row += 1
    for j, c in enumerate(columns, start=1):
        cell = ws.cell(row=row, column=j, value=c)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor=BRAND)
    for r in rows:
        row += 1
        for j, v in enumerate(r, start=1):
            ws.cell(row=row, column=j, value=v).alignment = Alignment(wrap_text=True,
                                                                      vertical="top")
    return row + 2


def build_results_xlsx(base: pd.DataFrame, pii_columns: set[str], flow: list[dict[str, Any]],
                       results: list[dict[str, Any]], derived_log: list[dict[str, Any]],
                       plan: dict[str, Any]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Tableaux"
    ws.column_dimensions["A"].width = 42
    for col in "BCDEFGH":
        ws.column_dimensions[col].width = 22
    row = 1
    for k, r in enumerate(results, start=1):
        if r.get("error") or not r["table"]["rows"]:
            continue
        row = _xl_table(ws, row, f"Tableau {k} : {r['title']}", r["table"]["columns"],
                        r["table"]["rows"])

    ws = wb.create_sheet("Diagramme de flux")
    _xl_table(ws, 1, "Diagramme de flux", ["Étape", "Lignes écartées", "Lignes restantes"],
              [[f["label"], f.get("excluded", ""), f.get("remaining", f.get("n", ""))]
               for f in flow])
    ws.column_dimensions["A"].width = 60

    ws = wb.create_sheet("Base d'analyse")
    export = base.drop(columns=[c for c in base.columns if c in pii_columns])
    ws.append([str(c) for c in export.columns])
    for values in export.itertuples(index=False):
        ws.append([None if (isinstance(v, float) and pd.isna(v)) or v is pd.NA else
                   (v if isinstance(v, (int, float, str)) else str(v)) for v in values])
    for cell in ws[1]:
        cell.font = Font(bold=True)
    ws.freeze_panes = "B2"

    ws = wb.create_sheet("Colonnes calculées")
    rationale = {d.get("name"): d.get("rationale", "") for d in plan.get("derived") or []}
    _xl_table(ws, 1, "Colonnes ajoutées à la base d'analyse",
              ["Nom", "Libellé", "Calcul", "Pourquoi", "Renseignées", "Remarques"],
              [[d["name"], d.get("label", ""), d.get("kind", ""), rationale.get(d["name"], ""),
                d.get("n_renseignes", ""),
                "; ".join(f"{k} : {v}" for k, v in d.items()
                          if k not in {"name", "label", "kind", "n_renseignes"})]
               for d in derived_log])
    ws.column_dimensions["A"].width = 18
    ws.column_dimensions["D"].width = 50

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
