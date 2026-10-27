"""Classeur Excel remis à l'étudiant avec l'audit : 4 onglets, courts et actionnables.

- « À lire d'abord » : verdict, note, chiffres clés, les points qui bloquent, mode d'emploi ;
- « Anomalies à vérifier » : une ligne par anomalie, avec ce qu'il faut vérifier et une
  colonne « Votre décision » à remplir (listes déroulantes) ;
- « Questions pour votre directeur » : les décisions à prendre, par priorité ;
- « Score détaillé » : la grille en 8 domaines et le plafond éventuel.

Le classeur expert (10 onglets, report_xlsx.py) reste disponible dans l'admin. Les
patients sont désignés par leur numéro d'inclusion ; si la colonne identifiant est une
donnée identifiante (numéro de dossier…), ses valeurs ne sont pas reprises.
100 % déterministe : seuls les textes viennent de l'audit IA, déjà nettoyés et plafonnés.
"""

from __future__ import annotations

import io
from typing import Any

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.worksheet import Worksheet

from .llm2 import PRIORITY_LABELS, PRIORITY_ORDER
from .summary import key_counts

ANALYSIS_OFFER = "l'analyse statistique (500 DT)"
CONTACT_EMAIL = "helpinsightmedics@gmail.com"

INK = "111827"
FONT = "Calibri"
TITLE = Font(name=FONT, bold=True, size=16, color=INK)
H2 = Font(name=FONT, bold=True, size=12, color=INK)
BOLD = Font(name=FONT, bold=True, size=11, color=INK)
NORM = Font(name=FONT, size=11, color=INK)
MUTED = Font(name=FONT, size=10, color="4B5563")
HEAD_FONT = Font(name=FONT, bold=True, size=11, color=INK)
HEAD_FILL = PatternFill("solid", fgColor="F3F4F6")
INPUT_FILL = PatternFill("solid", fgColor="FFF8D6")
WRAP = Alignment(wrap_text=True, vertical="top")
LINE = Border(bottom=Side(style="thin", color="E5E7EB"))
HEAD_LINE = Border(bottom=Side(style="medium", color="9AA3B5"))

# Gravité de l'anomalie → priorité lue par l'étudiant (et sa couleur).
SEVERITY_PRIORITY = {"critique": "avant_analyse", "majeure": "importante",
                     "moderee": "facultative", "mineure": "facultative"}
PRIORITY_FILL = {"avant_analyse": PatternFill("solid", fgColor="FBE4E1"),
                 "importante": PatternFill("solid", fgColor="FDF0D8"),
                 "facultative": PatternFill("solid", fgColor="EEF0F4")}
DECISION_CHOICES = ["À vérifier", "Vérifié : c'est correct", "Corrigé dans la base",
                    "Même patient (doublon)", "Patients différents", "Introuvable dans le dossier"]


def _table(ws: Worksheet, row: int, headers: list[str], widths: list[int],
           input_cols: tuple[int, ...] = ()) -> int:
    """Écrit une ligne d'en-têtes ; renvoie la ligne suivante."""
    for j, (h, w) in enumerate(zip(headers, widths, strict=True), start=1):
        c = ws.cell(row=row, column=j, value=h)
        c.font = HEAD_FONT
        c.fill = INPUT_FILL if j in input_cols else HEAD_FILL
        c.alignment = Alignment(wrap_text=True, vertical="center")
        c.border = HEAD_LINE
        ws.column_dimensions[get_column_letter(j)].width = w
    ws.freeze_panes = ws.cell(row=row + 1, column=1)
    return row + 1


def _row(ws: Worksheet, row: int, values: list[Any], input_cols: tuple[int, ...] = ()) -> None:
    for j, v in enumerate(values, start=1):
        c = ws.cell(row=row, column=j, value=v)
        c.font = NORM
        c.alignment = WRAP
        c.border = LINE
        if j in input_cols:
            c.fill = INPUT_FILL


def _text(ws: Worksheet, row: int, value: str, font: Font = NORM, merge_to: int = 6) -> int:
    c = ws.cell(row=row, column=1, value=value)
    c.font = font
    c.alignment = WRAP
    if merge_to > 1:
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=merge_to)
    return row + 1


def _fr(value: Any) -> str:
    """Nombre à la française (virgule décimale)."""
    return str(value).replace(".", ",")


def _rows_label(f: dict, hide_ids: bool) -> str:
    if f.get("rows_fr"):
        return str(f["rows_fr"])
    if hide_ids:
        return ""
    ids = [str(i) for i in f.get("row_ids") or []]
    return ", ".join(ids[:12]) + (" …" if len(ids) > 12 else "")


