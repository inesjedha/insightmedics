import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Lock,
  Trash2,
  AlertTriangle,
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
          "Comment Insight Medics garantit des résultats de thèse exacts et traçables : analyses calculées directement sur vos données, validées par un biostatisticien, données patients protégées au plus haut standard.",
      },
      { property: "og:title", content: "Méthode — Insight Medics" },
      {
        property: "og:description",
        content:
          "Des résultats que vous pouvez défendre, ligne par ligne. Calculés, validés et signés par un biostatisticien.",
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
          title="Des résultats que vous pouvez défendre, ligne par ligne."
          description="Votre thèse engage votre nom et celui de votre directeur. Notre méthode est construite pour une seule chose : que chaque chiffre de votre travail soit exact, traçable et reproductible — du premier calcul à la soutenance."
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
            title="Validés et signés par un biostatisticien"
            text="Pour la prestation complète, un biostatisticien revoit, ajuste et valide chaque analyse définitive avant livraison."
          />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Le pipeline, étape par étape"
          title="De votre fichier brut au rapport signé."
        />
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <PipelineStep n={1} icon={<Upload className="h-4 w-4" />} label="Upload" />
          <PipelineStep n={2} icon={<EyeOff className="h-4 w-4" />} label="Anonymisation" />
          <PipelineStep n={3} icon={<ClipboardList className="h-4 w-4" />} label="Cadrage" />
          <PipelineStep n={4} icon={<PlayCircle className="h-4 w-4" />} label="Calcul" />
          <PipelineStep n={5} icon={<UserCheck className="h-4 w-4" />} label="Validation" />
          <PipelineStep n={6} icon={<PackageCheck className="h-4 w-4" />} label="Livraison" />
        </ol>
      </Section>

      <Section className="border-y border-border/60 bg-surface/60">
        <SectionHeader
          eyebrow="Garde-fou structurel"
          title="Les chiffres viennent du calcul, jamais de la rédaction."
          description="Nos modèles de rapport vont chercher les nombres directement dans les sorties de code. La partie rédigée n'a aucun accès aux tableaux ni aux scores : impossible d'y glisser une valeur à la main."
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
              Le score qualité suit une formule fixe, à partir de critères
              objectifs : complétude, cohérence, structure, taille
              d'échantillon. Le barème est public et affiché dans votre rapport.
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
              L'audit gratuit s'arrête au cadrage et à la qualité de la base.
              Les analyses qui comptent pour la thèse — comparaisons, modèles
              multivariés — passent toujours par un expert. C'est une exigence
              de fiabilité, pas un choix commercial.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Données & confidentialité"
          title="Vos données patients, traitées au plus haut standard."
          description="Nous travaillons depuis la Tunisie. Plutôt que de nous limiter au minimum légal local, nous appliquons volontairement les exigences les plus strictes en matière de données de santé — parce que vos fichiers contiennent du sensible."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <DataCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Anonymisation à l'import"
            text="Les colonnes identifiantes (noms, identifiants directs, dates de naissance) sont repérées et pseudonymisées avant toute analyse."
          />
          <DataCard
            icon={<Lock className="h-5 w-5" />}
            title="Chiffrement de bout en bout"
            text="Vos fichiers sont chiffrés avant l'envoi, puis stockés chiffrés. Aucune donnée patient n'apparaît dans nos journaux techniques."
          />
          <DataCard
            icon={<Trash2 className="h-5 w-5" />}
            title="Suppression après livraison"
            text="Vos fichiers et la table de correspondance sont supprimés automatiquement une fois la prestation terminée."
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

        <details className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <summary className="cursor-pointer font-display text-base font-semibold">
            Détails techniques
          </summary>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>
              Les calculs s'exécutent dans un environnement isolé avec une
              pile standard de l'analyse statistique scientifique
              (pandas, pyreadstat, scipy). Le code et le barème du score sont
              versionnés ; chaque rapport indique la version utilisée.
            </p>
            <p>
              L'orchestration des analyses s'appuie sur un modèle d'IA pour
              proposer le plan d'analyse à partir de votre cadrage. Le modèle
              n'écrit jamais de valeur dans le rapport : il ne génère que la
              sélection des tests et la rédaction. Tous les chiffres
              proviennent exclusivement des sorties de code.
            </p>
          </div>
        </details>
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
                <Link to={siteConfig.cta.contact.to}>Consulter le barème du score</Link>
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

function PipelineStep({
  n,
  icon,
  label,
}: {
  n: number;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
        {n}
      </span>
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </span>
      <span className="font-display text-sm font-semibold">{label}</span>
    </li>
  );
}
