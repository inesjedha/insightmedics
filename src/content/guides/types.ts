/** Rubrique de la page /guides. */
export type GuideCategory = "statistiques" | "preparer" | "rediger" | "format";

export type GuideMeta = {
  slug: string;
  category: GuideCategory;
  /** Titre affiché (h1). */
  title: string;
  /** Balise <title>, ≤ 60 caractères avec « | Insight Medics ». */
  seoTitle: string;
  /** ≤ 155 caractères. */
  description: string;
  keyword: string;
  datePublished: string;
  dateModified?: string;
  readingMinutes: number;
  /** Réponse courte, autonome et citable (40 à 80 mots). */
  shortAnswer: string;
  /** Sommaire : [ancre, intitulé]. */
  toc: [string, string][];
};
