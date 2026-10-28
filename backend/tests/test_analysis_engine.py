"""Chaîne Analyses + résultats : expressions, base d'analyse, moteur de calcul, contrôle
des chiffres rédigés. Données synthétiques, déterministes, sans API."""

import numpy as np
import pandas as pd
import pytest

from app.analysis.expr import ExprError, columns_used, evaluate
from app.analysis.llm_write import (
    ResultsText,
    Section,
    allowed_numbers,
    inconsistencies,
    normalize,
    unknown_numbers,
)
from app.analysis.plan import AnalysisPlan, plan_problems
from app.analysis.prepare import INCLUDED, REASON, analysed, prepare
from app.analysis.stats import fmt_p, holm, run_plan, wilson

RNG = np.random.default_rng(7)
N = 60


def _base() -> pd.DataFrame:
    groupe = np.array(["A", "B"] * (N // 2))
    return pd.DataFrame({
        "Numéro": [str(i + 1) for i in range(N)],
        "Âge (ans)": [f"{int(a)} ans" for a in RNG.normal(50, 10, N)],
        "Sexe": RNG.choice(["M", "F", "m"], N),
        "Groupe": groupe,
        "Volume estimé": RNG.normal(700, 100, N).round(),
        "Volume évacué": RNG.normal(650, 120, N).round(),
        "SpO2 J0": RNG.normal(93, 2, N).round(),
        "SpO2 J1": RNG.normal(95, 2, N).round(),
        "SpO2 J3": RNG.normal(97, 1.5, N).round(),
        "PaO2/FiO2": [">400" if i == 3 else str(300 + i) for i in range(N)],
    })


PLAN = {
    "title": "Étude test",
    "population": {"exclusions": [{"label": "Patients 1 à 5 (test)", "expr": 'col("Numéro") <= 5'}]},
    "derived": [
        {"name": "age", "label": "Âge (ans)", "kind": "parse_number", "source": "Âge (ans)"},
        {"name": "sexe", "kind": "recode", "type": "categorical", "source": "Sexe",
         "mapping": {"M": "Homme", "F": "Femme"}},
        {"name": "pct", "kind": "formula", "expr": 'col("Volume évacué") / col("Volume estimé") * 100'},
        {"name": "succes", "kind": "formula", "type": "binary", "expr": 'ifelse(col("pct") >= 90, 1, 0)'},
        {"name": "classe", "kind": "bins", "type": "categorical", "source": "pct",
         "cuts": [0, 70, 90, 1000], "labels": ["Échec", "Partiel", "Complet"]},
        {"name": "pf", "kind": "parse_number", "source": "PaO2/FiO2"},
    ],
    "groups": {"variable": "Groupe", "label": "Groupe"},
    "analyses": [
        {"kind": "describe", "id": "t1", "title": "Patients", "variables": [
            {"name": "age", "label": "Âge", "type": "quantitative"},
            {"name": "sexe", "label": "Sexe", "type": "categorical"}]},
        {"kind": "proportion", "id": "principal", "title": "Succès", "variable": "succes",
         "event": 1, "event_label": "Succès complet"},
        {"kind": "compare", "id": "cmp", "title": "Selon le groupe", "variables": [
            {"name": "pct", "label": "Volume évacué (%)", "type": "quantitative"},
            {"name": "classe", "label": "Succès", "type": "categorical"}]},
        {"kind": "paired", "id": "spo2", "title": "SpO2", "label": "SpO2 (%)",
         "times": ["J0", "J1", "J3"], "variables": ["SpO2 J0", "SpO2 J1", "SpO2 J3"]},
        {"kind": "correlation", "id": "cor", "title": "Âge et volume", "x": "age", "y": "pct"},
        {"kind": "logistic", "id": "rl", "title": "Facteurs", "outcome": "succes", "event": 1,
         "covariates": [{"name": "age", "label": "Âge", "type": "quantitative"}]},
    ],
    "primary": "principal",
}


def test_expressions_fermees_et_manquants_preserves():
    df = pd.DataFrame({"a": [1, None, 5], "Nom avec espace": ["OUI", "non", None]})
    out = evaluate('col("a") > 2', df)
    assert out.tolist()[0] is False and pd.isna(out.tolist()[1]) and out.tolist()[2] is True
    assert evaluate('isin(col("Nom avec espace"), ["oui"])', df).tolist()[0] is True
    assert columns_used('col("a") + col("Nom avec espace")') == ["a", "Nom avec espace"]
    for bad in ('__import__("os")', 'col("a").to_csv()', "open('x')", 'col("zz")'):
        with pytest.raises(ExprError):
            evaluate(bad, df)


def test_plan_verifie_les_colonnes():
    plan = AnalysisPlan.model_validate({**PLAN, "primary": "absent"})
    problems = plan_problems(plan, list(_base().columns))
    assert any("absent" in p for p in problems)
    bad = AnalysisPlan.model_validate({**PLAN, "derived": [
        {"name": "x", "kind": "parse_number", "source": "Inconnue"}]})
    assert any("Inconnue" in p for p in plan_problems(bad, list(_base().columns)))
    assert plan_problems(AnalysisPlan.model_validate(PLAN), list(_base().columns)) == []


def test_base_d_analyse_sans_suppression_et_flux():
    df = _base()
    base, flow, log = prepare(df, AnalysisPlan.model_validate(PLAN), [("Fiche vierge", [59])])
    assert len(base) == N                                   # aucune ligne supprimée
    assert flow[1] == {"label": "Fiche vierge", "excluded": 1, "remaining": N - 1}
    assert flow[2]["excluded"] == 5 and flow[-1]["n"] == N - 6
    assert base.loc[0, INCLUDED] == 0 and base.loc[0, REASON] == "Patients 1 à 5 (test)"
    assert len(analysed(base)) == N - 6
    pf = next(d for d in log if d["name"] == "pf")
    assert pf["censored"] == 1 and pd.isna(base.loc[3, "pf"])  # « >400 » : jamais inventé
    sexe = next(d for d in log if d["name"] == "sexe")
    assert "n_non_prevues" not in sexe                      # « m » = « M » (casse ignorée)


def test_moteur_de_calcul():
    df = _base()
    plan = AnalysisPlan.model_validate(PLAN)
    base, _, _ = prepare(df, plan)
    results = {r["id"]: r for r in run_plan(plan, analysed(base))}
    assert next(iter(results)) == "principal"               # l'analyse principale d'abord
    assert all(not r.get("error") for r in results.values()), results
    prop = results["principal"]["facts"][0]
    assert prop["n"] == N - 5 and results["principal"]["table"]["rows"][0][0] == "Succès complet"
    cmp = results["cmp"]["table"]
    assert cmp["columns"][-2:] == ["p", "Test"]
    spo2 = results["spo2"]
    assert "Friedman" in spo2["methods"] and spo2["figure"]["times"] == ["J0", "J1", "J3"]
    assert results["rl"]["table"]["rows"][0][1] != "non estimable"


def test_outils_statistiques():
    lo, hi = wilson(31, 36)
    assert round(lo, 3) == 0.713 and round(hi, 3) == 0.939
    assert holm([0.01, 0.04, 0.03]) == pytest.approx([0.03, 0.06, 0.06])
    assert fmt_p(0.0004) == "< 0,001" and fmt_p(0.1204) == "0,120"


def test_controle_des_chiffres_rediges():
    context = {"analyses": [{"facts": [{"variable": "Ptx", "level": "Oui", "n": 1, "N": 36,
                                        "pct": "2,8"},
                                       {"event": "1", "k": 31, "n": 36, "pct": "86,1"}],
                             "table": {"columns": ["Temps", "SpO2", "n"],
                                       "rows": [["J0 → J3", "p < 0,001", "Wilcoxon"]]}}],
               "diagramme_de_flux": [{"label": "Lignes", "n": 2183}]}
    assert normalize("2 183") == "2183" and normalize("15,0") == "15"

    def text(*paragraphs: str) -> ResultsText:
        return ResultsText(sections=[Section(analysis_id="a", heading="Succès",
                                             table_title="Tableau 1", paragraphs=list(paragraphs))])

    ok = text("Succès chez 31 patients sur 36 (86,1 %, IC 95 % [71,3 − 93,9]), base de 2 183 "
              "lignes ; pneumothorax chez 1 patient (2,8 %) ; amélioration (p < 0,001).")
    ctx_ok = {**context, "analyses": [{**context["analyses"][0],
                                       "table": {**context["analyses"][0]["table"],
                                                 "rows": [["J0", "71,3", "93,9"],
                                                          ["J0 → J3", "p < 0,001", ""]]}}]}
    assert inconsistencies(ok, ctx_ok) == []
    assert unknown_numbers(text("Taux de 87,4 % chez 12 patients."),
                           allowed_numbers(context)) == ["12", "87.4"]
    # chiffres existants, mais pas ensemble : refusé
    assert inconsistencies(text("Pneumothorax chez 31 patients (2,8 %)."), context)
    assert inconsistencies(text("Succès : 1/36 (86,1 %)."), context)
    # p mal recopié (« = 0,001 » au lieu de « < 0,001 ») : refusé
    assert any("p = 0,001" in p for p in inconsistencies(text("Évolution (p = 0,001)."), context))
    # « 5 % » n'est plus permis d'office
    assert unknown_numbers(text("5 % de femmes."), allowed_numbers(context)) == ["5"]


def test_cas_limites_signales_par_la_relecture():
    """Retours de la relecture statistique du 27/10/2026."""
    from app.analysis.plan import Logistic, Variable
    from app.analysis.prepare import _parse_number
    from app.analysis.stats import run_logistic, test_cat

    df = pd.DataFrame({"debut": ["03/04/2024"], "fin": ["05/04/2024"], "v": [0.0], "w": [5.0],
                       "n": [34.0]})
    assert evaluate('days_between(col("debut"), col("fin"))', df).tolist() == [2]   # jj/mm
    assert pd.isna(evaluate('col("w") / col("v")', df).iloc[0])                    # pas d'infini
    assert evaluate('isin(col("n"), [33, 34])', df).tolist() == [True]
    assert evaluate('col("n") == "34"', df).tolist() == [True]
    with pytest.raises(ExprError):
        evaluate('"a" * 99999999', df)
    with pytest.raises(ExprError):
        evaluate("-" * 1500 + "1", df)

    parsed, counts = _parse_number(pd.Series(["1 200 mL", "10-15", "7 jours", ">400"]))
    assert parsed.tolist()[0] == 1200 and pd.isna(parsed.tolist()[1]) and parsed.tolist()[2] == 7
    assert counts == {"censored": 1, "unreadable": 1}

    # Chi² de Pearson sans correction de Yates (comme SPSS)
    p, test = test_cat(pd.DataFrame([[12, 8], [5, 15]]))
    assert test == "Chi²" and round(p, 3) == 0.025          # Yates donnerait 0,054

    # Événement mal écrit, ou troisième réponse : erreur, jamais un OR faux
    base = pd.DataFrame({"y": ["Oui", "Non", "NSP"] * 10, "x": range(30)})
    lg = Logistic(kind="logistic", id="l", title="t", outcome="y", event="Oui",
                  covariates=[Variable(name="x", type="quantitative")])
    with pytest.raises(ValueError):
        run_logistic(lg, base, AnalysisPlan())
    # Séparation complète : « non estimable » et un avertissement, pas un OR géant
    sep = pd.DataFrame({"y": [1] * 15 + [0] * 15, "x": ["a"] * 15 + ["b"] * 15})
    out = run_logistic(Logistic(kind="logistic", id="l", title="t", outcome="y", event=1,
                                covariates=[Variable(name="x", type="categorical")]),
                       sep, AnalysisPlan())
    assert out["table"]["rows"][0][1] == "non estimable" and out["warnings"]


def test_plan_ia_incoherent_renvoye_au_modele(monkeypatch):
    """Un plan qui cite une colonne inconnue est refusé et redemandé avec le motif."""
    import json

    from app.analysis import llm_plan
    from app.config import settings
    from app.pipeline import llm_client
    from app.pipeline.profile import profile

    df = _base()
    prof = profile(df, {"file_name": "t.csv", "format": "csv"})
    answers = [json.dumps({**PLAN, "groups": {"variable": "Inexistante"}}), json.dumps(PLAN)]
    prompts: list[str] = []

    def fake(system: str, user: str, effort: str | None = None) -> str:
        prompts.append(user)
        return answers.pop(0)

    monkeypatch.setattr(settings, "anthropic_api_key", "test")
    monkeypatch.setattr(llm_client, "call_llm", fake)
    plan, _notes = llm_plan.run_plan_llm(df, prof, None, "Protocole.", "Succès ≥ 90 %.", None)
    assert plan is not None and plan.groups.variable == "Groupe"
    assert "Inexistante" in prompts[1] and "CORRECTION" in prompts[1]
    assert "Succès ≥ 90 %." in prompts[0] and "<contenu_client" in prompts[0]
    assert '"values"' in prompts[0]                                # réponses possibles vues


def test_redaction_ia_refusee_si_chiffre_invente(monkeypatch):
    import json

    from app.analysis import llm_write
    from app.config import settings
    from app.pipeline import llm_client

    ctx = {"analyses": [{"id": "p", "table": {"rows": [["Succès", "31/36 (86,1 %)"]]}}]}
    good = {"methods_paragraph": "Seuil de 0,05.", "flow_paragraph": "",
            "sections": [{"analysis_id": "p", "heading": "Succès", "table_title": "Tableau 1",
                          "paragraphs": ["31 patients sur 36 (86,1 %)."]}], "missing": []}
    bad = {**good, "sections": [{**good["sections"][0], "paragraphs": ["32 patients (88 %)."]}]}
    answers = [json.dumps(bad), json.dumps(good)]
    monkeypatch.setattr(settings, "anthropic_api_key", "test")
    monkeypatch.setattr(llm_client, "call_llm", lambda s, u, e=None: answers.pop(0))
    out, notes = llm_write.run_write_llm(ctx)
    assert out is not None and out.sections[0].paragraphs == ["31 patients sur 36 (86,1 %)."]
    assert any("tentative 2" in n for n in notes)


def test_tableau_de_proportion_affiche_un_libelle_et_pas_un_code():
    from app.analysis.plan import Proportion
    from app.analysis.stats import run_proportion

    a = Proportion(kind="proportion", id="p", title="Succès complet", variable="s", event=1)
    out = run_proportion(a, pd.DataFrame({"s": [1, 1, 0]}), AnalysisPlan())
    assert out["table"]["rows"][0][0] == "Succès complet"
