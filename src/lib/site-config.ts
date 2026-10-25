export const siteConfig = {
  name: "Insight Medics",
  description:
    "Insight Medics réalise les statistiques et la rédaction des thèses, mémoires et articles en médecine. Vous envoyez votre base, on l'analyse, on rédige, et un médecin et un biostatisticien relisent tout.",
  url: "https://www.insightmedics.tn",
  email: "helpinsightmedics@gmail.com",
  location: "Sousse, Tunisie",
  nav: [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { to: "/methode", label: "Méthode" },
    { to: "/tarifs", label: "Tarifs" },
    { to: "/contact", label: "Contact" },
  ] as const,
  cta: {
    audit: { to: "/audit", label: "Tester ma base gratuitement", short: "Audit gratuit" },
    order: { to: "/contact", label: "Confier ma thèse" },
  },
  legal: [
    { to: "/mentions-legales", label: "Mentions légales" },
    { to: "/confidentialite", label: "Confidentialité" },
    { to: "/cgv", label: "CGV" },
  ] as const,
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61580783536688",
  },
} as const;
