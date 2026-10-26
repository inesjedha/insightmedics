import { frTypo } from "@/lib/typo";

export type OfferId = "analyses" | "discussion" | "these";

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

export function isOfferId(value: unknown): value is OfferId {
  return typeof value === "string" && OFFERS.some((o) => o.id === value);
}
