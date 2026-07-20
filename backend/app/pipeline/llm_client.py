"""Client LLM partagé (jalons M4/M5) : dispatch fournisseur + extraction JSON +
boucle de validation générique. Réutilisé par LLM-1 et LLM-2.

Jamais la base complète à l'API. Sortie toujours validée contre un schéma pydantic
(2 retries avec message de correction). Prompts versionnés dans app/prompts/.
"""

from __future__ import annotations

import json
import re
from typing import Callable, TypeVar

from pydantic import BaseModel, ValidationError

from ..config import settings

T = TypeVar("T", bound=BaseModel)


def provider_ready() -> tuple[bool, str]:
    """(clé disponible ?, message si absente)."""
    if settings.resolved_provider:
        return True, ""
    return False, ("Aucune clé API IA configurée (ANTHROPIC_API_KEY ou "
                   "OPENAI_API_KEY) : audit IA sauté")


def call_llm(system: str, user: str, max_tokens: int = 16000) -> str:
    """Appelle le fournisseur configuré (anthropic ou openai) et retourne le texte."""
    provider = settings.resolved_provider
    model = settings.resolved_model
    if provider == "anthropic":
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        resp = client.messages.create(
            model=model, max_tokens=max_tokens, temperature=0,
            system=system, messages=[{"role": "user", "content": user}],
        )
        return "".join(b.text for b in resp.content if b.type == "text")
    if provider == "openai":
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.chat.completions.create(
            model=model, temperature=0,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": user}],
        )
        return resp.choices[0].message.content or ""
    raise RuntimeError(f"Fournisseur IA inconnu : {provider}")


def extract_json(text: str) -> dict:
    """Extrait le premier objet JSON d'une réponse (tolère un bloc markdown)."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.S)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Aucun JSON dans la réponse")
    return json.loads(text[start:end + 1])


def call_and_validate(system: str, user: str, schema: type[T],
                      post: Callable[[T], tuple[T, list[str]]] | None = None,
                      max_tokens: int = 16000,
                      attempts: int = 3) -> tuple[T | None, list[str]]:
    """Appelle le LLM, valide contre `schema`, retente jusqu'à `attempts` fois.

    `post` : traitement optionnel après validation (ex. filtrage des règles),
    retourne (objet modifié, notes supplémentaires).
    Retourne (objet validé | None, notes).
    """
    notes: list[str] = []
    ready, msg = provider_ready()
    if not ready:
        return None, [msg]

    last_error = ""
    for attempt in range(attempts):
        prompt = user if attempt == 0 else (
            user + f"\n\n## CORRECTION DEMANDÉE\nTa réponse précédente était invalide "
                   f"({last_error}). Renvoie UNIQUEMENT le JSON conforme au schéma.")
        try:
            raw = call_llm(system, prompt, max_tokens=max_tokens)
            obj = schema.model_validate(extract_json(raw))
        except (ValueError, ValidationError, json.JSONDecodeError) as exc:
            last_error = str(exc)[:300]
            continue
        if post is not None:
            obj, extra = post(obj)
            notes.extend(extra)
        notes.append(f"OK ({settings.resolved_provider}/{settings.resolved_model}, "
                     f"tentative {attempt + 1})")
        return obj, notes

    notes.append(f"Échec après {attempts} tentatives ({last_error})")
    return None, notes
