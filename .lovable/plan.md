## Ajustements du formulaire Contact

### 1. Placeholder Nom
Retirer "Dr." du placeholder : `"Karim Ben Salah"` au lieu de `"Dr. Karim Ben Salah"`.

### 2. Champ Téléphone en 2 parties
Refondre le champ téléphone avec :
- **Préfixe fixe** à gauche : drapeau 🇹🇳 + `+216`, non-éditable, intégré visuellement à l'input (style "input group").
- **Saisie utilisateur** à droite : uniquement les 8 chiffres du numéro local tunisien.
- Concaténation à la soumission : `+216 ${numéro}` envoyé au backend.
- Validation adaptée : 8 chiffres requis (regex `/^\d{8}$/`), avec masque visuel optionnel `XX XXX XXX`.
- Remplace l'icône Phone par le bloc drapeau+indicatif.

### 3. Suppression des erreurs inline + indication des champs obligatoires
- **Retirer l'affichage des messages d'erreur sous chaque champ** (plus de texte rouge au blur).
- **Retirer la bordure rouge** au blur — garder uniquement la bordure teal de validation positive.
- **Ne plus valider au blur** (supprimer `onBlur` + `touched`).
- **Ajouter un astérisque rouge `*`** à côté du label de chaque champ obligatoire (Nom, Téléphone, Email, Sujet, Problématique, Objectif).
- **Mention en haut du formulaire** : "Les champs marqués d'un * sont obligatoires."
- À la soumission : si erreurs, scroll + focus sur le premier champ invalide (déjà en place) + afficher **un seul bandeau global discret** en haut du formulaire ("Merci de compléter les champs obligatoires") plutôt que des messages par champ.

### Détails techniques
- Fichier touché : `src/routes/contact.tsx` uniquement.
- Schéma Zod : modifier `phone` pour valider 8 chiffres locaux ; concaténer `+216` avant `createLead`.
- Composant `Field` : ajouter prop `required` pour rendre l'astérisque ; supprimer le rendu de `error`.
- Conserver la logique de validation Zod à la soumission (juste ne plus l'afficher inline).
