import type { ReactNode } from "react";

/** Section titrée des pages légales (mentions, CGV, confidentialité). */
export function LegalBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}
