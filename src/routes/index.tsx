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
        title: "Insight Medics — Statistiques et rédaction de votre thèse de médecine",
      },
      {
        name: "description",
        content:
          "Envoyez votre base : on fait les statistiques, on rédige résultats et discussion, un médecin et un biostatisticien relisent tout. Thèse complète en 2 semaines. Audit de votre base gratuit.",
      },
      {
        property: "og:title",
        content: "Insight Medics — Votre thèse de médecine, des statistiques à la soutenance",
      },
      {
        property: "og:description",
        content:
          "Statistiques, rédaction IMRAD et figures pour votre thèse. Audit de votre base gratuit. Relu par un médecin et un biostatisticien.",
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
