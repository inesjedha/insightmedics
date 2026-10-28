"""Moteur de calcul : exécute le plan validé sur la base d'analyse. Jamais l'IA.

Conventions d'une thèse de médecine (choix du test par les données, écrit dans `method`) :
- quantitative : moyenne ± écart-type si la distribution est compatible avec la loi
  normale (Shapiro-Wilk, p ≥ 0,05), sinon médiane [Q1-Q3] ; quartiles calculés comme SPSS
  (méthode « weibull », HAVERAGE), pour que l'étudiant retrouve ses chiffres ;
- qualitative : n (%), le pourcentage rapporté aux données renseignées ;
- deux groupes : Student (Welch) ou Mann-Whitney ; plus de deux : ANOVA ou
  Kruskal-Wallis ; qualitatives : Chi² ou Fisher (effectif attendu < 5) ;
- mesures répétées : t apparié ou Wilcoxon (2 temps) ; Friedman puis Wilcoxon contre le
  premier temps, corrigé par Holm (3 temps et plus) ;
- régression logistique : OR bruts puis ajustés, IC 95 %, 10 événements par paramètre
  recommandés (en dessous : avertissement ; sous 5 : pas de modèle ajusté).
"""

from __future__ import annotations

import math
import warnings
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

import numpy as np
import pandas as pd
from scipy import stats

from .plan import (
    AnalysisPlan,
    Compare,
    Correlation,
    Describe,
    Logistic,
    Paired,
    Proportion,
    Variable,
)

NORMAL_P = 0.05
MIN_EPV = 10
HARD_MIN_EPV = 5
# Tirages de Monte-Carlo (Fisher-Freeman-Halton) : graine fixée, deux exécutions donnent
# le même p (prompts de Dr Hamza, § 8.1).
MC_RESAMPLES = 100_000
MC_SEED = 20261012
# Modalités qui signalent la présence d'un facteur binaire (« Diabète : oui »).
_PRESENT = {"1", "oui", "yes", "o", "y", "présent", "present", "positif", "positive", "vrai",
            "true"}


# ---------------------------------------------------------------- formats français

def fmt(x: float | None, digits: int = 1) -> str:
    """Nombre à la française, arrondi au plus proche, la demie vers le haut (comme
    l'affichage de SPSS : 31,25 → 31,3 ; 18,5 → 19), signe moins typographique."""
    if x is None or not math.isfinite(float(x)):
        return "—"
    q = Decimal(repr(float(x))).quantize(Decimal(1).scaleb(-digits), rounding=ROUND_HALF_UP)
    if q == 0:
        q = abs(q)  # jamais « −0,0 »
    return f"{q:.{digits}f}".replace(".", ",").replace("-", "−")


def _integers(values: pd.Series) -> bool:
    v = values.dropna().astype(float)
    return bool(len(v)) and bool((v % 1 == 0).all())


def _digits(values: pd.Series) -> int:
    """Précision de la variable : nombre de décimales des valeurs saisies (0 à 3).
    Médiane, quartiles et extrêmes s'affichent à cette précision ; moyenne et
    écart-type avec une décimale de plus (au moins une)."""
    v = values.dropna().astype(float).to_numpy()
    if not len(v):
        return 0
    for d in range(4):
        if np.allclose(v, np.round(v, d), rtol=0, atol=1e-9):
            return d
    return 3


def fmt_p(p: float | None) -> str:
    if p is None or not math.isfinite(p):
        return "—"
    return "< 0,001" if p < 0.001 else fmt(p, 3)


def p_phrase(p: float | None) -> str:
    """« p < 0,001 » ou « p = 0,120 »."""
    text = fmt_p(p)
    return f"p {text}" if text.startswith("<") else f"p = {text}"


def _level(v: Any) -> str:
    """Libellé d'une modalité : 1.0 → « 1 »."""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def pct(n: int, total: int) -> str:
    return fmt(100 * n / total, 1) if total else "—"


def quartiles(s: pd.Series) -> tuple[float, float, float]:
    q1, med, q3 = np.percentile(s.to_numpy(dtype=float), [25, 50, 75], method="weibull")
    return float(q1), float(med), float(q3)


