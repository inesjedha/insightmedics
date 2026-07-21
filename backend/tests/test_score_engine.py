"""Tests du moteur de score M3 : conformité à la grille de Hamza (§32)."""

import copy

from app.pipeline.score_engine import compute_score

# Profiling minimal d'une base saine (structure conforme au schéma du pipeline)
CLEAN = {
    "structure": {
        "n_rows": 100, "n_cols": 10, "id_column": "matricule",
        "n_unique_ids": 100,
        "duplicates": {"exact_rows": 0, "duplicate_ids": 0},
        "empty_columns": [], "constant_columns": [],
        "near_constant_columns": [], "duplicated_columns": [],
    },
    "columns": [
        {"name": "matricule", "spss_label": "Identifiant", "value_labels": None,
         "pct_missing": 0.0, "n_missing": 0, "flags": [],
         "suspected_missing_codes": [], "numeric_stats": None, "categories": None},
        {"name": "age", "spss_label": "Âge", "value_labels": None,
         "pct_missing": 1.0, "n_missing": 1, "flags": [],
         "suspected_missing_codes": [], "numeric_stats": {"mean": 50}, "categories": None},
        {"name": "sexe", "spss_label": "Sexe", "value_labels": {"1": "H", "2": "F"},
         "pct_missing": 0.0, "n_missing": 0, "flags": [],
         "suspected_missing_codes": [], "numeric_stats": None,
         "categories": [{"value": "1", "n": 50, "pct": 50}]},
    ],
    "missing_summary": {"pct_global": 1.0, "complete_cases": 95,
                        "missing_blocks": [], "declared_missing_in_file": True},
    "dates_audit": [],
    "pii_candidates": [],
}

FULL_SI = {
    "statistical_unit_clear": True, "structure_fits_study": True,
    "primary_endpoint_status": "exploitable", "primary_endpoint_missing_pct": 0.0,
    "primary_objective_vars_available": "complet",
    "secondary_objectives_vars_available": "complet",
    "inclusion_criteria_verifiable": True, "groups_reconstructible": "oui",
    "derived_vars_reliability": "fiable",
    "planned_analyses_feasibility": "adaptees",
    "differential_missing": False, "units_consistent": True,
    "adjustment_vars_available": True, "temporality_ok": True, "codings_ok": True,
    "documentation_level": {"dictionnaire": True, "regles_codage": True,
                            "provenance": True, "derivees_documentees": True},
    "rule_violations": {"violation_rate": 0, "n_major": 0,
                        "synthetic_rate": 0, "totals_rate": 0},
}


def test_structure_de_la_grille():
    r = compute_score(CLEAN)
    assert [d["max"] for d in r["domaines"]] == [15, 20, 15, 15, 15, 10, 5, 5]
    assert sum(d["max"] for d in r["domaines"]) == 100
    assert 0 <= r["score_final"] <= 100


def test_base_saine_avec_jugements_complets_score_eleve():
    r = compute_score(CLEAN, FULL_SI)
    assert r["score_final"] >= 90, r
    assert r["niveau_qualite"] == "Excellente"
    assert r["confiance"]["niveau"] == "élevée"
    assert not r["plafonds_appliques"]


def test_sans_jugements_ia_confiance_faible_et_criteres_partiels():
    r = compute_score(CLEAN)
    assert r["confiance"]["niveau"] == "faible"
    assert r["criteres_inevaluables"] > 0
    # Sans audit IA, le score doit rester strictement sous celui de la base validée
    assert r["score_final"] < compute_score(CLEAN, FULL_SI)["score_final"]


def test_plafond_critere_principal_absent():
    si = {**FULL_SI, "primary_endpoint_status": "non_exploitable"}
    r = compute_score(CLEAN, si)
    assert r["score_final"] <= 49
    assert any("Critère principal" in c["defaut"] for c in r["plafonds_appliques"])


def test_plafond_identifiant_absent_seulement_si_lignes_indistinctes():
    # Pas d'ID mais lignes toutes distinctes : patients individualisables → PAS de plafond
    p = copy.deepcopy(CLEAN)
    p["structure"]["id_column"] = None
    r = compute_score(p, FULL_SI)
    assert r["score_final"] > 49, "sans doublon, l'absence d'ID ne doit pas plafonner (cas Syrine)"
    # Pas d'ID ET des lignes dupliquées : patients non individualisables → plafond 49
    p["structure"]["duplicates"]["exact_rows"] = 3
    r2 = compute_score(p, FULL_SI)
    assert r2["score_final"] <= 49


def test_plafond_manquants_critere_principal():
    si = {**FULL_SI, "primary_endpoint_missing_pct": 45.0}
    r = compute_score(CLEAN, si)
    assert r["score_final"] <= 59


def test_bareme_completude_globale():
    """Les tranches exactes du §32.3 (via le sous-score du domaine 2)."""
    for pct_missing, expected in [(1.0, 6), (4.0, 5), (8.0, 4), (13.0, 3),
                                  (20.0, 2), (30.0, 1), (45.0, 0)]:
        p = copy.deepcopy(CLEAN)
        p["missing_summary"]["pct_global"] = pct_missing
        r = compute_score(p, FULL_SI)
        d2 = next(d for d in r["domaines"] if d["domaine"] == 2)
        crit = next(c for c in d2["criteres"] if c["critere"] == "Complétude globale")
        assert crit["obtenu"] == expected, f"{pct_missing}% manquants → {crit['obtenu']}"


def test_doublons_ids_massifs_plafonnent():
    p = copy.deepcopy(CLEAN)
    p["structure"]["duplicates"]["duplicate_ids"] = 20  # 20% des 100 lignes
    p["structure"]["n_unique_ids"] = 80
    r = compute_score(p, FULL_SI)
    assert r["score_final"] <= 59


def test_determinisme():
    assert compute_score(CLEAN, FULL_SI) == compute_score(CLEAN, FULL_SI)


def test_plafond_critere_principal_non_operationnel():
    """Hamza : CJP identifié mais non opérationnalisé → plafond 49 (3 bases /4)."""
    si = {**FULL_SI, "primary_endpoint_operationally_defined": False}
    r = compute_score(CLEAN, si)
    assert r["score_final"] <= 49
    assert any("non défini opérationnellement" in c["defaut"] for c in r["plafonds_appliques"])


def test_pas_de_plafond_si_critere_operationnel():
    si = {**FULL_SI, "primary_endpoint_operationally_defined": True}
    r = compute_score(CLEAN, si)
    assert r["score_final"] > 49


def test_verdict_niveau_4_plafonne_a_49():
    """Filet de cohérence : un verdict IA « non exploitable » (4) plafonne le score à 49,
    même si les autres jugements sont bons (cas Eya)."""
    si = copy.deepcopy(FULL_SI)
    si["global_verdict_level"] = 4
    r = compute_score(CLEAN, si)
    assert r["score_final"] <= 49
    assert any("verdict" in c["defaut"].lower() for c in r["plafonds_appliques"])


def test_verdict_niveau_5_plafonne_a_20():
    si = copy.deepcopy(FULL_SI)
    si["global_verdict_level"] = 5
    r = compute_score(CLEAN, si)
    assert r["score_final"] <= 20


def test_verdict_niveau_3_ne_plafonne_pas_seul():
    """Niveau 3 ne déclenche PAS le filet verdict (le plafond vient alors de l'état du
    critère principal, pas du niveau de verdict)."""
    si = copy.deepcopy(FULL_SI)
    si["global_verdict_level"] = 3
    r = compute_score(CLEAN, si)
    assert not any("verdict IA" in c["defaut"] for c in r["plafonds_appliques"])
