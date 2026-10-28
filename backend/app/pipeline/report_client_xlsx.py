"""Classeur Excel remis à l'étudiant avec l'audit : 4 onglets, calqués sur la page web.

- « Votre bilan » : le verdict, quatre chiffres, l'avancement (mis à jour par Excel), les
  missions en blocs lisibles, et le mode d'emploi ;
- « Aux archives » : la SEULE feuille à remplir. Un dossier (ou une paire) par ligne,
  groupés par mission, avec un statut à choisir et ce que l'étudiant a trouvé ; une ligne
  vérifiée devient verte ;
- « Questions au directeur » : une question par bloc, options A/B/C et ce qu'elles
  changent, notre conseil, la décision retenue et sa date ;
- « Pour aller plus loin » : les points relevés un par un, et la note point par point.

Le classeur expert reste dans l'admin (report_xlsx.py). Les patients sont désignés par
leur numéro d'inclusion ; si la colonne identifiant est une donnée identifiante (numéro de
dossier…), ses valeurs ne sont pas reprises. 100 % déterministe : seuls les textes
viennent de l'audit IA, déjà nettoyés, relus en mots simples et plafonnés.
"""

from __future__ import annotations

import io
from typing import Any

from openpyxl import Workbook
from openpyxl.cell.rich_text import CellRichText, TextBlock
from openpyxl.cell.text import InlineFont
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.worksheet import Worksheet

from . import xlsx_style as st
from .llm2 import PRIORITY_LABELS, PRIORITY_ORDER
from .summary import key_counts

ANALYSIS_OFFER = "l'analyse statistique (500 DT, livrée en 1 semaine)"
CONTACT_EMAIL = "helpinsightmedics@gmail.com"
WHATSAPP_DISPLAY = "+216 96 389 570"
DOCUMENT = "Audit de votre base"

SHEET_BILAN = "Votre bilan"
SHEET_ARCHIVES = "Aux archives"
SHEET_QUESTIONS = "Questions au directeur"
SHEET_DETAIL = "Pour aller plus loin"

# Gravité de l'anomalie → priorité lue par l'étudiant.
SEVERITY_PRIORITY = {"critique": "avant_analyse", "majeure": "importante",
                     "moderee": "facultative", "mineure": "facultative"}

TODO = "À vérifier"
NOT_FOUND = "Introuvable dans le dossier"
STATUSES = [TODO, "Confirmé tel quel", "Corrigé (voir à droite)", "Même patient saisi deux fois",
            "Patients différents", NOT_FOUND]


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


def _plural(n: int, word: str) -> str:
    return f"{n} {word}{'s' if n > 1 else ''}"


def _light(assess: dict) -> str:
    missions = assess.get("missions") or []
    if missions:
        return "rouge" if any(m.get("feu") == "rouge" for m in missions) else "orange"
    return "rouge" if assess.get("blocking_points") else "vert"


# ---------------------------------------------------------------- « Aux archives »

def _archive_items(assess: dict, findings: list[dict], hide_ids: bool) -> list[dict]:
    items = [{"lignes": c.get("lignes", ""), "patients": c.get("patients", ""),
              "colonne": c.get("colonne", ""), "valeur": c.get("valeur", ""),
              "check": c.get("check", ""), "mission": c.get("mission")}
             for c in assess.get("checklist") or []]
    if items:
        return items
    # Audits antérieurs au bilan v3 : une ligne par anomalie à vérifier au dossier.
    return [{"lignes": "", "patients": _rows_label(f, hide_ids), "colonne": _variable(f),
             "valeur": f.get("observed") or "", "check": f.get("check_fr") or f.get("title_fr", ""),
             "mission": None}
            for f in findings if f.get("requires_source_verification")]


def _column_label(colonne: str) -> str:
    """« toutes » (paire de lignes jumelles) → « Toute la ligne »."""
    return "Toute la ligne" if colonne.strip().lower() in ("toutes", "toute", "all") else colonne


ARCHIVE_WIDTHS = [5, 13, 12, 19, 15, 33, 21, 26]
STATUS_COL, FOUND_COL = 7, 8


