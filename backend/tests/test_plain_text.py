"""Relecture « mots simples » des textes de l'étudiant (retour de Hamza, 27/10/2026)."""

import json

from app.config import settings
from app.pipeline import llm_client
from app.pipeline.llm2 import Headline, LexiconEntry, Llm2Output, Mission
from app.pipeline.plain_text import jargon_hits, numbers, run_plain_pass, student_texts


def _out() -> Llm2Output:
    return Llm2Output(
        headline=Headline(title="Base partiellement exploitable",
                          subtitle="L'effectif réel est incertain : 14 doublons probables."),
        missions=[Mission(feu="rouge", title="Des doublons ?",
                          vu="La variable « Sexe » diffère entre les lignes 6 et 36.",
                          a_faire=["Vérifiez les 14 paires au dossier."])],
        lexique=[LexiconEntry(mot="Diagramme de flux", sens="Schéma des patients inclus.")],
    )


def test_jargon_repere_hors_noms_de_colonnes():
    hits = [w for w, _ in jargon_hits("La variable « Variable dérivée 2 » est exploitable.")]
    assert hits == ["variable", "exploitable"]
    assert jargon_hits("Ouvrez le dossier du patient n° 4.") == []
    assert jargon_hits("p < 0,05 et un test du Chi² significatif")


def test_nombres_normalises():
    assert numbers("2 183 patients, 9,1 % et J28") == {"2183", "9.1", "28"}


def test_textes_a_plat():
    t = student_texts(_out())
    assert t["missions.0.vu"].startswith("La variable")
    assert t["missions.0.a_faire.0"] == "Vérifiez les 14 paires au dossier."
    assert "lexique.0.mot" in t


def _fake(answers: list[dict], calls: list[tuple[str, str | None]]):
    def fake(system: str, user: str, effort: str | None = None) -> str:
        calls.append((user, effort))
        return json.dumps(answers.pop(0), ensure_ascii=False)
    return fake


def _good(t: dict[str, str]) -> dict[str, str]:
    return {**t,
            "headline.title": "Base utilisable en partie",
            "headline.subtitle": "Le nombre de patients est incertain : 14 patients saisis deux fois ?",
            "missions.0.title": "Des patients saisis deux fois ?",
            "missions.0.vu": "La colonne « Sexe » change entre les lignes 6 et 36."}


def test_relecture_relancee_puis_appliquee(monkeypatch):
    out = _out()
    t = student_texts(out)
    bad = {**_good(t), "missions.0.vu": "La variable « Sexe » change entre les lignes 6 et 36."}
    calls: list[tuple[str, str | None]] = []
    monkeypatch.setattr(settings, "anthropic_api_key", "test")
    monkeypatch.setattr(llm_client, "call_llm", _fake([bad, _good(t)], calls))
    notes = run_plain_pass(out)
    assert len(calls) == 2 and calls[0][1] == settings.llm_plain_effort
    assert "« variable »" in calls[1][0] and "missions.0.vu" in calls[1][0]
    assert out.missions[0].vu == "La colonne « Sexe » change entre les lignes 6 et 36."
    assert out.headline is not None and out.headline.title == "Base utilisable en partie"
    # les points bloquants suivent les missions réécrites
    assert out.blocking_points[0].title == "Des patients saisis deux fois ?"
    assert out.lexique[0].mot == "Diagramme de flux"
    assert not any("mot technique" in n for n in notes)


def test_texte_refuse_garde_sa_version_d_origine(monkeypatch):
    out = _out()
    t = student_texts(out)
    invented = {**_good(t), "missions.0.a_faire.0": "Vérifiez les 15 paires au dossier."}
    monkeypatch.setattr(settings, "anthropic_api_key", "test")
    monkeypatch.setattr(llm_client, "call_llm", _fake([invented, invented], []))
    notes = run_plain_pass(out)
    assert out.missions[0].a_faire == ["Vérifiez les 14 paires au dossier."]   # chiffre inventé
    assert out.missions[0].title == "Des patients saisis deux fois ?"         # le reste passe
    assert any("gardé" in n for n in notes)


def test_sans_cle_api_rien_ne_change(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "")
    out = _out()
    run_plain_pass(out)
    # remplacements sûrs du filet déterministe seulement
    assert out.headline is not None and out.headline.title == "Base partiellement utilisable"
    assert out.missions[0].vu == "La colonne « Sexe » diffère entre les lignes 6 et 36."
