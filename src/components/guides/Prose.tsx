import type { ReactNode } from "react";
import { frTypo } from "@/lib/typo";
import { cn } from "@/lib/utils";

/**
 * Typographie des guides : lecture longue, titres en serif, tableaux lisibles sur mobile.
 * `ShortAnswer` est le bloc de réponse courte, autonome et citable (moteurs IA, extraits).
 */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 max-w-[68ch] text-[17px] leading-[1.75] text-foreground/90 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-foreground">
      {children}
    </div>
  );
}

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-24 font-display text-4xl leading-tight text-foreground">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 text-xl font-semibold text-foreground">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-5">{children}</p>;
}

export function List({ items, ordered }: { items: ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={cn("mt-5 space-y-2.5 pl-6", ordered ? "list-decimal" : "list-disc")}>
      {items.map((it, i) => (
        <li key={i} className="pl-1 marker:text-brand">
          {it}
        </li>
      ))}
    </Tag>
  );
}

export function ShortAnswer({ children }: { children: ReactNode }) {
  return (
    <aside
      aria-label="Réponse courte"
      className="mt-8 rounded-md border border-foreground bg-card p-6 shadow-offset"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Réponse courte</p>
      <p className="mt-3 text-[17px] leading-relaxed text-foreground">{children}</p>
    </aside>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 border-l-4 border-brand bg-surface px-5 py-4 text-[16px] leading-relaxed">
      {children}
    </p>
  );
}

export function Table({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-md border border-foreground/80">
      <table className="w-full min-w-[560px] border-collapse text-left text-[15px] leading-snug">
        <caption className="border-b border-border bg-surface px-4 py-3 text-left text-sm font-semibold">
          {caption}
        </caption>
        <thead>
          <tr className="border-b-2 border-foreground">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Figure d'un guide : schéma SVG dessiné dans la page, ou image d'un livrable. La légende dit
 * ce que montre la figure ; `source` précise d'où viennent les chiffres (exemple fictif du
 * guide, livrable de démonstration…).
 */
export function Figure({
  caption,
  source,
  children,
}: {
  caption: string;
  source?: string;
  children: ReactNode;
}) {
  return (
    <figure className="mt-8 rounded-md border border-foreground/80 bg-card p-4 sm:p-6">
      <div className="text-foreground">{children}</div>
      <figcaption className="mt-4 border-t border-border pt-3 text-sm leading-snug">
        <span className="font-semibold text-foreground">{frTypo(caption)}</span>
        {source && <span className="mt-1 block text-muted-foreground">{frTypo(source)}</span>}
      </figcaption>
    </figure>
  );
}
