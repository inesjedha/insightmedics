/**
 * Page de résultats de l'audit complet (lien privé /r/:token).
 *
 * Écrite pour un étudiant en fin de médecine, pressé, souvent sur téléphone : le verdict
 * d'abord, puis ce que nous avons repéré, les points qui bloquent, les dossiers à ouvrir
 * demain, les questions pour le directeur, ce que la base permettra, et la suite avec nous.
 * Le détail technique reste replié en bas.
 *
 * Les audits antérieurs au format court n'ont pas tous les champs (headline,
 * blocking_points, highlights, checklist, analysis_map) : chaque bloc a un repli construit
 * sur les anciens champs, ou disparaît.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  Check,
  ChevronDown,
  Clock,
  Database,
  Download,
  FileLock2,
  FileSpreadsheet,
  MessageCircle,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import type {
  AiAssessment,
  AnalysisMap,
  AuditResult,
  BlockingPoint,
  ChecklistItem,
  ClientDecision,
  CopiesView,
  CopiedBlock,
  Finding,
  Mission,
  ScoreDetail,
  TwinExample,
} from "@/lib/api/types";

const ANALYSIS_PRICE = "500 DT";
// Message prérempli, sans aucune donnée de l'étudiant ni de son audit.
const WHATSAPP_MESSAGE =
  "Bonjour Dr Hamza, je viens de recevoir l'audit de ma base sur Insight Medics et je souhaite l'analyse statistique de ma thèse. Ma soutenance est prévue vers le ___.";
const WHATSAPP_URL = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

function fr(n: number | string): string {
  return String(n).replace(".", ",");
}

function pct(x: number | null | undefined): number {
  return Math.round((x ?? 0) * 100);
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

/** Feu du verdict (bilan v3) : rouge si une mission rouge, orange s'il en reste, vert
 * sinon. Audits antérieurs : d'après les points bloquants. */
function verdictLight(assessment: AiAssessment | null): "rouge" | "orange" | "vert" {
  const missions = assessment?.missions ?? [];
  if (missions.length) return missions.some((m) => m.feu === "rouge") ? "rouge" : "orange";
  return blockingPoints(assessment).length ? "rouge" : "vert";
}

const LIGHT_DOT: Record<"rouge" | "orange" | "vert", string> = {
  rouge: "bg-destructive",
  orange: "bg-amber-500",
  vert: "bg-emerald-500",
};

/** Dossiers à ouvrir : la liste de l'IA, sinon les anomalies à vérifier au dossier. */
function checklistItems(assessment: AiAssessment | null): ChecklistItem[] {
  if (assessment?.checklist?.length) return assessment.checklist;
  return (assessment?.findings ?? [])
    .filter((f) => f.requires_source_verification && f.rows_fr)
    .map((f) => ({ patients: f.rows_fr ?? "", check: f.check_fr || f.title_fr }));
}

/** Cases cochées, gardées dans ce navigateur (rien n'est envoyé au serveur). */
function useSavedChecks(key: string) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setChecks(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* stockage indisponible (navigation privée) : les cases restent en mémoire */
    }
  }, [key]);
  const toggle = (id: string, value: boolean) =>
    setChecks((prev) => {
      const next = { ...prev, [id]: value };
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* idem */
      }
      return next;
    });
  return [checks, toggle] as const;
}

function SectionTitle({
  title,
  note,
  intro,
}: {
  title: string;
  note?: string;
  intro?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {note && <span className="font-hand text-2xl text-brand">{note}</span>}
      </div>
      {intro && <p className="max-w-2xl text-muted-foreground">{intro}</p>}
    </div>
  );
}

function WhatsAppButton({ label, className }: { label: string; className?: string }) {
  return (
    <Button asChild size="lg" className={className}>
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
        <MessageCircle /> {label}
      </a>
    </Button>
  );
}

/* ----------------------------------------------------------------- 1. verdict */

function scoreLabel(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: "Prête pour l'analyse", tone: "text-brand" };
  if (score >= 60) return { label: "Presque prête", tone: "text-amber-700 dark:text-amber-300" };
  if (score >= 40)
    return { label: "À corriger avant l'analyse", tone: "text-amber-700 dark:text-amber-300" };
  return { label: "À reprendre en profondeur", tone: "text-destructive" };
}

function ScoreGauge({ score }: { score: number }) {
  const { label, tone } = scoreLabel(score);
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-5">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Qualité de votre base
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-6xl leading-none">{fr(score)}</span>
        <span className="text-lg text-muted-foreground">/100</span>
      </div>
      <span className={cn("text-lg font-bold leading-tight", tone)}>{label}</span>
      <div className="relative mt-1" aria-hidden>
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <span className="w-[40%] bg-destructive/70" />
          <span className="w-[20%] bg-amber-500/80" />
          <span className="w-[20%] bg-amber-300/80" />
          <span className="w-[20%] bg-brand" />
        </div>
        <span
          className="absolute -top-1.5 h-5.5 w-1.5 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-background"
          style={{ left: `${clamped}%` }}
        />
        <div className="relative mt-1.5 h-4 text-[11px] text-muted-foreground">
          <span className="absolute left-0">0</span>
          <span className="absolute left-[80%] -translate-x-1/2 whitespace-nowrap">
            ↑ 80&nbsp;: prête
          </span>
        </div>
      </div>
    </div>
  );
}

