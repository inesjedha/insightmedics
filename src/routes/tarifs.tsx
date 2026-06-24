import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — Insights Medics" },
      {
        name: "description",
        content:
          "Audit IA gratuit. Prestation humaine sur devis, calibrée selon la complexité de votre base et vos délais. Tarifs transparents.",
      },
      { property: "og:title", content: "Tarifs — Insights Medics" },
      {
        property: "og:description",
        content:
          "Audit IA gratuit, analyses humaines sur devis selon la complexité et l'urgence.",
      },
    ],
  }),
  component: TarifsPage,
});

const tiers = [
  {
    name: "Audit IA",
    price: "Gratuit",
    sub: "Sans engagement",
    features: [
      "Audit qualité, structure, pistes d'ajustement",
      "Score /100 et rapport PDF",
      "Anonymisation automatique",
      "Stockage chiffré + purge",
    ],
    cta: { to: siteConfig.cta.audit.to, label: "Lancer un audit" },
    highlighted: false,
  },
  {
    name: "Analyse complète",
    price: "Sur devis",
    sub: "Le plus demandé",
    features: [
      "Cadrage avec biostatisticien",
      "Descriptif + comparatif + multivarié",
      "Tableaux & figures publiables",
      "Délais cadrés sur votre soutenance",
      "Aller-retours de relecture",
    ],
    cta: { to: "/contact", label: "Demander un devis" },
    highlighted: true,
  },
  {
    name: "Accompagnement thèse",
    price: "Sur devis",
    sub: "Suivi complet",
    features: [
      "Audit + analyses + rédaction",
      "Point hebdomadaire dédié",
      "Préparation soutenance",
      "Priorité sur les délais",
    ],
    cta: { to: "/contact", label: "Discuter du projet" },
    highlighted: false,
  },
];

function TarifsPage() {
  return (
    <SiteLayout>
      <Section className="pb-8">
        <SectionHeader
          eyebrow="Tarifs"
          title="Audit gratuit. Prestation humaine sur devis."
          description="Nous ne publions pas de grille fixe pour nos prestations humaines : chaque thèse a sa complexité, son urgence et son périmètre. Le devis est rapide et transparent."
        />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-3">
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
              <div className="mt-5 font-display text-3xl font-extrabold tracking-tight text-foreground">
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

      <Section>
        <div className="rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
          <div className="flex gap-4">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">
                Pourquoi un devis plutôt qu'un tarif fixe ?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Le prix d'une analyse dépend de la complexité de votre base
                (nombre de variables, structure, qualité), du type d'étude
                (transversale, cohorte, cas-témoins, essai), du niveau
                d'ajustement attendu et de l'urgence. On vous répond en moins
                de 48h après réception de votre brief, et le devis est sans
                engagement.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
