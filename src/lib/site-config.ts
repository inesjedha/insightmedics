export const siteConfig = {
  name: "Insight Medics",
  description:
    "Insight Medics accompagne les étudiants et les médecins dans les statistiques et la rédaction de leur thèse, mémoire ou article. Nous analysons votre base, rédigeons avec vous, et un médecin et un biostatisticien relisent tout.",
  url: "https://www.insightmedics.tn",
  email: "helpinsightmedics@gmail.com",
  location: "Sousse, Tunisie",
  nav: [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { to: "/methode", label: "Méthode" },
    { to: "/tarifs", label: "Tarifs" },
    { to: "/guides", label: "Guides" },
    { to: "/contact", label: "Contact" },
  ] as const,
  cta: {
    audit: { to: "/audit", label: "Tester ma base gratuitement", short: "Tester ma base" },
    order: { to: "/contact", label: "Confier ma thèse" },
  },
  about: { to: "/a-propos", label: "À propos" },
  legal: [
    { to: "/mentions-legales", label: "Mentions légales" },
    { to: "/confidentialite", label: "Confidentialité" },
    { to: "/cgv", label: "CGV" },
  ] as const,
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61580783536688",
  },
} as const;
