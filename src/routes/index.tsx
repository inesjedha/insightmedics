import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileBarChart2,
  Cpu,
  ClipboardCheck,
  Stethoscope,
  GraduationCap,
  CheckCircle2,
  Gift,
  UserCheck,
  AlertTriangle,
  HeartHandshake,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
  Check,
  Star,
  PenLine,
  BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Insight Medics — Analyses fiables et rédaction scientifique pour thèses de médecine",
      },
      {
        name: "description",
        content:
          "Biostatistique, rédaction IMRAD et data visualisation pour thèses, mémoires et publications. Audit de votre base offert. Chaque livrable validé par un expert humain.",
      },
      {
        property: "og:title",
        content: "Insight Medics — La rigueur qu'attend votre jury",
      },
      {
        property: "og:description",
        content:
          "Analyses statistiques, rédaction IMRAD, data visualisation. Audit de base offert. Validation humaine systématique.",
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
      <Testimonials />
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
            <Gift className="mr-1.5 h-3.5 w-3.5" />
            Audit de votre base offert
          </Badge>
          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-balance">
            Des analyses fiables.{" "}
            <span className="text-brand">
              Une rédaction au standard scientifique.
            </span>
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg text-balance">
            Biostatistique, rédaction IMRAD et data visualisation pour vos
            thèses, mémoires et publications. Chaque livrable est validé par
            un expert humain.
          </p>
        </div>

        {/* Deux cartes promesse */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <PromiseCard
            icon={<GraduationCap className="h-5 w-5" />}
            kicker="Thèse de médecine"
            headline="Accompagnement complet"
            value="livrée en 2 semaines"
          />
          <PromiseCard
            icon={<FileBarChart2 className="h-5 w-5" />}
            kicker="Analyses statistiques"
            headline="Données analysées & résultats rédigés"
            value="en 1 semaine"
          />
        </div>

        {/* Pills de réassurance */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <ReassuranceBadge icon={<CalendarCheck className="h-4 w-4" />}>
            Délai annoncé, délai tenu
          </ReassuranceBadge>
          <ReassuranceBadge icon={<Gift className="h-4 w-4" />}>
            Audit de base offert
          </ReassuranceBadge>
          <ReassuranceBadge icon={<UserCheck className="h-4 w-4" />}>
            Validation humaine systématique
          </ReassuranceBadge>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Link to={siteConfig.cta.audit.to}>
              Auditer ma base gratuitement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/services">Découvrir nos services</Link>
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
      <p className="mt-2 font-display text-lg font-semibold text-foreground sm:text-xl">
        {headline}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
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
            Le constat
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Une base prête, des résultats incertains, une deadline qui approche.
          </h2>
          <ul className="mt-6 space-y-4 text-base text-muted-foreground">
            {[
              "Une base de données saisie, mais difficile à exploiter seul.",
              "Des heures sur SPSS sans certitude sur la validité des résultats.",
              "Une discussion qui n'avance pas, faute de temps pour la littérature.",
              "Une méthodologie à défendre devant le jury, sans filet.",
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
            Des analyses cadrées. Une rédaction structurée. Une thèse défendable.
          </h2>
          <ul className="mt-6 space-y-4 text-base text-muted-foreground">
            {[
              "Analyses statistiques conçues et vérifiées par un biostatisticien.",
              "Rédaction scientifique au standard IMRAD.",
              "Tableaux et figures prêts pour publication.",
              "Un interlocuteur unique, du début à la soutenance.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bandeau chiffres */}
      <div className="mt-14 grid gap-6 rounded-2xl border border-border bg-surface/60 p-6 sm:grid-cols-3 sm:p-8">
        <Stat value="+30" label="Thèses et projets accompagnés" />
        <Stat value="Offert" label="Audit de base systématique" />
        <Stat value="100%" label="Livrables relus par un expert" />
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
            Offert · sans engagement
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Votre base évaluée en quelques minutes.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Téléversez votre base, quel que soit le format. Notre module en
            contrôle la qualité, en analyse la structure et vous remet un
            score sur 100 et un rapport PDF avec des recommandations
            concrètes.
          </p>
          <p className="mt-3 inline-flex items-start gap-2 text-sm text-muted-foreground/90">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Chaque chiffre du rapport est calculé directement sur vos données
            — rien n'est estimé.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to={siteConfig.cta.audit.to}>
                Auditer ma base gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StepCard
            n="01"
            icon={<ClipboardCheck className="h-5 w-5" />}
            title="Import de la base"
            text="Tous formats acceptés (SPSS, Excel, CSV…)."
          />
          <StepCard
            n="02"
            icon={<Cpu className="h-5 w-5" />}
            title="Analyse en direct"
            text="Suivez le traitement étape par étape."
          />
          <StepCard
            n="03"
            icon={<Sparkles className="h-5 w-5" />}
            title="Score /100"
            text="Qualité, valeurs manquantes, doublons, alertes."
          />
          <StepCard
            n="04"
            icon={<FileBarChart2 className="h-5 w-5" />}
            title="Rapport PDF"
            text="Reçu par email, avec recommandations concrètes."
          />
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
        title="L'IA accélère. L'expert garantit."
        description="Nous utilisons l'IA pour accélérer l'audit et les premières analyses. Mais aucun livrable ne part sans la relecture d'un expert — médical et biostatistique."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold">
            Ce que l'IA prend en charge
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Profilage et tri automatique de la base.
            </li>
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Détection des anomalies, valeurs aberrantes et manquantes.
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
          <h3 className="mt-4 font-display text-xl font-bold">
            Ce qu'un expert valide
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Un médecin vérifie la pertinence clinique.
            </li>
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Un biostatisticien valide chaque analyse.
            </li>
            <li className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Aucun livrable envoyé sans relecture humaine.
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

function ServicesTeaser() {
  const offers: Array<{
    icon: React.ReactNode;
    title: string;
    price: string;
    delay: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
  }> = [
    {
      icon: <FileBarChart2 className="h-5 w-5" />,
      title: "Analyses & résultats",
      price: "500 DT",
      delay: "Livré en 1 semaine",
      features: [
        "Plan d'analyse validé par un biostatisticien",
        "Tests adaptés à votre question de recherche",
        "Tableaux et figures prêts pour la thèse",
        "Rédaction de la section Résultats",
      ],
    },
    {
      icon: <PenLine className="h-5 w-5" />,
      title: "Discussion rédigée",
      price: "500 DT",
      delay: "Livré en 1 semaine",
      features: [
        "Revue de la littérature ciblée",
        "Mise en perspective de vos résultats",
        "Limites et perspectives argumentées",
        "Références au format de votre faculté",
      ],
    },
    {
      icon: <BookOpenCheck className="h-5 w-5" />,
      title: "IMRAD complet",
      price: "1 200 DT",
      delay: "Livré en 2 semaines",
      features: [
        "Tout l'audit + analyses + résultats",
        "Introduction, M&M, Discussion, Conclusion",
        "Tableaux, figures et mise en page",
        "Un interlocuteur unique jusqu'à la soutenance",
      ],
      highlighted: true,
      badge: "Le plus choisi",
    },
  ];

  return (
    <Section className="bg-surface/60 border-y border-border/60">
      <SectionHeader
        eyebrow="Services"
        title="Choisissez la formule qui correspond à votre étape."
        description="Commencez par l'audit offert. Ajoutez ensuite ce dont vous avez besoin : analyses, rédaction, ou accompagnement complet."
      />

      {/* Bannière audit offert */}
      <div className="mt-10 rounded-2xl border border-brand/30 bg-brand/5 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <Gift className="h-5 w-5" />
              </span>
              <Badge variant="outline" className="border-brand/30 bg-background text-brand">
                Offert · 0 DT
              </Badge>
            </div>
            <h3 className="mt-4 font-display text-xl font-bold sm:text-2xl">
              Commencez par l'audit de votre base.
            </h3>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                Contrôle qualité complet
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                Score sur 100 + rapport PDF
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                Sans engagement, sous 24 h
              </li>
            </ul>
          </div>
          <div className="shrink-0">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to={siteConfig.cta.audit.to}>
                Auditer ma base gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Grille 3 formules */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {offers.map((o) => (
          <div
            key={o.title}
            className={
              "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md " +
              (o.highlighted
                ? "border-brand/50 ring-1 ring-brand/30 shadow-md"
                : "border-border")
            }
          >
            {o.badge && (
              <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground shadow-sm">
                <Star className="h-3 w-3 fill-current" />
                {o.badge}
              </span>
            )}

            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              {o.icon}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{o.title}</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold tracking-tight text-brand">
                {o.price}
              </span>
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CalendarCheck className="h-3.5 w-3.5" />
              {o.delay}
            </p>

            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-muted-foreground">
              {o.features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                asChild
                className={
                  "w-full " +
                  (o.highlighted
                    ? "bg-brand text-brand-foreground hover:bg-brand/90"
                    : "")
                }
                variant={o.highlighted ? "default" : "outline"}
              >
                <Link to="/contact">
                  Choisir cette formule
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Réassurance */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand" />
          Paiement à la livraison
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
        <span className="inline-flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-brand" />
          Relu par un médecin et un biostatisticien
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          Devis personnalisé pour articles et mémoires
        </span>
      </div>
    </Section>
  );
}

function ForWho() {
  const audiences = [
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Étudiants en médecine",
      text: "Livrer une thèse solide, dans les temps, sans devenir biostatisticien.",
    },
    {
      icon: <Stethoscope className="h-5 w-5" />,
      title: "Médecins résidents",
      text: "Un article, un poster ou un mémoire qui tient sur le plan statistique.",
    },
    {
      icon: <FileBarChart2 className="h-5 w-5" />,
      title: "Équipes hospitalières",
      text: "Auditer une cohorte ou un registre avant de le valoriser.",
    },
  ];
  return (
    <Section>
      <SectionHeader
        eyebrow="Pour qui"
        title="Pensé pour ceux qui travaillent sur de vraies données patients."
      />
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
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <ShieldCheck className="mr-1.5 inline h-4 w-4 text-brand" />
        Vos données restent confidentielles et ne sont jamais réutilisées.
      </p>
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
              Auditez votre base aujourd'hui. Avancez sereinement.
            </h2>
            <p className="mt-3 text-base text-primary-foreground/80 sm:text-lg">
              En quelques minutes, vous saurez si votre base est exploitable
              et ce qu'il reste à corriger.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary-foreground/80">
              <AlertTriangle className="h-4 w-4" />
              En cas d'alerte critique, un expert vous recontacte sous 48h.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to={siteConfig.cta.audit.to}>
                Auditer ma base gratuitement
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
