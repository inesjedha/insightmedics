import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — Insight Medics" },
      {
        name: "description",
        content:
          "Audit IA gratuit. Analyse + résultats à 500 DT. Discussion à 500 DT. Accompagnement IMRAD complet à 1 200 DT.",
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

const tiers = [
  {
    name: "Audit IA",
    price: "0 DT",
    sub: "Gratuit · sans engagement",
    features: [
      "Contrôle qualité de la base",
      "Analyse de la structure",
      "Score /100",
      "Rapport PDF par email & SMS",
    ],
    cta: { to: "/audit" as const, label: "Lancer un audit" },
    highlighted: false,
  },
  {
    name: "Analyse + résultats",
    price: "500 DT",
    sub: "Le plus demandé",
    features: [
      "Analyses statistiques complètes",
      "Tableaux & figures publiables",
      "Rédaction des résultats",
      "Validation humaine",
    ],
    cta: { to: "/contact" as const, label: "Demander un devis" },
    highlighted: false,
  },
  {
    name: "Discussion",
    price: "500 DT",
    sub: "Rédaction ciblée",
    features: [
      "Recherche bibliographique",
      "Argumentation structurée",
      "Forces & limites",
      "Aller-retours inclus",
    ],
    cta: { to: "/contact" as const, label: "Demander un devis" },
    highlighted: false,
  },
  {
    name: "IMRAD complet",
    price: "1 200 DT",
    sub: "Accompagnement intégral",
    features: [
      "Introduction",
      "Matériel & Méthodes",
      "Résultats",
      "Discussion",
      "Conclusion",
    ],
    cta: { to: "/contact" as const, label: "Discuter du projet" },
    highlighted: true,
  },
];

function TarifsPage() {
  return (
    <SiteLayout>
      <Section className="pb-8">
        <SectionHeader
          eyebrow="Tarifs"
          title="Tarifs transparents en dinars tunisiens."
          description="Tous les livrables sont relus et validés par un humain avant envoi."
        />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <article
              key={t.name}
              className={
                "relative rounded-2xl border bg-card p-6 shadow-sm " +
                (t.highlighted
                  ? "border-brand/40 ring-1 ring-brand/30"
                  : "border-border")
              }
            >
              {t.highlighted && (
                <Badge className="absolute -top-3 left-6 bg-brand text-brand-foreground hover:bg-brand">
                  Recommandé
                </Badge>
              )}
              <h3 className="font-display text-lg font-semibold">{t.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t.sub}</p>
              <div className="mt-5 font-display text-3xl font-extrabold tracking-tight text-brand">
                {t.price}
              </div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button
                  asChild
                  className={
                    t.highlighted
                      ? "w-full bg-brand text-brand-foreground hover:bg-brand/90"
                      : "w-full"
                  }
                  variant={t.highlighted ? "default" : "outline"}
                >
                  <Link to={t.cta.to}>
                    {t.cta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </SiteLayout>
  );
}
