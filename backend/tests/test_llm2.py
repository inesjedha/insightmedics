"""Tests LLM-2 (M5) — schéma, filtres, alimentation du score. Sans appel API."""

from app.pipeline.llm2 import Llm2Output, build_user_message
from app.pipeline.score_engine import compute_score

VALID = {
    "findings": [{
        "id": "F001", "anomaly_class": "A", "severity": "critique",
        "certainty": "certain", "column": "age", "row_ids": ["D-1"],
        "observed": "999", "rule_violated": "borne théorique max 120",
        "title_fr": "Code 999 non déclaré", "explanation_fr": "…",
        "proposed_correction": "recode_missing 999", "requires_source_verification": False,
    }],
    "scoring_inputs": {
        "statistical_unit_clear": True,
        "primary_endpoint_status": "exploitable",
        "primary_objective_vars_available": "complet",
        "groups_reconstructible": "oui",
        "planned_analyses_feasibility": "adaptees",
    },
    "client_decisions": [{"question_fr": "Fusionner les doublons ?", "options": ["oui", "non"]}],
    "cleaning_plan": [
        {"op_id": "op1", "operation": "recode_missing", "column": "age",
         "params": {"codes": [999]}, "rationale_fr": "…", "auto_safe": True},
        {"op_id": "op2", "operation": "invente_une_operation",  # hors enum
         "column": "x", "params": {}, "rationale_fr": "…", "auto_safe": True},
    ],
    "exploitability_verdict": {"level": 2, "label": "exploitable avec réserves",
                               "justification_fr": "…"},
    "executive_summary_fr": "La base compte 51 patients…",
    "report_sections_fr": {"limites": "…", "plan_action": "…",
                           "plan_analyse_conditionnel": "…"},
    "pii_assessment": [{"column": "tel", "risk": "eleve", "recommendation_fr": "supprimer"}],
}


def test_schema_valide():
    out = Llm2Output.model_validate(VALID)
    assert out.findings[0].anomaly_class == "A"
    assert out.exploitability_verdict.level == 2
    assert out.scoring_inputs.primary_endpoint_status == "exploitable"


def test_scoring_inputs_alimente_la_grille_et_monte_la_confiance():
    """Le jugement de LLM-2 doit sortir les domaines 5/6/8 de l'état inévaluable."""
    from tests.test_score_engine import CLEAN
    out = Llm2Output.model_validate(VALID)
    si = out.scoring_inputs.model_dump(exclude_none=True)
    sans = compute_score(CLEAN)
    avec = compute_score(CLEAN, {**si, "rule_violations": {"violation_rate": 0, "n_major": 0}})
    assert sans["confiance"]["niveau"] == "faible"
    assert avec["confiance"]["niveau"] != "faible"
    assert avec["criteres_inevaluables"] < sans["criteres_inevaluables"]


def test_build_user_message_ne_contient_pas_toute_la_base():
    profiling = {
        "structure": {"n_rows": 51, "n_cols": 3, "id_column": "id",
                      "duplicates": {"exact_rows": 0}},
        "missing_summary": {"pct_global": 5.0},
        "columns": [{"name": "id", "spss_label": "ID", "stat_type_guess": "nominal",
                     "pct_missing": 0, "suspected_missing_codes": [], "flags": []}],
        "dates_audit": [], "pii_candidates": [],
    }
    ai_audit = {"study": None, "dictionary": [], "violations": None, "derived_variables": []}
    msg = build_user_message(profiling, ai_audit)
    assert "FAITS D'AUDIT" in msg and "structure" in msg


def _decision(q, priority):
    return {"question_fr": q, "priority": priority}


def test_priorite_mal_orthographiee_ramenee_a_l_enum():
    from app.pipeline.llm2 import ClientDecision
    assert ClientDecision(question_fr="q", priority="Avant toute analyse").priority == "avant_analyse"
    assert ClientDecision(question_fr="q", priority="optionnelle").priority == "facultative"
    assert ClientDecision(question_fr="q", priority="n'importe quoi").priority == "importante"
    assert ClientDecision(question_fr="q").priority == "importante"


def test_questions_triees_par_priorite_et_limitees_a_dix():
    from app.pipeline.llm2 import MAX_CLIENT_DECISIONS, prioritize_decisions
    raw = ([_decision(f"fac{i}", "facultative") for i in range(4)]
           + [_decision(f"imp{i}", "importante") for i in range(5)]
           + [_decision(f"avant{i}", "avant_analyse") for i in range(3)])
    out = Llm2Output.model_validate({**VALID, "client_decisions": raw})
    kept, n_cut = prioritize_decisions(out.client_decisions)
    assert len(kept) == MAX_CLIENT_DECISIONS == 10 and n_cut == 2
    assert [d.question_fr for d in kept[:3]] == ["avant0", "avant1", "avant2"]
    assert [d.question_fr for d in kept[3:8]] == [f"imp{i}" for i in range(5)]
    assert [d.question_fr for d in kept[8:]] == ["fac0", "fac1"]  # les 2 dernières écartées
