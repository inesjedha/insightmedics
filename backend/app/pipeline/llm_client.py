"""Client Claude partagé par LLM-1 et LLM-2 : appel à l'API + validation stricte du JSON.

Choix techniques (doc Anthropic : migration Opus 5.5, effort, prompt caching, streaming) :
- Modèle et effort réglables par configuration (`LLM_MODEL`, `LLM_EFFORT`). Sur Opus 5.5
  la réflexion est toujours active : `effort` est le seul levier de profondeur et de coût.
  Aucun `temperature`/`top_p`/`top_k` (refusés, erreur 400) ni réglage `thinking`
  (inutile : réflexion adaptative imposée ; `disabled`/`enabled` sont refusés).
- Appel en streaming : obligatoire dans le SDK au-delà de ~21k tokens de sortie, et
  robuste pour des appels de plusieurs minutes (pas de connexion muette).
- Prompt système mis en cache 1 h (`cache_control`) : identique à chaque appel, il est
  relu à 5 % du prix par les relances et les audits suivants (un appel xhigh dure
  souvent plus que les 5 min du cache par défaut).
- La réponse commence par des blocs `thinking` : on ne lit que les blocs `text`.
- Refus (`stop_reason: refusal`) et réponse tronquée (`max_tokens`) sont des erreurs
  explicites, jamais du JSON partiel validé par chance.
- Erreurs passagères : le SDK retente seul celles qui surviennent avant le début de la
  réponse (réseau, 429, 5xx, surcharge). Une coupure ou une surcharge PENDANT le
  streaming n'est pas retentée par le SDK : on la retente ici (TRANSIENT_ATTEMPTS).

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
import time
from collections.abc import Callable
from functools import lru_cache

import anthropic
from pydantic import BaseModel, ValidationError

from ..config import settings

logger = logging.getLogger(__name__)

AI_DISABLED_NOTE = "Aucune clé ANTHROPIC_API_KEY configurée : audit IA sauté"


TRANSIENT_ATTEMPTS = 3       # appels max en cas d'erreur passagère pendant le streaming
TRANSIENT_BACKOFF_SECONDS = 20


class LlmError(Exception):
    """Réponse inexploitable que relancer ne corrigera pas (refus, sortie tronquée)."""


@lru_cache(maxsize=1)
def _client() -> anthropic.Anthropic:
    """Client unique et réutilisé (pool de connexions HTTP partagé)."""
    return anthropic.Anthropic(
        api_key=settings.anthropic_api_key,
        max_retries=settings.llm_max_retries,
        # Délai d'inactivité entre deux lectures (le flux envoie des signaux réguliers,
        # un appel long n'est donc pas coupé) ; connexion : échec rapide.
        timeout=anthropic.Timeout(settings.llm_timeout_seconds, connect=10.0),
    )


def _is_transient(exc: anthropic.APIError) -> bool:
    """Erreur passagère côté réseau ou serveur, qui mérite une nouvelle tentative."""
    if isinstance(exc, anthropic.APIConnectionError):
        return True
    if isinstance(exc, anthropic.APIStatusError):
        # Pendant le streaming, une surcharge arrive avec le statut HTTP 200 initial.
        error_type = (exc.body or {}).get("error", {}).get("type") if isinstance(
            exc.body, dict) else None
        return exc.status_code >= 500 or error_type in ("overloaded_error", "api_error")
    return False


def _stream_message(system: str, user: str) -> anthropic.types.Message:
    for attempt in range(1, TRANSIENT_ATTEMPTS + 1):
        try:
            with _client().messages.stream(
                model=settings.llm_model,
                max_tokens=settings.llm_max_tokens,
                system=[{"type": "text", "text": system,
                         "cache_control": {"type": "ephemeral", "ttl": "1h"}}],
                messages=[{"role": "user", "content": user}],
                output_config={"effort": settings.llm_effort},
            ) as stream:
                return stream.get_final_message()
        except anthropic.APIError as exc:
            if attempt == TRANSIENT_ATTEMPTS or not _is_transient(exc):
                raise
            logger.warning("Erreur passagère de l'API Claude (%s), nouvelle tentative %d/%d",
                           exc, attempt + 1, TRANSIENT_ATTEMPTS)
            time.sleep(TRANSIENT_BACKOFF_SECONDS * attempt)
    raise AssertionError("inatteignable")


def call_llm(system: str, user: str) -> str:
    """Envoie un message à Claude et retourne le texte de la réponse (hors réflexion)."""
    message = _stream_message(system, user)

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
    if message.stop_reason == "model_context_window_exceeded":
        raise LlmError("Entrée trop volumineuse pour la fenêtre de contexte du modèle")
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
    retourne (objet modifié, notes supplémentaires), ou lève ValueError pour demander une
    nouvelle réponse (le message est renvoyé au modèle).
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
        except LlmError as exc:
            notes.append(f"Échec : {exc}")
            return None, notes
        # Seule la réponse elle-même peut être corrigée par une relance.
        try:
            obj = schema.model_validate(extract_json(raw))
        except (ValueError, ValidationError) as exc:  # JSONDecodeError hérite de ValueError
            last_error = str(exc)[:300]
            continue
        if post is not None:
            # `post` peut refuser une sortie valide mais incohérente (colonne inconnue,
            # chiffre absent des résultats) en levant ValueError : on relance avec le motif.
            try:
                obj, extra = post(obj)
            except ValueError as exc:
                last_error = str(exc)[:600]
                continue
            notes.extend(extra)
        notes.append(f"OK ({settings.llm_model}, effort {settings.llm_effort}, "
                     f"tentative {attempt + 1})")
        return obj, notes

    notes.append(f"Échec après {attempts} tentatives ({last_error})")
    return None, notes
