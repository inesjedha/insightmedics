"""Classeur Excel remis à l'étudiant avec l'audit : 4 onglets, courts et actionnables.

- « À lire d'abord » : verdict, note, chiffres clés, les points qui bloquent, mode d'emploi ;
- « Dossiers à ouvrir » : la feuille de route aux archives, un dossier ou une paire par
  ligne, avec une colonne pour noter ce qu'on y trouve ;
- « Points à vérifier » : une ligne par point, avec ce qu'il faut vérifier et une
  colonne « Votre décision » à remplir (listes déroulantes) ;
- « Questions pour votre directeur » : les décisions à prendre, par priorité ;
- « Votre note en détail » : la grille en 8 domaines, en clair, et le plafond éventuel.

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

ANALYSIS_OFFER = "l'analyse statistique (500 DT, livrée en 1 semaine)"
CONTACT_EMAIL = "helpinsightmedics@gmail.com"
WHATSAPP_DISPLAY = "+216 96 389 570"

INK = "111827"
FONT = "Calibri"
TITLE = Font(name=FONT, bold=True, size=16, color=INK)
H2 = Font(name=FONT, bold=True, size=12, color=INK)
BOLD = Font(name=FONT, bold=True, size=11, color=INK)
NORM = Font(name=FONT, size=11, color=INK)
MUTED = Font(name=FONT, size=10, color="4B5563")
HEAD_FONT = Font(name=FONT, bold=True, size=11, color="FFFFFF")
HEAD_FILL = PatternFill("solid", fgColor="1F3FD1")  # bleu Insight Medics
INPUT_HEAD_FONT = Font(name=FONT, bold=True, size=11, color=INK)
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
                    "Même patient saisi deux fois", "Patients différents", "Introuvable dans le dossier"]


def _table(ws: Worksheet, row: int, headers: list[str], widths: list[int],
           input_cols: tuple[int, ...] = ()) -> int:
    """Écrit une ligne d'en-têtes ; renvoie la ligne suivante."""
    for j, (h, w) in enumerate(zip(headers, widths, strict=True), start=1):
        c = ws.cell(row=row, column=j, value=h)
        c.font = INPUT_HEAD_FONT if j in input_cols else HEAD_FONT
        c.fill = INPUT_FILL if j in input_cols else HEAD_FILL
        c.alignment = Alignment(wrap_text=True, vertical="center")
        c.border = HEAD_LINE
        ws.column_dimensions[get_column_letter(j)].width = w
    ws.freeze_panes = ws.cell(row=row + 1, column=1)
    ws.print_title_rows = f"{row}:{row}"  # en-têtes répétés à chaque page imprimée
    return row + 1


