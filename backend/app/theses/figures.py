"""Figures des Résultats (Matplotlib), selon la charte graphique commune de Hamza (§ 11).

Police du texte de la faculté ; dessinées à leur largeur d'insertion exacte (aucune
réduction dans Word), PNG à 600 ppp ; aucun titre dans l'image (la légende Word est le
seul titre) ; aucun texte gris ; virgule décimale ; couleurs validées pour les
daltoniens ; cadre haut et droit retirés ; quadrillage léger sous les données.
"""

from __future__ import annotations

import math
import re
from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

from ..analysis.stats import fmt

INK = "#1A1A1A"
GRID = "#E3E5E8"
GROUPS = ["#1F6FB2", "#DD6B27", "#2A9D8F", "#8E6BB0"]
SINGLE = "#2E5E8C"
NIGHT = "#1B3A5C"
BAND = "#D6E4F1"
CM = 1 / 2.54
DPI = 600
# Polices de remplacement de même chasse quand celle de la faculté manque au serveur.
_FALLBACK = {"Times New Roman": ["Times New Roman", "Liberation Serif", "DejaVu Serif"],
             "Tahoma": ["Tahoma", "DejaVu Sans"]}


_FONTS_DIR = Path(__file__).parent / "fonts"
_registered = False


def _register_fonts() -> None:
    """Liberation Serif (même chasse que Times New Roman, licence OFL) est livrée avec le
    code : les figures ont la même police en local et sur le serveur, sans paquet système."""
    global _registered
    if _registered:
        return
    from matplotlib import font_manager

    for path in sorted(_FONTS_DIR.glob("*.ttf")):
        font_manager.fontManager.addfont(str(path))
    _registered = True


def _families(font: str) -> list[str]:
    """Polices installées parmi la police de la faculté et ses remplaçantes (sans
    avertissement de Matplotlib pour celles qui manquent)."""
    from matplotlib import font_manager

    _register_fonts()
    installed = {f.name for f in font_manager.fontManager.ttflist}
    wanted = _FALLBACK.get(font, [font, "DejaVu Sans"])
    return [f for f in wanted if f in installed] or ["DejaVu Sans"]


def _style(font: str) -> Any:
    return {
        "font.family": _families(font),
        "font.size": 9, "axes.labelsize": 9, "xtick.labelsize": 8.5, "ytick.labelsize": 8.5,
        "text.color": INK, "axes.labelcolor": INK, "xtick.color": INK, "ytick.color": INK,
        "axes.edgecolor": INK, "axes.spines.top": False, "axes.spines.right": False,
        "axes.grid": False, "pdf.fonttype": 42, "axes.formatter.use_locale": False,
        "axes.unicode_minus": True,
    }


def _fr(x: float, digits: int = 0) -> str:
    return fmt(x, digits)


def _save(fig: Any, path: Path) -> Path:
    fig.savefig(path, dpi=DPI, format="png", metadata={"Software": None})
    plt.close(fig)
    return path


def _grid_y(ax: Any) -> None:
    ax.set_axisbelow(True)
    ax.yaxis.grid(True, color=GRID, linewidth=0.6)


def _comma_axis(ax: Any, axis: str = "y") -> None:
    from matplotlib.ticker import FuncFormatter

    def f(v: float, _: Any) -> str:
        digits = 0 if float(v).is_integer() else (1 if abs(v * 10 - round(v * 10)) < 1e-9 else 2)
        return _fr(v, digits)
    (ax.yaxis if axis == "y" else ax.xaxis).set_major_formatter(FuncFormatter(f))


# ---------------------------------------------------------------- diagramme de flux

