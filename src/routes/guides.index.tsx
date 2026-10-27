import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FinalCTA } from "@/components/site/FinalCTA";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { SiteLayout } from "@/components/site/SiteLayout";
import { GUIDES, guidePath } from "@/content/guides";
import { absoluteUrl, breadcrumbLd, pageHead } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/guides/")({
  head: () =>
    pageHead({
      path: "/guides",
      ogImage: "/og/guides.jpg",
      title: "Guides de statistiques pour thèse de médecine | Insight Medics",
      description:
        "Choisir son test, interpréter un odds ratio, rédiger ses méthodes : des guides clairs et chiffrés pour la partie statistique de votre thèse de médecine.",
      jsonLd: [
        breadcrumbLd([["Guides", "/guides"]]),
        {
          "@type": "ItemList",
          itemListElement: GUIDES.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(guidePath(g.slug)),
            name: g.title,
          })),
        },
      ],
    }),
  component: GuidesPage,
});

function GuidesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Guides"
        title={
          <>
            Les statistiques de votre thèse,{" "}
            <span className="italic text-brand">expliquées simplement.</span>
          </>
        }
        description="Des réponses précises aux questions que se posent les étudiants en médecine au moment d'analyser leur base, avec des exemples chiffrés et des modèles de rédaction."
      />
      <Section>
        <ul className="grid gap-6 md:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                to="/guides/$slug"
                params={{ slug: g.slug }}
                className="group flex h-full flex-col rounded-md border border-foreground bg-card p-6 transition-shadow hover:shadow-offset sm:p-7"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {g.readingMinutes} min de lecture
                </p>
                <h2 className="mt-3 font-display text-3xl leading-tight">{g.title}</h2>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                  {g.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Lire le guide
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <FinalCTA
        title={
          <>
            Une question sur <span className="italic text-brand-on-ink">votre propre base ?</span>
          </>
        }
        description="Testez-la gratuitement : en quelques minutes, vous savez si elle est exploitable et ce qu'il faut corriger avant l'analyse."
        primary={{ to: siteConfig.cta.audit.to, label: siteConfig.cta.audit.label }}
        secondary={{ to: siteConfig.cta.order.to, label: "Nous contacter" }}
      />
    </SiteLayout>
  );
}
