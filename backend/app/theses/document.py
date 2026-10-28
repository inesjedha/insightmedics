"""Contenu d'un chapitre de thèse, indépendant de la mise en page.

L'IA et le code produisent ce contenu ; `render_docx.py` le met en forme selon la charte
de la faculté. Les numéros n'y figurent jamais en dur :
- titres : `level` (0 = premier niveau) ; le rendu numérote (« I. », « 1. », « 1.1. »),
  met en capitales et ajoute le « : » final selon la faculté ;
- tableaux et figures : une clé (`key`) ; le texte les appelle par `{{TAB:clé}}` et
  `{{FIG:clé}}`, remplacés par « Tableau III » ou « Figure 2 » ; les numéros suivent
  l'ordre d'apparition, à partir des numéros de départ de la fiche de mission ;
- gras : `**…**` (un p < 0,05 est en gras).
"""

from __future__ import annotations

import re
from typing import Annotated, Literal

from pydantic import BaseModel, Field


class HeadingBlock(BaseModel):
    type: Literal["heading"] = "heading"
    level: int = Field(ge=0, le=3)
    text: str
    # Numéro imposé (« IX. ANALYSE STATISTIQUE » inséré dans le M&M de l'étudiant) ;
    # les titres suivants de même niveau continuent à partir de lui.
    number: int | None = None


class ParagraphBlock(BaseModel):
    type: Literal["paragraph"] = "paragraph"
    text: str


class BulletsBlock(BaseModel):
    type: Literal["bullets"] = "bullets"
    items: list[str]


class TableBlock(BaseModel):
    type: Literal["table"] = "table"
    key: str
    title: str                                  # sans « Tableau N : »
    columns: list[str]
    rows: list[list[str]]
    note: str = ""
    # Lignes de regroupement (« Antécédents ») : index des lignes ; à défaut, une ligne dont
    # seules la première cellule est remplie en est une.
    group_rows: list[int] | None = None
    col_widths: list[float] | None = None       # en proportion ; défaut : 1re colonne plus large


class FigureBlock(BaseModel):
    type: Literal["figure"] = "figure"
    key: str
    title: str                                  # sans « Figure N : »
    image_path: str = ""                        # PNG produit par le code (jamais par l'IA)
    width_cm: float | None = None               # défaut : largeur utile de la faculté
    note: str = ""


class ReferencesBlock(BaseModel):
    type: Literal["references"] = "references"
    title: str = "RÉFÉRENCES"
    items: list[str]                            # notices Vancouver, dans l'ordre
    start: int = 1


Block = Annotated[HeadingBlock | ParagraphBlock | BulletsBlock | TableBlock | FigureBlock
                  | ReferencesBlock, Field(discriminator="type")]


class Chapter(BaseModel):
    """Un chapitre : page intercalaire (selon la faculté), titre, contenu."""
    key: Literal["introduction", "methodes", "resultats", "discussion", "conclusion",
                 "references", "autre"]
    name: str                                   # « Résultats » (intercalaire, en-tête)
    blocks: list[Block] = []


class ThesisDoc(BaseModel):
    """Un livrable Word : un ou plusieurs chapitres qui se suivent."""
    thesis_title: str = ""                      # en-tête FMT et FMM
    lang: Literal["fr", "en"] = "fr"
    # Extrait à insérer dans un chapitre de l'étudiant (« Analyse statistique ») : ni page
    # intercalaire ni titre de chapitre, seulement l'en-tête.
    insert: bool = False
    chapters: list[Chapter]
    first_page: int = 1
    first_table: int = 1
    first_figure: int = 1


CALL_RE = re.compile(r"\{\{(TAB|FIG):([\w.:\-]+)\}\}")
BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
