import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  GraduationCap,
  Microscope,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Insights Medics" },
      {
        name: "description",
        content:
          "Audit IA gratuit de votre base, analyse statistique complète, accompagnement rédaction des résultats de thèse. Tous nos services.",
      },
      { property: "og:title", content: "Services — Insights Medics" },
      {
        property: "og:description",
        content:
          "Audit gratuit, analyse statistique complète, rédaction des résultats. Pour thèses, articles et mémoires médicaux.",
      },
    ],
  }),
  component: ServicesPage,
});

type Service = {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  price: string;
  description: string;
  features: string[];
  cta: { to: string; label: string };
  highlighted?: boolean;
};

const services: Service[] = [
  {
    icon: <Microscope className="h-5 w-5" />,
    badge: "Gratuit",
    title: "Audit de base de données",
    price: "0 €",
    description:
      "Une radiographie automatique de votre base : qualité, structure, pistes d'ajustement, avec un score /100.",
    features: [
      "Formats .sav, .xlsx, .csv",
      "Anonymisation automatique avant analyse",
      "Détection manquants, doublons, incohérences cliniques",
      "Rapport PDF brandé en quelques minutes",
      "Sans engagement",
    ],
    cta: siteConfig.cta.audit,
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    badge: "Le plus demandé",
    title: "Analyse statistique complète",
    price: "Sur devis",
    description:
      "Le cœur de notre métier : descriptif, comparatif, multivarié, courbes de survie, modèles ajustés. Tout ce dont votre thèse a besoin.",
    features: [
      "Cadrage avec un biostatisticien",
      "Choix des tests adaptés à votre design",
      "Tableaux et figures publiables (FR/EN)",
      "Code source remis sur demande",
      "Délais cadrés sur votre soutenance",
    ],
    cta: siteConfig.cta.order,
    highlighted: true,
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Rédaction des résultats",
    price: "Sur devis",
    description:
      "Nous rédigeons la partie « Résultats » de votre thèse dans un français académique, en cohérence avec vos tableaux et figures.",
    features: [
      "Texte calibré pour une thèse de médecine",
      "Cohérence stricte avec les analyses",
      "Aller-retours de relecture inclus",
      "Compatibilité avec votre plan",
    ],
    cta: siteConfig.cta.order,
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    title: "Accompagnement complet thèse",
    price: "Sur devis",
    description:
      "De la base brute à la soutenance : cadrage, analyses, rédaction, soutien méthodologique jusqu'au dépôt.",
    features: [
      "Point hebdomadaire avec votre référent",
      "Audit + analyses + rédaction inclus",
      "Préparation de la défense statistique",
      "Priorité sur les délais",
    ],
    cta: siteConfig.cta.order,
  },
];

function ServicesPage() {
  return (
    <SiteLayout>
      <Section className="pb-8">
        <SectionHeader
          eyebrow="Services"
          title="Trois manières de travailler avec nous."
          description="Commencez par l'audit gratuit pour évaluer votre base. Si vous voulez aller plus loin, nous prenons le relais avec une prestation humaine, à la mesure de vos besoins."
        />
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <article
              key={s.title}
              className={
                "relative rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md " +
                (s.highlighted
                  ? "border-brand/40 ring-1 ring-brand/30"
                  : "border-border")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  {s.icon}
                </div>
                {s.badge && (
                  <Badge
                    variant={s.highlighted ? "default" : "secondary"}
                    className={
                      s.highlighted
                        ? "bg-brand text-brand-foreground hover:bg-brand"
                        : ""
                    }
                  >
                    {s.badge}
                  </Badge>
                )}
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>

              <div className="mt-5 font-display text-2xl font-bold text-foreground">
                {s.price}
              </div>

              <ul className="mt-5 space-y-2.5 text-sm">
                {s.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Button
                  asChild
                  className={
                    s.highlighted
                      ? "w-full bg-brand text-brand-foreground hover:bg-brand/90"
                      : "w-full"
                  }
                  variant={s.highlighted ? "default" : "outline"}
                >
                  <Link to={s.cta.to}>
                    {s.cta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-border bg-surface/60 p-8 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold tracking-tight">
                Pas sûr de ce qu'il vous faut ?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Lancez l'audit gratuit. Le rapport vous indiquera exactement ce
                qui peut être exploité dans votre base et ce qui mérite l'œil
                d'un humain.
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
