import type { ReactNode } from "react";

export type Offer = {
  id: "analyses" | "discussion" | "these";
  number: string;
  title: string;
  shortTitle: string;
  price: number;
  priceLabel: string;
  delay: string;
  tagline: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlight?: boolean;
  badge?: string;
};

/**
 * Source unique de vérité pour les trois offres payantes.
 * L'audit IA gratuit est géré séparément car ses CTA et son UI sont propres.
 */
export const OFFERS: Offer[] = [
  {
    id: "analyses",
    number: "01",
    title: "Analyse + rédaction des résultats",
    shortTitle: "Analyses & résultats",
    price: 500,
    priceLabel: "500 DT",
    delay: "Livré en 1 semaine",
    tagline: "Le plus demandé",
    description:
      "Analyses complètes (descriptif, comparatif, multivarié) et rédaction de la partie « Résultats » prête à intégrer.",
    features: [
      "Plan d'analyse validé par un biostatisticien",
      "Tests adaptés à votre design d'étude",
      "Tableaux & figures publiables",
      "Texte des résultats rédigé",
      "Validation humaine",
    ],
    ctaLabel: "Demander cette offre",
  },
  {
    id: "discussion",
    number: "02",
    title: "Rédaction de la discussion",
    shortTitle: "Discussion rédigée",
    price: 500,
    priceLabel: "500 DT",
    delay: "Livré en 1 semaine",
    tagline: "Rédaction ciblée",
    description:
      "Rédaction structurée : comparaison à la littérature, forces, limites, perspectives.",
    features: [
      "Recherche bibliographique ciblée",
      "Argumentation alignée sur vos résultats",
      "Forces et limites discutées",
      "Aller-retours de relecture inclus",
    ],
    ctaLabel: "Demander cette offre",
  },
  {
    id: "these",
    number: "03",
    title: "Accompagnement thèse complète",
    shortTitle: "Thèse complète",
    price: 1200,
    priceLabel: "1 200 DT",
    delay: "Livré en 2 semaines",
    tagline: "Accompagnement intégral",
    description:
      "De la base brute à la conclusion : introduction, matériel & méthodes, résultats, discussion, conclusion.",
    features: [
      "Introduction rédigée",
      "Matériel & Méthodes rédigés",
      "Analyses + résultats rédigés",
      "Discussion rédigée",
      "Conclusion rédigée",
      "Priorité sur les délais",
    ],
    ctaLabel: "Discuter du projet",
    highlight: true,
    badge: "Le plus choisi",
  },
];
