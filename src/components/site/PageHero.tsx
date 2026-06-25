import type { ReactNode } from "react";
import { Section } from "./Section";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <Section className="pb-4 pt-12 sm:pb-6 sm:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand sm:text-[11px] sm:tracking-[0.22em]">
          {eyebrow}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:mt-5 sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground text-balance sm:mt-5 sm:text-lg">
            {description}
          </p>
        )}
        <div className="mx-auto mt-6 h-px w-16 bg-brand/40 sm:mt-8" aria-hidden />
      </div>
    </Section>
  );
}
