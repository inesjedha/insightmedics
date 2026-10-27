"""Tests du filet de sécurité sur les textes destinés à l'étudiant — sans appel API."""

from app.pipeline.llm2 import Llm2Output
from app.pipeline.student_text import clean, shorten, tidy_output


def test_codes_internes_retires():
    """Phrases réelles de l'audit du 27/10/2026."""
    assert clean("Elle sert à juger le critère « stable » (voir F24).") == \
        "Elle sert à juger le critère « stable »."
    assert clean("Sauf l'inclusion 24 (R018) et les inclusions 8 et 38 (R019).") == \
        "Sauf l'inclusion 24 et les inclusions 8 et 38."
    assert clean("Elle viole plusieurs règles (R003, R005 à R007).") == \
        "Elle viole plusieurs règles."
    assert clean("Convertir les colonnes (opérations C01 à C09, applicables sans validation).") \
        == "Convertir les colonnes (applicables sans validation)."
    assert clean("Recoder selon des tables validées (opérations C10 à C21).") == \
        "Recoder selon des tables validées."
    assert clean("Appliquer les opérations C01 à C09.") == \
        "Appliquer les opérations de nettoyage proposées."


def test_expressions_de_travail_remplacees():
    assert clean("Faire préciser l'unité (décision client n° 10).") == \
        "Faire préciser l'unité (question n° 10)."
    assert clean("Selon le dictionnaire, ces paires portent le même numéro.") == \
        "ces paires portent le même numéro."
    assert clean("La confiance sur ce critère est « medium ».") == \
        "La confiance sur ce critère est moyenne."


def test_vocabulaire_clinique_intact():
    for txt in ("PaO2/FiO2 à J3", "CO2 et PaCO2", "stade T4 N1", "Glasgow 3", "C3 bas"):
        assert clean(txt) == txt


def test_coupe_en_fin_de_phrase():
    txt = "Une phrase courte ici. " + " ".join(["mot"] * 30)
    assert shorten(txt, 8) == "Une phrase courte ici. mot mot mot mot…"  # phrase trop courte
    long_sentence = "Premiere phrase de six mots. Deuxième phrase qui déborde largement du plafond fixé."
    assert shorten(long_sentence, 8) == "Premiere phrase de six mots."
    assert shorten("Court.", 8) == "Court."


def test_tidy_output_plafonne_tous_les_textes():
    long = " ".join(["mot"] * 200)
    out = Llm2Output.model_validate({
        "headline": {"title": long, "subtitle": long},
        "blocking_points": [{"title": long, "what": long, "why": long, "todo": long,
                             "refs": [f"{i} ↔ {i + 30}" for i in range(10)]}] * 5,
        "analysis_map": {"realisable": [long] * 9},
        "findings": [{"id": "F1", "anomaly_class": "A", "severity": "critique",
                      "certainty": "certain", "title_fr": long, "explanation_fr": long,
                      "check_fr": long, "rows_fr": long, "proposed_correction": long}],
        "client_decisions": [{"question_fr": long, "options": [long] * 8,
                              "consequence_fr": long, "recommendation_fr": long}],
        "exploitability_verdict": {"level": 3, "label": long, "justification_fr": long},
        "executive_summary_fr": long,
    })
    tidy_output(out)
    assert len(out.headline.title.split()) <= 12
    assert len(out.blocking_points) == 3 and len(out.blocking_points[0].refs) == 6
    assert len(out.blocking_points[0].what.split()) <= 60
    assert len(out.analysis_map.realisable) == 6
    assert len(out.findings[0].explanation_fr.split()) <= 56
    assert len(out.client_decisions[0].options) == 5
    assert len(out.executive_summary_fr.split()) <= 110


def test_anciens_audits_sans_nouveaux_champs_restent_valides():
    out = Llm2Output.model_validate({"findings": [], "executive_summary_fr": "…"})
    assert out.headline is None and out.blocking_points == []
    assert out.analysis_map.realisable == []
