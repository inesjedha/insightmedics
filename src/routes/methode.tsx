import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  UserCheck,
  Target,
  Calculator,
  Upload,
  EyeOff,
  ClipboardList,
  PlayCircle,
  PackageCheck,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/methode")({
  head: () => ({
    meta: [
      { title: "Méthode — Insight Medics" },
      {
        name: "description",
        content:
          "La méthode Insight Medics pour des résultats de thèse traçables et reproductibles : analyses calculées directement sur vos données, validées par un biostatisticien, données patients protégées par des mesures strictes.",
      },
      { property: "og:title", content: "Méthode — Insight Medics" },
      {
        property: "og:description",
        content:
          "Des résultats que vous comprenez et pouvez justifier. Calculés sur vos données, validés par un biostatisticien.",
      },
    ],
  }),
  component: MethodePage,
});

function MethodePage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <Section className="pb-4 pt-12 sm:pb-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand sm:text-[11px] sm:tracking-[0.22em]">
            Notre méthode
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:mt-5 sm:text-5xl lg:text-6xl">
            Des résultats que vous comprenez et pouvez{" "}
            <span className="text-brand">justifier</span>.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground text-balance sm:mt-5 sm:text-lg">
            Votre thèse engage votre nom et celui de votre directeur. Notre
            méthode vise une chose : que chaque chiffre de votre travail soit
            calculé directement sur vos données, traçable et reproductible — du
            premier calcul à la soutenance.
          </p>
          <div className="mx-auto mt-6 h-px w-16 bg-brand/40 sm:mt-8" aria-hidden />
        </div>
      </Section>

      {/* Piliers */}
      <Section className="pt-4 sm:pt-6">
        <div className="grid items-stretch gap-4 sm:gap-6 md:grid-cols-3">
          <Pillar
            number="01"
            icon={<Target className="h-5 w-5" />}
            title="Des analyses choisies pour votre sujet"
            text="Nous partons de votre question de recherche et de votre base pour sélectionner les analyses réellement pertinentes — pas un menu standard appliqué à tout le monde."
          />
          <Pillar
            number="02"
            icon={<Calculator className="h-5 w-5" />}
            title="Des chiffres calculés, jamais saisis à la main"
            text="Chaque valeur — effectifs, p-values, taux de manquants — provient de l'exécution d'un code statistique sur vos données. Rien n'est recopié ni approximé."
          />
          <Pillar
            number="03"
            icon={<UserCheck className="h-5 w-5" />}
            title="Validés par un biostatisticien"
            text="Pour la prestation complète, un biostatisticien revoit, ajuste et valide chaque analyse définitive avant livraison."
          />
        </div>
      </Section>

      {/* Timeline */}
      <Section>
        <SectionHeader
          eyebrow="Le déroulé, étape par étape"
          title="De votre fichier brut au rapport final."
          description="Six étapes, deux points d'échange avec vous, une validation humaine systématique avant livraison."
          align="center"
        />
        <PipelineTimeline />
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:gap-4 sm:p-5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand sm:h-10 sm:w-10">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Deux allers-retours avec vous sont inclus dans la prestation
            complète : un pour cadrer le plan d'analyse, un pour ajuster après
            restitution.
          </p>
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary p-8 text-primary-foreground sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-brand/10 blur-3xl"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <div className="h-px w-12 bg-brand" aria-hidden />
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                Voyez la méthode appliquée à votre base.
              </h2>
              <p className="mt-3 text-base text-primary-foreground/80">
                L'audit est gratuit. Vous recevez un rapport clair sur l'état
                de votre base — et un aperçu concret de notre méthode.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
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
                <Link to={siteConfig.cta.order.to}>
                  Consulter le barème du score
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}