def is_normal(s: pd.Series) -> bool:
    s = s.dropna()
    if len(s) < 3 or s.nunique() < 3:
        return False
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        return bool(stats.shapiro(s.to_numpy(dtype=float)).pvalue >= NORMAL_P)


def summary_quant(s: pd.Series, normal: bool, digits: int) -> str:
    """« 76,1 ± 10,9 » (moyenne ± écart-type, une décimale de plus que la variable) ou
    « 53 [34–63] » (médiane [Q1–Q3], à la précision de la variable ; une médiane qui
    tombe entre deux valeurs, 95,5, garde sa décimale)."""
    s = s.dropna().astype(float)
    if s.empty:
        return "—"
    if normal:
        sd = float(s.std(ddof=1)) if len(s) > 1 else float("nan")
        d = max(1, digits + 1)
        return f"{fmt(float(s.mean()), d)} ± {fmt(sd, d)}"
    q1, med, q3 = quartiles(s)
    d = digits
    if not math.isclose(med, round(med, d), abs_tol=1e-9) \
            and math.isclose(med, round(med, d + 1), abs_tol=1e-9):
        d = digits + 1
    return f"{fmt(med, d)} [{fmt(q1, d)}–{fmt(q3, d)}]"


def _levels(s: pd.Series) -> list[Any]:
    """Modalités dans un ordre stable : numérique croissant, sinon par effectif."""
    if isinstance(s.dtype, pd.CategoricalDtype):
        present = set(s.dropna().tolist())
        return [c for c in s.cat.categories if c in present]
    values = s.dropna()
    try:
        return sorted(values.unique().tolist())
    except TypeError:
        return values.value_counts().index.tolist()


def _label(v: Variable | None, name: str) -> str:
    return (v.label if v and v.label else name)


def _num(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s, errors="coerce")


# ---------------------------------------------------------------- tests

def test_quant(groups: list[pd.Series], normal: bool | None = None) -> tuple[float | None, str]:
    """Réglages de SPSS : Student, ou Welch si le test de Levene (centré sur la moyenne)
    donne p ≤ 0,05 ; Mann-Whitney en approximation normale corrigée des ex aequo, sans
    correction de continuité (« signification asymptotique »)."""
    groups = [g.dropna().astype(float) for g in groups if len(g.dropna()) > 0]
    if len(groups) < 2 or any(len(g) < 2 for g in groups):
        return None, "effectifs insuffisants"
    if normal is None:
        normal = all(is_normal(g) for g in groups)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        if len(groups) == 2:
            if normal:
                unequal = float(stats.levene(*groups, center="mean").pvalue) <= NORMAL_P
                p = float(stats.ttest_ind(*groups, equal_var=not unequal).pvalue)
                return p, "t de Welch" if unequal else "t de Student"
            return (float(stats.mannwhitneyu(*groups, alternative="two-sided",
                                             use_continuity=False, method="asymptotic").pvalue),
                    "Mann-Whitney")
        if normal:
            return float(stats.f_oneway(*groups).pvalue), "ANOVA"
        return float(stats.kruskal(*groups).pvalue), "Kruskal-Wallis"


def test_cat(table: pd.DataFrame) -> tuple[float | None, str]:
    table = table.loc[table.sum(axis=1) > 0, table.sum(axis=0) > 0]
    if table.shape[0] < 2 or table.shape[1] < 2:
        return None, "une seule modalité observée"
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        # Chi² de Pearson sans correction de Yates : celui que donne SPSS par défaut.
        chi2 = stats.chi2_contingency(table.to_numpy(), correction=False)
    small = bool((chi2.expected_freq < 5).any())
    if table.shape == (2, 2) and small:
        return float(stats.fisher_exact(table.to_numpy()).pvalue), "Fisher"
    if small:
        # Au-delà de 2 × 2 : Fisher-Freeman-Halton par Monte-Carlo, graine fixée.
        method = stats.MonteCarloMethod(n_resamples=MC_RESAMPLES,
                                        rng=np.random.default_rng(MC_SEED))
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            p = float(stats.fisher_exact(table.to_numpy(), method=method).pvalue)
        return p, "Fisher-Freeman-Halton"
    return float(chi2.pvalue), "Chi²"


