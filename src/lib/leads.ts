import type { Lead, LeadSource, LeadStatus } from "@/lib/api/types";

/** Formulaire d'où vient le prospect, tel qu'affiché dans le CRM. */
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  contact: "Contact",
  audit: "Audit",
  webinaire: "Webinaire",
};

/** Libellés des statuts CRM, dans l'ordre du pipeline commercial. */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  won: "Client gagné",
  lost: "Perdu",
};

/** Un prospect encore ouvert dont la date de relance est atteinte. */
export function isFollowUpDue(lead: Lead, now = Date.now()): boolean {
  const open = lead.status === "new" || lead.status === "contacted";
  return open && !!lead.nextFollowUpAt && new Date(lead.nextFollowUpAt).getTime() <= now;
}
