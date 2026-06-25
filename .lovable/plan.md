# Plan — Refonte Insight Medics (frontend only)

Tout reste 100% frontend. Les soumissions et le CRM utilisent un **client API typé** (`src/lib/api/`) qui pointe vers un mock en mémoire en dev, et qui sera branché sur ton backend via une seule variable `VITE_API_BASE_URL` plus tard. Un contrat OpenAPI-friendly est documenté en commentaires JSDoc.

## 1. Hero (`src/routes/index.tsx`)

- Suppression du bloc "Tunisie" cassé.
- Emplacement logo en haut à gauche du header (`<img src={logoUrl} />` avec fallback monogramme "IM" tant que tu n'as pas uploadé).
- Deux accroches **côte à côte** (grid 2 colonnes desktop, stack mobile), chacune dans sa carte :
  - "Votre thèse de médecine prête en **2 semaines**"
  - "Vos analyses statistiques prêtes en **1 semaine**"
- Bandeau de réassurance immédiat sous le hero : badge "⏱ Délai 2 semaines" + badge "🎁 Audit IA gratuit" + CTA principal "Lancer mon audit gratuit".

## 2. Présentation "Problème → Approche"

Remplace le paragraphe "30 thèses françaises". Deux colonnes :

- **Notre constat** : stats qui bloquent, discussion qui piétine, deadline qui écrase, méthodologie floue.
- **Notre approche** : analyses statistiques rigoureuses, rédaction scientifique structurée (IMRAD), data visualisation claire, accompagnement humain.

Bandeau chiffres (uniquement vrais) :
- **+30** thèses et projets accompagnés
- **Audit gratuit** systématique
- **Touche humaine** garantie

Aucune mention de "France". Cibles affichées : étudiants en médecine · résidents · équipes hospitalières (Tunisie / Maghreb).

## 3. Section "Audit IA gratuit" (sur la home + page `/audit`)

- Titre : **"Votre base radiographiée en quelques minutes"**.
- Sous-titre : contrôle qualité, analyse de structure, pistes d'ajustement concrètes.
- 4 étapes visuelles : Upload base → Analyses temps réel → Score qualité → Rapport PDF.
- Mention discrète : *"Tous les chiffres sont calculés par exécution de code — zéro valeur hallucinée."*
- Upload accepte **tous formats** (`accept="*"` côté input, validation côté backend) : CSV, XLSX, XLS, SAV, SPSS, DTA, ODS, JSON, TXT, Parquet.
- Page `/audit` : composant `AuditUploader` (drag & drop), `AuditLiveLog` (stream d'événements simulé en dev), `AuditScoreCard`, `AuditReportRequestForm`.
- **Formulaire de récupération du rapport** : champs `téléphone` (requis, **affiché en premier, marqué prioritaire**) + `email` (requis) + case "j'accepte d'être recontacté". Validation Zod (regex tél tunisien souple : `+216` optionnel, 8 chiffres).

## 4. Positionnement IA + Humain

Nouvelle section "L'IA fait gagner du temps, l'humain garantit la qualité" :
- IA : tri rapide, détection d'anomalies, premières analyses.
- Humain : médecin + biostatisticien valident **chaque livrable** avant envoi.
- Pas de jargon technique, pas de mention "hallucinations" (sauf la phrase discrète sur la page audit).

## 5. Section Services — "3 manières de travailler avec nous"

Refonte `src/routes/services.tsx` + teaser home. Cartes avec prix affichés clairement :

| Offre | Prix |
|---|---|
| Audit de base de données | **Gratuit — 0 DT** |
| Analyse statistique + rédaction des résultats | **500 DT** |
| Rédaction de la discussion | **500 DT** |
| Accompagnement complet IMRAD (intro + M&M + résultats + discussion + conclusion) | **1 200 DT** |

Note interne (commentaire dans le code, **non affichée** au public) : intro + M&M + conclusion = supplément 100–150 DT.

Page `/tarifs` alignée sur ces 4 offres (suppression du contenu "devis sur mesure" actuel).

## 6. Formulaire de contact (`src/routes/contact.tsx`)

Refonte du schéma Zod et de l'UI :

- **Identité** : nom, email, téléphone (requis, validé).
- **Section 1 — Sujet** : champ unique court.
- **Section 2 — Problématique & Objectif** : 2 textareas distincts.
- **Message** : textarea libre.
- Submit → `api.leads.create({ source: 'contact', ... })`.

## 7. CRM Admin (frontend mocké)

Nouvelle zone `/admin` (non protégée pour l'instant, à sécuriser plus tard) :

- `/admin` : dashboard (compteurs prospects / clients gagnés / perdus / relances dues).
- `/admin/leads` : table triable (nom, email, tél, source = contact/audit, statut, dernier contact, prochaine relance, notes).
- `/admin/leads/$id` : détail + timeline + boutons "Marquer contacté" / "Changer statut" / "Planifier relance".

Données alimentées par le client API mocké (stockage `localStorage` en dev pour persister entre reloads). Quand tu branches ton backend, seul `src/lib/api/client.ts` change.

## 8. Logique audit — règle "alerte humaine"

Dans `AuditResult`, si `score < seuil` OU `criticalIssues.length > 0` :
- bandeau rouge : *"Un expert humain reviendra vers vous sous 48h."*
- création automatique d'un lead `source: 'audit', priority: 'high'` côté CRM.

Seuils configurables dans `src/lib/audit/thresholds.ts`.

## 9. Contrat API (documenté, non implémenté côté serveur)

`src/lib/api/` :
```
client.ts        // fetch wrapper + VITE_API_BASE_URL
leads.ts         // POST /leads, GET /leads, PATCH /leads/:id
audit.ts         // POST /audit/upload, GET /audit/:id/stream (SSE), GET /audit/:id/report.pdf
mock/            // implémentation en mémoire + localStorage pour le dev
```

Switch mock/real via `VITE_USE_MOCK_API=true` (par défaut en dev).

## 10. Détails techniques (section dev)

- Polices : Inter + Manrope déjà en place, on garde.
- Couleurs : design tokens existants (bleu nuit + teal), aucune couleur hardcodée.
- Logo : composant `<Logo />` avec prop `src` ; placeholder = monogramme "IM" en SVG inline tant que ton fichier n'est pas uploadé.
- i18n : tout en français, `lang="fr"` déjà configuré.
- SEO : `head()` mis à jour sur chaque route (titre + description avec nouveaux messages).
- Validation : Zod partout, messages d'erreur en français.
- Pas de Lovable Cloud, pas d'install de package serveur.

## Fichiers touchés (résumé)

**Modifiés** : `src/lib/site-config.ts`, `src/routes/index.tsx`, `src/routes/services.tsx`, `src/routes/tarifs.tsx`, `src/routes/contact.tsx`, `src/routes/audit.tsx`, `src/components/site-header.tsx` (logo).

**Créés** :
- `src/components/logo.tsx`
- `src/components/audit/` (uploader, live-log, score-card, report-form, human-alert)
- `src/lib/api/` (client + leads + audit + mock)
- `src/lib/audit/thresholds.ts`
- `src/routes/admin.tsx` (layout), `src/routes/admin.index.tsx`, `src/routes/admin.leads.tsx`, `src/routes/admin.leads.$id.tsx`

## Ce que je NE fais PAS (hors scope confirmé)

- Pas d'exécution Python réelle (ton backend).
- Pas de génération PDF côté front (mock d'un bouton "Télécharger le rapport" qui appellera ton endpoint).
- Pas d'auth admin (à sécuriser plus tard avant publication — je laisse un commentaire `TODO security` visible).
- Pas de chiffres inventés au-delà de "+30".
