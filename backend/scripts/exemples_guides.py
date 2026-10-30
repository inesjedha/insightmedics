"""Images d'exemple des guides « mise en forme de la thèse » (www.insightmedics.fr/guides).

Ce script régénère, à partir d'une étude de démonstration FICTIVE, les images montrées dans
le guide pilier et dans les quatre guides par faculté :

- `resultats-<fms|fmt|fmm|fmsf>.png` (+ `.webp`) : une page du chapitre Résultats mise en
  page par notre moteur (`app.theses.render_docx`) à la charte de chaque faculté (titre
  numéroté de la faculté, paragraphe, appel et tableau, puis figure), convertie en PDF par
  LibreOffice puis en PNG ;
- `figure-flux.png` : le diagramme de flux de l'étude, dessiné par `app.theses.figures` ;
- `figure-boites.png` : les boîtes à moustaches de la durée opératoire selon la survenue
  d'une complication.

L'étude : « Facteurs associés aux complications post-opératoires après cholécystectomie »,
134 dossiers recueillis, 120 patients analysés. Aucune donnée réelle, aucun nom : le jeu de
données est simulé avec une graine fixe (`SEED`), puis le tableau est calculé par le moteur
de statistiques (`app.analysis.stats.run_compare` : Chi² de Pearson sans correction de
Yates, Fisher si un effectif théorique est inférieur à 5, Mann-Whitney, médiane [Q1–Q3] au
sens de SPSS) et chaque p est recontrôlé directement avec SciPy. Le texte du paragraphe est
construit à partir des chiffres calculés : il ne peut pas les contredire.

Polices : les chartes déclarent des polices souvent absentes d'un serveur (AvantGarde Bk BT,
Souvenir Lt BT, Albertus, Tahoma, Georgia, Lucida Calligraphy…). Pour la CONVERSION
seulement, une copie du Word remplace leur nom par une police libre voisine (`SUBSTITUTS`) ;
le moteur et le Word livré ne changent pas. Le numéro de page affiché (`PAGE`) est aussi
posé sur cette copie, pour figurer une page prise au milieu du chapitre.

Usage, depuis backend/ :  python -m scripts.exemples_guides
Prérequis : LibreOffice (`soffice`), `pdftoppm` et `pdfinfo` (poppler), Pillow.
"""

from __future__ import annotations

import io
import math
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd
from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image
from scipy import stats

from app.analysis.plan import AnalysisPlan, Compare, Groups, Variable
from app.analysis.stats import fmt, fmt_p, pct, quartiles, run_compare
from app.theses import figures
from app.theses.charte import FACULTIES, get_charte
from app.theses.document import (
    Chapter,
    FigureBlock,
    HeadingBlock,
    ParagraphBlock,
    TableBlock,
    ThesisDoc,
)
from app.theses.render_docx import render
from app.theses.resultats import thesis_table

SEED = 20261324
N_RECUEILLIS = 134
EXCLUSIONS = [("Dossier médical incomplet", 9), ("Autre geste chirurgical associé", 5)]
GROUPE = "Complication"
AVEC, SANS = "Avec complication", "Sans complication"
TITRE_THESE = "Complications après cholécystectomie : facteurs associés"
DPI_PAGE = 170                       # une page A4 : 1405 × 1988 px
LARGEUR_FIGURE_WEB = 1800            # px, figures seules (affichées à 520 px au plus)
POIDS_MAX_WEBP = 300_000             # octets

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "public" / "guides" / "exemples"

# Numéro du titre de premier niveau « Facteurs associés » dans le plan type des Résultats
# de chaque faculté (Sousse : IV ; Tunis : 5 ; Monastir et Sfax : 3).
NUMERO_PARTIE = {"FMS": 4, "FMT": 5, "FMM": 3, "FMSf": 3}
PREMIER_TABLEAU = 9                  # « Tableau IX » : les tableaux précédents sont ailleurs
PREMIERE_FIGURE = 5
PAGE_AFFICHEE = 41

