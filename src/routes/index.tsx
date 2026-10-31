import { faqLd, filmLd, pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FaqSection } from "@/components/site/Faq";
import {
  Hero,
  ProblemApproach,
  AuditTeaser,
  AiHuman,
  Team,
  Authorship,
  ServicesTeaser,
  Testimonials,
  ForWho,
  FinalCta,
  WebinarStrip,
} from "@/components/home/HomeSections";
import { isWebinarUpcoming } from "@/lib/webinar";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      path: "/",
      title: "Aide aux statistiques de thèse de médecine | Insight Medics",
      ogTitle: "Votre thèse de médecine, des statistiques à la soutenance",
      description:
        "Analyses statistiques, résultats, discussion ou thèse complète, rédigés avec vous par des médecins et des biostatisticiens. Tunisie. Test de votre base gratuit.",
      jsonLd: [faqLd, filmLd],
    }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteLayout>
      {isWebinarUpcoming() && <WebinarStrip />}
      <Hero />
      <ProblemApproach />
      <AuditTeaser />
      <AiHuman />
      <Team />
      <Authorship />
      <ServicesTeaser />
      <Testimonials />
      <ForWho />
      <FaqSection className="border-t border-border" />
      <FinalCta />
    </SiteLayout>
  );
}
