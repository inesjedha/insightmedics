import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import {
  computeAnalysis,
  deliverAnalysis,
  downloadAnalysisFile,
  generateAnalysisPlan,
  getAnalysis,
  saveAnalysisPlan,
  setAnalysisInstructions,
  uploadAnalysisBase,
} from "@/lib/api/client";
import type { AnalysisDetail, AnalysisResultBlock } from "@/lib/api/types";
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

      <Step n={1} title="Base corrigée et consignes" done={!!a.fileName}>
        <BaseStep
          a={a}
          disabled={!canEditBase || !!busy}
          onUpload={(f) => act("base", () => uploadAnalysisBase(a.id, f))}
          onSave={(t) => act("instructions", () => setAnalysisInstructions(a.id, t))}
          saving={busy === "instructions"}
        />
      </Step>

      <Step n={2} title="Contre-audit et plan d'analyse" done={!!a.planValidatedAt}>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => act("plan", () => generateAnalysisPlan(a.id))}
            disabled={!a.fileName || !canEditBase || !!busy || running}
          >
            {a.status === "planning" ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {a.plan ? "Refaire le plan (IA)" : "Préparer le plan (IA)"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Quelques minutes. Le plan peut aussi être écrit ou corrigé à la main.
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

      <Step n={3} title="Résultats, relecture et livraison" done={a.status === "delivered"}>
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
  onSave,
  saving,
}: {
  a: AnalysisDetail;
  disabled: boolean;
  onUpload: (f: File) => void;
  onSave: (text: string) => void;
  saving: boolean;
}) {
  const [text, setText] = useState(a.instructions);
  return (
    <div className="space-y-4">
      <label
        className={cn(
          "flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <FileUp className="h-4 w-4 text-brand" />
        {a.fileName ? `${a.fileName} · remplacer` : "Déposer la base corrigée (Excel, SPSS, CSV)"}
        <input
          type="file"
          accept=".xlsx,.xls,.sav,.csv"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
      </label>
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Consignes pour le plan : réponses du directeur, définition du critère principal, demandes
          de l'étudiant
        </p>
        <Textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex. : Succès = volume évacué ≥ 90 % du volume estimé (validé par le directeur le 28/10). Les inclusions 34 à 47 sont des doublons, retirés de la base. Comparer les patients ventilés et non ventilés."
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

type PlanLike = {
  title?: string;
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
        {!editing && a.fileName && (
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
  onDownload: (kind: "resultats.docx" | "resultats.xlsx") => void;
  onRecompute: () => void;
  onDeliver: () => void;
}) {
  const sections = new Map((a.text?.sections ?? []).map((s) => [s.analysis_id, s]));
  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => onDownload("resultats.docx")} disabled={busy}>
          <Download /> Word
        </Button>
        <Button variant="outline" onClick={() => onDownload("resultats.xlsx")} disabled={busy}>
          <Download /> Excel
        </Button>
        {a.status === "review" && (
          <>
            <Button variant="ghost" onClick={onRecompute} disabled={busy}>
              <RotateCcw /> Relancer calculs et rédaction
            </Button>
            <Button onClick={onDeliver} disabled={busy}>
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
