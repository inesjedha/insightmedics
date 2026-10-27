/**
 * Page de résultats de l'audit complet (lien privé /r/:token), refonte du 27/10/2026.
 *
 * Huit blocs, du plus utile au plus technique : verdict et chiffres clés, les 3 points
 * qui bloquent, ce que la base permet déjà, les questions pour le directeur de thèse, le
 * plan en 3 étapes, l'offre d'analyse, le détail replié, le classeur Excel.
 * Les audits antérieurs à la refonte n'ont pas les champs courts (headline,
 * blocking_points, analysis_map) : chaque bloc a un repli construit sur les anciens champs.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Download, FileSpreadsheet, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AiAssessment,
  AnalysisMap,
  AuditResult,
  BlockingPoint,
  ClientDecision,
  Finding,
  ScoreDetail,
} from "@/lib/api/types";

const ANALYSIS_PRICE = "500 DT";

function fr(n: number | string): string {
  return String(n).replace(".", ",");
}

/** Audits antérieurs au format court : on ne garde que le début d'un long texte
 * (phrases entières, environ `maxWords` mots). */
function firstSentences(text: string, maxWords: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    const next = (out + s).trim();
    if (out && next.split(/\s+/).length > maxWords) break;
    out = next + " ";
  }
  return out.trim();
}

/** Points bloquants : ceux de l'IA, sinon les 3 premières anomalies critiques. */
function blockingPoints(assessment: AiAssessment | null): BlockingPoint[] {
  if (assessment?.blocking_points?.length) return assessment.blocking_points;
  return (assessment?.findings ?? [])
    .filter((f) => f.severity === "critique")
    .slice(0, 3)
    .map((f) => ({
      title: f.title_fr,
      what: firstSentences(f.explanation_fr, 45),
      why: "",
      todo: firstSentences(f.proposed_correction ?? "", 30),
      refs: [],
    }));
}

/* ----------------------------------------------------------------- 1. verdict */

export function ReportHero({
  result,
  scoreDetail,
  assessment,
}: {
  result: AuditResult;
  scoreDetail: ScoreDetail | null;
  assessment: AiAssessment | null;
}) {
  const headline = assessment?.headline;
  const verdict = assessment?.exploitability_verdict;
  // Ancien format : libellé « Partiellement exploitable — critère principal… » → on
  // garde la partie avant le tiret, et deux phrases de justification au plus.
  const title = headline?.title || verdict?.label.split(" — ")[0] || "Votre audit est prêt";
  const subtitle = headline?.subtitle || firstSentences(verdict?.justification_fr ?? "", 40);
  const findings = assessment?.findings ?? [];
  const nCritical = findings.filter((f) => f.severity === "critique").length;
  const cap = scoreDetail?.plafonds_appliques?.[0];
  const score = scoreDetail?.score_final ?? result.score;
  const tone =
    score >= 80
      ? "bg-accent text-brand"
      : score >= 40
        ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
        : "bg-destructive/5 text-destructive";
  const patients = result.patientCount || result.rowCount;
  const extraRows = result.rowCount - patients;

  return (
    <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-8">
        <div className="min-w-0 flex-[999_1_420px] space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Audit de votre base · {result.fileName}
          </p>
          <h2 className="text-4xl text-foreground sm:text-5xl">{title}</h2>
          {subtitle && (
            <p className="max-w-xl text-[17px] leading-relaxed text-foreground/80">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "flex flex-[1_1_200px] flex-col items-center gap-1 rounded-lg p-5 text-center",
            tone,
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">
            Qualité de la base
          </span>
          <span className="font-display text-7xl leading-none">
            {fr(score)}
            <span className="text-2xl text-muted-foreground">/100</span>
          </span>
          {scoreDetail && <span className="font-semibold">{scoreDetail.niveau_qualite}</span>}
          {cap && (
            <span className="text-xs leading-snug text-muted-foreground">
              Note limitée à {fr(cap.plafond)}&nbsp;: {cap.defaut.toLowerCase()}.
            </span>
          )}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Patients"
          value={patients.toLocaleString("fr-FR")}
          hint={
            extraRows > 0 ? `+ ${extraRows} ligne(s) à retirer` : `${result.columnCount} variables`
          }
        />
        <Tile
          label="Saisis deux fois ?"
          value={String(result.duplicatedRows)}
          hint={result.duplicatedRows ? "patients à vérifier" : "aucune copie repérée"}
          alert={result.duplicatedRows > 0}
        />
        <Tile label="Données manquantes" value={`${fr(result.missingPct)} %`} hint="de la base" />
        <Tile
          label="Anomalies relevées"
          value={String(findings.length)}
          hint={nCritical ? `dont ${nCritical} bloquante(s)` : "aucune bloquante"}
        />
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  hint,
  alert = false,
}: {
  label: string;
  value: string;
  hint: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border px-4 py-3",
        alert ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border",
      )}
    >
      <span className={cn("text-xs", !alert && "text-muted-foreground")}>{label}</span>
      <span className="font-display text-4xl leading-none">{value}</span>
      <span className={cn("text-xs", !alert && "text-muted-foreground")}>{hint}</span>
    </div>
  );
}