def _variable(f: dict) -> str:
    cols = f.get("affected_columns") or []
    if cols:
        return ", ".join(cols[:4]) + (f" (+{len(cols) - 4})" if len(cols) > 4 else "")
    return f.get("column") or "—"


# ---------------------------------------------------------------- onglets

def _sheet_read_first(wb: Workbook, prof: dict, score: dict, assess: dict, n_findings: int,
                      n_blocking_findings: int) -> None:
    ws = wb.create_sheet("À lire d'abord")
    ws.sheet_view.showGridLines = False
    for col, w in zip("ABCDEF", [24, 22, 22, 22, 22, 22], strict=True):
        ws.column_dimensions[col].width = w

    counts = key_counts(prof)
    headline = assess.get("headline") or {}
    verdict = assess.get("exploitability_verdict") or {}
    title = headline.get("title") or verdict.get("label") or "Audit de votre base"
    subtitle = headline.get("subtitle") or verdict.get("justification_fr") or ""

    row = _text(ws, 1, "Audit de votre base — Insight Medics", MUTED)
    row = _text(ws, row, title, TITLE)
    if subtitle:
        row = _text(ws, row, subtitle)
    row += 1

    note = f"{_fr(score.get('score_final', '—'))}/100 — {score.get('niveau_qualite', '')}"
    ws.cell(row=row, column=1, value="Qualité de la base").font = BOLD
    ws.cell(row=row, column=2, value=note).font = H2
    row += 1
    caps = score.get("plafonds_appliques") or []
    if caps:
        row = _text(ws, row, f"Note limitée à {_fr(score.get('score_final'))} : {caps[0]['defaut']}. "
                             f"Sans ce plafond, les 8 domaines totalisent {_fr(score.get('score_brut'))}.",
                    MUTED)
    row += 1

    tiles = [("Patients", counts["patients"]),
             ("Saisis deux fois ?", counts["duplicated_rows"]),
             ("Données manquantes", f"{_fr((prof.get('missing_summary') or {}).get('pct_global', 0))} %"),
             ("Anomalies relevées", f"{n_findings} (dont {n_blocking_findings} bloquantes)")]
    for j, (label, value) in enumerate(tiles, start=1):
        ws.cell(row=row, column=j, value=label).font = MUTED
        c = ws.cell(row=row + 1, column=j, value=value)
        c.font = H2
        c.alignment = Alignment(horizontal="left")
    row += 2
    if counts["template_rows"]:
        row = _text(ws, row, f"+ {counts['template_rows']} ligne(s) modèle de la fiche, "
                             "qui ne sont pas des patients.", MUTED)
    row += 1

    points = assess.get("blocking_points") or []
    if points:
        row = _text(ws, row, "Les points qui bloquent votre analyse", H2)
        row = _table(ws, row, ["N°", "Le problème", "Pourquoi c'est grave", "Que faire"],
                     [24, 44, 40, 40])
        for i, bp in enumerate(points, start=1):
            problem = bp.get("title", "")
            if bp.get("what"):
                problem += "\n" + bp["what"]
            _row(ws, row, [i, problem, bp.get("why", ""), bp.get("todo", "")])
            row += 1
        ws.freeze_panes = None
        row += 1

    row = _text(ws, row, "Comment utiliser ce classeur", H2)
    for line in [
        "1. Onglet « Anomalies à vérifier » : ouvrez les dossiers concernés et remplissez la "
        "colonne « Votre décision ».",
        "2. Onglet « Questions pour votre directeur » : apportez-les à votre prochain rendez-vous.",
        f"3. Renvoyez-nous ce classeur avec votre base corrigée : nous réalisons {ANALYSIS_OFFER} "
        "et vous remettons la base nettoyée, les tableaux et les tests.",
        f"Une question ? {CONTACT_EMAIL}",
    ]:
        row = _text(ws, row, line)


