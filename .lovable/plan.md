Aligner Services, Tarifs et Contact sur le style de la page Méthode : hero centré avec eyebrow pilule, H1 large, filet teal, cartes numérotées style "pilier", CTA final foncé avec halos, et un déroulé / structure unifié.

## Services (`src/routes/services.tsx`)

- **Hero centré** identique à Méthode :
  - Eyebrow pilule `bg-brand/10 text-brand` : "Nos services"
  - H1 : "Choisissez le périmètre qui correspond à votre étape."
  - Sous-titre + filet teal (`h-px w-16 bg-brand/40`)
- **Bannière Audit gratuit** : carte pleine largeur mise en avant (style "highlight" comme l'étape 5 de la timeline) avec liseré teal à gauche, badge "Gratuit", CTA `/audit`.
- **Grille des 3 offres payantes** (Analyses, Discussion, IMRAD) en 3 colonnes :
  - Mêmes cartes que les `Pillar` de Méthode : numérotation 01/02/03 en filigrane brand/25, icône carrée brand/10, hover `-translate-y-0.5 hover:border-brand/40 hover:shadow-md`.
  - Prix en grand sous le titre, liste features avec `CheckCircle2 text-brand`.
  - Carte IMRAD highlight (`border-l-4 border-l-brand`) + badge "Le plus complet".
- **CTA final foncé** identique à Méthode (bloc primary avec halos teal blur, 2 boutons).

## Tarifs (`src/routes/tarifs.tsx`)

- **Hero centré** même structure : eyebrow "Tarifs", H1 "Tarifs transparents en dinars tunisiens.", filet teal.
- **Grille 4 cartes** restylées comme les `Pillar` de Méthode :
  - Numérotation discrète, icône brand/10, hover relevé, IMRAD highlight liseré gauche teal.
  - Badge "Recommandé" repositionné en cohérence avec les badges Méthode (`bg-brand text-brand-foreground`).
- **Bandeau réassurance** sous la grille (style identique à l'encart "Deux allers-retours" de Méthode : rounded-2xl, icône brand/10, texte muted).
- **CTA final foncé** identique à Méthode.

## Contact (`src/routes/contact.tsx`)

- **Hero centré** : eyebrow "Contact", H1 "Parlons de votre projet.", sous-titre, filet teal.
- **Formulaire** conservé fonctionnellement mais restylé :
  - Carte `rounded-2xl border bg-card` avec un en-tête numéroté style Méthode (badge "01", "02"… pour les sections Coordonnées / Sujet / Problématique).
  - Titres de section avec petite pastille brand/10 + numéro à gauche.
  - Bouton Envoyer conservé en `bg-brand`.
- **Aside** : 3 cartes (email / délais / téléphone) restylées comme l'encart "Deux allers-retours" de Méthode :
  - Icône carrée brand/10 à gauche, titre + texte muted, fond `bg-surface/60`.
- **CTA final foncé** identique à Méthode en bas de page (rappel "Auditer ma base gratuitement" + lien vers services).

## Détails techniques transverses

- Aucune modification de logique métier (validations zod, `createLead`, routes inchangées).
- Pas de nouveaux tokens : on réutilise `brand`, `primary`, `surface`, `card`, `muted-foreground`, `border` déjà définis.
- Mêmes paddings que Méthode : `pb-4 pt-12 sm:pb-6 sm:pt-24` pour les hero, `Section` standard ensuite.
- Composant `Pillar` et bloc CTA dupliqués localement dans chaque page (pas d'extraction de composant partagé pour limiter le scope — uniquement du style).
