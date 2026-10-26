import type { ComponentType } from "react";
import * as quelTest from "@/content/guides/quel-test-statistique";
import * as regressionLogistique from "@/content/guides/regression-logistique";
import type { GuideMeta } from "@/content/guides/types";

type Guide = GuideMeta & { Body: ComponentType };

/** Les guides publiés, du plus récent au plus ancien (ajouter aussi l'URL au sitemap). */
export const GUIDES: Guide[] = [quelTest, regressionLogistique].map((m) => ({
  ...m.meta,
  Body: m.Body,
}));

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);

export const guidePath = (slug: string) => `/guides/${slug}`;
