import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OfferCardProps = {
  number?: string;
  icon?: ReactNode;
  title: string;
  price: string;
  delay?: string;
  tagline?: string;
  description?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: "/contact" | "/audit";
  highlight?: boolean;
  badge?: string;
};

/**
 * Fiche d'offre « carnet » : filet fin, prix en grand serif. L'offre mise en avant
 * porte l'ombre décalée et une annotation manuscrite (`badge`).
 */
export function OfferCard({
  number,
  title,
  price,
  delay,
  tagline,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlight,
  badge,
}: OfferCardProps) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-md border bg-card p-6 sm:p-7",
        highlight ? "mr-1.5 border-foreground shadow-offset md:mr-0" : "border-border",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        {number && (
          <span aria-hidden className="font-hand text-3xl leading-none text-brand">
            {number}.
          </span>
        )}
        {badge && <span className="mark -rotate-2 font-hand text-2xl leading-none">{badge}</span>}
      </div>

      <h3 className="mt-4 font-display text-3xl">{title}</h3>
      {tagline && <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>}
      {description && (
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      )}

      <div className="mt-6 border-t border-border pt-5">
        <p className="font-display text-5xl leading-none">{price}</p>
        {delay && <p className="mt-2 text-sm font-medium text-muted-foreground">{delay}</p>}
      </div>

      <ul className="mt-6 space-y-3 text-[15px]">
        {features.map((f) => (
          <li key={f} className="flex gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-7">
        <Button asChild variant={highlight ? "default" : "outline"} className="w-full">
          <Link to={ctaHref}>
            {ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </article>
  );
}