def odds_ratio_2x2(a: int, b: int, c: int, d: int, exact: bool) -> tuple[float, float, float, str]:
    """OR de l'événement en présence du facteur : a = facteur et événement, b = facteur
    sans événement, c = sans facteur avec événement, d = ni l'un ni l'autre.
    IC de Woolf (avec un Chi²) ou exact conditionnel (avec un Fisher : l'IC exclut 1 si et
    seulement si p < 0,05). Case nulle : correction de Haldane (+ 0,5), OR « indicatif »."""
    if exact:
        from scipy.stats.contingency import odds_ratio
        res = odds_ratio([[a, b], [c, d]], kind="conditional")
        ci = res.confidence_interval()
        return float(res.statistic), float(ci.low), float(ci.high), "exact"
    note = "Woolf"
    cells = [float(x) for x in (a, b, c, d)]
    if 0 in (a, b, c, d):
        cells = [x + 0.5 for x in cells]
        note = "Woolf, correction de Haldane (indicatif)"
    fa, fb, fc, fd = cells
    o = (fa * fd) / (fb * fc)
    se = math.sqrt(1 / fa + 1 / fb + 1 / fc + 1 / fd)
    return o, math.exp(math.log(o) - 1.959964 * se), math.exp(math.log(o) + 1.959964 * se), note


def hosmer_lemeshow(y: np.ndarray, p: np.ndarray, groups: int = 10) -> float | None:
    """p du test de Hosmer-Lemeshow sur les déciles de risque (ex aequo gardés ensemble,
    comme SPSS) ; None si moins de 3 groupes."""
    data = pd.DataFrame({"y": y, "p": p})
    try:
        data["g"] = pd.qcut(data["p"], q=groups, labels=False, duplicates="drop")
    except ValueError:
        return None
    agg = data.groupby("g").agg(obs=("y", "sum"), exp=("p", "sum"), n=("y", "size"))
    g = len(agg)
    if g < 3:
        return None
    denom = agg["exp"] * (1 - agg["exp"] / agg["n"])
    stat = float((((agg["obs"] - agg["exp"]) ** 2) / denom.where(denom > 0)).fillna(0).sum())
    return float(stats.chi2.sf(stat, g - 2))


def present_level(levels: list[Any]) -> Any | None:
    """Pour une variable à deux modalités : celle qui signale la présence (« 1 », « Oui »).
    None si aucune ne le dit clairement (la variable reste détaillée modalité par
    modalité)."""
    if len(levels) != 2:
        return None
    hits = [lv for lv in levels if _level(lv).strip().lower() in _PRESENT]
    return hits[0] if len(hits) == 1 else None


def wilson(k: int, n: int, z: float = 1.959964) -> tuple[float, float]:
    if n == 0:
        return float("nan"), float("nan")
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return max(0.0, centre - half), min(1.0, centre + half)


def holm(pvalues: list[float]) -> list[float]:
    """Correction de Holm ; un p manquant reste manquant et ne compte pas."""
    valid = [i for i, p in enumerate(pvalues) if p is not None and math.isfinite(p)]
    adjusted = [float("nan")] * len(pvalues)
    m = len(valid)
    running = 0.0
    for rank, i in enumerate(sorted(valid, key=lambda k: pvalues[k])):
        running = max(running, min(1.0, (m - rank) * pvalues[i]))
        adjusted[i] = running
    return adjusted


# ---------------------------------------------------------------- analyses

def _group_series(df: pd.DataFrame, group: str) -> tuple[pd.Series, list[Any]]:
    g = df[group]
    return g, _levels(g)


def _same(v: Any, target: Any) -> bool:
    return (str(v).strip().lower() == str(target).strip().lower()
            or (_is_number(v) and _is_number(target) and float(v) == float(target)))


