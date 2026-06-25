/**
 * Helpers anti-spam zéro friction pour les formulaires publics.
 *
 * Stratégie :
 *  - Honeypot : champ texte caché, invisible aux humains. Si rempli => bot.
 *  - Délai mini : si le formulaire est soumis < MIN_FILL_MS après son montage,
 *    c'est un bot (les humains mettent toujours plusieurs secondes).
 *
 * Côté UI on simule un succès silencieux : pas d'erreur visible (les bots
 * ré-essaient s'ils détectent un échec, autant les laisser croire que tout
 * s'est bien passé).
 */

export const HONEYPOT_FIELD = "company_url";
export const MIN_FILL_MS = 2000;

export function isHoneypotTripped(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function isTooFast(mountedAt: number): boolean {
  return Date.now() - mountedAt < MIN_FILL_MS;
}

/** Styles inline pour le champ honeypot — invisible aux humains, présent au DOM. */
export const honeypotStyle: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
  left: -9999,
  top: "auto",
};
