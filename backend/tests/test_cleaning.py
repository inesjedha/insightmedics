"""Tests du moteur de nettoyage M8 — 100 % déterministe, sans API.

On vérifie les garanties non négociables : original inchangé, anonymisation (id direct +
PII retirés, id_anonyme + ligne_source ajoutés), colonnes vides exclues, valeurs extrêmes
mises à manquant dans une colonne _analyse (jamais écrasées), et journal traçable.
"""

import numpy as np
import pandas as pd

from app.pipeline.cleaning import clean, to_csv_bytes


def _df():
    return pd.DataFrame({
        "matricule": [f"H{i}" for i in range(1, 11)],
        "nom": ["X"] * 10,                       # PII
        "age": [34, 41, 999, 28, 52, 60, 47, 39, 45, 50],  # 999 = code manquant
        "poids": [70, 80, 75, 90, 200, 68, 72, 85, 60, 300],  # 200/300 extrêmes possibles
        "taille": [170, 175, 180, 165, 172, 168, 178, 160, 169, 174],
        "vide": [np.nan] * 10,                   # colonne entièrement vide
    })


def _profiling():
    return {
        "file": {"file_name": "amine.sav", "format": "sav"},
        "structure": {
            "n_rows": 10, "n_cols": 6, "n_unique_ids": 10, "id_column": "matricule",
            "empty_columns": ["vide"], "constant_columns": ["nom"],
            "duplicates": {"exact_rows": 0},
        },
        "missing_summary": {"pct_global": 5.0, "complete_cases": 8},
        "columns": [],
        "pii_candidates": [{"column": "nom", "kinds": ["name"], "n_values": 10}],
    }


def _ai():
    return {
        "derived_variables": [
            {"name": "imc", "formula": "poids / (taille / 100) ** 2",
             "sources": ["poids", "taille"]},
        ],
        "assessment": {
            "cleaning_plan": [
                {"op_id": "op1", "operation": "recode_missing", "column": "age",
                 "params": {"codes": [999]}, "rationale_fr": "999 = manquant",
                 "auto_safe": True},
                {"op_id": "op2", "operation": "remove_outliers", "column": "poids",
                 "params": {}, "rationale_fr": "poids aberrants", "auto_safe": False},
            ],
        },
    }


def test_original_inchange():
    df = _df()
    snap = df.copy()
    clean(df, _profiling(), _ai(), approved_op_ids={"op2"})
    pd.testing.assert_frame_equal(df, snap)  # aucune mutation de l'original


def test_anonymisation_et_tracabilite():
    res = clean(_df(), _profiling(), _ai())
    src = res["source_anonymisee"]
    assert "id_anonyme" in src.columns and "ligne_source" in src.columns
    assert src["id_anonyme"].iloc[0] == "P001"
    assert "matricule" not in src.columns  # identifiant direct retiré
    assert "nom" not in src.columns        # PII retirée
    assert list(src["ligne_source"]) == list(range(1, 11))


def test_base_analyse_exclut_vide_et_recode_manquant():
    res = clean(_df(), _profiling(), _ai())
    base = res["base_analyse"]
    assert "vide" not in base.columns          # colonne vide exclue
    assert base["age"].isna().sum() == 1       # 999 recodé en manquant
    assert 999 not in base["age"].values


def test_outliers_non_destructifs_colonne_analyse():
    res = clean(_df(), _profiling(), _ai(), approved_op_ids={"op2"})
    base = res["base_analyse"]
    assert "poids_analyse" in base.columns
    assert base["poids"].notna().all()         # original conservé intact
    assert base["poids_analyse"].isna().sum() >= 1  # extrême(s) mis à manquant


def test_outliers_ignores_si_non_valides():
    res = clean(_df(), _profiling(), _ai(), approved_op_ids=set())
    assert "poids_analyse" not in res["base_analyse"].columns  # non validé → ignoré


def test_variable_derivee_calculee():
    res = clean(_df(), _profiling(), _ai())
    base = res["base_analyse"]
    assert "imc" in base.columns
    assert abs(base["imc"].iloc[0] - 70 / (170 / 100) ** 2) < 1e-6


def test_journal_non_vide_et_structure():
    res = clean(_df(), _profiling(), _ai(), approved_op_ids={"op2"})
    j = res["journal"]
    assert len(j) >= 4
    assert all({"id_correction", "variable", "raison"} <= set(e) for e in j)
    assert j[0]["id_correction"] == "C001"


def test_export_csv():
    res = clean(_df(), _profiling(), _ai())
    data = to_csv_bytes(res["base_analyse"])
    assert isinstance(data, bytes) and b"id_anonyme" in data


