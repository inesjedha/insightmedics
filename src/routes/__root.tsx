import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ldScript, ogImageMeta, organizationLd, websiteLd } from "@/lib/seo";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  useEffect(() => {
    document.title = "Page introuvable · Insight Medics";
  }, []);
  return (
    <SiteLayout>
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="font-hand text-3xl text-brand">page introuvable</p>
          <h1 className="mt-2 font-display text-8xl text-foreground">404</h1>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted-foreground">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/audit">Tester ma base gratuitement</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl text-foreground">Cette page n'a pas pu charger</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur est survenue. Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md border border-foreground/80 bg-background px-5 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Insight Medics — Statistiques et rédaction de thèse en médecine" },
      {
        name: "description",
        content:
          "Statistiques et accompagnement à la rédaction de votre thèse de médecine, relus par un médecin et un biostatisticien. Test de votre base gratuit.",
      },
      { name: "author", content: "Insight Medics" },
      { name: "theme-color", content: "#ffffff" },
      { property: "og:site_name", content: "Insight Medics" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "fr_FR" },
      { name: "twitter:card", content: "summary_large_image" },
      // Aperçu par défaut des liens partagés (WhatsApp, Facebook, LinkedIn) ; chaque page
      // publique précise les siens via pageHead.
      {
        property: "og:title",
        content: "Insight Medics — Statistiques et rédaction de thèse en médecine",
      },
      {
        property: "og:description",
        content:
          "Analyses statistiques, résultats et thèse complète, avec des médecins et des biostatisticiens. Test de votre base gratuit.",
      },
      ...ogImageMeta(
        undefined,
        "Insight Medics — Votre thèse de médecine, des statistiques à la soutenance.",
      ),
    ],
    scripts: [ldScript(organizationLd), ldScript(websiteLd)],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
