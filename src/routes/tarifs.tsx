import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import { FaqSection } from "@/components/site/Faq";
import { OfferCard } from "@/components/site/OfferCard";
import { OrderSteps } from "@/components/site/OrderSteps";
import { OFFERS, getOffer } from "@/lib/offers";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs thèse de médecine — Insight Medics" },
      {
        name: "description",
        content: `Audit de votre base gratuit. Analyses + résultats ${getOffer("analyses").priceLabel}, discussion ${getOffer("discussion").priceLabel}, thèse complète ${getOffer("these").priceLabel}. Paiement à la livraison.`,
      },
      { property: "og:title", content: "Tarifs — Insight Medics" },
      {
        property: "og:description",
        content: "Des prix clairs en dinars tunisiens, sans acompte : vous payez à la livraison.",
      },
    ],
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
        description="Sans frais cachés ni acompte : vous payez à la livraison. Chaque livrable est relu par un médecin et un biostatisticien avant de vous être remis."
      />

      <Section>
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">
          <OfferCard
            title="Audit de votre base"
            price="0 DT"
            tagline="Gratuit · sans engagement"
            features={[
              "Contrôle qualité de la base",
              "Analyse de la structure",
              "Score /100",
              "Liste des corrections à faire",
            ]}
            ctaLabel="Tester ma base"
            ctaHref="/audit"
          />

          {/* Offres payantes — source canonique */}
          {OFFERS.map((o) => (
            <OfferCard
              key={o.id}
              number={String(Number(o.number))}
              title={o.shortTitle}
              price={o.priceLabel}
              delay={o.delay}
              tagline={o.tagline}
              features={o.features}
              ctaLabel={o.ctaLabel}
              ctaHref="/contact"
              highlight={o.highlight}
              badge={o.badge}
            />
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-md border border-border bg-surface p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Paiement à la livraison, sans acompte : vous voyez le travail avant de régler, par
            virement ou selon le moyen convenu ensemble.
          </p>
        </div>
      </Section>

      <OrderSteps />

      <FaqSection />

      <FinalCTA
        title="Vous hésitez entre deux formules ?"
        description="Testez d'abord votre base : nous repérons ce qui bloque et vous conseillons la formule la plus juste."
        primary={{ to: "/audit", label: "Tester ma base gratuitement" }}
        secondary={{ to: "/contact", label: "Parler à un expert" }}
      />
    </SiteLayout>
  );
}
