import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Link2Off, Clock } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import {
  ReportHero,
  SpottedInBase,
  ReadingGuide,
  PatientCount,
  BlockingPoints,
  OfferNudge,
  RecordsToOpen,
  DirectorQuestions,
  AnalysisMapCard,
  NextSteps,
  TrustStrip,
  AlreadyInOrder,
  DidYouKnow,
  AnalysisDelivered,
  StickyWhatsApp,
  TechnicalDetails,
  WorkbookDownload,
} from "@/components/audit/ClientReport";
import { ogImageMeta } from "@/lib/seo";
import {
  getClientResult,
  getClientDetail,
  getClientAnalysis,
  clientAnalysisUrl,
  clientDownloadUrl,
  ApiError,
} from "@/lib/api/client";
import type { AiAssessment, AuditResult, ClientAnalysis, ScoreDetail } from "@/lib/api/types";

export const Route = createFileRoute("/r/$token")({
  head: () => ({
    meta: [
      { title: "Votre audit · Insight Medics" },
      { name: "robots", content: "noindex, nofollow" },
      // Aperçu quand l'étudiant envoie son lien à son directeur : rien de son audit.
      { property: "og:title", content: "Audit de la base d'une thèse de médecine" },
      {
        property: "og:description",
        content:
          "Rapport privé Insight Medics : qualité de la base, points à corriger avant l'analyse, questions pour le directeur de thèse.",
      },
      ...ogImageMeta("/og/rapport.jpg", "Rapport d'audit privé Insight Medics"),
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
  const [analysis, setAnalysis] = useState<ClientAnalysis | null>(null);
  const workbookHref = clientDownloadUrl(token, "workbook.xlsx");
  // Cases cochées gardées dans ce navigateur, par audit (un fragment du jeton suffit).
  const storageKey = `im-audit:${token.slice(0, 10)}`;

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
        // Analyse livrée (offre 500 DT) : facultative, une panne ne bloque pas la page.
        getClientAnalysis(token)
          .then((x) => alive && setAnalysis(x))
          .catch(() => undefined);
        setPhase("ready");
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 410) setPhase("expired");
        else if (e instanceof ApiError && e.status === 404) setPhase("invalid");
        else setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <SiteLayout>
      <Section className="bg-paper">
        <SectionHeader
          as="h1"
          eyebrow="Rapport privé"
          title="Votre audit."
          description="Lien privé, valable 30 jours. Ne le partagez qu'avec votre directeur de thèse."
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
            body="Ce lien a expiré : vos fichiers ont été supprimés au bout de 30 jours, comme prévu par notre politique de confidentialité. Contactez-nous si vous avez besoin d'aide."
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
          <div className="mt-8 space-y-10 pb-20 md:pb-0">
            {analysis && (
              <AnalysisDelivered
                docxHref={clientAnalysisUrl(token, "resultats.docx")}
                xlsxHref={clientAnalysisUrl(token, "resultats.xlsx")}
                deliveredAt={analysis.deliveredAt}
              />
            )}
            <ReportHero
              result={result}
              scoreDetail={scoreDetail}
              assessment={assessment}
              workbookHref={workbookHref}
            />
            <ReadingGuide assessment={assessment} />
            <PatientCount result={result} />
            <SpottedInBase
              copies={result.copies}
              highlights={assessment?.highlights}
              twin={assessment?.twin_example}
            />
            <BlockingPoints assessment={assessment} storageKey={storageKey} />
            <AnalysisMapCard map={assessment?.analysis_map} />
            {!analysis && <OfferNudge />}
            <RecordsToOpen
              assessment={assessment}
              storageKey={storageKey}
              workbookHref={workbookHref}
            />
            <DirectorQuestions decisions={assessment?.client_decisions} storageKey={storageKey} />
            <AlreadyInOrder assessment={assessment} />
            {!analysis && (
              <NextSteps assessment={assessment} needsHumanReview={result.needsHumanReview} />
            )}
            <DidYouKnow assessment={assessment} />
            <TrustStrip />
            <TechnicalDetails scoreDetail={scoreDetail} findings={assessment?.findings ?? []} />
            <WorkbookDownload href={workbookHref} />
            {!analysis && <StickyWhatsApp />}
          </div>
        )}
      </Section>
    </SiteLayout>
  );
}

function StateCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="mt-8 flex max-w-xl flex-col items-start gap-3 rounded-md border border-border bg-card p-6 sm:p-8">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-sans text-lg font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