def _sheet_archives(wb: Workbook, assess: dict, findings: list[dict],
                    hide_ids: bool) -> tuple[str, int]:
    """Renvoie (plage des statuts, nombre de dossiers) pour l'avancement du bilan."""
    ws = wb.create_sheet(SHEET_ARCHIVES)
    st.setup_sheet(ws, ARCHIVE_WIDTHS, "11643A", DOCUMENT)
    last = len(ARCHIVE_WIDTHS)
    row = st.title_block(
        ws, "Insight Medics · Audit de votre base", "Aux archives : les dossiers à ouvrir",
        "Un dossier (ou une paire de dossiers) par ligne, du plus urgent au moins urgent. "
        "Remplissez les deux colonnes jaunes : le bilan se met à jour tout seul.", last)
    items = _archive_items(assess, findings, hide_ids)
    head = st.header_row(ws, row, ["N°", "Ligne du fichier", "Patient(s)", "Colonne",
                                   "Valeur actuelle", "À vérifier dans le dossier", "Statut",
                                   "Ce que vous avez trouvé"], input_cols=(STATUS_COL, FOUND_COL))
    if not items:
        st.merged_text(ws, head, 1, last, "Aucun dossier à vérifier.", st.SUBTITLE)
        return "", 0

    missions = assess.get("missions") or []
    groups: dict[int | None, list[dict]] = {}
    for it in items:
        m = it.get("mission")
        key = m if isinstance(m, int) and 1 <= m <= len(missions) else None
        groups.setdefault(key, []).append(it)
    order = sorted(k for k in groups if k is not None) + ([None] if None in groups else [])

    status = DataValidation(type="list", formula1='"' + ",".join(STATUSES) + '"',
                            allow_blank=True, showErrorMessage=False)
    ws.add_data_validation(status)
    row, n, first = head, 0, head
    for key in order:
        if key is not None or len(order) > 1:
            if key is None:
                bg, ink, text = st.SURFACE, st.INK, "Autres vérifications"
            else:
                m = missions[key - 1]
                bg, ink, label = st.LIGHT.get(m.get("feu", "orange"), st.LIGHT["orange"])
                text = f"Mission {key} · {label} · {m.get('title', '')}"
            row = st.band(ws, row, text, bg, ink, last, size=11)
        for it in groups[key]:
            n += 1
            patients = str(it["patients"])
            if patients[:1].isdigit():
                patients = f"n° {patients}"
            row = st.data_row(ws, row, [n, it["lignes"], patients, _column_label(it["colonne"]),
                                        it["valeur"], it["check"], TODO, ""],
                              input_cols=(STATUS_COL, FOUND_COL), center_cols=(1,))
            status.add(ws.cell(row=row - 1, column=STATUS_COL).coordinate)
    end = row - 1
    # Ligne verte une fois vérifiée, grise si le dossier est introuvable.
    rng = f"A{first}:H{end}"
    s = f"$G{first}"
    ws.conditional_formatting.add(rng, FormulaRule(
        formula=[f'AND({s}<>"",{s}<>"{TODO}",{s}<>"{NOT_FOUND}")'],
        fill=st.fill(st.GREEN_BG), font=st.font(color=st.GREEN_INK)))
    ws.conditional_formatting.add(rng, FormulaRule(
        formula=[f'{s}="{NOT_FOUND}"'], fill=st.fill(st.GREY_BG),
        font=st.font(color=st.GREY_INK)))
    ws.auto_filter.ref = f"A{head - 1}:H{end}"
    return f"'{SHEET_ARCHIVES}'!$G${first}:$G${end}", n


# ---------------------------------------------------------------- « Votre bilan »

BILAN_WIDTHS = [24, 32, 32, 32]


def _tile(ws: Worksheet, row: int, col: int, label: str, value: Any, hint: str,
          ink: str = st.INK) -> None:
    for r, (text, style) in enumerate(((label, st.SMALL), (value, st.font(20, bold=True, color=ink)),
                                       (hint, st.SMALL))):
        c = ws.cell(row=row + r, column=col, value=text)
        c.font = style
        c.fill = st.fill(st.SURFACE)
        c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True,
                                indent=1)


