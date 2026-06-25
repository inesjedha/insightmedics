import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { getLead, updateLead } from "@/lib/api/client";
import type { Lead, LeadStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/leads/$id")({
  component: LeadDetail,
});

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "won", label: "Client gagné" },
  { value: "lost", label: "Perdu" },
];

function toDateInputValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function LeadDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLead(id).then(setLead);
  }, [id]);

  if (!lead) {
    return (
      <div className="text-sm text-muted-foreground">Chargement…</div>
    );
  }

  const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patch: Partial<Lead> = {
      status: (fd.get("status") as LeadStatus) || lead.status,
      notes: (fd.get("notes") as string) || undefined,
      nextFollowUpAt: fd.get("nextFollowUpAt")
        ? new Date(fd.get("nextFollowUpAt") as string).toISOString()
        : undefined,
    };
    setSaving(true);
    const updated = await updateLead(lead.id, patch);
    setSaving(false);
    if (updated) setLead(updated);
  };

  const markContacted = async () => {
    const updated = await updateLead(lead.id, {
      status: "contacted",
      lastContactAt: new Date().toISOString(),
    });
    if (updated) setLead(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/admin/leads" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Retour
        </Link>
        <Button variant="outline" onClick={markContacted}>
          Marquer comme contacté
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold">
            {lead.name || "Lead sans nom"}
          </h1>
          <Badge variant="outline" className="border-border">
            {lead.source === "audit" ? "Audit" : "Contact"}
          </Badge>
          {lead.priority === "high" && (
            <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300">
              Priorité haute
            </Badge>
          )}
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Téléphone" value={lead.phone} />
          <Info label="Email" value={lead.email} />
          <Info label="Créé le" value={new Date(lead.createdAt).toLocaleString("fr-FR")} />
          <Info
            label="Dernier contact"
            value={lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleString("fr-FR") : "—"}
          />
          {lead.subject && <Info label="Sujet" value={lead.subject} className="sm:col-span-2" />}
          {lead.problem && <Info label="Problématique" value={lead.problem} className="sm:col-span-2" />}
          {lead.objective && <Info label="Objectif" value={lead.objective} className="sm:col-span-2" />}
          {lead.message && <Info label="Message" value={lead.message} className="sm:col-span-2" />}
          {lead.auditId && (
            <Info label="Audit" value={`${lead.auditId} — score ${lead.auditScore ?? "?"} /100`} className="sm:col-span-2" />
          )}
        </dl>
      </div>

      <form onSubmit={onSave} className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold">Suivi CRM</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="status">Statut</Label>
            <select
              id="status"
              name="status"
              defaultValue={lead.status}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nextFollowUpAt">Prochaine relance</Label>
            <Input
              id="nextFollowUpAt"
              name="nextFollowUpAt"
              type="date"
              defaultValue={toDateInputValue(lead.nextFollowUpAt)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes internes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={5}
            defaultValue={lead.notes ?? ""}
            placeholder="Historique d'échanges, contexte, devis envoyé…"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>

      <div>
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/admin/leads" })}
        >
          Retour à la liste
        </Button>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-foreground">{value}</dd>
    </div>
  );
}
