# Insight Medics

Audit automatisé de bases de données de recherche médicale (SPSS `.sav`, Excel, CSV) :
profiling, détection d'anomalies, score de qualité, rapport — et nettoyage rigoureux
en option payante. Marché : recherche médicale en Tunisie.

## Architecture

| Dossier    | Rôle                                  | Stack                                                  |
| ---------- | ------------------------------------- | ------------------------------------------------------ |
| `src/`     | Site + parcours d'audit + admin leads | TanStack Start (React), Tailwind, shadcn/ui            |
| `backend/` | API REST + pipeline d'audit           | FastAPI, pandas, pyreadstat — voir `backend/README.md` |

Principe clé du pipeline : **les calculs sont déterministes (Python), l'IA n'intervient
que pour l'interprétation et la rédaction, le score est calculé par code.**

## Démarrage

**Backend** (Python ≥ 3.10) :

```bash
cd backend && python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --reload-dir app --port 8000
```

**Front** (bun) :

```bash
bun install
cp .env.example .env   # pointe vers le backend local
bun run dev
```

## Qualité

CI GitHub Actions à chaque push : lint + build du front, tests du backend.
Tests backend : `cd backend && pip install -r requirements-dev.txt && pytest`.
