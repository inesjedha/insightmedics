import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Prose } from "@/components/guides/Prose";
import { FinalCTA } from "@/components/site/FinalCTA";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getGuide, guidePath, relatedGuides } from "@/content/guides";
import { articleLd, breadcrumbLd, pageHead } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    if (!getGuide(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const g = getGuide(params.slug);
    if (!g) return {};
    const path = guidePath(g.slug);
    return pageHead({
      path,
      title: `${g.seoTitle} | Insight Medics`,
      ogTitle: g.title,
      description: g.description,
      ogType: "article",
      // Image générée par scripts/og-images.mjs (une par guide).
      ogImage: `/og/guides/${g.slug}.jpg`,
      jsonLd: [
        articleLd({
          path,
          title: g.title,
          description: g.description,
          datePublished: g.datePublished,
          dateModified: g.dateModified,
        }),
        breadcrumbLd([
          ["Guides", "/guides"],
          [g.title, path],
        ]),
      ],
    });
  },
  component: GuidePage,
});

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

function GuidePage() {
  const { slug } = Route.useParams();
  const g = getGuide(slug);
  if (!g) return null;
  const others = relatedGuides(g);
  const updated = g.dateModified ?? g.datePublished;

  return (
    <SiteLayout>
      <article>
        <header className="border-b border-border bg-paper">
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-14">
            <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-foreground">
                    Accueil
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link to="/guides" className="hover:text-foreground">
                    Guides
                  </Link>
                </li>
              </ol>
            </nav>
            <h1 className="mt-6 max-w-4xl font-display text-[40px] leading-[1.02] text-balance sm:text-6xl">
              {g.title}
            </h1>
            <p className="mt-6 text-sm text-muted-foreground">
              Par l'équipe{" "}
              <Link to="/a-propos" className="font-semibold text-foreground underline">
                Insight Medics
              </Link>{" "}
              · Mis à jour le <time dateTime={updated}>{dateFmt.format(new Date(updated))}</time> ·{" "}
              {g.readingMinutes} min de lecture
            </p>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_260px]">
          <Prose>
            <g.Body />
          </Prose>

          <aside className="order-first lg:order-none">
            <nav
              aria-label="Sommaire"
              className="rounded-md border border-border bg-surface p-5 lg:sticky lg:top-24"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Sommaire
              </p>
              <ol className="mt-3 space-y-2 text-[15px]">
                {g.toc.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="hover:text-brand">
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        </div>
      </article>

      {others.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="font-display text-3xl">À lire aussi</h2>
            <ul className="mt-5 space-y-3">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    to="/guides/$slug"
                    params={{ slug: o.slug }}
                    className="text-lg text-brand underline underline-offset-2"
                  >
                    {o.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <FinalCTA
        title={
          <>
            Votre base est-elle <span className="italic text-brand-on-ink">prête à analyser ?</span>
          </>
        }
        description="Le test est gratuit et sans inscription : un score sur 100 et la liste des anomalies à corriger, en quelques minutes."
        primary={{ to: siteConfig.cta.audit.to, label: siteConfig.cta.audit.label }}
        secondary={{ to: siteConfig.cta.order.to, label: "Confier ma thèse" }}
      />
    </SiteLayout>
  );
}
