/**
 * Typographie française pour les textes affichés : espaces insécables là où un retour
 * à la ligne serait fautif (« 1 200 DT », « 48 h », « vraiment ? »).
 * Partout U+00A0 : l'espace fine (U+202F) manque à nos polices et s'afficherait collée.
 */
const NBSP = "\u00a0";

export function frTypo(text: string): string {
  return text
    .replace(/ ([?!;:»])/g, `${NBSP}$1`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/(\d)[ \u202f](\d{3})\b/g, `$1${NBSP}$2`)
    .replace(/(\d) (DT|h|%|jours?|semaines?|lignes|variables|onglets|patients)\b/g, `$1${NBSP}$2`);
}
