import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Hero,
  ProblemApproach,
  AuditTeaser,
  AiHuman,
  ServicesTeaser,
  Testimonials,
  ForWho,
  FinalCta,
} from "@/components/home/HomeSections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Insight Medics — Analyses fiables et rédaction scientifique pour thèses de médecine",
      },
      {
        name: "description",
        content:
          "Biostatistique, rédaction IMRAD et data visualisation pour thèses, mémoires et publications. Audit de votre base offert. Chaque livrable validé par un expert humain.",
      },
      {
        property: "og:title",
        content: "Insight Medics — La rigueur qu'attend votre jury",
      },
      {
        property: "og:description",
        content:
          "Analyses statistiques, rédaction IMRAD, data visualisation. Audit de base offert. Validation humaine systématique.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <ProblemApproach />
      <AuditTeaser />
      <AiHuman />
      <ServicesTeaser />
      <Testimonials />
      <ForWho />
      <FinalCta />
    </SiteLayout>
  );
}
