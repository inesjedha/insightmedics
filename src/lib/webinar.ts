import { siteConfig } from "@/lib/site-config";

/**
 * Libellés du webinaire, tous déduits de `siteConfig.webinar` : changer d'édition ne
 * demande que le titre et la date de début. Les dates sont écrites à l'heure de Tunis,
 * quel que soit le fuseau du serveur ou du visiteur.
 */

const NBSP = " ";
const start = new Date(siteConfig.webinar.startDate);

const format = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Tunis", ...options });

function timeLabel(): string {
  const parts = format({ hour: "numeric", minute: "2-digit", hourCycle: "h23" }).formatToParts(
    start,
  );
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const minute = part("minute");
  // Typographie française : « 20 h », « 20 h 30 », avec espaces insécables.
  return minute === "00" ? `${part("hour")}${NBSP}h` : `${part("hour")}${NBSP}h${NBSP}${minute}`;
}

const dayLabel = format({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
  start,
);

export const WEBINAR = {
  path: "/webinaire",
  title: siteConfig.webinar.title,
  startDate: siteConfig.webinar.startDate,
  /** « Jeudi 26 novembre 2026 » */
  dateLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
  /** « 20 h » */
  timeLabel: timeLabel(),
  /** Sujet des inscriptions dans le CRM : « Webinaire du 26 novembre ». */
  leadSubject: `Webinaire du ${format({ day: "numeric", month: "long" }).format(start)}`,
} as const;

/** Vrai tant que le webinaire n'a pas commencé : sert à retirer l'annonce de l'accueil. */
export function isWebinarUpcoming(now = Date.now()): boolean {
  return now < start.getTime();
}
