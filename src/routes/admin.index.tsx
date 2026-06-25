import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, BellRing, ArrowRight } from "lucide-react";
import { listLeads } from "@/lib/api/client";
import type { Lead } from "@/lib/api/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  useEffect(() => {
    listLeads().then(setLeads);
  }, []);

  const now = Date.now();
  const stats = {
    total: leads.length,
    prospects: leads.filter((l) => l.status === "new" || l.status === "contacted").length,
    won: leads.filter((l) => l.status === "won").length,
    lost: leads.filter((l) => l.status === "lost").length,
    dueFollowUps: leads.filter(
      (l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt).getTime() <= now,
    ).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d'ensemble des prospects et clients (données locales — branchera
          ton backend via VITE_API_BASE_URL).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total leads" value={stats.total} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Prospects actifs" value={stats.prospects} />
        <StatCard icon={<UserCheck className="h-4 w-4" />} label="Clients gagnés" value={stats.won} />
        <StatCard icon={<UserX className="h-4 w-4" />} label="Perdus" value={stats.lost} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">
            <BellRing className="mr-2 inline h-4 w-4 text-brand" />
            Relances à effectuer
          </h2>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {stats.dueFollowUps}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Leads dont la prochaine relance est due.
        </p>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/admin/leads">
              Ouvrir le CRM
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand">
        {icon}
      </div>
      <div className="mt-3 font-display text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
