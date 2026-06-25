
# Refonte de la section « Services » (landing page)

## Pourquoi changer

La version actuelle aligne 4 cartes identiques avec juste un titre, un prix et une ligne de description. Résultat :
- aucune hiérarchie (l'audit gratuit a le même poids visuel qu'un pack à 1 200 DT),
- cartes de hauteurs inégales selon la longueur du texte,
- pas de détail concret sur ce qui est livré → pas de déclic d'achat,
- un seul CTA générique en bas (« Voir le détail des services »).

## Nouvelle structure proposée

```text
┌──────────────────────────────────────────────────────────────┐
│ Eyebrow : Services · Titre : "Choisissez votre formule"      │
│ Sous-titre court orienté valeur                              │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐   │
│ │ BANNIÈRE AUDIT OFFERT  (pleine largeur, ton brand soft)│   │
│ │ Icône · "Commencez par l'audit de votre base — 0 DT"   │   │
│ │ 3 puces courtes  →  [ Auditer ma base gratuitement ]   │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│ │  Analyses    │  │  Discussion  │  │  IMRAD       │         │
│ │  + résultats │  │  rédigée     │  │  COMPLET ★   │         │
│ │  500 DT      │  │  500 DT      │  │  1 200 DT    │         │
│ │              │  │              │  │              │         │
│ │ ✓ feature 1  │  │ ✓ feature 1  │  │ ✓ tout inclus│         │
│ │ ✓ feature 2  │  │ ✓ feature 2  │  │ ✓ ...        │         │
│ │ ✓ feature 3  │  │ ✓ feature 3  │  │ ✓ ...        │         │
│ │ ✓ délai      │  │ ✓ délai      │  │ ✓ délai      │         │
│ │              │  │              │  │              │         │
│ │ [ Choisir ]  │  │ [ Choisir ]  │  │ [ Choisir ★ ]│         │
│ └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                              │
│ Ligne de réassurance : paiement à la livraison · devis       │
│ personnalisé pour mémoires/articles · validation humaine     │
└──────────────────────────────────────────────────────────────┘
```

## Décisions de design

- **Hiérarchie visuelle** : l'audit gratuit sort de la grille et devient une bannière horizontale (porte d'entrée évidente). Les 3 offres payantes forment une grille `md:grid-cols-3` réellement équilibrée (au lieu de 4 colonnes serrées).
- **Carte « IMRAD complet » mise en avant** : ring brand + badge `Le plus choisi`, légère élévation, fond `bg-card` plus chaud. Pas de gradient criard — on reste sobre.
- **Cartes en `flex flex-col`** avec `flex-1` sur la zone features → hauteurs alignées même si les listes diffèrent légèrement. Le bloc prix + CTA reste collé en bas (`mt-auto`).
- **Features concrètes** (3–4 puces par carte) : ce qui est livré + délai annoncé. C'est ce qui transforme une grille de prix en argument d'achat.
- **CTA par carte** (`Choisir cette formule`) qui mène vers `/contact?offre=<slug>` (préremplit le formulaire CRM existant via query string). Pas de nouveau endpoint, pas de logique métier ajoutée.
- **Ton** : aligné sur la nouvelle copy (sobre, expert, pas de superlatifs, pas de « hallucination », pas de « écrase »).

## Contenu rédactionnel proposé

**Eyebrow** : Services
**Titre** : « Choisissez la formule qui correspond à votre étape. »
**Sous-titre** : « Commencez par l'audit offert. Ajoutez ensuite ce dont vous avez besoin — analyses, rédaction, ou accompagnement complet. »

**Bannière — Audit de base (0 DT)**
- Contrôle qualité complet de votre base
- Score sur 100 + rapport PDF
- Sans engagement, livré sous 24 h
- CTA : `Auditer ma base gratuitement`

**Carte 1 — Analyse statistique + résultats — 500 DT**
- Plan d'analyse validé par un biostatisticien
- Tests adaptés à votre question de recherche
- Tableaux et figures prêts pour la thèse
- Rédaction de la section *Résultats*
- Délai : 1 semaine

**Carte 2 — Rédaction de la discussion — 500 DT**
- Revue de la littérature ciblée
- Mise en perspective de vos résultats
- Limites et perspectives argumentées
- Références au format demandé par votre faculté
- Délai : 1 semaine

**Carte 3 — Accompagnement IMRAD complet — 1 200 DT** *(Le plus choisi)*
- Tout l'audit + analyses + résultats
- Introduction, Matériel & Méthodes, Discussion, Conclusion
- Tableaux, figures et mise en page
- Un interlocuteur unique jusqu'à la soutenance
- Délai : 2 semaines

**Ligne de réassurance sous la grille** : « Paiement à la livraison · Devis personnalisé pour articles et mémoires · Chaque livrable relu par un médecin et un biostatisticien. »

## Détails techniques

- Fichier modifié : `src/routes/index.tsx` → composant `ServicesTeaser` uniquement.
- Aucun nouveau composant externe nécessaire ; on réutilise `Button`, `Badge`, `Section`, `SectionHeader`, icônes lucide déjà importées (ajout léger : `Check`, `Star`).
- Liens CTA : `to="/contact"` avec `search={{ offre: "imrad" }}` (TanStack Router type-safe — si la route `/contact` n'accepte pas encore `search`, on passe simplement `to="/contact"` sans casser le typecheck ; le préremplissage côté contact pourra être branché plus tard).
- Aucun changement de design tokens, de site-config, ni d'autre route. Pas de logique métier touchée.

## Hors périmètre

- Pas de modification de la page `/services` ni de `/tarifs` (sera fait dans un second temps si tu valides la direction sur la landing).
- Pas de nouveaux assets / images.
- Pas de modification du formulaire de contact (le préremplissage par query string est optionnel et peut être ajouté plus tard).
