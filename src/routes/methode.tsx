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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";

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
      <Section className="pb-8">
        <SectionHeader
          eyebrow="Notre méthode"
          title="Des résultats que vous comprenez et pouvez justifier."
          description="Votre thèse engage votre nom et celui de votre directeur. Notre méthode vise une chose : que chaque chiffre de votre travail soit calculé directement sur vos données, traçable et reproductible — du premier calcul à la soutenance."
        />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-3">
          <Pillar
            icon={<Target className="h-5 w-5" />}
            title="Des analyses choisies pour votre sujet"
            text="Nous partons de votre question de recherche et de votre base pour sélectionner les analyses réellement pertinentes — pas un menu standard appliqué à tout le monde."
          />
          <Pillar
            icon={<Calculator className="h-5 w-5" />}
            title="Des chiffres calculés, jamais saisis à la main"
            text="Chaque valeur — effectifs, p-values, taux de manquants — provient de l'exécution d'un code statistique sur vos données. Rien n'est recopié ni approximé."
          />
          <Pillar
            icon={<UserCheck className="h-5 w-5" />}
            title="Validés par un biostatisticien"
            text="Pour la prestation complète, un biostatisticien revoit, ajuste et valide chaque analyse définitive avant livraison."
          />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Le déroulé, étape par étape"
          title="De votre fichier brut au rapport final."
          description="Six étapes, deux points d'échange avec vous, une validation humaine systématique avant livraison."
        />
        <PipelineTimeline />
        <p className="mt-6 rounded-lg border border-dashed border-border bg-surface/40 p-4 text-sm text-muted-foreground">
          Deux allers-retours avec vous sont inclus dans la prestation complète : un pour cadrer le plan d'analyse, un pour ajuster après restitution.
        </p>
      </Section>







      <Section>
        <div className="rounded-2xl border border-primary/20 bg-primary p-8 text-primary-foreground sm:p-12">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                Voyez la méthode appliquée à votre base.
              </h2>
              <p className="mt-3 text-base text-primary-foreground/80">
                L'audit est gratuit. Vous recevez un rapport clair sur l'état
                de votre base — et un aperçu concret de notre méthode.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link to={siteConfig.cta.audit.to}>
                  {siteConfig.cta.audit.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to={siteConfig.cta.order.to}>Consulter le barème du score</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}

function Pillar({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}


function PipelineTimeline() {
  const steps = [
    {
      n: 1,
      icon: <Upload className="h-4 w-4" />,
      role: "client" as const,
      roleLabel: "Vous",
      title: "Upload",
      text: "Vous déposez votre base (Excel, CSV, SPSS). Chiffrement avant envoi : aucun nom ne quitte votre poste en clair.",
    },
    {
      n: 2,
      icon: <EyeOff className="h-4 w-4" />,
      role: "team" as const,
      roleLabel: "Insight Medics",
      title: "Anonymisation",
      text: "Les colonnes identifiantes sont détectées et pseudonymisées automatiquement. La table de correspondance reste isolée.",
    },
    {
      n: 3,
      icon: <ClipboardList className="h-4 w-4" />,
      role: "exchange" as const,
      roleLabel: "Échange avec vous",
      title: "Cadrage",
      text: "Court questionnaire et appel si besoin : objectif de la thèse, hypothèses, variables clés. C'est vous qui orientez l'analyse.",
    },
    {
      n: 4,
      icon: <PlayCircle className="h-4 w-4" />,
      role: "team" as const,
      roleLabel: "Insight Medics",
      title: "Calculs",
      text: "Analyses statistiques exécutées sur vos données réelles : descriptives, tests, modèles. Les sorties brutes sont conservées et traçables.",
    },
    {
      n: 5,
      icon: <UserCheck className="h-4 w-4" />,
      role: "team" as const,
      roleLabel: "Revue humaine",
      title: "Revue biostat + médecin",
      text: "Un biostatisticien relit les analyses, ajuste les choix de tests, vérifie les hypothèses. Un médecin relit la cohérence clinique.",
    },
    {
      n: 6,
      icon: <PackageCheck className="h-4 w-4" />,
      role: "exchange" as const,
      roleLabel: "Échange avec vous",
      title: "Restitution & livraison",
      text: "On vous présente les résultats, on répond à vos questions, on intègre vos retours, puis on livre le rapport final et les scripts.",
    },
  ];

  const roleBadge: Record<"client" | "team" | "exchange", string> = {
    client: "bg-muted text-foreground/70",
    team: "bg-primary/10 text-primary",
    exchange: "bg-brand/10 text-brand ring-1 ring-brand/30",
  };

  return (
    <div className="mt-10">
      {/* Desktop: horizontal timeline */}
      <ol className="relative hidden lg:grid lg:grid-cols-6 lg:gap-4">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-5 h-px bg-border"
        />
        {steps.map((s) => (
          <li key={s.n} className="relative flex flex-col">
            <div className="relative z-10 flex justify-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card font-display text-sm font-semibold text-primary shadow-sm">
                {s.n}
              </span>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  {s.icon}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadge[s.role]}`}
                >
                  {s.roleLabel}
                </span>
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">
                {s.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {s.text}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Mobile: vertical timeline */}
      <ol className="relative ml-4 space-y-5 border-l border-border pl-6 lg:hidden">
        {steps.map((s) => (
          <li key={s.n} className="relative">
            <span className="absolute -left-[34px] inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card font-display text-xs font-semibold text-primary shadow-sm">
              {s.n}
            </span>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  {s.icon}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadge[s.role]}`}
                >
                  {s.roleLabel}
                </span>
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">
                {s.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {s.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
