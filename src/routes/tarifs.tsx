import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import { OfferCard } from "@/components/site/OfferCard";
import { OFFERS } from "@/lib/offers";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — Insight Medics" },
      {
        name: "description",
        content:
          "Audit IA gratuit. Analyse + résultats à 500 DT. Discussion à 500 DT. Accompagnement thèse complète à 1 200 DT.",
      },
      { property: "og:title", content: "Tarifs — Insight Medics" },
      {
        property: "og:description",
        content: "Tarifs transparents en dinars tunisiens pour vos thèses et publications.",
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
            Tarifs transparents en <span className="italic text-brand">dinars tunisiens.</span>
          </>
        }
        description="Pas de frais cachés. Chaque livrable est relu et validé par un humain — biostatisticien et médecin — avant envoi."
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
            Paiement à la livraison. Aucun acompte demandé pour les prestations en dinars tunisiens
            — vous validez la qualité avant de régler.
          </p>
        </div>
      </Section>

      <FinalCTA
        title="Un doute sur le bon périmètre ?"
        description="Commencez par l'audit gratuit de votre base. Nous identifions les zones à risque et vous proposons l'offre la plus juste."
        primary={{ to: "/audit", label: "Tester ma base gratuitement" }}
        secondary={{ to: "/contact", label: "Parler à un humain" }}
      />
    </SiteLayout>
  );
}
