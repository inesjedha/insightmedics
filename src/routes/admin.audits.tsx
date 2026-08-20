import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileBarChart2, Loader2, Lock, Unlock, RefreshCw, AlertTriangle } from "lucide-react";
import { listAudits, unlockAudit, UnauthorizedError } from "@/lib/api/client";
import type { AuditResult } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/audits")({
  component: AdminAudits,
});

function AdminAudits() {
  const [audits, setAudits] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [needKey, setNeedKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setAudits(await listAudits());
      setNeedKey(false);
    } catch (e) {
      if (e instanceof UnauthorizedError) setNeedKey(true);
      else setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onUnlock = async (id: string) => {
    if (!window.confirm("Paiement reçu ? Lancer l'audit IA complet (consomme la clé IA) ?")) return;
    setUnlocking(id);
    setError(null);
    try {
      const updated = await unlockAudit(id);
      setAudits((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec du déblocage");
    } finally {
      setUnlocking(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Audits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Débloquez un audit après réception du paiement (50 DT) — l'audit IA complet se lance.
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

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : audits.length === 0 && !needKey ? (
        <p className="text-sm text-muted-foreground">Aucun audit pour l'instant.</p>
      ) : audits.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
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
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <FileBarChart2 className="h-4 w-4 shrink-0 text-brand" />
                      {a.fileName}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{a.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    {a.paid ? (
                      <Badge className="border-transparent bg-brand/15 text-brand">
                        Payé · complet
                      </Badge>
                    ) : a.status === "failed" ? (
                      <Badge variant="outline" className="text-destructive">
                        Échec
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Aperçu
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">{a.score}/100</td>
                  <td className="px-4 py-3 text-right">
                    {a.status === "done" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-brand">
                        <Unlock className="h-3.5 w-3.5" /> débloqué
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onUnlock(a.id)}
                        disabled={unlocking === a.id}
                        className="bg-brand text-brand-foreground hover:bg-brand/90"
                      >
                        {unlocking === a.id ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Déblocage…
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-3.5 w-3.5" /> Débloquer
                          </>
                        )}
                      </Button>
                    )}
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
