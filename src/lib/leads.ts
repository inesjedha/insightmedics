import type { Lead, LeadStatus } from "@/lib/api/types";

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
