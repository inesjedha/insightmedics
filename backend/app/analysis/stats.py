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


# ---------------------------------------------------------------- formats français

def fmt(x: float | None, digits: int = 1) -> str:
    if x is None or (isinstance(x, float) and not math.isfinite(x)):
        return "—"
    return f"{x:.{digits}f}".replace(".", ",").replace("-", "−")


def _integers(values: pd.Series) -> bool:
    v = values.dropna().astype(float)
    return bool(len(v)) and bool((v % 1 == 0).all())


def _digits(values: pd.Series) -> int:
    """1 décimale ; 2 pour les petites grandeurs mesurées (Hb 8,4 ; shock index 0,87)."""
    if _integers(values):
        return 1
    m = float(values.abs().median()) if len(values) else 0.0
    return 2 if m < 10 else 1


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
    s = s.dropna().astype(float)
    if s.empty:
        return "—"
    if normal:
        sd = float(s.std(ddof=1)) if len(s) > 1 else float("nan")
        return f"{fmt(float(s.mean()), digits)} ± {fmt(sd, digits)}"
    q1, med, q3 = quartiles(s)
    if _integers(s) and all(float(x).is_integer() for x in (q1, med, q3)):
        digits = 0  # « 15 [15 − 15] » plutôt que « 15,0 [15,0 − 15,0] »
    return f"{fmt(med, digits)} [{fmt(q1, digits)} − {fmt(q3, digits)}]"


def _levels(s: pd.Series) -> list[Any]:
    """Modalités dans un ordre stable : numérique croissant, sinon par effectif."""
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

def test_quant(groups: list[pd.Series]) -> tuple[float | None, str]:
    groups = [g.dropna().astype(float) for g in groups if len(g.dropna()) > 0]
    if len(groups) < 2 or any(len(g) < 2 for g in groups):
        return None, "effectifs insuffisants"
    normal = all(is_normal(g) for g in groups)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        if len(groups) == 2:
            if normal:
                return float(stats.ttest_ind(*groups, equal_var=False).pvalue), "t de Student (Welch)"
            return float(stats.mannwhitneyu(*groups, alternative="two-sided").pvalue), "Mann-Whitney"
        if normal:
            return float(stats.f_oneway(*groups).pvalue), "ANOVA"
        return float(stats.kruskal(*groups).pvalue), "Kruskal-Wallis"


def test_cat(table: pd.DataFrame) -> tuple[float | None, str]:
    table = table.loc[table.sum(axis=1) > 0, table.sum(axis=0) > 0]
    if table.shape[0] < 2 or table.shape[1] < 2:
        return None, "une seule modalité observée"
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        chi2 = stats.chi2_contingency(table.to_numpy())
    small = bool((chi2.expected_freq < 5).any())
    if table.shape == (2, 2) and small:
        return float(stats.fisher_exact(table.to_numpy()).pvalue), "Fisher"
    if small:
        return float(chi2.pvalue), "Chi² (effectifs attendus < 5 : à interpréter avec prudence)"
    return float(chi2.pvalue), "Chi²"


def wilson(k: int, n: int, z: float = 1.959964) -> tuple[float, float]:
    if n == 0:
        return float("nan"), float("nan")
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return max(0.0, centre - half), min(1.0, centre + half)


def holm(pvalues: list[float]) -> list[float]:
    order = np.argsort(pvalues)
    m = len(pvalues)
    adjusted = [0.0] * m
    running = 0.0
    for rank, i in enumerate(order):
        running = max(running, min(1.0, (m - rank) * pvalues[i]))
        adjusted[i] = running
    return adjusted


# ---------------------------------------------------------------- analyses

def _group_series(df: pd.DataFrame, group: str) -> tuple[pd.Series, list[Any]]:
    g = df[group]
    return g, _levels(g)


def run_describe(a: Describe, df: pd.DataFrame, plan: AnalysisPlan) -> dict[str, Any]:
    group = plan.groups.variable if (a.by_group and plan.groups) else None
    levels: list[Any] = []
    if group:
        g, levels = _group_series(df, group)
    n_total = len(df)
    head = [f"Ensemble (n = {n_total})"]
    if group:
        head += [f"{lv} (n = {int((g == lv).sum())})" for lv in levels] + ["p", "Test"]
    rows: list[list[str]] = []
    facts: list[dict[str, Any]] = []
    methods: set[str] = set()
    for v in a.variables:
        s = df[v.name]
        label = _label(v, v.name)
        if v.type == "quantitative":
            x = _num(s)
            normal = is_normal(x)
            d = _digits(x.dropna())
            missing = int(x.isna().sum())
            row = [label + (f" (manquant : {missing})" if missing else ""),
                   summary_quant(x, normal, d)]
            fact = {"variable": label, "n": int(x.notna().sum()), "normal": normal,
                    "summary": row[1]}
            if group:
                parts = [x[g == lv] for lv in levels]
                row += [summary_quant(p, normal, d) for p in parts]
                p, test = test_quant(parts)
                row += [fmt_p(p), test]
                methods.add(test)
                fact.update({"p": fmt_p(p), "test": test})
            rows.append(row)
            facts.append(fact)
        else:
            missing = int(s.isna().sum())
            rows.append([label + (f" (manquant : {missing})" if missing else ""), ""]
                        + ([""] * (len(levels) + 2) if group else []))
            p_txt, test = "", ""
            if group:
                tab = pd.crosstab(s, g)
                p, test = test_cat(tab)
                p_txt = fmt_p(p)
                methods.add(test)
            for k, lv in enumerate(_levels(s)):
                n_lv, n_ok = int((s == lv).sum()), int(s.notna().sum())
                row = [f"    {_level(lv)}", f"{n_lv} ({pct(n_lv, n_ok)} %)"]
                if group:
                    for glv in levels:
                        in_g = s[g == glv]
                        k_g, n_g = int((in_g == lv).sum()), int(in_g.notna().sum())
                        row.append(f"{k_g} ({pct(k_g, n_g)} %)")
                    row += [p_txt if k == 0 else "", test if k == 0 else ""]
                rows.append(row)
                facts.append({"variable": label, "level": _level(lv), "n": n_lv, "N": n_ok,
                              "pct": pct(n_lv, n_ok)})
    described = ["moyenne ± écart-type si la distribution est normale (Shapiro-Wilk), "
                 "sinon médiane [Q1 − Q3] ; effectif (%) pour les variables qualitatives"]
    return {"table": {"columns": ["Variable", *head], "rows": rows},
            "facts": facts, "methods": described + sorted(methods), "n": n_total}