function Pillar({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <span
          aria-hidden
          className="font-display text-3xl font-bold leading-none text-brand/25"
        >
          {number}
        </span>
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

type Role = "client" | "team" | "exchange";

type Step = {
  n: number;
  icon: ReactNode;
  role: Role;
  roleLabel: string;
  title: string;
  text: string;
  highlight?: boolean;
};

function PipelineTimeline() {
  const steps: Step[] = [
    {
      n: 1,
      icon: <Upload className="h-4 w-4" />,
      role: "client",
      roleLabel: "Vous",
      title: "Upload",
      text: "Vous déposez votre base (Excel, CSV, SPSS). Chiffrement avant envoi : aucun nom ne quitte votre poste en clair.",
    },
    {
      n: 2,
      icon: <EyeOff className="h-4 w-4" />,
      role: "team",
      roleLabel: "Insight Medics",
      title: "Anonymisation",
      text: "Les colonnes identifiantes sont détectées et pseudonymisées automatiquement. La table de correspondance reste isolée.",
    },
    {
      n: 3,
      icon: <ClipboardList className="h-4 w-4" />,
      role: "exchange",
      roleLabel: "Échange avec vous",
      title: "Cadrage",
      text: "Court questionnaire et appel si besoin : objectif de la thèse, hypothèses, variables clés. C'est vous qui orientez l'analyse.",
    },
    {
      n: 4,
      icon: <PlayCircle className="h-4 w-4" />,
      role: "team",
      roleLabel: "Insight Medics",
      title: "Calculs",
      text: "Analyses statistiques exécutées sur vos données réelles : descriptives, tests, modèles. Les sorties brutes sont conservées et traçables.",
    },
    {
      n: 5,
      icon: <UserCheck className="h-4 w-4" />,
      role: "team",
      roleLabel: "Revue humaine",
      title: "Revue biostat + médecin",
      text: "Un biostatisticien relit les analyses, ajuste les choix de tests, vérifie les hypothèses. Un médecin relit la cohérence clinique.",
      highlight: true,
    },
    {
      n: 6,
      icon: <PackageCheck className="h-4 w-4" />,
      role: "exchange",
      roleLabel: "Échange avec vous",
      title: "Restitution & livraison",
      text: "On vous présente les résultats, on répond à vos questions, on intègre vos retours, puis on livre le rapport final et les scripts.",
    },
  ];

  const dotByRole: Record<Role, string> = {
    client:
      "border-2 border-primary bg-card text-primary",
    team: "border border-primary bg-primary text-primary-foreground",
    exchange:
      "border-2 border-brand bg-brand/10 text-brand ring-4 ring-brand/10",
  };

  const badgeByRole: Record<Role, string> = {
    client: "bg-primary/5 text-primary ring-1 ring-primary/15",
    team: "bg-primary text-primary-foreground",
    exchange: "bg-brand/10 text-brand ring-1 ring-brand/30",
  };

  return (
    <ol className="relative mx-auto mt-12 max-w-3xl">
      {/* Rail */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-border via-border to-transparent sm:left-6"
      />

      <div className="space-y-6">
        {steps.map((s) => (
          <li key={s.n} className="relative pl-14 sm:pl-16">
            {/* Pastille */}
            <span
              className={cn(
                "absolute left-0 top-1 inline-flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-bold shadow-sm sm:h-12 sm:w-12 sm:text-base",
                dotByRole[s.role],
              )}
              aria-hidden
            >
              {s.n}
            </span>

            <div
              className={cn(
                "relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6",
                s.highlight &&
                  "border-l-4 border-l-brand bg-card pl-5 sm:pl-6",
              )}
            >
              {s.highlight && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-foreground">
                  <Sparkles className="h-3 w-3" />
                  Validation humaine
                </span>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  {s.icon}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                    badgeByRole[s.role],
                  )}
                >
                  <span className="sr-only">Rôle : </span>
                  {s.roleLabel}
                </span>
              </div>

              <h3 className="mt-3 font-display text-base font-semibold tracking-tight sm:text-lg">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {s.text}
              </p>

              {s.highlight && (
                <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex -space-x-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-[11px] font-bold text-primary-foreground">
                      BS
                    </span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-brand text-[11px] font-bold text-brand-foreground">
                      MD
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Biostatisticien + médecin relecteur, sur chaque dossier.
                  </p>
                </div>
              )}
            </div>
          </li>
        ))}
      </div>
    </ol>
  );
}
