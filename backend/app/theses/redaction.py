"""Rédaction de la partie « Analyse statistique » du M&M et du chapitre Résultats, au
format de la faculté, à partir des seuls résultats calculés.

L'IA reçoit : la fiche de mission, les résultats du moteur (tableaux, faits, flux), les
figures que le code sait dessiner, et le prompt de la faculté (règles de Dr Hamza). Elle
rend un brouillon structuré (titres par niveau, paragraphes, appels `{{TAB:…}}` /
`{{FIG:…}}`, choix des tableaux et des figures) ; jamais un chiffre de son cru : le
contrôle des chiffres de `analysis/llm_write.py` refuse le brouillon sinon.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field

from ..analysis.llm_write import inconsistencies_in
from ..config import settings
from ..pipeline.llm_client import call_and_validate
from .charte import get_charte
from .controles import forbidden_terms
from .fiche import effective, fields, to_confirm

PROMPTS = Path(__file__).parent.parent / "prompts" / "theses"


class DHeading(BaseModel):
    type: Literal["heading"]
    level: int = Field(ge=0, le=3)
    text: str


class DParagraph(BaseModel):
    type: Literal["paragraph"]
    text: str


class DBullets(BaseModel):
    type: Literal["bullets"]
    items: list[str]


class DTable(BaseModel):
    """Tableau calculé par le moteur : `analysis_id` d'une analyse des résultats."""
    type: Literal["table"]
    analysis_id: str
    title: str


class DTextTable(BaseModel):
    """Tableau de texte rédigé (« Plan de l'analyse statistique ») : sans chiffre."""
    type: Literal["text_table"]
    key: str
    title: str
    columns: list[str]
    rows: list[list[str]]


class DFigure(BaseModel):
    """Figure dessinée par le code : `figure_id` d'une figure proposée."""
    type: Literal["figure"]
    figure_id: str
    title: str
    note: str = ""


DBlock = Annotated[DHeading | DParagraph | DBullets | DTable | DTextTable | DFigure,
                   Field(discriminator="type")]


class ResultsDraft(BaseModel):
    methods: list[DBlock] = []         # sous-parties de « Analyse statistique » (niveau ≥ 1)
    results: list[DBlock] = []         # chapitre Résultats
    to_confirm: list[str] = []         # mentions [À CONFIRMER : …], reprises dans le message
    missing: list[str] = []            # ce qui reste au biostatisticien


# Constantes de méthode qu'un M&M cite sans qu'elles viennent des résultats : seuil,
# effectifs théoriques ≥ 5, dix événements par variable, sortie p > 0,10, OR = 1.
METHOD_CONSTANTS = "5 10 0,10 1 95 0,05"


def draft_texts(draft: ResultsDraft, part: str | None = None) -> list[str]:
    """Texte rédigé (pour le contrôle des chiffres et des termes proscrits) ; `part` :
    « methods », « results » ou tout."""
    out: list[str] = []
    blocks = (draft.methods if part == "methods" else draft.results if part == "results"
              else [*draft.methods, *draft.results])
    for block in blocks:
        if isinstance(block, DHeading | DParagraph):
            out.append(block.text)
        elif isinstance(block, DBullets):
            out.extend(block.items)
        elif isinstance(block, DTable):
            out.append(block.title)
        elif isinstance(block, DTextTable):
            out.append(block.title)
            out.extend(cell for row in block.rows for cell in row)
        elif isinstance(block, DFigure):
            out.extend([block.title, block.note])
    return out


def structure_problems(draft: ResultsDraft, results: list[dict[str, Any]],
                       figure_ids: set[str]) -> list[str]:
    """Ce que le code vérifie avant d'accepter le brouillon : tableaux et figures connus,
    chacun appelé avant d'apparaître, diagramme de flux en Figure 1, titres de
    l'« Analyse statistique » à partir du niveau 1."""
    import re

    from .document import CALL_RE

    problems: list[str] = []
    ids = {r["id"] for r in results if not r.get("error") and r["table"]["rows"]}
    for part, blocks in (("methods", draft.methods), ("results", draft.results)):
        called: set[tuple[str, str]] = set()
        placed: set[str] = set()
        for b in blocks:
            texts = ([b.text] if isinstance(b, DHeading | DParagraph)
                     else b.items if isinstance(b, DBullets) else [])
            for t in texts:
                called.update((m.group(1), m.group(2)) for m in CALL_RE.finditer(t))
            if isinstance(b, DTable):
                if b.analysis_id not in ids:
                    problems.append(f"tableau inconnu ou vide : {b.analysis_id}")
                if ("TAB", b.analysis_id) not in called:
                    problems.append(f"le tableau {b.analysis_id} n'est pas appelé "
                                    f"({{{{TAB:{b.analysis_id}}}}}) avant d'apparaître")
                placed.add(f"TAB:{b.analysis_id}")
            elif isinstance(b, DTextTable):
                if ("TAB", b.key) not in called:
                    problems.append(f"le tableau {b.key} n'est pas appelé avant d'apparaître")
                placed.add(f"TAB:{b.key}")
            elif isinstance(b, DFigure):
                if b.figure_id not in figure_ids:
                    problems.append(f"figure inconnue : {b.figure_id}")
                if ("FIG", b.figure_id) not in called:
                    problems.append(f"la figure {b.figure_id} n'est pas appelée avant d'apparaître")
                placed.add(f"FIG:{b.figure_id}")
            elif isinstance(b, DHeading) and part == "methods" and b.level == 0:
                problems.append("« Analyse statistique » est posée par le code : les titres "
                                "de la partie méthodes commencent au niveau 1")
        for kind, key in called:
            if f"{kind}:{key}" not in placed:
                problems.append(f"appel {{{{{kind}:{key}}}}} sans {('tableau' if kind == 'TAB' else 'figure')} "
                                "dans la même partie")
    figures = [b for b in draft.results if isinstance(b, DFigure)]
    if "flux" in figure_ids and (not figures or figures[0].figure_id != "flux"):
        problems.append("la Figure 1 des Résultats est le diagramme de flux (figure_id « flux »)")
    used = [b.analysis_id for b in draft.results if isinstance(b, DTable)]
    if len(used) != len(set(used)):
        problems.append("un même tableau est placé deux fois")
    for t in draft_texts(draft):
        if re.search(r"\b(Tableau|Table|Figure)\s+([IVXLC]+|\d+)\b", t):
            problems.append("numéro de tableau ou de figure écrit en dur : utiliser {{TAB:…}} "
                            "ou {{FIG:…}}")
            break
    return problems


