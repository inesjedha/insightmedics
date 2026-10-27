import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, FileStack, Presentation } from "lucide-react";
import { EXTRA_OFFERS } from "@/lib/offers";
import { cn } from "@/lib/utils";

const ICONS = { saisie: FileStack, soutenance: Presentation } as const;

/**
 * Les deux services complémentaires, présentés sous les trois formules et en plus petit :
 * la page reste lisible (trois formules d'abord), et chacun voit où ils se placent dans
 * son parcours (avant l'analyse, pour la soutenance).
 */
export function ExtraOffers({
  headingLevel = "h2",
  className,
}: {
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  const Card = headingLevel === "h2" ? "h3" : "h4";
  return (
    <div id="en-plus" className={cn("scroll-mt-24 space-y-5", className)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Heading className="font-display text-3xl">En plus, si vous en avez besoin</Heading>
        <span className="font-hand text-2xl text-brand">à prendre seuls ou avec une formule</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {EXTRA_OFFERS.map((o) => {
          const Icon = ICONS[o.id];
          return (
            <article
              key={o.id}
              className="flex flex-col gap-4 rounded-md border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <Icon className="h-4 w-4 text-brand" aria-hidden /> {o.moment}
                  </p>
                  <Card className="font-sans text-xl font-bold leading-snug">{o.title}</Card>
                </div>
                <p className="shrink-0 whitespace-nowrap font-display text-3xl leading-none">
                  {o.priceLabel}
                </p>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{o.description}</p>
              <ul className="space-y-2 text-[15px]">
                {o.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="max-w-xs text-sm text-muted-foreground">{o.priceNote}</p>
                <Link
                  to="/contact"
                  search={{ offre: o.id }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                  {o.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