def _group_event(plan: AnalysisPlan, levels: list[Any]) -> Any | None:
    """Modalité « événement » d'un groupe à deux modalités (odds ratio), ou None."""
    if len(levels) != 2:
        return None
    if plan.groups and plan.groups.event is not None:
        hits = [lv for lv in levels if _same(lv, plan.groups.event)]
        return hits[0] if hits else None
    return present_level(levels)


def run_describe(a: Describe, df: pd.DataFrame, plan: AnalysisPlan) -> dict[str, Any]:
    """Tableau descriptif, par groupe avec p si un groupe est défini. Une variable binaire
    dont une modalité dit la présence (« Oui », « 1 ») tient sur une ligne (« Diabète :
    8 (16,0 %) ») ; avec deux groupes dont l'un est l'événement, l'odds ratio est donné
    pour les associations significatives (« – » sinon)."""
    group = plan.groups.variable if (a.by_group and plan.groups) else None
    levels: list[Any] = []
    if group:
        g, levels = _group_series(df, group)
    event = _group_event(plan, levels) if group else None
    with_or = event is not None
    n_total = len(df)
    head = [f"Ensemble (n = {n_total})"]
    if group:
        head += [f"{lv} (n = {int((g == lv).sum())})" for lv in levels] + ["p", "Test"]
        if with_or:
            head.append("OR [IC 95 %]")
    rows: list[list[str]] = []
    facts: list[dict[str, Any]] = []
    methods: set[str] = set()
    or_kinds: set[str] = set()
    tail = 1 if with_or else 0
    for v in a.variables:
        s = df[v.name]
        label = _label(v, v.name)
        missing = int(s.isna().sum()) if v.type != "quantitative" else int(_num(s).isna().sum())
        name = label + (f" (manquant : {missing})" if missing else "")
        if v.type == "quantitative":
            x = _num(s)
            # Même règle pour la présentation et le test : normalité dans chaque groupe
            # quand on compare, sur l'ensemble sinon.
            normal = (all(is_normal(x[g == lv]) for lv in levels) if group
                      else is_normal(x))
            d = _digits(x.dropna())
            row = [name, summary_quant(x, normal, d)]
            fact = {"variable": label, "n": int(x.notna().sum()), "normal": normal,
                    "summary": row[1]}
            if group:
                parts = [x[g == lv] for lv in levels]
                row += [summary_quant(p, normal, d) for p in parts]
                p, test = test_quant(parts, normal)
                empty = sum(1 for part in parts if part.dropna().empty)
                if empty:
                    test += f" ({empty} groupe(s) sans valeur exclu(s))"
                row += [fmt_p(p), test] + ["–"] * tail
                methods.add(test)
                fact.update({"p": fmt_p(p), "test": test})
            rows.append(row)
            facts.append(fact)
            continue

        var_levels = _levels(s)
        n_ok = int(s.notna().sum())
        present = present_level(var_levels)
        p_val: float | None = None
        p_txt, test = "", ""
        if group:
            p_val, test = test_cat(pd.crosstab(s, g))
            p_txt = fmt_p(p_val)
            methods.add(test)
        or_txt = "–"
        if with_or and present is not None and p_val is not None and p_val < plan.alpha:
            has = s.map(lambda x, t=present: _same(x, t)).astype(bool)
            ev = g.map(lambda x, t=event: _same(x, t)).astype(bool)
            ok = s.notna() & g.notna()
            a_, b_ = int((ok & has & ev).sum()), int((ok & has & ~ev).sum())
            c_, d_ = int((ok & ~has & ev).sum()), int((ok & ~has & ~ev).sum())
            try:
                o, lo, hi, kind = odds_ratio_2x2(a_, b_, c_, d_, exact=test == "Fisher")
                or_txt = fmt_or(o, lo, hi)
                or_kinds.add(kind)
            except (ZeroDivisionError, ValueError):
                or_txt = "–"
        for lv in var_levels:
            n_lv = int((s == lv).sum())
            facts.append({"variable": label, "level": _level(lv), "n": n_lv, "N": n_ok,
                          "pct": pct(n_lv, n_ok)})
        if present is not None:
            n_lv = int((s == present).sum())
            row = [name, f"{n_lv} ({pct(n_lv, n_ok)} %)"]
            if group:
                for glv in levels:
                    in_g = s[g == glv]
                    k_g, n_g = int((in_g == present).sum()), int(in_g.notna().sum())
                    row.append(f"{k_g} ({pct(k_g, n_g)} %)")
                row += [p_txt, test] + [or_txt] * tail
                if or_txt != "–":
                    facts.append({"variable": label, "or": or_txt, "p": p_txt})
            rows.append(row)
            continue
        rows.append([name, ""] + ([""] * (len(levels) + 2 + tail) if group else []))
        for k, lv in enumerate(var_levels):
            n_lv = int((s == lv).sum())
            row = [f"    {_level(lv)}", f"{n_lv} ({pct(n_lv, n_ok)} %)"]
            if group:
                for glv in levels:
                    in_g = s[g == glv]
                    k_g, n_g = int((in_g == lv).sum()), int(in_g.notna().sum())
                    row.append(f"{k_g} ({pct(k_g, n_g)} %)")
                row += [p_txt if k == 0 else "", test if k == 0 else ""] + ["–" if k == 0 else ""] * tail
            rows.append(row)
    described = ["moyenne ± écart-type si la distribution est normale (Shapiro-Wilk), "
                 "sinon médiane [Q1–Q3] ; effectif (%) pour les variables qualitatives"]
    if or_kinds:
        described.append("odds ratio (OR) et IC 95 % ("
                         + ", ".join(sorted("méthode exacte" if k == "exact" else k
                                            for k in or_kinds))
                         + "), donnés pour les associations significatives")
    return {"table": {"columns": ["Variable", *head], "rows": rows},
            "facts": facts, "methods": described + sorted(methods), "n": n_total}


