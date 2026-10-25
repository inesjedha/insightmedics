import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Échap referme le menu mobile.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
        <Link to="/" onClick={() => setOpen(false)} aria-label="Insight Medics, accueil">
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:text-foreground data-[status=active]:underline data-[status=active]:decoration-brand data-[status=active]:decoration-2 data-[status=active]:underline-offset-8"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild size="sm">
            <Link to={siteConfig.cta.audit.to}>{siteConfig.cta.audit.short}</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
        >
          {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="menu-mobile"
        // Fermé : invisible ET hors de portée du clavier et des lecteurs d'écran.
        inert={!open}
        className={cn(
          "overflow-hidden transition-[max-height] duration-200 md:hidden",
          open ? "max-h-[28rem] border-t border-foreground/10" : "max-h-0",
        )}
      >
        <nav
          aria-label="Navigation mobile"
          className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6"
        >
          {siteConfig.nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center border-b border-border font-display text-2xl text-foreground data-[status=active]:italic data-[status=active]:text-brand"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild className="mt-4 w-full" onClick={() => setOpen(false)}>
            <Link to={siteConfig.cta.audit.to}>{siteConfig.cta.audit.label}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
