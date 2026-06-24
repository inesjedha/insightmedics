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
import { siteConfig } from "@/lib/site-config";

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

function MethodePage() {
  return (
    <SiteLayout>
      <Section className="pb-8">
        <SectionHeader
          eyebrow="Notre méthode"
          title="Aucun chiffre n'est jamais inventé."
          description="Une thèse engage votre nom et celui de votre directeur. C'est pour ça que nous avons conçu un pipeline où le LLM rédige uniquement le narratif, et où chaque valeur provient d'un calcul Python réel."
        />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-3">
          <Pillar
            icon={<Cpu className="h-5 w-5" />}
            title="LLM pilote"
            text="Le modèle lit le contexte de cadrage, choisit les analyses pertinentes et génère du code Python adapté à votre base."
          />
          <Pillar
            icon={<Code2 className="h-5 w-5" />}
            title="Exécution réelle"
            text="Le code tourne dans un environnement isolé (pandas, pyreadstat, scipy). Les sorties — n, p-values, % de manquants — viennent du code."
          />
          <Pillar
            icon={<UserCheck className="h-5 w-5" />}
            title="Validation humaine"
            text="Pour la prestation complète, un biostatisticien revoit, ajuste et signe les analyses définitives avant livraison."
          />
        </div>
      </Section>

      <Section className="border-y border-border/60 bg-surface/60">
        <SectionHeader
          eyebrow="Garde-fou structurel"
          title="Le narratif et les chiffres sont séparés, par construction."
          description="Nos templates de rapport lisent les nombres uniquement depuis les sorties de code. Le LLM n'a aucun moyen d'injecter une valeur dans un tableau ou un score."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">
              Score /100 calculé, pas estimé
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Le score qualité est une formule déterministe à partir de
              sous-scores objectifs : complétude, cohérence, structure, taille
              d'échantillon. Le barème est versionné et affiché dans le rapport.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">
              Pas de résultats définitifs en mode audit
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              L'audit s'arrête au cadrage et à la qualité. Les analyses qui
              comptent pour la thèse — comparatives, multivariées — sont
              réservées à la prestation humaine. C'est une exigence de fiabilité.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Données & confidentialité"
          title="Hygiène stricte, par éthique et par respect du patient."
          description="Nous opérons depuis la Tunisie sans cadre RGPD imposé, mais nos clients manipulent du sensible. Nous nous comportons comme si nous étions soumis aux exigences les plus strictes."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <DataCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Anonymisation à l'upload"
            text="Les colonnes identifiantes (noms, identifiants directs, dates de naissance) sont détectées et pseudonymisées avant toute analyse."
          />
          <DataCard
            icon={<Lock className="h-5 w-5" />}
            title="Chiffrement au repos"
            text="Vos fichiers sont chiffrés côté client avant envoi, puis stockés chiffrés. Aucune donnée patient n'apparaît dans nos logs."
          />
          <DataCard
            icon={<Trash2 className="h-5 w-5" />}
            title="Purge automatique"
            text="Vos fichiers et la table de correspondance sont supprimés automatiquement après livraison, selon une politique configurable."
          />
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h3 className="font-display text-lg font-semibold">
            Votre engagement de responsabilité
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Avant chaque upload, vous certifiez ceci :
          </p>
          <blockquote className="mt-4 rounded-lg border-l-4 border-brand bg-surface/70 p-4 text-sm italic text-foreground/90">
            « Je certifie être responsable de cette base de données et
            habilité(e) à la traiter. Je m'engage à fournir une base dont j'ai
            le droit de disposer. Insight Medics anonymise le fichier pour
            l'analyse, le conserve de façon sécurisée le temps de la
            prestation, puis le supprime. »
          </blockquote>
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-primary/20 bg-primary p-8 text-primary-foreground sm:p-12">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                Prêt à voir ce que vaut votre base ?
              </h2>
              <p className="mt-3 text-base text-primary-foreground/80">
                L'audit est gratuit. Le rapport vous dit où vous en êtes, en clair.
              </p>
            </div>
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to={siteConfig.cta.audit.to}>
                {siteConfig.cta.audit.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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

function DataCard({
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
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
