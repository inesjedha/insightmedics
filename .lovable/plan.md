
# Améliorer le rendu et la responsivité de la page Contact

Objectif : rendre la page Contact plus aérée, plus lisible sur mobile et plus cohérente avec le style des pages Méthode / Services, sans changer la logique du formulaire ni les règles métier (validation, anti-spam, API, offres).

## Diagnostic

- Sur mobile (<640px) : la grille 3 colonnes des offres se compresse mal une fois en `sm:grid-cols-3` (les cartes deviennent trop étroites pour leur contenu : badge + nom + prix), et le champ téléphone (Select + Input) peut frôler le débordement.
- L'aside d'infos reste fixe en haut sur desktop alors qu'il pourrait être "sticky" pour rester visible pendant le remplissage du long formulaire.
- Hiérarchie : les `FormSection` (01/02/03/04) n'ont pas de respiration verticale entre elles, et le séparateur consentement/bouton est un peu plat.
- Le bouton "Envoyer" est aligné à droite sur desktop mais sans rappel de l'engagement (rappel sous 48h, gratuité du premier échange).
- L'aside InfoCards manque d'une carte "WhatsApp/Facebook" alors que ce sont des canaux mentionnés ailleurs sur le site — à vérifier mais non ajouté si non confirmé.
- Le badge "Réponse sous 48h" pourrait être intégré au PageHero plutôt que flottant au-dessus de l'aside.

## Changements proposés (UI uniquement)

### 1. Layout général
- Passer la grille principale à `lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.6fr_1fr]` et augmenter le `gap` à `gap-8 lg:gap-10`.
- Rendre l'`<aside>` **sticky** sur desktop (`lg:sticky lg:top-24 lg:self-start`) pour qu'il reste visible durant la saisie.
- Augmenter le padding intérieur de la carte formulaire (`sm:p-8 lg:p-10`) et adoucir le coin (`rounded-3xl`).

### 2. Mobile-first sur les sections critiques
- **Offres** : passer de `sm:grid-cols-3` à `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` pour éviter l'écrasement sur tablette étroite. Augmenter le padding interne et hiérarchiser (tier en petit, nom en gros, prix en bas).
- **Téléphone** : garder la structure mais ajouter `min-w-0` sur l'Input et `shrink-0` sur le Select, conformément aux règles de responsive layout. Réduire `min-w-[5.75rem]` à `min-w-[5.25rem]` pour gagner de la place sur très petit écran.
- **Pills "Délai"** : agrandir légèrement (`px-3.5 py-2 text-sm`) pour de meilleures cibles tactiles (>40px).
- **Exemples de sujet** : les pills deviennent une vraie ligne wrap avec un peu plus d'air (`gap-2`).

### 3. Hiérarchie & respirations
- Espacement des `FormSection` : passer de `space-y-8` à `space-y-10` entre sections, et ajouter un fin séparateur visuel optionnel.
- Le header de section (01/02/...) gagne un petit fond pour mieux marquer la progression.
- Les `CharCount` deviennent inline à droite du label plutôt qu'en bloc en dessous, gain de hauteur.

### 4. Aside repensé
- Badge "Réponse sous 48h" déplacé **dans le PageHero** (sous la description) au lieu de l'aside.
- Les `InfoCard` deviennent plus compactes (icône + texte en colonne unique), avec une carte "highlight" en tête : un encart "Téléphone prioritaire" légèrement accentué (fond brand/5, bordure brand/20) pour signaler le canal préféré.
- Sur mobile : l'aside passe **sous** le formulaire (déjà le cas via grid), mais on réduit sa visibilité (les 4 cartes prennent beaucoup de place) en regroupant en 2 colonnes `grid-cols-2` sur mobile sauf la carte highlight pleine largeur.

### 5. Bouton d'envoi & consentement
- Bloc consentement + bouton dans une "footer card" légèrement surélevée (`bg-surface/60 -mx-5 sm:-mx-7 px-5 sm:px-7 py-6 rounded-b-3xl border-t`) pour mieux clore le formulaire.
- Bouton "Envoyer" agrandi (`h-12 px-6 text-base`) avec à sa gauche un micro-texte rassurant : "Réponse sous 48h ouvrées · Premier échange gratuit".

### 6. Success state
- Ajouter une icône check plus marquante, et un bouton secondaire "Retour à l'accueil" en plus de "Envoyer un autre message".

## Hors-scope

- Aucune modification de la logique de validation, du schéma Zod, des appels `createLead`, de l'anti-spam, ni des offres/tarifs.
- Pas d'ajout de nouveaux champs.
- Pas de modification du `PageHero` au-delà de l'ajout d'un badge sous la description.

## Vérification

- Lecture visuelle Playwright à 375px, 768px et 1280px pour confirmer qu'aucun élément ne déborde et que l'aside sticky se comporte correctement.
- Tester la soumission (validation + success state) pour s'assurer qu'aucun comportement n'a régressé.
