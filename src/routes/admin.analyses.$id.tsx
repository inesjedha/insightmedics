import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Play,
  Rocket,
  RotateCcw,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import {
  computeAnalysis,
  deliverAnalysis,
  dropAnalysisBase,
  downloadAnalysisFile,
  generateAnalysisPlan,
  getAnalysis,
  getFicheSchema,
  launchAnalysis,
  saveAnalysisFiche,
  saveAnalysisPlan,
  setAnalysisInstructions,
  uploadAnalysisBase,
} from "@/lib/api/client";
import type {
  AnalysisDetail,
  AnalysisFile,
  AnalysisResultBlock,
  FicheSchema,
  ThesisDraftBlock,
} from "@/lib/api/types";
import { FicheForm } from "@/components/theses/FicheForm";
import { useFileDrop } from "@/components/audit/useFileDrop";
import { AdminPageHeader, ErrorBanner } from "@/components/admin/AdminUi";
import { AnalysisStatusBadge } from "@/components/admin/AnalysisStatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analyses/$id")({
  component: AdminAnalysis,
});

const POLL_MS = 5000;

function AdminAnalysis() {
  const { id } = Route.useParams();
  const [a, setA] = useState<AnalysisDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [schema, setSchema] = useState<FicheSchema | null>(null);

  useEffect(() => {
    getFicheSchema()
      .then(setSchema)
      .catch(() => undefined);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setA(await getAnalysis(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const running = a?.status === "planning" || a?.status === "computing";
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(timer);
  }, [running, refresh]);

  const act = async (name: string, fn: () => Promise<AnalysisDetail | void>) => {
    setBusy(name);
    setError(null);
    try {
      const out = await fn();
      if (out) setA(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  };

  if (!a) {
    return error ? (
      <ErrorBanner message={error} onRetry={refresh} />
    ) : (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
      </div>
    );
  }

  const canEditBase = ["awaiting_base", "plan_ready", "failed"].includes(a.status);
  return (
    <div className="space-y-6">
      <Link
        to="/admin/analyses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Toutes les analyses
      </Link>
      <AdminPageHeader title={a.auditFileName ?? "Analyse"} />
      <div className="-mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <AnalysisStatusBadge status={a.status} />
        <span className="font-mono text-[11px]">{a.id}</span>
        {a.auditToken && (
          <a
            href={`/r/${a.auditToken}`}
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline"
          >
            Page de l'étudiant
          </a>
        )}
      </div>
      {error && <ErrorBanner message={error} />}
      {a.error && !error && <ErrorBanner message={a.error} />}

      <Step
        n={1}
        title="Fiche de mission de la thèse (format faculté)"
        done={!!a.fiche?.["these.faculte"]}
      >
        <FacultyPicker
          value={typeof a.fiche?.["these.faculte"] === "string" ? a.fiche["these.faculte"] : null}
          disabled={running || a.status === "delivered" || !!busy}
          onPick={(code) => act("fiche", () => saveAnalysisFiche(a.id, { "these.faculte": code }))}
        />
        <p className="text-sm text-muted-foreground">
          Le reste de la fiche est rempli par l'étudiant sur son lien privé et complété ici.
        </p>
        {schema ? (
          <FicheForm
            schema={schema}
            value={a.fiche ?? {}}
            visible={(key) => key !== "these.faculte"}
            showWho
            disabled={running || a.status === "delivered" || !!busy}
            saving={busy === "fiche"}
            onSave={(patch) => act("fiche", () => saveAnalysisFiche(a.id, patch))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Chargement du formulaire…</p>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button
            onClick={() => act("launch", () => launchAnalysis(a.id))}
            disabled={!canEditBase || !!busy || running}
          >
            {running && a.autoRun ? <Loader2 className="animate-spin" /> : <Rocket />}
            Tout lancer
          </Button>
          <span className="text-xs text-muted-foreground">
            Nettoyage et plan, calculs, rédaction et contrôles, d'une traite (deux appels IA). Arrêt
            au plan s'il y a une question à trancher. Il ne reste qu'à relire et livrer.
          </span>
        </div>
      </Step>

      <Step n={2} title="Base et réponses de l'étudiant" done={!!a.plan}>
        <BaseStep
          a={a}
          disabled={!canEditBase || !!busy}
          onUpload={(f) => act("base", () => uploadAnalysisBase(a.id, f))}
          onDrop={() => act("base", () => dropAnalysisBase(a.id))}
          onSave={(t) => act("instructions", () => setAnalysisInstructions(a.id, t))}
          saving={busy === "instructions"}
        />
      </Step>

      <Step n={3} title="Nettoyage de la base et plan d'analyse" done={!!a.planValidatedAt}>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => act("plan", () => generateAnalysisPlan(a.id))}
            disabled={!canEditBase || !!busy || running}
          >
            {a.status === "planning" ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {a.plan ? "Refaire nettoyage et plan (IA)" : "Préparer nettoyage et plan (IA)"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Quelques minutes, un appel IA. L'IA propose les corrections de la base et le plan ; tout
            peut être corrigé à la main.
          </span>
        </div>
        {a.recheck && <Recheck a={a} />}
        <PlanStep
          a={a}
          busy={!!busy || running}
          onSave={(plan) => act("save-plan", () => saveAnalysisPlan(a.id, plan))}
          onValidate={() => act("compute", () => computeAnalysis(a.id))}
        />
      </Step>

      <Step n={4} title="Résultats, relecture et livraison" done={a.status === "delivered"}>
        {a.status === "computing" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculs puis rédaction en cours…
          </p>
        )}
        {a.results ? (
          <ResultsStep
            a={a}
            busy={!!busy || running}
            onDownload={(kind) => act("dl", () => downloadAnalysisFile(a.id, kind))}
            onRecompute={() => act("compute", () => computeAnalysis(a.id))}
            onDeliver={() => act("deliver", () => deliverAnalysis(a.id))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Les résultats apparaissent ici une fois le plan validé.
          </p>
        )}
      </Step>

      {!!a.events?.length && (
        <details className="rounded-md border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Journal ({a.events.length})</summary>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {a.events.map((e, i) => (
              <li key={i}>
                {new Date(e.ts).toLocaleString("fr-FR")} · {e.message}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Step({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2.5 font-sans text-lg font-bold">
        {done ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
            {n}
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}

function BaseStep({
  a,
  disabled,
  onUpload,
  onDrop,
  onSave,
  saving,
}: {
  a: AnalysisDetail;
  disabled: boolean;
  onUpload: (f: File) => void;
  onDrop: () => void;
  onSave: (text: string) => void;
  saving: boolean;
}) {
  const [text, setText] = useState(a.instructions);
  const drop = useFileDrop({ accept: ".xlsx,.xls,.sav,.csv", disabled, onFile: onUpload });
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/40 p-4 text-sm">
        {a.fileName ? (
          <p>
            <span className="font-semibold">Base utilisée : {a.fileName}</span>, corrigée par
            l'étudiant (elle remplace celle de l'audit ; un contre-audit la compare à l'audit).{" "}
            <button
              type="button"
              onClick={onDrop}
              disabled={disabled}
              className="font-medium text-brand hover:underline disabled:opacity-50"
            >
              Revenir à la base de l'audit
            </button>
          </p>
        ) : (
          <p>
            <span className="font-semibold">
              Base utilisée : celle de l'audit ({a.auditFileName ?? "fichier de l'étudiant"})
            </span>
            . Nous la nettoyons nous-mêmes : l'IA propose les corrections, Dr Hamza les valide avec
            le plan, chaque cellule modifiée est notée dans le journal remis à l'étudiant.
          </p>
        )}
        <label
          {...drop.handlers}
          className={cn(
            "mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed bg-card px-3 py-2 text-xs transition-colors",
            drop.dragging ? "border-brand bg-accent" : "border-border",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <FileUp className="h-4 w-4 text-brand" />
          {a.fileName
            ? "Remplacer la base corrigée (glisser ou cliquer)"
            : "Facultatif : l'étudiant a renvoyé une base corrigée ? La glisser ici ou cliquer"}
          <input
            type="file"
            accept=".xlsx,.xls,.sav,.csv"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
        </label>
        {drop.rejected && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            « {drop.rejected} » n'est pas une base : SPSS (.sav), Excel (.xlsx, .xls) ou CSV.
          </p>
        )}
        {disabled && (
          <p className="mt-2 text-xs text-muted-foreground">
            La base ne se remplace qu'avant la validation du plan.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Réponses de l'étudiant et de son directeur : dossiers vérifiés (valeurs relevées, avec la
          ligne), décisions sur les lignes en double, définition du critère principal, demandes
        </p>
        <Textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex. : Succès = volume évacué ≥ 90 % du volume estimé (validé par le directeur le 28/10). Les inclusions 34 à 47 sont des copies des inclusions 4 à 17 : à écarter. Ligne 24 : volume vérifié au dossier = 650 mL. Comparer les patients ventilés et non ventilés."
        />
        <Button variant="outline" size="sm" onClick={() => onSave(text)} disabled={saving}>
          {saving && <Loader2 className="animate-spin" />} Enregistrer les consignes
        </Button>
      </div>
    </div>
  );
}

function Recheck({ a }: { a: AnalysisDetail }) {
  const r = a.recheck!;
  const rows: [string, string][] = [
    ["Patients", "patients"],
    ["Lignes saisies deux fois", "duplicated_rows"],
    ["Fiche vierge", "template_rows"],
    ["Données manquantes (%)", "missing_useful_pct"],
  ];
  return (
    <div className="space-y-3 rounded-lg bg-muted/40 p-4 text-sm">
      <p className="font-semibold">Contre-audit : la base corrigée face à l'audit</p>
      <table className="text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="pr-6 text-left font-normal" />
            <th className="pr-6 text-left font-normal">À l'audit</th>
            <th className="text-left font-normal">Maintenant</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, key]) => (
            <tr key={key}>
              <td className="pr-6">{label}</td>
              <td className="pr-6 tabular-nums">{r.before?.[key] ?? "—"}</td>
              <td className="tabular-nums font-semibold">{r.after?.[key] ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {r.checked_values?.length > 0 && (
        <ul className="space-y-1">
          {r.checked_values.map((c, i) => (
            <li key={i}>
              <span
                className={cn(
                  "mr-2 rounded px-1.5 py-0.5 text-xs font-semibold",
                  c.statut === "modifiée"
                    ? "bg-emerald-500/15 text-emerald-800"
                    : "bg-amber-500/15 text-amber-800",
                )}
              >
                {c.statut}
              </span>
              n° {c.patients} · {c.colonne} : {c.avant} → {c.maintenant || "—"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type CorrectionLike = {
  kind: string;
  column: string;
  reason?: string;
  lines?: number[];
  where?: string | null;
  values?: unknown[];
  mapping?: Record<string, unknown>;
  value?: unknown;
  source?: string;
};

const CORRECTION_LABEL: Record<string, string> = {
  trim: "Espaces retirés",
  missing_codes: "Code de case vide → vide",
  harmonize: "Réponses écrites de la même façon",
  to_number: "Texte → nombre",
  to_date: "Texte → date",
  set_missing: "Valeur impossible → vide",
  set_value: "Valeur corrigée (dossier)",
};

function correctionDetail(c: CorrectionLike): string {
  if (c.kind === "missing_codes") return (c.values ?? []).map(String).join(", ");
  if (c.kind === "harmonize")
    return Object.entries(c.mapping ?? {})
      .map(([k, v]) => `${k} → ${String(v)}`)
      .join(" ; ");
  const where = [
    c.lines?.length ? `lignes ${c.lines.join(", ")}` : "",
    c.where ? `si ${c.where}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (c.kind === "set_value") return `${where} → ${String(c.value)} (${c.source ?? "?"})`;
  return where;
}

type PlanLike = {
  title?: string;
  corrections?: CorrectionLike[];
  to_check?: { lines?: number[]; column?: string; question: string }[];
  population?: { description?: string; exclusions?: { label: string; expr: string }[] };
  derived?: { name: string; label?: string; kind: string; rationale?: string }[];
  groups?: { variable: string } | null;
  analyses?: { id: string; kind: string; title: string }[];
  primary?: string | null;
  questions?: string[];
  not_supported?: string[];
};

const KIND_LABEL: Record<string, string> = {
  describe: "Description",
  proportion: "Taux et IC 95 %",
  compare: "Comparaison de groupes",
  paired: "Évolution (mesures répétées)",
  correlation: "Corrélation",
  logistic: "Régression logistique",
};

function PlanStep({
  a,
  busy,
  onSave,
  onValidate,
}: {
  a: AnalysisDetail;
  busy: boolean;
  onSave: (plan: unknown) => void;
  onValidate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [json, setJson] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const plan = (a.plan ?? null) as PlanLike | null;
  const startEdit = () => {
    setJson(JSON.stringify(a.plan ?? { title: "", analyses: [] }, null, 2));
    setParseError(null);
    setEditing(true);
  };
  const save = () => {
    try {
      onSave(JSON.parse(json));
      setEditing(false);
    } catch {
      setParseError("JSON invalide : vérifiez les virgules et les guillemets.");
    }
  };
  return (
    <div className="space-y-4">
      {plan && !editing && (
        <div className="space-y-3 text-sm">
          <p className="text-base font-semibold">{plan.title}</p>
          {!!plan.corrections?.length && (
            <div>
              <p className="font-medium">
                Nettoyage : {plan.corrections.length} correction
                {plan.corrections.length > 1 ? "s" : ""} (sur une copie, fichier d'origine intact)
              </p>
              <ul className="mt-1 space-y-1">
                {plan.corrections.map((c, i) => (
                  <li key={i} className="rounded-md bg-muted/40 px-3 py-1.5">
                    <span className="font-medium">{c.column}</span> ·{" "}
                    {CORRECTION_LABEL[c.kind] ?? c.kind}
                    {c.reason && <span className="text-muted-foreground"> — {c.reason}</span>}
                    {correctionDetail(c) && (
                      <code className="block text-xs text-muted-foreground">
                        {correctionDetail(c)}
                      </code>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!plan.to_check?.length && (
            <div className="rounded-md bg-amber-500/10 p-3">
              <p className="font-medium">
                À vérifier au dossier par l'étudiant (analysé tel quel en attendant)
              </p>
              <ul className="list-disc pl-5">
                {plan.to_check.map((t, i) => (
                  <li key={i}>
                    {t.lines?.length ? `Lignes ${t.lines.join(", ")} · ` : ""}
                    {t.column ? `${t.column} : ` : ""}
                    {t.question}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.population?.description && <p>{plan.population.description}</p>}
          {!!plan.population?.exclusions?.length && (
            <div>
              <p className="font-medium">Exclusions</p>
              <ul className="list-disc pl-5">
                {plan.population.exclusions.map((e) => (
                  <li key={e.label}>
                    {e.label} <code className="text-xs text-muted-foreground">{e.expr}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!plan.derived?.length && (
            <details>
              <summary className="cursor-pointer font-medium">
                {plan.derived.length} colonnes calculées
              </summary>
              <ul className="mt-1 list-disc pl-5">
                {plan.derived.map((d) => (
                  <li key={d.name}>
                    <code className="text-xs">{d.name}</code> ({d.kind}) {d.label}
                    {d.rationale && <span className="text-muted-foreground"> — {d.rationale}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {plan.groups && <p>Groupes comparés : {plan.groups.variable}</p>}
          <ol className="list-decimal space-y-1 pl-5">
            {(plan.analyses ?? []).map((an) => (
              <li key={an.id}>
                {an.id === plan.primary && (
                  <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                )}
                <span className="font-medium">{an.title}</span>{" "}
                <span className="text-muted-foreground">· {KIND_LABEL[an.kind] ?? an.kind}</span>
              </li>
            ))}
          </ol>
          {!!plan.questions?.length && (
            <div className="rounded-md bg-amber-500/10 p-3">
              <p className="font-medium">À trancher avant de calculer</p>
              <ul className="list-disc pl-5">
                {plan.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {!!plan.not_supported?.length && (
            <p className="text-muted-foreground">
              À faire à la main : {plan.not_supported.join(" ; ")}
            </p>
          )}
        </div>
      )}
      {editing && (
        <div className="space-y-2">
          <Textarea
            rows={18}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            className="font-mono text-xs"
          />
          {parseError && <p className="text-sm text-destructive">{parseError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={busy}>
              Enregistrer le plan
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {!editing && (
          <Button variant="outline" onClick={startEdit} disabled={busy}>
            {a.plan ? "Modifier le plan (JSON)" : "Écrire le plan à la main"}
          </Button>
        )}
        {a.plan && ["plan_ready", "failed"].includes(a.status) && !editing && (
          <Button onClick={onValidate} disabled={busy}>
            <Play /> Valider le plan et lancer les calculs
          </Button>
        )}
      </div>
    </div>
  );
}

function ResultsStep({
  a,
  busy,
  onDownload,
  onRecompute,
  onDeliver,
}: {
  a: AnalysisDetail;
  busy: boolean;
  onDownload: (kind: AnalysisFile) => void;
  onRecompute: () => void;
  onDeliver: () => void;
}) {
  const sections = new Map((a.text?.sections ?? []).map((s) => [s.analysis_id, s]));
  const blocking = (a.checks ?? []).some((c) => c.level === "error");
  const faculty = a.fiche?.["these.faculte"];
  return (
    <div className="space-y-5 text-sm">
      {a.draft && typeof faculty === "string" && (
        <p className="text-muted-foreground">
          Rendu au format :{" "}
          <span className="font-semibold text-foreground">{FACULTIES[faculty] ?? faculty}</span>
          {a.status === "review" &&
            " · une autre faculté choisie à l'étape 1 change la mise en page ; relancer la rédaction pour suivre aussi son plan"}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {(a.deliverables?.length
          ? a.deliverables
          : (["resultats.docx", "resultats.xlsx"] as AnalysisFile[])
        ).map((kind) => (
          <Button key={kind} variant="outline" onClick={() => onDownload(kind)} disabled={busy}>
            <Download /> {FILE_LABEL[kind]}
          </Button>
        ))}
        {a.status === "review" && (
          <>
            <Button variant="ghost" onClick={onRecompute} disabled={busy}>
              <RotateCcw /> Relancer calculs et rédaction
            </Button>
            <Button
              onClick={onDeliver}
              disabled={busy || blocking}
              title={blocking ? "Contrôle bloquant : relancer la rédaction" : undefined}
            >
              <Send /> Relu : livrer à l'étudiant
            </Button>
          </>
        )}
        {a.status === "delivered" && a.deliveredAt && (
          <span className="self-center text-emerald-700">
            Livrée le {new Date(a.deliveredAt).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>
      <ThesisChecks a={a} />
      {a.draft && <DraftPreview a={a} />}
      {!!a.text?.missing?.length && (
        <div className="rounded-md bg-amber-500/10 p-3">
          <p className="font-medium">Reste à faire par le biostatisticien</p>
          <ul className="list-disc pl-5">
            {a.text.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {a.text?.methods_paragraph && (
        <div>
          <p className="font-semibold">Analyse statistique (Matériel et méthodes)</p>
          <p className="text-foreground/80">{a.text.methods_paragraph}</p>
        </div>
      )}
      <CorrectionsJournal log={a.derivedLog} />
      {a.flow && (
        <div>
          <p className="font-semibold">Diagramme de flux</p>
          {a.text?.flow_paragraph && <p className="text-foreground/80">{a.text.flow_paragraph}</p>}
          <ul className="mt-1 text-foreground/80">
            {a.flow.map((f) => (
              <li key={f.label}>
                {f.label} : {f.excluded !== undefined ? `−${f.excluded} → ${f.remaining}` : f.n}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(a.results ?? []).map((r) => (
        <ResultBlock key={r.id} r={r} section={sections.get(r.id)} />
      ))}
    </div>
  );
}

const FACULTIES: Record<string, string> = {
  FMS: "Faculté de médecine de Sousse",
  FMT: "Faculté de médecine de Tunis",
  FMM: "Faculté de médecine de Monastir",
  FMSf: "Faculté de médecine de Sfax",
};

/** Choix de la faculté : il décide du plan, de la charte et du seul rendu produit. */
function FacultyPicker({
  value,
  disabled,
  onPick,
}: {
  value: string | null;
  disabled: boolean;
  onPick: (code: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">
        Faculté de la thèse <span className="text-destructive">*</span>
        <span className="ml-2 font-normal text-muted-foreground">
          plan, charte et mise en page des livrables
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(FACULTIES).map(([code, name]) => (
          <Button
            key={code}
            type="button"
            variant={value === code ? "default" : "outline"}
            disabled={disabled}
            aria-pressed={value === code}
            onClick={() => value !== code && onPick(code)}
          >
            {value === code && <CheckCircle2 />}
            {name.replace("Faculté de médecine de ", "")} ({code})
          </Button>
        ))}
      </div>
      {!value && (
        <p className="text-xs text-amber-700">
          À choisir avant « Tout lancer » (l'étudiant a pu l'indiquer sur son lien).
        </p>
      )}
    </div>
  );
}

const FILE_LABEL: Record<AnalysisFile, string> = {
  "analyse_statistique.docx": "Analyse statistique (Word)",
  "resultats.docx": "Résultats (Word)",
  "resultats.xlsx": "Classeur (Excel)",
};

/** Contrôles automatiques avant livraison (§ 14 des prompts de Dr Hamza). */
function ThesisChecks({ a }: { a: AnalysisDetail }) {
  const checks = a.checks ?? [];
  const toConfirm = a.draft?.to_confirm ?? [];
  const missing = a.draft?.missing ?? [];
  if (!a.draft && !checks.length) return null;
  return (
    <div className="space-y-3">
      {checks.length ? (
        <ul className="space-y-1.5">
          {checks.map((c, i) => (
            <li
              key={i}
              className={cn(
                "flex gap-2 rounded-md p-2",
                c.level === "error" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10",
              )}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {c.level === "error" ? "Bloquant : " : ""}
                {c.message}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Contrôles automatiques passés.
        </p>
      )}
      {!!toConfirm.length && (
        <div className="rounded-md bg-amber-500/10 p-3">
          <p className="font-medium">À confirmer avec l'étudiant (surligné dans le Word)</p>
          <ul className="list-disc pl-5">
            {toConfirm.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {!!missing.length && (
        <div className="rounded-md bg-amber-500/10 p-3">
          <p className="font-medium">Reste à faire par le biostatisticien</p>
          <ul className="list-disc pl-5">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Lecture rapide du brouillon (le Word reste la référence pour la relecture). */
function DraftPreview({ a }: { a: AnalysisDetail }) {
  const draft = a.draft;
  if (!draft) return null;
  const part = (title: string, blocks: ThesisDraftBlock[]) => (
    <details className="rounded-md border border-border p-3">
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-2 space-y-2 text-foreground/80">
        {blocks.map((b, i) => {
          if (b.type === "heading")
            return (
              <p
                key={i}
                className="font-semibold text-foreground"
                style={{ paddingLeft: `${(b.level ?? 0) * 12}px` }}
              >
                {b.text}
              </p>
            );
          if (b.type === "paragraph") return <p key={i}>{b.text}</p>;
          if (b.type === "bullets")
            return (
              <ul key={i} className="list-disc pl-5">
                {(b.items ?? []).map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            );
          return (
            <p key={i} className="text-xs text-muted-foreground">
              [{b.type === "figure" ? "Figure" : "Tableau"} : {b.title}]
            </p>
          );
        })}
      </div>
    </details>
  );
  return (
    <div className="space-y-2">
      {part("Brouillon : Analyse statistique (M&M)", draft.methods)}
      {part("Brouillon : chapitre Résultats", draft.results)}
    </div>
  );
}

type JournalEntry = {
  step?: string;
  kind: string;
  column: string;
  reason?: string;
  n?: number;
  lines?: number[];
  examples?: string[];
  illisibles?: number[];
  source?: string;
};

function CorrectionsJournal({ log }: { log: Record<string, unknown>[] | null }) {
  const entries = (log ?? []).filter((d) => d.step === "correction") as JournalEntry[];
  if (!entries.length) return null;
  const total = entries.reduce((n, e) => n + (e.n ?? 0), 0);
  return (
    <details className="rounded-md border border-border p-3">
      <summary className="cursor-pointer font-semibold">
        Journal des corrections : {total} cellule{total > 1 ? "s" : ""} modifiée
        {total > 1 ? "s" : ""}
      </summary>
      <ul className="mt-2 space-y-2">
        {entries.map((e, i) => (
          <li key={i}>
            <span className="font-medium">{e.column}</span> · {CORRECTION_LABEL[e.kind] ?? e.kind} ·{" "}
            {e.n ?? 0} cellule{(e.n ?? 0) > 1 ? "s" : ""}
            {e.reason && <span className="text-muted-foreground"> — {e.reason}</span>}
            {!!e.lines?.length && (
              <span className="block text-xs text-muted-foreground">
                Lignes {e.lines.join(", ")}
                {(e.n ?? 0) > e.lines.length ? " …" : ""}
              </span>
            )}
            {!!e.examples?.length && (
              <span className="block text-xs text-muted-foreground">{e.examples.join(" · ")}</span>
            )}
            {!!e.illisibles?.length && (
              <span className="block text-xs text-amber-700">
                Illisibles, laissées vides : lignes {e.illisibles.join(", ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

function ResultBlock({
  r,
  section,
}: {
  r: AnalysisResultBlock;
  section?: { heading: string; table_title: string; paragraphs: string[] };
}) {
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <p className="font-semibold">
        {r.primary && <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-500" />}
        {section?.table_title || r.title}
      </p>
      {r.error && <p className="text-destructive">{r.error}</p>}
      {section?.paragraphs.map((p, i) => (
        <p key={i} className="text-foreground/80">
          {p}
        </p>
      ))}
      {r.table.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr className="border-b border-foreground">
                {r.table.columns.map((c, i) => (
                  <th key={i} className="px-2 py-1 text-left">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.table.rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  {row.map((v, j) => (
                    <td key={j} className="whitespace-pre px-2 py-1 tabular-nums">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.warnings.map((w) => (
        <p key={w} className="text-xs italic text-muted-foreground">
          Note : {w}
        </p>
      ))}
      <p className="text-xs text-muted-foreground">Tests : {r.methods.join(" ; ") || "—"}</p>
    </div>
  );
}
