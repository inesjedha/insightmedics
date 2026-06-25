## Plan — Sprint sécurité, légal, conversion & cohérence

5 chantiers groupés. Aucun ne nécessite de backend : tout reste en front, prêt à être branché plus tard.

---

### 1. Pages légales (P0-2)

Créer trois nouvelles routes statiques, accessibles via le footer et liées depuis les formulaires :

- `src/routes/mentions-legales.tsx` — éditeur du site (Insight Medics, Sousse), contact `helpinsightmedics@gmail.com`, hébergeur (placeholder à compléter), propriété intellectuelle, limites de responsabilité.
- `src/routes/confidentialite.tsx` — données collectées (nom, téléphone, email, fichier d'audit), finalités (recontact commercial, audit statistique), base légale (consentement), durée de conservation (12 mois pour les leads, purge horaire pour les fichiers d'audit conformément à la promesse), destinataires (équipe Insight Medics uniquement), droits (accès, rectification, suppression via l'email contact), sécurité.
- `src/routes/cgv.tsx` — offres et prix en DT (Analyses 600, Discussion 700, Thèse complète 1200), modalités de paiement (à la livraison), délais (1 à 2 semaines selon offre), révisions incluses, propriété du travail livré, juridiction tunisienne.

Toutes en `head()` avec `noindex` désactivé (on veut qu'elles soient indexables) mais titres courts.

Mention sous chaque page : "Dernière mise à jour : juin 2026 — version initiale, à faire valider par un juriste avant exploitation commerciale."

### 2. Consentement explicite (P0-4)

- `src/routes/audit.tsx` (formulaire d'upload) : ajouter une `Checkbox` shadcn obligatoire **avant** le bouton "Lancer l'audit", label : *"J'accepte que mon fichier soit traité pour générer l'audit et d'être recontacté(e) par Insight Medics. Voir la [politique de confidentialité](/confidentialite)."* Soumission bloquée tant que non cochée.
- `src/routes/contact.tsx` : remplacer le texte gris actuel ("En envoyant ce message, vous acceptez…") par une vraie `Checkbox` obligatoire avec lien vers `/confidentialite`.
- Ajouter la checkbox au schéma Zod (`.refine(v => v === true)`) pour bloquer côté form, sans message d'erreur intrusif (cohérent avec la pref déjà actée : pas de validation agressive).

### 3. Anti-spam honeypot (P0-6)

Approche zéro friction, pas de captcha :

- Champ texte caché (CSS `position: absolute; left: -9999px; tabindex={-1}; autoComplete="off"; aria-hidden`) nommé `website` ou `company` dans les formulaires audit + contact.
- À la soumission, si le champ est rempli → on simule un succès silencieux (pas d'envoi, pas d'erreur visible côté bot).
- Bonus : timestamp de montage du form, rejet si soumission < 2 secondes après le mount (bots typiques).
- Centraliser dans `src/lib/anti-spam.ts` (helpers `isHoneypotTripped`, `isTooFast`).

### 4. CTA Header (P1-12)

Dans `src/components/site/SiteHeader.tsx` :

- Supprimer le bouton secondaire "Commander" (redondant avec le CTA principal et peu engageant).
- Conserver uniquement le CTA principal "Auditer ma base gratuitement" → `/audit`.
- Sur mobile, le menu burger conserve l'accès à `/contact` via la liste de nav.

### 5. Composant `OfferCard` partagé (P2-22)

Aujourd'hui les cartes d'offres sont recréées en parallèle dans :
- `src/routes/index.tsx` (section Services)
- `src/routes/tarifs.tsx` (grille principale)
- `src/routes/services.tsx` (grille des 3 offres)

Avec des variantes de badge "Le plus choisi" qui divergent visuellement.

Plan :
- Créer `src/components/site/OfferCard.tsx` avec une API typée : `{ title, price, currency, duration, description, features[], highlight?: boolean, ctaLabel, ctaHref }`.
- Définir les 3 offres canoniques dans `src/lib/offers.ts` (déduplication + source unique de vérité pour les prix DT).
- Refactorer les 3 pages pour consommer `OFFERS` + `<OfferCard>`. Le badge "Le plus choisi" devient une prop `highlight` unique.

Impact : suppression d'environ 200 lignes dupliquées, garantie qu'un changement de prix se propage partout, design homogène.

---

### Détails techniques

- **Footer** (`src/components/site/Footer.tsx`) : ajouter une 4ᵉ colonne "Légal" avec les 3 liens, et un lien Facebook (icône) vers la page existante.
- **`siteConfig`** (`src/lib/site-config.ts`) : ajouter `legal: { mentions, confidentialite, cgv }` et `social: { facebook }` pour centralisation.
- **Validation** : tout reste géré par Zod, pas de nouvelle dépendance.
- **Pas de backend touché** : honeypot et consentement sont purement front, le mock localStorage continue de fonctionner.

### Hors scope (à traiter dans un sprint suivant)

- Sécurisation `/admin` (P0-1) → nécessite décision sur le mode d'auth.
- Vérité du discours audit IA (P0-3) → nécessite arbitrage : brancher le backend ou requalifier en "démo".
- Favicon + OG image (P0-7), SEO titres (P1-8), sitemap/robots (P1-9), analytics (P1-14), logo (P1-11), témoignages (P1-13).

### Livrables

5 nouveaux fichiers (3 routes légales + `OfferCard` + `offers.ts`), 1 helper anti-spam, refactor de 5 fichiers existants (header, footer, audit, contact, index/tarifs/services pour OfferCard).
