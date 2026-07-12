import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  FileText,
  GraduationCap,
  Microscope,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
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

const OFFER_ICONS: Record<string, ReactNode> = {
  analyses: <BarChart3 className="h-5 w-5" />,
  discussion: <FileText className="h-5 w-5" />,
  these: <GraduationCap className="h-5 w-5" />,
};

function ServicesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Nos services"
        title={
          <>
            Choisissez le périmètre qui correspond à <span className="text-brand">votre étape</span>
            .
          </>
        }
        description="Un audit gratuit pour démarrer, puis trois offres claires en dinars tunisiens. Chaque livrable est validé par un humain — biostatisticien et médecin — avant envoi."
      />

      {/* Audit gratuit — bannière mise en avant */}
      <Section className="pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-2xl border border-border border-l-4 border-l-brand bg-card p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Microscope className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-foreground">
                  <Sparkles className="h-3 w-3" />
                  Gratuit · sans engagement
                </span>
              </div>
              <h2 className="mt-4 font-display text-xl font-bold tracking-tight sm:text-2xl">
                Audit de base de données
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Contrôle qualité automatique de votre base, analyse de la structure, pistes
                d'ajustement. Score /100 + rapport PDF envoyé par email.
              </p>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {[
                  "Tous formats acceptés",
                  "Analyses en temps réel",
                  "Score qualité /100",
                  "Rapport PDF par email",
                ].map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex lg:justify-end">
              <Button
                asChild
                size="lg"
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Link to="/audit">
                  Lancer l'audit gratuit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Offres payantes */}
      <Section className="pt-4 sm:pt-6">
        <div className="grid items-stretch gap-4 sm:gap-6 md:grid-cols-3">
          {OFFERS.map((o) => (
            <OfferCard
              key={o.id}
              number={o.number}
              icon={OFFER_ICONS[o.id]}
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
        primary={{ to: "/audit", label: "Lancer un audit gratuit" }}
        secondary={{ to: "/contact", label: "Parler à un humain" }}
      />
    </SiteLayout>
  );
}
