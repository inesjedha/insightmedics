## Problème
Sur le sélecteur d'indicatif téléphone (`+216` 🇹🇳) dans `src/routes/contact.tsx`, des points de troncature `...` s'affichent à côté de l'indicatif, car le `SelectTrigger` de shadcn applique `line-clamp-1` / largeur trop étroite sur la valeur sélectionnée.

## Correction
Dans `src/routes/contact.tsx` (lignes ~275-287), ajuster le `SelectTrigger` du dialCode pour empêcher la troncature :

- Ajouter `min-w-[5.5rem] shrink-0` et `whitespace-nowrap` sur le `SelectTrigger`.
- Envelopper le contenu de `SelectValue` avec une classe `[&>span]:line-clamp-none [&>span]:truncate-none` (ou plus simple : forcer `whitespace-nowrap` sur le span interne) afin que `+216` ne soit jamais coupé.

Aucune autre modification (logique, validation, liste pays) — purement visuel.