# Backend Insight Medics

API REST + pipeline d'audit de bases de données médicales (SPSS .sav, Excel, CSV).
Implémente le contrat attendu par le front (`src/lib/api/client.ts`).

## Démarrage local

**Prérequis : Python 3.10 ou plus** (`python3 --version` pour vérifier ; sur macOS : `brew install python@3.12`).

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Puis côté front, dans `.env` : `VITE_USE_MOCK_API=false` et
`VITE_API_BASE_URL=http://localhost:8000`.

## Endpoints

| Méthode        | Route                   | Description                                                 |
| -------------- | ----------------------- | ----------------------------------------------------------- |
| POST           | `/audit/upload`         | Upload multipart (`file`) → audit synchrone → `AuditResult` |
| GET            | `/audit/:id`            | Résumé de l'audit                                           |
| GET            | `/audit/:id/events`     | Journal des étapes                                          |
| GET            | `/audit/:id/profiling`  | Profiling complet (interne/admin)                           |
| GET            | `/audit/:id/report.pdf` | 501 — jalon M6                                              |
| POST/GET/PATCH | `/leads`, `/leads/:id`  | CRM leads                                                   |
| GET            | `/health`               | Healthcheck                                                 |

## Pipeline (voir doc d'architecture du 12/07/2026)

- **M1 Ingest** (`app/pipeline/ingest.py`) : .sav (labels + missing values SPSS via
  pyreadstat), .xlsx/.xls (feuilles masquées détectées), .csv (encodage + séparateur
  auto). Original en lecture seule.
- **M2 Profile** (`app/pipeline/profile.py`) : structure, identifiants, doublons,
  types, codes manquants suspects (999, -1, "NA"…), stats descriptives, outliers IQR,
  manquants (global/variable/patient/blocs), dates, PII.
- **Score v0** (`app/pipeline/score.py`) : provisoire — sera remplacé par la grille
  8 domaines + plafonds (M3).
- À venir : M3 grille de score complète, M4 LLM-1 (dictionnaire + règles DSL),
  M5 LLM-2 (classification + verdict), M6 rapport PDF, M8 nettoyage payant.

## Config (variables d'environnement)

`DATABASE_URL` (Postgres en prod, SQLite par défaut), `STORAGE_DIR`,
`CORS_ORIGINS`, `FILE_RETENTION_DAYS`, `ANTHROPIC_API_KEY` (M4+).

## Déploiement Railway

Service Python, root directory `backend`, start command :
`uvicorn app.main:app --host 0.0.0.0 --port $PORT` + addon Postgres + volume `/storage`.
