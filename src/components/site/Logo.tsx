import { cn } from "@/lib/utils";

/**
 * Logotype « carnet » : insight en romain, medics en italique bleu stylo, et le point
 * final comme une annotation. Purement typographique (aucune image à charger).
 */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display text-[26px] leading-none tracking-tight sm:text-[28px]",
        inverted ? "text-background" : "text-foreground",
        className,
      )}
    >
      insight
      <span className={cn("italic", inverted ? "text-brand-on-ink" : "text-brand")}>medics</span>
      <span
        aria-hidden
        className={cn(
          "ml-0.5 inline-block h-[7px] w-[7px] rounded-full",
          inverted ? "bg-brand-on-ink" : "bg-brand",
        )}
      />
    </span>
  );
}
