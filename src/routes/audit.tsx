import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { z } from "zod";
import {
  Upload,
  FileBarChart2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Sparkles,
  Phone,
  Mail,
  Loader2,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { runAudit, getAuditDetail, createLead, updateLead } from "@/lib/api/client";
import type { AuditEvent, AuditResult, AuditDetail } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { HONEYPOT_FIELD, honeypotStyle, isHoneypotTripped, isTooFast } from "@/lib/anti-spam";
import {
  VerdictBanner,
  ExecutiveSummaryCard,
  FindingsCard,
  DomainsCard,
  AuditScoreCard,
  HumanAlert,
} from "@/components/audit/ResultCards";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit IA gratuit — Insight Medics" },
      {
        name: "description",
        content:
          "Téléversez votre base de données. Audit qualité en quelques minutes, score /100, rapport PDF. Tous formats acceptés.",
      },
      { property: "og:title", content: "Audit IA gratuit — Insight Medics" },
      {
        property: "og:description",
        content:
          "Votre base radiographiée en quelques minutes. Score /100, rapport PDF par email & SMS.",
      },
    ],
  }),
  component: AuditPage,
});

type Phase = "idle" | "running" | "done";

function AuditPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [protocol, setProtocol] = useState<File | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    setResult(null);
    setDetail(null);
    setEvents([]);
    setError(null);
    setPhase("idle");
  };

  const start = async () => {
    if (!file) return;
    setPhase("running");
    setEvents([]);
    setResult(null);
    setDetail(null);
    setError(null);
    try {
      const r = await runAudit({
        file,
        protocol,
        onEvent: (e) => setEvents((prev) => [...prev, e]),
      });
      setResult(r);
      const d = await getAuditDetail(r.id);
      setDetail(d);
      if (d.events.length) setEvents(d.events);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setPhase("idle");
    }
  };

  return (
    <SiteLayout>
      <Section className="pb-4">
        <SectionHeader
          eyebrow="Audit IA · gratuit"
          title="Votre base radiographiée en quelques minutes."
          description="Tous les chiffres affichés sont calculés par exécution de code — zéro valeur hallucinée. La touche humaine intervient si une alerte critique est détectée."
        />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <AuditUploader file={file} onFile={onFile} disabled={phase === "running"} />
            <ProtocolUploader
              protocol={protocol}
              onProtocol={setProtocol}
              disabled={phase === "running"}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                disabled={!file || phase === "running"}
                onClick={start}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {phase === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Audit en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Lancer l'audit
                  </>
                )}
              </Button>
              {file && phase !== "running" && (
                <Button size="lg" variant="ghost" onClick={() => onFile(null)}>
                  Changer de fichier
                </Button>
              )}
            </div>
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <AuditLiveLog events={events} phase={phase} />
        </div>
      </Section>

      {phase === "done" && result && (
        <Section className="pt-0">
          {detail?.assessment?.exploitability_verdict && detail.scoreDetail && (
            <VerdictBanner
              verdict={detail.assessment.exploitability_verdict}
              scoreDetail={detail.scoreDetail}
            />
          )}
          <AuditScoreCard result={result} scoreDetail={detail?.scoreDetail ?? null} />
          {detail?.assessment?.executive_summary_fr && (
            <ExecutiveSummaryCard assessment={detail.assessment} />
          )}
          {detail?.assessment?.findings?.length ? (
            <FindingsCard findings={detail.assessment.findings} />
          ) : null}
          {detail?.scoreDetail && <DomainsCard scoreDetail={detail.scoreDetail} />}
          {result.needsHumanReview && <HumanAlert />}
          <AuditReportForm result={result} />
        </Section>
      )}
    </SiteLayout>
  );
}

function AuditUploader({
  file,
  onFile,
  disabled,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0] ?? null;
        if (f) onFile(f);
      }}
      className={cn(
        "rounded-2xl border-2 border-dashed bg-card p-8 text-center transition-colors",
        drag ? "border-brand bg-brand/5" : "border-border",
        disabled && "opacity-60",
      )}
    >
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Upload className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">Téléversez votre base de données</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Tous formats acceptés : SPSS (.sav), Excel (.xlsx, .xls), CSV, Stata (.dta), JSON, Parquet,
        etc.
      </p>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        disabled={disabled}
      />

      <div className="mt-5">
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={disabled}>
          Choisir un fichier
        </Button>
      </div>

      {file && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
          <FileBarChart2 className="h-4 w-4 text-brand" />
          <span className="font-medium">{file.name}</span>
          <span className="text-muted-foreground">· {(file.size / 1024).toFixed(1)} Ko</span>
        </div>
      )}
    </div>
  );
}