def flow_diagram(flow: list[dict[str, Any]], path: Path, font: str, width_cm: float,
                 arms: list[tuple[str, int]] | None = None) -> Path:
    """Diagramme de type CONSORT : lignes de la base → exclusions (cadre latéral, motifs et
    effectifs) → patients analysés ; puis, si un groupe est défini, un bras par groupe."""
    start = flow[0].get("n", 0)
    final = flow[-1].get("n", 0)
    reasons = [(f["label"], f.get("excluded", 0)) for f in flow[1:-1] if f.get("excluded", 0)]
    excluded = sum(n for _, n in reasons)
    width_cm = min(width_cm, 14.3)
    # Hauteur exacte du dessin (aucun blanc sous le dernier cadre).
    side_h = 0.55 + 0.42 * max(1, len(reasons)) if reasons else 0.0
    height_cm = (0.2 + 0.5 + 0.35 + 1.0 + 0.9 + max(0.0, side_h - 1.0) / 2 + 1.0
                 + (0.45 + 0.5 + 0.35 + 1.1 if arms else 0) + 0.25)
    with plt.rc_context(_style(font)):
        fig = plt.figure(figsize=(width_cm * CM, height_cm * CM))
        ax = fig.add_axes((0, 0, 1, 1))
        ax.set_xlim(0, width_cm)
        ax.set_ylim(0, height_cm)
        ax.axis("off")

        def box(x: float, y: float, w: float, h: float, text: str, lw: float = 0.8,
                face: str = "white", edge: str = INK, align: str = "center",
                bold: bool = False) -> None:
            ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="square,pad=0", lw=lw,
                                        facecolor=face, edgecolor=edge))
            tx = x + w / 2 if align == "center" else x + 0.25
            ax.text(tx, y + h / 2, text, ha=align, va="center", fontsize=8.5,
                    fontweight="bold" if bold else "normal", linespacing=1.35)

        def arrow(x0: float, y0: float, x1: float, y1: float) -> None:
            ax.annotate("", xy=(x1, y1), xytext=(x0, y0),
                        arrowprops={"arrowstyle": "-|>", "lw": 0.8, "color": INK,
                                    "shrinkA": 0, "shrinkB": 0, "mutation_scale": 7})

        band_h = 0.5
        top = height_cm - 0.2
        # Bandeau « Sélection »
        ax.add_patch(FancyBboxPatch((0.1, top - band_h), width_cm - 0.2, band_h,
                                    boxstyle="square,pad=0", lw=0, facecolor=BAND))
        ax.text(0.3, top - band_h / 2, "Sélection", va="center", fontsize=8.5, fontweight="bold")
        cw, ch = 5.2, 1.0
        cx = 0.6 + (width_cm * 0.42 - cw) / 2
        y1 = top - band_h - 0.35 - ch
        box(cx, y1, cw, ch, f"Patients recueillis\n(n = {start})")
        y2 = y1 - 0.9 - ch - max(0.0, side_h - ch) / 2
        side_x = cx + cw + 0.7
        side_w = width_cm - side_x - 0.2
        if reasons:
            lines = [f"Exclus (n = {excluded})"] + [f"•  {label} (n = {n})" for label, n in reasons]
            side_y = (y1 + y2 + ch) / 2 - side_h / 2
            box(side_x, side_y, side_w, side_h, "\n".join(lines), align="left")
            arrow(cx + cw / 2, side_y + side_h / 2, side_x, side_y + side_h / 2)
        box(cx, y2, cw, ch, f"Patients analysés\n(n = {final})", lw=1.6, bold=True)
        arrow(cx + cw / 2, y1, cx + cw / 2, y2 + ch)
        if arms:
            yb = y2 - 0.45 - band_h
            ax.add_patch(FancyBboxPatch((0.1, yb), width_cm - 0.2, band_h,
                                        boxstyle="square,pad=0", lw=0, facecolor=BAND))
            ax.text(0.3, yb + band_h / 2, "Répartition", va="center", fontsize=8.5,
                    fontweight="bold")
            k = len(arms)
            aw = min(4.6, (width_cm - 0.6 - 0.4 * (k - 1)) / k)
            total = sum(n for _, n in arms) or 1
            xs = [(width_cm - (k * aw + (k - 1) * 0.4)) / 2 + i * (aw + 0.4) for i in range(k)]
            ya = yb - 0.35 - 1.1
            hub = y2 - 0.22
            ax.plot([cx + cw / 2, cx + cw / 2], [y2, hub], color=INK, lw=0.8)
            # La barre de répartition va jusqu'au trait qui descend de « Patients analysés »,
            # même quand la boîte est décalée à gauche des groupes (figure large).
            left = min(xs[0] + aw / 2, cx + cw / 2)
            right = max(xs[-1] + aw / 2, cx + cw / 2)
            ax.plot([left, right], [hub, hub], color=INK, lw=0.8)
            for i, (label, n) in enumerate(arms):
                color = GROUPS[i % len(GROUPS)]
                ax.plot([xs[i] + aw / 2, xs[i] + aw / 2], [hub, yb + band_h], color=INK, lw=0.8)
                arrow(xs[i] + aw / 2, yb, xs[i] + aw / 2, ya + 1.1)
                box(xs[i], ya, aw, 1.1, f"{label}\n(n = {n} ; {_fr(100 * n / total, 1)} %)",
                    lw=1.2, edge=color, face=["#DCE9F5", "#F9E2D2", "#DDF1EE", "#ECE5F3"][i % 4])
        return _save(fig, path)


# ---------------------------------------------------------------- barres

