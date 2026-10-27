"""Tests des contrôles de doublons avancés du profiling (phase 2 du prompt d'audit v2).

Même identifiant pour deux profils, lignes identiques sauf l'identifiant, blocs recopiés,
identifiants différents pour un même profil, lignes vides. Déterministe, sans API.
"""

import numpy as np
import pandas as pd
import pytest

from app.pipeline.profile import profile
from app.pipeline.score_engine import compute_score

N = 12


def _base() -> pd.DataFrame:
    """Base saine : identifiants uniques, profils tous distincts."""
    return pd.DataFrame({
        "num_patient": [f"P{i}" for i in range(N)],
        "sexe": ["H", "F"] * (N // 2),
        "age": [30.0 + 3 * i for i in range(N)],
        "date_naissance": pd.date_range("1960-01-01", periods=N, freq="97D"),
        "date_admission": pd.date_range("2024-01-01", periods=N, freq="11D"),
        "gcs": [3.0 + i for i in range(N)],
        "sofa": [float(i) for i in range(N)],
    })


def _dups(df: pd.DataFrame) -> dict:
    return profile(df, {"file_name": "t.csv", "format": "csv"})["structure"]["duplicates"]


def _copy_row(df: pd.DataFrame, src: int, dst: int) -> None:
    """Recopie toutes les valeurs de `src` dans `dst`, sauf l'identifiant."""
    cols = [c for c in df.columns if c != "num_patient"]
    df.loc[dst, cols] = df.loc[src, cols].to_numpy()


def test_base_saine_rien_a_signaler():
    d = _dups(_base())
    assert d["id_conflicts"]["n_ids"] == 0
    assert d["same_id_identical_rows"] == 0
    assert d["identical_except_id"]["n_groups"] == 0
    assert d["copied_blocks"] == []
    assert d["same_profile_different_ids"]["n_groups"] == 0


def test_meme_identifiant_profils_differents():
    df = _base()
    df.loc[3, "num_patient"] = "P1"
    d = _dups(df)
    assert d["duplicate_ids"] == 1
    assert d["id_conflicts"]["n_ids"] == 1
    ex = d["id_conflicts"]["examples"][0]
    assert ex["id"] == "P1" and ex["n_rows"] == 2
    assert {"age", "date_naissance"} <= set(ex["differing_columns"])


def test_meme_identifiant_lignes_identiques_nest_pas_un_conflit():
    df = pd.concat([_base(), _base().iloc[[2]]], ignore_index=True)
    d = _dups(df)
    assert d["exact_rows"] == 1
    assert d["id_conflicts"]["n_ids"] == 0
    assert d["same_id_identical_rows"] == 1


def test_lignes_identiques_sauf_identifiant():
    df = _base()
    _copy_row(df, 4, 5)
    d = _dups(df)
    assert d["identical_except_id"]["n_groups"] == 1
    assert d["identical_except_id"]["examples"][0]["row_ids"] == ["P4", "P5"]
    # déjà signalé comme copie : pas compté une seconde fois comme doublon possible
    assert d["same_profile_different_ids"]["n_groups"] == 0


def test_bloc_de_lignes_recopie():
    df = _base()
    _copy_row(df, 0, 8)
    _copy_row(df, 1, 9)
    _copy_row(df, 2, 10)
    blocks = _dups(df)["copied_blocks"]
    assert blocks == [{"length": 3, "source_lines": [1, 3], "copy_lines": [9, 11],
                       "min_similarity": 1.0}]


def test_une_seule_ligne_recopiee_nest_pas_un_bloc():
    df = _base()
    _copy_row(df, 0, 8)
    assert _dups(df)["copied_blocks"] == []


def test_lignes_presque_vides_ne_passent_pas_pour_des_copies():
    df = _base()
    sparse = pd.DataFrame({"num_patient": ["X1", "X2"], "sexe": ["H", "H"]})
    d = _dups(pd.concat([df, sparse], ignore_index=True))
    assert d["identical_except_id"]["n_groups"] == 0


def test_identifiants_differents_meme_naissance_sexe_et_dates():
    df = _base()
    cols = ["sexe", "date_naissance", "date_admission"]
    df.loc[11, cols] = df.loc[10, cols].to_numpy()
    same = _dups(df)["same_profile_different_ids"]
    assert same["key_columns"] == ["date_naissance", "sexe", "date_admission"]
    assert same["n_groups"] == 1
    assert same["examples"][0]["row_ids"] == ["P10", "P11"]


def test_doublon_possible_non_evaluable_sans_date_de_naissance():
    df = _base().drop(columns=["date_naissance"])  # une seule date restante
    same = _dups(df)["same_profile_different_ids"]
    assert same["key_columns"] == [] and same["n_groups"] == 0


def test_lignes_vides_comptees_avec_leur_numero():
    df = pd.concat([_base(), pd.DataFrame({"num_patient": ["P98", "P99"]})], ignore_index=True)
    s = profile(df, {"file_name": "t.csv", "format": "csv"})["structure"]
    assert s["empty_rows"] == {"n": 2, "lines": [N + 1, N + 2]}


def _wide(n_rows: int = 40, n_cols: int = 35) -> pd.DataFrame:
    """Base large (≥ 30 variables) aux lignes toutes différentes."""
    rng = np.random.default_rng(42)
    data = {f"v{j}": rng.integers(0, 50, n_rows) for j in range(n_cols)}
    return pd.DataFrame({"num_patient": [f"P{i}" for i in range(n_rows)], **data})


def _near_copy(df: pd.DataFrame, src: int, dst: int, n_changed: int) -> None:
    """Recopie `src` dans `dst` (hors identifiant) puis modifie `n_changed` variables."""
    _copy_row(df, src, dst)
    for j in range(n_changed):
        df.loc[dst, f"v{j}"] = 1000 + j


def test_lignes_quasi_identiques_signalees_avec_la_ressemblance_ordinaire():
    df = _wide()
    _near_copy(df, 3, 30, n_changed=2)        # 33/35 = 94 %
    near = _dups(df)["near_identical_rows"]
    assert near["evaluated"] and near["n_pairs"] == 1
    ex = near["examples"][0]
    assert ex["row_ids"] == ["P3", "P30"] and ex["lines"] == [4, 31]
    assert ex["similarity"] == pytest.approx(33 / 35, abs=1e-3) and ex["n_compared"] == 35
    assert near["median_similarity"] < 0.2      # deux lignes au hasard se ressemblent peu


def test_ressemblance_sous_le_seuil_non_signalee():
    df = _wide()
    _near_copy(df, 3, 30, n_changed=6)        # 29/35 = 83 %
    assert _dups(df)["near_identical_rows"]["n_pairs"] == 0


def test_bloc_de_lignes_quasi_recopie():
    """Cas Amine : des lignes consécutives reproduisent un bloc plus haut à 90-97 %."""
    df = _wide()
    for k in range(4):
        _near_copy(df, 10 + k, 30 + k, n_changed=1)
    d = _dups(df)
    assert d["copied_blocks"][0]["length"] == 4
    assert d["copied_blocks"][0]["source_lines"] == [11, 14]
    assert d["copied_blocks"][0]["copy_lines"] == [31, 34]
    assert d["copied_blocks"][0]["min_similarity"] == pytest.approx(34 / 35, abs=1e-3)
    assert d["n_suspect_copy_rows"] == 4


def test_quasi_identiques_non_evalue_sous_30_variables():
    near = _dups(_base())["near_identical_rows"]
    assert near["evaluated"] is False and near["n_pairs"] == 0


def test_copie_exacte_pas_comptee_deux_fois():
    df = _wide()
    _copy_row(df, 3, 30)
    d = _dups(df)
    assert d["identical_except_id"]["n_groups"] == 1
    assert d["near_identical_rows"]["n_pairs"] == 0
    assert d["n_suspect_copy_rows"] == 1


def _without_new_fields(p: dict) -> dict:
    dups = p["structure"]["duplicates"]
    return {**p, "structure": {**p["structure"], "empty_rows": None,
                               "duplicates": {k: dups[k] for k in
                                              ("exact_rows", "duplicate_ids", "example_row_ids")}}}


@pytest.mark.parametrize("mutate", ["conflict", "same_profile"])
def test_conflits_et_doublons_possibles_ne_changent_pas_le_score(mutate):
    """Un doublon seulement possible (à vérifier au dossier) n'enlève pas de points ;
    un identifiant répété était déjà compté avant ces contrôles."""
    df = _base()
    if mutate == "conflict":
        df.loc[3, "num_patient"] = "P1"
    else:
        cols = ["sexe", "date_naissance", "date_admission"]
        df.loc[11, cols] = df.loc[10, cols].to_numpy()
    p = profile(df, {"file_name": "t.csv", "format": "csv"})
    assert compute_score(p)["score_final"] == compute_score(_without_new_fields(p))["score_final"]


def test_lignes_recopiees_font_perdre_des_points():
    df = _wide()
    for k in range(4):
        _near_copy(df, 10 + k, 30 + k, n_changed=1)
    p = profile(df, {"file_name": "t.csv", "format": "csv"})
    assert compute_score(p)["score_final"] < compute_score(_without_new_fields(p))["score_final"]


def test_ligne_modele_de_la_fiche_detectee():
    """Cas réel du 27/10/2026 : la 1re ligne est la fiche vierge (« ☐ »), comptée comme un
    patient."""
    template = pd.DataFrame([{"num_patient": "☐", "sexe": "☐ M ☐ F", "age": "☐",
                              "mecanisme": "☐ AVP ☐ Chute ☐ Autre : ______"}])
    df = pd.concat([template, _base().astype(object)], ignore_index=True)
    s = profile(df, {"file_name": "t.xlsx", "format": "xlsx"})["structure"]
    assert s["template_rows"] == {"n": 1, "lines": [1]}


def test_texte_avec_un_seul_soulignement_pas_une_ligne_modele():
    df = _base().astype(object)
    df.loc[2, "sexe"] = "F ____ à préciser"
    assert profile(df, {"file_name": "t.csv", "format": "csv"})["structure"]["template_rows"]["n"] == 0
