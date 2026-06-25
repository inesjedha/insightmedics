## Objectif

Remplacer les 6 cartes plates actuelles par une **frise horizontale narrative** qui rend concret ce qui se passe à chaque étape, et qui met en évidence les **points de contact humains** (validation expert, échanges avec le client) — c'est ce qui manque aujourd'hui.

## Nouveau contenu (copy)

Titre de section : **« Le déroulé, étape par étape »**
Sous-titre : « Six étapes, deux points d'échange avec vous, une validation humaine systématique avant livraison. »

Chaque étape = numéro + icône + titre + 1 phrase concrète + un petit tag de rôle (« Vous » / « Insight Medics » / « Échange »).

1. **Upload** — *Vous* — « Vous déposez votre base (Excel, CSV, SPSS). Chiffrement avant envoi, aucun nom ne quitte votre poste en clair. »
2. **Anonymisation** — *Insight Medics* — « Les colonnes identifiantes sont détectées et pseudonymisées automatiquement. Une table de correspondance reste chez nous, isolée. »
3. **Cadrage** — *Échange avec vous* — « Court questionnaire + appel si besoin : objectif de la thèse, hypothèses, variables clés. C'est vous qui orientez l'analyse. »
4. **Calculs** — *Insight Medics* — « Analyses statistiques sur vos données réelles : descriptives, tests, modèles. Les sorties brutes sont conservées et traçables. »
5. **Revue humaine** — *Insight Medics* — « Un biostatisticien relit les analyses, ajuste les choix de tests, vérifie les hypothèses. Un médecin relit la cohérence clinique. »
6. **Restitution & livraison** — *Échange avec vous* — « On vous présente les résultats, on répond à vos questions, on intègre vos retours, puis on livre le rapport final + les scripts. »

Mention sous la frise : « Deux allers-retours avec vous sont inclus dans la prestation complète, pour cadrer puis pour ajuster. »

## Mise en œuvre technique

Fichier : `src/routes/methode.tsx` (uniquement).

- Supprimer `PipelineStep` (cartes plates) et la `<ol grid-cols-6>`.
- Nouveau composant interne `PipelineTimeline` :
  - **Desktop (≥ lg)** : frise horizontale.
    - Une ligne décorative continue (`absolute top-5 inset-x-0 h-px bg-border`) derrière les 6 puces numérotées rondes.
    - 6 colonnes (`grid grid-cols-6 gap-4`) — chaque colonne : puce ronde numérotée + icône au-dessus de la ligne, puis sous la ligne : badge de rôle coloré (Vous / Insight Medics / Échange), titre, phrase descriptive.
    - Les étapes 3 et 6 (Échange) reçoivent un badge `bg-brand/10 text-brand` + un petit liseré différent pour signaler le point de contact client.
    - L'étape 5 (Revue humaine) reçoit un petit picto `UserCheck` doublé pour souligner la validation humaine.
  - **Mobile (< lg)** : pile verticale (`flex flex-col`) avec ligne verticale à gauche reliant les puces (`border-l border-border ml-4`), chaque étape en `pl-8`, même contenu.
- Sous la frise : encart léger (`rounded-lg border-dashed border-border bg-surface/40 p-4 text-sm text-muted-foreground`) avec la mention « Deux allers-retours avec vous… ».
- Réutiliser les icônes déjà importées (`Upload`, `EyeOff`, `ClipboardList`, `PlayCircle`, `UserCheck`, `PackageCheck`) — pas de nouvel import.
- Types de rôle gérés via une petite map locale `{ role: 'client' | 'team' | 'exchange' }` → classes de badge.

## Hors périmètre

- Aucun changement aux autres sections de `/methode`.
- Aucun changement de design tokens, de polices, de pages adjacentes.
- Pas de nouvelles dépendances, pas d'animation Motion (rendu CSS pur).

## Vérification

- `tsgo --noEmit` doit passer.
- Inspection visuelle desktop + mobile sur `/methode`.