def test_operations_de_nettoyage_enum():
    """Exerce les opérations de l'enum : trim, cast, rename, standardize, recode."""
    df = pd.DataFrame({
        "matricule": ["H1", "H2", "H3"],
        "sexe": [" M ", "F ", " M"],          # trim_whitespace
        "age_txt": ["30", "40", "50"],        # cast_type → float
        "ancien": [1, 2, 3],                  # rename_column
        "grp": ["a", "b", "a"],               # standardize_categories puis recode_value
    })
    prof = {
        "structure": {"id_column": "matricule", "empty_columns": [], "constant_columns": [],
                      "duplicates": {"exact_rows": 0}},
        "pii_candidates": [],
    }
    ai = {"assessment": {"cleaning_plan": [
        {"op_id": "o1", "operation": "trim_whitespace", "column": "sexe",
         "params": {}, "rationale_fr": "", "auto_safe": True},
        {"op_id": "o2", "operation": "cast_type", "column": "age_txt",
         "params": {"type": "float"}, "rationale_fr": "", "auto_safe": True},
        {"op_id": "o3", "operation": "rename_column", "column": "ancien",
         "params": {"new_name": "nouveau"}, "rationale_fr": "", "auto_safe": True},
        {"op_id": "o4", "operation": "standardize_categories", "column": "grp",
         "params": {"mapping": {"a": "A", "b": "B"}}, "rationale_fr": "", "auto_safe": True},
        {"op_id": "o5", "operation": "recode_value", "column": "grp",
         "params": {"before": "A", "after": "Alpha"}, "rationale_fr": "", "auto_safe": False},
    ]}}
    base = clean(df, prof, ai, approved_op_ids={"o5"})["base_analyse"]
    assert base["sexe"].tolist() == ["M", "F", "M"]                 # trim
    assert base["age_txt"].dtype.kind in ("i", "f")                 # cast → numérique
    assert "nouveau" in base.columns and "ancien" not in base.columns  # rename
    assert set(base["grp"]) == {"Alpha", "B"}                       # standardize + recode


def test_operation_sensible_non_validee_est_ignoree():
    """Une opération non auto_safe sans validation n'est pas appliquée."""
    df = pd.DataFrame({"matricule": ["H1", "H2"], "grp": ["a", "b"]})
    prof = {"structure": {"id_column": "matricule", "empty_columns": [], "constant_columns": [],
                          "duplicates": {"exact_rows": 0}}, "pii_candidates": []}
    ai = {"assessment": {"cleaning_plan": [
        {"op_id": "x", "operation": "recode_value", "column": "grp",
         "params": {"before": "a", "after": "Z"}, "rationale_fr": "", "auto_safe": False},
    ]}}
    base = clean(df, prof, ai, approved_op_ids=set())["base_analyse"]
    assert base["grp"].tolist() == ["a", "b"]  # inchangé, car non validé


def test_variables_analyse_facon_hamza():
    """Reproduit les 3 types de variables dérivées d'analyse de Hamza :
    recodage binaire (deces_binaire), % de perte (perte_*_pct), somme (duree_somme)."""
    df = pd.DataFrame({
        "matricule": [f"H{i}" for i in range(1, 6)],
        "deces": [0, 1, 0, 1, np.nan],
        "eqd_j1": [100, 80, 90, 120, 110],
        "eqd_j3": [90, 60, 90, 90, 88],
        "vm_a": [2, 1, 0, 3, 1],
        "vm_b": [1, 2, 1, 0, 2],
    })
    prof = {
        "file": {"file_name": "t.sav", "format": "sav"},
        "structure": {"n_rows": 5, "n_cols": 6, "n_unique_ids": 5, "id_column": "matricule",
                      "empty_columns": [], "constant_columns": [], "duplicates": {"exact_rows": 0}},
        "missing_summary": {"pct_global": 0.0, "complete_cases": 4},
        "columns": [], "pii_candidates": [],
    }
    ai = {"derived_analysis_variables": [
        {"name": "deces_binaire", "kind": "binary_recode", "source": "deces",
         "positive_values": [1]},
        {"name": "perte_EQD_J1_J3_pct", "kind": "pct_change", "baseline": "eqd_j1",
         "follow_up": "eqd_j3"},
        {"name": "duree_vm_somme", "kind": "row_sum", "sources": ["vm_a", "vm_b"]},
    ]}
    base = clean(df, prof, ai)["base_analyse"]
    assert base["deces_binaire"].tolist()[:2] == [0, 1]
    assert pd.isna(base["deces_binaire"].iloc[4])           # manquant conservé
    assert abs(base["perte_EQD_J1_J3_pct"].iloc[0] - (-10.0)) < 1e-6  # (90-100)/100*100
    assert base["duree_vm_somme"].iloc[0] == 3              # 2 + 1
