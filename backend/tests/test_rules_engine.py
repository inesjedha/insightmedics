"""Tests du moteur de règles DSL (M4) — sans appel API."""

import pandas as pd
import pytest

from app.pipeline.rules_engine import eval_formula, execute_rules

DF = pd.DataFrame({
    "id": ["P1", "P2", "P3", "P4"],
    "age": [30, -5, 70, None],
    "sexe": [1, 1, 2, 2],            # 1=H, 2=F
    "grossesse": [0, 1, 1, 0],       # P2 : homme enceint → violation
    "poids": [70.0, 80.0, 60.0, 90.0],
    "taille": [175.0, 180.0, 160.0, 170.0],
    "imc": [22.9, 24.7, 30.0, 31.1],  # P3 : IMC réel 23.4 → divergence
    "date_adm": pd.to_datetime(["2025-01-01", "2025-01-05", "2025-02-01", "2025-03-01"]),
    "date_sortie": pd.to_datetime(["2025-01-10", "2025-01-02", "2025-02-15", "2025-03-09"]),
})  # P2 : sortie avant admission

RULES = [
    {"id": "R1", "description": "âge entre 0 et 120", "severity": "critical",
     "category": "clinical", "rule": {"op": "bounds", "col": "age", "min": 0, "max": 120}},
    {"id": "R2", "description": "grossesse ⇒ sexe féminin", "severity": "critical",
     "category": "clinical",
     "rule": {"op": "implies",
              "if": {"op": "eq", "left": {"col": "grossesse"}, "right": {"value": 1}},
              "then": {"op": "eq", "left": {"col": "sexe"}, "right": {"value": 2}}}},
    {"id": "R3", "description": "IMC = poids/taille²", "severity": "moderate",
     "category": "derived",
     "rule": {"op": "formula_match", "target": {"col": "imc"},
              "formula": "poids/(taille/100)**2", "tolerance": 0.5}},
    {"id": "R4", "description": "admission ≤ sortie", "severity": "critical",
     "category": "chrono",
     "rule": {"op": "chrono_order", "cols": ["date_adm", "date_sortie"]}},
]


def test_les_violations_attendues_sont_detectees():
    r = execute_rules(RULES, DF, DF["id"])
    by_id = {x["rule_id"]: x for x in r["results"]}
    assert by_id["R1"]["n_violations"] == 1 and by_id["R1"]["row_ids"] == ["P2"]
    assert by_id["R2"]["n_violations"] == 1 and by_id["R2"]["row_ids"] == ["P2"]
    assert by_id["R3"]["n_violations"] >= 1 and "P3" in by_id["R3"]["row_ids"]
    assert by_id["R4"]["n_violations"] == 1 and by_id["R4"]["row_ids"] == ["P2"]
    assert r["n_major"] == 3  # R1, R2, R4 sont critical avec violations


def test_les_manquants_ne_sont_pas_des_violations():
    r = execute_rules(RULES, DF, DF["id"])
    by_id = {x["rule_id"]: x for x in r["results"]}
    assert by_id["R1"]["n_tested"] == 3  # P4 (âge manquant) non testé


def test_regle_sur_colonne_inconnue_ignoree_proprement():
    bad = [{"id": "RX", "description": "x", "severity": "minor", "category": "clinical",
            "rule": {"op": "bounds", "col": "inexistante", "min": 0, "max": 1}}]
    r = execute_rules(bad, DF, DF["id"])
    assert r["rules_failed_to_parse"] == 1 and r["rules_tested"] == 0


def test_formules_sures():
    s = eval_formula("poids/(taille/100)**2", DF)
    assert abs(s.iloc[0] - 22.86) < 0.1
    with pytest.raises(ValueError):
        eval_formula("__import__('os')", DF)
    with pytest.raises(ValueError):
        eval_formula("colonne_inconnue + 1", DF)
