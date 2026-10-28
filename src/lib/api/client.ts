// Client de l'API Insight Medics (backend FastAPI, voir backend/README.md).
// Une fonction par endpoint ; la mécanique HTTP commune est dans http.ts.

import { apiUrl, downloadAdmin, request, requestOrNull } from "./http";
import type {
  AiAssessment,
  AnalysisDetail,
  AnalysisSummary,
  ClientAnalysis,
  AuditEvent,
  AuditResult,
  Lead,
  LeadInput,
  ClientDetail,
  LeadUpdate,
  PreviewDetail,
  PreviewView,
  ScoreDetail,
} from "./types";

export {
  ADMIN_UNAUTHORIZED_EVENT,
  ApiError,
  UnauthorizedError,
  clearAdminKey,
  getAdminKey,
  setAdminKey,
} from "./http";

// --- Leads ---

/** Public : formulaire de contact et demande de déblocage d'audit. */
export function createLead(input: LeadInput): Promise<Lead> {
  return request<Lead>("/leads", { method: "POST", body: input });
}

export function listLeads(): Promise<Lead[]> {
  return request<Lead[]>("/leads", { admin: true });
}

export function getLead(id: string): Promise<Lead> {
  return request<Lead>(`/leads/${encodeURIComponent(id)}`, { admin: true });
}

export function updateLead(id: string, update: LeadUpdate): Promise<Lead> {
  return request<Lead>(`/leads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: update,
    admin: true,
  });
}

// --- Audit : aperçu gratuit (public) ---

/** Téléverse la base (+ protocole facultatif) et renvoie l'aperçu gratuit. */
export function uploadAudit(file: File, protocol?: File | null): Promise<AuditResult> {
  const form = new FormData();
  form.append("file", file);
  if (protocol) form.append("protocol", protocol);
  return request<AuditResult>("/audit/upload", { method: "POST", body: form });
}

/** Journal et score détaillé de l'aperçu (le jugement IA, payant, n'est servi que par /r/:token). */
export async function getPreviewDetail(id: string): Promise<PreviewDetail> {
  const base = `/audit/${encodeURIComponent(id)}`;
  const [events, view] = await Promise.all([
    requestOrNull<AuditEvent[]>(`${base}/events`),
    requestOrNull<PreviewView>(`${base}/preview`),
  ]);
  return { events: events ?? [], view };
}

// --- Audit : administration ---

export function listAudits(): Promise<AuditResult[]> {
  return request<AuditResult[]>("/audit", { admin: true });
}

/** Après paiement : démarre l'audit IA complet en tâche de fond. Répond tout de suite
 * (statut « processing ») ; suivre l'avancement avec listAudits. */
export function unlockAudit(id: string): Promise<AuditResult> {
  return request<AuditResult>(`/audit/${encodeURIComponent(id)}/unlock`, {
    method: "POST",
    admin: true,
  });
}

/** Relance l'audit IA d'un audit déjà livré (prompts améliorés) : coûte un audit IA. Le
 * lien client affiche l'ancien bilan jusqu'à ce que le nouveau soit prêt. */
export function rerunAudit(id: string): Promise<AuditResult> {
  return request<AuditResult>(`/audit/${encodeURIComponent(id)}/rerun`, {
    method: "POST",
    admin: true,
  });
}

// --- Espace client (lien privé /r/:token, sans compte) ---

/** Lève ApiError 404 (lien invalide) ou 410 (lien expiré). */
export function getClientResult(token: string): Promise<AuditResult> {
  return request<AuditResult>(`/r/${encodeURIComponent(token)}`);
}

export async function getClientDetail(token: string): Promise<ClientDetail> {
  const base = `/r/${encodeURIComponent(token)}`;
  const [scoreDetail, assessment] = await Promise.all([
    requestOrNull<ScoreDetail>(`${base}/score`),
    requestOrNull<AiAssessment>(`${base}/assessment`),
  ]);
  return { scoreDetail, assessment };
}

/** Livrable téléchargeable par l'étudiant : le classeur seul (la base nettoyée est remise
 * avec l'analyse statistique ; les autres formats restent accessibles depuis l'admin). */
type ClientDeliverable = "workbook.xlsx";

export function clientDownloadUrl(token: string, kind: ClientDeliverable): string {
  return apiUrl(`/r/${encodeURIComponent(token)}/${kind}`);
}

// --- Analyses + résultats (admin) ---

export function listAnalyses(): Promise<AnalysisSummary[]> {
  return request<AnalysisSummary[]>("/analyses", { admin: true });
}

export function getAnalysis(id: string): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(`/analyses/${encodeURIComponent(id)}`, { admin: true });
}

/** Commande l'analyse d'un audit livré (idempotent : renvoie l'analyse existante). */
export function orderAnalysis(auditId: string): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(`/audit/${encodeURIComponent(auditId)}/analysis`, {
    method: "POST",
    admin: true,
  });
}

export function uploadAnalysisBase(id: string, file: File): Promise<AnalysisDetail> {
  const form = new FormData();
  form.append("file", file);
  return request<AnalysisDetail>(`/analyses/${encodeURIComponent(id)}/base`, {
    method: "POST",
    body: form,
    admin: true,
  });
}

/** Revient à la base de l'audit (supprime la base corrigée déposée). */
export function dropAnalysisBase(id: string): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(`/analyses/${encodeURIComponent(id)}/base`, {
    method: "DELETE",
    admin: true,
  });
}

export function setAnalysisInstructions(id: string, text: string): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(`/analyses/${encodeURIComponent(id)}/instructions`, {
    method: "PUT",
    body: { text },
    admin: true,
  });
}

/** Contre-audit puis plan proposé par l'IA (tâche de fond : suivre avec getAnalysis). */
export function generateAnalysisPlan(id: string): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(`/analyses/${encodeURIComponent(id)}/plan/generate`, {
    method: "POST",
    admin: true,
  });
}

export function saveAnalysisPlan(id: string, plan: unknown): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(`/analyses/${encodeURIComponent(id)}/plan`, {
    method: "PUT",
    body: plan,
    admin: true,
  });
}

/** Plan validé : calculs puis rédaction (tâche de fond). */
export function computeAnalysis(id: string): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(`/analyses/${encodeURIComponent(id)}/compute`, {
    method: "POST",
    admin: true,
  });
}

export function deliverAnalysis(id: string): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(`/analyses/${encodeURIComponent(id)}/deliver`, {
    method: "POST",
    admin: true,
  });
}

export function downloadAnalysisFile(id: string, kind: AnalysisFile): Promise<void> {
  return downloadAdmin(`/analyses/${encodeURIComponent(id)}/${kind}`, kind);
}

// --- Analyses + résultats (étudiant, lien privé) ---

type AnalysisFile = "resultats.docx" | "resultats.xlsx";

export function getClientAnalysis(token: string): Promise<ClientAnalysis | null> {
  return requestOrNull<ClientAnalysis>(`/r/${encodeURIComponent(token)}/analysis`);
}

export function clientAnalysisUrl(token: string, kind: AnalysisFile): string {
  return apiUrl(`/r/${encodeURIComponent(token)}/analysis/${kind}`);
}
