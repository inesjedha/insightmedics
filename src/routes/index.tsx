import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileBarChart2,
  Cpu,
  Sparkles,
  ClipboardCheck,
  Stethoscope,
  GraduationCap,
  CheckCircle2,
  Clock,
  Gift,
  UserCheck,
  AlertTriangle,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Insight Medics — Thèse de médecine prête en 2 semaines · Analyses en 1 semaine" },
      {
        name: "description",
        content:
          "Rédaction scientifique, analyse statistique et data visualisation pour les thèses de médecine. Audit IA gratuit de votre base, expertise humaine garantie.",
      },
      { property: "og:title", content: "Insight Medics — Thèse prête en 2 semaines" },
      {
        property: "og:description",
        content:
          "Audit IA gratuit, analyses statistiques rigoureuses, rédaction scientifique. Touche humaine systématique.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <ProblemApproach />
      <AuditTeaser />
      <AiHuman />
      <ServicesTeaser />
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

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="border-brand/30 bg-brand/5 text-brand">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Audit IA gratuit de votre base
          </Badge>
          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-balance">
            On boucle votre thèse et vos analyses.{" "}
            <span className="text-brand">Vite. Bien. Avec un humain derrière.</span>
          </h1>
        </div>

        {/* Deux accroches côte à côte */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <PromiseCard
            icon={<GraduationCap className="h-5 w-5" />}
            kicker="Thèse de médecine"
            headline="Prête en"
            value="2 semaines"
          />
          <PromiseCard
            icon={<FileBarChart2 className="h-5 w-5" />}
            kicker="Analyses statistiques"
            headline="Prêtes en"
            value="1 semaine"
          />
        </div>

        {/* Bandeau réassurance */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <ReassuranceBadge icon={<Clock className="h-4 w-4" />}>
            Délai 2 semaines garanti
          </ReassuranceBadge>
          <ReassuranceBadge icon={<Gift className="h-4 w-4" />}>
            Audit IA gratuit
          </ReassuranceBadge>
          <ReassuranceBadge icon={<UserCheck className="h-4 w-4" />}>
            Validation humaine systématique
          </ReassuranceBadge>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Link to={siteConfig.cta.audit.to}>
              Lancer mon audit gratuit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/services">Voir nos services</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function PromiseCard({
  icon,
  kicker,
  headline,
  value,
}: {
  icon: React.ReactNode;
  kicker: string;
  headline: string;
  value: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {kicker}
      </p>
      <p className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
        {headline}
      </p>
      <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
        {value}
      </p>
    </div>
  );
}

function ReassuranceBadge({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-sm font-medium text-foreground">
      <span className="text-brand">{icon}</span>
      {children}
    </span>
  );
}

function ProblemApproach() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Notre constat
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Les <span className="text-brand">statistiques</span> bloquent.
            La <span className="text-brand">rédaction</span> patine. La deadline écrase.
          </h2>
          <ul className="mt-6 space-y-4 text-base text-muted-foreground">
            {[
              "Une base de données qui dort, sans savoir par où commencer.",
              "Des heures perdues sur SPSS pour des résultats incertains.",
              "Une discussion qui ne décolle pas, faute de temps pour la littérature.",
              "Une méthodologie floue à défendre devant le jury.",
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
            <span className="text-brand">Analyses</span> rigoureuses.{" "}
            <span className="text-brand">Rédaction scientifique</span> structurée.{" "}
            <span className="text-brand">Thèse</span> livrable.
          </h2>
          <ul className="mt-6 space-y-4 text-base text-muted-foreground">
            {[
              "Analyses statistiques cadrées par un biostatisticien.",
              "Rédaction scientifique au standard IMRAD.",
              "Data visualisation publiable (tableaux & figures).",
              "Accompagnement humain de bout en bout.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bandeau chiffres réels */}
      <div className="mt-14 grid gap-6 rounded-2xl border border-border bg-surface/60 p-6 sm:grid-cols-3 sm:p-8">
        <Stat value="+30" label="Thèses et projets accompagnés" />
        <Stat value="Gratuit" label="Audit IA systématique" />
        <Stat value="100%" label="Livrables validés par un humain" />
      </div>
    </Section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="font-display text-3xl font-extrabold tracking-tight text-brand">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function AuditTeaser() {
  return (
    <Section className="bg-surface/60 border-y border-border/60">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge variant="outline" className="border-brand/30 bg-brand/5 text-brand">
            <Gift className="mr-1.5 h-3.5 w-3.5" />
            Gratuit · sans engagement
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Votre base radiographiée en quelques minutes.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Téléversez votre base de données (tous formats acceptés). Notre
            module contrôle la qualité, analyse la structure et vous propose
            des pistes d'ajustement concrètes, avec un score /100 et un
            rapport PDF.
          </p>
          <p className="mt-3 text-sm text-muted-foreground/90">
            Tous les chiffres affichés sont calculés par exécution de code —
            zéro valeur hallucinée.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to={siteConfig.cta.audit.to}>
                Lancer mon audit gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StepCard n="01" icon={<ClipboardCheck className="h-5 w-5" />} title="Upload de la base" text="Tous formats acceptés (SPSS, Excel, CSV, etc.)." />
          <StepCard n="02" icon={<Cpu className="h-5 w-5" />} title="Analyses en temps réel" text="Vous voyez le pipeline avancer en direct." />
          <StepCard n="03" icon={<Sparkles className="h-5 w-5" />} title="Score /100" text="Qualité globale, manquants, doublons, alertes." />
          <StepCard n="04" icon={<FileBarChart2 className="h-5 w-5" />} title="Rapport PDF" text="Reçu par email & SMS, avec recommandations." />
        </div>
      </div>
    </Section>
  );
}

function StepCard({
  n,
  icon,
  title,
  text,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
          {icon}
        </div>
        <span className="font-display text-xs font-semibold tracking-wider text-muted-foreground">
          {n}
        </span>
      </div>
      <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function AiHuman() {
  return (
    <Section>
      <SectionHeader
        align="center"
        eyebrow="IA + Humain"
        title="L'IA fait gagner du temps. L'humain garantit la qualité."
        description="Nous assumons l'usage de l'IA pour accélérer l'audit et les premières analyses. Mais chaque livrable est relu et validé par un expert humain — médical et biostatistique — avant de vous être remis."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold">Ce que l'IA fait pour vous</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Tri rapide et profilage automatique de la base.
            </li>
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Détection d'anomalies, valeurs aberrantes, manquants.
            </li>
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Premières analyses descriptives.
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6 shadow-sm">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold">La touche humaine, toujours</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Un médecin valide la pertinence clinique.
            </li>
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Un biostatisticien valide chaque analyse.
            </li>
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Aucun livrable n'est envoyé sans relecture humaine.
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

function ServicesTeaser() {
  const offers = [
    { title: "Audit de base de données", price: "Gratuit — 0 DT", desc: "Contrôle qualité + score + rapport PDF." },
    { title: "Analyse statistique + résultats", price: "500 DT", desc: "Analyses complètes et rédaction des résultats." },
    { title: "Rédaction de la discussion", price: "500 DT", desc: "Discussion structurée et argumentée." },
    { title: "Accompagnement complet IMRAD", price: "1 200 DT", desc: "Intro, M&M, résultats, discussion, conclusion.", highlighted: true },
  ];
  return (
    <Section className="bg-surface/60 border-y border-border/60">
      <SectionHeader
        eyebrow="Services"
        title="3 manières de travailler avec nous."
        description="Commencez par l'audit gratuit. Si vous voulez aller plus loin, choisissez la formule qui correspond à votre besoin."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {offers.map((o) => (
          <div
            key={o.title}
            className={
              "rounded-2xl border bg-card p-6 shadow-sm " +
              (o.highlighted ? "border-brand/40 ring-1 ring-brand/30" : "border-border")
            }
          >
            <h3 className="font-display text-base font-semibold">{o.title}</h3>
            <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-brand">
              {o.price}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{o.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button asChild size="lg" variant="outline">
          <Link to="/services">
            Voir le détail des services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

function ForWho() {
  const audiences = [
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Étudiants en médecine",
      text: "Vous voulez livrer une thèse propre, dans les temps, sans devenir biostatisticien.",
    },
    {
      icon: <Stethoscope className="h-5 w-5" />,
      title: "Médecins résidents",
      text: "Vous publiez un article, un poster ou un mémoire et avez besoin de fiabilité statistique.",
    },
    {
      icon: <FileBarChart2 className="h-5 w-5" />,
      title: "Équipes hospitalières",
      text: "Vous gérez une cohorte ou un registre. Vous voulez auditer la base avant de la valoriser.",
    },
  ];
  return (
    <Section>
      <SectionHeader eyebrow="Pour qui" title="Pour ceux qui travaillent avec du vrai patient." />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
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
              En quelques minutes, vous saurez si votre base est exploitable
              et ce qu'il faut corriger.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary-foreground/80">
              <AlertTriangle className="h-4 w-4" />
              En cas d'alertes critiques, un expert humain vous recontacte sous 48h.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to={siteConfig.cta.audit.to}>
                Lancer mon audit gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
