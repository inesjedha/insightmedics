import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Sigma } from "lucide-react";
import { listAnalyses } from "@/lib/api/client";
import { AdminPageHeader, ErrorBanner, RefreshButton } from "@/components/admin/AdminUi";
import { useLoad } from "@/components/admin/useLoad";
import { AnalysisStatusBadge } from "@/components/admin/AnalysisStatusBadge";

export const Route = createFileRoute("/admin/analyses/")({
  component: AdminAnalyses,
});

function AdminAnalyses() {
  const { data, loading, error, reload } = useLoad(listAnalyses);
  const rows = data ?? [];
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Analyses"
        description="Offre « Analyses + résultats » (500 DT) : commandée depuis un audit livré, page Audits."
        action={<RefreshButton onClick={reload} loading={loading} />}
      />
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-md border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          Aucune analyse commandée. Sur la page Audits, le bouton « Analyse 500 DT » d'un audit
          livré en crée une.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Audit</th>
                <th className="px-4 py-3">Base corrigée</th>
                <th className="px-4 py-3">Étape</th>
                <th className="px-4 py-3">Mise à jour</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/analyses/$id"
                      params={{ id: a.id }}
                      className="flex items-center gap-2 font-medium text-brand hover:underline"
                    >
                      <Sigma className="h-4 w-4 shrink-0" />
                      {a.auditFileName ?? a.auditId}
                    </Link>
                    <div className="font-mono text-[11px] text-muted-foreground/70">{a.id}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.fileName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <AnalysisStatusBadge status={a.status} />
                    {a.error && <p className="mt-1 max-w-xs text-xs text-destructive">{a.error}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.updatedAt).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