def _print_setup(ws: Worksheet, tab_color: str) -> None:
    """Paysage, ajusté à la largeur de la page ; couleur d'onglet."""
    ws.sheet_properties.tabColor = tab_color
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True


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
                             f"Sans ce problème, les 8 points totaliseraient {_fr(score.get('score_brut'))}.",
                    MUTED)
    row += 1

    patients = counts["patients"]
    if counts["duplicated_rows"] and counts["patients_min"] < patients:
        patients = f"{counts['patients_min']} à {counts['patients']}"
    missions = assess.get("missions") or []
    n_points = len(assess.get("blocking_points") or []) or n_blocking_findings
    n_red = sum(1 for m in missions if m.get("feu") == "rouge")
    tiles = [("Patients", patients),
             ("Saisis deux fois ?", counts["duplicated_rows"]),
             ("Cases vides", f"{_fr(counts['missing_useful_pct'])} %"),
             ("Missions", f"{len(missions)} (dont {n_red} rouges)") if missions
             else ("Points bloquants", n_points)]
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
    if missions:
        row = _text(ws, row, "Vos missions", H2)
        row = _table(ws, row, ["N°", "Mission", "Pourquoi c'est important", "À faire",
                               "Qui · à rouvrir · terminé quand"], [24, 44, 34, 44, 34])
        for i, m in enumerate(missions, start=1):
            light = "Rouge" if m.get("feu") == "rouge" else "Orange"
            mission = f"{light} — {m.get('title', '')}" + (f"\n{m['vu']}" if m.get("vu") else "")
            todo = "\n".join(f"• {a}" for a in m.get("a_faire") or [])
            who = " · ".join(x for x in [m.get("qui", ""), m.get("a_rouvrir", ""),
                                         m.get("termine_quand", "")] if x)
            _row(ws, row, [i, mission, m.get("pourquoi", ""), todo, who])
            ws.cell(row=row, column=1).fill = PRIORITY_FILL[
                "avant_analyse" if m.get("feu") == "rouge" else "importante"]
            row += 1
        ws.freeze_panes = None
        row += 1
        for label, items in (("Ce qui est déjà en ordre", assess.get("deja_en_ordre") or []),
                             ("Ce que nous corrigeons pour vous (rien à faire de votre côté)",
                              assess.get("nous_corrigeons") or [])):
            if items:
                row = _text(ws, row, label, H2)
                for item in items:
                    row = _text(ws, row, f"• {item}")
                row += 1
    elif points:
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
        "1. Onglet « Dossiers à ouvrir » : la liste des dossiers à sortir des archives, et ce "
        "qu'il faut y relever. Notez ce que vous trouvez dans la colonne jaune.",
        "2. Onglet « Questions pour votre directeur » : apportez-les à votre prochain rendez-vous.",
        "3. Onglet « Points à vérifier » : le détail de chaque point, si vous voulez comprendre.",
        f"4. Renvoyez-nous ce classeur rempli avec votre base corrigée : nous réalisons "
        f"{ANALYSIS_OFFER} et vous remettons la base nettoyée, les tableaux et les tests.",
        f"Dr Hamza sur WhatsApp : {WHATSAPP_DISPLAY} · {CONTACT_EMAIL}",
    ]:
        row = _text(ws, row, line)
    _print_setup(ws, "1F3FD1")