def run_proportion(a: Proportion, df: pd.DataFrame, _: AnalysisPlan) -> dict[str, Any]:
    s = df[a.variable].dropna()
    k = int(sum(str(v).strip().lower() == str(a.event).strip().lower()
                or (_is_number(v) and _is_number(a.event) and float(v) == float(a.event))
                for v in s))
    n = len(s)
    lo, hi = wilson(k, n)
    text = f"{k}/{n} ({pct(k, n)} %)"
    ci = f"[{fmt(100 * lo)} − {fmt(100 * hi)}]"
    return {"table": {"columns": ["Événement", "n/N (%)", "IC 95 %"],
                      "rows": [[a.event_label or str(a.event), text, ci + " %"]]},
            "facts": [{"event": str(a.event), "k": k, "n": n, "pct": pct(k, n),
                       "ci_low": fmt(100 * lo), "ci_high": fmt(100 * hi),
                       "missing": int(df[a.variable].isna().sum())}],
            "methods": ["IC 95 % de Wilson"], "n": n}


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
        rows.append([t, summary, str(int(data[t].notna().sum()))])
        facts.append({"time": t, "summary": summary})
    methods: list[str] = []
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        if len(a.times) == 2:
            x, y = complete[a.times[0]], complete[a.times[1]]
            if diffs_normal:
                p, test = float(stats.ttest_rel(x, y).pvalue), "t de Student apparié"
            else:
                p, test = float(stats.wilcoxon(x, y).pvalue), "Wilcoxon apparié"
            methods.append(test)
            facts.append({"comparison": f"{a.times[0]} → {a.times[1]}", "p": fmt_p(p),
                          "test": test})
            rows.append([f"{a.times[0]} → {a.times[1]}", p_phrase(p), test])
        else:
            p = float(stats.friedmanchisquare(*[complete[t] for t in a.times]).pvalue)
            methods.append("Friedman")
            facts.append({"comparison": "global", "p": fmt_p(p), "test": "Friedman"})
            rows.append(["Évolution globale", p_phrase(p), "Friedman"])
            raw = [float(stats.wilcoxon(complete[a.times[0]], complete[t]).pvalue)
                   for t in a.times[1:]]
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

    y_raw = df[a.outcome]
    y = y_raw.map(lambda v: np.nan if pd.isna(v) else float(
        str(v).strip().lower() == str(a.event).strip().lower()
        or (_is_number(v) and _is_number(a.event) and float(v) == float(a.event))))
    X, labels = _design(df, a.covariates)
    data = pd.concat([y.rename("_y"), X], axis=1).dropna()
    n, events = len(data), int(data["_y"].sum()) if len(data) else 0
    k = X.shape[1]
    warnings_: list[str] = []
    rows: list[list[str]] = []
    facts: list[dict[str, Any]] = []
    epv = (min(events, n - events) / k) if k else 0.0

    def fit(cols: list[str]) -> Any:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            return sm.Logit(data["_y"], sm.add_constant(data[cols], has_constant="add")).fit(
                disp=0, maxiter=200)

    crude: dict[str, tuple[str, str]] = {}
    for col in X.columns:
        try:
            r = fit([col])
            o, (lo, hi), p = (math.exp(r.params[col]),
                              np.exp(r.conf_int().loc[col]).tolist(), float(r.pvalues[col]))
            crude[col] = (f"{fmt(o, 2)} [{fmt(lo, 2)} − {fmt(hi, 2)}]", fmt_p(p))
        except Exception:  # noqa: BLE001 — séparation complète, matrice singulière
            crude[col] = ("non estimable", "—")
    adjusted: dict[str, tuple[str, str]] = {}
    if k and epv >= HARD_MIN_EPV and k > 1:
        try:
            r = fit(list(X.columns))
            ci = np.exp(r.conf_int())
            for col in X.columns:
                adjusted[col] = (f"{fmt(math.exp(r.params[col]), 2)} [{fmt(ci.loc[col, 0], 2)}"
                                 f" − {fmt(ci.loc[col, 1], 2)}]", fmt_p(float(r.pvalues[col])))
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
            "facts": [{"n": n, "events": events, "parameters": k}, *facts],
            "methods": ["régression logistique"], "n": n, "warnings": warnings_}


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
