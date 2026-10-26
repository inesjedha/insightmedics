import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminPageHeader, ErrorBanner, RefreshButton, Skeleton } from "@/components/admin/AdminUi";
import { useLoad } from "@/components/admin/useLoad";
import { formatDate, relativeDay } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listLeads } from "@/lib/api/client";
import type { Lead, LeadStatus } from "@/lib/api/types";
import { LEAD_STATUS_LABELS, isFollowUpDue } from "@/lib/leads";
import { cn } from "@/lib/utils";

const VIEWS = ["tous", "relances", "new", "contacted", "won", "lost"] as const;
type View = (typeof VIEWS)[number];

export const Route = createFileRoute("/admin/leads/")({
  validateSearch: (s: Record<string, unknown>): { vue?: View } => ({
    vue: VIEWS.includes(s.vue as View) && s.vue !== "tous" ? (s.vue as View) : undefined,
  }),
  component: LeadsPage,
});

const VIEW_LABELS: Record<View, string> = {
  tous: "Tous",
  relances: "À relancer",
  ...LEAD_STATUS_LABELS,
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-brand/10 text-brand hover:bg-brand/10",
  contacted: "bg-muted text-foreground hover:bg-muted",
  won: "bg-emerald-600/15 text-emerald-800 hover:bg-emerald-600/15",
  lost: "bg-destructive/10 text-destructive hover:bg-destructive/10",
};

function matches(view: View, l: Lead, now: number) {
  if (view === "tous") return true;
  if (view === "relances") return isFollowUpDue(l, now);
  return l.status === view;
}

function LeadsPage() {
  const { vue = "tous" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data, loading, error, reload } = useLoad(listLeads);
  const [query, setQuery] = useState("");

  const now = Date.now();
  const leads = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data],
  );
  const q = query.trim().toLowerCase();
  const shown = leads.filter(
    (l) =>
      matches(vue, l, now) &&
      (!q || [l.name, l.email, l.phone, l.subject].some((f) => f?.toLowerCase().includes(q))),
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Prospects & clients"
        description="Cliquez sur une ligne pour noter un échange ou planifier une relance."
        action={<RefreshButton onClick={reload} loading={loading} />}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filtrer">
          {VIEWS.map((v) => {
            const count = leads.filter((l) => matches(v, l, now)).length;
            const active = v === vue;
            return (
              <button
                key={v}
                role="tab"
                aria-selected={active}
                onClick={() => navigate({ search: { vue: v === "tous" ? undefined : v } })}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {VIEW_LABELS[v]}
                <span className={cn("tabular-nums", active ? "opacity-80" : "opacity-60")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative lg:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, e-mail, téléphone…"
            aria-label="Rechercher un prospect"
            className="h-10 pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Prospect</th>
                <th className="px-4 py-3 text-left font-medium">Téléphone</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Relance</th>
                <th className="px-4 py-3 text-left font-medium">Reçu</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data
                ? [0, 1, 2].map((i) => (
                    <tr key={i} className="border-t border-border">
                      <td colSpan={6} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                : shown.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        {leads.length === 0
                          ? "Aucun prospect pour l'instant. Le formulaire de contact et les demandes d'audit alimentent cette liste."
                          : "Aucun prospect ne correspond à ce filtre."}
                      </td>
                    </tr>
                  )}
              {shown.map((l) => {
                const due = isFollowUpDue(l, now);
                const open = () => navigate({ to: "/admin/leads/$id", params: { id: l.id } });
                return (
                  <tr
                    key={l.id}
                    onClick={open}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/leads/$id"
                        params={{ id: l.id }}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium hover:text-brand"
                      >
                        {l.name || "Sans nom"}
                      </Link>
                      <div className="text-xs text-muted-foreground">{l.email}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {l.phone ? (
                        <a
                          href={`tel:${l.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-brand"
                        >
                          {l.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">
                        {l.source === "audit" ? "Audit" : "Contact"}
                      </span>
                      {l.priority === "high" && (
                        <Badge className="ml-2 bg-amber-500/15 text-amber-800 hover:bg-amber-500/15">
                          Prio
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_STYLES[l.status]}>
                        {LEAD_STATUS_LABELS[l.status]}
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3",
                        due ? "font-medium text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {l.nextFollowUpAt ? relativeDay(l.nextFollowUpAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(l.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