def _mission_block(ws: Worksheet, row: int, i: int, m: dict, last: int) -> int:
    bg, ink, label = st.LIGHT.get(m.get("feu", "orange"), st.LIGHT["orange"])
    row = st.band(ws, row, f"Mission {i} · {label} · {m.get('title', '')}", bg, ink, last, 12)
    todo = "\n".join(f"• {a}" for a in m.get("a_faire") or [])
    who = " · ".join(x for x in [
        f"Qui : {m['qui']}" if m.get("qui") else "",
        f"À rouvrir : {m['a_rouvrir']}" if m.get("a_rouvrir") else "",
        f"Terminé quand {m['termine_quand']}" if m.get("termine_quand") else ""] if x)
    for name, text in (("Ce que nous avons vu", m.get("vu", "")),
                       ("Pourquoi c'est important", m.get("pourquoi", "")),
                       ("À faire", todo), ("En pratique", who)):
        if not text:
            continue
        c = ws.cell(row=row, column=1, value=name)
        c.font = st.font(10, bold=True, color=st.MUTED_INK)
        c.alignment = st.WRAP_TOP
        st.merged_text(ws, row, 2, last, text, st.BODY)
        for j in range(1, last + 1):
            ws.cell(row=row, column=j).border = st.ROW_LINE
        row += 1
    return row + 1


def _sheet_bilan(wb: Workbook, ws: Worksheet, prof: dict, score: dict, assess: dict,
                 archive_range: str, n_records: int, n_questions: int) -> None:
    st.setup_sheet(ws, BILAN_WIDTHS, st.BRAND, DOCUMENT)
    last = len(BILAN_WIDTHS)
    headline = assess.get("headline") or {}
    verdict = assess.get("exploitability_verdict") or {}
    title = headline.get("title") or verdict.get("label") or "Audit de votre base"
    subtitle = headline.get("subtitle") or verdict.get("justification_fr") or ""
    light = _light(assess)
    row = st.title_block(ws, "Insight Medics · Audit de votre base", title, subtitle, last)
    # Pastille du feu devant le verdict, dans sa couleur (texte enrichi).
    ink = {"rouge": st.RED_INK, "orange": st.ORANGE_INK, "vert": st.GREEN_INK}[light]
    ws.cell(row=2, column=1).value = CellRichText(
        TextBlock(InlineFont(rFont=st.FONT, sz=18, b=True, color=ink), "● "),
        TextBlock(InlineFont(rFont=st.FONT, sz=18, b=True, color=st.INK), title))

    counts = key_counts(prof)
    patients: Any = counts["patients"]
    hint = "dans votre tableau"
    if counts["duplicated_rows"] and counts["patients_min"] < counts["patients"]:
        patients = f"{counts['patients_min']} à {counts['patients']}"
        hint = "selon les copies que vous confirmerez"
    note = score.get("score_final")
    missions = assess.get("missions") or []
    n_red = sum(1 for m in missions if m.get("feu") == "rouge")
    _tile(ws, row, 1, "Patients", patients, hint)
    _tile(ws, row, 2, "Qualité de votre base", f"{st.fr_num(note)} / 100" if note is not None
          else "—", score.get("niveau_qualite", ""))
    _tile(ws, row, 3, "Missions", len(missions) or len(assess.get("blocking_points") or []),
          f"dont {_plural(n_red, 'rouge')}" if missions else "points à régler",
          st.RED_INK if n_red else st.INK)
    _tile(ws, row, 4, "Questions au directeur", n_questions, "à trancher ensemble")
    for r, h in ((row, 18), (row + 1, 34), (row + 2, 18)):
        ws.row_dimensions[r].height = h
    row += 4

    caps = score.get("plafonds_appliques") or []
    if caps:
        row = st.merged_text(ws, row, 1, last, f"Votre note ne peut pas dépasser "
                             f"{caps[0]['plafond']}/100 tant que ce problème reste : "
                             f"{caps[0]['defaut'].lower()}.", st.SMALL)
    if n_records:
        row = st.section(ws, row + 1, "Votre avancement", last)
        c = ws.cell(row=row, column=1,
                    value=f'=COUNTIFS({archive_range},"<>{TODO}",{archive_range},"<>")'
                          f'&" dossier(s) vérifié(s) sur {n_records}"')
        c.font = st.font(14, bold=True, color=st.GREEN_INK)
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=2)
        ws.row_dimensions[row].height = 24
        st.link(ws, row, 3, "→ Remplir l'onglet « Aux archives »", SHEET_ARCHIVES)
        row += 1

    if missions:
        row = st.section(ws, row + 1, "Vos missions, de la plus urgente à la moins urgente",
                         last)
        row = st.merged_text(ws, row, 1, last, "Commencez par les rouges : tant qu'elles ne "
                             "sont pas terminées, aucun résultat de votre thèse n'est fiable.",
                             st.SUBTITLE) + 1
        for i, m in enumerate(missions, start=1):
            row = _mission_block(ws, row, i, m, last)
    else:
        points = assess.get("blocking_points") or []
        if points:
            row = st.section(ws, row + 1, "Ce qui bloque votre analyse", last)
            for i, bp in enumerate(points, start=1):
                row = _mission_block(ws, row, i, {"feu": "rouge", "title": bp.get("title", ""),
                                                  "vu": bp.get("what", ""),
                                                  "pourquoi": bp.get("why", ""),
                                                  "a_faire": [bp["todo"]] if bp.get("todo")
                                                  else []}, last)

    for label, items in (("Ce qui est déjà en ordre", assess.get("deja_en_ordre") or []),
                         ("Ce que nous corrigeons pour vous (rien à faire de votre côté)",
                          assess.get("nous_corrigeons") or [])):
        if items:
            row = st.section(ws, row, label, last)
            for item in items:
                row = st.merged_text(ws, row, 1, last, f"✓ {item}", st.BODY)
            row += 1

    row = st.section(ws, row, "Comment utiliser ce classeur", last)
    steps = [(f"1. Ouvrez les dossiers de l'onglet « {SHEET_ARCHIVES} » et notez ce que vous "
              "trouvez dans les colonnes jaunes.", SHEET_ARCHIVES),
             (f"2. Apportez l'onglet « {SHEET_QUESTIONS} » à votre prochain rendez-vous avec "
              "votre directeur.", SHEET_QUESTIONS),
             (f"3. Renvoyez-nous le classeur rempli : nous corrigeons la base nous-mêmes, puis "
              f"nous réalisons {ANALYSIS_OFFER}.", None)]
    for text, sheet in steps:
        row = st.merged_text(ws, row, 1, last - 1, text, st.BODY)
        if sheet:
            st.link(ws, row - 1, last, "Ouvrir l'onglet →", sheet)
    row = st.merged_text(ws, row + 1, 1, last, f"Une question ? Dr Hamza sur WhatsApp : "
                         f"{WHATSAPP_DISPLAY} · {CONTACT_EMAIL}", st.SMALL)


