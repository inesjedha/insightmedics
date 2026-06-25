import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Microscope,
  BarChart3,
  FileText,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
        content:
          "Tarifs transparents en dinars tunisiens pour vos thèses et publications.",
      },
    ],
  }),
  component: TarifsPage,
});

const OFFER_ICONS: Record<string, ReactNode> = {
  analyses: <BarChart3 className="h-5 w-5" />,
  discussion: <FileText className="h-5 w-5" />,
  these: <GraduationCap className="h-5 w-5" />,
};

function TarifsPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Tarifs"
        title={
          <>
            Tarifs transparents en{" "}
            <span className="text-brand">dinars tunisiens</span>.
          </>
        }
        description="Pas de frais cachés. Chaque livrable est relu et validé par un humain — biostatisticien et médecin — avant envoi."
      />

      <Section className="pt-4 sm:pt-6">
        <div className="grid items-stretch gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Audit gratuit en première position — carte simple */}
          <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
                <Microscope className="h-5 w-5" />
              </div>
              <span
                aria-hidden
                className="font-display text-2xl font-bold leading-none text-brand/25 sm:text-3xl"
              >
                00
              </span>
            </div>
            <h3 className="mt-4 font-display text-base font-semibold tracking-tight sm:mt-5 sm:text-lg">
              Audit IA
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Gratuit · sans engagement
            </p>
            <div className="mt-5 font-display text-3xl font-extrabold tracking-tight text-brand">
              0 DT
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                "Contrôle qualité de la base",
                "Analyse de la structure",
                "Score /100",
                "Rapport PDF par email",
              ].map((f) => (
                <li key={f} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <Button asChild variant="outline" className="w-full">
                <Link to="/audit">
                  Lancer un audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </article>

          {/* Offres payantes — source canonique */}
          {OFFERS.map((o) => (
            <OfferCard
              key={o.id}
              number={o.number}
              icon={OFFER_ICONS[o.id]}
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

        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:gap-4 sm:p-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand sm:h-10 sm:w-10">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Paiement à la livraison. Aucun acompte demandé pour les
            prestations en dinars tunisiens — vous validez la qualité avant
            de régler.
          </p>
        </div>
      </Section>

      <FinalCTA
        title="Un doute sur le bon périmètre ?"
        description="Commencez par l'audit gratuit de votre base. Nous identifions les zones à risque et vous proposons l'offre la plus juste."
        primary={{ to: "/audit", label: "Lancer un audit gratuit" }}
        secondary={{ to: "/contact", label: "Parler à un humain" }}
      />
    </SiteLayout>
  );
}