def _sheet_findings(wb: Workbook, findings: list[dict], hide_ids: bool) -> None:
    ws = wb.create_sheet("Points à vérifier")
    ws.sheet_view.showGridLines = False
    ws.cell(row=1, column=1, value="Points à vérifier dans vos dossiers").font = TITLE
    ws.cell(row=2, column=1, value="Une ligne par point. Remplissez « Votre décision », puis "
            "renvoyez-nous le classeur avec votre base corrigée.").font = MUTED
    headers = ["N°", "Priorité", "Inclusion(s)", "Colonne", "Ce qui ne va pas", "Détail",
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
    _print_setup(ws, "B42318")


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
        choices = d.get("choices") or []
        options = ("\n".join(f"{chr(65 + k)}. {c.get('label', '')}" for k, c in enumerate(choices))
                   if choices else " / ".join(d.get("options") or []))
        effects = ("\n".join(f"{chr(65 + k)}. {c.get('consequence', '')}"
                              for k, c in enumerate(choices) if c.get("consequence"))
                   if choices else "") or d.get("consequence_fr", "")
        _row(ws, row, [i, PRIORITY_LABELS.get(prio, "Importante"), d.get("question_fr", ""),
                       options, effects, d.get("recommendation_fr", ""), ""], input_cols=(7,))
        ws.cell(row=row, column=2).fill = PRIORITY_FILL.get(prio, PRIORITY_FILL["importante"])
        row += 1
    _print_setup(ws, "8A4B08")


# Motifs internes de la grille, inutiles pour l'étudiant (« analyse fine au M5 »,
# « statut : sous_conditions », « hash SHA-256 »…).
_INTERNAL_MOTIF = ("statut :", "M4", "M5", "jalon", "hash", "inévaluable", "points accordés")


# Les 8 domaines de la grille, en mots simples (même libellés que la page d'audit).
DOMAIN_PLAIN = {1: "Chaque patient compté une seule fois", 2: "Des cases remplies",
                3: "Des valeurs possibles", 4: "Des colonnes qui ne se contredisent pas",
                5: "Un tableau fidèle à votre protocole", 6: "Un critère principal mesurable",
                7: "Des colonnes expliquées", 8: "Prêt pour les calculs prévus"}


def _sheet_score(wb: Workbook, score: dict) -> None:
    ws = wb.create_sheet("Votre note en détail")
    ws.sheet_view.showGridLines = False
    ws.cell(row=1, column=1, value="Votre note, point par point").font = TITLE
    ws.cell(row=2, column=1, value=f"Note : {_fr(score.get('score_final'))}/100 — "
            f"{score.get('niveau_qualite', '')}. Total des 8 points : "
            f"{_fr(score.get('score_brut'))}/100.").font = NORM
    row = 3
    for cap in score.get("plafonds_appliques") or []:
        ws.cell(row=row, column=1, value=f"La note ne peut pas dépasser {cap['plafond']}/100 "
                f"tant que ce problème reste : {cap['defaut'].lower()}.").font = MUTED
        row += 1
    row = _table(ws, row + 1, ["Ce que nous vérifions", "Points", "Ce qui coûte des points"], [44, 12, 90])
    for d in score.get("domaines") or []:
        losses = []
        for c in d.get("criteres") or []:
            if c["obtenu"] >= c["max"]:
                continue
            motif = c.get("motif") or ""
            if any(token in motif for token in _INTERNAL_MOTIF):
                motif = ""
            losses.append(f"{c['critere']} ({_fr(c['obtenu'])}/{c['max']})"
                          + (f" : {motif}" if motif else ""))
        name = DOMAIN_PLAIN.get(d["domaine"], d["nom"])
        _row(ws, row, [f"{d['domaine']}. {name}", f"{_fr(d['obtenu'])} / {d['max']}",
                       "\n".join(losses) or "Rien à signaler"])
        ws.cell(row=row, column=1).font = BOLD
        row += 1
    _print_setup(ws, "4B5563")


CHECK_STATUSES = '"À vérifier,Confirmé tel quel,Corrigé dans le dossier"'


def _sheet_checklist(wb: Workbook, assess: dict, findings: list[dict], hide_ids: bool) -> None:
    """Liste de vérification (bilan v3) : triée par urgence, avec la ligne du fichier, la
    colonne, la valeur actuelle, et un statut que l'étudiant remplit."""
    ws = wb.create_sheet("Dossiers à ouvrir")
    ws.sheet_view.showGridLines = False
    ws.cell(row=1, column=1, value="Dossiers à ouvrir aux archives").font = TITLE
    ws.cell(row=2, column=1, value="Un dossier ou une paire de dossiers par ligne, du plus "
            "urgent au moins urgent. Remplissez les colonnes jaunes.").font = MUTED
    row = _table(ws, 4, ["N°", "Ligne du fichier", "Patient(s)", "Colonne", "Valeur actuelle",
                         "Question à vérifier dans le dossier", "Mission", "Statut",
                         "Ce que vous avez trouvé"],
                 [6, 16, 14, 22, 18, 46, 9, 22, 36], input_cols=(8, 9))
    items = [[c.get("lignes", ""), c.get("patients", ""), c.get("colonne", ""),
              c.get("valeur", ""), c.get("check", ""), c.get("mission") or ""]
             for c in assess.get("checklist") or []]
    if not items:  # audits antérieurs : une ligne par anomalie à vérifier au dossier
        items = [["", _rows_label(f, hide_ids), _variable(f), f.get("observed") or "",
                  f.get("check_fr") or f.get("title_fr", ""), ""]
                 for f in findings if f.get("requires_source_verification")]
    if not items:
        ws.cell(row=row, column=1, value="Aucun dossier à vérifier.").font = MUTED
        _print_setup(ws, "11643A")
        return
    status = DataValidation(type="list", formula1=CHECK_STATUSES, allow_blank=True)
    ws.add_data_validation(status)
    first = row
    for i, item in enumerate(items, start=1):
        _row(ws, row, [i, *item, "À vérifier", ""], input_cols=(8, 9))
        row += 1
    status.add(f"H{first}:H{row - 1}")
    _print_setup(ws, "11643A")


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
    _sheet_checklist(wb, assess, findings, hide_ids)
    _sheet_findings(wb, findings, hide_ids)
    _sheet_questions(wb, decisions)
    _sheet_score(wb, score_detail)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
