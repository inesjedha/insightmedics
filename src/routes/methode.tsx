import { breadcrumbLd, pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FinalCTA } from "@/components/site/FinalCTA";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/methode")({
  head: () =>
    pageHead({
      path: "/methode",
      title: "Notre méthode d'analyse et de relecture | Insight Medics",
      description:
        "Comment nous travaillons : cadrage avec vous, analyses calculées par du code sur vos données, double relecture par un biostatisticien et un médecin.",
      jsonLd: [breadcrumbLd([["Méthode", "/methode"]])],
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
        description="Votre thèse engage votre nom et celui de votre directeur. Notre méthode vise une chose : que chaque chiffre soit calculé sur vos données, traçable et reproductible, et que vous sachiez l'expliquer devant votre jury."
      />

      {/* Piliers */}
      <Section>
        <h2 className="sr-only">Nos trois principes</h2>
        <div className="grid items-stretch gap-4 sm:gap-6 md:grid-cols-3">
          <Pillar
            number="01"
            title="Des analyses choisies pour votre sujet"
            text="Nous partons de votre question de recherche et de votre base pour choisir les analyses vraiment pertinentes, pas un menu standard appliqué à tout le monde."
          />
          <Pillar
            number="02"
            title="Des chiffres calculés, jamais saisis à la main"
            text="Effectifs, valeurs de p, taux de données manquantes : chaque valeur sort d'un code statistique exécuté sur vos données. Rien n'est recopié ni arrondi à la main."
          />
          <Pillar
            number="03"
            title="Validés par un biostatisticien"
            text="Chaque analyse définitive est revue, ajustée si besoin et validée par un biostatisticien avant de vous être livrée."
          />
        </div>
      </Section>

      {/* Timeline */}
      <Section>
        <SectionHeader
          eyebrow="Le déroulé, étape par étape"
          title="De votre fichier brut au rapport final."
          description="Six étapes, deux échanges avec vous, et une double relecture humaine avant chaque livraison."
          align="center"
        />
        <PipelineTimeline />
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-md border border-border bg-surface p-5">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Deux échanges avec vous sont prévus : un pour cadrer le plan d'analyse, un pour ajuster
            après la restitution. Les allers-retours de relecture sont inclus dans le périmètre
            convenu.
          </p>
        </div>
      </Section>

      <FinalCTA
        title={
          <>
            Voyez la méthode{" "}
            <span className="italic text-brand-on-ink">appliquée à votre base.</span>
          </>
        }
        description="Le test est gratuit et sans inscription. En quelques minutes, vous voyez où en est votre base et comment nous travaillons."
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
      title: "Dépôt de la base",
      text: "Vous déposez votre base anonymisée (SPSS, Excel ou CSV) et, si vous l'avez, votre protocole. L'envoi est chiffré.",
    },
    {
      n: 2,
      role: "team",
      roleLabel: "Insight Medics",
      title: "Protection des données",
      text: "Les colonnes nominatives (nom, téléphone, e-mail, CIN…) sont repérées automatiquement. Elles sont masquées avant tout envoi à l'IA, qui ne voit qu'un extrait de 50 lignes au plus, et retirées de la base nettoyée.",
    },
    {
      n: 3,
      role: "exchange",
      roleLabel: "Échange avec vous",
      title: "Cadrage",
      text: "Un appel pour fixer l'objectif de la thèse, les hypothèses et les variables clés. C'est vous qui orientez l'analyse.",
    },
    {
      n: 4,
      role: "team",
      roleLabel: "Insight Medics",
      title: "Analyses",
      text: "Les statistiques sont calculées par du code sur vos vraies données : descriptives, tests, modèles. Chaque résultat est traçable et reproductible.",
    },
    {
      n: 5,
      role: "team",
      roleLabel: "Revue humaine",
      title: "Double relecture",
      text: "Un biostatisticien relit les analyses, ajuste le choix des tests et vérifie leurs conditions d'application. Un médecin vérifie la cohérence clinique.",
      highlight: true,
    },
    {
      n: 6,
      role: "exchange",
      roleLabel: "Échange avec vous",
      title: "Restitution et livraison",
      text: "Nous vous présentons les résultats, répondons à vos questions et intégrons vos retours, puis nous vous livrons le document final.",
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
            s.highlight && "-ml-4 border-l-4 border-l-brand pl-3 sm:-ml-5 sm:pl-4",
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
              <span className="sr-only">Rôle : </span>
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
