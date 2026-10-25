import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  FileBarChart2,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  Unlock,
} from "lucide-react";
import { listAudits, unlockAudit, UnauthorizedError } from "@/lib/api/client";
import type { AuditResult } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FULL_AUDIT_PRICE_LABEL } from "@/lib/offers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/audits")({
  component: AdminAudits,
});

/** Intervalle de rafraîchissement tant qu'un audit IA tourne (il dure plusieurs minutes). */
const POLL_MS = 5000;

function AdminAudits() {
  const [audits, setAudits] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [needKey, setNeedKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  // Erreur d'une action (déblocage) : distincte du chargement, elle n'arrête pas le suivi.
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setAudits(await listAudits());
      setNeedKey(false);
      setError(null);
    } catch (e) {
      if (e instanceof UnauthorizedError) setNeedKey(true);
      else setError(e instanceof Error ? e.message : "Erreur de chargement");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    await refresh();
    setLoading(false);
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  // Tant qu'un audit est en cours côté serveur, on rafraîchit la liste en silence
  // (arrêt dès qu'une erreur s'affiche, pour ne pas insister indéfiniment).
  const anyProcessing = audits.some((a) => a.status === "processing");
  const pollingBlocked = needKey || error !== null;
  useEffect(() => {
    if (!anyProcessing || pollingBlocked) return;
    const timer = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(timer);
  }, [anyProcessing, pollingBlocked, refresh]);

  const onUnlock = async (id: string) => {
    if (pendingId) return; // double clic : une seule demande
    if (!window.confirm("Paiement reçu ? Lancer l'audit IA complet (consomme la clé IA) ?")) return;
    setPendingId(id);
    setActionError(null);
    try {
      // Réponse immédiate (statut « processing ») : le suivi se fait par rafraîchissement.
      const updated = await unlockAudit(id);
      setAudits((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Échec du déblocage");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Audits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Débloquez un audit après réception du paiement ({FULL_AUDIT_PRICE_LABEL}) : l'audit IA
            complet se lance en arrière-plan (quelques minutes), vous pouvez quitter la page.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Rafraîchir
        </Button>
      </div>

      {needKey && (
        <div className="rounded-lg border border-amber-300/40 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300">
          Clé admin requise ou invalide. Renseignez-la dans la barre latérale, puis rafraîchissez.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : audits.length === 0 && !needKey ? (
        <p className="text-sm text-muted-foreground">Aucun audit pour l'instant.</p>
      ) : audits.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fichier</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <FileBarChart2 className="h-4 w-4 shrink-0 text-brand" />
                      {a.fileName}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{a.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge audit={a} />
                    {a.error && <p className="mt-1 max-w-xs text-xs text-destructive">{a.error}</p>}
                    {a.expiresAt && !a.purged && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.status === "done" ? "Lien client" : "Données"} conservées jusqu'au{" "}
                        {new Date(a.expiresAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">{a.score}/100</td>
                  <td className="px-4 py-3 text-right">
                    <AuditAction audit={a} pending={pendingId === a.id} onUnlock={onUnlock} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ audit }: { audit: AuditResult }) {
  if (audit.purged) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Expiré · données purgées
      </Badge>
    );
  }
  switch (audit.status) {
    case "done":
      return <Badge className="border-transparent bg-brand/15 text-brand">Payé · complet</Badge>;
    case "processing":
      return (
        <Badge variant="outline" className="gap-1 border-brand/30 text-brand">
          <Loader2 className="h-3 w-3 animate-spin" /> Audit IA en cours
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="text-destructive">
          Échec
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Aperçu
        </Badge>
      );
  }
}

function AuditAction({
  audit,
  pending,
  onUnlock,
}: {
  audit: AuditResult;
  pending: boolean;
  onUnlock: (id: string) => void;
}) {
  if (audit.status === "done") {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-brand">
          <Unlock className="h-3.5 w-3.5" /> débloqué
        </span>
        {audit.token && !audit.purged && <CopyLinkButton token={audit.token} />}
      </div>
    );
  }
  // Rien à débloquer : données purgées, ou aperçu jamais calculé (fichier illisible).
  if (audit.purged || audit.rowCount === 0) return null;
  if (audit.status === "processing") {
    return <span className="text-xs text-muted-foreground">quelques minutes…</span>;
  }
  const retry = audit.status === "failed" || Boolean(audit.error);
  return (
    <Button
      size="sm"
      onClick={() => onUnlock(audit.id)}
      disabled={pending}
      className="bg-brand text-brand-foreground hover:bg-brand/90"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Envoi…
        </>
      ) : retry ? (
        <>
          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Relancer
        </>
      ) : (
        <>
          <Lock className="mr-2 h-3.5 w-3.5" /> Débloquer
        </>
      )}
    </Button>
  );
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/r/${token}` : `/r/${token}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copiez le lien client :", url);
    }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copy}
      title="Copier le lien privé à envoyer au client"
      className="h-7 gap-1 px-2 text-xs"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-brand" /> Copié
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" /> Lien client
        </>
      )}
    </Button>
  );
}