# ---------------------------------------------------------------- « Questions au directeur »

QUESTION_WIDTHS = [22, 40, 40, 30]


def _sheet_questions(wb: Workbook, decisions: list[dict]) -> int:
    ws = wb.create_sheet(SHEET_QUESTIONS)
    st.setup_sheet(ws, QUESTION_WIDTHS, "8A4B08", DOCUMENT)
    last = len(QUESTION_WIDTHS)
    row = st.title_block(ws, "Insight Medics · Audit de votre base",
                         "Questions pour votre directeur de thèse",
                         "À trancher ensemble, de préférence par écrit, avant l'analyse. "
                         "Notez la décision retenue dans la case jaune.", last)
    if not decisions:
        st.merged_text(ws, row, 1, last, "Aucune question à trancher.", st.SUBTITLE)
        return 0
    ordered = sorted(decisions, key=lambda d: PRIORITY_ORDER.get(d.get("priority") or
                                                                 "importante", 1))
    for i, d in enumerate(ordered, start=1):
        prio = d.get("priority") or "importante"
        bg, ink = st.PRIORITY_STYLE.get(prio, st.PRIORITY_STYLE["importante"])
        row = st.band(ws, row, f"Question {i} · {PRIORITY_LABELS.get(prio, 'Importante')}",
                      bg, ink, last, 10.5)
        row = st.merged_text(ws, row, 1, last, d.get("question_fr", ""), st.BODY_BOLD)
        choices = d.get("choices") or [{"label": o, "consequence": ""}
                                       for o in d.get("options") or []]
        letters = []
        for k, ch in enumerate(choices):
            letter = chr(65 + k)
            letters.append(letter)
            c = ws.cell(row=row, column=1, value=f"Option {letter}")
            c.font = st.font(10.5, bold=True, color=st.BRAND_DARK)
            c.alignment = st.WRAP_TOP
            st.merged_text(ws, row, 2, 2, ch.get("label", ""), st.BODY_BOLD)
            st.merged_text(ws, row, 3, last, ch.get("consequence", "") or "", st.BODY)
            st.fit_height(ws, row, [(ch.get("label", ""), st.span_width(ws, 2, 2), 11),
                                    (ch.get("consequence", ""), st.span_width(ws, 3, last), 11)])
            for j in range(1, last + 1):
                ws.cell(row=row, column=j).border = st.ROW_LINE
            row += 1
        if not choices and d.get("consequence_fr"):
            row = st.merged_text(ws, row, 1, last, d["consequence_fr"], st.BODY)
        if d.get("recommendation_fr"):
            c = ws.cell(row=row, column=1, value="Notre conseil")
            c.font = st.font(10.5, bold=True, color=st.MUTED_INK)
            c.alignment = st.WRAP_TOP
            st.merged_text(ws, row, 2, last, d["recommendation_fr"], st.BODY)
            row += 1
        c = ws.cell(row=row, column=1, value="Décision retenue")
        c.font = st.font(10.5, bold=True)
        c.alignment = Alignment(vertical="center")
        pick = ws.cell(row=row, column=2, value="")
        pick.fill = st.fill(st.INPUT)
        pick.border = st.BOX
        if letters:
            dv = DataValidation(type="list", formula1='"' + ",".join(
                [f"Option {x}" for x in letters] + ["Autre (voir à droite)"]) + '"',
                allow_blank=True, showErrorMessage=False)
            ws.add_data_validation(dv)
            dv.add(pick.coordinate)
        note = ws.cell(row=row, column=3, value="Date et remarques : ")
        note.fill = st.fill(st.INPUT)
        note.font = st.SMALL
        note.alignment = st.WRAP_TOP
        ws.merge_cells(start_row=row, start_column=3, end_row=row, end_column=last)
        ws.row_dimensions[row].height = 30
        row += 2
    return len(ordered)


