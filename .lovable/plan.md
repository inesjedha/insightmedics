## Objectif

Élever visuellement la page `/methode` au niveau « publication scientifique premium » sans changer le contenu ni la palette. Inspiration retenue : direction V2 (clinique premium) — timeline verticale lisible, badges de rôle nets, hiérarchie typographique forte.

## Changements par section (fichier unique : `src/routes/methode.tsx`)

### 1. Hero
- Hero centré avec eyebrow en pilule (fond `bg-brand/10`, texte `text-brand`, tracking large).
- H1 plus grand (`text-4xl sm:text-5xl lg:text-6xl`), `text-balance`, dernier mot accentué en `text-brand`.
- Description en `max-w-2xl mx-auto`, `text-lg`.
- Léger filet décoratif sous le hero (séparateur fin centré, 64 px).

### 2. Trois piliers
- Numérotation visible **01 / 02 / 03** en `font-display` léger (`text-brand/30`, gros).
- Icône dans tuile arrondie + filet supérieur teal au survol (`hover:border-t-brand`).
- Cartes plus aérées (`p-7`), titre plus serré, texte secondaire en `text-muted-foreground/90`.
- Hauteur uniforme via `h-full` + grille `items-stretch`.

### 3. Frise — refonte complète en timeline verticale éditoriale
- Suppression du double rendu desktop/mobile : **une seule timeline verticale** centrée (`max-w-2xl mx-auto`), beaucoup plus lisible que la frise horizontale écrasée.
- Rail vertical fin (`w-px bg-border`) à gauche, avec un dégradé subtil top→bottom.
- Chaque étape : pastille numérotée (`w-10 h-10`, ring-4 white, bg selon rôle) + bloc carte à droite.
- Code couleur des pastilles par rôle :
  - **client (Vous)** : bordure `border-primary`, texte `text-primary`, fond `bg-card`.
  - **team (Insight Medics)** : fond `bg-primary` plein, texte `text-primary-foreground`.
  - **exchange (Échange avec vous)** : bordure double-tirets `ring-2 ring-brand/30`, fond `bg-brand/10`, texte `text-brand`.
- Badges de rôle harmonisés : pilules `uppercase tracking-widest text-[10px]` cohérentes avec les pastilles.
- **Étape 5 « Revue biostat + médecin »** mise en avant :
  - Carte légèrement plus grande (`p-6` vs `p-5`),
  - Liseré gauche `border-l-4 border-brand`,
  - Petit ruban « Validation humaine » en haut à droite (badge `bg-brand text-brand-foreground`),
  - Deux mini-avatars stylisés (ronds initiales BS / MD) sous le texte pour matérialiser les deux relecteurs.
- Encart « 2 allers-retours inclus » conservé mais restylé en bandeau pleine largeur sous la timeline, fond `bg-surface`, icône `MessageSquare`, copie inchangée.

### 4. CTA final
- Conservé en `bg-primary` mais enrichi :
  - Halo décoratif radial teal en haut-droite (`absolute -top-20 -right-20 w-64 h-64 bg-brand/20 rounded-full blur-3xl`),
  - Petit filet teal au-dessus du titre,
  - Bouton primaire passe en `bg-brand` (au lieu de surimprimer brand-on-primary) pour un contraste WCAG plus net,
  - Bouton secondaire en outline subtil.

## Détails techniques

- Aucune dépendance nouvelle. Icônes Lucide ajoutées : `MessageSquare`, `Sparkles` (étape mise en avant).
- Tokens utilisés : `primary`, `primary-foreground`, `brand`, `brand-foreground`, `border`, `card`, `surface`, `muted-foreground`. Aucune couleur en dur.
- Conservation stricte de toute la copy (eyebrows, titres, descriptions, 6 étapes, CTA).
- Responsive : timeline verticale fonctionne nativement mobile + desktop, suppression du dédoublement `lg:grid-cols-6`. Padding latéraux gérés via `Section`.
- Accessibilité : pastilles avec `aria-hidden` pour la décoration numérique, rôles annoncés via `<span class="sr-only">Rôle : …</span>`.

## Hors périmètre

- Aucun changement de copy, de palette, de polices, des composants `Section`/`SectionHeader`/`Button`.
- Aucune modification des autres pages.
- Pas d'animations Motion (effets statiques CSS seulement : `transition-colors`, `hover:`).

## Vérification

- `tsgo --noEmit`.
- Capture Playwright desktop 1280×1800 + mobile 390×900 pour comparer avant/après.
