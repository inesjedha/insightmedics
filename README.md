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

CI GitHub Actions à chaque push :

- **Front** : `bun run lint` (ESLint), `bun run typecheck` (`tsc`), `bun run format:check`
  (Prettier), `bun run build`.
- **Backend** : `ruff check`, `mypy`, `pytest` (voir `backend/README.md`).

En local (front) : `bun run lint && bun run typecheck && bun run format:check` ;
`bun run format` applique Prettier. Backend : `cd backend && pip install -r requirements-dev.txt && pytest`.

## Structure du front

- `src/routes/` — une route par page (TanStack Router) ; les pages composent des sections.
- `src/components/site/` — blocs de mise en page partagés (Header, Footer, Section…).
- `src/components/{home,audit,contact}/` — composants de section propres à une page,
  extraits des routes pour garder les fichiers de route courts et lisibles.
- `src/components/ui/` — primitives shadcn/ui (générées, ne pas modifier à la main).
- `src/lib/` — client API, types, configuration, utilitaires.
- `src/routeTree.gen.ts` — généré par TanStack Router, ne pas éditer.