def run_proportion(a: Proportion, df: pd.DataFrame, _: AnalysisPlan) -> dict[str, Any]:
    s = df[a.variable].dropna()
    k = int(sum(str(v).strip().lower() == str(a.event).strip().lower()
                or (_is_number(v) and _is_number(a.event) and float(v) == float(a.event))
                for v in s))
    n = len(s)
    warn = ([f"Aucune ligne ne vaut « {a.event} » (0 %) : vérifier que c'est bien la "
             f"réponse qui code l'événement (réponses présentes : "
             f"{', '.join(sorted({str(v) for v in s})[:6])})."] if k == 0 else [])
    lo, hi = wilson(k, n)
    text = f"{k}/{n} ({pct(k, n)} %)"
    ci = f"[{fmt(100 * lo)}–{fmt(100 * hi)}]"
    return {"table": {"columns": ["Événement", "n/N (%)", "IC 95 %"],
                      "rows": [[_event_label(a), text, ci + " %"]]},
            "facts": [{"event": str(a.event), "k": k, "n": n, "pct": pct(k, n),
                       "ci_low": fmt(100 * lo), "ci_high": fmt(100 * hi),
                       "missing": int(df[a.variable].isna().sum())}],
            "methods": ["IC 95 % de Wilson"], "n": n, "warnings": warn}


def _event_label(a: Proportion) -> str:
    """Libellé de la ligne : celui du plan ; à défaut, le titre de l'analyse quand
    l'événement est un code (« 1 » ne dit rien au lecteur d'un tableau de thèse)."""
    if a.event_label.strip():
        return a.event_label
    return a.title if _is_number(a.event) else str(a.event)


def _is_number(v: Any) -> bool:
    try:
        float(v)
        return True
    except (TypeError, ValueError):
        return False


def run_compare(a: Compare, df: pd.DataFrame, plan: AnalysisPlan) -> dict[str, Any]:
    group = a.group or (plan.groups.variable if plan.groups else None)
    assert group is not None
    d = Describe(kind="describe", id=a.id, title=a.title, variables=a.variables, by_group=True)
    local_plan = plan.model_copy(update={"groups": plan.groups.model_copy(
        update={"variable": group}) if plan.groups else None})
    if local_plan.groups is None:
        from .plan import Groups
        local_plan = plan.model_copy(update={"groups": Groups(variable=group)})
    out = run_describe(d, df[df[group].notna()], local_plan)
    missing = int(df[group].isna().sum())
    if missing:
        out["warnings"] = [f"{missing} ligne(s) sans valeur pour le groupe « {group} », "
                           "non comparées"]
    return out


