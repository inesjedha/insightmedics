import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Section } from "./Section";

type CTALink = { to: string; label: string };

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
    <Section>
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary p-6 text-primary-foreground sm:p-8 lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-brand/10 blur-3xl"
        />
        <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="h-px w-12 bg-brand" aria-hidden />
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-primary-foreground/80 sm:text-base">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button
              asChild
              size="lg"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Link to={primary.to}>
                {primary.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {secondary && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to={secondary.to}>{secondary.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
