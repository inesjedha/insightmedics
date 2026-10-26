import { createFileRoute } from "@tanstack/react-router";
import hamzaPhoto from "@/assets/team/hamza-ben-kheder.jpg";
import inesPhoto from "@/assets/team/ines-ben-amor.jpg";
import { Team } from "@/components/home/HomeSections";
import { FinalCTA } from "@/components/site/FinalCTA";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FOUNDERS, breadcrumbLd, pageHead } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/a-propos")({
  head: () =>
    pageHead({
      path: "/a-propos",
      title: "À propos : médecins et biostatisticiens | Insight Medics",
      description:
        "Insight Medics réunit médecins, biostatisticiens et une équipe data pour accompagner les thèses de médecine en Tunisie. Plus de trente thèses accompagnées.",
      jsonLd: [{ "@type": "AboutPage" }, ...FOUNDERS, breadcrumbLd([["À propos", "/a-propos"]])],
    }),
  component: AboutPage,
});

const PROFILES = [
  {
    id: "hamza-ben-kheder",
    name: "Dr Hamza Ben Kheder",
    role: "Cofondateur · Médecin anesthésiste-réanimateur",
    photo: hamzaPhoto,
    text: "Il apporte la lecture clinique : la question de recherche a-t-elle un sens au lit du patient, les résultats sont-ils cohérents, et que vous demandera le jury ?",
  },
  {
    id: "ines-ben-amor",
    name: "Inès Ben Amor",
    role: "Cofondatrice · Ingénieure IA",
    photo: inesPhoto,
    text: "Ex-Lead Data Scientist dans la Silicon Valley, elle a conçu les contrôles automatiques qui vérifient votre base et les outils qui garantissent que chaque chiffre est calculé, jamais recopié.",
  },
];

const FACTS = [
  ["30+", "thèses accompagnées"],
  ["4", "facultés de médecine de Tunisie : Tunis, Sousse, Monastir, Sfax"],
  ["2", "relectures humaines avant chaque livraison : un biostatisticien et un médecin"],
] as const;

const COMMITMENTS = [
  {
    title: "Vous restez l'auteur",
    text: "Nous analysons et rédigeons avec vous, à partir de vos données et de vos choix. Vous comprenez chaque résultat et savez le défendre.",
  },
  {
    title: "Des chiffres traçables",
    text: "Chaque valeur sort d'un code statistique exécuté sur votre base. Les analyses sont reproductibles.",
  },
  {
    title: "Vos données protégées",
    text: "Les colonnes nominatives sont repérées et retirées, et vos fichiers d'audit sont supprimés automatiquement 30 jours après le test ou la livraison.",
  },
];

function AboutPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="À propos"
        title={
          <>
            La rigueur d'une équipe de recherche,{" "}
            <span className="italic text-brand">au service de votre thèse.</span>
          </>
        }
        description="Insight Medics accompagne les étudiants en médecine, internes, résidents et médecins dans la partie statistique et la rédaction de leur thèse, mémoire ou article. Nous sommes basés à Sousse."
      />

      <Section>
        <dl className="grid gap-8 md:grid-cols-3">
          {FACTS.map(([n, label]) => (
            <div key={label} className="border-t border-foreground pt-5">
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="font-display text-6xl leading-none">{n}</span>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{label}</p>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Team founders={false} />

      <Section className="border-t border-border">
        <SectionHeader eyebrow="Les fondateurs" title="Une médecine, une ingénierie." />
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {PROFILES.map((p) => (
            <li
              key={p.id}
              id={p.id}
              className="scroll-mt-24 rounded-md border border-foreground bg-card p-6 sm:p-7"
            >
              <div className="flex items-center gap-4">
                <img
                  src={p.photo}
                  alt={`Portrait de ${p.name}`}
                  width={80}
                  height={80}
                  loading="lazy"
                  className="size-20 shrink-0 rounded-md border border-foreground object-cover"
                />
                <div>
                  <h3 className="font-display text-3xl leading-tight">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.role}</p>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed">{p.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="border-t border-border">
        <SectionHeader eyebrow="Nos engagements" title="Ce qui ne se négocie pas." />
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {COMMITMENTS.map((c, i) => (
            <div key={c.title} className="border-t border-foreground pt-5">
              <span aria-hidden className="font-hand text-3xl leading-none text-brand">
                {i + 1}.
              </span>
              <h3 className="mt-2 font-display text-3xl leading-tight">{c.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <FinalCTA
        title={
          <>
            Parlons de <span className="italic text-brand-on-ink">votre thèse.</span>
          </>
        }
        description="Commencez par tester votre base gratuitement, ou écrivez-nous directement : nous vous répondons avec un périmètre et un prix fixe."
        primary={{ to: siteConfig.cta.audit.to, label: siteConfig.cta.audit.label }}
        secondary={{ to: siteConfig.cta.order.to, label: "Nous contacter" }}
      />
    </SiteLayout>
  );
}
