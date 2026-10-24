// Types des données échangées avec l'API — miroir de backend/app/schemas.py.

export type LeadSource = "contact" | "audit";
export type LeadStatus = "new" | "contacted" | "won" | "lost";
export type LeadPriority = "normal" | "high";

/** Champs envoyés par les formulaires publics ; le reste est fixé par le serveur. */
export interface LeadInput {
  source: LeadSource;
  name?: string;
  email: string;
  phone: string;
  // Formulaire de contact
  subject?: string;
  problem?: string;
  objective?: string;
  message?: string;
  // Demande de déblocage : le serveur en déduit score et priorité
  auditId?: string;
}

export interface Lead extends LeadInput {
  id: string;
  createdAt: string; // ISO
  priority: LeadPriority;
  auditScore?: number;
  // Suivi CRM
  status: LeadStatus;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  notes?: string;
}

/** Champs de suivi modifiables depuis le CRM. */
export type LeadUpdate = Partial<
  Pick<Lead, "priority" | "status" | "lastContactAt" | "nextFollowUpAt" | "notes">
>;

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
  // Parcours aperçu → paiement → audit complet
  status: "preview" | "processing" | "done" | "failed";
  isPreview: boolean;
  paid: boolean;
  /** Jeton du lien privé client (/r/:token) ; absent des réponses publiques. */
  token: string | null;
  // Vue admin uniquement
  /** Message de la dernière erreur (audit IA en échec ou interrompu). */
  error: string | null;
  /** Données purgées après la durée de conservation. */
  purged: boolean;
}

export interface AuditEvent {
  ts: string;
  level: "info" | "warn" | "critical" | "success";
  message: string;
}

// --- Détail du score (grille Hamza en 8 domaines) — renvoyé par /audit/:id/score ---
interface ScoreCriterion {
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

/** Détail public de l'aperçu gratuit. */
export interface PreviewDetail {
  events: AuditEvent[];
  scoreDetail: ScoreDetail | null;
}

/** Détail de l'audit complet, servi au client par son lien privé. */
export interface ClientDetail {
  scoreDetail: ScoreDetail | null;
  assessment: AiAssessment | null;
}
