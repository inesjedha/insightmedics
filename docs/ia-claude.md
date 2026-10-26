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
| `LLM_MAX_TOKENS`      | `128000`          | Plafond de sortie par appel (réflexion + réponse).                    |
| `LLM_TIMEOUT_SECONDS` | `1200`            | Inactivité max entre deux lectures du flux (pas une durée totale).    |
| `LLM_MAX_RETRIES`     | `4`               | Relances du SDK avant le début de la réponse (réseau, 429, 5xx).      |

## Règles appliquées (et pourquoi)

1. **Effort, pas de sampling.** Sur Opus 5.5 la réflexion est toujours active ;
   `output_config.effort` est le seul réglage de profondeur et de coût. `temperature`,
   `top_p`, `top_k` et tout bloc `thinking` sont refusés (erreur 400) : on n'en envoie pas.
2. **`max_tokens` généreux.** Il couvre la réflexion _et_ le JSON. Trop bas, la réponse est
   tronquée au milieu de l'objet : la doc recommande au moins 64k aux niveaux `xhigh`/`max`,
   et 64k n'ont pas suffi pour une base de 71 variables : on prend le maximum d'Opus 5.5 (128k).
   Une réponse tronquée (`stop_reason: max_tokens`) est une erreur explicite.
3. **Streaming et erreurs passagères.** Le streaming est obligatoire dans le SDK au-delà
   d'environ 21k jetons de sortie. Le SDK retente seul les erreurs qui surviennent avant
   le début de la réponse ; une coupure ou une surcharge _pendant_ le flux est retentée
   par notre code (3 essais, attente croissante). Les erreurs définitives (requête
   invalide, clé refusée) ne sont jamais retentées.
4. **Lire les blocs par type.** Une réponse commence par des blocs `thinking` (texte omis
   par défaut) : on ne lit que les blocs `text`, jamais `content[0]`.
5. **Refus gérés.** `stop_reason: refusal` (avec `stop_details.category`) est remonté tel quel, sans relance inutile (la doc indique qu'un refus se répète sur le même modèle).
   Un audit payé sans jugement IA passe en `failed` (relançable) plutôt que d'être livré
   incomplet. À surveiller : les garde-fous « biologie » d'Opus 5.5 visent les armes
   biologiques, pas la recherche clinique courante, mais il faut le vérifier sur nos bases
   réelles ; en cas de refus récurrents, activer le repli serveur (_fallback_) d'Anthropic.
6. **Prompt système en cache 1 h** (`cache_control: ephemeral, ttl 1h`). Il est identique
   à chaque appel : relances et audits suivants le relisent à 5 % du prix (un appel
   `xhigh` dépasse souvent les 5 min du cache par défaut). Ne jamais y insérer de contenu
   variable : cela casserait le cache.
7. **Contenu client encadré.** Pour LLM-1, ce qui vient directement des fichiers du
   client (libellés, échantillon, protocole) est placé dans `<contenu_client id="…">` avec
   un identifiant aléatoire, et le prompt précise que c'est de la donnée, jamais une
   instruction (protection contre l'injection de consignes). LLM-2 ne reçoit que des faits
   calculés par le code, présentés comme fiables : pas d'encadrement.
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

## Durée et redéploiements

En `xhigh`, un audit complet (deux appels, plus d'éventuelles relances) peut dépasser les
15 min que Railway laisse à l'ancienne instance lors d'un redéploiement. Un audit coupé
ainsi est libéré par le verrou à bail (60 min) puis relancé depuis l'admin : éviter de
déployer pendant un audit en cours.

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
