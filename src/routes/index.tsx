import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FaqSection } from "@/components/site/Faq";
import {
  Hero,
  ProblemApproach,
  AuditTeaser,
  AiHuman,
  Authorship,
  ServicesTeaser,
  Testimonials,
  ForWho,
  FinalCta,
} from "@/components/home/HomeSections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Insight Medics — Statistiques et rédaction de thèse en médecine" },
      {
        name: "description",
        content:
          "Statistiques et accompagnement à la rédaction de votre thèse de médecine, relus par un médecin et un biostatisticien. Audit de votre base gratuit.",
      },
      {
        property: "og:title",
        content: "Votre thèse de médecine, des statistiques à la soutenance",
      },
      {
        property: "og:description",
        content:
          "Envoyez votre base : analyses, résultats et discussion rédigés avec vous, relus par un médecin et un biostatisticien. Audit gratuit.",
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
      <Authorship />
      <ServicesTeaser />
      <Testimonials />
      <ForWho />
      <FaqSection className="border-t border-border" />
      <FinalCta />
    </SiteLayout>
  );
}
