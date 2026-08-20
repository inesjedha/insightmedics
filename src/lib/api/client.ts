// Client API frontend.
//
// En dev : tout est stocké dans localStorage (mock).
// En prod : pointe vers VITE_API_BASE_URL si défini.
//
// Contrat REST attendu côté backend (à implémenter par le client) :
//   POST   /leads                  -> body Lead-partial, renvoie Lead
//   GET    /leads                  -> Lead[]
//   PATCH  /leads/:id              -> body Partial<Lead>, renvoie Lead
//   POST   /audit/upload           -> multipart file, renvoie { auditId }
//   GET    /audit/:id              -> AuditResult
//   GET    /audit/:id/events       -> AuditEvent[] (ou SSE)
//   GET    /audit/:id/report.pdf   -> binaire

import type {
  AiAssessment,
  AuditDetail,
  AuditEvent,
  AuditResult,
  Lead,
  ScoreDetail,
} from "./types";
import { needsHumanReview } from "@/lib/audit/thresholds";

const STORAGE_KEY = "im_mock_db_v1";
const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK_API ?? "true") !== "false" || !import.meta.env.VITE_API_BASE_URL;

interface MockDb {
  leads: Lead[];
  audits: Record<string, { result: AuditResult; events: AuditEvent[] }>;
}

function readDb(): MockDb {
  if (typeof window === "undefined") return { leads: [], audits: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { leads: [], audits: {} };
    return JSON.parse(raw) as MockDb;
  } catch {
    return { leads: [], audits: {} };
  }
}

function writeDb(db: MockDb) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// --- ADMIN (clé d'API stockée localement, envoyée en en-tête X-Admin-Key) ---

const ADMIN_KEY_STORAGE = "im_admin_key";

export class UnauthorizedError extends Error {}

export function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

export function setAdminKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
}

function adminHeaders(): Record<string, string> {
  const key = getAdminKey();
  return key ? { "X-Admin-Key": key } : {};
}

// --- LEADS ---

export async function createLead(
  data: Omit<Lead, "id" | "createdAt" | "status" | "priority"> & {
    priority?: Lead["priority"];
  },
): Promise<Lead> {
  const lead: Lead = {
    id: uid("lead"),
    createdAt: new Date().toISOString(),
    status: "new",
    priority: data.priority ?? "normal",
    ...data,
  };
  if (USE_MOCK) {
    const db = readDb();
    db.leads.unshift(lead);
    writeDb(db);
    return lead;
  }
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error("Erreur réseau");
  return (await res.json()) as Lead;
}

export async function listLeads(): Promise<Lead[]> {
  if (USE_MOCK) return readDb().leads;
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leads`, {
    headers: adminHeaders(),
  });
  if (res.status === 401) throw new UnauthorizedError("Clé admin requise ou invalide");
  if (!res.ok) throw new Error("Erreur réseau");
  return (await res.json()) as Lead[];
}

export async function getLead(id: string): Promise<Lead | null> {
  if (USE_MOCK) return readDb().leads.find((l) => l.id === id) ?? null;
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leads/${id}`, {
    headers: adminHeaders(),
  });
  if (res.status === 401) throw new UnauthorizedError("Clé admin requise ou invalide");
  if (!res.ok) return null;
  return (await res.json()) as Lead;
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<Lead | null> {
  if (USE_MOCK) {
    const db = readDb();
    const idx = db.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    db.leads[idx] = { ...db.leads[idx], ...patch };
    writeDb(db);
    return db.leads[idx];
  }
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(patch),
  });
  if (res.status === 401) throw new UnauthorizedError("Clé admin requise ou invalide");
  if (!res.ok) return null;
  return (await res.json()) as Lead;
}

// --- AUDITS (admin) ---

export async function listAudits(): Promise<AuditResult[]> {
  if (USE_MOCK) return [];
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/audit`, {
    headers: adminHeaders(),
  });
  if (res.status === 401) throw new UnauthorizedError("Clé admin requise ou invalide");
  if (!res.ok) throw new Error("Erreur réseau");
  return (await res.json()) as AuditResult[];
}

export async function unlockAudit(id: string): Promise<AuditResult> {
  if (USE_MOCK) throw new Error("Déblocage indisponible en mode démo");
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/audit/${id}/unlock`, {
    method: "POST",
    headers: adminHeaders(),
  });
  if (res.status === 401) throw new UnauthorizedError("Clé admin requise ou invalide");
  if (!res.ok) throw new Error("Erreur lors du déblocage");
  return (await res.json()) as AuditResult;
}

// --- ACCÈS CLIENT (lien privé /r/:token, sans compte) ---
//
// Le client ouvre son lien après paiement. Ces requêtes visent toujours le vrai
// backend (pas de mode mock) : la page n'a de sens qu'avec l'API branchée.

export class LinkError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "LinkError";
  }
}

function apiBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "";
}

export async function getClientResult(token: string): Promise<AuditResult> {
  const res = await fetch(`${apiBase()}/r/${encodeURIComponent(token)}`);
  if (res.status === 404) throw new LinkError(404, "Lien invalide ou audit indisponible");
  if (res.status === 410) throw new LinkError(410, "Ce lien a expiré");
  if (!res.ok) throw new LinkError(res.status, "Erreur de chargement");
  return (await res.json()) as AuditResult;
}