export function ReportHero({
  result,
  scoreDetail,
  assessment,
  workbookHref,
}: {
  result: AuditResult;
  scoreDetail: ScoreDetail | null;
  assessment: AiAssessment | null;
  workbookHref: string;
}) {
  const headline = assessment?.headline;
  const verdict = assessment?.exploitability_verdict;
  // Ancien format : libellé « Partiellement exploitable — critère principal… » → on
  // garde la partie avant le tiret, et deux phrases de justification au plus.
  const title = headline?.title || verdict?.label.split(" — ")[0] || "Votre audit est prêt";
  const subtitle = headline?.subtitle || firstSentences(verdict?.justification_fr ?? "", 40);
  const score = scoreDetail?.score_final ?? result.score;
  const nPoints = blockingPoints(assessment).length;
  const missions = assessment?.missions ?? [];
  const nRed = missions.filter((m) => m.feu === "rouge").length;
  const light = verdictLight(assessment);

  const patients = result.patientCount || result.rowCount;
  const patientMin = result.patientMin ?? patients;
  const range = result.duplicatedRows > 0 && patientMin < patients;
  const extraRows = result.rowCount - patients;
  const missing = result.missingUsefulPct ?? result.missingPct;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-stretch gap-8 p-6 sm:p-8">
        <div className="min-w-0 flex-[999_1_440px] space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Audit de votre base · {result.fileName}
          </p>
          <h2 className="flex items-start gap-3 text-4xl text-foreground sm:text-5xl">
            <span
              className={cn("mt-3 h-4 w-4 shrink-0 rounded-full sm:mt-4", LIGHT_DOT[light])}
              aria-hidden
            />
            {title}
          </h2>
          {subtitle && (
            <p className="max-w-xl text-[17px] leading-relaxed text-foreground/80">{subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            <Button asChild size="lg">
              <a href={workbookHref}>
                <Download /> Télécharger mon classeur Excel
              </a>
            </Button>
            <a
              href="#suite"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              <ArrowDown className="h-4 w-4" /> Et ensuite&nbsp;? Notre offre d'analyse
            </a>
          </div>
        </div>
        <div className="flex-[1_1_240px]">
          <ScoreGauge score={score} />
        </div>
      </div>
      <dl className="grid grid-cols-2 border-t border-border lg:grid-cols-4">
        <Tile
          label="Patients"
          value={range ? `${patientMin} à ${patients}` : patients.toLocaleString("fr-FR")}
          hint={
            range
              ? "selon les copies que vous confirmerez"
              : extraRows > 0
                ? `+ ${extraRows} ligne${extraRows > 1 ? "s" : ""} à retirer`
                : `${result.columnCount} variables`
          }
        />
        <Tile
          label="Saisis deux fois ?"
          value={String(result.duplicatedRows)}
          hint={result.duplicatedRows ? "à vérifier au dossier" : "aucune copie repérée"}
          alert={result.duplicatedRows > 0}
        />
        <Tile label="Cases vides" value={`${fr(missing)} %`} hint="dans les colonnes utiles" />
        {missions.length ? (
          <Tile
            label="Missions"
            value={String(missions.length)}
            hint={[
              nRed ? `${nRed} rouge${nRed > 1 ? "s" : ""}` : "",
              missions.length - nRed
                ? `${missions.length - nRed} orange${missions.length - nRed > 1 ? "s" : ""}`
                : "",
            ]
              .filter(Boolean)
              .join(", ")}
            alert={nRed > 0}
          />
        ) : (
          <Tile
            label="Points bloquants"
            value={String(nPoints)}
            hint={nPoints ? "à régler avant l'analyse" : "aucun"}
            alert={nPoints > 0}
          />
        )}
      </dl>
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
    <div className="flex flex-col gap-1 border-border px-5 py-4 even:border-l lg:border-l lg:first:border-l-0 [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-display text-4xl leading-none", alert && "text-destructive")}>
        {value}
      </dd>
      <dd className="text-xs text-muted-foreground">{hint}</dd>
    </div>
  );
}

/* ------------------------------------------- vos 3 étapes (sommaire) */

