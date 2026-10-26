"""Tests des règles intégrées Glasgow ↔ IGS II / APACHE II — sans appel API."""

import pandas as pd

from app.pipeline.builtin_rules import severity_score_rules
from app.pipeline.rules_engine import execute_rules

# Glasgow, IGS II, APACHE II : la ligne 2 (P2) viole les deux règles (Glasgow 3 → IGS II
# au moins 26 et APACHE II au moins 12) ; P3 seulement l'APACHE II (Glasgow 7 → au
# moins 8) ; P1 et P4 sont cohérents.
DF = pd.DataFrame({
    "id": ["P1", "P2", "P3", "P4"],
    "GSG": [15, 3, 7, 12],
    "SAPSII": [10, 18, 30, 40],
    "APACHEII": [5, 10, 6, 9],
})
COLUMNS = [{"name": c, "spss_label": None} for c in DF.columns]
DICO = [{"name": "GSG", "meaning": "Score de Glasgow (somme yeux + verbal + moteur)"},
        {"name": "SAPSII", "meaning": "IGS II"},
        {"name": "APACHEII", "meaning": "Score APACHE II"}]


def _run(rules):
    res = execute_rules(rules, DF, DF["id"])
    return {r["rule_id"]: r for r in res["results"]}


def test_glasgow_trouve_par_la_signification_du_dictionnaire():
    rules = severity_score_rules(DF, COLUMNS, DICO)
    assert [r["id"] for r in rules] == ["RB-IGS2-GCS", "RB-APACHE2-GCS"]
    assert all(r["severity"] == "major" and r["category"] == "clinical" for r in rules)


def test_violations_igs2_et_apache2():
    out = _run(severity_score_rules(DF, COLUMNS, DICO))
    assert out["RB-IGS2-GCS"]["row_ids"] == ["P2"]
    assert out["RB-APACHE2-GCS"]["row_ids"] == ["P2", "P3"]
    assert out["RB-IGS2-GCS"]["n_tested"] == 4


def test_seuils_exacts_de_l_igs2():
    """Points du Glasgow dans l'IGS II : 26 (< 6), 13 (6-8), 7 (9-10), 5 (11-13), 0."""
    df = pd.DataFrame({"id": list("ABCDEFGH"),
                       "gcs": [5, 5, 8, 8, 10, 10, 13, 15],
                       "igs2": [26, 25, 13, 12, 7, 6, 4, 0]})
    rules = severity_score_rules(df, [{"name": "gcs", "spss_label": None},
                                      {"name": "igs2", "spss_label": None}], [])
    res = execute_rules(rules, df, df["id"])["results"][0]
    assert res["row_ids"] == ["B", "D", "F", "G"]


def test_par_le_nom_ou_le_libelle_sans_dictionnaire():
    df = DF.rename(columns={"GSG": "glasgow_adm"})
    cols = [{"name": "glasgow_adm", "spss_label": None},
            {"name": "SAPSII", "spss_label": "IGS II"}, {"name": "APACHEII", "spss_label": None}]
    assert len(severity_score_rules(df, cols, [])) == 2


def test_composante_du_glasgow_ignoree():
    df = pd.DataFrame({"gcs_moteur": [6, 5, 1], "igs_ii": [10, 20, 30]})
    cols = [{"name": c, "spss_label": None} for c in df.columns]
    assert severity_score_rules(df, cols, []) == []


def test_aucune_regle_sans_glasgow_ou_hors_bornes():
    assert severity_score_rules(DF, COLUMNS, []) == []    # « GSG » seul n'est pas reconnu
    df = DF.assign(GSG=[150, 30, 70, 120])                # pas un Glasgow (3-15)
    assert severity_score_rules(df, COLUMNS, DICO) == []
