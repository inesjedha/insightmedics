import type { ComponentType } from "react";
import * as analyseMm from "@/content/guides/analyse-statistique-mm";
import * as courbeRoc from "@/content/guides/courbe-roc";
import * as etapes from "@/content/guides/etapes-these";
import * as etudeRetro from "@/content/guides/etude-retrospective";
import * as formeMonastir from "@/content/guides/mise-en-forme-these-monastir";
import * as formeSfax from "@/content/guides/mise-en-forme-these-sfax";
import * as formeSousse from "@/content/guides/mise-en-forme-these-sousse";
import * as formeTunis from "@/content/guides/mise-en-forme-these-tunis";
import * as formeTunisie from "@/content/guides/mise-en-forme-these-tunisie";
import * as preparerBase from "@/content/guides/preparer-base";
import * as presenterResultats from "@/content/guides/presenter-resultats";
import { PUBLISHED } from "@/content/guides/published";
import * as quelTest from "@/content/guides/quel-test-statistique";
import * as regressionLogistique from "@/content/guides/regression-logistique";
import * as soutenance from "@/content/guides/soutenance";
import * as tailleEchantillon from "@/content/guides/taille-echantillon";
import type { GuideCategory, GuideMeta } from "@/content/guides/types";
import * as valeurPIc from "@/content/guides/valeur-p-ic";

type Guide = GuideMeta & { Body: ComponentType };

/** Tous les guides écrits, dans l'ordre de lecture conseillé. Seuls ceux de `PUBLISHED` sont
 * en ligne (ajouter aussi l'URL au sitemap, à llms.txt et son image dans
 * scripts/og-images.mjs). */
const ALL: Guide[] = [
  etapes,
  formeTunisie,
  formeSousse,
  formeTunis,
  formeMonastir,
  formeSfax,
  tailleEchantillon,
  quelTest,
  valeurPIc,
  regressionLogistique,
  courbeRoc,
  preparerBase,
  etudeRetro,
  analyseMm,
  presenterResultats,
  soutenance,
].map((m) => ({ ...m.meta, Body: m.Body }));

export const GUIDES: Guide[] = ALL.filter((g) => PUBLISHED.has(g.slug));

/** Rubriques de la page /guides, dans l'ordre d'affichage. */
export const CATEGORIES: { id: GuideCategory; title: string; description: string }[] = [
  {
    id: "preparer",
    title: "Préparer sa thèse",
    description: "Les étapes, le recueil des données et une base prête à analyser.",
  },
  {
    id: "statistiques",
    title: "Comprendre les statistiques",
    description: "Choisir ses tests, calculer un effectif, lire un p, un OR, une courbe ROC.",
  },
  {
    id: "rediger",
    title: "Rédiger et soutenir",
    description: "Écrire le Matériel et méthodes, présenter ses résultats, préparer la soutenance.",
  },
  {
    id: "format",
    title: "Mettre en forme selon sa faculté",
    description: "Les règles de Sousse, Tunis, Monastir et Sfax.",
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);

export const guidePath = (slug: string) => `/guides/${slug}`;

/** « À lire aussi » : les guides de la même rubrique, puis les autres, quatre au plus. */
export function relatedGuides(guide: Guide, max = 4): Guide[] {
  const others = GUIDES.filter((g) => g.slug !== guide.slug);
  const same = others.filter((g) => g.category === guide.category);
  return [...same, ...others.filter((g) => g.category !== guide.category)].slice(0, max);
}
