import type { LeadStatus } from "@/lib/api/types";

/** Libellés des statuts CRM, dans l'ordre du pipeline commercial. */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  won: "Client gagné",
  lost: "Perdu",
};
