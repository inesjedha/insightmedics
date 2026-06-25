## Objectif
Remplacer le champ "Type de projet" (pills Thèse/Article/Mémoire…) du formulaire Contact par une sélection visuelle multi-offres parmi les 4 services Insight Medics.

## Direction retenue
Cartes 2×2 (prototype v1) avec checkbox d'angle, eyebrow tier (Gratuit / Essentiel / Expertise / Le plus choisi), nom de l'offre et prix en DT en bas.

## Changements `src/routes/contact.tsx`

1. **Constantes** : supprimer `PROJECT_TYPES`. Ajouter `SERVICE_OFFERS` :
   - `audit` — Audit IA — 0 DT — tier "Gratuit"
   - `analyses` — Analyses + résultats — 500 DT — tier "Essentiel"
   - `discussion` — Discussion — 500 DT — tier "Expertise"
   - `imrad` — IMRAD complet — 1 200 DT — tier "Le plus choisi" (accent visuel)

2. **State** : remplacer `projectType: string` par `selectedOffers: string[]` (multi-sélection, toggle add/remove).

3. **UI** : nouveau composant local `OffersField` rendant la grille `grid-cols-1 sm:grid-cols-2 gap-3`. Chaque carte = `<button type="button">` (pas de label/input pour rester contrôlé React) avec :
   - bordure `border-border` → `border-brand` quand sélectionnée + fond `bg-brand/5`
   - checkbox d'angle haut-droit (carré teal coché)
   - eyebrow uppercase (teal pour Audit gratuit et IMRAD, slate pour les autres)
   - bandeau "Le plus choisi" sur la carte IMRAD
   - prix en bas, `DT` plus petit
   - hover : `border-brand/40`

4. **Layout** : remplacer le `grid sm:grid-cols-2` qui contenait `Type de projet` + `Délai souhaité` par une pile verticale (offres en pleine largeur 2×2 au-dessus, `Délai souhaité` en dessous), car les offres prennent plus de place.

5. **Soumission** : injecter les offres sélectionnées dans la chaîne `message` envoyée à `createLead`, format `Offres : Audit IA, Discussion`. Ne pas changer la signature de `createLead`.

6. **Réinitialisation** : reset `selectedOffers` à `[]` dans le `resetForm` après envoi réussi.

Aucune modification hors `src/routes/contact.tsx`.
