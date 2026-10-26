import { breadcrumbLd, pageHead, servicesLd } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import { FaqSection } from "@/components/site/Faq";
import { OFFER_GRID, OfferCard } from "@/components/site/OfferCard";
import { OrderSteps } from "@/components/site/OrderSteps";
import { TestBanner } from "@/components/site/TestBanner";
import { FULL_AUDIT_PRICE_LABEL, OFFERS, getOffer } from "@/lib/offers";

export const Route = createFileRoute("/tarifs")({
  head: () =>
    pageHead({
      path: "/tarifs",
      title: "Tarifs aide thèse de médecine en Tunisie | Insight Medics",
      description: `Test gratuit, audit complet ${FULL_AUDIT_PRICE_LABEL}, analyses + résultats ${getOffer("analyses").priceLabel}, discussion ${getOffer("discussion").priceLabel}, thèse complète ${getOffer("these").priceLabel}. Prix fixé avant de commencer.`,
      jsonLd: [servicesLd, breadcrumbLd([["Tarifs", "/tarifs"]])],
    }),
  component: TarifsPage,
});

function TarifsPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Tarifs"
        title={
          <>
            Des prix clairs, <span className="italic text-brand">en dinars tunisiens.</span>
          </>
        }
        description="Sans frais cachés : le prix est fixé avec vous avant de commencer. Chaque livrable est relu par un médecin et un biostatisticien avant de vous être remis."
      />

      <Section className="pb-0 sm:pb-0">
        <TestBanner />
      </Section>

      <Section className="pt-12 sm:pt-16">
        <SectionHeader
          eyebrow="Formules"
          title="Trois formules, selon ce qui vous manque."
          description="Le prix est convenu avec vous avant de commencer, et il ne change pas en cours de route."
        />
        <div className={`mt-10 ${OFFER_GRID}`}>
          {OFFERS.map((o) => (
            <OfferCard
              key={o.id}
              number={o.number}
              title={o.shortTitle}
              price={o.priceLabel}
              delay={o.delay}
              tagline={o.tagline}
              features={o.features}
              ctaLabel={o.ctaLabel}
              ctaHref="/contact"
              offerId={o.id}
              highlight={o.highlight}
              badge={o.badge}
            />
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-md border border-border bg-surface p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Paiement au lancement du travail, au prix convenu lors de notre appel, par virement ou
            selon le moyen convenu ensemble.
          </p>
        </div>
      </Section>

      <OrderSteps />

      <FaqSection />

      <FinalCTA
        title="Vous hésitez entre deux formules ?"
        description="Testez d'abord votre base : nous repérons ce qui bloque et vous conseillons la formule la plus juste."
        primary={{ to: "/audit", label: "Tester ma base gratuitement" }}
        secondary={{ to: "/contact", label: "Parler à un expert" }}
      />
    </SiteLayout>
  );
}
