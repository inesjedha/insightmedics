import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  FileBarChart2,
  Cpu,
  Sparkles,
  Lock,
  ClipboardCheck,
  Stethoscope,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Insight Medics — Votre thèse de médecine, prête en 2 semaines" },
      {
        name: "description",
        content:
          "Rédaction scientifique, analyse statistique et data visualisation pour les thèses de médecine. Audit IA gratuit de votre base, puis prise en charge humaine — sans compromis sur la rigueur.",
      },
      { property: "og:title", content: "Insight Medics — Thèse de médecine, prête en 2 semaines" },
      {
        property: "og:description",
        content:
          "Stats qui bloquent, discussion qui piétine, deadline qui écrase ? On reprend la main : audit IA gratuit, puis rédaction et analyse par des experts.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <TrustBar />
      <ProblemSolution />
      <AuditTeaser />
      <HowItWorks />
      <ForWho />
      <FinalCta />
    </SiteLayout>
  );
}

function Hero() {
  const { lang } = useLang();
  const t = useContent(lang).home.hero;
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 bg-grid-soft opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          <Badge variant="outline" className="border-brand/30 bg-brand/5 text-brand">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {t.badge}
          </Badge>
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            {t.titleMain} <span className="text-brand">{t.titleAccent}</span>.
            <span className="block text-2xl font-semibold text-muted-foreground sm:text-3xl mt-3">
              {t.titleSub}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl text-balance">
            {t.desc.map((part, i) =>
              typeof part === "string" ? (
                <span key={i}>{part}</span>
              ) : (
                <strong key={i} className="text-foreground">
                  {part.strong}
                </strong>
              ),
            )}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/audit">
                {t.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/services">{t.ctaSecondary}</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {t.bullets.map((b) => (
              <span key={b} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const { lang } = useLang();
  const items = useContent(lang).home.trust;
  return (
    <div className="border-b border-border/60 bg-surface/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6">
        {items.map((s) => (
          <div key={s.label} className="text-center sm:text-left">
            <div className="font-display text-xl font-bold text-foreground sm:text-2xl">
              {s.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemSolution() {
  const { lang } = useLang();
  const { problem, solution } = useContent(lang).home;
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {problem.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            {problem.title}
          </h2>
          <ul className="mt-6 space-y-4 text-base text-muted-foreground">
            {problem.points.map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/70" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:pl-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {solution.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            {solution.title}
          </h2>
          <ul className="mt-6 space-y-4 text-base text-muted-foreground">
            {solution.points.map((t) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

function AuditTeaser() {
  const { lang } = useLang();
  const t = useContent(lang).home.audit;
  const icons = [
    <ShieldCheck className="h-5 w-5" />,
    <Cpu className="h-5 w-5" />,
    <FileBarChart2 className="h-5 w-5" />,
    <Lock className="h-5 w-5" />,
  ];
  return (
    <Section className="bg-surface/60 border-y border-border/60">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeader eyebrow={t.eyebrow} title={t.title} description={t.desc} />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/audit">
                {t.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/methode">{t.ctaSecondary}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {t.features.map((f, i) => (
            <FeatureCard key={f.title} icon={icons[i]} title={f.title} text={f.text} />
          ))}
        </div>
      </div>
    </Section>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function HowItWorks() {
  const { lang } = useLang();
  const t = useContent(lang).home.how;
  const icons = [
    <ClipboardCheck className="h-5 w-5" />,
    <Sparkles className="h-5 w-5" />,
    <Cpu className="h-5 w-5" />,
    <FileBarChart2 className="h-5 w-5" />,
  ];
  return (
    <Section>
      <SectionHeader align="center" eyebrow={t.eyebrow} title={t.title} description={t.desc} />
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {t.steps.map((s, i) => (
          <div key={s.n} className="relative rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
                {icons[i]}
              </div>
              <span className="font-display text-sm font-semibold tracking-wider text-muted-foreground">
                {s.n}
              </span>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ForWho() {
  const { lang } = useLang();
  const t = useContent(lang).home.who;
  const icons = [
    <GraduationCap className="h-5 w-5" />,
    <Stethoscope className="h-5 w-5" />,
    <FileBarChart2 className="h-5 w-5" />,
  ];
  return (
    <Section className="bg-surface/60 border-y border-border/60">
      <SectionHeader eyebrow={t.eyebrow} title={t.title} description={t.desc} />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {t.audiences.map((a, i) => (
          <div key={a.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              {icons[i]}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{a.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{a.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FinalCta() {
  const { lang } = useLang();
  const t = useContent(lang).home.finalCta;
  return (
    <Section>
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-grid-soft opacity-[0.07]" />
        <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              {t.title}
            </h2>
            <p className="mt-3 text-base text-primary-foreground/80 sm:text-lg">{t.desc}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/audit">
                {t.primary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/contact">{t.secondary}</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
