import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  GraduationCap,
  Microscope,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Insight Medics" },
      {
        name: "description",
        content:
          "Audit IA gratuit de votre base, analyse statistique complète, accompagnement rédaction des résultats de thèse. Tous nos services.",
      },
      { property: "og:title", content: "Services — Insight Medics" },
      {
        property: "og:description",
        content:
          "Audit gratuit, analyse statistique complète, rédaction des résultats. Pour thèses, articles et mémoires médicaux.",
      },
    ],
  }),
  component: ServicesPage,
});

const ICONS = [
  <Microscope className="h-5 w-5" />,
  <BarChart3 className="h-5 w-5" />,
  <FileText className="h-5 w-5" />,
  <GraduationCap className="h-5 w-5" />,
];

function ServicesPage() {
  const { lang } = useLang();
  const t = useContent(lang).services;
  return (
    <SiteLayout>
      <Section className="pb-8">
        <SectionHeader eyebrow={t.eyebrow} title={t.title} description={t.desc} />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-2">
          {t.items.map((s, i) => (
            <article
              key={s.title}
              className={
                "relative rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md " +
                (s.highlighted ? "border-brand/40 ring-1 ring-brand/30" : "border-border")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  {ICONS[i]}
                </div>
                {s.badge && (
                  <Badge
                    variant={s.highlighted ? "default" : "secondary"}
                    className={
                      s.highlighted ? "bg-brand text-brand-foreground hover:bg-brand" : ""
                    }
                  >
                    {s.badge}
                  </Badge>
                )}
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>

              <div className="mt-5 font-display text-2xl font-bold text-foreground">{s.price}</div>

              <ul className="mt-5 space-y-2.5 text-sm">
                {s.features.map((f) => (
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
                    s.highlighted
                      ? "w-full bg-brand text-brand-foreground hover:bg-brand/90"
                      : "w-full"
                  }
                  variant={s.highlighted ? "default" : "outline"}
                >
                  <Link to={s.ctaTo}>
                    {s.ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-border bg-surface/60 p-8 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold tracking-tight">
                {t.notSureTitle}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.notSureDesc}</p>
            </div>
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/audit">
                {t.notSureCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
