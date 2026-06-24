
# Insights Medics — Proposition v1 (révisée : backend séparé)

Tu gères le backend toi-même → on découple **clairement** : ce projet Lovable = **frontend uniquement** (vitrine + UI du module audit + formulaire commande). Le backend (API REST/HTTP) est un service séparé que tu héberges où tu veux. Le frontend l'appelle via `fetch` avec une URL configurée par variable d'env.

## 1. Stack proposée

### Frontend (ce projet)
- **TanStack Start (React 19 + Vite 7, TypeScript strict)** — déjà en place. SSR/SSG pour SEO vitrine (acquisition Facebook = trafic mobile), file-based routing, server functions utilisées **uniquement comme proxy léger** vers ton backend (cache, header d'auth, validation Zod) — pas de logique métier côté Lovable.
- **Tailwind v4 + shadcn/ui** — design médical sobre, mobile-first, i18n FR par dictionnaires JSON (EN plus tard).
- **TanStack Query** — déjà câblé pour les appels backend (cache, retry, suspense).
- **Web Crypto API** — chiffrement client-side du fichier avant upload (défense en profondeur).
- **Vitest** — tests sur la logique critique côté front (validation cadrage, helpers).
- Config 100% par variables d'env : `VITE_API_BASE_URL`, `VITE_MAX_UPLOAD_MB`, etc.

### Backend (toi — hors de ce projet)
Stack que je te recommande, à toi de valider :
- **Python (FastAPI)** — naturel vu pyreadstat/pandas/scipy ; un seul langage end-to-end avec le sandbox.
- **Exécution sandbox** : **E2B Sandboxes** (microVMs jetables, pyreadstat/pandas/scipy préinstallables, sans réseau, timeout natif) — recommandé v1. Alternative souveraine : worker Docker + gVisor sur Fly.io/Hetzner.
- **Stockage** : S3-compatible (R2, S3, MinIO self-hosted) chiffré au repos + chiffrement applicatif AES-256-GCM.
- **DB** : Postgres (jobs, métadonnées, audit log). `pg_cron` pour la purge.
- **LLM** : provider-agnostique via une abstraction (OpenAI, Anthropic, Gemini, OpenRouter) — clés en env.
- **PDF** : hybride — graphiques matplotlib dans le sandbox, mise en page finale via WeasyPrint (HTML/CSS → PDF, brandable, FR-friendly). Alternative : reportlab full Python.
- **Email** : Resend / Postmark / SES pour le formulaire commande.

### Contrat d'API (ce qu'on définit ensemble)
Le frontend a besoin de ces endpoints. Je le designerai en OpenAPI dès l'étape 2 :

```
POST   /api/audit/upload          → multipart fichier chiffré + checksum  → { jobId, uploadUrl }
POST   /api/audit/:jobId/cadrage  → JSON questionnaire                     → { ok }
POST   /api/audit/:jobId/start    → lance le pipeline                      → { status }
GET    /api/audit/:jobId/status   → polling                                → { status, progress, step }
GET    /api/audit/:jobId/report   → PDF stream + score                     → file
DELETE /api/audit/:jobId          → purge anticipée                        → { ok }
POST   /api/contact               → formulaire vitrine
POST   /api/order                 → formulaire commande humaine (envoie email)
```

Auth v1 : token signé court (JWT HS256) attaché au `jobId` et stocké en `httpOnly` cookie — pas de comptes utilisateurs (hors périmètre v1). CORS strict sur le domaine front.

## 2. Architecture — garantir « zéro chiffre halluciné »

```text
┌──────────────────────────────────────────────────┐
│  Frontend (ce projet) — vitrine, UI, polling     │
│  - Chiffre le fichier (Web Crypto) avant upload  │
│  - N'a AUCUNE logique d'analyse                  │
└────────────────────┬─────────────────────────────┘
                     │ HTTPS + JWT
┌────────────────────▼─────────────────────────────┐
│  Backend (Python/FastAPI) — TON service          │
│                                                  │
│  Orchestrateur                                   │
│   1. Reçoit fichier chiffré, déchiffre, stocke   │
│   2. Anonymise (module testé) → mapping chiffré  │
│   3. Pipeline LLM + Sandbox                      │
│                                                  │
│   ┌──────────┐  prompts/  ┌─────────────────┐    │
│   │   LLM    │ ──code────▶│ Sandbox E2B     │    │
│   │ provider │◀──JSON─────│ pandas/scipy/…  │    │
│   └────┬─────┘            └─────────────────┘    │
│        │ narratif (texte seul, 0 chiffre)        │
│        ▼                                         │
│   AuditResult typé (Pydantic) :                  │
│     metrics: {...}        ← code exécuté         │
│     score: calc Python    ← formule déterministe │
│     narrative: {strings}  ← LLM, lint anti-digit │
│        │                                         │
│        ▼                                         │
│   Renderer PDF (WeasyPrint)                      │
│   Template lit metrics.* et narrative.*          │
│   séparément → impossible d'injecter un          │
│   chiffre non issu de metrics                    │
└──────────────────────────────────────────────────┘
```

**Invariants structurels (à implémenter côté backend) :**
- Type `Narrative` = uniquement des `str` ; aucun champ numérique.
- Template PDF : tableaux/scores lus depuis `metrics` (code), interprétations depuis `narrative` (LLM).
- **Score /100 calculé en Python**, jamais demandé au LLM. Barème versionné et affiché.
- Prompt système interdit les chiffres dans le narratif ; **linter post-LLM** rejette tout output narratif contenant des digits hors whitelist.
- Sandbox **sans réseau**, timeout court, FS isolé, détruit après chaque audit.
- Sorties code validées par schéma Pydantic avant injection.

**Chiffrement + purge :**
- Fichier chiffré côté **client** (Web Crypto) → en transit + au repos.
- Mapping anonymisation chiffré séparément (clé distincte).
- `pg_cron` purge horaire, durée configurable (`AUDIT_RETENTION_DAYS`, défaut 30 jours).
- Aucune PII dans les logs (helper logging qui strippe).

**Branchement prompts de Hamza :** fichiers `prompts/cadrage.md`, `prompts/audit.md`, `prompts/recommandations.md` avec placeholders `{{contexte}}`, `{{sorties_code}}`. Provider et modèle LLM via env.

## 3. Découpage en étapes livrables (frontend Lovable)

Chaque étape = livrable testable, arrêt pour ta validation.

1. **Squelette + Vitrine** — routes (`/`, `/services`, `/methode`, `/tarifs`, `/contact`), design system, SEO/OG par route, responsive mobile-first, footer/header. Formulaire contact → mock endpoint (à brancher quand backend prêt).
2. **UI Upload + checkbox responsabilité + explication transparence** — composants, validation type/taille fichier, chiffrement client-side, barre de progression, gestion d'erreurs. Backend mocké via MSW pour tester sans dépendance.
3. **UI Questionnaire de cadrage multi-étapes** — schéma Zod, validation, persistance locale (resume si reload), envoi au backend.
4. **UI Suivi d'audit + polling** — page status (étapes en cours, progress), gestion timeout/erreurs, retry.
5. **UI Téléchargement rapport + score visuel** — page résultat avec score animé, preview/téléchargement PDF, CTA vers prestation humaine.
6. **Page Commande humaine** — formulaire brief structuré (POST `/api/order`).
7. **Hardening front** — rate limit côté UI, états de chargement partout, accessibilité (a11y), checklist mobile.

Pendant que je code le front, tu peux développer le backend en parallèle ; on synchronise sur le contrat OpenAPI.

## 4. Questions à clarifier avant de coder

**Contrat & intégration**
1. URL du backend en dev/prod (je mets juste `VITE_API_BASE_URL` vide pour l'instant et tu me donneras l'URL plus tard ?). Tu veux que je mocke avec **MSW** pour développer le front sans attendre ?
2. Le contrat d'API ci-dessus te convient ? Tu veux ajuster avant que je le fige en types TS ?
3. Auth v1 : JWT court-vivant attaché au `jobId` en cookie httpOnly, ok ? Ou tu préfères un simple token opaque retourné à l'upload et stocké en `sessionStorage` ?

**Produit / UX**
4. **Taille max fichier** côté UI (50 Mo ? 200 Mo ?) — impacte la stratégie d'upload (single-shot vs chunked/resumable).
5. **Rétention par défaut** — j'affiche « 30 jours » dans le texte de transparence ? Configurable ou fixe ?
6. **Pendant l'audit** : on garde la page ouverte (polling) ou on envoie un email à la fin ? Si email, j'ai besoin du champ email à l'upload.
7. **Téléchargement rapport** : seulement PDF, ou aussi un preview HTML dans l'app ?

**Branding / design**
8. Charte graphique existante (logo, couleurs, typo) ou je propose ? Si je propose : médical sobre, palette bleu nuit + vert clinique + blanc, typo Inter ou Manrope, ton sérieux mais pédagogique (cible thésards stressés).
9. Tu as déjà un nom de domaine / logo Insights Medics à utiliser ?

**Périmètre vitrine**
10. Tarifs publics affichés ou page « sur devis » avec CTA contact ?
11. Témoignages/cas clients à intégrer dès la v1 (tu as du contenu) ou placeholders pour l'instant ?

Dis-moi tes réponses (même partielles) et je lance l'étape 1.
