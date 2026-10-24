// Client de l'API Insight Medics (backend FastAPI, voir backend/README.md).
// Une fonction par endpoint ; la mécanique HTTP commune est dans http.ts.

import { apiUrl, request, requestOrNull } from "./http";
import type {
  AiAssessment,
  AuditEvent,
  AuditResult,
  Lead,
  LeadInput,
  ClientDetail,
  LeadUpdate,
  PreviewDetail,
  ScoreDetail,
} from "./types";

export { ApiError, UnauthorizedError, getAdminKey, setAdminKey } from "./http";

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
  const [events, scoreDetail] = await Promise.all([
    requestOrNull<AuditEvent[]>(`${base}/events`),
    requestOrNull<ScoreDetail>(`${base}/score`),
  ]);
  return { events: events ?? [], scoreDetail };
}

// --- Audit : administration ---

export function listAudits(): Promise<AuditResult[]> {
  return request<AuditResult[]>("/audit", { admin: true });
}

/** Après paiement : lance l'audit IA complet (plusieurs minutes). */
export function unlockAudit(id: string): Promise<AuditResult> {
  return request<AuditResult>(`/audit/${encodeURIComponent(id)}/unlock`, {
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

export type ClientDeliverable =
  "workbook.xlsx" | "report.docx" | "base_analyse.csv" | "base_analyse.sav";

export function clientDownloadUrl(token: string, kind: ClientDeliverable): string {
  return apiUrl(`/r/${encodeURIComponent(token)}/${kind}`);
}