def run_paired(a: Paired, df: pd.DataFrame, _: AnalysisPlan) -> dict[str, Any]:
    data = pd.DataFrame({t: _num(df[v]) for t, v in zip(a.times, a.variables, strict=True)})
    complete = data.dropna()
    n = len(complete)
    rows: list[list[str]] = []
    warnings_: list[str] = []
    if n < 3:
        return {"table": {"columns": ["Temps", a.label], "rows": []}, "facts": [],
                "methods": [], "n": n,
                "warnings": [f"{n} patient(s) seulement ont la mesure à tous les temps"]}
    diffs_normal = all(is_normal(complete[t] - complete[a.times[0]]) for t in a.times[1:])
    d = _digits(complete.stack())
    facts: list[dict[str, Any]] = []
    for t in a.times:
        summary = summary_quant(complete[t], diffs_normal, d)
        rows.append([t, summary, str(n)])  # n des patients complets, ceux du résumé
        facts.append({"time": t, "summary": summary})
    methods: list[str] = []
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        if len(a.times) == 2:
            x, y = complete[a.times[0]], complete[a.times[1]]
            if diffs_normal:
                p, test = float(stats.ttest_rel(x, y).pvalue), "t de Student apparié"
            else:
                p, test = _wilcoxon_p(x, y), "Wilcoxon apparié"
            methods.append(test)
            facts.append({"comparison": f"{a.times[0]} → {a.times[1]}", "p": fmt_p(p),
                          "test": test})
            rows.append([f"{a.times[0]} → {a.times[1]}", p_phrase(p), test])
        else:
            p = float(stats.friedmanchisquare(*[complete[t] for t in a.times]).pvalue)
            methods.append("Friedman")
            facts.append({"comparison": "global", "p": fmt_p(p), "test": "Friedman"})
            rows.append(["Évolution globale", p_phrase(p), "Friedman"])
            raw = [_wilcoxon_p(complete[a.times[0]], complete[t]) for t in a.times[1:]]
            for t, padj in zip(a.times[1:], holm(raw), strict=True):
                facts.append({"comparison": f"{a.times[0]} → {t}", "p": fmt_p(padj),
                              "test": "Wilcoxon apparié, correction de Holm"})
                rows.append([f"{a.times[0]} → {t}", p_phrase(padj), "Wilcoxon (Holm)"])
            methods.append("Wilcoxon apparié avec correction de Holm")
    if n < len(df):
        warnings_.append(f"Analyse sur les {n} patients qui ont la mesure à tous les temps "
                         f"(sur {len(df)}).")
    return {"table": {"columns": ["Temps", a.label, "n"], "rows": rows}, "facts": facts,
            "methods": methods, "n": n, "warnings": warnings_,
            "figure": {"type": "line", "label": a.label, "times": a.times,
                       "values": [float(complete[t].mean() if diffs_normal
                                        else complete[t].median()) for t in a.times],
                       "stat": "moyenne" if diffs_normal else "médiane"}}


def _wilcoxon_p(x: pd.Series, y: pd.Series) -> float:
    """p du Wilcoxon apparié ; manquant si toutes les différences sont nulles."""
    if bool(((x - y) == 0).all()):
        return float("nan")
    try:
        return float(stats.wilcoxon(x, y).pvalue)
    except ValueError:
        return float("nan")


def run_correlation(a: Correlation, df: pd.DataFrame, _: AnalysisPlan) -> dict[str, Any]:
    data = pd.DataFrame({"x": _num(df[a.x]), "y": _num(df[a.y])}).dropna()
    n = len(data)
    if n < 3:
        return {"table": {"columns": ["Variables", "r", "p", "n"], "rows": []},
                "facts": [], "methods": [], "n": n, "warnings": ["effectif insuffisant"]}
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        if is_normal(data["x"]) and is_normal(data["y"]):
            res, test = stats.pearsonr(data["x"], data["y"]), "Pearson"
        else:
            res, test = stats.spearmanr(data["x"], data["y"]), "Spearman"
    r, p = float(res.statistic), float(res.pvalue)
    return {"table": {"columns": ["Variables", "r", "p", "n"],
                      "rows": [[f"{a.x} × {a.y}", fmt(r, 2), fmt_p(p), str(n)]]},
            "facts": [{"r": fmt(r, 2), "p": fmt_p(p), "n": n, "test": test}],
            "methods": [f"corrélation de {test}"], "n": n}


