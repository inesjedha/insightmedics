import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PUBLISHED } from "@/content/guides/published";

/** Lien d'un guide vers un autre. Tant que la cible est un brouillon, le texte s'affiche
 * sans lien : un guide peut citer la série entière sans jamais mener à une page 404. */
export function GuideLink({ slug, children }: { slug: string; children: ReactNode }) {
  if (!PUBLISHED.has(slug)) return <>{children}</>;
  return (
    <Link to="/guides/$slug" params={{ slug }}>
      {children}
    </Link>
  );
}
