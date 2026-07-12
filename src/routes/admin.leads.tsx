import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listLeads } from "@/lib/api/client";
import type { Lead, LeadStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/leads")({
  component: LeadsPage,
});

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  won: "Client gagné",
  lost: "Perdu",
};

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  useEffect(() => {
    listLeads().then(setLeads);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Prospects & clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {leads.length} entrée(s). Cliquez sur une ligne pour gérer le suivi.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Nom</th>
                <th className="px-4 py-3 text-left font-medium">Téléphone</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Relance</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Aucun lead pour l'instant. Les soumissions du formulaire de contact et de
                    l'audit alimenteront cette table.
                  </td>
                </tr>
              )}
              {leads.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-border transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(l.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="border-border">
                      {l.source === "audit" ? "Audit" : "Contact"}
                    </Badge>
                    {l.priority === "high" && (
                      <Badge className="ml-2 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300">
                        Prio
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link to="/admin/leads/$id" params={{ id: l.id }} className="hover:text-brand">
                      {l.name || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{l.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.email}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        l.status === "won"
                          ? "bg-brand/15 text-brand hover:bg-brand/15"
                          : l.status === "lost"
                            ? "bg-destructive/15 text-destructive hover:bg-destructive/15"
                            : l.status === "contacted"
                              ? "bg-primary/10 text-primary hover:bg-primary/10"
                              : "bg-muted text-foreground hover:bg-muted"
                      }
                    >
                      {STATUS_LABEL[l.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.nextFollowUpAt
                      ? new Date(l.nextFollowUpAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