def fmt_or(o: float, lo: float, hi: float) -> str:
    """OR [IC 95 %] ; 3 décimales près de 1 (OR par unité : 1,006 [1,001 − 1,012]), pour
    qu'un IC significatif ne s'affiche pas « 1,00 − 1,01 »."""
    digits = 3 if 0.9 <= o <= 1.1 else 2
    return f"{fmt(o, digits)} [{fmt(lo, digits)}–{fmt(hi, digits)}]"


def _binary_outcome(s: pd.Series, event: Any) -> pd.Series:
    """1 = événement, 0 = l'autre réponse ; exige exactement deux réponses dont l'événement,
    sinon erreur (une 3e réponse, « NSP », ne doit pas devenir un non-événement)."""
    def is_event(v: Any) -> bool:
        return (str(v).strip().lower() == str(event).strip().lower()
                or (_is_number(v) and _is_number(event) and float(v) == float(event)))
    values = s.dropna()
    levels = {str(v).strip().lower() for v in values}
    if not any(is_event(v) for v in values):
        raise ValueError(f"aucune ligne ne vaut « {event} » : vérifiez la valeur de l'événement")
    if len(levels) != 2:
        raise ValueError(f"le critère doit avoir exactement deux réponses (trouvé : "
                         f"{', '.join(sorted(levels)[:6])}) : recodez-le d'abord")
    return s.map(lambda v: np.nan if pd.isna(v) else float(is_event(v)))


def _design(df: pd.DataFrame, covariates: list[Variable]) -> tuple[pd.DataFrame, list[str]]:
    """Matrice du modèle : quantitatives telles quelles ; qualitatives en indicatrices,
    référence = modalité la plus fréquente."""
    parts: list[pd.DataFrame] = []
    labels: list[str] = []
    for v in covariates:
        s = df[v.name]
        if v.type == "quantitative":
            parts.append(pd.DataFrame({v.name: _num(s)}))
            labels.append(_label(v, v.name))
        else:
            ref = s.value_counts().index[0] if s.notna().any() else None
            for lv in _levels(s):
                if lv == ref:
                    continue
                name = f"{v.name} = {lv}"
                col = (s == lv).astype(float).where(s.notna())
                parts.append(pd.DataFrame({name: col}))
                labels.append(f"{_label(v, v.name)} : {lv} (vs {ref})")
    return (pd.concat(parts, axis=1) if parts else pd.DataFrame(index=df.index)), labels


