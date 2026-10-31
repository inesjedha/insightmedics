import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, BellRing, FileBarChart2, Inbox, Phone, Trophy } from "lucide-react";
import { AdminPageHeader, ErrorBanner, RefreshButton, Skeleton } from "@/components/admin/AdminUi";
import { useLoad } from "@/components/admin/useLoad";
import { relativeDay } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { listAudits, listLeads } from "@/lib/api/client";
import type { AuditResult, Lead } from "@/lib/api/types";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, isFollowUpDue } from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const loadAll = () => Promise.all([listLeads(), listAudits()]);

function AdminDashboard() {
  const { data, loading, error, reload } = useLoad(loadAll);
  const [leads, audits]: [Lead[], AuditResult[]] = data ?? [[], []];
  const initial = loading && !data;

  const now = Date.now();
  const due = leads
    .filter((l) => isFollowUpDue(l, now))
    .sort((a, b) => (a.nextFollowUpAt ?? "").localeCompare(b.nextFollowUpAt ?? ""));
  const fresh = leads.filter((l) => l.status === "new");
  const recent = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const won = leads.filter((l) => l.status === "won").length;
  const auditCounts = {
    preview: audits.filter((a) => a.status === "preview" && !a.purged).length,
    processing: audits.filter((a) => a.status === "processing").length,
    done: audits.filter((a) => a.status === "done").length,
    failed: audits.filter((a) => a.status === "failed").length,
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Tableau de bord"
        description="Ce qui demande votre attention aujourd'hui."
        action={<RefreshButton onClick={reload} loading={loading} />}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          to="/admin/leads"
          search={{ vue: "relances" }}
          icon={<BellRing className="h-4 w-4" />}
          label="Relances dues"
          value={due.length}
          loading={initial}
          accent={due.length > 0}
        />
        <StatCard
          to="/admin/leads"
          search={{ vue: "new" }}
          icon={<Inbox className="h-4 w-4" />}
          label="Nouveaux prospects"
          value={fresh.length}
          loading={initial}
          accent={fresh.length > 0}
        />
        <StatCard
          to="/admin/audits"
          icon={<FileBarChart2 className="h-4 w-4" />}
          label="Audits en cours"
          value={auditCounts.processing}
          loading={initial}
        />
        <StatCard
          to="/admin/leads"
          search={{ vue: "won" }}
          icon={<Trophy className="h-4 w-4" />}
          label="Clients gagnés"
          value={won}
          loading={initial}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="À relancer"
          empty="Aucune relance due : tout est à jour."
          loading={initial}
          count={due.length}
        >
          {due.slice(0, 6).map((l) => (
            <LeadRow
              key={l.id}
              lead={l}
              meta={
                <span className="font-medium text-destructive">
                  {relativeDay(l.nextFollowUpAt ?? l.createdAt)}
                </span>
              }
            />
          ))}
        </Panel>

        <Panel
          title="Derniers prospects"
          empty="Aucun prospect pour l'instant. Le formulaire de contact et les demandes d'audit alimentent cette liste."
          loading={initial}
          count={leads.length}
          footer={
            leads.length > 0 && (
              <Link
                to="/admin/leads"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                Tous les prospects <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )
          }
        >
          {recent.map((l) => (
            <LeadRow
              key={l.id}
              lead={l}
              meta={<span className="text-muted-foreground">{relativeDay(l.createdAt)}</span>}
            />
          ))}
        </Panel>
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-sans text-base font-semibold">Audits</h2>
          <Link
            to="/admin/audits"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            Gérer les audits <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat label="Aperçus gratuits" value={auditCounts.preview} loading={initial} />
          <MiniStat label="En cours" value={auditCounts.processing} loading={initial} />
          <MiniStat label="Livrés" value={auditCounts.done} loading={initial} />
          <MiniStat
            label="En échec"
            value={auditCounts.failed}
            loading={initial}
            warn={auditCounts.failed > 0}
          />
        </dl>
      </section>
    </div>
  );
}

function StatCard({
  to,
  search,
  icon,
  label,
  value,
  loading,
  accent,
}: {
  to: "/admin/leads" | "/admin/audits";
  search?: { vue: string };
  icon: ReactNode;
  label: string;
  value: number;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      search={search as never}
      className={cn(
        "rounded-md border bg-card p-5 transition-shadow hover:shadow-offset",
        accent ? "border-foreground" : "border-border",
      )}
    >
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand">
        {icon}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-12" />
      ) : (
        <div className="mt-3 font-display text-4xl leading-none tabular-nums">{value}</div>
      )}
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Link>
  );
}

function Panel({
  title,
  count,
  empty,
  loading,
  footer,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  loading: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card">
      <h2 className="border-b border-border px-5 py-3.5 font-sans text-base font-semibold">
        {title}
      </h2>
      {loading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : count === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}
      {footer && !loading && <div className="border-t border-border px-5 py-3">{footer}</div>}
    </section>
  );
}

function LeadRow({ lead, meta }: { lead: Lead; meta: ReactNode }) {
  return (
    <li>
      <Link
        to="/admin/leads/$id"
        params={{ id: lead.id }}
        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/40"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{lead.name || lead.email}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">
              {lead.phone || "—"} · {LEAD_SOURCE_LABELS[lead.source]} ·{" "}
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 text-xs">
          {meta}
          {lead.priority === "high" && (
            <Badge className="bg-amber-500/15 text-amber-800 hover:bg-amber-500/15">Prio</Badge>
          )}
        </span>
      </Link>
    </li>
  );
}

function MiniStat({
  label,
  value,
  loading,
  warn,
}: {
  label: string;
  value: number;
  loading: boolean;
  warn?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-display text-3xl tabular-nums", warn && "text-destructive")}>
        {loading ? <Skeleton className="mt-1 h-8 w-10" /> : value}
      </dd>
    </div>
  );
}
