"""Du brouillon de l'IA et des résultats du moteur aux deux livrables Word de l'offre
« Analyses + résultats », au format de la faculté :

- `Analyse_statistique_*.docx` : la partie « Analyse statistique » du M&M (numérotée
  comme dans le plan type de la faculté : IX à Sousse, 6 à Tunis…), à insérer dans le
  M&M de l'étudiant ;
- `Resultats_*.docx` : le chapitre Résultats (page intercalaire, titres numérotés,
  tableaux et figures de la charte).

Les tableaux viennent du moteur (jamais de l'IA) : colonne « Test » retirée et reportée
en note, p < 0,05 en gras, « – » pour non applicable. Les figures sont dessinées par le
code ; une figure qui montre une variable la retire de son tableau (« une donnée, un seul
support »).
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Literal

import pandas as pd

from ..analysis.stats import _levels, _num, fmt_p, is_normal, test_quant
from . import figures as fig
from .charte import Charte, get_charte
from .document import (
    Block,
    BulletsBlock,
    Chapter,
    FigureBlock,
    HeadingBlock,
    ParagraphBlock,
    TableBlock,
    ThesisDoc,
)
from .fiche import effective
from .redaction import DBullets, DFigure, DHeading, DParagraph, DTable, DTextTable, ResultsDraft
from .render_docx import render

SEP = "::"  # figure_id = « analyse::variable »

_TEXT = {
    "fr": {"methods": "Matériel et méthodes", "results": "Résultats",
           "stats": "Analyse statistique",
           "conventions": "Valeurs exprimées en effectif (pourcentage), moyenne ± écart-type "
                          "ou médiane [Q1–Q3].",
           "tests": "Tests : ", "or": "OR [IC 95 %] donné pour les associations "
                                      "significatives ; « – » sinon.",
           "wilson": "Intervalle de confiance à 95 % calculé par la méthode de Wilson.",
           "logit": "OR : odds ratio ; IC 95 % : intervalle de confiance à 95 %.",
           "hl": "Test de Hosmer-Lemeshow : p = {p}."},
    "en": {"methods": "Materials and Methods", "results": "Results",
           "stats": "Statistical analysis",
           "conventions": "Values are n (%), mean ± SD or median [Q1–Q3].",
           "tests": "Tests: ", "or": "OR [95% CI] given for significant associations; "
                                     "“–” otherwise.",
           "wilson": "95% confidence interval by the Wilson method.",
           "logit": "OR: odds ratio; CI: confidence interval.",
           "hl": "Hosmer-Lemeshow test: p = {p}."},
}


# ---------------------------------------------------------------- figures proposées

def _spec(plan: dict[str, Any], analysis_id: str) -> dict[str, Any]:
    return next((a for a in plan.get("analyses") or [] if a.get("id") == analysis_id), {})


def _group_of(plan: dict[str, Any], spec: dict[str, Any]) -> str | None:
    if spec.get("kind") == "compare":
        return spec.get("group") or (plan.get("groups") or {}).get("variable")
    if spec.get("kind") == "describe" and spec.get("by_group", True):
        return (plan.get("groups") or {}).get("variable")
    return None


def figure_candidates(plan: dict[str, Any], results: list[dict[str, Any]],
                      base: pd.DataFrame) -> list[dict[str, Any]]:
    """Les figures que le code sait dessiner pour ces résultats (l'IA en choisit 3 ou 4
    en plus du diagramme de flux)."""
    group_var = (plan.get("groups") or {}).get("variable")
    out = [{"figure_id": "flux", "forme": "diagramme de flux",
            "contenu": "lignes de la base, exclusions et motifs, patients analysés"
                       + (f", répartition selon « {group_var} »" if group_var else "")}]
    for r in results:
        if r.get("error") or not r["table"]["rows"]:
            continue
        spec = _spec(plan, r["id"])
        kind = spec.get("kind")
        if kind == "paired":
            out.append({"figure_id": r["id"], "forme": "lignes individuelles et médiane",
                        "contenu": f"{spec.get('label', r['title'])} à chaque temps"})
            continue
        if kind not in ("describe", "compare"):
            continue
        group = _group_of(plan, spec)
        for v in spec.get("variables") or []:
            name, label = v["name"], v.get("label") or v["name"]
            if name not in base.columns:
                continue
            if v["type"] == "quantitative" and group and group in base.columns \
                    and 2 <= len(_levels(base[group])) <= 4:
                out.append({"figure_id": f"{r['id']}{SEP}{name}", "forme": "boîtes à moustaches",
                            "contenu": f"{label} selon « {group} », avec le p",
                            "retire_du_tableau": f"{r['id']} : ligne « {label} »"})
            elif v["type"] != "quantitative" and not group and 3 <= len(_levels(base[name])) <= 8:
                out.append({"figure_id": f"{r['id']}{SEP}{name}", "forme": "barres n (%)",
                            "contenu": f"répartition de « {label} »",
                            "retire_du_tableau": f"{r['id']} : lignes « {label} »"})
    return out


def _draw(figure_id: str, plan: dict[str, Any], flow: list[dict[str, Any]],
          results: list[dict[str, Any]], base: pd.DataFrame, charte: Charte,
          workdir: Path) -> Path:
    path = workdir / f"Figure_{re.sub(r'[^A-Za-z0-9_-]+', '_', figure_id)}.png"
    font, width = charte.figure_font, min(13.0, charte.usable_cm)
    group_var = (plan.get("groups") or {}).get("variable")
    if figure_id == "flux":
        arms = None
        if group_var and group_var in base.columns:
            g = base[group_var]
            arms = [(str(lv), int((g == lv).sum())) for lv in _levels(g)]
            arms = arms if 2 <= len(arms) <= 4 else None
        return fig.flow_diagram(flow, path, font, charte.usable_cm, arms)
    if SEP not in figure_id:
        spec = _spec(plan, figure_id)
        if spec.get("kind") != "paired":
            raise ValueError(f"figure inconnue : {figure_id}")
        data = pd.DataFrame({t: _num(base[v]) for t, v in
                             zip(spec["times"], spec["variables"], strict=True)}).dropna()
        r = next(x for x in results if x["id"] == figure_id)
        stat = (r.get("figure") or {}).get("stat", "médiane")
        p_labels = [f"{f['comparison']} : {_p(f['p'])}" for f in r.get("facts") or []
                    if f.get("comparison") and f.get("comparison") != "global"]
        return fig.paired_lines(list(spec["times"]), data.to_numpy().tolist(),
                                spec.get("label", ""), stat, path, font, width, p_labels)
    analysis_id, name = figure_id.split(SEP, 1)
    spec = _spec(plan, analysis_id)
    var = next(v for v in spec.get("variables") or [] if v["name"] == name)
    label = var.get("label") or name
    group = _group_of(plan, spec)
    if var["type"] == "quantitative" and group:
        x, g = _num(base[name]), base[group]
        levels = _levels(g)
        parts = [x[g == lv].dropna() for lv in levels]
        normal = all(is_normal(p) for p in parts)
        p, test = test_quant(parts, normal)
        return fig.boxes([(str(lv), part.tolist()) for lv, part in zip(levels, parts, strict=True)],
                         label, f"p {_p(fmt_p(p))}", test, path, font, width)
    s = base[name].dropna()
    levels = _levels(base[name])
    counts = [int((s == lv).sum()) for lv in levels]
    ordinal = all(isinstance(lv, int | float) for lv in levels)
    return fig.bars([str(lv) for lv in levels], counts, len(s), path, font, width, ordinal)


def _p(text: str) -> str:
    """« 0,014 » → « = 0,014 » ; « < 0,001 » tel quel."""
    return text if text.strip().startswith(("<", "=")) else f"= {text}"


# ---------------------------------------------------------------- tableaux

def _p_value(cell: str) -> float | None:
    t = cell.replace(" ", " ").strip()
    if t.startswith("<"):
        return 0.0
    try:
        return float(t.replace(",", ".").replace("−", "-"))
    except ValueError:
        return None


def _drop_variable_rows(rows: list[list[str]], label: str) -> list[list[str]]:
    """Retire d'un tableau la ligne d'une variable (et ses modalités en retrait)."""
    out: list[list[str]] = []
    skipping = False
    for row in rows:
        first = str(row[0]) if row else ""
        if not first.startswith(" "):
            skipping = re.sub(r"\s*\(manquant : \d+\)$", "", first.strip()) == label
            if skipping:
                continue
        elif skipping:
            continue
        out.append(row)
    return out


def thesis_table(r: dict[str, Any], title: str, lang: str, alpha: float,
                 hide: list[str]) -> TableBlock:
    """Tableau du moteur → tableau de thèse."""
    t = _TEXT[lang]
    columns = list(r["table"]["columns"])
    rows = [list(map(str, row)) for row in r["table"]["rows"]]
    for label in hide:
        rows = _drop_variable_rows(rows, label)
    tests: list[str] = []
    if "Test" in columns:
        j = columns.index("Test")
        tests = [row[j] for row in rows if j < len(row) and row[j].strip()]
        columns.pop(j)
        rows = [row[:j] + row[j + 1:] for row in rows]
    p_cols = [j for j, c in enumerate(columns) if c.strip() == "p"]
    clean: list[list[str]] = []
    for row in rows:
        cells = [c.replace("—", "–") for c in row]
        for j in p_cols:
            if j < len(cells):
                p = _p_value(cells[j])
                if p is not None and p < alpha and not cells[j].startswith("**"):
                    cells[j] = f"**{cells[j]}**"
        clean.append(cells)
    notes: list[str] = []
    kind = r.get("kind")
    if kind in ("describe", "compare"):
        notes.append(t["conventions"])
        if tests:
            names = list(dict.fromkeys(re.sub(r"\s*\(.*\)$", "", x) for x in tests))
            notes.append(t["tests"] + " ; ".join(names) + ".")
        if columns and columns[-1].startswith("OR"):
            notes.append(t["or"])
    elif kind == "proportion":
        notes.append(t["wilson"])
    elif kind == "logistic":
        notes.append(t["logit"])
        hl = next((f.get("hosmer_lemeshow_p") for f in r.get("facts") or []
                   if isinstance(f, dict) and f.get("hosmer_lemeshow_p")), None)
        if hl:
            notes.append(t["hl"].format(p=hl))
    notes.extend(w.rstrip(".") + "." for w in r.get("warnings") or [])
    return TableBlock(key=r["id"], title=title, columns=columns, rows=clean,
                      note=" ".join(notes))


# ---------------------------------------------------------------- livrables

def _first(value: Any, default: int = 1) -> int:
    """« I », « III » ou 3 → 3."""
    if isinstance(value, int):
        return max(1, value)
    if isinstance(value, str) and value.strip():
        v = value.strip().upper()
        if v.isdigit():
            return max(1, int(v))
        values = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100}
        if all(ch in values for ch in v):
            total = 0
            for i, ch in enumerate(v):
                n = values[ch]
                total += -n if i + 1 < len(v) and values[v[i + 1]] > n else n
            return max(1, total)
    return default


def _convert(blocks: list[Any], ctx: dict[str, Any]) -> list[Block]:
    out: list[Block] = []
    for b in blocks:
        if isinstance(b, DHeading):
            out.append(HeadingBlock(level=b.level, text=b.text))
        elif isinstance(b, DParagraph):
            out.append(ParagraphBlock(text=b.text))
        elif isinstance(b, DBullets):
            out.append(BulletsBlock(items=b.items))
        elif isinstance(b, DTable):
            r = ctx["results"][b.analysis_id]
            out.append(thesis_table(r, b.title, ctx["lang"], ctx["alpha"],
                                    ctx["hide"].get(b.analysis_id, [])))
        elif isinstance(b, DTextTable):
            out.append(TableBlock(key=b.key, title=b.title, columns=b.columns, rows=b.rows,
                                  group_rows=[]))
        elif isinstance(b, DFigure):
            path = _draw(b.figure_id, ctx["plan"], ctx["flow"], list(ctx["results"].values()),
                         ctx["base"], ctx["charte"], ctx["workdir"])
            out.append(FigureBlock(key=b.figure_id, title=b.title, image_path=str(path),
                                   note=b.note,
                                   width_cm=ctx["charte"].usable_cm if b.figure_id == "flux"
                                   else min(13.0, ctx["charte"].usable_cm)))
    return out


def build_docs(plan: dict[str, Any], flow: list[dict[str, Any]], results: list[dict[str, Any]],
               base: pd.DataFrame, draft: ResultsDraft, fiche: dict[str, Any] | None,
               workdir: Path) -> tuple[ThesisDoc, ThesisDoc, Charte]:
    eff = effective(fiche)
    charte = get_charte(eff["these.faculte"])
    lang: Literal["fr", "en"] = "en" if eff.get("these.langue") == "en" else "fr"
    t = _TEXT[lang]
    hide: dict[str, list[str]] = {}
    placed_figs = {b.figure_id for b in draft.results if isinstance(b, DFigure)}
    for fid in placed_figs:
        if SEP in fid:
            aid, name = fid.split(SEP, 1)
            var = next((v for v in _spec(plan, aid).get("variables") or []
                        if v["name"] == name), None)
            if var:
                hide.setdefault(aid, []).append(var.get("label") or name)
    ctx = {"results": {r["id"]: r for r in results}, "plan": plan, "flow": flow, "base": base,
           "charte": charte, "workdir": workdir, "lang": lang, "hide": hide,
           "alpha": float(plan.get("alpha") or 0.05)}
    numbering = eff.get("numerotation") or {}
    first_table = _first(numbering.get("premier_tableau"), 1)
    first_figure = _first(numbering.get("premiere_figure"), 1)
    title = str(eff.get("these.titre") or "")
    methods_blocks: list[Block] = [HeadingBlock(level=0, text=t["stats"],
                                                number=charte.stats_section_number)]
    methods_blocks += _convert(draft.methods, ctx)
    methods = ThesisDoc(thesis_title=title, lang=lang, insert=True, first_table=first_table,
                        first_figure=first_figure,
                        chapters=[Chapter(key="methodes", name=t["methods"],
                                          blocks=methods_blocks)])
    n_tables = sum(isinstance(b, TableBlock) for b in methods_blocks)
    n_figures = sum(isinstance(b, FigureBlock) for b in methods_blocks)
    results_doc = ThesisDoc(thesis_title=title, lang=lang, first_table=first_table + n_tables,
                            first_figure=first_figure + n_figures,
                            chapters=[Chapter(key="resultats", name=t["results"],
                                              blocks=_convert(draft.results, ctx))])
    return methods, results_doc, charte


def render_both(methods: ThesisDoc, results_doc: ThesisDoc, charte: Charte) -> tuple[bytes, bytes]:
    lang = results_doc.lang
    return (render(methods, charte, _TEXT[lang]["stats"]),
            render(results_doc, charte, _TEXT[lang]["results"]))


def subject_slug(fiche: dict[str, Any] | None, fallback: str = "These") -> str:
    """Mot-clé court sans accent ni espace pour les noms de fichiers (« Hemothorax »)."""
    import unicodedata

    title = str(effective(fiche).get("these.titre") or "")
    words = [w for w in re.findall(r"[A-Za-zÀ-ÿ]+", title) if len(w) > 3]
    stop = {"dans", "chez", "pour", "avec", "sans", "entre", "selon", "étude", "etude",
            "patients", "service", "facteurs", "associés", "profil", "évaluation", "prise",
            "charge"}
    key = next((w for w in words if w.lower() not in stop), fallback)
    key = unicodedata.normalize("NFKD", key).encode("ascii", "ignore").decode()
    return key[:1].upper() + key[1:].lower() if key else fallback

