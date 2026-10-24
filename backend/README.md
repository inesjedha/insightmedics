# Backend Insight Medics

API REST + pipeline d'audit de bases de données médicales (SPSS `.sav`, Excel, CSV).
Implémente le contrat attendu par le front (`src/lib/api/client.ts`).

Principe directeur : **l'IA propose, le code exécute.** La base originale n'est jamais
modifiée ; le score /100 est calculé de façon déterministe par le code (jamais par l'IA),
ce qui le rend reproductible.

## Démarrage local

**Prérequis : Python 3.12** (`python3.12 --version`), la version utilisée en CI et en prod.

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --reload-dir app --port 8000
```

Côté front, dans `.env` : `VITE_API_BASE_URL=http://localhost:8000`.

## Qualité du code (lint, typage, tests)

```bash
pip install -r requirements-dev.txt
ruff check app scripts tests      # lint + tri d'imports
mypy                              # typage statique (config dans pyproject.toml)
pytest                            # tests (base temporaire, IA désactivée)
```

Ces trois commandes sont exécutées par la CI (`.github/workflows/ci.yml`) à chaque push.

## Organisation du code

```
app/
  main.py        création de l'app, CORS, démarrage (lifespan → init_db)
  config.py      paramètres (variables d'environnement / .env)
  db.py          moteur SQLAlchemy, sessions, création du schéma
  models.py      tables (Audit, Lead) et AuditStatus
  schemas.py     contrats JSON de l'API (camelCase, miroir de src/lib/api/types.ts)
  auth.py        clé admin (en-tête X-Admin-Key)
  routers/       couche HTTP uniquement : validation, codes d'erreur, sérialisation
  services/      logique métier, sans HTTP (audits : stockage, aperçu, déblocage,
                 lien privé, livrables ; leads : création)
  pipeline/      moteur d'audit (ingest → profile → IA → règles → score → livrables)
  prompts/       prompts système versionnés des deux appels IA
```

Règle de dépendance : `routers → services → pipeline`, jamais l'inverse. Les services
lèvent des erreurs métier (`FileTooLargeError`, `LinkExpiredError`…) que les routers
traduisent en codes HTTP.

## Endpoints

Documentation interactive générée par FastAPI : `http://localhost:8000/docs`.

| Accès  | Méthode | Route                         | Description                                                    |
| ------ | ------- | ----------------------------- | -------------------------------------------------------------- |
| public | POST    | `/audit/upload`               | Upload multipart (`file`, `protocol` optionnel) → aperçu       |
| public | GET     | `/audit/:id`                  | Résumé de l'aperçu (sans le jeton du lien privé)               |
| public | GET     | `/audit/:id/events`           | Journal des étapes                                             |
| public | GET     | `/audit/:id/score`            | Décomposition du score (8 domaines, plafonds, confiance)       |
| admin  | GET     | `/audit`                      | Liste des audits                                               |
| admin  | POST    | `/audit/:id/unlock`           | Après paiement : lance l'audit IA en tâche de fond (202)       |
| admin  | GET     | `/audit/:id/profiling`, `/ai`, `/assessment` | Profiling, audit IA brut, jugement IA           |
| admin  | GET     | `/audit/:id/:livrable`        | `workbook.xlsx`, `report.docx`, `base_analyse.csv`, `.sav`     |
| jeton  | GET     | `/r/:token[/score\|/assessment\|/:livrable]` | Espace client : audit payé, non expiré         |
| public | POST    | `/leads`                      | Création de lead (201) ; id, statut, priorité fixés serveur    |
| admin  | GET/PATCH | `/leads`, `/leads/:id`      | CRM                                                            |
| public | GET     | `/health`                     | Healthcheck                                                    |

## Tâches de fond

- **Déblocage** : `POST /audit/:id/unlock` répond tout de suite (202, statut `processing`)
  et l'audit IA tourne après la réponse (`BackgroundTasks` FastAPI). Un seul audit IA à la
  fois (sémaphore) pour garder coût et mémoire prévisibles. Un échec passe l'audit en
  `failed` avec son message, visible dans l'admin, et le déblocage peut être relancé. Un
  audit interrompu par un redémarrage est remis en aperçu au démarrage suivant.
  Limite assumée : la tâche vit dans le processus web. Si le volume grandit (plusieurs
  audits simultanés, plusieurs serveurs), passer à une vraie file (ex. Redis + worker).
- **Purge (rétention)** : au démarrage puis toutes les `PURGE_INTERVAL_HOURS` heures, les
  audits expirés (`FILE_RETENTION_DAYS` jours après l'aperçu ou après la livraison) perdent
  leurs fichiers et leur détail identifiant (profiling, audit IA) ; le résumé reste.
  Manuellement : `python -m scripts.purge_expired`.


## Pipeline

L'orchestrateur `app/pipeline/runner.py` enchaîne les étapes :

- **Ingest** (`ingest.py`) : `.sav` (labels + valeurs manquantes SPSS via pyreadstat),
  `.xlsx/.xls` (feuilles masquées détectées), `.csv` (encodage + séparateur auto).
  Original en lecture seule.
- **Profile** (`profile.py`) : structure, identifiants, doublons, types, codes manquants
  suspects (999, -1, « NA »…), stats descriptives, outliers IQR, manquants
  (global/variable/patient/blocs), dates, PII.
- **LLM-1** (`llm1.py`) : reconstruction de l'étude, dictionnaire des variables, règles de
  cohérence DSL, variables dérivées. L'IA propose ; elle ne calcule ni ne modifie rien.
- **Moteur de règles** (`rules_engine.py`) : interpréteur DSL sûr (AST fermé, jamais `eval`)
  qui exécute les règles sur toute la base.
- **LLM-2** (`llm2.py`) : classification des anomalies (A/B/C/D), verdict d'exploitabilité,
  entrées de score (enums), rédaction française.
- **Score** (`score_engine.py`) : grille déterministe en 8 domaines + plafonds + niveau de
  confiance. **Seule source du /100.** (`issues.py` ne produit que les libellés d'anomalies
  pour le front, aucun score.)
- **Livrables** (`report_xlsx.py`, `report_docx.py`) : classeur 10 onglets + rapport Word.
- **Nettoyage** (`cleaning.py`) : copie nettoyée et anonymisée (`id_anonyme` + `ligne_source`,
  PII retirées, colonnes vides exclues, variables dérivées d'analyse). Aucune imputation ;
  valeurs extrêmes jamais écrasées (colonne `_analyse` dédiée).

## Config (variables d'environnement)

Voir `.env.example` (commenté) : `DATABASE_URL`, `STORAGE_DIR`, `CORS_ORIGINS`,
`FILE_RETENTION_DAYS`, `PURGE_INTERVAL_HOURS`, `LLM_PROVIDER`, `LLM_MODEL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
`ADMIN_API_KEY`. Les secrets ne sont jamais versionnés (`.env` est gitignoré).

Les tests n'utilisent jamais ces valeurs : `tests/conftest.py` impose une base et un
stockage temporaires et désactive l'IA (aucun appel payant pendant `pytest`).

## Déploiement Railway

Service Python (version lue dans `.python-version`), root directory `backend`, start command :
`uvicorn app.main:app --host 0.0.0.0 --port $PORT` + addon Postgres + volume `/storage`.
