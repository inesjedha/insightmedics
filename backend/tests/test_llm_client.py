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
