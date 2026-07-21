import { Gauge, ClipboardList, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AiAssessment, AuditResult, Finding, ScoreDetail } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const VERDICT_STYLES: Record<number, { ring: string; text: string; bg: string }> = {
  1: {
    ring: "border-emerald-300/50",
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/5",
  },
  2: { ring: "border-brand/40", text: "text-brand", bg: "bg-brand/5" },
  3: {
    ring: "border-amber-300/50",
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500/5",
  },
  4: {
    ring: "border-orange-400/50",
    text: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-500/5",
  },
  5: { ring: "border-destructive/40", text: "text-destructive", bg: "bg-destructive/5" },
};

export function VerdictBanner({
  verdict,
  scoreDetail,
}: {
  verdict: NonNullable<AiAssessment["exploitability_verdict"]>;
  scoreDetail: ScoreDetail;
}) {
  const st = VERDICT_STYLES[verdict.level] ?? VERDICT_STYLES[3];
  return (
    <div className={cn("mt-2 rounded-2xl border p-6 sm:p-7", st.ring, st.bg)}>
      <div className="flex flex-wrap items-center gap-3">
        <Gauge className={cn("h-5 w-5", st.text)} />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Verdict d'exploitabilité
        </p>
        <Badge variant="outline" className="border-border text-muted-foreground">
          Confiance : {scoreDetail.confiance.niveau}
        </Badge>
      </div>
      <p className={cn("mt-2 font-display text-2xl font-extrabold tracking-tight", st.text)}>
        {verdict.label}
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/85">
        {verdict.justification_fr}
      </p>
    </div>
  );
}

export function ExecutiveSummaryCard({ assessment }: { assessment: AiAssessment }) {
  const r = assessment.report_sections_fr;
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <ClipboardList className="h-5 w-5 text-brand" />
        Synthèse de l'audit
      </h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
        {assessment.executive_summary_fr}
      </p>
      {r?.limites && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Limites de la base
          </h4>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
            {r.limites}
          </p>
        </div>
      )}
      {r?.plan_action && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Plan d'action recommandé
          </h4>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
            {r.plan_action}
          </p>
        </div>
      )}
      {r?.plan_analyse_conditionnel && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Analyses envisageables
          </h4>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
            {r.plan_analyse_conditionnel}
          </p>
        </div>
      )}
    </div>
  );
}

const SEVERITY_ORDER = ["critique", "majeure", "moderee", "mineure"] as const;
const SEVERITY_LABEL: Record<string, string> = {
  critique: "Critique",
  majeure: "Majeure",
  moderee: "Modérée",
  mineure: "Mineure",
};
const CLASS_LABEL: Record<string, string> = {
  A: "Erreur certaine",
  B: "Incohérence très probable",
  C: "Atypique mais plausible",
  D: "Ambiguë / à vérifier",
};

export function FindingsCard({ findings }: { findings: Finding[] }) {
  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <ShieldAlert className="h-5 w-5 text-brand" />
        Anomalies détectées
        <span className="text-sm font-normal text-muted-foreground">({findings.length})</span>
      </h3>
      <ul className="mt-4 space-y-3">
        {sorted.map((f) => {
          const crit = f.severity === "critique";
          const maj = f.severity === "majeure";
          return (
            <li
              key={f.id}
              className={cn(
                "rounded-xl border p-4",
                crit && "border-destructive/30 bg-destructive/5",
                maj && "border-amber-300/40 bg-amber-500/5",
                !crit && !maj && "border-border bg-surface/50",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-transparent font-semibold",
                    crit && "bg-destructive/15 text-destructive",
                    maj && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                    !crit && !maj && "bg-muted text-muted-foreground",
                  )}
                >
                  {SEVERITY_LABEL[f.severity] ?? f.severity}
                </Badge>
                <Badge variant="outline" className="border-border text-xs text-muted-foreground">
                  {CLASS_LABEL[f.anomaly_class] ?? f.anomaly_class}
                </Badge>
                {f.column && (
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground/80">
                    {f.column}
                  </span>
                )}
              </div>
              <p className="mt-2 font-semibold text-foreground">{f.title_fr}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">{f.explanation_fr}</p>
              {f.proposed_correction && (
                <p className="mt-2 text-sm text-foreground/80">
                  <span className="font-medium text-brand">Correction proposée : </span>
                  {f.proposed_correction}
                </p>
              )}
              {f.requires_source_verification && (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  À vérifier dans le dossier source.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DomainsCard({ scoreDetail }: { scoreDetail: ScoreDetail }) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <Gauge className="h-5 w-5 text-brand" />
        Détail du score par domaine
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Grille d'audit en 8 domaines. Note globale : {scoreDetail.score_final}/100 —{" "}
        {scoreDetail.niveau_qualite}.
      </p>
      <ul className="mt-4 space-y-3">
        {scoreDetail.domaines.map((d) => {
          const pct = d.max ? Math.round((d.obtenu / d.max) * 100) : 0;
          const good = pct >= 80;
          const mid = pct >= 55 && pct < 80;
          return (
            <li key={d.domaine}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-foreground/90">{d.nom}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {d.obtenu}/{d.max}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    good && "bg-emerald-500",
                    mid && "bg-amber-500",
                    !good && !mid && "bg-destructive",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {scoreDetail.plafonds_appliques.length > 0 && (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
          <p className="font-semibold">Plafond appliqué</p>
          <ul className="mt-1 list-disc pl-5">
            {scoreDetail.plafonds_appliques.map((p, i) => (
              <li key={i}>
                {p.defaut} → score plafonné à {p.plafond}/100
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AuditScoreCard({
  result,
  scoreDetail,
}: {
  result: AuditResult;
  scoreDetail: ScoreDetail | null;
}) {
  const scoreColor =
    result.score >= 80 ? "text-brand" : result.score >= 60 ? "text-amber-600" : "text-destructive";

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Score de qualité
          </p>
          <p className={cn("font-display text-6xl font-extrabold tracking-tight", scoreColor)}>
            {result.score}
            <span className="text-2xl text-muted-foreground">/100</span>
          </p>
          {scoreDetail && (
            <p className="mt-1 text-sm font-medium text-foreground/80">
              {scoreDetail.niveau_qualite}
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Lignes" value={result.rowCount.toLocaleString("fr-FR")} />
          <Metric label="Colonnes" value={result.columnCount.toString()} />
          <Metric label="Manquants" value={`${result.missingPct}%`} />
          <Metric label="Doublons" value={`${result.duplicatesPct}%`} />
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Observations
        </h4>
        <ul className="mt-3 space-y-2">
          {result.issues.map((iss, i) => (
            <li
              key={i}
              className={cn(
                "flex gap-2.5 rounded-md border px-3 py-2 text-sm",
                iss.level === "critical" &&
                  "border-destructive/30 bg-destructive/5 text-destructive",
                iss.level === "warn" &&
                  "border-amber-300/40 bg-amber-500/5 text-amber-700 dark:text-amber-300",
                iss.level === "info" && "border-border bg-surface text-foreground/80",
              )}
            >
              {iss.level === "critical" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{iss.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

export function HumanAlert() {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-amber-500/5 p-5 text-amber-800 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-display text-base font-semibold">
          Un expert humain reviendra vers vous sous 48h.
        </p>
        <p className="mt-1 text-sm">
          Plusieurs alertes critiques ont été détectées dans votre base. Notre équipe (médecin +
          biostatisticien) va analyser le rapport et vous recontactera personnellement par
          téléphone.
        </p>
      </div>
    </div>
  );
}
