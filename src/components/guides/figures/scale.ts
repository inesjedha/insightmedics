/**
 * Outils communs aux schémas des guides : largeurs de rendu, échelles, format des nombres et
 * classes de couleur. Les couleurs passent uniquement par les variables du thème (clair et
 * sombre), via les classes Tailwind `fill-*` et `stroke-*`.
 */

/** Largeur de dessin sur téléphone (zone utile ≈ 294 à 360 px) et sur grand écran (≈ 600 px). */
export const NARROW = 330;
export const WIDE = 600;

/** Corps de texte des schémas, en unités du viewBox : jamais moins de 11 px une fois affiché. */
export const FONT = 13;

/** Échelle linéaire : domaine [d0, d1] vers [r0, r1]. */
export const lin = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

/** Échelle logarithmique (odds ratio, risque relatif). */
export const logScale = (d0: number, d1: number, r0: number, r1: number) => {
  const l0 = Math.log(d0);
  const l1 = Math.log(d1);
  return (v: number) => r0 + ((Math.log(v) - l0) / (l1 - l0)) * (r1 - r0);
};

/** Nombre à la française : virgule décimale, vrai signe moins. */
export const fr = (v: number, digits = 0) => v.toFixed(digits).replace(".", ",").replace("-", "−");

/** Pourcentage à la française, avec espace insécable : « 85,0 % ». */
export const pct = (v: number, digits = 1) => `${fr(v, digits)} %`;

/**
 * Seconde série, quand une comparaison est indispensable : gris neutre, assez éloigné du bleu
 * de la marque pour rester distinct en vision normale et en daltonisme (validé : ΔE 19,9 en
 * clair, 19,5 en sombre), et à plus de 3:1 sur le fond des figures.
 */
export const COMPARE_FILL = "fill-[#4b5563] dark:fill-[#7c8598]";
export const COMPARE_STROKE = "stroke-[#4b5563] dark:stroke-[#7c8598]";

/** Chemin d'une barre horizontale : coins arrondis côté valeur, carrée côté base. */
export const hBarPath = (x0: number, x1: number, y: number, h: number, r = 4) => {
  const rr = Math.min(r, Math.max(0, x1 - x0), h / 2);
  return `M${x0},${y}H${x1 - rr}Q${x1},${y} ${x1},${y + rr}V${y + h - rr}Q${x1},${y + h} ${
    x1 - rr
  },${y + h}H${x0}Z`;
};

/** Chemin d'une colonne verticale : coins arrondis en haut, carrée sur la ligne de base. */
export const vBarPath = (x: number, w: number, yTop: number, yBase: number, r = 4) => {
  const rr = Math.min(r, w / 2, Math.max(0, yBase - yTop));
  return `M${x},${yBase}V${yTop + rr}Q${x},${yTop} ${x + rr},${yTop}H${x + w - rr}Q${x + w},${yTop} ${
    x + w
  },${yTop + rr}V${yBase}Z`;
};