def _fiche_for_prompt(fiche: dict[str, Any] | None) -> dict[str, Any]:
    eff = effective(fiche)
    specs = fields()
    return {specs[k].get("libelle", k) + f" [{k}]": v for k, v in eff.items() if k in specs}


def system_prompt(faculty: str) -> str:
    """Règles communes + règles de la faculté (extraites des prompts de Hamza)."""
    common = (PROMPTS / "resultats_commun.md").read_text(encoding="utf-8")
    fac = (PROMPTS / f"resultats_{faculty}.md").read_text(encoding="utf-8")
    return common + "\n\n" + fac


def build_user_message(context: dict[str, Any], fiche: dict[str, Any] | None,
                       figures: list[dict[str, Any]], instructions: str) -> str:
    charte = get_charte(effective(fiche)["these.faculte"])
    parts = [
        "## FICHE DE MISSION (remplie par l'étudiant et l'équipe)\n<contenu_client id=\"fiche\">\n"
        + json.dumps(_fiche_for_prompt(fiche), ensure_ascii=False) + "\n</contenu_client>",
        "## CHAMPS NON DOCUMENTÉS (mention [À CONFIRMER : …] si tu en as besoin)\n"
        + json.dumps(to_confirm(fiche), ensure_ascii=False),
        f"## FACULTÉ\n{charte.name} ({charte.code}). La partie « Analyse statistique » "
        f"porte le numéro {charte.stats_section_number} de son M&M : le code pose ce titre ; "
        "tes titres de méthodes commencent au niveau 1.",
        "## LOGICIEL À DÉCLARER\n" + (settings.thesis_software.strip() or "(vide)"),
        "## FIGURES QUE LE CODE SAIT DESSINER (figure_id → contenu)\n"
        + json.dumps(figures, ensure_ascii=False),
        "## RÉSULTATS CALCULÉS\n" + json.dumps(context, ensure_ascii=False, default=str),
    ]
    if instructions.strip():
        parts.insert(1, "## CONSIGNES DE L'ÉQUIPE (réponses de l'étudiant, de son directeur)\n"
                     f"<contenu_client id=\"consignes\">\n{instructions.strip()}\n</contenu_client>")
    return "\n\n".join(parts)


def run_results_writer(context: dict[str, Any], fiche: dict[str, Any] | None,
                       figures: list[dict[str, Any]], results: list[dict[str, Any]],
                       instructions: str = "") -> tuple[ResultsDraft | None, list[str]]:
    faculty = effective(fiche)["these.faculte"]
    system = system_prompt(faculty)
    user = build_user_message(context, fiche, figures, instructions)
    figure_ids = {f["figure_id"] for f in figures}
    lang = effective(fiche).get("these.langue", "fr")

    def _post(out: ResultsDraft) -> tuple[ResultsDraft, list[str]]:
        bad = inconsistencies_in(draft_texts(out, "results"), context)
        bad += inconsistencies_in(draft_texts(out, "methods"),
                                  {**context, "constantes_de_methode": METHOD_CONSTANTS})
        bad += structure_problems(out, results, figure_ids)
        bad += [f"terme proscrit : « {t} »" for t in forbidden_terms(" ".join(draft_texts(out)),
                                                                      lang)]
        if bad:
            raise ValueError("; ".join(bad[:20]) + ". Corrige ces points ; recopie uniquement "
                             "les chiffres fournis, avec leur effectif et leur p exacts.")
        return out, [f"{len(out.results)} blocs de Résultats, chiffres et structure contrôlés"]

    out, notes = call_and_validate(system, user, ResultsDraft, post=_post)
    return out, ["Rédaction IA : " + n for n in notes]
