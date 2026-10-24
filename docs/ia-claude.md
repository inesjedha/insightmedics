# IA — Claude : choix techniques et bonnes pratiques

Insight Medics utilise exclusivement **Claude (API Anthropic)** pour les deux étapes
d'interprétation du pipeline : LLM-1 (dictionnaire, règles de cohérence) et LLM-2
(classification des anomalies, verdict, rédaction). Le score reste calculé par le code,
jamais par l'IA. Code : `backend/app/pipeline/llm_client.py`.

## Configuration

| Variable              | Défaut            | Rôle                                                                  |
| --------------------- | ----------------- | --------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`   | (vide)            | Clé API. Vide = audit IA sauté (dev, tests). Jamais versionnée.       |
| `LLM_MODEL`           | `claude-opus-5-5` | Modèle. Identifiant fixe, sans suffixe de date.                       |
| `LLM_EFFORT`          | `xhigh`           | Profondeur de raisonnement : `low`, `medium`, `high`, `xhigh`, `max`. |
| `LLM_MAX_TOKENS`      | `64000`           | Plafond de sortie par appel (réflexion + réponse).                    |
| `LLM_TIMEOUT_SECONDS` | `1200`            | Délai max d'un appel.                                                 |
| `LLM_MAX_RETRIES`     | `4`               | Relances automatiques du SDK (réseau, 429, 5xx).                      |

## Règles appliquées (et pourquoi)

1. **Effort, pas de sampling.** Sur Opus 5.5 la réflexion est toujours active ;
   `output_config.effort` est le seul réglage de profondeur et de coût. `temperature`,
   `top_p`, `top_k` et tout bloc `thinking` sont refusés (erreur 400) : on n'en envoie pas.
2. **`max_tokens` généreux.** Il couvre la réflexion _et_ le JSON. Trop bas, la réponse est
   tronquée au milieu de l'objet : la doc recommande au moins 64k aux niveaux `xhigh`/`max`.
   Une réponse tronquée (`stop_reason: max_tokens`) est une erreur explicite.
3. **Streaming.** Obligatoire dans le SDK au-delà d'environ 21k jetons de sortie, et plus
   robuste pour des appels de plusieurs minutes.
4. **Lire les blocs par type.** Une réponse commence par des blocs `thinking` (texte omis
   par défaut) : on ne lit que les blocs `text`, jamais `content[0]`.
5. **Refus gérés.** `stop_reason: refusal` (avec `stop_details.category`) est remonté tel
   quel, sans relance inutile. Un audit payé sans jugement IA passe en `failed` (relançable)
   plutôt que d'être livré incomplet.
6. **Prompt système en cache** (`cache_control: ephemeral`, 5 min). Il est identique à
   chaque appel : les relances et audits rapprochés le relisent à 5 % du prix.
   Ne jamais y insérer de contenu variable (cela casserait le cache).
7. **Contenu client encadré.** Tout ce qui vient des fichiers du client (libellés,
   échantillon, protocole) est placé dans `<contenu_client id="…">` avec un identifiant
   aléatoire, et les prompts précisent que c'est de la donnée, jamais une instruction
   (protection contre l'injection de consignes).
8. **Pas de raisonnement demandé dans la réponse.** Demander la réflexion « étape par
   étape » dans le texte peut provoquer un refus (`reasoning_extraction`). Les prompts ne
   demandent que de courtes justifications (`rationale_fr`).
9. **Validation stricte côté code.** Chaque réponse est validée par un schéma pydantic,
   avec 2 relances accompagnées d'un message de correction. Les _structured outputs_ de
   l'API ne sont pas utilisés : nos schémas contiennent des objets libres (règles DSL,
   paramètres de nettoyage) et dépassent la limite de 24 champs optionnels.
10. **Minimisation des données.** Jamais la base complète : un échantillon d'au plus
    50 lignes, colonnes potentiellement identifiantes masquées, plus des statistiques
    calculées par le code. Aucune donnée patient dans les noms de champs des schémas.
11. **Tests hermétiques.** Aucun test n'appelle la vraie API (garde-fou dans
    `tests/conftest.py`) ; le client est testé avec un faux client qui vérifie la forme
    exacte des requêtes (modèle, effort, cache, absence des paramètres refusés).

## Choisir l'effort

Le niveau `xhigh` est le choix actuel (qualité maximale du jugement méthodologique).
La doc Anthropic recommande de le valider par des mesures : `xhigh` réfléchit beaucoup
plus (coût et durée en hausse) et vise surtout les tâches longues. À faire lors de la
calibration sur les bases de référence de Hamza : comparer `high` et `xhigh` (écart de
score, verdict, coût et durée par audit) et garder le niveau le plus bas qui ne dégrade
pas les résultats. Changer de niveau = changer `LLM_EFFORT`, sans toucher au code.

Coût indicatif Opus 5.5 : 4 $ / million de jetons en entrée, 20 $ / million en sortie
(réflexion comprise), lecture du cache à 0,20 $. Chaque appel journalise ses jetons
(entrée, cache, sortie) pour suivre le coût réel par audit.

## Changer de modèle

1. Lire le guide de migration du nouveau modèle (paramètres refusés, effort par défaut).
2. Changer `LLM_MODEL`, relancer les tests, puis la calibration sur une base de référence.
3. Vérifier dans les journaux les jetons consommés et le taux de relances.

## Sources

- [Guide de migration vers Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide)
- [Paramètre effort](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
