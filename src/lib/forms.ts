import type { ZodError } from "zod";

/** Mécanismes communs aux formulaires publics (contact, demande d'audit, webinaire). */

/** Message affiché quand l'API ne répond pas : l'étudiant garde une solution de repli. */
export const SUBMIT_ERROR =
  "L'envoi a échoué. Vérifiez votre connexion et réessayez, ou écrivez-nous directement par email.";

/** Choix des pastilles qui ouvre un champ de précision libre. */
export const OTHER_CHOICE = "Autre";

/** Valeur envoyée pour un choix en pastilles : « Autre : précision » quand elle est donnée. */
export function withOther(choice: string, other: string): string | undefined {
  const detail = other.trim();
  if (choice === OTHER_CHOICE && detail) return `${OTHER_CHOICE} : ${detail}`;
  return choice || undefined;
}

/** Premier message d'erreur de chaque champ, à partir d'une validation zod. */
export function fieldErrors<K extends string>(error: ZodError): Partial<Record<K, string>> {
  const errors: Partial<Record<K, string>> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]) as K;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Amène un champ à l'écran, puis lui donne le focus une fois le défilement fini. */
export function revealField(el: HTMLElement | null | undefined) {
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => el?.focus(), 300);
}
