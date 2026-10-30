/**
 * Guides en ligne. Un guide écrit mais absent de cette liste reste un brouillon : il n'a pas
 * de page, n'apparaît ni dans la liste ni dans le sitemap, et les liens qui pointent vers lui
 * s'affichent en texte simple (voir `GuideLink`). Pour le publier : ajouter son slug ici, puis
 * l'URL au sitemap, la ligne de llms.txt et son image dans scripts/og-images.mjs.
 */
export const PUBLISHED = new Set<string>([
  "quel-test-statistique-choisir-these-medecine",
  "regression-logistique-interpreter-odds-ratio-these",
  "calculer-taille-echantillon-these-medecine",
  "preparer-base-donnees-excel-spss-these",
  "courbe-roc-seuil-optimal-these",
  "rediger-analyse-statistique-materiel-methodes-these",
  "presenter-resultats-these-tableaux-figures",
  "interpreter-valeur-p-intervalle-confiance-these",
  "etude-retrospective-dossiers-base-donnees-these",
  "presentation-soutenance-these-medecine",
  // En relecture par Dr Hamza (règles propres aux facultés) : à publier après validation.
  // "mise-en-forme-these-medecine-tunisie",
  // "mise-en-forme-these-faculte-medecine-sousse",
  // "mise-en-forme-these-faculte-medecine-tunis",
  // "mise-en-forme-these-faculte-medecine-monastir",
  // "mise-en-forme-these-faculte-medecine-sfax",
  // "etapes-these-medecine-tunisie",
]);
