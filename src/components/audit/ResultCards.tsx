import { Gauge, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AuditResult, ScoreDetail } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function DomainsCard({ scoreDetail }: { scoreDetail: ScoreDetail }) {
  return (
    <div className="mt-6 rounded-md border border-border bg-card p-6 sm:p-8">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <Gauge className="h-5 w-5 text-brand" />
        Détail du score par domaine
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Grille d'audit en 8 domaines. Note globale : {scoreDetail.score_final}/100 —{" "}
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
                    good && "bg-brand",
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
        <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
          <p className="font-semibold">Plafond appliqué</p>
          <p className="mt-1">
            Les 8 domaines totalisent {scoreDetail.score_brut}/100, mais un défaut bloquant limite
            la note à {scoreDetail.score_final}/100 :
          </p>
          <ul className="mt-1 list-disc pl-5">
            {scoreDetail.plafonds_appliques.map((p, i) => (
              <li key={i}>{p.defaut}</li>
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
  preview = false,
}: {
  result: AuditResult;
  scoreDetail: ScoreDetail | null;
  preview?: boolean;
}) {
  const scoreColor =
    result.score >= 80 ? "text-brand" : result.score >= 60 ? "text-amber-700" : "text-destructive";

  return (
    <div className="mt-6 rounded-md border border-border bg-card p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {preview ? "Score préliminaire" : "Score de qualité"}
          </p>
          <p className={cn("font-display text-7xl leading-none", scoreColor)}>
            {result.score}
            <span className="text-2xl text-muted-foreground">/100</span>
          </p>
          {preview ? (
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Indicatif · l'audit complet affine ce score
            </p>
          ) : (
            scoreDetail && (
              <p className="mt-1 text-sm font-medium text-foreground/80">
                {scoreDetail.niveau_qualite}
              </p>
            )
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Lignes" value={result.rowCount.toLocaleString("fr-FR")} />
          <Metric label="Colonnes" value={result.columnCount.toString()} />
          <Metric label="Manquants" value={`${result.missingPct}%`} />
          <Metric label="Doublons et copies" value={`${result.duplicatesPct}%`} />
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
    <div className="rounded-md border border-border bg-surface/60 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl leading-none text-foreground">{value}</div>
    </div>
  );
}

/** Alerte « relecture humaine ». `client` : audit livré (nous avons déjà les coordonnées). */
export function HumanAlert({ context = "preview" }: { context?: "preview" | "client" }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-md border border-foreground bg-highlight/50 p-5 text-foreground">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-base font-semibold">
          {context === "client"
            ? "Plusieurs alertes critiques : un expert vous recontacte."
            : "Plusieurs alertes critiques : parlez-en à un expert."}
        </p>
        <p className="mt-1 text-sm">
          {context === "client"
            ? "Un médecin et un biostatisticien relisent votre rapport et vous recontactent sous 48 h ouvrées pour en parler."
            : "Laissez vos coordonnées ci-dessous : nous vous rappelons sous 48 h ouvrées pour voir avec vous ce qui peut être corrigé, sans engagement."}
        </p>
      </div>
    </div>
  );
}