# Polices de la charte → police libre voisine, pour la conversion en PDF seulement.
SUBSTITUTS = {
    "AvantGarde Bk BT": "TeX Gyre Adventor",     # clone libre d'ITC Avant Garde Gothic
    "Souvenir Lt BT": "TeX Gyre Bonum",          # Bookman, la plus proche de Souvenir
    "Albertus": "TeX Gyre Pagella",              # page intercalaire (non montrée)
    "Times New Roman": "Liberation Serif",       # même chasse
    "Tahoma": "DejaVu Sans Condensed",           # sans humaniste, chasse proche de Tahoma
    "Georgia": "TeX Gyre Schola",                # serif à grand œil, proche de Georgia
    "Lucian BT": "TeX Gyre Pagella",             # page intercalaire (non montrée)
    "Lucida Calligraphy": "TeX Gyre Chorus",     # calligraphique (en-tête de Sfax)
    "CentSchbook BT": "TeX Gyre Schola",         # clone libre de Century Schoolbook
}

LIBELLES = {
    "age": "Âge (ans)", "femme": "Sexe féminin", "obesite": "Obésité",
    "diabete": "Diabète", "cholecystite": "Cholécystite aiguë",
    "conversion": "Conversion en laparotomie", "duree": "Durée opératoire (min)",
}
# Sujet de la phrase de résultat, avec l'accord de « fréquent ».
SUJETS = {"diabete": ("Le diabète", ""), "cholecystite": ("La cholécystite aiguë", "e"),
          "conversion": ("La conversion en laparotomie", "e"),
          "obesite": ("L'obésité", "e"), "femme": ("Le sexe féminin", "")}


# ---------------------------------------------------------------- étude fictive

def simuler() -> pd.DataFrame:
    """120 patients analysés (après exclusion des 14 dossiers du diagramme de flux)."""
    rng = np.random.default_rng(SEED)
    n = N_RECUEILLIS - sum(k for _, k in EXCLUSIONS)
    age = np.clip(np.round(19 + rng.gamma(3.2, 9.5, n)), 18, 89)
    femme = rng.random(n) < 0.72
    obesite = rng.random(n) < 0.26
    diabete = rng.random(n) < 0.17 + 0.10 * obesite
    cholecystite = rng.random(n) < 0.30
    conversion = rng.random(n) < 0.03 + 0.12 * cholecystite
    duree = np.round(np.exp(np.log(62) + 0.22 * cholecystite + 0.40 * conversion
                            + 0.10 * obesite + rng.normal(0, 0.24, n)) / 5) * 5
    logit = (-2.9 + 1.0 * diabete + 1.0 * cholecystite + 1.3 * conversion
             + 0.022 * (duree - 65) + 0.008 * (age - 50))
    complication = rng.random(n) < 1 / (1 + np.exp(-logit))
    oui = lambda x: np.where(x, "Oui", "Non")  # noqa: E731
    return pd.DataFrame({
        "age": age, "femme": oui(femme), "obesite": oui(obesite), "diabete": oui(diabete),
        "cholecystite": oui(cholecystite), "conversion": oui(conversion), "duree": duree,
        GROUPE: pd.Categorical(np.where(complication, AVEC, SANS), categories=[AVEC, SANS]),
    })