def bars(labels: list[str], counts: list[int], total: int, path: Path, font: str,
         width_cm: float, ordinal: bool = False) -> Path:
    """Barres horizontales triées (nominal) ou dans l'ordre (ordinal), étiquettes
    « n (x %) » au bout des barres."""
    items = list(zip(labels, counts, strict=True))
    # « Stade 1 », « Stade 2 »… : modalités ordonnées, gardées dans leur ordre.
    numbered = [re.fullmatch(r"(.*?)(\d+)\s*$", lab) for lab in labels]
    if all(numbered) and len({m.group(1) for m in numbered if m}) == 1:
        ordinal = True
        items.sort(key=lambda t: int(re.search(r"(\d+)\s*$", t[0]).group(1)))  # type: ignore[union-attr]
    if not ordinal:
        items.sort(key=lambda t: t[1])
    else:
        items.reverse()
    height_cm = max(3.2, 0.75 * len(items) + 1.3)
    with plt.rc_context(_style(font)):
        fig, ax = plt.subplots(figsize=(width_cm * CM, height_cm * CM))
        y = range(len(items))
        values = [100 * c / total if total else 0 for _, c in items]
        ax.barh(list(y), values, color=SINGLE, height=0.62)
        ax.set_yticks(list(y), [lab for lab, _ in items])
        top = max(values) if values else 1
        for i, ((_, c), v) in enumerate(zip(items, values, strict=True)):
            ax.text(v + top * 0.02, i, f"{c} ({_fr(v, 1)} %)", va="center", fontsize=8.5)
        ax.set_xlim(0, top * 1.28 if top else 1)
        ax.set_xlabel("Patients (%)")
        ax.xaxis.grid(True, color=GRID, linewidth=0.6)
        ax.set_axisbelow(True)
        _comma_axis(ax, "x")
        fig.tight_layout(pad=0.4)
        return _save(fig, path)


# ---------------------------------------------------------------- boîtes par groupe

def box_stats(values: list[float]) -> dict[str, float]:
    """Boîte d'un groupe avec les quartiles du tableau (méthode SPSS, HAVERAGE) : la figure
    et le « médiane [Q1–Q3] » du tableau donnent les mêmes chiffres. Moustaches de Tukey :
    valeur observée la plus éloignée à moins de 1,5 écart interquartile de la boîte."""
    import numpy as np

    arr = np.asarray(values, dtype=float)
    q1, med, q3 = np.percentile(arr, [25, 50, 75], method="weibull")
    iqr = q3 - q1
    inside = arr[(arr >= q1 - 1.5 * iqr) & (arr <= q3 + 1.5 * iqr)]
    return {"med": float(med), "q1": float(q1), "q3": float(q3),
            "whislo": float(inside.min()), "whishi": float(inside.max())}


def boxes(groups: list[tuple[str, list[float]]], ylabel: str, p_text: str, test: str,
          path: Path, font: str, width_cm: float) -> Path:
    """Boîtes à moustaches par groupe, points individuels, p et test sous la figure."""
    with plt.rc_context(_style(font)):
        fig, ax = plt.subplots(figsize=(width_cm * CM, 7.0 * CM))
        data = [v for _, v in groups]
        bp = ax.bxp([box_stats(v) for v in data], widths=0.5, patch_artist=True,
                    showfliers=False, medianprops={"color": INK, "lw": 1.2})
        for i, patch in enumerate(bp["boxes"]):
            patch.set_facecolor(["#DCE9F5", "#F9E2D2", "#DDF1EE", "#ECE5F3"][i % 4])
            patch.set_edgecolor(GROUPS[i % len(GROUPS)])
        for i, values in enumerate(data, start=1):
            jitter = [i + 0.12 * math.sin(k * 2.399) for k in range(len(values))]
            ax.scatter(jitter, values, s=6, color=GROUPS[(i - 1) % len(GROUPS)], alpha=0.75,
                       zorder=3, lw=0)
        ax.set_xticks(range(1, len(groups) + 1),
                      [f"{label}\n(n = {len(v)})" for label, v in groups])
        ax.set_ylabel(ylabel)
        _grid_y(ax)
        _comma_axis(ax)
        ax.text(0.99, 0.98, f"{p_text} ({test})", transform=ax.transAxes, ha="right",
                va="top", fontsize=8.5)
        fig.tight_layout(pad=0.4)
        return _save(fig, path)


# ---------------------------------------------------------------- mesures répétées

def paired_lines(times: list[str], series: list[list[float]], ylabel: str, stat: str,
                 path: Path, font: str, width_cm: float, p_labels: list[str] | None = None) -> Path:
    """Lignes individuelles (patients complets) et médiane (ou moyenne) par temps."""
    import numpy as np

    with plt.rc_context(_style(font)):
        fig, ax = plt.subplots(figsize=(width_cm * CM, 7.0 * CM))
        x = list(range(len(times)))
        for patient in series:
            ax.plot(x, patient, color="#94BFEE", lw=0.5, alpha=0.7, zorder=1)
        arr = np.array(series, dtype=float)
        centre = np.median(arr, axis=0) if stat == "médiane" else arr.mean(axis=0)
        ax.plot(x, centre, color=NIGHT, lw=2, marker="o", ms=4, zorder=3,
                label=stat.capitalize())
        ax.set_xticks(x, times)
        ax.set_ylabel(ylabel)
        ax.legend(frameon=False, loc="best", fontsize=8.5)
        _grid_y(ax)
        _comma_axis(ax)
        if p_labels:
            ax.text(0.99, 0.02, " ; ".join(p_labels), transform=ax.transAxes, ha="right",
                    va="bottom", fontsize=8.5)
        fig.tight_layout(pad=0.4)
        return _save(fig, path)
