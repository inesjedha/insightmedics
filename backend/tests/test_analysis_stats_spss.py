"""Réglages du moteur alignés sur SPSS (prompts de Dr Hamza, § 8) : arrondi, précision,
Student/Welch, Mann-Whitney, Fisher-Freeman-Halton, odds ratio, Hosmer-Lemeshow, lignes
des variables binaires."""

import math

import numpy as np
import pandas as pd
import pytest
from scipy import stats

from app.analysis import stats as engine
from app.analysis.plan import AnalysisPlan
from app.analysis.stats import (
    _digits,
    fmt,
    fmt_p,
    hosmer_lemeshow,
    odds_ratio_2x2,
    present_level,
    run_describe,
    summary_quant,
)

# Importées sous un autre nom : pytest prendrait « test_quant » pour un test.
quant_test, cat_test = engine.test_quant, engine.test_cat


def test_arrondi_demie_vers_le_haut_comme_spss():
    assert fmt(31.25, 1) == "31,3"          # Python arrondirait à 31,2
    assert fmt(18.5, 0) == "19"
    assert fmt(0.125, 2) == "0,13"
    assert fmt(-2.25, 1) == "−2,3"
    assert fmt(-0.04, 1) == "0,0"           # jamais « −0,0 »
    assert fmt(float("nan")) == "—"


def test_precision_de_la_variable():
    assert _digits(pd.Series([53, 34, 63])) == 0
    assert _digits(pd.Series([8.4, 9.1, 7.0])) == 1
    assert _digits(pd.Series([0.87, 1.2])) == 2
    ages = pd.Series([23, 34, 41, 53, 57, 63, 75], dtype=float)
    assert summary_quant(ages, normal=False, digits=0) == "53 [34–63]"
    # Moyenne ± écart-type : une décimale de plus que la variable.
    assert summary_quant(pd.Series([70.0, 80.0, 78.0]), normal=True, digits=0) == "76,0 ± 5,3"
    # Médiane d'un nombre pair de valeurs entières : la demie est gardée.
    assert summary_quant(pd.Series([94.0, 95.0, 96.0, 97.0]), normal=False,
                         digits=0).startswith("95,5 [")


def test_student_ou_welch_selon_levene():
    rng = np.random.default_rng(1)
    a, b = pd.Series(rng.normal(10, 1, 40)), pd.Series(rng.normal(11, 1, 40))
    _, test = quant_test([a, b], normal=True)
    assert test == "t de Student"
    c = pd.Series(rng.normal(11, 6, 40))
    p, test = quant_test([a, c], normal=True)
    assert test == "t de Welch"
    assert p == pytest.approx(stats.ttest_ind(a, c, equal_var=False).pvalue)


def test_mann_whitney_asymptotique_sans_correction_de_continuite():
    x = pd.Series([1, 2, 2, 3, 4, 5, 6, 7], dtype=float)
    y = pd.Series([3, 4, 5, 5, 6, 8, 9, 9, 10], dtype=float)
    p, test = quant_test([x, y], normal=False)
    assert test == "Mann-Whitney"
    # Approximation normale corrigée des ex aequo, sans correction de continuité.
    n1, n2 = len(x), len(y)
    ranks = stats.rankdata(np.concatenate([x, y]))
    u = ranks[:n1].sum() - n1 * (n1 + 1) / 2
    _, counts = np.unique(np.concatenate([x, y]), return_counts=True)
    n = n1 + n2
    sd = math.sqrt(n1 * n2 / 12 * ((n + 1) - (counts ** 3 - counts).sum() / (n * (n - 1))))
    z = (u - n1 * n2 / 2) / sd
    assert p == pytest.approx(2 * stats.norm.sf(abs(z)))


def test_fisher_freeman_halton_reproductible():
    table = pd.DataFrame([[3, 1, 0], [1, 4, 6]])
    p1, test = cat_test(table)
    p2, _ = cat_test(table)
    assert test == "Fisher-Freeman-Halton" and p1 == p2


def test_odds_ratio():
    o, lo, hi, kind = odds_ratio_2x2(10, 20, 5, 40, exact=False)
    assert kind == "Woolf" and o == pytest.approx(4.0)
    assert lo == pytest.approx(1.2048, abs=1e-3) and hi == pytest.approx(13.28, abs=1e-2)
    _, _, _, kind = odds_ratio_2x2(0, 20, 5, 40, exact=False)
    assert "Haldane" in kind
    # Avec un Fisher : IC exact conditionnel, qui exclut 1 si et seulement si p < 0,05.
    for cells in ([5, 7, 3, 35], [2, 8, 3, 30]):
        _, lo, hi, kind = odds_ratio_2x2(*cells, exact=True)
        p = stats.fisher_exact([[cells[0], cells[1]], [cells[2], cells[3]]]).pvalue
        assert kind == "exact" and ((lo > 1 or hi < 1) == (p < 0.05))


def test_hosmer_lemeshow():
    rng = np.random.default_rng(3)
    p = rng.uniform(0.05, 0.95, 300)
    y = (rng.uniform(size=300) < p).astype(float)
    hl = hosmer_lemeshow(y, p)
    assert hl is not None and 0 <= hl <= 1
    assert hosmer_lemeshow(np.array([0.0, 1.0]), np.array([0.5, 0.5])) is None


def test_variable_binaire_sur_une_ligne_avec_odds_ratio():
    assert present_level(["Non", "Oui"]) == "Oui" and present_level([0, 1]) == 1
    assert present_level(["Homme", "Femme"]) is None
    df = pd.DataFrame({
        "recidive": ["Oui"] * 12 + ["Non"] * 38,
        "diabete": ["Oui"] * 5 + ["Non"] * 7 + ["Oui"] * 3 + ["Non"] * 35,
        "sexe": ["H", "F"] * 25,
    })
    plan = AnalysisPlan.model_validate({"groups": {"variable": "recidive"}, "analyses": []})
    a = AnalysisPlan.model_validate({"analyses": [{"kind": "describe", "id": "t", "title": "T",
                                                   "variables": [
                                                       {"name": "diabete", "label": "Diabète",
                                                        "type": "binary"},
                                                       {"name": "sexe", "label": "Sexe",
                                                        "type": "categorical"}]}]}).analyses[0]
    out = run_describe(a, df, plan)  # type: ignore[arg-type]
    cols, rows = out["table"]["columns"], out["table"]["rows"]
    assert cols[-1] == "OR [IC 95 %]"
    diabete = rows[0]
    assert diabete[0] == "Diabète" and diabete[1] == "8 (16,0 %)"
    expected = stats.fisher_exact([[5, 3], [7, 35]]).pvalue
    assert diabete[-3] == fmt_p(expected) and diabete[-2] == "Fisher" and diabete[-1] != "–"
    # Variable non binaire : ligne de regroupement puis une ligne par modalité, sans OR.
    assert rows[1][0] == "Sexe" and rows[2][0].startswith("    ") and rows[2][-1] == "–"