def calculer(df: pd.DataFrame) -> dict:
    """Tableau du moteur, recontrôlé avec SciPy, et faits pour le paragraphe."""
    quant = {"age", "duree"}
    variables = [Variable(name=k, label=v, type="quantitative" if k in quant else "binary")
                 for k, v in LIBELLES.items()]
    plan = AnalysisPlan(groups=Groups(variable=GROUPE, event=AVEC),
                        analyses=[Compare(kind="compare", id="univ", title="Univarié",
                                          variables=variables)])
    r = run_compare(plan.analyses[0], df, plan)
    r["id"], r["kind"] = "univ", "compare"
    avec, sans = df[df[GROUPE] == AVEC], df[df[GROUPE] == SANS]
    facts: dict[str, dict] = {}
    for k in LIBELLES:
        row = next(row for row in r["table"]["rows"] if row[0] == LIBELLES[k])
        if k in quant:
            p = stats.mannwhitneyu(avec[k], sans[k], alternative="two-sided",
                                   use_continuity=False, method="asymptotic").pvalue
            q = {g: quartiles(d[k]) for g, d in (("avec", avec), ("sans", sans))}
            facts[k] = {"p": p, "test": "Mann-Whitney", "q": q, "row": row}
        else:
            table = pd.crosstab(df[k], df[GROUPE]).to_numpy()
            chi = stats.chi2_contingency(table, correction=False)
            fisher = bool((chi.expected_freq < 5).any())
            p = stats.fisher_exact(table).pvalue if fisher else chi.pvalue
            a, b = int((avec[k] == "Oui").sum()), int((sans[k] == "Oui").sum())
            facts[k] = {"p": p, "test": "Fisher" if fisher else "Chi²", "row": row,
                        "avec": pct(a, len(avec)), "sans": pct(b, len(sans))}
        # Le moteur et le contrôle direct donnent le même p et le même test.
        assert row[4] == fmt_p(p) and row[5] == facts[k]["test"], (k, row, p)
    return {"result": r, "facts": facts, "n_avec": len(avec), "n_sans": len(sans)}


def p_gras(p: float) -> str:
    text = fmt_p(p)
    text = f"p {text}" if text.startswith("<") else f"p = {text}"
    return f"**{text}**" if p < 0.05 else text


def paragraphe(calc: dict) -> str:
    """Paragraphe du chapitre, écrit à partir des chiffres calculés (phrases types de la
    charte commune) ; s'arrête si la graine donne un autre profil de résultats."""
    f = calc["facts"]
    signif = [k for k in ("diabete", "cholecystite", "conversion") if f[k]["p"] < 0.05]
    non_signif = [k for k in ("age", "femme", "obesite") if f[k]["p"] >= 0.05]
    if len(signif) != 3 or len(non_signif) != 3 or f["duree"]["p"] >= 0.05:
        sys.exit("Profil de résultats inattendu : changez SEED ou réécrivez le paragraphe.")
    phrases = ["Les caractéristiques des patients selon la survenue d'une complication "
               "post-opératoire sont présentées dans le {{TAB:univ}}."]
    morceaux = []
    for i, k in enumerate(signif):
        sujet, accord = SUJETS[k]
        if i == 0:
            morceaux.append(f"{sujet} était significativement plus fréquent{accord} dans le "
                            f"groupe avec complication ({f[k]['avec']} % contre "
                            f"{f[k]['sans']} % ; {p_gras(f[k]['p'])})")
        else:
            morceaux.append(f"{sujet[0].lower()}{sujet[1:]} ({f[k]['avec']} % contre "
                            f"{f[k]['sans']} % ; {p_gras(f[k]['p'])})")
    phrases.append(morceaux[0] + ", de même que " + " et ".join(morceaux[1:]) + ".")
    qa, qs = f["duree"]["q"]["avec"], f["duree"]["q"]["sans"]
    phrases.append("La durée opératoire médiane était plus longue dans ce groupe "
                   f"({fmt(qa[1], 0)} min [{fmt(qa[0], 0)}–{fmt(qa[2], 0)}] contre "
                   f"{fmt(qs[1], 0)} min [{fmt(qs[0], 0)}–{fmt(qs[2], 0)}] ; "
                   f"{p_gras(f['duree']['p'])}) ({{{{FIG:duree}}}}).")
    phrases.append("L'âge, le sexe et l'obésité n'étaient pas associés significativement à "
                   "la survenue d'une complication.")
    return " ".join(phrases)


# ---------------------------------------------------------------- figures