def _sheet_findings(wb: Workbook, findings: list[dict], hide_ids: bool) -> None:
    ws = wb.create_sheet("Anomalies à vérifier")
    ws.sheet_view.showGridLines = False
    ws.cell(row=1, column=1, value="Anomalies à vérifier dans vos dossiers").font = TITLE
    ws.cell(row=2, column=1, value="Une ligne par point. Remplissez « Votre décision », puis "
            "renvoyez-nous le classeur avec votre base corrigée.").font = MUTED
    headers = ["N°", "Priorité", "Inclusion(s)", "Variable", "Ce qui ne va pas", "Détail",
               "Ce qu'il faut vérifier", "Votre décision", "Fait"]
    row = _table(ws, 4, headers, [6, 16, 18, 22, 38, 52, 32, 26, 8], input_cols=(8, 9))
    if not findings:
        ws.cell(row=row, column=1, value="Aucune anomalie à vérifier.").font = MUTED
        return

    decision = DataValidation(type="list", formula1='"' + ",".join(DECISION_CHOICES) + '"',
                              allow_blank=True)
    done = DataValidation(type="list", formula1='"Oui,Non"', allow_blank=True)
    ws.add_data_validation(decision)
    ws.add_data_validation(done)

    ordered = sorted(findings, key=lambda f: PRIORITY_ORDER[
        SEVERITY_PRIORITY.get(f.get("severity", ""), "facultative")])
    first = row
    for i, f in enumerate(ordered, start=1):
        prio = SEVERITY_PRIORITY.get(f.get("severity", ""), "facultative")
        check = f.get("check_fr") or f.get("proposed_correction") or ""
        _row(ws, row, [i, PRIORITY_LABELS[prio], _rows_label(f, hide_ids), _variable(f),
                       f.get("title_fr", ""), f.get("explanation_fr", ""), check, "", ""],
             input_cols=(8, 9))
        ws.cell(row=row, column=2).fill = PRIORITY_FILL[prio]
        row += 1
    decision.add(f"H{first}:H{row - 1}")
    done.add(f"I{first}:I{row - 1}")
    ws.auto_filter.ref = f"A{first - 1}:I{row - 1}"


def _sheet_questions(wb: Workbook, decisions: list[dict]) -> None:
    ws = wb.create_sheet("Questions pour votre directeur")
    ws.sheet_view.showGridLines = False
    ws.cell(row=1, column=1, value="Questions pour votre directeur de thèse").font = TITLE
    ws.cell(row=2, column=1, value="À trancher ensemble, de préférence par écrit, avant "
            "l'analyse statistique.").font = MUTED
    row = _table(ws, 4, ["N°", "Priorité", "Question", "Options", "Ce que ça change",
                         "Notre recommandation", "Votre réponse"],
                 [6, 18, 50, 30, 40, 40, 30], input_cols=(7,))
    if not decisions:
        ws.cell(row=row, column=1, value="Aucune question à trancher.").font = MUTED
        return
    for i, d in enumerate(decisions, start=1):
        prio = d.get("priority") or "importante"
        _row(ws, row, [i, PRIORITY_LABELS.get(prio, "Importante"), d.get("question_fr", ""),
                       " / ".join(d.get("options") or []), d.get("consequence_fr", ""),
                       d.get("recommendation_fr", ""), ""], input_cols=(7,))
        ws.cell(row=row, column=2).fill = PRIORITY_FILL.get(prio, PRIORITY_FILL["importante"])
        row += 1


def _sheet_score(wb: Workbook, score: dict) -> None:
    ws = wb.create_sheet("Score détaillé")
    ws.sheet_view.showGridLines = False
    ws.cell(row=1, column=1, value="Score de qualité : grille en 8 domaines").font = TITLE
    ws.cell(row=2, column=1, value=f"Note : {_fr(score.get('score_final'))}/100 — "
            f"{score.get('niveau_qualite', '')}. Total des domaines : "
            f"{_fr(score.get('score_brut'))}/100.").font = NORM
    row = 3
    for cap in score.get("plafonds_appliques") or []:
        ws.cell(row=row, column=1, value=f"Plafond appliqué : {cap['defaut']} "
                f"(note limitée à {cap['plafond']}/100).").font = MUTED
        row += 1
    row = _table(ws, row + 1, ["Domaine", "Critère", "Points", "Maximum", "Motif"],
                 [36, 44, 10, 10, 60])
    for d in score.get("domaines") or []:
        _row(ws, row, [f"{d['domaine']}. {d['nom']}", "Total du domaine", d["obtenu"], d["max"], ""])
        for j in range(1, 6):
            ws.cell(row=row, column=j).font = BOLD
        row += 1
        for c in d.get("criteres") or []:
            _row(ws, row, ["", c["critere"], c["obtenu"], c["max"], c.get("motif", "")])
            row += 1


# ---------------------------------------------------------------- assemblage

def build_client_workbook(profiling: dict, score_detail: dict, ai_audit: dict | None) -> bytes:
    assess = (ai_audit or {}).get("assessment") or {}
    findings = assess.get("findings") or []
    decisions = assess.get("client_decisions") or []
    id_col = (profiling.get("structure") or {}).get("id_column")
    pii_cols = {p.get("column") for p in profiling.get("pii_candidates") or []}
    hide_ids = bool(id_col and id_col in pii_cols)
    n_blocking = sum(1 for f in findings if f.get("severity") == "critique")

    wb = Workbook()
    wb.remove(wb.active)
    _sheet_read_first(wb, profiling, score_detail, assess, len(findings), n_blocking)
    _sheet_findings(wb, findings, hide_ids)
    _sheet_questions(wb, decisions)
    _sheet_score(wb, score_detail)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