/** Sommaire de la page : ce que l'étudiant a à faire, en 3 étapes cliquables. */
export function ReadingGuide({ assessment }: { assessment: AiAssessment | null }) {
  const nMissions = assessment?.missions?.length || blockingPoints(assessment).length;
  const nRecords = checklistItems(assessment).length;
  const nQuestions = assessment?.client_decisions?.length ?? 0;
  const steps = [
    {
      href: "#points-bloquants",
      verb: "Comprendre",
      what: `${nMissions} ${assessment?.missions?.length ? "mission" : "point"}${nMissions > 1 ? "s" : ""}`,
      detail: "ce qui ne va pas, du plus urgent au moins urgent",
      n: nMissions,
    },
    {
      href: "#archives",
      verb: "Vérifier aux archives",
      what: `${nRecords} dossier${nRecords > 1 ? "s" : ""} à ouvrir`,
      detail: "avec, pour chacun, la case à regarder",
      n: nRecords,
    },
    {
      href: "#questions",
      verb: "Décider avec votre directeur",
      what: `${nQuestions} question${nQuestions > 1 ? "s" : ""}`,
      detail: "à trancher ensemble, par écrit",
      n: nQuestions,
    },
  ].filter((step) => step.n > 0);
  if (!steps.length) return null;
  return (
    <nav aria-label="Ce que vous avez à faire" className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Ce que vous avez à faire
      </p>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.href}>
            <a
              href={step.href}
              className="group flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 space-y-0.5">
                <span className="block text-sm font-semibold text-muted-foreground">
                  {step.verb}
                </span>
                <span className="block text-lg font-bold leading-snug group-hover:text-brand">
                  {step.what}
                </span>
                <span className="block text-sm text-foreground/70">{step.detail}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------ combien de patients compte la thèse */

/** Schéma : les lignes du fichier, réparties entre patients sûrs, lignes peut-être
 * recopiées et lignes à retirer. Affiché seulement s'il y a un écart à expliquer. */
export function PatientCount({ result }: { result: AuditResult }) {
  const rows = result.rowCount;
  const patients = Math.min(result.patientCount || rows, rows);
  const sure = Math.min(result.patientMin ?? patients, patients);
  const maybe = patients - sure;
  const extra = rows - patients;
  if ((!maybe && !extra) || rows <= 0) return null;
  const s = (n: number) => (n > 1 ? "s" : "");
  const parts = [
    {
      n: sure,
      label: `${sure} patient${s(sure)}`,
      hint: "aucune copie repérée",
      bar: "bg-brand",
      dot: "bg-brand",
    },
    {
      n: maybe,
      label: `${maybe} ligne${s(maybe)} peut-être recopiée${s(maybe)}`,
      hint: "le dossier dira s'il s'agit de vrais patients",
      bar: "bg-amber-400 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(255_255_255/0.45)_6px_10px)]",
      dot: "bg-amber-400",
    },
    {
      n: extra,
      label: `${extra} ligne${s(extra)} à retirer`,
      hint: "lignes vides ou fiche vierge : ce ne sont pas des patients",
      bar: "bg-muted-foreground/30",
      dot: "bg-muted-foreground/40",
    },
  ].filter((part) => part.n > 0);
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-7">
      <SectionTitle
        title="Combien de patients compte votre thèse ?"
        intro="C'est le chiffre de départ de tous vos pourcentages. Voici ce que contiennent les lignes de votre tableau."
      />
      <div>
        <p className="mb-1.5 text-sm font-semibold">
          {rows} ligne{s(rows)} dans votre tableau
        </p>
        <div
          className="flex h-10 overflow-hidden rounded-lg"
          role="img"
          aria-label={parts.map((part) => part.label).join(", ")}
        >
          {parts.map((part) => (
            <span
              key={part.label}
              className={cn(
                "flex items-center justify-center border-r-2 border-card text-sm font-bold last:border-r-0",
                part.bar,
                part.bar === "bg-brand" ? "text-brand-foreground" : "text-foreground",
              )}
              style={{ width: `${(part.n / rows) * 100}%` }}
            >
              {part.n / rows >= 0.08 ? part.n : ""}
            </span>
          ))}
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {parts.map((part) => (
          <li key={part.label} className="flex items-start gap-2.5 text-sm">
            <span className={cn("mt-1 h-3 w-3 shrink-0 rounded-sm", part.dot)} />
            <span>
              <span className="font-bold">{part.label}</span>
              <span className="block text-foreground/70">{part.hint}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="rounded-lg bg-accent px-4 py-3 leading-relaxed text-accent-foreground">
        {maybe ? (
          <>
            <strong>
              Votre thèse compte entre {sure} et {patients} patients.
            </strong>{" "}
            Si les lignes en orange sont des copies, chaque pourcentage change. C'est la première
            chose à vérifier aux archives.
          </>
        ) : (
          <>
            <strong>
              Votre thèse compte {patients} patient{s(patients)}, pas {rows}.
            </strong>{" "}
            Nous retirons pour vous les lignes qui ne sont pas des patients.
          </>
        )}
      </p>
    </section>
  );
}

/* --------------------------------------------- 2. ce que nous avons repéré */

function rangeLabel(ids: (number | string)[], by: CopiedBlock["by"]): string {
  const [a, b] = [ids[0], ids[ids.length - 1]];
  const what = by === "patient" ? "Patients n°" : "Lignes";
  return a === b ? `${what} ${a}` : `${what} ${a} à ${b}`;
}

function CopiesVisual({ copies }: { copies: CopiesView }) {
  const block = copies.blocks[0];
  if (!block) return null;
  const n = Math.min(block.length, 24);
  const cell = 22;
  const w = n * cell;
  const copyMin = pct(block.min_similarity);
  // Des paires identiques à l'identifiant près : 100 % des autres valeurs.
  const copyMax = copies.identical_pairs ? 100 : pct(copies.max_similarity ?? block.min_similarity);
  const ordinary = copies.median_similarity != null ? pct(copies.median_similarity) : null;
  const parts = [
    copies.identical_pairs
      ? `${copies.identical_pairs} identique${copies.identical_pairs > 1 ? "s" : ""} à l'identifiant près`
      : "",
    copies.near_pairs
      ? `${copies.near_pairs} presque identique${copies.near_pairs > 1 ? "s" : ""}`
      : "",
  ].filter(Boolean);

  return (
    <figure className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="space-y-1">
        <p className="text-lg font-bold">
          Un bloc de {block.length} lignes semble recopié
          {copies.blocks.length > 1 &&
            ` (et ${copies.blocks.length - 1} autre${copies.blocks.length > 2 ? "s" : ""})`}
        </p>
        {parts.length > 0 && <p className="text-sm text-muted-foreground">{parts.join(", ")}.</p>}
      </figcaption>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">{rangeLabel(block.source, block.by)}</p>
        <svg
          viewBox={`0 0 ${w} 74`}
          className="block h-auto w-full max-w-[560px]"
          role="img"
          aria-label={`${rangeLabel(block.source, block.by)} recopiés en ${rangeLabel(block.copy, block.by).toLowerCase()}`}
        >
          {Array.from({ length: n }, (_, i) => {
            const x = i * cell + 3;
            return (
              <g key={i}>
                <line
                  x1={x + 8}
                  y1={18}
                  x2={x + 8}
                  y2={56}
                  className="stroke-destructive/50"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                <rect x={x} y={2} width={16} height={16} rx={3} className="fill-brand" />
                <rect
                  x={x + 0.75}
                  y={56.75}
                  width={14.5}
                  height={14.5}
                  rx={3}
                  className="fill-destructive/15 stroke-destructive"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>
        <p className="text-sm font-semibold text-destructive">
          {rangeLabel(block.copy, block.by)}&nbsp;: les mêmes, dans le même ordre
        </p>
      </div>
      {block.min_similarity != null && (
        <div className="space-y-3 border-t border-border pt-4">
          <SimilarityBar
            label="Une ligne et sa copie"
            value={copyMin}
            text={copyMax > copyMin ? `${copyMin} à ${copyMax} %` : `${copyMin} %`}
            className="bg-destructive"
          />
          {ordinary != null && (
            <SimilarityBar
              label="Deux patients pris au hasard"
              value={ordinary}
              text={`${ordinary} %`}
              className="bg-muted-foreground/50"
            />
          )}
          <p className="text-xs text-muted-foreground">
            Part des cases identiques entre deux lignes. Seul le dossier dira s'il s'agit de copies
            ou de vrais patients.
          </p>
        </div>
      )}
    </figure>
  );
}

function SimilarityBar({
  label,
  value,
  text,
  className,
}: {
  label: string;
  value: number;
  text: string;
  className: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[11rem_1fr_5rem]">
      <span className="text-foreground/80">{label}</span>
      <span className="col-span-2 row-start-2 h-2.5 overflow-hidden rounded-full bg-muted sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <span
          className={cn("block h-full rounded-full", className)}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="text-right font-semibold tabular-nums">{text}</span>
    </div>
  );
}

/** Le jeu des différences (bilan v3) : deux lignes jumelles, réponse à révéler. */
function TwinGame({ twin, copies }: { twin: TwinExample; copies?: CopiesView | null }) {
  const [revealed, setRevealed] = useState(false);
  const block = copies?.blocks[0];
  const ordinary = copies?.median_similarity != null ? pct(copies.median_similarity) : null;
  return (
    <figure className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="space-y-1">
        <p className="text-lg font-bold">Le jeu des différences</p>
        <p className="text-sm text-muted-foreground">
          Deux lignes de votre fichier. Trouvez ce qui les distingue.
        </p>
      </figcaption>
      <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card" />
              {twin.columns.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className={cn(
                    "max-w-[8rem] px-2.5 pb-2 text-left align-bottom text-xs font-semibold leading-tight text-muted-foreground",
                    revealed && twin.differing.includes(c) && "text-destructive",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {twin.rows.map((r) => (
              <tr key={r.label}>
                <th
                  scope="row"
                  className="sticky left-0 whitespace-nowrap border-t border-border bg-card py-2 pr-3 text-left text-xs font-semibold"
                >
                  {r.label}
                </th>
                {r.values.map((v, j) => {
                  const differs = twin.differing.includes(twin.columns[j]);
                  const isId = j === 0 && /inclusion/i.test(twin.columns[0]);
                  return (
                    <td
                      key={j}
                      className={cn(
                        "whitespace-nowrap border-t border-border px-2.5 py-2 tabular-nums",
                        revealed && (differs || isId) && "bg-highlight font-semibold",
                      )}
                    >
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground sm:hidden">
        Faites glisser le tableau pour voir les autres colonnes.
      </p>
      {revealed ? (
        <p className="rounded-lg bg-accent px-3.5 py-3 text-sm leading-relaxed text-accent-foreground">
          <strong>Réponse.</strong> {twin.answer}
          {block &&
            ` Et ce n'est pas un cas isolé : ${rangeLabel(block.source, block.by).toLowerCase()} se retrouvent en ${rangeLabel(block.copy, block.by).toLowerCase()}.`}
        </p>
      ) : (
        <Button variant="outline" onClick={() => setRevealed(true)}>
          Voir la réponse
        </Button>
      )}
      {revealed && block?.min_similarity != null && ordinary != null && (
        <div className="space-y-3 border-t border-border pt-4">
          <SimilarityBar
            label="Une ligne et sa copie"
            value={pct(block.min_similarity)}
            text={`${pct(block.min_similarity)} à 100 %`}
            className="bg-destructive"
          />
          <SimilarityBar
            label="Deux patients pris au hasard"
            value={ordinary}
            text={`${ordinary} %`}
            className="bg-muted-foreground/50"
          />
        </div>
      )}
    </figure>
  );
}

export function SpottedInBase({
  copies,
  highlights,
  twin,
}: {
  copies?: CopiesView | null;
  highlights?: { title: string; detail: string }[];
  twin?: TwinExample | null;
}) {
  const showCopies = !!copies?.blocks.length || !!twin;
  // Le schéma montre déjà le bloc recopié : on n'en répète pas la trouvaille.
  const cards = (highlights ?? []).filter(
    (h) => !(showCopies && /recopi|copi[ée]|deux fois/i.test(h.title)),
  );
  if (!showCopies && !cards.length) return null;
  return (
    <section className="space-y-4">
      <SectionTitle title="Ce que nous avons repéré" note="ce qu'un œil pressé ne voit pas" />
      <div className="grid gap-4 lg:grid-cols-5">
        {showCopies && (
          <div
            className={cn(
              "min-w-0",
              // le tableau du jeu des différences a besoin de toute la largeur
              cards.length && !twin ? "lg:col-span-3" : "lg:col-span-5",
            )}
          >
            {twin ? (
              <TwinGame twin={twin} copies={copies} />
            ) : (
              copies && <CopiesVisual copies={copies} />
            )}
          </div>
        )}
        {cards.length > 0 && (
          <ul
            className={cn(
              "grid gap-3",
              showCopies && !twin
                ? "content-start lg:col-span-2"
                : "sm:grid-cols-2 lg:col-span-5 lg:grid-cols-3",
            )}
          >
            {cards.slice(0, 3).map((h) => (
              <li key={h.title} className="rounded-xl border border-border bg-card p-5">
                <p className="font-bold leading-snug">{h.title}</p>
                {h.detail && (
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{h.detail}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------- 3. points bloquants */

function Missions({ missions, storageKey }: { missions: Mission[]; storageKey: string }) {
  const [checks, toggle] = useSavedChecks(`${storageKey}:missions`);
  const nDone = missions.filter((_, i) => checks[i]).length;
  return (
    <section id="points-bloquants" className="space-y-4">
      <SectionTitle
        title="Vos missions"
        note={`${nDone} terminée${nDone > 1 ? "s" : ""} sur ${missions.length}`}
        intro="Une mission par problème, de la plus urgente à la moins urgente. Commencez par les rouges : tant qu'elles ne sont pas terminées, aucun résultat de votre thèse n'est fiable."
      />
      {missions.map((m, i) => {
        const done = !!checks[i];
        return (
          <article
            key={i}
            className={cn(
              "space-y-3 rounded-xl border bg-card p-5 sm:p-6",
              m.feu === "rouge" ? "border-destructive/30" : "border-amber-500/30",
              done && "opacity-60",
            )}
          >
            <div className="flex flex-wrap items-start gap-3">
              <span
                className={cn(
                  "mt-1 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold",
                  m.feu === "rouge"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-200",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", LIGHT_DOT[m.feu])} />
                Mission {i + 1}
              </span>
              <h3
                className={cn(
                  "min-w-0 flex-1 text-xl font-bold leading-snug",
                  done && "line-through",
                )}
              >
                {m.title}
              </h3>
            </div>
            {m.vu && (
              <p className="leading-relaxed text-foreground/80">
                <strong className="text-foreground">Ce que nous avons vu.</strong> {m.vu}
              </p>
            )}
            {m.refs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {m.refs.map((r) => (
                  <span key={r} className="rounded-md bg-muted px-2.5 py-1 text-sm tabular-nums">
                    {r}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {m.pourquoi && (
                <p className="flex-[1_1_240px] rounded-lg bg-muted/60 px-3.5 py-3 text-sm leading-relaxed">
                  <strong>Pourquoi c'est important pour votre thèse.</strong> {m.pourquoi}
                </p>
              )}
              {m.a_faire.length > 0 && (
                <div className="flex-[1_1_240px] rounded-lg bg-accent px-3.5 py-3 text-sm leading-relaxed text-accent-foreground">
                  <strong>À faire</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {m.a_faire.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3 text-sm">
              {m.a_rouvrir && (
                <span>
                  <span className="text-muted-foreground">À rouvrir&nbsp;:</span> {m.a_rouvrir}
                </span>
              )}
              {m.qui && (
                <span>
                  <span className="text-muted-foreground">Qui&nbsp;:</span> {m.qui}
                </span>
              )}
              {m.termine_quand && (
                <span className="min-w-0">
                  <span className="text-muted-foreground">Terminé quand</span> {m.termine_quand}
                </span>
              )}
              <label className="ml-auto inline-flex cursor-pointer items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  className="h-[18px] w-[18px] accent-[var(--color-brand)]"
                  checked={done}
                  onChange={(e) => toggle(String(i), e.target.checked)}
                />
                Mission terminée
              </label>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function BlockingPoints({
  assessment,
  storageKey,
}: {
  assessment: AiAssessment | null;
  storageKey: string;
}) {
  if (assessment?.missions?.length)
    return <Missions missions={assessment.missions} storageKey={storageKey} />;
  const points = blockingPoints(assessment);
  if (!points.length) return null;
  return (
    <section id="points-bloquants" className="space-y-4">
      <SectionTitle
        title={
          points.length === 1
            ? "Le point qui bloque votre analyse"
            : `Les ${points.length} points qui bloquent votre analyse`
        }
        note="à régler en premier"
      />
      {points.map((p, i) => (
        <article key={i} className="space-y-3 rounded-xl border border-border bg-card p-5 sm:p-6">
          <h3 className="flex items-start gap-3 text-xl font-bold leading-snug">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive text-sm text-destructive-foreground">
              {i + 1}
            </span>
            {p.title}
          </h3>
          {p.what && <p className="leading-relaxed text-foreground/80">{p.what}</p>}
          {p.refs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {p.refs.map((r) => (
                <span key={r} className="rounded-md bg-muted px-2.5 py-1 text-sm tabular-nums">
                  {r}
                </span>
              ))}
            </div>
          )}
          {(p.why || p.todo) && (
            <div className="flex flex-wrap gap-3">
              {p.why && (
                <p className="flex-[1_1_240px] rounded-lg bg-muted/60 px-3.5 py-3 text-sm leading-relaxed">
                  <strong>Pourquoi c'est important.</strong> {p.why}
                </p>
              )}
              {p.todo && (
                <p className="flex-[1_1_240px] rounded-lg bg-accent px-3.5 py-3 text-sm leading-relaxed text-accent-foreground">
                  <strong>Ce que vous faites.</strong> {p.todo}
                </p>
              )}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

/** Rappel discret de l'offre, juste après les points bloquants. */
export function OfferNudge() {
  return (
    <aside className="flex flex-wrap items-center gap-4 rounded-xl border border-brand/25 bg-accent px-5 py-4 sm:px-6">
      <p className="min-w-0 flex-[999_1_360px] leading-relaxed text-accent-foreground">
        <strong>Pas le temps de tout reprendre avant la soutenance&nbsp;?</strong> Vous vérifiez les
        dossiers, Dr Hamza et l'équipe font tout le reste en une semaine&nbsp;: correction du
        tableau, calculs, tableaux de résultats.
      </p>
      <a
        href="#suite"
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand underline-offset-4 hover:underline"
      >
        Voir l'offre <ArrowDown className="h-4 w-4" />
      </a>
    </aside>
  );
}

/* ------------------------------------------------------ 4. dossiers à ouvrir */

/** Ce qu'il faut regarder : « Colonne « Sexe » · aujourd'hui : M ». Pour une paire de
 * lignes jumelles (colonne « toutes »), on dit simplement ce que les deux lignes ont en
 * commun. */
function checkDetail(item: ChecklistItem): string {
  const colonne = (item.colonne ?? "").trim();
  const valeur = (item.valeur ?? "").trim();
  if (!colonne || /^(toutes?|all)$/i.test(colonne)) {
    return valeur ? `Les deux lignes : ${valeur}` : "Les deux lignes sont presque identiques";
  }
  return valeur ? `Colonne « ${colonne} » · aujourd'hui : ${valeur}` : `Colonne « ${colonne} »`;
}

export function RecordsToOpen({
  assessment,
  storageKey,
  workbookHref,
}: {
  assessment: AiAssessment | null;
  storageKey: string;
  workbookHref: string;
}) {
  const items = checklistItems(assessment);
  const [checks, toggle] = useSavedChecks(`${storageKey}:dossiers`);
  if (!items.length) return null;
  const nDone = items.filter((_, i) => checks[i]).length;
  return (
    <section
      id="archives"
      className="scroll-mt-24 space-y-4 rounded-xl border border-border bg-card p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title="Demain, aux archives"
          intro={`Du plus urgent au moins urgent. Les numéros sont ceux de vos lignes de patients : le numéro de dossier correspondant est dans votre base. ${nDone ? `${nDone} sur ${items.length} faits.` : "Cochez au fur et à mesure."}`}
        />
        <Button asChild variant="outline">
          <a href={workbookHref}>
            <Download /> Version à imprimer
          </a>
        </Button>
      </div>
      <ul className="divide-y divide-border/70">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 py-3">
              <input
                type="checkbox"
                className="mt-1 h-[18px] w-[18px] shrink-0 accent-[var(--color-brand)]"
                checked={!!checks[i]}
                onChange={(e) => toggle(String(i), e.target.checked)}
              />
              <span
                className={cn(
                  "flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1",
                  checks[i] && "text-muted-foreground line-through",
                )}
              >
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums">
                  {item.lignes ? `${item.lignes} · ` : ""}
                  {/^\d/.test(item.patients)
                    ? `${item.lignes ? "inclusion " : ""}n° ${item.patients}`
                    : item.patients}
                </span>
                <span className="leading-relaxed">
                  {item.check}
                  {(item.colonne || item.valeur) && (
                    <span className="block text-sm text-muted-foreground">{checkDetail(item)}</span>
                  )}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------------------------- 5. questions pour le directeur */

const PRIORITY_RANK: Record<NonNullable<ClientDecision["priority"]>, number> = {
  avant_analyse: 0,
  importante: 1,
  facultative: 2,
};

export function DirectorQuestions({
  decisions,
  storageKey,
}: {
  decisions?: ClientDecision[];
  storageKey: string;
}) {
  const [checks, toggle] = useSavedChecks(`${storageKey}:questions`);
  const [showAll, setShowAll] = useState(false);
  const [openAdvice, setOpenAdvice] = useState<Record<number, boolean>>({});
  if (!decisions?.length) return null;
  const indexed = decisions
    .map((d, i) => ({ ...d, i, priority: d.priority ?? "importante" }))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  const urgent = indexed.filter((d) => d.priority === "avant_analyse");
  // Sans priorité « avant analyse », on montre les 3 premières.
  const shownCount = urgent.length || Math.min(3, indexed.length);
  const shown = showAll ? indexed : indexed.slice(0, shownCount);
  const hidden = indexed.length - shownCount;

  return (
    <section
      id="questions"
      className="scroll-mt-24 space-y-4 rounded-xl border border-border bg-card p-5 sm:p-7"
    >
      <SectionTitle
        title="À trancher avec votre directeur"
        intro="Apportez ces questions à votre prochain rendez-vous et gardez une trace écrite de ses réponses."
      />
      <ul className="divide-y divide-border/70">
        {shown.map((d) => (
          <li key={d.i} className="py-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label="Question tranchée"
                className="mt-1 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--color-brand)]"
                checked={!!checks[d.i]}
                onChange={(e) => toggle(String(d.i), e.target.checked)}
              />
              <div className="min-w-0 space-y-1.5">
                <p
                  className={cn(
                    "leading-relaxed",
                    checks[d.i] && "text-muted-foreground line-through",
                  )}
                >
                  {d.priority === "avant_analyse" && (
                    <span className="mr-2 rounded bg-destructive/10 px-1.5 py-0.5 align-[1px] text-xs font-semibold text-destructive">
                      avant toute analyse
                    </span>
                  )}
                  {d.question_fr}
                </p>
                {!!d.choices?.length && (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {d.choices.map((c, k) => (
                      <li key={k} className="rounded-lg border border-border px-3 py-2 text-sm">
                        <span className="font-semibold">
                          {String.fromCharCode(65 + k)}. {c.label}
                        </span>
                        {c.consequence && (
                          <span className="block text-muted-foreground">{c.consequence}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {d.recommendation_fr && (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenAdvice({ ...openAdvice, [d.i]: !openAdvice[d.i] })}
                      className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                      aria-expanded={!!openAdvice[d.i]}
                    >
                      {openAdvice[d.i] ? "Masquer notre conseil" : "Notre conseil"}
                    </button>
                    {openAdvice[d.i] && (
                      <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed">
                        {d.recommendation_fr}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
          aria-expanded={showAll}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", showAll && "rotate-180")} />
          {showAll
            ? "Ne garder que l'essentiel"
            : `Voir les ${hidden} autre${hidden > 1 ? "s" : ""} question${hidden > 1 ? "s" : ""} (moins urgentes)`}
        </button>
      )}
    </section>
  );
}

/* --------------------------------------- déjà en ordre, nous corrigeons */

export function AlreadyInOrder({ assessment }: { assessment: AiAssessment | null }) {
  const ok = assessment?.deja_en_ordre ?? [];
  const fixes = assessment?.nous_corrigeons ?? [];
  if (!ok.length && !fixes.length) return null;
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {ok.length > 0 && (
        <div className="space-y-2 rounded-xl bg-emerald-500/10 p-5">
          <p className="font-bold text-emerald-800 dark:text-emerald-200">
            Ce qui est déjà en ordre
          </p>
          <ul className="space-y-1.5 text-sm leading-relaxed">
            {ok.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {fixes.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-5">
          <p className="font-bold">Ce que nous corrigeons pour vous</p>
          <p className="text-sm text-muted-foreground">Vous n'avez rien à faire.</p>
          <ul className="space-y-1.5 text-sm leading-relaxed">
            {fixes.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function DidYouKnow({ assessment }: { assessment: AiAssessment | null }) {
  const tip = assessment?.le_saviez_vous;
  const words = assessment?.lexique ?? [];
  if (!tip && !words.length) return null;
  return (
    <section className="space-y-4 rounded-xl border border-dashed border-brand/40 bg-card p-5 sm:p-6">
      {tip && (
        <p className="leading-relaxed">
          <span className="font-hand text-2xl text-brand">Le saviez-vous&nbsp;? </span>
          {tip}
        </p>
      )}
      {words.length > 0 && (
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {words.map((w) => (
            <div key={w.mot}>
              <dt className="inline font-semibold">{w.mot}&nbsp;: </dt>
              <dd className="inline text-foreground/80">{w.sens}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/* ------------------------------------------------- 6. ce que la base permet */

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
    <section className="space-y-4">
      <SectionTitle
        title="Ce que vous pourrez présenter"
        intro="Une fois vos missions rouges terminées, voici les résultats que votre base permet."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ANALYSIS_GROUPS.filter((g) => map[g.key]?.length).map((g) => (
          <div key={g.key} className={cn("space-y-2 rounded-xl p-4", g.className)}>
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

/* ---------------------------------------------- 7. la suite : plan et offre */

export function NextSteps({
  assessment,
  needsHumanReview,
}: {
  assessment: AiAssessment | null;
  needsHumanReview: boolean;
}) {
  const nRecords = checklistItems(assessment).length;
  const nQuestions = assessment?.client_decisions?.length ?? 0;
  return (
    <section id="suite" className="scroll-mt-24 space-y-5">
      <SectionTitle title="La suite, en 3 étapes" />
      <ol className="relative space-y-4 border-l-2 border-border pl-7 sm:pl-9">
        <TimelineStep n={1} who="Vous, cette semaine">
          {nRecords
            ? "Ouvrir les dossiers de la liste « Demain, aux archives » et noter ce que vous y trouvez."
            : "Relire les points relevés dans le classeur et noter vos décisions."}
        </TimelineStep>
        <TimelineStep n={2} who="Avec votre directeur">
          {nQuestions
            ? `Trancher les ${nQuestions} questions, en commençant par celles « avant toute analyse ».`
            : "Valider avec lui ce que vous allez présenter."}
        </TimelineStep>
        <li className="relative">
          <span className="absolute -left-[2.6rem] top-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground ring-4 ring-background sm:-left-[3.1rem]">
            3
          </span>
          <div className="flex flex-wrap gap-6 rounded-2xl bg-brand p-6 text-brand-foreground sm:p-8">
            <div className="min-w-0 flex-[999_1_420px] space-y-4">
              <p className="font-hand text-2xl text-highlight">avec nous</p>
              <h2 className="text-3xl leading-tight sm:text-4xl">
                Votre partie Résultats, prête pour le jury.
              </h2>
              <ul className="space-y-2">
                {[
                  "Votre tableau corrigé, prêt pour les calculs",
                  "Les tableaux et figures de votre partie Résultats",
                  "Les calculs adaptés à votre thèse, expliqués simplement",
                  "Un médecin et un biostatisticien relisent tout",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 leading-relaxed">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-highlight" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="rounded-lg bg-brand-foreground/10 px-4 py-3 text-sm leading-relaxed">
                <strong>Vous</strong>&nbsp;: ouvrir les dossiers de la liste et trancher les
                questions avec votre directeur. <strong>Nous</strong>&nbsp;: tout le reste, du
                nettoyage de la base aux tableaux finaux.
              </p>
              {needsHumanReview && (
                <p className="text-sm leading-relaxed opacity-90">
                  Vu les points bloquants de votre base, nous vous recontactons aussi sous 48&nbsp;h
                  ouvrées pour en parler.
                </p>
              )}
            </div>
            <div className="flex flex-[1_1_240px] flex-col justify-center gap-3">
              <p className="font-display text-5xl leading-none">{ANALYSIS_PRICE}</p>
              <p className="text-sm opacity-90">
                Livrée en 1&nbsp;semaine · plus de 30 thèses accompagnées.
              </p>
              <WhatsAppButton
                label="Parler de mon analyse à Dr Hamza"
                className="bg-background text-brand hover:bg-background/90"
              />
              <p className="text-sm leading-relaxed opacity-90">
                Dites-nous la date de votre soutenance&nbsp;: nous réservons votre semaine
                d'analyse.
              </p>
              <Link
                to="/contact"
                className="text-sm underline decoration-brand-foreground/60 underline-offset-4 hover:decoration-brand-foreground"
              >
                ou par le formulaire de contact
              </Link>
            </div>
          </div>
        </li>
      </ol>
    </section>
  );
}

function TimelineStep({ n, who, children }: { n: number; who: string; children: React.ReactNode }) {
  return (
    <li className="relative">
      <span className="absolute -left-[2.6rem] top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-card text-sm font-bold ring-4 ring-background sm:-left-[3.1rem]">
        {n}
      </span>
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{who}</p>
        <p className="mt-1 leading-relaxed">{children}</p>
      </div>
    </li>
  );
}

export function TrustStrip() {
  const items = [
    { icon: Stethoscope, text: "Une équipe de médecins et de biostatisticiens" },
    { icon: MessageCircle, text: "Dr Hamza joignable directement sur WhatsApp" },
    { icon: FileLock2, text: "Votre fichier d'origine n'est jamais modifié" },
    { icon: Clock, text: "Vos données supprimées au bout de 30 jours" },
  ];
  return (
    <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2.5 text-sm text-foreground/80">
          <Icon className="h-4 w-4 shrink-0 text-brand" />
          {text}
        </li>
      ))}
    </ul>
  );
}

/** Barre WhatsApp collante sur mobile, une fois les points bloquants lus, et masquée
 * quand l'offre est à l'écran. */
export function StickyWhatsApp() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const points = document.getElementById("points-bloquants");
      const offer = document.getElementById("suite");
      const vh = window.innerHeight;
      const pastPoints = points ? points.getBoundingClientRect().bottom < vh * 0.5 : false;
      const offerRect = offer?.getBoundingClientRect();
      const offerOnScreen = offerRect ? offerRect.top < vh && offerRect.bottom > 0 : false;
      setVisible(pastPoints && !offerOnScreen);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur transition-transform md:hidden",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={visible ? 0 : -1}
        className="flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 font-semibold text-brand-foreground"
      >
        <MessageCircle className="h-5 w-5" /> L'analyse en 1&nbsp;semaine · {ANALYSIS_PRICE}
      </a>
    </div>
  );
}

/* -------------------------------------------------- 8. détail technique */

const SEVERITY_LABEL: Record<string, string> = {
  critique: "Avant l'analyse",
  majeure: "Importante",
  moderee: "Secondaire",
  mineure: "Secondaire",
};
const SEVERITY_ORDER = ["critique", "majeure", "moderee", "mineure"];

/** Les 8 domaines de la grille, en mots simples (le nom technique reste affiché en petit). */
const DOMAIN_PLAIN: Record<number, string> = {
  1: "Chaque patient compté une seule fois",
  2: "Des cases remplies",
  3: "Des valeurs possibles",
  4: "Des colonnes qui ne se contredisent pas",
  5: "Un tableau fidèle à votre protocole",
  6: "Un critère principal mesurable",
  7: "Des colonnes expliquées",
  8: "Prêt pour les calculs prévus",
};

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
  const cap = scoreDetail?.plafonds_appliques?.[0];
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {scoreDetail && (
        <Fold title="Votre note, point par point">
          {cap && (
            <p className="mb-4 text-sm text-muted-foreground">
              Les 8 points totalisent {fr(scoreDetail.score_brut)}/100, mais la note ne peut pas
              dépasser {fr(cap.plafond)} tant que ce problème reste&nbsp;:{" "}
              {cap.defaut.toLowerCase()}.
            </p>
          )}
          <ul className="space-y-3">
            {scoreDetail.domaines.map((d) => {
              const ratio = d.max ? Math.round((d.obtenu / d.max) * 100) : 0;
              return (
                <li key={d.domaine}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{DOMAIN_PLAIN[d.domaine] ?? d.nom}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {fr(d.obtenu)}/{d.max}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        ratio >= 80 ? "bg-brand" : ratio >= 55 ? "bg-amber-500" : "bg-destructive",
                      )}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Fold>
      )}
      {sorted.length > 0 && (
        <Fold title={`Les ${sorted.length} points relevés, un par un`}>
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
                  {f.rows_fr && <span className="text-muted-foreground">Patients {f.rows_fr}</span>}
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
          Nous relisons votre tableau colonne par colonne, puis patient par patient&nbsp;: patients
          saisis deux fois, valeurs impossibles, dates dans le mauvais ordre, scores mal calculés,
          cases vides, et ce que prévoit votre protocole. La note sur 100 suit une grille de 8
          points conçue par nos médecins et biostatisticiens. Votre fichier d'origine n'est jamais
          modifié et rien n'est inventé&nbsp;: une case vide reste vide.
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

/* ------------------------------------------ analyse livrée (offre 500 DT) */

export function AnalysisDelivered({
  docxHref,
  xlsxHref,
  deliveredAt,
}: {
  docxHref: string;
  xlsxHref: string;
  deliveredAt: string | null;
}) {
  return (
    <section className="flex flex-wrap items-center gap-5 rounded-2xl bg-brand p-6 text-brand-foreground sm:p-8">
      <div className="min-w-0 flex-[999_1_360px] space-y-2">
        <p className="font-hand text-2xl text-highlight">c'est prêt</p>
        <h2 className="text-3xl leading-tight sm:text-4xl">Votre partie Résultats est livrée.</h2>
        <p className="leading-relaxed opacity-90">
          Le texte, les tableaux et les figures, relus par notre équipe, et le paragraphe « Analyse
          statistique » à insérer dans votre Matériel et méthodes.
          {deliveredAt && ` Livrée le ${new Date(deliveredAt).toLocaleDateString("fr-FR")}.`}
        </p>
      </div>
      <div className="flex flex-[1_1_220px] flex-col gap-3">
        <Button asChild size="lg" className="bg-background text-brand hover:bg-background/90">
          <a href={docxHref}>
            <Download /> Partie Résultats (Word)
          </a>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-brand-foreground/60 bg-transparent text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
        >
          <a href={xlsxHref}>
            <FileSpreadsheet /> Tableaux et base d'analyse (Excel)
          </a>
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ 9. classeur */

export function WorkbookDownload({ href }: { href: string }) {
  return (
    <section id="classeur" className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <FileSpreadsheet className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-[999_1_320px] space-y-1">
          <p className="text-lg font-bold">Votre classeur d'audit (Excel)</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Votre bilan · Aux archives, la seule feuille à remplir (elle met votre avancement à
            jour) · Questions au directeur · Pour aller plus loin. Prêt à imprimer.
          </p>
        </div>
        <Button asChild size="lg" variant="outline">
          <a href={href}>
            <Download /> Télécharger
          </a>
        </Button>
      </div>
      <p className="flex items-start gap-2 text-sm text-foreground/80">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <span>
          Le tableau corrigé vous est remis avec l'analyse, une fois les dossiers vérifiés&nbsp;:
          faire les calculs avant fausserait vos résultats.
        </span>
      </p>
    </section>
  );
}
