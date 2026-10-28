import { breadcrumbLd, pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { AuditLiveLog, type AuditPhase } from "@/components/audit/AuditLiveLog";
import { TrustStrip } from "@/components/audit/ClientReport";
import { FreePreview } from "@/components/audit/FreePreview";
import { UnlockRequestForm } from "@/components/audit/UnlockRequestForm";
import { AuditUploader, ProtocolUploader } from "@/components/audit/UploadPanels";
import { getPreviewDetail, uploadAudit } from "@/lib/api/client";
import type { AuditEvent, AuditResult, PreviewDetail } from "@/lib/api/types";
import { FULL_AUDIT_PRICE_LABEL } from "@/lib/offers";

export const Route = createFileRoute("/audit")({
  head: () =>
    pageHead({
      path: "/audit",
      ogImage: "/og/audit.jpg",
      title: "Testez gratuitement votre base de thèse | Insight Medics",
      description: `Note sur 100 et problèmes de votre base SPSS, Excel ou CSV en quelques minutes, gratuit et sans inscription. Audit complet, missions et classeur Excel à ${FULL_AUDIT_PRICE_LABEL}.`,
      jsonLd: [breadcrumbLd([["Test gratuit", "/audit"]])],
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

  // Une fois l'aperçu prêt, la zone d'envoi laisse place aux résultats : on remonte en
  // haut des résultats (sinon l'étudiant reste au milieu de la page).
  const showResults = phase === "done" && !!result && !!detail?.view;
  useEffect(() => {
    if (showResults) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showResults]);

  const onFile = (f: File | null) => {
    setFile(f);
    setResult(null);
    setDetail(null);
    setEvents([]);
    setError(null);
    setPhase("idle");
  };

  const restart = () => {
    onFile(null);
    setProtocol(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      if (!d.view)
        throw new Error("Le résultat n'a pas pu être chargé. Réessayez dans un instant.");
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
      {!showResults && (
        <Section className="bg-paper">
          <SectionHeader
            as="h1"
            eyebrow="Test gratuit · sans inscription"
            title={
              <>
                Votre base vérifiée <span className="italic text-brand">en quelques minutes.</span>
              </>
            }
            description={`Gratuit et sans inscription. Nous comptons vos patients et cherchons doublons, cases vides, codes comme 999 et dates impossibles, directement dans vos données : aucune valeur n'est inventée. L'audit complet (missions, questions pour votre directeur, classeur Excel) coûte ${FULL_AUDIT_PRICE_LABEL}.`}
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
              <p className="text-xs leading-relaxed text-muted-foreground">
                En lançant la vérification, vous confirmez que votre base est anonymisée et acceptez
                notre{" "}
                <Link to="/confidentialite" className="text-brand underline underline-offset-2">
                  politique de confidentialité
                </Link>
                .
              </p>
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
      )}

      {showResults && result && detail?.view && (
        <Section className="pt-0">
          <div ref={resultsRef} className="scroll-mt-24 space-y-12">
            <FreePreview result={result} view={detail.view} onRestart={restart} />
            <UnlockRequestForm result={result} />
            <TrustStrip />
          </div>
        </Section>
      )}
    </SiteLayout>
  );
}