def dessiner(df: pd.DataFrame, calc: dict, dossier: Path, font: str, largeur_cm: float,
             suffixe: str) -> tuple[Path, Path]:
    flux = [{"label": "Dossiers recueillis", "n": N_RECUEILLIS}]
    flux += [{"label": lab, "excluded": k} for lab, k in EXCLUSIONS]
    flux.append({"label": "Patients analysés", "n": len(df)})
    p_flux = figures.flow_diagram(flux, dossier / f"flux-{suffixe}.png", font, 14.3,
                                  arms=[(AVEC, calc["n_avec"]), (SANS, calc["n_sans"])])
    d = calc["facts"]["duree"]
    p_txt = re.sub(r"\*", "", p_gras(d["p"]))
    p_boites = figures.boxes(
        [(AVEC, df.loc[df[GROUPE] == AVEC, "duree"].tolist()),
         (SANS, df.loc[df[GROUPE] == SANS, "duree"].tolist())],
        "Durée opératoire (min)", p_txt, d["test"], dossier / f"boites-{suffixe}.png",
        font, largeur_cm)
    return p_flux, p_boites


# ---------------------------------------------------------------- page de chapitre

def chapitre(code: str, calc: dict, texte: str, image: Path, largeur_cm: float) -> ThesisDoc:
    c = get_charte(code)
    table = thesis_table(calc["result"], "Comparaison des patients avec et sans complication "
                         "(N = 120)", "fr", 0.05, [])
    note = table.note
    if code == "FMSf":
        # Sfax : abréviations interdites dans les tableaux, sauf explicitées dans la note.
        note += (" OR : odds ratio ; IC 95 % : intervalle de confiance à 95 % ; Q1–Q3 : "
                 "premier et troisième quartiles.")
    table = TableBlock(**{**table.model_dump(), "note": note,
                          "col_widths": [3.0, 2.3, 2.5, 2.5, 1.7, 3.5]})
    blocks = [
        HeadingBlock(level=0, text="Facteurs associés aux complications",
                     number=NUMERO_PARTIE[code]),
        HeadingBlock(level=1, text="Analyse univariée"),
        ParagraphBlock(text=texte),
        table,
        FigureBlock(key="duree", title="Durée opératoire selon la survenue d'une "
                    "complication", image_path=str(image),
                    width_cm=min(largeur_cm, c.usable_cm)),
    ]
    # « insert » : une page prise au milieu du chapitre (en-tête et pied de page de la
    # faculté, sans page intercalaire ni titre de chapitre).
    return ThesisDoc(thesis_title=TITRE_THESE, insert=True, first_table=PREMIER_TABLEAU,
                     first_figure=PREMIERE_FIGURE,
                     chapters=[Chapter(key="resultats", name="Résultats", blocks=blocks)])


def copie_pour_conversion(docx: bytes) -> bytes:
    """Numéro de page affiché et polices voisines, sur une copie du Word."""
    doc = Document(io.BytesIO(docx))
    for section in doc.sections:
        sect = section._sectPr
        pg = sect.find(qn("w:pgNumType"))
        if pg is None:
            pg = OxmlElement("w:pgNumType")
            cols = sect.find(qn("w:cols"))
            if cols is not None:
                cols.addprevious(pg)
            else:
                sect.append(pg)
        pg.set(qn("w:start"), str(PAGE_AFFICHEE))
    # Largeur des colonnes : Word suit celle des cellules (`w:tcW`), LibreOffice celle de
    # la grille du tableau (`w:gridCol`, égale par défaut) ; on aligne la grille.
    for table in doc.tables:
        grid = table._tbl.tblGrid
        widths = [tc.tcPr.find(qn("w:tcW")).get(qn("w:w")) for tc in table.rows[0]._tr.tc_lst]
        for col, w in zip(grid.findall(qn("w:gridCol")), widths, strict=True):
            col.set(qn("w:w"), w)
    buf = io.BytesIO()
    doc.save(buf)
    src = zipfile.ZipFile(io.BytesIO(buf.getvalue()))
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = src.read(item.filename)
            if item.filename.endswith(".xml"):
                text = data.decode("utf-8")
                for old, new in SUBSTITUTS.items():
                    text = text.replace(f'"{old}"', f'"{new}"')
                data = text.encode("utf-8")
            dst.writestr(item, data)
    return out.getvalue()


