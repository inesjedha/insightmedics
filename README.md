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

**Backend** (Python 3.12) :

```bash
cd backend && python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # puis renseigner ADMIN_API_KEY et une clé IA
uvicorn app.main:app --reload --reload-dir app --port 8000
```

**Front** (bun) :

```bash
bun install
cp .env.example .env   # VITE_API_BASE_URL → backend local (obligatoire)
bun run dev
```

Le front n'a pas de mode hors-ligne : il lui faut le backend. Sans `VITE_API_BASE_URL`,
`bun run build` échoue volontairement.

## Qualité

CI GitHub Actions à chaque push :

- **Front** : `bun run lint` (ESLint, zéro warning toléré), `bun run typecheck` (`tsc`),
  `bun run format:check` (Prettier), `bun run knip` (code et dépendances inutilisés),
  `bun run build`.
- **Backend** : `ruff check`, `mypy`, `pytest` (voir `backend/README.md`).

En local : `bun run lint && bun run typecheck && bun run format:check && bun run knip` ;
`bun run format` applique Prettier. Backend : `cd backend && pip install -r requirements-dev.txt && pytest`.

Dépendances : versions figées (`bun.lock`, `backend/requirements*.txt`). Dependabot ouvre
chaque semaine une PR de mise à jour, vérifiée par la CI.

## Workflow

Une branche par sujet, une PR vers `main`, CI verte avant fusion. Messages de commit au
format [Conventional Commits](https://www.conventionalcommits.org/fr/) :
`feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `ci:`, `docs:`.

## Structure du front

- `src/routes/` — une route par page (TanStack Router) ; les pages composent des sections.
- `src/components/site/` — blocs de mise en page partagés (Header, Footer, Section…).
- `src/components/{home,audit,contact}/` — composants de section propres à une page,
  extraits des routes pour garder les fichiers de route courts et lisibles.
- `src/components/ui/` — primitives shadcn/ui (générées, ne pas modifier à la main).
- `src/lib/api/` — accès au backend : `http.ts` (requêtes, erreurs), `client.ts` (une
  fonction par endpoint), `types.ts` (miroir de `backend/app/schemas.py`).
- `src/lib/` — configuration du site, offres et prix (`offers.ts`, source unique), utilitaires.
- `src/routeTree.gen.ts` — généré par TanStack Router, ne pas éditer.
