import { frTypo } from "@/lib/typo";

export type OfferId = "analyses" | "discussion" | "these";
/** Services à part, autour des trois formules : avant (saisie) et après (soutenance). */
export type ExtraOfferId = "saisie" | "soutenance";

type OfferInput = {
  id: OfferId;
  number: number;
  title: string;
  shortTitle: string;
  /** Prix en dinars tunisiens. */
  price: number;
  /** Délai standard en semaines, à partir d'une base exploitable (cf. CGV §4). */
  delayWeeks: number;
  tagline: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlight?: boolean;
  badge?: string;
};

type Offer = OfferInput & {
  /** « 1 200 DT », avec espaces insécables. */
  priceLabel: string;
  /** « Livré en 1 semaine ». */
  delay: string;
};

const CURRENCY = "DT";

/** « 1 200 DT » (espaces insécables : jamais coupé en fin de ligne). */
function formatPrice(amount: number): string {
  return frTypo(`${amount.toLocaleString("fr-FR")} ${CURRENCY}`);
}

/** « 1 semaine », « 2 semaines » (insécable). */
export function weeksLabel(weeks: number): string {
  return frTypo(`${weeks} semaine${weeks > 1 ? "s" : ""}`);
}

/** Prix de l'audit complet (déblocage après le test gratuit). */
export const FULL_AUDIT_PRICE_LABEL = formatPrice(50);

const REVIEWED = "Relu par un médecin et un biostatisticien";

const INPUTS: OfferInput[] = [
  {
    id: "analyses",
    number: 1,
    title: "Analyses statistiques + résultats rédigés",
    shortTitle: "Analyses + résultats",
    price: 500,
    delayWeeks: 1,
    tagline: "Votre base est prête, il vous manque les statistiques.",
    description:
      "Les statistiques de votre étude (descriptives, comparaisons, analyses multivariées) et la partie « Résultats » rédigée avec vous, prête à insérer.",
    features: [
      "Plan d'analyse validé par un biostatisticien",
      "Tests adaptés à votre type d'étude",
      "Tableaux et figures prêts à insérer",
      "Partie « Résultats » rédigée avec vous",
      REVIEWED,
    ],
    ctaLabel: "Demander cette formule",
  },
  {
    id: "discussion",
    number: 2,
    title: "Rédaction de la discussion",
    shortTitle: "Discussion rédigée",
    price: 500,
    delayWeeks: 1,
    tagline: "Vos résultats sont prêts, il manque la discussion.",
    description:
      "Une discussion structurée et référencée, rédigée avec vous : comparaison avec la littérature, forces, limites et perspectives.",
    features: [
      "Recherche bibliographique ciblée",
      "Argumentation alignée sur vos résultats",
      "Forces et limites discutées",
      REVIEWED,
    ],
    ctaLabel: "Demander cette formule",
  },
  {
    id: "these",
    number: 3,
    title: "Accompagnement thèse complète",
    shortTitle: "Thèse complète",
    price: 1500,
    delayWeeks: 2,
    tagline: "Tout le manuscrit, avec vous, de bout en bout.",
    description:
      "De la base à la conclusion : introduction, matériel et méthodes, résultats, discussion et conclusion, rédigés avec vous.",
    features: [
      "Introduction et méthodes, d'après votre protocole",
      "Analyses + partie « Résultats »",
      "Discussion référencée",
      "Conclusion",
      REVIEWED,
    ],
    ctaLabel: "Discuter de ma thèse",
    highlight: true,
    badge: "La plus complète",
  },
];

/**
 * Source unique de vérité pour les trois formules payantes (prix, délais, contenu).
 * Tout texte du site qui cite un prix ou un délai le lit ici : jamais en dur.
 * Le test gratuit et l'audit complet sont gérés à part (prix ci-dessus).
 */
export const OFFERS: Offer[] = INPUTS.map((o) => ({
  ...o,
  priceLabel: formatPrice(o.price),
  delay: `Livré en ${weeksLabel(o.delayWeeks)}, dès votre base exploitable`,
}));

/** Offre par identifiant (lève une erreur si l'identifiant est inconnu). */
export function getOffer(id: OfferId): Offer {
  const offer = OFFERS.find((o) => o.id === id);
  if (!offer) throw new Error(`Offre inconnue : ${id}`);
  return offer;
}

/** Plus petit prix des formules (« dès 500 DT »). */
export const LOWEST_PRICE_LABEL = formatPrice(Math.min(...OFFERS.map((o) => o.price)));

type ExtraOffer = {
  id: ExtraOfferId;
  /** Moment du parcours, affiché en étiquette. */
  moment: string;
  title: string;
  shortTitle: string;
  /** Prix en dinars, ou null : sur devis. */
  price: number | null;
  priceLabel: string;
  /** Ce qui fait le prix, ou le délai. */
  priceNote: string;
  /** Une phrase, pour l'accueil. */
  pitch: string;
  description: string;
  features: string[];
  ctaLabel: string;
};

/**
 * Les deux services complémentaires (retour de Hamza, 27/10/2026). Présentés à part des
 * trois formules, en plus petit, pour que la page Tarifs reste lisible.
 */
export const EXTRA_OFFERS: ExtraOffer[] = [
  {
    id: "saisie",
    moment: "Avant l'analyse",
    title: "Saisie de vos fiches en base de données",
    shortTitle: "Saisie de vos fiches",
    price: null,
    priceLabel: "Sur devis",
    priceNote:
      "Selon le nombre de fiches et de données par fiche. Devis gratuit, avant de commencer.",
    pitch: "Vos fiches papier, scans ou PDF transformés en base Excel ou SPSS.",
    description:
      "Vos données sont sur fiches papier, en scans ou en PDF ? Nous les saisissons dans une base Excel ou SPSS structurée, prête pour l'audit et l'analyse.",
    features: [
      "Fiches papier, scans ou PDF",
      "Une ligne par patient, une colonne par donnée",
      "Saisie vérifiée par notre équipe",
    ],
    ctaLabel: "Demander un devis",
  },
  {
    id: "soutenance",
    moment: "Pour la soutenance",
    title: "Présentation de soutenance (PowerPoint)",
    shortTitle: "Présentation de soutenance",
    price: 200,
    priceLabel: formatPrice(200),
    priceNote: "Délai convenu avec vous selon la date de votre soutenance.",
    pitch: "Les diapositives de votre soutenance, construites à partir de votre thèse.",
    description:
      "Les diapositives de votre soutenance, construites à partir de votre thèse : claires, au bon rythme pour le jury.",
    features: [
      "Construite à partir de votre manuscrit",
      "Tableaux et figures lisibles à l'écran",
      "Fichier PowerPoint que vous pouvez modifier",
    ],
    ctaLabel: "Demander ma présentation",
  },
];

/** Service complémentaire par identifiant. */
export function getExtraOffer(id: ExtraOfferId): ExtraOffer {
  const offer = EXTRA_OFFERS.find((o) => o.id === id);
  if (!offer) throw new Error(`Service inconnu : ${id}`);
  return offer;
}

export function isOfferId(value: unknown): value is OfferId | ExtraOfferId {
  return (
    typeof value === "string" &&
    (OFFERS.some((o) => o.id === value) || EXTRA_OFFERS.some((o) => o.id === value))
  );
}
