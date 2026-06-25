## Vérification responsive du sélecteur d'indicatif

Objectif : confirmer qu'aucun pays (de `+212` à `+227`) n'est tronqué dans le `SelectTrigger` du formulaire Contact, sur mobile (375px) et tablette (768px).

### Étapes
1. Lancer Playwright headless sur `http://localhost:8080/contact` aux viewports 375×800 puis 768×1024.
2. Pour chaque indicatif de `COUNTRY_CODES`, sélectionner la valeur puis capturer un screenshot du trigger seul (`page.locator('[aria-label="Indicatif pays"]').screenshot()`).
3. Lire chaque screenshot pour vérifier visuellement l'absence de `…`.
4. Si troncature détectée sur un indicatif : élargir le `min-w` du trigger (passer de `5.75rem` à la valeur nécessaire, ex. `6.25rem`) dans `src/routes/contact.tsx`, puis re-vérifier.
5. Confirmer également que le champ numéro à droite reste utilisable (pas de débordement) sur 375px.

### Critère de succès
Sur les deux viewports, chacun des 10 indicatifs s'affiche entièrement (drapeau + `+XXX`) sans ellipsis, sans clipping, et l'input numéro garde une largeur exploitable.