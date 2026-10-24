import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { AuditLiveLog, type AuditPhase } from "@/components/audit/AuditLiveLog";
import {
  DeliverablesPreview,
  PreviewNotice,
  ResultsSummary,
} from "@/components/audit/PreviewBlocks";
import {
  AuditScoreCard,
  DomainsCard,
  ExecutiveSummaryCard,
  FindingsCard,
  HumanAlert,
  VerdictBanner,
} from "@/components/audit/ResultCards";
import { UnlockRequestForm } from "@/components/audit/UnlockRequestForm";
import { AuditUploader, ProtocolUploader } from "@/components/audit/UploadPanels";
import { getAuditDetail, uploadAudit } from "@/lib/api/client";
import type { AuditDetail, AuditEvent, AuditResult } from "@/lib/api/types";
import { FULL_AUDIT_PRICE_LABEL } from "@/lib/offers";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit — aperçu gratuit · Insight Medics" },
      {
        name: "description",
        content: `Téléversez votre base : aperçu gratuit (score préliminaire + anomalies structurelles). Audit complet et livrables à ${FULL_AUDIT_PRICE_LABEL}. Formats SPSS, Excel et CSV.`,
      },
      { property: "og:title", content: "Audit — aperçu gratuit · Insight Medics" },
      {
        property: "og:description",
        content: `Votre base radiographiée en quelques minutes. Aperçu gratuit ; audit complet et livrables à ${FULL_AUDIT_PRICE_LABEL}.`,
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const [phase, setPhase] = useState<AuditPhase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [protocol, setProtocol] = useState<File | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Une fois l'aperçu prêt, on amène l'utilisateur aux résultats (sinon ils passent inaperçus).
  useEffect(() => {
    if (phase === "done") {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase]);

  const isPreview = !!result && result.isPreview && !result.paid;
  const nIssues = result?.issues.length ?? 0;
  const nCrit = result?.issues.filter((i) => i.level === "critical").length ?? 0;

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
      const r = await uploadAudit(file, protocol);
      setResult(r);
      const d = await getAuditDetail(r.id);
      setDetail(d);
      setEvents(d.events);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setPhase("idle");
    }
  };

  return (
    <SiteLayout>
      <Section>
        <SectionHeader
          eyebrow="Audit · aperçu gratuit"
          title="Votre base radiographiée en quelques minutes."
          description={`L'aperçu est gratuit et 100 % calculé par du code — zéro valeur hallucinée : score préliminaire et anomalies structurelles. L'audit complet (verdict d'exploitabilité, anomalies classées, plan d'action et livrables) se débloque pour ${FULL_AUDIT_PRICE_LABEL}.`}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
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
                    Analyse en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Lancer l'aperçu gratuit
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
          {/* Rythme vertical unique : un seul écart entre tous les blocs. */}
          <div ref={resultsRef} className="scroll-mt-24 space-y-6">
            <ResultsSummary result={result} nIssues={nIssues} nCrit={nCrit} />
            {isPreview && <PreviewNotice nIssues={nIssues} />}
            {detail?.assessment?.exploitability_verdict && detail.scoreDetail && (
              <VerdictBanner
                verdict={detail.assessment.exploitability_verdict}
                scoreDetail={detail.scoreDetail}
              />
            )}
            <AuditScoreCard
              result={result}
              scoreDetail={detail?.scoreDetail ?? null}
              preview={isPreview}
            />
            {detail?.assessment?.executive_summary_fr && (
              <ExecutiveSummaryCard assessment={detail.assessment} />
            )}
            {detail?.assessment?.findings?.length ? (
              <FindingsCard findings={detail.assessment.findings} />
            ) : null}
            {detail?.scoreDetail && <DomainsCard scoreDetail={detail.scoreDetail} />}
            {result.needsHumanReview && <HumanAlert />}
            {isPreview && <DeliverablesPreview />}
            <UnlockRequestForm result={result} />
          </div>
        </Section>
      )}
    </SiteLayout>
  );
}
