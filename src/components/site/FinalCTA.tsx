import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type CTALink = { to: string; label: string };

/** Bandeau d'appel à l'action de fin de page : encre pleine, titre en serif. */
export function FinalCTA({
  title,
  description,
  primary,
  secondary,
}: {
  title: ReactNode;
  description: ReactNode;
  primary: CTALink;
  secondary?: CTALink;
}) {
  return (
    <section className="bg-ink text-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div>
          <h2 className="font-display text-4xl text-balance sm:text-5xl lg:text-6xl">{title}</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-background/75 sm:text-lg">
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button
            asChild
            size="lg"
            className="bg-background text-foreground hover:bg-background/90"
          >
            <Link to={primary.to}>
              {primary.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          {secondary && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link to={secondary.to}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
