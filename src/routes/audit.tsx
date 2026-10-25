import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { AuditLiveLog, type AuditPhase } from "@/components/audit/AuditLiveLog";
import {
  DeliverablesPreview,
  PreviewNotice,
  ResultsSummary,
} from "@/components/audit/PreviewBlocks";
import { AuditScoreCard, DomainsCard, HumanAlert } from "@/components/audit/ResultCards";
import { UnlockRequestForm } from "@/components/audit/UnlockRequestForm";
import { AuditUploader, ProtocolUploader } from "@/components/audit/UploadPanels";
import { getPreviewDetail, uploadAudit } from "@/lib/api/client";
import type { AuditEvent, AuditResult, PreviewDetail } from "@/lib/api/types";
import { FULL_AUDIT_PRICE_LABEL } from "@/lib/offers";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit gratuit de votre base — Insight Medics" },
      {
        name: "description",
        content: `Testez gratuitement votre base de thèse : score sur 100 et anomalies en quelques minutes. Audit complet et livrables à ${FULL_AUDIT_PRICE_LABEL}. SPSS, Excel, CSV.`,
      },
      { property: "og:title", content: "Audit — aperçu gratuit · Insight Medics" },
      {
        property: "og:description",
        content: `Votre base vérifiée en quelques minutes. Aperçu gratuit ; audit complet et livrables à ${FULL_AUDIT_PRICE_LABEL}.`,
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
  const [detail, setDetail] = useState<PreviewDetail | null>(null);
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
      const d = await getPreviewDetail(r.id);
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
      <Section className="bg-paper">
        <SectionHeader
          as="h1"
          eyebrow="Audit · aperçu gratuit"
          title={
            <>
              Votre base vérifiée <span className="italic text-brand">en quelques minutes.</span>
            </>
          }
          description={`Gratuit et sans inscription. Le score et les anomalies sont calculés par du code, directement sur vos données : aucune valeur n'est inventée. L'audit complet (verdict d'exploitabilité, plan de correction, rapport Word, classeur Excel, base nettoyée) coûte ${FULL_AUDIT_PRICE_LABEL}.`}
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
              <Button size="lg" disabled={!file || phase === "running"} onClick={start}>
                {phase === "running" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Vérification en cours…
                  </>
                ) : (
                  <>
                    Vérifier ma base gratuitement
                    <ArrowRight className="h-4 w-4" aria-hidden />
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
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
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
            <AuditScoreCard
              result={result}
              scoreDetail={detail?.scoreDetail ?? null}
              preview={isPreview}
            />
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
