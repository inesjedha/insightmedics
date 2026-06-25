import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  FileText,
  GraduationCap,
  Microscope,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, SectionHeader } from "@/components/site/Section";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Insight Medics" },
      {
        name: "description",
        content:
          "Audit gratuit, analyse statistique + rédaction des résultats, rédaction de la discussion, accompagnement IMRAD complet. Tarifs en dinars tunisiens.",
      },
      { property: "og:title", content: "Services — Insight Medics" },
      {
        property: "og:description",
        content:
          "3 manières de travailler avec nous. Tarifs transparents en DT.",
      },
    ],
  }),
  component: ServicesPage,
});

// NOTE INTERNE (non affichée au public) :
// Intro + Matériel & Méthodes + Conclusion seuls = supplément 100 à 150 DT
// par rapport à l'accompagnement complet IMRAD.

type Service = {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  price: string;
  description: string;
  features: string[];
  cta: { to: "/audit" | "/contact"; label: string };
  highlighted?: boolean;
};

const services: Service[] = [
  {
    icon: <Microscope className="h-5 w-5" />,
    badge: "Gratuit",
    title: "Audit de base de données",
    price: "0 DT",
    description:
      "Contrôle qualité automatique de votre base, analyse de la structure, pistes d'ajustement. Score /100 + rapport PDF.",
    features: [
      "Tous formats acceptés",
      "Analyses en temps réel sur la plateforme",
      "Score qualité /100",
      "Rapport PDF reçu par email & SMS",
      "Sans engagement",
    ],
    cta: { to: "/audit", label: "Lancer l'audit gratuit" },
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Analyse statistique + rédaction des résultats",
    price: "500 DT",
    description:
      "Analyses complètes (descriptif, comparatif, multivarié) et rédaction de la partie « Résultats » prête à intégrer.",
    features: [
      "Cadrage avec un biostatisticien",
      "Tests adaptés à votre design d'étude",
      "Tableaux & figures publiables",
      "Texte des résultats rédigé",
      "Validation par un humain",
    ],
    cta: { to: "/contact", label: "Demander cette offre" },
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Rédaction de la discussion",
    price: "500 DT",
    description:
      "Rédaction structurée de la discussion : comparaison à la littérature, forces, limites, perspectives.",
    features: [
      "Recherche bibliographique ciblée",
      "Argumentation alignée sur vos résultats",
      "Forces et limites discutées",
      "Aller-retours de relecture inclus",
    ],
    cta: { to: "/contact", label: "Demander cette offre" },
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    badge: "Le plus complet",
    title: "Accompagnement complet IMRAD",
    price: "1 200 DT",
    description:
      "De la base brute à la conclusion : introduction, matériel & méthodes, résultats, discussion, conclusion.",
    features: [
      "Introduction rédigée",
      "Matériel & Méthodes rédigés",
      "Analyses + résultats rédigés",
      "Discussion rédigée",
      "Conclusion rédigée",
      "Priorité sur les délais",
    ],
    cta: { to: "/contact", label: "Discuter du projet" },
    highlighted: true,
  },
];

function ServicesPage() {
  return (
    <SiteLayout>
      <Section className="pb-8">
        <SectionHeader
          eyebrow="Services"
          title="3 manières de travailler avec nous."
          description="Tarifs transparents en dinars tunisiens. Chaque livrable est validé par un humain (médecin + biostatisticien) avant envoi."
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

              <div className="mt-5 font-display text-3xl font-extrabold tracking-tight text-brand">
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
    </SiteLayout>
  );
}
