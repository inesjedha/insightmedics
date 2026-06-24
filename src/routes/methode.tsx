import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Cpu,
  ShieldCheck,
  FileCheck2,
  Code2,
  Lock,
  Trash2,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/methode")({
  head: () => ({
    meta: [
      { title: "Méthode — Insight Medics" },
      {
        name: "description",
        content:
          "Notre méthode garantit qu'aucun chiffre n'est inventé : le LLM orchestre, le code Python calcule, l'humain valide. Détails techniques et engagements éthiques.",
      },
      { property: "og:title", content: "Méthode — Insight Medics" },
      {
        property: "og:description",
        content:
          "LLM + exécution de code Python + relecture humaine. Anonymisation, chiffrement et purge automatique de vos fichiers.",
      },
    ],
  }),
  component: MethodePage,
});

const PILLAR_ICONS = [
  <Cpu className="h-5 w-5" />,
  <Code2 className="h-5 w-5" />,
  <UserCheck className="h-5 w-5" />,
];

const SEP_ICONS = [
  <FileCheck2 className="h-5 w-5" />,
  <AlertTriangle className="h-5 w-5" />,
];

const DATA_ICONS = [
  <ShieldCheck className="h-5 w-5" />,
  <Lock className="h-5 w-5" />,
  <Trash2 className="h-5 w-5" />,
];

function MethodePage() {
  const { lang } = useLang();
  const t = useContent(lang).methode;
  return (
    <SiteLayout>
      <Section className="pb-8">
        <SectionHeader
          eyebrow={t.intro.eyebrow}
          title={t.intro.title}
          description={t.intro.desc}
        />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-3">
          {t.pillars.map((p, i) => (
            <Card key={p.title} icon={PILLAR_ICONS[i]} title={p.title} text={p.text} accent="primary" />
          ))}
        </div>
      </Section>

      <Section className="border-y border-border/60 bg-surface/60">
        <SectionHeader
          eyebrow={t.separation.eyebrow}
          title={t.separation.title}
          description={t.separation.desc}
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {t.separation.cards.map((c, i) => (
            <div key={c.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div
                className={
                  i === 0
                    ? "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand"
                    : "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                }
              >
                {SEP_ICONS[i]}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow={t.data.eyebrow}
          title={t.data.title}
          description={t.data.desc}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {t.data.cards.map((c, i) => (
            <Card key={c.title} icon={DATA_ICONS[i]} title={c.title} text={c.text} accent="brand" />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h3 className="font-display text-lg font-semibold">{t.data.pledgeTitle}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t.data.pledgeLead}</p>
          <blockquote className="mt-4 rounded-lg border-l-4 border-brand bg-surface/70 p-4 text-sm italic text-foreground/90">
            {t.data.pledgeQuote}
          </blockquote>
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-primary/20 bg-primary p-8 text-primary-foreground sm:p-12">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                {t.finalTitle}
              </h2>
              <p className="mt-3 text-base text-primary-foreground/80">{t.finalDesc}</p>
            </div>
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/audit">
                {t.finalCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}

function Card({
  icon,
  title,
  text,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  accent: "primary" | "brand";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div
        className={
          accent === "primary"
            ? "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
            : "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand"
        }
      >
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