def run_logistic(a: Logistic, df: pd.DataFrame, _: AnalysisPlan) -> dict[str, Any]:
    import statsmodels.api as sm

    y = _binary_outcome(df[a.outcome], a.event)
    X, labels = _design(df, a.covariates)
    data = pd.concat([y.rename("_y"), X], axis=1).dropna()
    n, events = len(data), int(data["_y"].sum()) if len(data) else 0
    k = X.shape[1]
    warnings_: list[str] = []
    rows: list[list[str]] = []
    facts: list[dict[str, Any]] = []
    epv = (min(events, n - events) / k) if k else 0.0

    def fit(cols: list[str]) -> Any:
        """Modèle estimé, ou ValueError s'il ne converge pas ou si un coefficient est
        infini ou démesuré (séparation complète : statsmodels ne le signale plus)."""
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            r = sm.Logit(data["_y"], sm.add_constant(data[cols], has_constant="add")).fit(
                disp=0, maxiter=200)
        bse = np.asarray(r.bse, dtype=float)
        if not r.mle_retvals.get("converged", False) or not np.all(np.isfinite(bse)) \
                or float(np.max(np.abs(np.asarray(r.params, dtype=float)))) > 15 \
                or float(np.max(bse)) > 10:
            raise ValueError("séparation complète ou modèle non convergent")
        return r

    crude: dict[str, tuple[str, str]] = {}
    for col in X.columns:
        try:
            r = fit([col])
            o, (lo, hi), p = (math.exp(r.params[col]),
                              np.exp(r.conf_int().loc[col]).tolist(), float(r.pvalues[col]))
            crude[col] = (fmt_or(o, lo, hi), fmt_p(p))
        except Exception:  # noqa: BLE001 — séparation complète, matrice singulière
            crude[col] = ("non estimable", "—")
            warnings_.append(f"OR brut non estimable pour « {col} » (séparation complète : "
                             "une modalité n'a que des événements ou aucun).")
    adjusted: dict[str, tuple[str, str]] = {}
    hl_p: float | None = None
    if k and epv >= HARD_MIN_EPV and k > 1:
        try:
            r = fit(list(X.columns))
            ci = np.exp(r.conf_int())
            for col in X.columns:
                adjusted[col] = (fmt_or(math.exp(r.params[col]), ci.loc[col, 0], ci.loc[col, 1]),
                                 fmt_p(float(r.pvalues[col])))
            hl_p = hosmer_lemeshow(data["_y"].to_numpy(), np.asarray(r.predict(), dtype=float))
        except Exception:  # noqa: BLE001
            warnings_.append("Modèle ajusté non estimable (séparation complète ou "
                             "variables redondantes).")
    elif k > 1:
        smallest = min(events, n - events)
        warnings_.append(f"Le plus petit des deux groupes compte {smallest} patients pour {k} "
                         f"paramètres : moins de {HARD_MIN_EPV} par paramètre, pas de modèle "
                         "ajusté (les OR bruts restent présentés).")
    if k and HARD_MIN_EPV <= epv < MIN_EPV:
        warnings_.append(f"Environ {fmt(epv, 1)} événements par paramètre (moins de "
                         f"{MIN_EPV} recommandés) : le modèle ajusté est fragile.")
    for col, label in zip(X.columns, labels, strict=True):
        c_or, c_p = crude[col]
        a_or, a_p = adjusted.get(col, ("—", "—"))
        rows.append([label, c_or, c_p, a_or, a_p])
        facts.append({"variable": label, "or_brut": c_or, "p_brut": c_p,
                      "or_ajuste": a_or, "p_ajuste": a_p})
    return {"table": {"columns": ["Variable", "OR brut [IC 95 %]", "p", "OR ajusté [IC 95 %]",
                                  "p"], "rows": rows},
            "facts": [{"n": n, "events": events, "parameters": k,
                       **({"hosmer_lemeshow_p": fmt_p(hl_p)} if hl_p is not None else {})},
                      *facts],
            "methods": ["régression logistique"]
            + (["test de Hosmer-Lemeshow"] if hl_p is not None else []),
            "n": n, "warnings": warnings_}


RUNNERS = {
    "describe": run_describe, "proportion": run_proportion, "compare": run_compare,
    "paired": run_paired, "correlation": run_correlation, "logistic": run_logistic,
}


def run_plan(plan: AnalysisPlan, df: pd.DataFrame) -> list[dict[str, Any]]:
    """Exécute chaque analyse ; une analyse en échec est signalée, les autres continuent.
    L'analyse principale passe en premier."""
    ordered = sorted(plan.analyses, key=lambda a: a.id != plan.primary)
    results: list[dict[str, Any]] = []
    for a in ordered:
        try:
            out = RUNNERS[a.kind](a, df, plan)  # type: ignore[operator]
        except Exception as exc:  # noqa: BLE001 — une analyse ne doit pas bloquer les autres
            out = {"table": {"columns": [], "rows": []}, "facts": [], "methods": [], "n": 0,
                   "error": f"{type(exc).__name__} : {exc}"[:300]}
        out.setdefault("warnings", [])
        results.append({"id": a.id, "kind": a.kind, "title": a.title,
                        "primary": a.id == plan.primary, **out})
    return results