function ProtocolUploader({
  protocol,
  onProtocol,
  disabled,
}: {
  protocol: File | null;
  onProtocol: (f: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Protocole de recherche{" "}
              <span className="font-normal text-muted-foreground">(optionnel)</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Word ou PDF. Avec le protocole, l'audit évalue aussi la faisabilité de vos analyses.
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.pdf,.txt"
          className="hidden"
          onChange={(e) => onProtocol(e.target.files?.[0] ?? null)}
          disabled={disabled}
        />
        {protocol ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <FileText className="h-3.5 w-3.5 text-brand" />
            <span className="font-medium">{protocol.name}</span>
            {!disabled && (
              <button
                onClick={() => onProtocol(null)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Retirer le protocole"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            Ajouter le protocole
          </Button>
        )}
      </div>
    </div>
  );
}

function AuditLiveLog({ events, phase }: { events: AuditEvent[]; phase: Phase }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">
          <Cpu className="mr-2 inline h-4 w-4 text-brand" />
          Analyses en temps réel
        </h3>
        {phase === "running" && (
          <Badge variant="outline" className="border-brand/30 text-brand">
            En cours
          </Badge>
        )}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {events.length === 0 && phase === "idle" && (
          <li className="text-muted-foreground">
            Le journal d'analyse s'affichera ici une fois l'audit lancé.
          </li>
        )}
        {events.map((e, i) => (
          <li
            key={i}
            className={cn(
              "flex gap-3 rounded-md px-3 py-2",
              e.level === "critical" && "bg-destructive/10 text-destructive",
              e.level === "warn" && "bg-amber-500/10 text-amber-700 dark:text-amber-300",
              e.level === "success" && "bg-brand/10 text-brand",
              e.level === "info" && "text-foreground/80",
            )}
          >
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(e.ts).toLocaleTimeString()}
            </span>
            <span>{e.message}</span>
          </li>
        ))}
        {phase === "running" && (
          <li className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            L'analyse IA peut prendre 1 à 2 minutes (deux passages d'intelligence artificielle)…
          </li>
        )}
      </ul>
    </div>
  );
}

const phoneRegex = /^(\+|00)?\d[\d\s().-]{6,18}$/;
const reportSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, "Numéro trop court")
    .max(25, "Numéro trop long")
    .regex(phoneRegex, "Numéro invalide"),
  email: z.string().trim().email("Email invalide").max(255),
  name: z.string().trim().max(100).optional().or(z.literal("")),
});

function AuditReportForm({ result }: { result: AuditResult }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const mountedAtRef = useRef<number>(Date.now());

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    // Anti-spam silencieux : honeypot + soumission trop rapide => faux succès.
    if (isHoneypotTripped(data[HONEYPOT_FIELD]) || isTooFast(mountedAtRef.current)) {
      setSent(true);
      return;
    }

    if (!consent) {
      setErrors({ consent: "Acceptation requise pour continuer" });
      return;
    }

    const parsed = reportSchema.safeParse(data);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = String(i.path[0]);
        if (!fe[k]) fe[k] = i.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const lead = await createLead({
        source: "audit",
        name: parsed.data.name || undefined,
        email: parsed.data.email,
        phone: parsed.data.phone,
        auditId: result.id,
        auditScore: result.score,
        priority: result.needsHumanReview ? "high" : "normal",
      });
      if (result.needsHumanReview) {
        await updateLead(lead.id, {
          notes: `Audit ${result.score}/100 — relecture humaine requise (${result.issues.filter((i) => i.level === "critical").length} alerte(s) critique(s)).`,
        });
      }
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Download className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">Recevoir le rapport PDF complet</h3>
          <p className="text-sm text-muted-foreground">
            Nous vous envoyons le rapport par SMS et email. Le numéro est prioritaire.
          </p>
        </div>
      </div>

      {sent ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <div>
            <p className="font-semibold">Rapport en route.</p>
            <p className="mt-1 text-muted-foreground">
              Vous allez recevoir le PDF par SMS et email. Pensez à vérifier vos spams.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-5 sm:grid-cols-2" noValidate>
          {/* Honeypot anti-bot — invisible aux humains */}
          <input
            type="text"
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={honeypotStyle}
            defaultValue=""
          />

          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="phone">
                <Phone className="mr-1.5 inline h-3.5 w-3.5 text-brand" />
                Téléphone
              </Label>
              <span className="text-xs text-brand">Prioritaire</span>
            </div>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+216 ..."
              maxLength={25}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">
              <Mail className="mr-1.5 inline h-3.5 w-3.5 text-brand" />
              Email
            </Label>
            <Input id="email" name="email" type="email" required maxLength={255} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nom (optionnel)</Label>
            <Input id="name" name="name" maxLength={100} />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3.5 text-sm">
              <Checkbox
                id="audit-consent"
                checked={consent}
                onCheckedChange={(v) => {
                  setConsent(v === true);
                  if (v === true && errors.consent) {
                    setErrors((prev) => ({ ...prev, consent: undefined }));
                  }
                }}
                className="mt-0.5"
              />
              <span className="leading-relaxed text-foreground/90">
                J'accepte que mon fichier et mes coordonnées soient traités pour générer cet audit
                et d'être recontacté(e) par Insight Medics.{" "}
                <a
                  href="/confidentialite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand underline-offset-2 hover:underline"
                >
                  Politique de confidentialité
                </a>
                .
              </span>
            </label>
            {errors.consent && <p className="mt-1.5 text-xs text-destructive">{errors.consent}</p>}
          </div>

          <div className="sm:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="submit"
              disabled={sending}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {sending ? "Envoi…" : "Recevoir mon rapport"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
