"""Tests des contrôles de doublons avancés du profiling (phase 2 du prompt d'audit v2).

Même identifiant pour deux profils, lignes identiques sauf l'identifiant, blocs recopiés,
identifiants différents pour un même profil, lignes vides. Déterministe, sans API.
"""

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
    assert blocks == [{"length": 3, "source_lines": [1, 3], "copy_lines": [9, 11]}]


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


@pytest.mark.parametrize("mutate", ["conflict", "copy", "block"])
def test_les_nouveaux_controles_ne_changent_pas_le_score(mutate):
    """Les nouveaux champs informent le registre et le client ; la grille de score
    calibrée sur les audits de Hamza n'en dépend pas."""
    df = _base()
    if mutate == "conflict":
        df.loc[3, "num_patient"] = "P1"
    elif mutate == "copy":
        _copy_row(df, 4, 5)
    else:
        _copy_row(df, 0, 8)
        _copy_row(df, 1, 9)
    p = profile(df, {"file_name": "t.csv", "format": "csv"})
    stripped = {**p, "structure": {**p["structure"], "empty_rows": None,
                                   "duplicates": {k: p["structure"]["duplicates"][k]
                                                  for k in ("exact_rows", "duplicate_ids",
                                                            "example_row_ids")}}}
    assert compute_score(p)["score_final"] == compute_score(stripped)["score_final"]
