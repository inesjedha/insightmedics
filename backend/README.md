# Backend Insight Medics

API REST + pipeline d'audit de bases de données médicales (SPSS `.sav`, Excel, CSV).
Implémente le contrat attendu par le front (`src/lib/api/client.ts`).

Principe directeur : **l'IA propose, le code exécute.** La base originale n'est jamais
modifiée ; le score /100 est calculé de façon déterministe par le code (jamais par l'IA),
ce qui le rend reproductible.

## Démarrage local

**Prérequis : Python 3.10 ou plus** (`python3 --version` ; le projet cible la 3.12 en CI).

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --reload-dir app --port 8000
```

Côté front, dans `.env` : `VITE_USE_MOCK_API=false` et
`VITE_API_BASE_URL=http://localhost:8000`.

## Qualité du code (lint, typage, tests)

```bash
pip install -r requirements-dev.txt
ruff check app scripts tests      # lint + tri d'imports
mypy                              # typage statique (config dans pyproject.toml)
pytest -q                         # tests
```

Ces trois commandes sont exécutées par la CI (`.github/workflows/ci.yml`) à chaque push.

## Endpoints

| Méthode        | Route                          | Description                                              |
| -------------- | ------------------------------ | -------------------------------------------------------- |
| POST           | `/audit/upload`                | Upload multipart (`file`, `protocol` optionnel) → audit → `AuditResult` |
| GET            | `/audit/:id`                   | Résumé de l'audit                                        |
| GET            | `/audit/:id/events`            | Journal des étapes                                       |
| GET            | `/audit/:id/profiling`         | Profiling complet (interne/admin)                        |
| GET            | `/audit/:id/score`             | Décomposition du score (8 domaines, plafonds, confiance) |
| GET            | `/audit/:id/ai`                | Audit IA (étude, dictionnaire, règles, violations)       |
| GET            | `/audit/:id/workbook.xlsx`     | Classeur d'audit (10 onglets)                            |
| GET            | `/audit/:id/report.docx`       | Rapport d'audit Word (11 sections)                       |
| GET            | `/audit/:id/base_analyse.csv`  | Base nettoyée et anonymisée (CSV)                        |
| GET            | `/audit/:id/base_analyse.sav`  | Base nettoyée et anonymisée (SPSS)                       |
| POST/GET/PATCH | `/leads`, `/leads/:id`         | CRM leads                                                |
| GET            | `/health`                      | Healthcheck                                              |

> L'upload est **synchrone** et peut prendre plusieurs minutes lorsque l'audit IA est actif.
> Le passage en traitement asynchrone (file d'attente + polling) reste une amélioration à venir.

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

`DATABASE_URL` (Postgres en prod, SQLite par défaut), `STORAGE_DIR`, `CORS_ORIGINS`,
`FILE_RETENTION_DAYS`, `LLM_PROVIDER` (`anthropic`|`openai`|vide=auto), `LLM_MODEL`,
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`. Les clés API ne sont jamais versionnées (`.env`
est gitignoré).

## Déploiement Railway

Service Python, root directory `backend`, start command :
`uvicorn app.main:app --host 0.0.0.0 --port $PORT` + addon Postgres + volume `/storage`.
