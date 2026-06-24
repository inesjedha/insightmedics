export const siteConfig = {
  name: "Insight Medics",
  tagline: "L'analyse statistique pensée pour les thèses de médecine.",
  description:
    "Insight Medics réalise l'analyse statistique de vos bases de données médicales. Audit IA gratuit de votre base, puis prestation humaine pour vos résultats de thèse.",
  url: "https://insight-medics.com",
  email: "helpinsightmedics@gmail.com",
  nav: [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { to: "/methode", label: "Méthode" },
    { to: "/tarifs", label: "Tarifs" },
    { to: "/contact", label: "Contact" },
  ] as const,
  cta: {
    audit: { to: "/audit", label: "Lancer un audit gratuit" },
    order: { to: "/contact", label: "Commander une analyse" },
  },
} as const;
