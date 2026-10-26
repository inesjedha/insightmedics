import { breadcrumbLd, pageHead, servicesLd } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import { OFFER_GRID, OfferCard } from "@/components/site/OfferCard";
import { OrderSteps } from "@/components/site/OrderSteps";
import { TestBanner } from "@/components/site/TestBanner";
import { OFFERS } from "@/lib/offers";

export const Route = createFileRoute("/services")({
  head: () =>
    pageHead({
      path: "/services",
      title: "Analyses statistiques et rédaction de thèse | Insight Medics",
      description:
        "Test gratuit de votre base, analyses + résultats, discussion ou thèse complète : des formules claires en dinars, par des médecins et des biostatisticiens.",
      jsonLd: [servicesLd, breadcrumbLd([["Services", "/services"]])],
    }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Nos services"
        title={
          <>
            L'aide dont vous avez besoin, <span className="italic text-brand">rien de plus.</span>
          </>
        }
        description="Un test gratuit pour savoir où vous en êtes, puis trois formules claires, en dinars tunisiens. Chaque livrable est relu par un médecin et un biostatisticien avant de vous être remis."
      />

      <Section className="pb-0 sm:pb-0">
        <TestBanner />
      </Section>

      <Section className="pt-12 sm:pt-16">
        <SectionHeader
          eyebrow="Formules"
          title="Trois formules, selon ce qui vous manque."
          description="Le prix est fixé avec vous avant de commencer."
        />
        <div className={`mt-10 ${OFFER_GRID}`}>
          {OFFERS.map((o) => (
            <OfferCard
              key={o.id}
              number={o.number}
              title={o.title}
              price={o.priceLabel}
              delay={o.delay}
              description={o.description}
              features={o.features}
              ctaLabel={o.ctaLabel}
              ctaHref="/contact"
              offerId={o.id}
              highlight={o.highlight}
              badge={o.badge}
            />
          ))}
        </div>
      </Section>

      <OrderSteps />

      <FinalCTA
        title="Vous hésitez entre deux formules ?"
        description="Testez d'abord votre base : vous saurez ce qu'il faut faire, et nous vous conseillerons la formule la plus juste, sans vous pousser à prendre plus."
        primary={{ to: "/audit", label: "Tester ma base gratuitement" }}
        secondary={{ to: "/contact", label: "Parler à un expert" }}
      />
    </SiteLayout>
  );
}
