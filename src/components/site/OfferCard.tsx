import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OfferCardProps = {
  number?: string;
  icon: ReactNode;
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

export function OfferCard({
  number,
  icon,
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
        "group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md sm:p-7",
        highlight && "border-l-4 border-l-brand",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
          {icon}
        </div>
        {number && (
          <span
            aria-hidden
            className="font-display text-2xl font-bold leading-none text-brand/25 sm:text-3xl"
          >
            {number}
          </span>
        )}
      </div>

      {badge && (
        <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-foreground">
          <Sparkles className="h-3 w-3" />
          {badge}
        </span>
      )}

      <h3 className="mt-4 font-display text-base font-semibold tracking-tight sm:mt-5 sm:text-lg">
        {title}
      </h3>
      {tagline && (
        <p className="mt-1 text-xs text-muted-foreground">{tagline}</p>
      )}
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      <div className="mt-5 font-display text-3xl font-extrabold tracking-tight text-brand">
        {price}
      </div>
      {delay && (
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {delay}
        </p>
      )}

      <ul className="mt-5 space-y-2.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Button
          asChild
          variant={highlight ? "default" : "outline"}
          className={cn(
            "w-full",
            highlight && "bg-brand text-brand-foreground hover:bg-brand/90",
          )}
        >
          <Link to={ctaHref}>
            {ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
