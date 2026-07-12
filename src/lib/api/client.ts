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

import type { AuditEvent, AuditResult, Lead } from "./types";
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
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leads`);
  if (!res.ok) throw new Error("Erreur réseau");
  return (await res.json()) as Lead[];
}

export async function getLead(id: string): Promise<Lead | null> {
  if (USE_MOCK) return readDb().leads.find((l) => l.id === id) ?? null;
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leads/${id}`);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  return (await res.json()) as Lead;
}

// --- AUDIT (mock simule un run Python côté backend) ---

export interface RunAuditOptions {
  file: File;
  onEvent?: (evt: AuditEvent) => void;
}

export async function runAudit({ file, onEvent }: RunAuditOptions): Promise<AuditResult> {
  if (!USE_MOCK) {
    // Backend réel
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/audit/upload`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error("Erreur lors de l'audit");
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
