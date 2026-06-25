// Types partagés entre l'UI et le client API.
// Quand tu branches ton vrai backend, ces types restent identiques.

export type LeadSource = "contact" | "audit";
export type LeadStatus = "new" | "contacted" | "won" | "lost";
export type LeadPriority = "normal" | "high";

export interface Lead {
  id: string;
  createdAt: string; // ISO
  source: LeadSource;
  priority: LeadPriority;
  // Identité
  name?: string;
  email: string;
  phone: string;
  // Contact form
  subject?: string;
  problem?: string;
  objective?: string;
  message?: string;
  // Audit form
  auditId?: string;
  auditScore?: number;
  // CRM state
  status: LeadStatus;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  notes?: string;
}

export interface AuditIssue {
  level: "info" | "warn" | "critical";
  label: string;
}

export interface AuditResult {
  id: string;
  fileName: string;
  fileSize: number;
  startedAt: string;
  finishedAt?: string;
  score: number; // /100
  rowCount: number;
  columnCount: number;
  missingPct: number;
  duplicatesPct: number;
  issues: AuditIssue[];
  needsHumanReview: boolean;
}

export interface AuditEvent {
  ts: string;
  level: "info" | "warn" | "critical" | "success";
  message: string;
}
