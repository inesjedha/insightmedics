"""Nettoyage de la base par nos soins (corrections du plan, analysis/clean.py)."""

import numpy as np
import pandas as pd
import pytest

from app.analysis.clean import Correction, apply_corrections, correction_problems
from app.analysis.plan import AnalysisPlan, plan_problems
from app.analysis.prepare import prepare


def _df() -> pd.DataFrame:
    return pd.DataFrame({"Age": [34, 999, -2, 40], "Entrée": ["03/04/2026", "12/04/2026",
                                                            "pas noté", None],
                         "Sexe": [" H", "h", "F  ", "Femme"]})


def test_original_jamais_modifie_et_espaces_retires():
    df = _df()
    base, journal = apply_corrections(df, [])
    assert df["Sexe"].tolist() == [" H", "h", "F  ", "Femme"]
    assert base["Sexe"].tolist() == ["H", "h", "F", "Femme"]
    assert journal[0]["kind"] == "trim" and journal[0]["n"] == 2


def test_code_de_case_vide_rend_la_colonne_numerique():
    df = pd.DataFrame({"Age": ["34", "999", "NR", "40"]})
    base, journal = apply_corrections(
        df, [Correction(kind="missing_codes", column="Age", values=[999, "nr"])])
    assert pd.api.types.is_numeric_dtype(base["Age"]) and base["Age"].isna().sum() == 2
    assert journal[-1]["lines"] == [3, 4]


def test_dates_jour_mois_et_illisibles_listees():
    base, journal = apply_corrections(_df(), [Correction(kind="to_date", column="Entrée")])
    assert base["Entrée"].iloc[0] == pd.Timestamp(2026, 4, 3)
    assert journal[-1]["illisibles"] == [4]


def test_valeur_impossible_videe_par_condition():
    base, journal = apply_corrections(_df(), [
        Correction(kind="set_missing", column="Age", where='col("Age") < 0', reason="négatif")])
    assert np.isnan(base["Age"].iloc[2]) and journal[-1]["examples"] == ["-2 → vide"]


def test_ligne_hors_fichier_refusee():
    with pytest.raises(ValueError, match="hors du fichier"):
        apply_corrections(_df(), [Correction(kind="set_missing", column="Age", lines=[9])])


def test_valeur_corrigee_exige_sa_source():
    c = Correction(kind="set_value", column="Age", lines=[3], value=52)
    assert any("source" in p for p in correction_problems([c], ["Age"]))
    c.source = "dossier vérifié par l'étudiant"
    assert correction_problems([c], ["Age"]) == []
    base, _ = apply_corrections(_df(), [c])
    assert base["Age"].iloc[1] == 52


def test_les_corrections_passent_avant_colonnes_calculees_et_exclusions():
    plan = AnalysisPlan.model_validate({
        "corrections": [{"kind": "harmonize", "column": "Sexe",
                         "mapping": {"h": "Homme", "f": "Femme", "femme": "Femme"}},
                        {"kind": "missing_codes", "column": "Age", "values": [999]}],
        "derived": [{"name": "homme", "kind": "formula", "type": "binary",
                     "expr": 'ifelse(col("Sexe") == "Homme", 1, 0)'}],
        "population": {"exclusions": [{"label": "Âge inconnu", "expr": 'isnull(col("Age"))'}]},
        "analyses": []})
    assert plan_problems(plan, list(_df().columns)) == []
    base, flow, log = prepare(_df(), plan)
    assert base["homme"].tolist() == [1, 1, 0, 0]
    assert flow[1] == {"label": "Âge inconnu", "excluded": 1, "remaining": 3}
    assert [e["step"] for e in log] == ["correction"] * 3 + ["derived"]


def test_correction_sur_colonne_inconnue_signalee():
    plan = AnalysisPlan.model_validate({"corrections": [{"kind": "to_number", "column": "Poids"}]})
    assert any("colonne inconnue" in p for p in plan_problems(plan, ["Age"]))


def test_dates_vraies_iso_et_incompletes():
    import datetime as dt
    df = pd.DataFrame({"d": [dt.datetime(2023, 4, 3), "2023-12-01", "03/04/2023", "2019",
                             "03/2023", 45000.0]})
    base, journal = apply_corrections(df, [Correction(kind="to_date", column="d")])
    got = base["d"].tolist()
    assert got[0] == pd.Timestamp(2023, 4, 3) and got[1] == pd.Timestamp(2023, 12, 1)
    assert got[2] == pd.Timestamp(2023, 4, 3) and got[5] == pd.Timestamp(2023, 3, 15)
    assert pd.isna(got[3]) and pd.isna(got[4])               # rien d'inventé
    assert journal[-1]["illisibles"] == [5, 6]


def test_valeur_du_dossier_jamais_par_condition():
    c = Correction(kind="set_value", column="Age", where='col("Age") > 0', value=7,
                   source="dossier")
    assert any("sans condition" in p for p in correction_problems([c], ["Age"]))
    with pytest.raises(ValueError, match="sans condition"):
        apply_corrections(_df(), [c])


def test_lignes_et_condition_se_croisent():
    c = Correction(kind="set_missing", column="Age", lines=[2, 3], where='col("Age") > 100')
    base, _ = apply_corrections(_df(), [c])
    assert base["Age"].tolist()[:2] == [34, None] or np.isnan(base["Age"].iloc[1])
    assert base["Age"].iloc[0] == 34


def test_numero_de_cas_spss():
    c = Correction(kind="set_missing", column="Age", lines=[2])
    base, journal = apply_corrections(_df(), [c], first_line=1)
    assert np.isnan(base["Age"].iloc[1]) and journal[-1]["lines"] == [2]


def test_code_a_zero_de_tete_reste_du_texte():
    df = pd.DataFrame({"Code": ["007", "999", "012"]})
    base, journal = apply_corrections(df, [Correction(kind="missing_codes", column="Code",
                                                      values=[999])])
    assert base["Code"].tolist()[0] == "007" and journal[-1]["n"] == 1
