## Dropdown indicatif pays — formulaire Contact

Remplacer le préfixe fixe `🇹🇳 +216` du champ téléphone par un **dropdown sélectionnable** (10 pays d'Afrique francophone), avec la Tunisie sélectionnée par défaut.

### Liste des 10 indicatifs proposés
| Pays | Drapeau | Indicatif |
|---|---|---|
| Tunisie (défaut) | 🇹🇳 | +216 |
| Algérie | 🇩🇿 | +213 |
| Maroc | 🇲🇦 | +212 |
| Sénégal | 🇸🇳 | +221 |
| Côte d'Ivoire | 🇨🇮 | +225 |
| Cameroun | 🇨🇲 | +237 |
| Mali | 🇲🇱 | +223 |
| Burkina Faso | 🇧🇫 | +226 |
| Guinée | 🇬🇳 | +224 |
| Niger | 🇳🇪 | +227 |

### Implémentation
- **UI** : utiliser le composant `Select` de shadcn/ui déjà disponible, intégré dans le bloc téléphone (à gauche, bordure droite, fusionné avec l'`Input`). Le trigger affiche `🇹🇳 +216`, le menu liste drapeau + nom + indicatif.
- **State** : ajouter `dialCode` (string, défaut `"+216"`) et `flag` au state local de `ContactPage`.
- **Validation** : assouplir la regex téléphone — accepter 6 à 12 chiffres (les longueurs varient selon le pays) au lieu du `\d{8}` strict tunisien. Le masque `maxLength={8}` du `Input` passe à `12` ; placeholder générique `"Numéro local"`.
- **Soumission** : envoyer `phone: \`${dialCode} ${digitsLocaux}\`` à `createLead`.
- **Fichier touché** : `src/routes/contact.tsx` uniquement (constante `COUNTRY_CODES` ajoutée en haut).
