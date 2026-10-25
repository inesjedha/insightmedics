import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FinalCTA } from "@/components/site/FinalCTA";
import { PageHero } from "@/components/site/PageHero";
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
      <PageHero
        eyebrow="Notre méthode"
        title={
          <>
            Des résultats que vous comprenez et pouvez{" "}
            <span className="italic text-brand">justifier.</span>
          </>
        }
        description="Votre thèse engage votre nom et celui de votre directeur. Notre méthode vise une chose : que chaque chiffre de votre travail soit calculé directement sur vos données, traçable et reproductible, du premier calcul à la soutenance."
      />

      {/* Piliers */}
      <Section>
        <div className="grid items-stretch gap-4 sm:gap-6 md:grid-cols-3">
          <Pillar
            number="01"
            title="Des analyses choisies pour votre sujet"
            text="Nous partons de votre question de recherche et de votre base pour sélectionner les analyses réellement pertinentes — pas un menu standard appliqué à tout le monde."
          />
          <Pillar
            number="02"
            title="Des chiffres calculés, jamais saisis à la main"
            text="Chaque valeur — effectifs, p-values, taux de manquants — provient de l'exécution d'un code statistique sur vos données. Rien n'est recopié ni approximé."
          />
          <Pillar
            number="03"
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
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-md border border-border bg-surface p-5">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Deux allers-retours avec vous sont inclus dans la prestation complète : un pour cadrer
            le plan d'analyse, un pour ajuster après restitution.
          </p>
        </div>
      </Section>

      <FinalCTA
        title={
          <>
            Voyez la méthode <span className="italic text-[#A9B8FF]">appliquée à votre base.</span>
          </>
        }
        description="L'audit est gratuit. Vous recevez un état clair de votre base, et un aperçu concret de notre méthode."
        primary={{ to: siteConfig.cta.audit.to, label: siteConfig.cta.audit.label }}
        secondary={{ to: siteConfig.cta.order.to, label: "Nous contacter" }}
      />
    </SiteLayout>
  );
}

function Pillar({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="border-t border-foreground pt-5">
      <span aria-hidden className="font-hand text-3xl leading-none text-brand">
        {Number(number)}.
      </span>
      <h3 className="mt-2 font-display text-3xl leading-tight">{title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

type Role = "client" | "team" | "exchange";

type Step = {
  n: number;
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
      role: "client",
      roleLabel: "Vous",
      title: "Upload",
      text: "Vous déposez votre base (Excel, CSV, SPSS). Chiffrement avant envoi : aucun nom ne quitte votre poste en clair.",
    },
    {
      n: 2,
      role: "team",
      roleLabel: "Insight Medics",
      title: "Anonymisation",
      text: "Les colonnes identifiantes sont détectées et pseudonymisées automatiquement. La table de correspondance reste isolée.",
    },
    {
      n: 3,
      role: "exchange",
      roleLabel: "Échange avec vous",
      title: "Cadrage",
      text: "Court questionnaire et appel si besoin : objectif de la thèse, hypothèses, variables clés. C'est vous qui orientez l'analyse.",
    },
    {
      n: 4,
      role: "team",
      roleLabel: "Insight Medics",
      title: "Calculs",
      text: "Analyses statistiques exécutées sur vos données réelles : descriptives, tests, modèles. Les sorties brutes sont conservées et traçables.",
    },
    {
      n: 5,
      role: "team",
      roleLabel: "Revue humaine",
      title: "Revue biostat + médecin",
      text: "Un biostatisticien relit les analyses, ajuste les choix de tests, vérifie les hypothèses. Un médecin relit la cohérence clinique.",
      highlight: true,
    },
    {
      n: 6,
      role: "exchange",
      roleLabel: "Échange avec vous",
      title: "Restitution & livraison",
      text: "On vous présente les résultats, on répond à vos questions, on intègre vos retours, puis on livre le rapport final et les scripts.",
    },
  ];

  const labelByRole: Record<Role, string> = {
    client: "text-foreground",
    team: "text-muted-foreground",
    exchange: "text-brand",
  };

  return (
    <ol className="mx-auto mt-12 max-w-3xl border-t border-foreground">
      {steps.map((s) => (
        <li
          key={s.n}
          className={cn(
            "grid grid-cols-[3rem_1fr] gap-x-4 border-b border-border py-6 sm:grid-cols-[4rem_1fr]",
            s.highlight && "bg-highlight/40 -mx-4 px-4 sm:-mx-6 sm:px-6",
          )}
        >
          <span aria-hidden className="font-hand text-4xl leading-none text-brand">
            {s.n}.
          </span>
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.14em]",
                labelByRole[s.role],
              )}
            >
              <span className="sr-only">Rôle : </span>
              {s.roleLabel}
            </p>
            <h3 className="mt-1 font-display text-3xl leading-tight">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.text}</p>
            {s.highlight && (
              <p className="mt-3 -rotate-1 origin-left font-hand text-2xl text-brand">
                biostatisticien + médecin relecteur, sur chaque dossier
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
