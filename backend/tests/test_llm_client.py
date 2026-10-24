"""Tests de extract_json (llm_client) — robustesse du parsing, sans API.

Les LLM renvoient parfois le JSON entouré de texte ou dans un bloc markdown ;
extract_json doit récupérer l'objet malgré tout, et échouer proprement s'il n'y en a pas.
"""

import pytest

from app.pipeline.llm_client import extract_json


def test_json_simple():
    assert extract_json('{"a": 1, "b": "x"}') == {"a": 1, "b": "x"}


def test_json_dans_bloc_markdown():
    assert extract_json('```json\n{"a": 1}\n```') == {"a": 1}


def test_json_bloc_markdown_sans_langage():
    assert extract_json('```\n{"a": 1}\n```') == {"a": 1}


def test_json_avec_texte_autour():
    assert extract_json('Voici le résultat :\n{"a": 1}\nVoilà.') == {"a": 1}


def test_absence_de_json_leve_valueerror():
    with pytest.raises(ValueError):
        extract_json("aucun objet JSON ici")


# ---------------------------------------------------------------- client Claude (simulé)

from types import SimpleNamespace  # noqa: E402

from pydantic import BaseModel  # noqa: E402

from app.config import settings  # noqa: E402
from app.pipeline import llm_client  # noqa: E402


class _Answer(BaseModel):
    verdict: str


def _message(text: str, stop_reason: str = "end_turn", category: str | None = None):
    """Réponse type d'Opus 5.5 : un bloc de réflexion (texte omis) puis le texte."""
    return SimpleNamespace(
        content=[SimpleNamespace(type="thinking", thinking=""),
                 SimpleNamespace(type="text", text=text)],
        stop_reason=stop_reason,
        stop_details=SimpleNamespace(category=category),
        usage=SimpleNamespace(input_tokens=10, output_tokens=5, cache_read_input_tokens=0),
    )


class _FakeClient:
    """Imite `anthropic.Anthropic` : enregistre les requêtes, rejoue des réponses."""

    def __init__(self, *responses):
        self.responses, self.requests = list(responses), []
        self.messages = self

    def stream(self, **kwargs):
        self.requests.append(kwargs)
        return _Stream(self.responses.pop(0))


class _Stream:
    def __init__(self, message):
        self.message = message

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def get_final_message(self):
        return self.message


@pytest.fixture()
def fake_claude(monkeypatch):
    def install(*responses):
        client = _FakeClient(*responses)
        monkeypatch.setattr(settings, "anthropic_api_key", "sk-ant-test")
        monkeypatch.setattr(llm_client, "_client", lambda: client)
        return client
    return install


def test_requete_conforme_a_opus_5_5(fake_claude):
    client = fake_claude(_message('{"verdict": "ok"}'))
    out, notes = llm_client.call_and_validate("système", "question", _Answer)
    assert out == _Answer(verdict="ok") and "OK" in notes[-1]
    req = client.requests[0]
    assert req["model"] == settings.llm_model == "claude-opus-5-5"
    assert req["output_config"] == {"effort": settings.llm_effort}
    assert req["max_tokens"] >= 64000                      # réflexion + réponse
    assert req["system"][0]["cache_control"] == {"type": "ephemeral"}
    for refused in ("temperature", "top_p", "top_k", "thinking"):
        assert refused not in req                          # erreur 400 sur Opus 5.5


def test_json_invalide_relance_avec_correction(fake_claude):
    client = fake_claude(_message("pas du json"), _message('{"verdict": "ok"}'))
    out, notes = llm_client.call_and_validate("s", "q", _Answer)
    assert out is not None and "tentative 2" in notes[-1]
    assert "CORRECTION DEMANDÉE" in client.requests[1]["messages"][0]["content"]


def test_refus_sans_relance(fake_claude):
    client = fake_claude(_message("", stop_reason="refusal", category="bio"))
    out, notes = llm_client.call_and_validate("s", "q", _Answer)
    assert out is None and "refusé" in notes[-1] and "bio" in notes[-1]
    assert len(client.requests) == 1                       # relancer ne servirait à rien


def test_reponse_tronquee_signalee(fake_claude):
    fake_claude(_message('{"verdict": "o', stop_reason="max_tokens"))
    out, notes = llm_client.call_and_validate("s", "q", _Answer)
    assert out is None and "tronquée" in notes[-1]


def test_sans_cle_ia_aucun_appel(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "")
    out, notes = llm_client.call_and_validate("s", "q", _Answer)
    assert out is None and "ANTHROPIC_API_KEY" in notes[0]


def test_contenu_client_encadre_par_un_identifiant_aleatoire():
    a, b = llm_client.client_content("x"), llm_client.client_content("x")
    assert a != b and a.startswith("<contenu_client id=") and "x" in a
