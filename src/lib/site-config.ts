export const siteConfig = {
  name: "Insight Medics",
  tagline:
    "Rédaction scientifique · Analyse statistique · Data visualisation pour vos thèses de médecine.",
  description:
    "Insight Medics aide les thésards en médecine à boucler stats, discussion et rédaction dans les délais — sans compromis sur la rigueur. Audit IA gratuit de votre base, puis prise en charge humaine.",
  url: "https://insight-medics.com",
  email: "helpinsightmedics@gmail.com",
  location: "Sousse, Tunisie",
  promise: "Votre thèse, prête en 2 semaines.",
  nav: [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { to: "/methode", label: "Méthode" },
    { to: "/tarifs", label: "Tarifs" },
    { to: "/contact", label: "Contact" },
  ] as const,
  cta: {
    audit: { to: "/audit", label: "Lancer un audit gratuit" },
    order: { to: "/contact", label: "Confier ma thèse" },
  },
} as const;
