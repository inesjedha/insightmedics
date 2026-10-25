import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

/**
 * En-tête de section : petite étiquette, grand titre en serif, chapeau.
 * `note` ajoute une annotation manuscrite au stylo bleu (une par écran, pas plus).
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  note,
  align = "left",
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  note?: string;
  align?: "left" | "center";
  /** `h1` quand l'en-tête ouvre la page (une seule fois par page). */
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <Heading className="mt-3 font-display text-4xl text-balance sm:text-5xl">{title}</Heading>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground text-balance sm:text-lg">
          {description}
        </p>
      )}
      {note && (
        <p
          className={cn(
            "mt-4 -rotate-1 font-hand text-2xl leading-tight text-brand",
            align === "center" ? "origin-center" : "origin-left",
          )}
        >
          {note}
        </p>
      )}
    </div>
  );
}