export async function getClientDetail(
  token: string,
): Promise<{ scoreDetail: ScoreDetail | null; assessment: AiAssessment | null }> {
  const base = apiBase();
  const t = encodeURIComponent(token);
  const safe = async <T>(url: string): Promise<T | null> => {
    try {
      const r = await fetch(url);
      return r.ok ? ((await r.json()) as T) : null;
    } catch {
      return null;
    }
  };
  const [scoreDetail, assessment] = await Promise.all([
    safe<ScoreDetail>(`${base}/r/${t}/score`),
    safe<AiAssessment>(`${base}/r/${t}/assessment`),
  ]);
  return { scoreDetail, assessment };
}

export type ClientDeliverable =
  "workbook.xlsx" | "report.docx" | "base_analyse.csv" | "base_analyse.sav";

export function clientDownloadUrl(token: string, kind: ClientDeliverable): string {
  return `${apiBase()}/r/${encodeURIComponent(token)}/${kind}`;
}

// --- AUDIT (mock simule un run Python côté backend) ---

export interface RunAuditOptions {
  file: File;
  protocol?: File | null;
  onEvent?: (evt: AuditEvent) => void;
}

/**
 * Récupère le détail complet d'un audit (score détaillé, jugement IA, journal).
 * En mode mock, renvoie des valeurs nulles : la page se contente alors du résumé.
 */
export async function getAuditDetail(id: string): Promise<AuditDetail> {
  if (USE_MOCK) {
    const db = readDb();
    return { events: db.audits[id]?.events ?? [], scoreDetail: null, assessment: null };
  }
  const base = import.meta.env.VITE_API_BASE_URL;
  const safe = async <T>(url: string): Promise<T | null> => {
    try {
      const r = await fetch(url);
      return r.ok ? ((await r.json()) as T) : null;
    } catch {
      return null;
    }
  };
  const [events, scoreDetail, assessment] = await Promise.all([
    safe<AuditEvent[]>(`${base}/audit/${id}/events`),
    safe<ScoreDetail>(`${base}/audit/${id}/score`),
    safe<AiAssessment>(`${base}/audit/${id}/assessment`),
  ]);
  return { events: events ?? [], scoreDetail, assessment };
}

export async function runAudit({ file, protocol, onEvent }: RunAuditOptions): Promise<AuditResult> {
  if (!USE_MOCK) {
    // Backend réel
    const fd = new FormData();
    fd.append("file", file);
    if (protocol) fd.append("protocol", protocol);
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/audit/upload`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      let detail = "Erreur lors de l'audit";
      try {
        const body = (await res.json()) as { detail?: string };
        if (body?.detail) detail = body.detail;
      } catch {
        /* ignore */
      }
      throw new Error(detail);
    }
    return (await res.json()) as AuditResult;
  }

  // --- MOCK : enchaîne quelques événements puis renvoie un résultat dérivé du fichier ---
  const steps: AuditEvent[] = [
    {
      ts: new Date().toISOString(),
      level: "info",
      message: `Fichier reçu : ${file.name} (${formatBytes(file.size)})`,
    },
    {
      ts: new Date().toISOString(),
      level: "info",
      message: "Anonymisation des identifiants directs…",
    },
    {
      ts: new Date().toISOString(),
      level: "info",
      message: "Exécution Python : profilage des variables…",
    },
    {
      ts: new Date().toISOString(),
      level: "info",
      message: "Détection des valeurs manquantes et des doublons…",
    },
    {
      ts: new Date().toISOString(),
      level: "info",
      message: "Calcul du score de qualité /100…",
    },
  ];

  const collected: AuditEvent[] = [];
  for (const s of steps) {
    await new Promise((r) => setTimeout(r, 500));
    const evt = { ...s, ts: new Date().toISOString() };
    collected.push(evt);
    onEvent?.(evt);
  }

  // Score pseudo-déterministe basé sur la taille du fichier (juste pour la démo)
  const seed = (file.size + file.name.length) % 100;
  const score = 55 + (seed % 40); // 55–94
  const missingPct = Math.round(((seed * 7) % 30) * 10) / 10;
  const duplicatesPct = Math.round(((seed * 3) % 9) * 10) / 10;
  const rowCount = 80 + seed * 17;
  const columnCount = 12 + (seed % 35);

  const issues: AuditResult["issues"] = [];
  if (missingPct > 15)
    issues.push({ level: "warn", label: `Taux de manquants élevé : ${missingPct}%` });
  if (duplicatesPct > 2)
    issues.push({
      level: duplicatesPct > 5 ? "critical" : "warn",
      label: `Doublons détectés : ${duplicatesPct}%`,
    });
  if (score < 70)
    issues.push({ level: "critical", label: "Score de qualité sous le seuil recommandé" });
  if (issues.length === 0)
    issues.push({ level: "info", label: "Aucune anomalie majeure détectée" });

  const critical = issues.filter((i) => i.level === "critical").length;
  const result: AuditResult = {
    id: uid("audit"),
    fileName: file.name,
    fileSize: file.size,
    startedAt: collected[0]?.ts ?? new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    score,
    rowCount,
    columnCount,
    missingPct,
    duplicatesPct,
    issues,
    needsHumanReview: needsHumanReview({
      score,
      missingPct,
      duplicatesPct,
      criticalIssues: critical,
    }),
  };

  const finalEvt: AuditEvent = {
    ts: new Date().toISOString(),
    level: result.needsHumanReview ? "warn" : "success",
    message: result.needsHumanReview
      ? "Audit terminé — relecture humaine recommandée."
      : "Audit terminé avec succès.",
  };
  collected.push(finalEvt);
  onEvent?.(finalEvt);

  const db = readDb();
  db.audits[result.id] = { result, events: collected };
  writeDb(db);

  return result;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}
