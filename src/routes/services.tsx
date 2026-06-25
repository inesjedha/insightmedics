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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Insight Medics" },
      {
        name: "description",
        content:
          "Audit gratuit, analyse statistique + rédaction des résultats, rédaction de la discussion, accompagnement IMRAD complet. Tarifs en dinars tunisiens.",
      },
      { property: "og:title", content: "Services — Insight Medics" },
      {
        property: "og:description",
        content:
          "3 manières de travailler avec nous. Tarifs transparents en DT.",
      },
    ],
  }),
  component: ServicesPage,
});

type PaidOffer = {
  number: string;
  icon: ReactNode;
  title: string;
  price: string;
  description: string;
  features: string[];
  cta: { to: "/contact"; label: string };
  highlight?: boolean;
  badge?: string;
};

const paidOffers: PaidOffer[] = [
  {
    number: "01",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Analyse + rédaction des résultats",
    price: "500 DT",
    description:
      "Analyses complètes (descriptif, comparatif, multivarié) et rédaction de la partie « Résultats » prête à intégrer.",
    features: [
      "Cadrage avec un biostatisticien",
      "Tests adaptés à votre design d'étude",
      "Tableaux & figures publiables",
      "Texte des résultats rédigé",
      "Validation humaine",
    ],
    cta: { to: "/contact", label: "Demander cette offre" },
  },
  {
    number: "02",
    icon: <FileText className="h-5 w-5" />,
    title: "Rédaction de la discussion",
    price: "500 DT",
    description:
      "Rédaction structurée : comparaison à la littérature, forces, limites, perspectives.",
    features: [
      "Recherche bibliographique ciblée",
      "Argumentation alignée sur vos résultats",
      "Forces et limites discutées",
      "Aller-retours de relecture inclus",
    ],
    cta: { to: "/contact", label: "Demander cette offre" },
  },
  {
    number: "03",
    icon: <GraduationCap className="h-5 w-5" />,
    title: "Accompagnement IMRAD complet",
    price: "1 200 DT",
    description:
      "De la base brute à la conclusion : introduction, matériel & méthodes, résultats, discussion, conclusion.",
    features: [
      "Introduction rédigée",
      "Matériel & Méthodes rédigés",
      "Analyses + résultats rédigés",
      "Discussion rédigée",
      "Conclusion rédigée",
      "Priorité sur les délais",
    ],
    cta: { to: "/contact", label: "Discuter du projet" },
    highlight: true,
    badge: "Le plus complet",
  },
];

function ServicesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Nos services"
        title={
          <>
            Choisissez le périmètre qui correspond à{" "}
            <span className="text-brand">votre étape</span>.
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
                Contrôle qualité automatique de votre base, analyse de la
                structure, pistes d'ajustement. Score /100 + rapport PDF
                envoyé par email.
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
          {paidOffers.map((o) => (
            <article
              key={o.title}
              className={cn(
                "group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md sm:p-7",
                o.highlight && "border-l-4 border-l-brand",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
                  {o.icon}
                </div>
                <span
                  aria-hidden
                  className="font-display text-2xl font-bold leading-none text-brand/25 sm:text-3xl"
                >
                  {o.number}
                </span>
              </div>

              {o.badge && (
                <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-foreground">
                  <Sparkles className="h-3 w-3" />
                  {o.badge}
                </span>
              )}

              <h3 className="mt-4 font-display text-base font-semibold tracking-tight sm:mt-5 sm:text-lg">
                {o.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {o.description}
              </p>

              <div className="mt-5 font-display text-3xl font-extrabold tracking-tight text-brand">
                {o.price}
              </div>

              <ul className="mt-5 space-y-2.5 text-sm">
                {o.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <Button
                  asChild
                  variant={o.highlight ? "default" : "outline"}
                  className={cn(
                    "w-full",
                    o.highlight &&
                      "bg-brand text-brand-foreground hover:bg-brand/90",
                  )}
                >
                  <Link to={o.cta.to}>
                    {o.cta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </article>
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
