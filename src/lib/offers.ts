type Offer = {
  id: "analyses" | "discussion" | "these";
  number: string;
  title: string;
  shortTitle: string;
  price: number;
  priceLabel: string;
  /** Délai standard en semaines, à partir d'une base exploitable (cf. CGV §4). */
  delayWeeks: number;
  delay: string;
  tagline: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlight?: boolean;
  badge?: string;
};

/** Prix de l'audit complet (déblocage après l'aperçu gratuit). */
export const FULL_AUDIT_PRICE_LABEL = "50 DT";

/** « 1 semaine », « 2 semaines ». */
export function weeksLabel(weeks: number): string {
  return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
}

/**
 * Source unique de vérité pour les trois offres payantes (prix, délais, contenu).
 * Tout texte du site qui cite un prix ou un délai le lit ici : jamais en dur.
 * L'audit gratuit est géré séparément car ses CTA et son UI sont propres.
 */
export const OFFERS: Offer[] = [
  {
    id: "analyses",
    number: "01",
    title: "Analyses statistiques + résultats rédigés",
    shortTitle: "Analyses + résultats",
    price: 500,
    priceLabel: "500 DT",
    delayWeeks: 1,
    delay: `Livré en ${weeksLabel(1)}`,
    tagline: "Pour vos statistiques",
    description:
      "Les statistiques de votre étude (descriptives, comparaisons, analyses multivariées) et la partie « Résultats » rédigée, prête à insérer.",
    features: [
      "Plan d'analyse validé par un biostatisticien",
      "Tests adaptés à votre type d'étude",
      "Tableaux et figures prêts à insérer",
      "Partie « Résultats » rédigée",
      "Relu par un médecin et un biostatisticien",
    ],
    ctaLabel: "Choisir cette formule",
  },
  {
    id: "discussion",
    number: "02",
    title: "Rédaction de la discussion",
    shortTitle: "Discussion rédigée",
    price: 500,
    priceLabel: "500 DT",
    delayWeeks: 1,
    delay: `Livré en ${weeksLabel(1)}`,
    tagline: "Pour votre discussion",
    description:
      "Une discussion structurée et référencée : comparaison avec la littérature, forces, limites et perspectives.",
    features: [
      "Recherche bibliographique ciblée",
      "Argumentation alignée sur vos résultats",
      "Forces et limites discutées",
      "Allers-retours de relecture inclus",
    ],
    ctaLabel: "Choisir cette formule",
  },
  {
    id: "these",
    number: "03",
    title: "Accompagnement thèse complète",
    shortTitle: "Thèse complète",
    price: 1200,
    priceLabel: "1 200 DT",
    delayWeeks: 2,
    delay: `Livré en ${weeksLabel(2)}`,
    tagline: "De la base brute à la conclusion",
    description:
      "Tout le manuscrit, accompagné de bout en bout : introduction, matériel et méthodes, résultats, discussion, conclusion.",
    features: [
      "Introduction rédigée",
      "Matériel et méthodes rédigés",
      "Analyses + résultats rédigés",
      "Discussion rédigée",
      "Conclusion rédigée",
      "Priorité sur les délais",
    ],
    ctaLabel: "Discuter de ma thèse",
    highlight: true,
    badge: "La plus complète",
  },
];

/** Offre par identifiant (lève une erreur si l'identifiant est inconnu). */
export function getOffer(id: Offer["id"]): Offer {
  const offer = OFFERS.find((o) => o.id === id);
  if (!offer) throw new Error(`Offre inconnue : ${id}`);
  return offer;
}

/** Montant affichable d'une offre, sans la devise (ex. « 1 200 »). */
export function offerPrice(id: Offer["id"]): string {
  return getOffer(id).priceLabel.replace(/\s*DT$/, "");
}
