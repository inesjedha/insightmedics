"""Tests du classeur Excel remis à l'étudiant (4 onglets) — sans appel API."""

import io

from openpyxl import load_workbook
from tests.test_report_xlsx import SYNTH_AI, _profiling_min
from tests.test_score_engine import CLEAN, FULL_SI

from app.pipeline.report_client_xlsx import build_client_workbook
from app.pipeline.score_engine import compute_score

NEW_FIELDS = {
    "headline": {"title": "Exploitable après 3 vérifications", "subtitle": "Trois points bloquent."},
    "blocking_points": [{"title": "14 patients saisis deux fois", "what": "Inclusions 34 à 47.",
                         "why": "Double comptage.", "todo": "Vérifier les dossiers.",
                         "refs": ["4 ↔ 34"]}],
}


def _wb(assessment_extra=None, profiling=None):
    ai = {**SYNTH_AI, "assessment": {**SYNTH_AI["assessment"], **(assessment_extra or {})}}
    data = build_client_workbook(profiling or _profiling_min(), compute_score(CLEAN, FULL_SI), ai)
    return load_workbook(io.BytesIO(data))


def _values(ws):
    return [v for row in ws.iter_rows(values_only=True) for v in row if v not in (None, "")]


def test_quatre_onglets_dans_l_ordre():
    assert _wb(NEW_FIELDS).sheetnames == ["À lire d'abord", "Anomalies à vérifier",
                                          "Questions pour votre directeur", "Score détaillé"]


def test_a_lire_d_abord_verdict_et_points_bloquants():
    vals = _values(_wb(NEW_FIELDS)["À lire d'abord"])
    assert "Exploitable après 3 vérifications" in vals
    assert any(isinstance(v, str) and v.startswith("14 patients saisis deux fois") for v in vals)
    assert "Double comptage." in vals


def test_ancien_audit_sans_nouveaux_champs_reste_lisible():
    vals = _values(_wb()["À lire d'abord"])
    assert "exploitable avec réserves" in vals  # repli sur le verdict


def test_anomalies_triees_par_priorite_avec_colonne_decision():
    ws = _wb(NEW_FIELDS)["Anomalies à vérifier"]
    header = [c.value for c in ws[4]]
    assert header[7] == "Votre décision"
    assert ws["B5"].value == "Avant toute analyse"   # la critique d'abord
    assert ws["B6"].value == "Facultative"
    assert ws.data_validations.dataValidation  # listes déroulantes présentes


def test_identifiants_masques_si_la_colonne_identifiant_est_identifiante():
    prof = _profiling_min()
    prof["structure"] = {**prof["structure"], "id_column": "dossier"}
    prof["pii_candidates"] = [{"column": "dossier"}]
    findings = [{"id": "F1", "severity": "critique", "anomaly_class": "A",
                 "certainty": "certain", "row_ids": ["DOS-123"], "title_fr": "t",
                 "explanation_fr": "e"}]
    vals = _values(_wb({"findings": findings}, prof)["Anomalies à vérifier"])
    assert "DOS-123" not in vals


def test_questions_et_score():
    wb = _wb(NEW_FIELDS)
    assert "Fusionner les doublons ?" in _values(wb["Questions pour votre directeur"])
    assert any(v == "Total du domaine" for v in _values(wb["Score détaillé"]))