# ---------------------------------------------------------------- « Pour aller plus loin »

DETAIL_WIDTHS = [5, 15, 15, 21, 32, 46]

# Motifs internes de la grille, inutiles pour l'étudiant (« analyse fine au M5 »,
# « statut : sous_conditions », « hash SHA-256 »…).
_INTERNAL_MOTIF = ("statut :", "M4", "M5", "jalon", "hash", "inévaluable", "points accordés")

# Les 8 domaines de la grille, en mots simples (mêmes libellés que la page d'audit).
DOMAIN_PLAIN = {1: "Chaque patient compté une seule fois", 2: "Des cases remplies",
                3: "Des valeurs possibles", 4: "Des colonnes qui ne se contredisent pas",
                5: "Un tableau fidèle à votre protocole", 6: "Un critère principal mesurable",
                7: "Des colonnes expliquées", 8: "Prêt pour les calculs prévus"}


def _sheet_detail(wb: Workbook, findings: list[dict], score: dict, hide_ids: bool) -> None:
    ws = wb.create_sheet(SHEET_DETAIL)
    st.setup_sheet(ws, DETAIL_WIDTHS, "4B5563", DOCUMENT)
    last = len(DETAIL_WIDTHS)
    row = st.title_block(ws, "Insight Medics · Audit de votre base", "Pour aller plus loin",
                         "Le détail de chaque point relevé, et votre note point par point. "
                         "Rien à remplir ici : tout ce qui est à faire est dans les autres "
                         "onglets.", last)

    row = st.section(ws, row, f"Les {len(findings)} points relevés", last)
    if findings:
        row = st.header_row(ws, row, ["N°", "Priorité", "Patient(s)", "Colonne",
                                      "Ce qui ne va pas", "Explication"], freeze=False)
        ordered = sorted(findings, key=lambda f: PRIORITY_ORDER[
            SEVERITY_PRIORITY.get(f.get("severity", ""), "facultative")])
        for i, f in enumerate(ordered, start=1):
            prio = SEVERITY_PRIORITY.get(f.get("severity", ""), "facultative")
            row = st.data_row(ws, row, [i, PRIORITY_LABELS[prio], _rows_label(f, hide_ids),
                                        _variable(f), f.get("title_fr", ""),
                                        f.get("explanation_fr", "")], bold_cols=(5,),
                              center_cols=(1,))
            bg, ink = st.PRIORITY_STYLE[prio]
            cell = ws.cell(row=row - 1, column=2)
            cell.fill = st.fill(bg)
            cell.font = st.font(10, bold=True, color=ink)
    else:
        row = st.merged_text(ws, row, 1, last, "Aucun point relevé.", st.SUBTITLE)

    row = st.section(ws, row + 1, "Votre note, point par point", last)
    note = (f"Note : {st.fr_num(score.get('score_final'))}/100 ({score.get('niveau_qualite', '')})."
            f" Total des 8 points : {st.fr_num(score.get('score_brut'))}/100.")
    for cap in score.get("plafonds_appliques") or []:
        note += (f" La note ne peut pas dépasser {cap['plafond']}/100 tant que ce problème "
                 f"reste : {cap['defaut'].lower()}.")
    row = st.merged_text(ws, row, 1, last, note, st.BODY)
    head = ["Ce que nous vérifions", "", "", "Points", "Ce qui coûte des points", ""]
    for j, h in enumerate(head, start=1):
        c = ws.cell(row=row, column=j, value=h or None)
        c.font = st.HEADER
        c.fill = st.fill(st.BRAND)
        c.alignment = st.WRAP_CENTER
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=3)
    ws.merge_cells(start_row=row, start_column=5, end_row=row, end_column=6)
    ws.row_dimensions[row].height = 22
    row += 1
    for d in score.get("domaines") or []:
        losses = []
        for c in d.get("criteres") or []:
            if c["obtenu"] >= c["max"]:
                continue
            motif = c.get("motif") or ""
            if any(token in motif for token in _INTERNAL_MOTIF):
                motif = ""
            losses.append(f"• {c['critere']} ({st.fr_num(c['obtenu'])}/{c['max']})"
                          + (f" : {motif}" if motif else ""))
        name = f"{d['domaine']}. {DOMAIN_PLAIN.get(d['domaine'], d['nom'])}"
        ratio = d["obtenu"] / d["max"] if d.get("max") else 0
        ink = st.GREEN_INK if ratio >= 0.8 else st.ORANGE_INK if ratio >= 0.55 else st.RED_INK
        st.merged_text(ws, row, 1, 3, name, st.BODY_BOLD)
        pts = ws.cell(row=row, column=4, value=f"{st.fr_num(d['obtenu'])} / {d['max']}")
        pts.font = st.font(11, bold=True, color=ink)
        pts.alignment = st.CENTER
        text = "\n".join(losses) or "Rien à signaler"
        st.merged_text(ws, row, 5, last, text, st.BODY)
        st.fit_height(ws, row, [(name, st.span_width(ws, 1, 3), 11),
                                (text, st.span_width(ws, 5, last), 11)])
        for j in range(1, last + 1):
            ws.cell(row=row, column=j).border = st.ROW_LINE
        row += 1


# ---------------------------------------------------------------- assemblage

def build_client_workbook(profiling: dict, score_detail: dict, ai_audit: dict | None) -> bytes:
    assess = (ai_audit or {}).get("assessment") or {}
    findings = assess.get("findings") or []
    decisions = assess.get("client_decisions") or []
    id_col = (profiling.get("structure") or {}).get("id_column")
    pii_cols = {p.get("column") for p in profiling.get("pii_candidates") or []}
    hide_ids = bool(id_col and id_col in pii_cols)

    wb = Workbook()
    bilan = wb.active
    bilan.title = SHEET_BILAN
    archive_range, n_records = _sheet_archives(wb, assess, findings, hide_ids)
    n_questions = _sheet_questions(wb, decisions)
    _sheet_detail(wb, findings, score_detail, hide_ids)
    _sheet_bilan(wb, bilan, profiling, score_detail, assess, archive_range, n_records,
                 n_questions)
    wb.active = 0
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