/* ------------------------------------------------------- 2. points bloquants */

export function BlockingPoints({ assessment }: { assessment: AiAssessment | null }) {
  const points = blockingPoints(assessment);
  if (!points.length) return null;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-3xl sm:text-4xl">
          {points.length === 1
            ? "Le point qui bloque votre analyse"
            : `Les ${points.length} points qui bloquent votre analyse`}
        </h2>
        <span className="font-hand text-2xl text-brand">à régler en premier</span>
      </div>
      {points.map((p, i) => (
        <article
          key={i}
          className="flex flex-wrap gap-5 rounded-xl border border-border bg-card p-5 sm:p-6"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive text-lg font-bold text-destructive-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 flex-[999_1_480px] space-y-3">
            <h3 className="text-xl font-bold">{p.title}</h3>
            {p.what && <p className="leading-relaxed text-foreground/80">{p.what}</p>}
            {p.refs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.refs.map((r) => (
                  <span key={r} className="rounded-md bg-muted px-2.5 py-1 text-sm">
                    {r}
                  </span>
                ))}
              </div>
            )}
            {(p.why || p.todo) && (
              <div className="flex flex-wrap gap-3">
                {p.why && (
                  <p className="flex-[1_1_240px] rounded-lg bg-destructive/5 px-3.5 py-3 text-sm leading-relaxed text-destructive">
                    <strong>Pourquoi c'est grave.</strong> {p.why}
                  </p>
                )}
                {p.todo && (
                  <p className="flex-[1_1_240px] rounded-lg bg-accent px-3.5 py-3 text-sm leading-relaxed text-accent-foreground">
                    <strong>Que faire.</strong> {p.todo}
                  </p>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

/* ------------------------------------------------- 3. ce que la base permet */

const ANALYSIS_GROUPS: {
  key: keyof AnalysisMap;
  label: string;
  className: string;
}[] = [
  {
    key: "realisable",
    label: "✓ Réalisable",
    className: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
  {
    key: "avec_reserves",
    label: "≈ Avec réserves",
    className: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
  { key: "apres_decisions", label: "→ Après vos décisions", className: "bg-accent text-brand" },
  {
    key: "impossible",
    label: "✕ Impossible avec cette base",
    className: "bg-muted text-foreground/80",
  },
];

export function AnalysisMapCard({ map }: { map?: AnalysisMap }) {
  if (!map || !ANALYSIS_GROUPS.some((g) => map[g.key]?.length)) return null;
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 sm:p-7">
      <div className="space-y-1">
        <h2 className="text-3xl sm:text-4xl">Ce que votre base permet déjà</h2>
        <p className="text-muted-foreground">
          Une fois les points bloquants réglés, voici les résultats que vous pourrez présenter.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ANALYSIS_GROUPS.filter((g) => map[g.key]?.length).map((g) => (
          <div key={g.key} className={cn("space-y-2 rounded-lg p-4", g.className)}>
            <p className="text-sm font-bold">{g.label}</p>
            <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-foreground">
              {map[g.key].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------- 4. questions pour le directeur */

const PRIORITY_SECTIONS: {
  key: NonNullable<ClientDecision["priority"]>;
  label: string;
  className: string;
}[] = [
  { key: "avant_analyse", label: "Avant toute analyse", className: "text-destructive" },
  { key: "importante", label: "Importantes", className: "text-amber-700 dark:text-amber-300" },
  { key: "facultative", label: "Facultatives", className: "text-muted-foreground" },
];

export function DirectorQuestions({
  decisions,
  workbookHref,
}: {
  decisions?: ClientDecision[];
  workbookHref: string;
}) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  if (!decisions?.length) return null;
  const indexed = decisions.map((d, i) => ({ ...d, i, priority: d.priority ?? "importante" }));
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl">Vos questions pour votre directeur de thèse</h2>
          <p className="text-muted-foreground">
            Apportez-les à votre prochain rendez-vous : elles sont aussi dans le classeur.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={workbookHref}>
            <Download /> Télécharger la liste
          </a>
        </Button>
      </div>
      {PRIORITY_SECTIONS.map((section) => {
        const items = indexed.filter((d) => d.priority === section.key);
        if (!items.length) return null;
        return (
          <div key={section.key}>
            <p
              className={cn(
                "mb-1 mt-3 text-xs font-bold uppercase tracking-[0.12em]",
                section.className,
              )}
            >
              {section.label}
            </p>
            <ul>
              {items.map((d) => (
                <li key={d.i} className="border-b border-border/60 last:border-0">
                  <label className="flex cursor-pointer items-start gap-3 py-3 leading-relaxed">
                    <input
                      type="checkbox"
                      className="mt-1 h-[18px] w-[18px] shrink-0 accent-[var(--color-brand)]"
                      checked={!!done[d.i]}
                      onChange={(e) => setDone({ ...done, [d.i]: e.target.checked })}
                    />
                    <span className={cn(done[d.i] && "text-muted-foreground line-through")}>
                      {d.question_fr}
                      {d.recommendation_fr && (
                        <span className="mt-1 block text-sm text-muted-foreground no-underline">
                          Notre conseil&nbsp;: {d.recommendation_fr}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------- 5. le plan */

export function ActionPlan({ findings, nQuestions }: { findings: Finding[]; nQuestions: number }) {
  const nChecks = findings.filter((f) => f.requires_source_verification).length;
  return (
    <section className="space-y-4">
      <h2 className="text-3xl sm:text-4xl">Votre plan en 3 étapes</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <Step
          who="Étape 1 · Vous"
          title="Vérifier les dossiers"
          body={
            nChecks
              ? `${nChecks} point(s) à vérifier, listés dans le classeur avec une colonne pour noter vos décisions.`
              : "Relisez les anomalies du classeur et notez vos décisions."
          }
        />
        <Step
          who="Étape 2 · Avec votre directeur"
          title={nQuestions ? `Trancher les ${nQuestions} questions` : "Valider le plan d'analyse"}
          body="Commencez par celles marquées « avant toute analyse », et gardez une trace écrite."
        />
        <Step
          who="Étape 3 · Avec nous"
          title="L'analyse statistique"
          body="Nous nettoyons votre base corrigée et produisons vos tableaux et vos tests."
          dark
        />
      </div>
    </section>
  );
}

function Step({
  who,
  title,
  body,
  dark = false,
}: {
  who: string;
  title: string;
  body: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl p-5",
        dark ? "bg-ink text-background" : "border border-border bg-card",
      )}
    >
      <p
        className={cn(
          "text-xs font-bold uppercase tracking-[0.12em]",
          dark ? "text-brand-on-ink" : "text-muted-foreground",
        )}
      >
        {who}
      </p>
      <p className="text-lg font-bold">{title}</p>
      <p className={cn("text-sm leading-relaxed", dark ? "opacity-80" : "text-foreground/80")}>
        {body}
      </p>
    </div>
  );
}

/* --------------------------------------------------------- 6. l'offre */

export function AnalysisOffer({ needsHumanReview }: { needsHumanReview: boolean }) {
  return (
    <section className="flex flex-wrap items-center gap-6 rounded-2xl bg-brand p-6 text-brand-foreground sm:p-8">
      <div className="min-w-0 flex-[999_1_420px] space-y-2">
        <p className="font-hand text-2xl text-highlight">la suite de votre thèse</p>
        <h2 className="text-3xl leading-tight sm:text-4xl">
          Confiez-nous l'analyse statistique de votre base corrigée.
        </h2>
        <p className="leading-relaxed opacity-90">
          Un médecin et un biostatisticien reprennent votre base et vous remettent la base nettoyée,
          les tableaux et les tests de votre partie Résultats, prêts à défendre devant le jury.
        </p>
        {needsHumanReview && (
          <p className="text-sm leading-relaxed opacity-90">
            Votre audit compte plusieurs alertes critiques&nbsp;: nous vous recontactons sous
            48&nbsp;h ouvrées pour en parler.
          </p>
        )}
        <p className="font-semibold">{ANALYSIS_PRICE} · déjà plus de 30 thèses accompagnées</p>
      </div>
      <div className="flex flex-[1_1_220px] flex-col gap-3">
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-transparent bg-background text-brand hover:bg-background/90"
        >
          <Link to="/contact">Demander l'analyse</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-brand-foreground/60 bg-transparent text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
        >
          <Link to="/tarifs">Voir les offres</Link>
        </Button>
      </div>
    </section>
  );
}

/* -------------------------------------------------- 7. détail technique */

const SEVERITY_LABEL: Record<string, string> = {
  critique: "Bloquante",
  majeure: "Importante",
  moderee: "Modérée",
  mineure: "Mineure",
};
const SEVERITY_ORDER = ["critique", "majeure", "moderee", "mineure"];

export function TechnicalDetails({
  scoreDetail,
  findings,
}: {
  scoreDetail: ScoreDetail | null;
  findings: Finding[];
}) {
  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {scoreDetail && (
        <Fold title={`Score détaillé par domaine (${scoreDetail.domaines.length})`}>
          {scoreDetail.plafonds_appliques.length > 0 && (
            <p className="mb-4 text-sm text-muted-foreground">
              Les 8 domaines totalisent {fr(scoreDetail.score_brut)}/100, mais un défaut bloquant
              limite la note à {fr(scoreDetail.score_final)}/100.
            </p>
          )}
          <ul className="space-y-3">
            {scoreDetail.domaines.map((d) => {
              const pct = d.max ? Math.round((d.obtenu / d.max) * 100) : 0;
              return (
                <li key={d.domaine}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{d.nom}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fr(d.obtenu)}/{d.max}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        pct >= 80 ? "bg-brand" : pct >= 55 ? "bg-amber-500" : "bg-destructive",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Fold>
      )}
      {sorted.length > 0 && (
        <Fold title={`Les ${sorted.length} anomalies, une par une`}>
          <ul className="space-y-3">
            {sorted.map((f) => (
              <li key={f.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 font-semibold",
                      f.severity === "critique"
                        ? "bg-destructive/10 text-destructive"
                        : f.severity === "majeure"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {SEVERITY_LABEL[f.severity] ?? f.severity}
                  </span>
                  {f.rows_fr && (
                    <span className="text-muted-foreground">Inclusions {f.rows_fr}</span>
                  )}
                </div>
                <p className="mt-2 font-semibold">{f.title_fr}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                  {f.explanation_fr}
                </p>
                {(f.check_fr || f.proposed_correction) && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium text-brand">À faire&nbsp;: </span>
                    {f.check_fr || f.proposed_correction}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Fold>
      )}
      <Fold title="Comment nous avons audité votre base">
        <p className="text-sm leading-relaxed text-foreground/80">
          Votre base est contrôlée variable par variable puis patient par patient : doublons et
          lignes recopiées, valeurs impossibles, cohérence entre variables (dates, scores de
          gravité, durées), données manquantes et concordance avec votre protocole. La note sur 100
          suit une grille en 8 domaines conçue par notre équipe médicale et statistique. Votre
          fichier d'origine n'est jamais modifié et rien n'est inventé&nbsp;: une valeur introuvable
          reste manquante.
        </p>
      </Fold>
    </section>
  );
}

function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-border last:border-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold sm:px-6 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5 sm:px-6">{children}</div>
    </details>
  );
}

/* ------------------------------------------------------------ 8. classeur */

export function WorkbookDownload({ href }: { href: string }) {
  return (
    <section id="classeur" className="space-y-4 rounded-xl border border-border bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center gap-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <FileSpreadsheet className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-[999_1_320px] space-y-1">
          <p className="text-lg font-bold">Votre classeur d'audit (Excel)</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            À lire d'abord · Anomalies à vérifier, avec une colonne pour vos décisions · Questions
            pour votre directeur · Score détaillé. Les patients y sont désignés par leur numéro
            d'inclusion.
          </p>
        </div>
        <Button asChild size="lg">
          <a href={href}>
            <Download /> Télécharger
          </a>
        </Button>
      </div>
      <p className="flex items-start gap-2 text-sm text-foreground/80">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <span>
          La base nettoyée, prête pour vos tests statistiques, vous est remise avec l'analyse
          statistique, une fois les points bloquants vérifiés&nbsp;: l'analyser avant fausserait vos
          résultats.
        </span>
      </p>
    </section>
  );
}
