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
import { siteConfig } from "@/lib/site-config";

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
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 bg-grid-soft opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="border-brand/30 bg-brand/5 text-brand"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Nouveau · Audit IA gratuit de votre base
          </Badge>
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            Votre thèse de médecine,{" "}
            <span className="text-brand">prête en 2 semaines</span>.
            <span className="block text-2xl font-semibold text-muted-foreground sm:text-3xl mt-3">
              Sans compromis sur la rigueur.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl text-balance">
            Vos stats vous bloquent ? Votre discussion piétine ? La deadline
            vous écrase ? On reprend la main : <strong className="text-foreground">audit IA gratuit</strong> de
            votre base, puis rédaction scientifique, analyse statistique et
            data visualisation par des experts.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to={siteConfig.cta.audit.to}>
                {siteConfig.cta.audit.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/services">Voir nos services</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              Audit gratuit, sans engagement
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              Base anonymisée avant analyse
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              Spécialisé thèses de médecine
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { label: "Délai annoncé pour une thèse", value: "2 sem." },
    { label: "Audit IA de votre base", value: "Gratuit" },
    { label: "Périmètre", value: "Rédaction · Stats · Dataviz" },
    { label: "Basé à", value: "Sousse, Tunisie" },
  ];
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
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Le problème
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Vos stats bloquent. Votre discussion piétine. La deadline approche.
          </h2>
          <ul className="mt-6 space-y-4 text-base text-muted-foreground">
            {[
              "Une base SPSS qui dort dans un .sav, sans savoir par où commencer.",
              "Des heures sur SPSS pour des résultats dont vous n'êtes pas sûr.",
              "Une discussion qui ne décolle pas, faute de temps pour la littérature.",
              "Un directeur de thèse exigeant et une soutenance qui se rapproche.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/70" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:pl-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Notre approche
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            On reprend la main. Vous gardez la signature.
          </h2>
          <ul className="mt-6 space-y-4 text-base text-muted-foreground">
            {[
              "Audit IA gratuit : qualité de la base, structure, pistes d'ajustement.",
              "Tous les chiffres sortent de code Python exécuté — zéro valeur hallucinée.",
              "Rédaction scientifique, analyse statistique et data visualisation prises en charge.",
              "Délais calés sur une soutenance : version exploitable en 2 semaines.",
            ].map((t) => (
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
  return (
    <Section className="bg-surface/60 border-y border-border/60">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeader
            eyebrow="Module Audit · gratuit"
            title="Votre base, radiographiée en quelques minutes."
            description="Téléversez votre base (.sav, .xlsx, .csv). Notre IA pilote des analyses Python réelles sur vos données anonymisées et vous renvoie un rapport PDF avec un score de qualité /100."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to={siteConfig.cta.audit.to}>
                {siteConfig.cta.audit.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/methode">
                Comment ça marche
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Anonymisation automatique"
            text="Identifiants, noms, dates de naissance pseudonymisés avant toute analyse."
          />
          <FeatureCard
            icon={<Cpu className="h-5 w-5" />}
            title="LLM + exécution réelle"
            text="Le modèle génère du code Python ; les chiffres viennent du code, pas du LLM."
          />
          <FeatureCard
            icon={<FileBarChart2 className="h-5 w-5" />}
            title="Rapport PDF brandé"
            text="Score /100, tableaux par variable, recommandations priorisées."
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5" />}
            title="Stockage chiffré + purge"
            text="Fichiers chiffrés au repos, supprimés automatiquement après la prestation."
          />
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
  const steps = [
    {
      n: "01",
      title: "Vous téléversez votre base",
      text: "Formats acceptés : .sav (SPSS), .xlsx, .csv. La base est chiffrée et anonymisée avant toute lecture.",
      icon: <ClipboardCheck className="h-5 w-5" />,
    },
    {
      n: "02",
      title: "Cadrage en 2 minutes",
      text: "Type d'étude, variable principale, confusion, taille d'échantillon attendue. Le contexte oriente l'audit.",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      n: "03",
      title: "Audit IA piloté par code",
      text: "Qualité, structure, pistes d'ajustement. Toutes les valeurs proviennent de calculs Python réels.",
      icon: <Cpu className="h-5 w-5" />,
    },
    {
      n: "04",
      title: "Rapport PDF + score /100",
      text: "Résumé exécutif, tableaux variable par variable, recommandations priorisées, CTA vers la prestation humaine.",
      icon: <FileBarChart2 className="h-5 w-5" />,
    },
  ];
  return (
    <Section>
      <SectionHeader
        align="center"
        eyebrow="Comment ça marche"
        title="Quatre étapes, zéro chiffre halluciné."
        description="L'IA orchestre, le code calcule, l'expert humain valide. C'est ce qui rend nos rapports utilisables dans une thèse."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div
            key={s.n}
            className="relative rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
                {s.icon}
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
  const audiences = [
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Thésards en médecine",
      text: "Vous voulez livrer une thèse propre, dans les temps, sans devenir biostatisticien.",
    },
    {
      icon: <Stethoscope className="h-5 w-5" />,
      title: "Médecins & résidents",
      text: "Vous publiez un article, un poster ou un mémoire. Vous avez besoin de fiabilité statistique.",
    },
    {
      icon: <FileBarChart2 className="h-5 w-5" />,
      title: "Équipes hospitalières",
      text: "Vous gérez une cohorte ou un registre. Vous voulez auditer la base avant de la valoriser.",
    },
  ];
  return (
    <Section className="bg-surface/60 border-y border-border/60">
      <SectionHeader
        eyebrow="Pour qui"
        title="Conçu pour les francophones qui manipulent du vrai patient."
        description="Notre cible : la Tunisie, le Maghreb, la France. Vos données restent les vôtres ; nous travaillons sur une copie anonymisée."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {audiences.map((a) => (
          <div key={a.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              {a.icon}
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
  return (
    <Section>
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-grid-soft opacity-[0.07]" />
        <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Audit gratuit aujourd'hui. Thèse prête en 2 semaines.
            </h2>
            <p className="mt-3 text-base text-primary-foreground/80 sm:text-lg">
              En 10 minutes, vous saurez si votre base est exploitable, ce
              qu'il faut corriger, et comment on peut prendre le relais sur la
              rédaction et la dataviz.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <Button
              asChild
              size="lg"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Link to={siteConfig.cta.audit.to}>
                {siteConfig.cta.audit.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/contact">Commander une analyse complète</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
