"""Chartes de mise en page des quatre facultés, en valeurs typées.

Source : les chartes mesurées par Dr Hamza dans les Word livrés (`hamza/04_Charte_*.json`).
Les JSON de Hamza mélangent valeurs et texte libre (« simple 1 pt 156082 ») et n'ont pas
les mêmes clés d'une faculté à l'autre : on les transcrit ici une fois, et
`tests/test_theses_charte.py` vérifie que les valeurs clés (marges, polices, tailles,
couleurs) restent identiques aux JSON. Quand Hamza met une charte à jour : remplacer le
JSON dans `hamza/`, relancer les tests, reporter l'écart ici.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

Align = Literal["left", "center", "right", "justify"]
FacultyCode = Literal["FMS", "FMT", "FMM", "FMSf"]
FACULTIES: tuple[FacultyCode, ...] = ("FMS", "FMT", "FMM", "FMSf")


@dataclass(frozen=True)
class Font:
    name: str
    size: float
    bold: bool = False
    italic: bool = False
    color: str | None = None          # « 0070C0 » ; None = automatique (noir)
    small_caps: bool = False
    caps: bool = False                # le texte est saisi en capitales par le code


@dataclass(frozen=True)
class Para:
    align: Align = "left"
    before: float = 0                 # pt
    after: float = 0                  # pt
    line: float = 1.0                 # interligne (multiple)
    first_indent_cm: float = 0
    left_indent_cm: float = 0
    keep_next: bool = False


@dataclass(frozen=True)
class Rule:
    """Filet : épaisseur en points, couleur (None = automatique)."""
    pt: float
    color: str | None = None


@dataclass(frozen=True)
class Heading:
    font: Font
    para: Para
    rule_below: Rule | None = None


@dataclass(frozen=True)
class Level(Heading):
    """Niveau de titre numéroté. `suffix` : « : » final (FMS) ou rien."""
    suffix: str = ""


@dataclass(frozen=True)
class Caption:
    font: Font
    para: Para
    label_bold_only: bool = False     # FMT : « Tableau III » en gras, le titre non


@dataclass(frozen=True)
class TableStyle:
    font: Font
    width_cm: float
    rule_top: Rule
    rule_header: Rule
    rule_bottom: Rule
    cell_before: float = 1.5
    cell_after: float = 1.5
    band_fill: str | None = None      # lignes alternées
    group_fill: str | None = None     # ligne de regroupement (« Antécédents »)
    group_color: str | None = None    # couleur du texte des lignes de regroupement
    text_color: str | None = None
    indent_cm: float = 0.3            # retrait des modalités


@dataclass(frozen=True)
class Intercalaire:
    """Page de titre du chapitre, seule sur sa page, sans en-tête ni numéro affiché."""
    heading: Heading
    uppercase: bool = False           # « RÉSULTATS » (FMM, FMSf) ou « Résultats » (FMS)
    blank_paragraphs: int = 0         # FMSf : 13 paragraphes vides avant le titre
    vertical_center: bool = False     # FMM : centré verticalement


@dataclass(frozen=True)
class PageHeader:
    kind: Literal["chapter", "title_and_chapter"]
    font: Font
    align: Align = "right"
    rule_below: Rule | None = None
    title_font: Font | None = None    # FMM : titre de la thèse en italique bleu


@dataclass(frozen=True)
class PageFooter:
    font: Font
    align: Align = "right"
    rule_above: Rule | None = None


@dataclass(frozen=True)
class References:
    open: str                         # « ( » ou « [ »
    close: str
    sep: str                          # « , » (FMS) ou « , » + espace
    font: Font = field(default_factory=lambda: Font("Times New Roman", 12))
    para: Para = field(default_factory=Para)
    hanging_cm: float = 0.75


@dataclass(frozen=True)
class Bullets:
    symbol: str
    left_cm: float
    hanging_cm: float
    after: float = 0


@dataclass(frozen=True)
class Charte:
    code: FacultyCode
    name: str
    margins_cm: tuple[float, float, float, float]   # haut, bas, gauche, droite
    header_cm: float
    footer_cm: float
    usable_cm: float
    body: Font
    body_para: Para
    bullets: Bullets
    intercalaire: Intercalaire | None
    chapter_title: Heading | None     # titre centré sous l'intercalaire (FMS, FMT)
    chapter_title_uppercase: bool
    levels: tuple[Level, ...]
    roman_top_level: bool             # FMS : « I. » puis « 1. » puis « 1.1. »
    caption_table: Caption
    caption_figure: Caption
    note: Font
    note_para: Para
    table: TableStyle
    header: PageHeader
    footer: PageFooter
    refs: References
    lang: str = "fr-FR"
    lang_small_caps: str | None = None  # FMS : fr-BE sur les petites capitales
    no_headings_in: tuple[str, ...] = ()  # FMSf : ni titre ni sous-titre dans l'Introduction et la Conclusion
    figure_font: str = "Times New Roman"
    # Numéro de la partie « Analyse statistique » dans le plan type du M&M de la faculté
    # (FMS : IX ; FMT : 6 ; FMM : 7 ; FMSf : 8).
    stats_section_number: int = 1


def _fms() -> Charte:
    avant = "AvantGarde Bk BT"
    caption = Caption(Font("Souvenir Lt BT", 11, bold=True, italic=True, color="1F497D"),
                      Para("center", 6, 6, keep_next=True))
    return Charte(
        code="FMS", stats_section_number=9, name="Faculté de médecine de Sousse",
        margins_cm=(2.5, 2.5, 3.0, 2.5), header_cm=1.25, footer_cm=1.25, usable_cm=15.5,
        body=Font("Times New Roman", 12, color="000000"),
        body_para=Para("justify", 0, 10, 1.5),
        bullets=Bullets("➢", 1.23, 0.63, 6),
        intercalaire=Intercalaire(
            Heading(Font("Albertus", 45, bold=True, small_caps=True, color="00B0F0"),
                    Para("right", 150, 12), Rule(2.25, "A6A6A6"))),
        chapter_title=Heading(Font(avant, 22, bold=True, color="0070C0"), Para("center", 0, 18)),
        chapter_title_uppercase=True,
        levels=(
            Level(Font(avant, 15, bold=True, caps=True), Para("left", 18, 18, keep_next=True),
                  suffix=" :"),
            Level(Font(avant, 15, bold=True, small_caps=True), Para("left", 18, 18, keep_next=True),
                  suffix=" :"),
            Level(Font(avant, 13, bold=True), Para("left", 18, 18, keep_next=True), suffix=" :"),
            Level(Font(avant, 13, bold=True, italic=True), Para("left", 18, 18, keep_next=True),
                  suffix=" :"),
        ),
        roman_top_level=True,
        caption_table=caption,
        caption_figure=Caption(caption.font, Para("center", 6, 0)),
        note=Font("Times New Roman", 10, italic=True),
        note_para=Para("justify", 3, 10, 1.0),
        table=TableStyle(Font("Times New Roman", 11), 15.5, Rule(1, "156082"), Rule(0.75, "156082"),
                         Rule(1, "156082"), group_fill="B7D4EF"),
        header=PageHeader("chapter", Font("Times New Roman", 12, bold=True, italic=True),
                          "right", Rule(1, "000000")),
        footer=PageFooter(Font("Times New Roman", 12, bold=True), "right", Rule(1, "000000")),
        refs=References("(", ")", ",", Font("Times New Roman", 12), Para("left", 0, 4, 1.15), 0.75),
        lang_small_caps="fr-BE",
    )


def _fmt() -> Charte:
    blue = "1F4E79"
    return Charte(
        code="FMT", stats_section_number=6, name="Faculté de médecine de Tunis",
        margins_cm=(2.0, 2.0, 4.0, 2.5), header_cm=0.9, footer_cm=0.9, usable_cm=14.5,
        body=Font("Tahoma", 11),
        body_para=Para("justify", 0, 6, 1.5),
        bullets=Bullets("•", 0.95, 0.45, 2),
        intercalaire=None,
        chapter_title=Heading(Font("Tahoma", 14, bold=True, color=blue), Para("center", 0, 18),
                              Rule(1, blue)),
        chapter_title_uppercase=True,
        levels=(
            Level(Font("Tahoma", 12.5, bold=True, color=blue), Para("left", 14, 6, 1.15, keep_next=True)),
            Level(Font("Tahoma", 11.5, bold=True, color="1A1A1A"), Para("left", 10, 5, keep_next=True)),
            Level(Font("Tahoma", 11, bold=True, italic=True, color="1A1A1A"),
                  Para("left", 8, 4, keep_next=True)),
        ),
        roman_top_level=False,
        caption_table=Caption(Font("Tahoma", 10.5, color="1A1A1A"), Para("left", 10, 4, keep_next=True),
                              label_bold_only=True),
        caption_figure=Caption(Font("Tahoma", 10.5, color="1A1A1A"), Para("center", 4, 10),
                               label_bold_only=True),
        note=Font("Tahoma", 9, italic=True, color="1A1A1A"),
        note_para=Para("left", 2, 10, 1.0),
        table=TableStyle(Font("Tahoma", 9.5), 14.5, Rule(1, "5B9BD5"), Rule(1, "5B9BD5"),
                         Rule(1, "5B9BD5"), cell_before=1, cell_after=1, band_fill="DDEBF7",
                         group_color=blue),
        header=PageHeader("title_and_chapter", Font("Tahoma", 9, italic=True)),
        footer=PageFooter(Font("Tahoma", 9), "right"),
        refs=References("[", "]", ", ", Font("Tahoma", 10), Para("left", 0, 3, 1.0), 0.75),
        figure_font="Tahoma",
    )


def _fmm() -> Charte:
    return Charte(
        code="FMM", stats_section_number=7, name="Faculté de médecine de Monastir",
        margins_cm=(2.5, 2.3, 2.5, 2.5), header_cm=1.0, footer_cm=1.2, usable_cm=16.0,
        body=Font("Times New Roman", 12),
        body_para=Para("justify", 0, 4, 1.5, first_indent_cm=1.25),
        bullets=Bullets("–", 1.0, 0.5, 2),
        intercalaire=Intercalaire(
            Heading(Font("Times New Roman", 36, bold=True, color="215E99"), Para("center")),
            uppercase=True, vertical_center=True),
        chapter_title=None,
        chapter_title_uppercase=True,
        levels=(
            Level(Font("Times New Roman", 14, bold=True, small_caps=True, color="001F5F"),
                  Para("left", 14, 6, keep_next=True)),
            Level(Font("Times New Roman", 12, bold=True, color="1F487C"), Para("left", 10, 4, keep_next=True)),
            Level(Font("Times New Roman", 12, bold=True, italic=True, color="4F81BC"),
                  Para("left", 8, 2, keep_next=True)),
        ),
        roman_top_level=False,
        caption_table=Caption(Font("Times New Roman", 12, bold=True, color="000000"),
                              Para("center", 10, 4, keep_next=True)),
        caption_figure=Caption(Font("Times New Roman", 12, bold=True, color="000000"),
                               Para("center", 4, 2)),
        note=Font("Times New Roman", 10),
        note_para=Para("justify", 1, 10, 1.0),
        table=TableStyle(Font("Times New Roman", 10), 16.0, Rule(1, "4F81BD"), Rule(0.75, "4F81BD"),
                         Rule(1, "4F81BD"), band_fill="F2F6FB", group_fill="DCE6F2"),
        header=PageHeader("title_and_chapter", Font("Times New Roman", 10, italic=True, color="215E99"),
                          rule_below=Rule(0.5, "0F4761"),
                          title_font=Font("Times New Roman", 10, italic=True, color="215E99")),
        footer=PageFooter(Font("Times New Roman", 10.5), "right"),
        refs=References("[", "]", ", ", Font("Times New Roman", 11), Para("left", 0, 3, 1.0), 0.8),
    )


def _fmsf() -> Charte:
    # Style de tableau Word « Liste 6 Couleur - Accentuation 5 » des livraisons FMSf,
    # reproduit en mise en forme directe (texte et filets bleus, lignes alternées).
    accent, dark = "4472C4", "2F5496"
    return Charte(
        code="FMSf", stats_section_number=8, name="Faculté de médecine de Sfax",
        margins_cm=(2.5, 2.5, 2.8, 2.2), header_cm=2.0, footer_cm=2.0, usable_cm=16.0,
        body=Font("Times New Roman", 14),
        body_para=Para("justify", 0, 0, 1.5, first_indent_cm=1.25),
        bullets=Bullets("•", 1.5, 0.5, 0),
        intercalaire=Intercalaire(
            Heading(Font("Lucian BT", 36, bold=True), Para("right"), Rule(0.5, None)),
            uppercase=True, blank_paragraphs=13),
        chapter_title=None,
        chapter_title_uppercase=True,
        levels=(
            Level(Font("Georgia", 16, bold=True, caps=True), Para("left", 12, 6, left_indent_cm=1.0,
                                                                 keep_next=True)),
            Level(Font("Georgia", 14, bold=True), Para("left", 12, 6, left_indent_cm=2.0, keep_next=True)),
            Level(Font("Georgia", 13, bold=True, italic=True),
                  Para("left", 12, 6, left_indent_cm=3.0, keep_next=True)),
            Level(Font("Georgia", 13, bold=True), Para("left", 12, 6, left_indent_cm=4.0, keep_next=True)),
        ),
        roman_top_level=False,
        caption_table=Caption(Font("Times New Roman", 14, bold=True, italic=True, color="000000"),
                              Para("center", 12, 0, keep_next=True)),
        caption_figure=Caption(Font("Times New Roman", 14, bold=True, italic=True, color="000000"),
                               Para("center", 12, 0)),
        note=Font("Times New Roman", 10),
        note_para=Para("left", 3, 8, 1.0),
        table=TableStyle(Font("Times New Roman", 11), 16.0, Rule(1, accent), Rule(1, accent),
                         Rule(1, accent), band_fill="D9E2F3", text_color=dark),
        header=PageHeader("chapter", Font("Lucida Calligraphy", 9), "right", Rule(0.5, None)),
        footer=PageFooter(Font("CentSchbook BT", 10, bold=True), "right"),
        refs=References("(", ")", ", ", Font("Times New Roman", 12), Para("left", 0, 4, 1.15), 1.0),
        no_headings_in=("introduction", "conclusion"),
    )


CHARTES: dict[str, Charte] = {c.code: c for c in (_fms(), _fmt(), _fmm(), _fmsf())}


def get_charte(code: str) -> Charte:
    try:
        return CHARTES[code]
    except KeyError:
        raise ValueError(f"Faculté inconnue : {code} (attendu : {', '.join(FACULTIES)})") from None
