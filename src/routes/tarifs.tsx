import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — Insight Medics" },
      {
        name: "description",
        content:
          "Audit IA gratuit. Prestation humaine sur devis, calibrée selon la complexité de votre base et vos délais. Tarifs transparents.",
      },
      { property: "og:title", content: "Tarifs — Insight Medics" },
      {
        property: "og:description",
        content:
          "Audit IA gratuit, analyses humaines sur devis selon la complexité et l'urgence.",
      },
    ],
  }),
  component: TarifsPage,
});

function TarifsPage() {
  const { lang } = useLang();
  const t = useContent(lang).tarifs;
  return (
    <SiteLayout>
      <Section className="pb-8">
        <SectionHeader eyebrow={t.eyebrow} title={t.title} description={t.desc} />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-3">
          {t.tiers.map((tier) => (
            <article
              key={tier.name}
              className={
                "relative rounded-2xl border bg-card p-6 shadow-sm " +
                (tier.highlighted ? "border-brand/40 ring-1 ring-brand/30" : "border-border")
              }
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-6 bg-brand text-brand-foreground hover:bg-brand">
                  {t.recommendedBadge}
                </Badge>
              )}
              <h3 className="font-display text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{tier.sub}</p>
              <div className="mt-5 font-display text-3xl font-extrabold tracking-tight text-foreground">
                {tier.price}
              </div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {tier.features.map((f) => (
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
                    tier.highlighted
                      ? "w-full bg-brand text-brand-foreground hover:bg-brand/90"
                      : "w-full"
                  }
                  variant={tier.highlighted ? "default" : "outline"}
                >
                  <Link to={tier.ctaTo}>
                    {tier.ctaLabel}
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
              <h3 className="font-display text-lg font-semibold">{t.whyTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.whyDesc}</p>
            </div>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
