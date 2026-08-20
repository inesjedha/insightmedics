import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  Link2Off,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  ShieldCheck,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import {
  VerdictBanner,
  ExecutiveSummaryCard,
  FindingsCard,
  DomainsCard,
  AuditScoreCard,
  HumanAlert,
} from "@/components/audit/ResultCards";
import {
  getClientResult,
  getClientDetail,
  clientDownloadUrl,
  LinkError,
  type ClientDeliverable,
} from "@/lib/api/client";
import type { AiAssessment, AuditResult, ScoreDetail } from "@/lib/api/types";

export const Route = createFileRoute("/r/$token")({
  head: () => ({
    meta: [
      { title: "Votre audit · Insight Medics" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClientResultPage,
});

type Phase = "loading" | "ready" | "invalid" | "expired" | "error";

function ClientResultPage() {
  const { token } = Route.useParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [scoreDetail, setScoreDetail] = useState<ScoreDetail | null>(null);
  const [assessment, setAssessment] = useState<AiAssessment | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getClientResult(token);
        const detail = await getClientDetail(token);
        if (!alive) return;
        setResult(res);
        setScoreDetail(detail.scoreDetail);
        setAssessment(detail.assessment);
        setPhase("ready");
      } catch (e) {
        if (!alive) return;
        if (e instanceof LinkError && e.status === 410) setPhase("expired");
        else if (e instanceof LinkError && e.status === 404) setPhase("invalid");
        else setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <SiteLayout>
      <Section>
        <SectionHeader
          eyebrow="Rapport privé"
          title="Votre audit de qualité de données"
          description="Accès sécurisé par lien privé. Ne le partagez qu'avec les personnes autorisées."
        />

        {phase === "loading" && (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement de votre audit…
          </div>
        )}

        {phase === "invalid" && (
          <StateCard
            icon={<Link2Off className="h-6 w-6" />}
            title="Lien invalide"
            body="Ce lien ne correspond à aucun audit disponible. Vérifiez l'adresse, ou contactez-nous si vous pensez qu'il s'agit d'une erreur."
          />
        )}
        {phase === "expired" && (
          <StateCard
            icon={<Clock className="h-6 w-6" />}
            title="Lien expiré"
            body="Ce lien d'accès a expiré. Contactez-nous pour réactiver l'accès à votre audit."
          />
        )}
        {phase === "error" && (
          <StateCard
            icon={<Link2Off className="h-6 w-6" />}
            title="Audit momentanément indisponible"
            body="Une erreur est survenue au chargement. Réessayez dans un instant ou contactez-nous."
          />
        )}

        {phase === "ready" && result && (
          <div className="mt-8 space-y-6">
            {assessment?.exploitability_verdict && scoreDetail && (
              <VerdictBanner
                verdict={assessment.exploitability_verdict}
                scoreDetail={scoreDetail}
              />
            )}
            <AuditScoreCard result={result} scoreDetail={scoreDetail} preview={false} />
            {assessment?.executive_summary_fr && <ExecutiveSummaryCard assessment={assessment} />}
            {assessment?.findings?.length ? <FindingsCard findings={assessment.findings} /> : null}
            {scoreDetail && <DomainsCard scoreDetail={scoreDetail} />}
            {result.needsHumanReview && <HumanAlert />}
            <DeliverablesDownload token={token} />
          </div>
        )}
      </Section>
    </SiteLayout>
  );
}

function StateCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="mt-8 flex max-w-xl flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

const DELIVERABLES: {
  kind: ClientDeliverable;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    kind: "report.docx",
    label: "Rapport d'audit (Word)",
    hint: "Synthèse, verdict, limites et plan d'action.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    kind: "workbook.xlsx",
    label: "Classeur d'audit (Excel)",
    hint: "Détail par domaine, anomalies et base anonymisée.",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    kind: "base_analyse.csv",
    label: "Base d'analyse (CSV)",
    hint: "Base nettoyée et anonymisée, prête à analyser.",
    icon: <Database className="h-5 w-5" />,
  },
  {
    kind: "base_analyse.sav",
    label: "Base d'analyse (SPSS .sav)",
    hint: "Même base, au format SPSS.",
    icon: <Database className="h-5 w-5" />,
  },
];

function DeliverablesDownload({ token }: { token: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <Download className="h-5 w-5 text-brand" />
        Vos livrables
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-brand" />
        Les identifiants directs ont été retirés : toutes les bases sont anonymisées.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {DELIVERABLES.map((d) => (
          <a
            key={d.kind}
            href={clientDownloadUrl(token, d.kind)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-brand/40 hover:bg-brand/5"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
              {d.icon}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {d.label}
                <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-brand" />
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{d.hint}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