def en_png(docx: bytes, dossier: Path, nom: str) -> Image.Image:
    src = dossier / f"{nom}.docx"
    src.write_bytes(copie_pour_conversion(docx))
    profil = (dossier / "lo-profil").as_uri()
    subprocess.run(["soffice", f"-env:UserInstallation={profil}", "--headless",
                    "--convert-to", "pdf", "--outdir", str(dossier), str(src)],
                   check=True, capture_output=True, timeout=180)
    pdf = dossier / f"{nom}.pdf"
    info = subprocess.run(["pdfinfo", str(pdf)], check=True, capture_output=True, text=True)
    pages = int(re.search(r"Pages:\s+(\d+)", info.stdout).group(1))  # type: ignore[union-attr]
    if pages != 1:
        # Comme dans Word : la figure qui ne tient pas passe à la page suivante ; l'image
        # montre la première page (titres, paragraphe, tableau).
        print(f"{nom} : la figure passe en page 2 ; seule la page 1 est montrée")
    subprocess.run(["pdftoppm", "-png", "-r", str(DPI_PAGE), "-singlefile", "-f", "1", str(pdf),
                    str(dossier / nom)], check=True)
    return Image.open(dossier / f"{nom}.png").convert("RGB")


# ---------------------------------------------------------------- écriture

def ecrire_png(img: Image.Image, path: Path, couleurs: int | None = None) -> None:
    """PNG optimisé ; `couleurs` : palette réduite (texte et aplats, sans perte visible)."""
    if couleurs:
        img = img.quantize(colors=couleurs, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    img.save(path, optimize=True)


def ecrire_webp(img: Image.Image, path: Path) -> None:
    for qualite in (90, 85, 80, 75, 70, 60):
        img.save(path, "WEBP", quality=qualite, method=6)
        if path.stat().st_size <= POIDS_MAX_WEBP:
            return
    raise RuntimeError(f"{path.name} : plus de {POIDS_MAX_WEBP} octets")


def reduire(path: Path, largeur: int) -> Image.Image:
    img = Image.open(path).convert("RGB")
    h = round(img.height * largeur / img.width)
    return img.resize((largeur, h), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    df = simuler()
    calc = calculer(df)
    texte = paragraphe(calc)
    # `--garder DOSSIER` : garde les Word, PDF et figures intermédiaires (mise au point).
    garder = Path(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == "--garder" else None
    with tempfile.TemporaryDirectory() as tmp:
        dossier = garder or Path(tmp)
        dossier.mkdir(parents=True, exist_ok=True)
        # Figures seules, pour le web (police du texte de Sousse, Monastir et Sfax).
        flux, boites = dessiner(df, calc, dossier, "Times New Roman", 12.0, "web")
        ecrire_png(reduire(flux, LARGEUR_FIGURE_WEB), OUT / "figure-flux.png", 64)
        ecrire_png(reduire(boites, LARGEUR_FIGURE_WEB), OUT / "figure-boites.png", 128)
        # Une page de chapitre par faculté.
        for code in FACULTIES:
            c = get_charte(code)
            largeur = 11.0 if code == "FMSf" else 12.0
            _, image = dessiner(df, calc, dossier, c.figure_font, largeur, code)
            docx = render(chapitre(code, calc, texte, image, largeur), c, TITRE_THESE)
            page = en_png(docx, dossier, f"resultats-{code.lower()}")
            ecrire_png(page, OUT / f"resultats-{code.lower()}.png", 128)
            ecrire_webp(page, OUT / f"resultats-{code.lower()}.webp")
        shutil.rmtree(dossier / "lo-profil", ignore_errors=True)
    for path in sorted(OUT.iterdir()):
        with Image.open(path) as im:
            print(f"{path.relative_to(REPO)}  {im.width} × {im.height}  "
                  f"{math.ceil(path.stat().st_size / 1024)} Ko")


if __name__ == "__main__":
    main()
