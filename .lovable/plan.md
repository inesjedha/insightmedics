# Refonte du formulaire Contact — Visuel & UX

Cible : `src/routes/contact.tsx` uniquement (frontend, pas de changement de schéma API). La structure 4-section numérotée reste mais devient plus claire, plus assistante et plus polie.

## 1. Polish visuel

- **Inputs** : hauteur portée à `h-11`, icône à gauche (User / Phone / Mail / FileText) via wrapper relatif + `pl-10`, focus ring teal renforcé (`focus-visible:ring-2 ring-brand/40 border-brand/50`), transition douce.
- **Textareas** : même traitement (icône en haut-gauche, padding ajusté), coin redimensionnable masqué (`resize-none`) + hauteur min cohérente.
- **États** : bordure rouge + halo léger quand `error`, bordure teal discrète quand champ valide (après blur).
- **Carte form** : conserve `rounded-2xl border bg-card`, ajoute un liseré décoratif `bg-gradient-to-br from-brand/5 via-transparent` en haut.
- **Section headers (01/02/03/04)** : badge actuel + ligne horizontale fine à droite pour aérer, comme sur /methode.
- **Bouton submit** : pleine largeur sur mobile, icône `Send` animée (translate-x au hover), état `submitting` avec spinner Lucide (`Loader2 animate-spin`).
- **Success state** : ajout d'un encart "prochaines étapes" (1. on vous rappelle, 2. on cadre, 3. on lance) au lieu du simple message.

## 2. UX & assistance

- **Type de projet** (nouveau champ frontend, ajouté au `message` envoyé pour ne pas casser l'API) : groupe de pills sélectionnables — Thèse / Article / Mémoire / Analyse seule / Autre. Sélection unique, accessible (radiogroup).
- **Urgence / deadline** (nouveau champ frontend) : 3 pills — < 2 semaines / 2-4 semaines / > 1 mois / pas de deadline. Concaténé dans `message` au submit (préfixe `[Type: …] [Deadline: …]`).
- **Validation au blur** : `onBlur` par champ qui revalide juste ce champ via `contactSchema.shape[name].safeParse(value)` → feedback immédiat sans attendre le submit.
- **Compteurs de caractères** : sous chaque textarea (`{value.length}/1000`), passe en `text-brand` à 80%, `text-destructive` à 100%.
- **Hints contextuels** : phrases d'aide courtes sous Problématique ("Ce que vous cherchez à comprendre") et Objectif ("Le livrable attendu — thèse complète, chapitre stats, article…").
- **Exemples cliquables** sous le champ Sujet : 2-3 chips qui pré-remplissent l'input ("Thèse rétrospective cardio", "Étude de cohorte diabète", "Revue systématique").
- **Autofocus** sur le premier champ erroné après submit échoué (scroll smooth).
- **Téléphone** : conservation `+216 …` placeholder, ajout d'un drapeau 🇹🇳 décoratif dans l'icône wrapper.

## 3. Aside (colonne droite)

Inchangée dans son contenu, mais :
- Ajout d'un bloc en tête "Réponse < 48h ouvrées" en pilule verte (rassurance immédiate).
- Cartes existantes conservées.

## Détails techniques

- Tout reste local au composant `ContactPage` + petits sous-composants (`Field`, `FormSection`, `IconInput`, `Pills`, `CharCount`).
- État ajouté : `values` (controlled inputs nécessaires pour compteurs + validation live), `touched`, `projectType`, `urgency`.
- `onSubmit` concatène `projectType` + `urgency` dans `message` final → **aucun changement** sur `createLead` / types `Lead`.
- Pas de nouvelle dépendance, on garde `lucide-react`, `zod`, shadcn.
- Pas de modification de `src/lib/api/client.ts` ni `types.ts`.

## Hors scope

- Pas de wizard multi-étapes (non choisi).
- Pas de bloc témoignage / preuve sociale dans le form (non choisi).
- Pas de modification des autres pages.
