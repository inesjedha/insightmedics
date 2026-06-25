## Renommage de l'offre "IMRAD complet" → "Thèse complète"

Je remplace uniquement les occurrences de l'**offre** "IMRAD complet" (nom commercial). Les mentions du **format rédactionnel** ("rédaction IMRAD", "standard IMRAD") restent telles quelles, car elles désignent la structure scientifique reconnue (Introduction, Méthodes, Résultats, Discussion) — la retirer affaiblirait le discours technique.

### Fichiers touchés

- `src/routes/contact.tsx` (l.116) — nom de l'offre dans la carte de sélection.
- `src/routes/tarifs.tsx` (l.27, l.98) — meta description + nom de la carte tarif.
- `src/routes/services.tsx` (l.26, l.86) — meta description + titre du service.
- `src/routes/index.tsx` (l.450) — titre dans la grille d'offres de la landing.

### Remplacements

- `"IMRAD complet"` → `"Thèse complète"` (5 endroits)
- `"Accompagnement IMRAD complet"` → `"Accompagnement thèse complète"` (2 endroits : tarifs meta + services title)

### Ce qui reste inchangé

- "rédaction IMRAD", "standard IMRAD" (index.tsx) : terminologie scientifique standard, conservée.
- Dis-moi si tu veux aussi remplacer ces mentions-là.
