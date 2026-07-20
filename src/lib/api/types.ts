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

// --- Détail du score (grille Hamza en 8 domaines) — renvoyé par /audit/:id/score ---
export interface ScoreCriterion {
  critere: string;
  max: number;
  obtenu: number;
  motif: string;
  inevaluable: boolean;
}
export interface ScoreDomain {
  domaine: number;
  nom: string;
  max: number;
  obtenu: number;
  criteres: ScoreCriterion[];
}
export interface ScoreDetail {
  score_brut: number;
  score_final: number;
  niveau_qualite: string;
  interpretation: string;
  confiance: { niveau: string; raisons: string[] };
  plafonds_appliques: { defaut: string; plafond: number }[];
  domaines: ScoreDomain[];
}

// --- Jugement IA (LLM-2) — renvoyé par /audit/:id/assessment ---
export interface Finding {
  id: string;
  anomaly_class: "A" | "B" | "C" | "D";
  severity: "critique" | "majeure" | "moderee" | "mineure";
  certainty: "certain" | "probable" | "possible";
  column: string | null;
  observed: string | null;
  rule_violated: string | null;
  title_fr: string;
  explanation_fr: string;
  proposed_correction: string | null;
  requires_source_verification: boolean;
}
export interface Verdict {
  level: number;
  label: string;
  justification_fr: string;
}
export interface AiAssessment {
  findings: Finding[];
  exploitability_verdict: Verdict | null;
  executive_summary_fr: string;
  report_sections_fr: {
    limites: string;
    plan_action: string;
    plan_analyse_conditionnel: string;
  };
  pii_assessment: { column: string; risk: string; recommendation_fr: string }[];
}

export interface AuditDetail {
  events: AuditEvent[];
  scoreDetail: ScoreDetail | null;
  assessment: AiAssessment | null;
}
