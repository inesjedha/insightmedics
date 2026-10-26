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
    si = {**FULL_SI, "primary_endpoint_status": "absent"}
    r = compute_score(CLEAN, si)
    assert r["score_final"] <= 49
    assert any("Critère principal" in c["defaut"] for c in r["plafonds_appliques"])


def test_critere_non_exploitable_mais_present_ne_plafonne_pas_a_49():
    """Grille v2.1 : le 49 est réservé au critère totalement absent."""
    si = {**FULL_SI, "primary_endpoint_status": "non_exploitable"}
    r = compute_score(CLEAN, si)
    assert not any(c["plafond"] == 49 for c in r["plafonds_detectes"])
    assert r["score_final"] < compute_score(CLEAN, FULL_SI)["score_final"]


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


def _crit(r, domain, label_start):
    d = next(d for d in r["domaines"] if d["domaine"] == domain)
    return next(c for c in d["criteres"] if c["critere"].startswith(label_start))


def test_critere_non_operationnel_perd_des_points_sans_plafond():
    """Hamza (26/10/2026) : critère présent mais non défini opérationnellement → pas de
    plafond à 49 ; 1/4 au domaine 5, 1/3 au domaine 6, confiance faible."""
    si = {**FULL_SI, "primary_endpoint_operationally_defined": False}
    r = compute_score(CLEAN, si)
    assert not r["plafonds_detectes"]
    assert _crit(r, 5, "Critère principal")["obtenu"] == 1
    assert _crit(r, 6, "Critère principal")["obtenu"] == 1
    assert r["confiance"]["niveau"] == "faible"
    assert r["score_final"] == compute_score(CLEAN, FULL_SI)["score_final"] - 5


def test_pas_de_perte_si_critere_operationnel():
    si = {**FULL_SI, "primary_endpoint_operationally_defined": True}
    assert compute_score(CLEAN, si)["score_final"] == compute_score(CLEAN, FULL_SI)["score_final"]


def test_le_verdict_ia_ne_plafonne_plus_le_score():
    """Les plafonds « verdict IA » (4 → 49, 5 → 20) ne font pas partie de la grille."""
    for level in (3, 4, 5):
        si = {**copy.deepcopy(FULL_SI), "global_verdict_level": level}
        assert not compute_score(CLEAN, si)["plafonds_detectes"]


def test_lignes_vides_seules_plafond_a_10():
    prof = copy.deepcopy(CLEAN)
    prof["structure"]["empty_rows"] = {"n": 100, "lines": []}
    r = compute_score(prof, FULL_SI)
    assert r["score_final"] <= 10


def test_lignes_recopiees_comptent_comme_doublons_et_plafonnent_a_59():
    """Audit v2 d'Amine : 10 lignes recopiées sur 51 → « pas de doublon injustifié » 0/2,
    et l'effectif réel ne peut plus être établi (plafond 59)."""
    prof = copy.deepcopy(CLEAN)
    prof["structure"]["duplicates"]["n_suspect_copy_rows"] = 20  # 20 % de 100
    r = compute_score(prof, FULL_SI)
    assert _crit(r, 1, "Absence de doublons")["obtenu"] == 0
    assert r["score_final"] <= 59
    assert any("effectif réel" in c["defaut"] for c in r["plafonds_appliques"])
