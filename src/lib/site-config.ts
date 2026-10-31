export const siteConfig = {
  name: "Insight Medics",
  description:
    "Insight Medics accompagne les étudiants et les médecins dans les statistiques et la rédaction de leur thèse, mémoire ou article. Nous analysons votre base, rédigeons avec vous, et un médecin et un biostatisticien relisent tout.",
  url: "https://www.insightmedics.fr",
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
    // Le formulaire de contact pèse autant que le test : deux portes d'entrée, aucun lead perdu.
    contact: { to: "/contact", label: "Parler à un expert", short: "Nous contacter" },
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
  /** WhatsApp de Dr Hamza (numéro public de la page Facebook), format international. */
  whatsapp: "21696389570",
  /**
   * Webinaire ouvert aux inscriptions (/webinaire). Nouvelle édition : changer ces deux
   * valeurs (les libellés de date en découlent, voir lib/webinar.ts), et les réglages
   * WEBINAR_* du backend, qui écrivent le mail de confirmation.
   */
  webinar: {
    title: "Les stats de ta thèse en 45 minutes",
    /** Début, avec le décalage de Tunis (UTC+1 toute l'année). */
    startDate: "2026-11-26T20:00:00+01:00",
  },
} as const;
