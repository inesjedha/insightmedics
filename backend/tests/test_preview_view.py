"""Aperçu gratuit en mots simples (pipeline/preview_view.py) : constats prouvés, sans nom ni
numéro de dossier, sans double comptage, contrôles faits et réservés."""

import json

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.pipeline.preview_view import preview_view
from app.pipeline.runner import run_preview


def _base(n: int = 60) -> pd.DataFrame:
    rng = np.random.default_rng(3)
    df = pd.DataFrame({
        "Num_dossier": [f"D{1000 + i}" for i in range(n)],
        "Nom": [f"Patient{i}" for i in range(n)],
        "Age": rng.integers(20, 80, n).astype(float),
        "Date_entree": pd.to_datetime("2023-01-01") + pd.to_timedelta(rng.integers(0, 300, n), "D"),
        "FEVG": rng.integers(25, 70, n).astype(float),
        "Remarques": [np.nan] * n,
    })
    df.loc[[2, 9, 17, 30], "Age"] = 999
    df.loc[[4, 5], "Date_entree"] = pd.Timestamp("2031-05-02")
    df.loc[range(0, 60, 4), "FEVG"] = np.nan
    df.loc[7, "Num_dossier"] = df.loc[8, "Num_dossier"]
    return df


@pytest.fixture()
def view(tmp_path):
    path = tmp_path / "these.xlsx"
    _base().to_excel(path, index=False)
    r = run_preview(path, "these.xlsx")
    return preview_view(r["profiling"], r["score_detail"])


def _by_key(view):
    return {f["key"]: f for f in view["findings"]}


def test_code_999_prouve_par_la_moyenne_et_pas_recompte_en_valeur_extreme(view):
    f = _by_key(view)
    code = f["missing_codes"]
    assert code["light"] == "rouge" and code["count"] == 4
    assert "la valeur « 999 » revient 4 fois" in code["proof"]
    assert code["title"] == "Un code comme « 999 » utilisé à la place d'une case vide"
    assert "fait passer la moyenne de" in code["proof"]
    assert "extremes" not in f                              # même problème, compté une fois


def test_une_colonne_de_dates_n_est_pas_une_donnee_identifiante(view):
    pii = _by_key(view)["pii"]
    assert "Nom" in pii["proof"] and "Date_entree" not in pii["proof"]


def test_aucun_numero_de_dossier_ni_nom_dans_l_apercu(view):
    text = json.dumps(view, ensure_ascii=False)
    assert "D1007" not in text and "D1008" not in text and "Patient1" not in text


def test_constats_tries_et_verdict_rouge(view):
    lights = [f["light"] for f in view["findings"]]
    assert lights == sorted(lights, key=["rouge", "orange", "gris"].index)
    assert view["verdict"]["light"] == "rouge"
    assert _by_key(view)["dates"]["proof"].endswith("(jusqu'en 2031).")
    assert view["to_check"] == sum(f["count"] for f in view["findings"])


def test_cases_vides_accord_et_colonnes_vides(view):
    f = _by_key(view)
    assert "FEVG" in f["missing"]["title"] and "lignes sur 60 ont toutes leurs cases" in f["missing"]["proof"]
    assert f["dead_columns"]["light"] == "gris" and "Remarques" in f["dead_columns"]["proof"]


def test_controles_faits_et_reserves_sans_note_par_domaine(view):
    c = view["checks"]
    assert c["n_done"] > 0 and c["n_reserved"] > 0
    assert {r["name"] for r in c["reserved"]} >= {"Un critère principal mesurable"}
    assert "done" not in c


def test_base_propre_sans_probleme_mais_note_moyenne(tmp_path):
    rng = np.random.default_rng(1)
    df = pd.DataFrame({"id": range(1, 41), "Age": rng.integers(20, 60, 40),
                       "Sexe": rng.choice([1, 2], 40), "Poids": rng.integers(50, 90, 40)})
    path = tmp_path / "propre.csv"
    df.to_csv(path, index=False)
    r = run_preview(path, "propre.csv")
    v = preview_view(r["profiling"], r["score_detail"])
    # Une base propre sans dictionnaire plafonne vers 60 : pas de « bon état » à côté.
    assert v["findings"] == [] and v["score"] < 70
    assert v["verdict"]["light"] == "orange" and "note reste moyenne" in v["verdict"]["text"]


def test_endpoint_public_apercu(tmp_path):
    path = tmp_path / "these.csv"
    _base().to_csv(path, index=False)
    client = TestClient(app)
    with path.open("rb") as fh:
        up = client.post("/audit/upload", files={"file": ("these.csv", fh, "text/csv")})
    assert up.status_code == 200
    r = client.get(f"/audit/{up.json()['id']}/preview")
    assert r.status_code == 200 and r.json()["verdict"]["light"] == "rouge"
    assert client.get("/audit/inconnu/preview").status_code == 404


def test_copies_prouvees_par_la_ressemblance(tmp_path):
    rng = np.random.default_rng(11)
    n = 90
    data = {"N_inclusion": np.arange(1, n + 1)}
    for i in range(34):
        data[f"V{i:02d}"] = rng.integers(0, 4, n).astype(float)
    df = pd.DataFrame(data)
    df.iloc[60:70, 1:] = df.iloc[10:20, 1:].values          # bloc recopié, autres numéros
    path = tmp_path / "copies.csv"
    df.to_csv(path, index=False)
    r = run_preview(path, "copies.csv")
    f = _by_key(preview_view(r["profiling"], r["score_detail"]))["copies"]
    assert f["count"] == 10 and f["light"] == "rouge"
    assert "de cases identiques ; deux patients pris au hasard" in f["proof"]


def test_code_texte_et_colonne_oui_non_sans_moyenne():
    from app.pipeline.preview_view import _value_findings

    p = {"columns": [{"name": "Tabac", "suspected_missing_codes": ["na"], "flags": [],
                      "stat_type_guess": "binary", "missing_code_impact": {"n": 5, "by_code": {"na": 5},
                                                                        "mean_with": 2.0, "mean_without": 0.4}}],
         "dates_audit": []}
    [f], _ = _value_findings(p)
    assert "« NA »" in f["title"] and "revient 5 fois" in f["proof"]
    assert "moyenne" not in f["proof"]                       # pas de moyenne d'une colonne oui/non


def test_apercu_public_copies_en_numeros_de_ligne(tmp_path):
    rng = np.random.default_rng(11)
    data = {"N_inclusion": np.arange(101, 191)}
    for i in range(34):
        data[f"V{i:02d}"] = rng.integers(0, 4, 90).astype(float)
    df = pd.DataFrame(data)
    df.iloc[60:70, 1:] = df.iloc[10:20, 1:].values
    path = tmp_path / "copies.csv"
    df.to_csv(path, index=False)
    client = TestClient(app)
    with path.open("rb") as fh:
        up = client.post("/audit/upload", files={"file": ("copies.csv", fh, "text/csv")}).json()
    block = up["copies"]["blocks"][0]
    assert block["by"] == "ligne" and block["source"][0] < 100   # pas les n° d'inclusion 111…
