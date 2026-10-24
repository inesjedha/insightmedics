"""Client Claude partagé par LLM-1 et LLM-2 : appel à l'API + validation stricte du JSON.

Choix techniques (doc Anthropic : migration Opus 5.5, effort, prompt caching, streaming) :
- Modèle et effort réglables par configuration (`LLM_MODEL`, `LLM_EFFORT`). Sur Opus 5.5
  la réflexion est toujours active : `effort` est le seul levier de profondeur et de coût.
  Aucun `temperature`/`top_p`/`top_k` ni bloc `thinking` (refusés, erreur 400).
- Appel en streaming : obligatoire dans le SDK au-delà de ~21k tokens de sortie, et
  robuste pour des appels de plusieurs minutes (pas de connexion muette).
- Prompt système mis en cache (`cache_control`) : identique à chaque appel, il n'est
  facturé plein tarif qu'une fois par fenêtre de 5 min (tentatives de correction,
  audits successifs).
- La réponse commence par des blocs `thinking` : on ne lit que les blocs `text`.
- Refus (`stop_reason: refusal`) et réponse tronquée (`max_tokens`) sont des erreurs
  explicites, jamais du JSON partiel validé par chance.
- Erreurs réseau, 429 et 5xx : retentées par le SDK (backoff exponentiel).

Les sorties sont validées contre un schéma pydantic, avec jusqu'à 2 relances
accompagnées d'un message de correction. On n'utilise pas les « structured outputs »
de l'API : nos schémas contiennent des objets libres (règles DSL, paramètres de
nettoyage) et dépassent la limite de 24 champs optionnels ; la validation pydantic
garantit le même contrat côté code.

Jamais la base complète à l'API. Prompts versionnés dans app/prompts/.
"""

from __future__ import annotations

import json
import logging
import re
import secrets
from collections.abc import Callable
from functools import lru_cache

import anthropic
from pydantic import BaseModel, ValidationError

from ..config import settings

logger = logging.getLogger(__name__)

AI_DISABLED_NOTE = "Aucune clé ANTHROPIC_API_KEY configurée : audit IA sauté"


class LlmError(Exception):
    """Réponse inexploitable que relancer ne corrigera pas (refus, sortie tronquée)."""


@lru_cache(maxsize=1)
def _client() -> anthropic.Anthropic:
    """Client unique et réutilisé (pool de connexions HTTP partagé)."""
    return anthropic.Anthropic(api_key=settings.anthropic_api_key,
                               max_retries=settings.llm_max_retries,
                               timeout=settings.llm_timeout_seconds)


def call_llm(system: str, user: str) -> str:
    """Envoie un message à Claude et retourne le texte de la réponse (hors réflexion)."""
    with _client().messages.stream(
        model=settings.llm_model,
        max_tokens=settings.llm_max_tokens,
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user}],
        output_config={"effort": settings.llm_effort},
    ) as stream:
        message = stream.get_final_message()

    usage = message.usage
    logger.info("Claude %s (effort %s) : %s jetons en entrée (%s lus en cache), %s en sortie",
                settings.llm_model, settings.llm_effort, usage.input_tokens,
                usage.cache_read_input_tokens or 0, usage.output_tokens)

    if message.stop_reason == "refusal":
        category = getattr(message.stop_details, "category", None) or "non précisée"
        raise LlmError(f"Claude a refusé de répondre (catégorie : {category})")
    if message.stop_reason == "max_tokens":
        raise LlmError(f"Réponse tronquée : plafond de {settings.llm_max_tokens} jetons "
                       "atteint (augmenter LLM_MAX_TOKENS ou baisser LLM_EFFORT)")
    return "".join(block.text for block in message.content if block.type == "text")


def client_content(text: str) -> str:
    """Encadre du contenu venant du client (fichier, protocole) pour que Claude le traite
    comme des données à analyser et jamais comme des instructions (« prompt injection »).
    L'identifiant aléatoire, identique à l'ouverture et à la fermeture, rend la balise
    difficile à imiter depuis le contenu lui-même. Voir la section dédiée des prompts."""
    tag_id = secrets.token_hex(4)
    return f'<contenu_client id="{tag_id}">\n{text}\n</contenu_client id="{tag_id}">'


def extract_json(text: str) -> dict:
    """Extrait le premier objet JSON d'une réponse (tolère un bloc markdown)."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.S)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Aucun JSON dans la réponse")
    return json.loads(text[start:end + 1])


def call_and_validate[T: BaseModel](system: str, user: str, schema: type[T],
                                    post: Callable[[T], tuple[T, list[str]]] | None = None,
                                    attempts: int = 3) -> tuple[T | None, list[str]]:
    """Appelle Claude, valide contre `schema`, relance jusqu'à `attempts` fois si le JSON
    est invalide.

    `post` : traitement optionnel après validation (ex. filtrage des règles), qui
    retourne (objet modifié, notes supplémentaires).
    Retourne (objet validé | None, notes).
    """
    if not settings.ai_enabled:
        return None, [AI_DISABLED_NOTE]

    notes: list[str] = []
    last_error = ""
    for attempt in range(attempts):
        prompt = user if attempt == 0 else (
            user + f"\n\n## CORRECTION DEMANDÉE\nTa réponse précédente était invalide "
                   f"({last_error}). Renvoie UNIQUEMENT le JSON conforme au schéma.")
        try:
            raw = call_llm(system, prompt)
            obj = schema.model_validate(extract_json(raw))
        except LlmError as exc:
            notes.append(f"Échec : {exc}")
            return None, notes
        except (ValueError, ValidationError) as exc:  # JSONDecodeError hérite de ValueError
            last_error = str(exc)[:300]
            continue
        if post is not None:
            obj, extra = post(obj)
            notes.extend(extra)
        notes.append(f"OK ({settings.llm_model}, effort {settings.llm_effort}, "
                     f"tentative {attempt + 1})")
        return obj, notes

    notes.append(f"Échec après {attempts} tentatives ({last_error})")
    return None, notes
