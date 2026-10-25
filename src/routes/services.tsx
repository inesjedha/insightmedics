import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { FinalCTA } from "@/components/site/FinalCTA";
import { OfferCard } from "@/components/site/OfferCard";
import { OFFERS } from "@/lib/offers";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Insight Medics" },
      {
        name: "description",
        content:
          "Audit gratuit, analyse statistique + rédaction des résultats, rédaction de la discussion, accompagnement thèse complète. Tarifs en dinars tunisiens.",
      },
      { property: "og:title", content: "Services — Insight Medics" },
      {
        property: "og:description",
        content: "3 manières de travailler avec nous. Tarifs transparents en DT.",
      },
    ],
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
            Choisissez le périmètre qui correspond à{" "}
            <span className="italic text-brand">votre étape.</span>
          </>
        }
        description="Un audit gratuit pour démarrer, puis trois offres claires en dinars tunisiens. Chaque livrable est validé par un humain — biostatisticien et médecin — avant envoi."
      />

      {/* Audit gratuit, mis en avant */}
      <Section className="pb-0 sm:pb-0">
        <div className="flex flex-col gap-6 rounded-md border border-foreground bg-card p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              Gratuit · sans engagement
            </p>
            <h2 className="mt-2 font-display text-4xl">
              Audit de votre base : <span className="mark">0 DT</span>
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              Contrôle qualité automatique de votre base, analyse de sa structure et pistes
              d'ajustement, avec un score sur 100.
            </p>
            <ul className="mt-4 grid gap-2 text-[15px] sm:grid-cols-2">
              {[
                "Tous formats acceptés",
                "Analyses en temps réel",
                "Score qualité /100",
                "Liste des corrections à faire",
              ].map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/audit">
              Tester ma base gratuitement
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Offres payantes */}
      <Section className="pt-8 sm:pt-10">
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {OFFERS.map((o) => (
            <OfferCard
              key={o.id}
              number={String(Number(o.number))}
              title={o.title}
              price={o.priceLabel}
              delay={o.delay}
              description={o.description}
              features={o.features}
              ctaLabel={o.ctaLabel}
              ctaHref="/contact"
              highlight={o.highlight}
              badge={o.badge}
            />
          ))}
        </div>
      </Section>

      <FinalCTA
        title="Pas sûr·e du périmètre adapté ?"
        description="Lancez l'audit gratuit de votre base : vous repartez avec un état des lieux clair, et nous vous proposons l'offre la plus juste."
        primary={{ to: "/audit", label: "Tester ma base gratuitement" }}
        secondary={{ to: "/contact", label: "Parler à un humain" }}
      />
    </SiteLayout>
  );
}
