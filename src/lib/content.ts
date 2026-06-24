import type { Lang } from "./i18n";

/**
 * Centralized bilingual content for Insight Medics.
 * - FR: register pro/français standard.
 * - TN: derja "light & pro" en arabizi (lettres latines), termes techniques
 *   gardés en FR/EN pour rester crédible auprès des encadrants.
 */

type SiteCommon = {
  name: string;
  email: string;
  location: string;
  description: string;
  nav: { to: "/" | "/services" | "/methode" | "/tarifs" | "/contact"; label: string }[];
  ctaAuditLabel: string;
  ctaAuditShort: string;
  ctaOrderLabel: string;
  ctaOrderShort: string;
  footerRights: string;
  footerTagline: string;
  footerNavTitle: string;
  footerContactTitle: string;
  footerContactForm: string;
  langToggleAria: string;
};

type HomeContent = {
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  hero: {
    badge: string;
    titleMain: string;
    titleAccent: string;
    titleSub: string;
    desc: ReadonlyArray<string | { strong: string }>;
    ctaPrimary: string;
    ctaSecondary: string;
    bullets: string[];
  };
  trust: { value: string; label: string }[];
  problem: {
    eyebrow: string;
    title: string;
    points: string[];
  };
  solution: {
    eyebrow: string;
    title: string;
    points: string[];
  };
  audit: {
    eyebrow: string;
    title: string;
    desc: string;
    ctaPrimary: string;
    ctaSecondary: string;
    features: { title: string; text: string }[];
  };
  how: {
    eyebrow: string;
    title: string;
    desc: string;
    steps: { n: string; title: string; text: string }[];
  };
  who: {
    eyebrow: string;
    title: string;
    desc: string;
    audiences: { title: string; text: string }[];
  };
  finalCta: {
    title: string;
    desc: string;
    primary: string;
    secondary: string;
  };
};

type ServicesContent = {
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  eyebrow: string;
  title: string;
  desc: string;
  items: {
    badge?: string;
    title: string;
    price: string;
    description: string;
    features: string[];
    ctaLabel: string;
    ctaTo: string;
    highlighted?: boolean;
  }[];
  notSureTitle: string;
  notSureDesc: string;
  notSureCta: string;
};

type MethodeContent = {
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  intro: { eyebrow: string; title: string; desc: string };
  pillars: { title: string; text: string }[];
  separation: {
    eyebrow: string;
    title: string;
    desc: string;
    cards: { title: string; text: string }[];
  };
  data: {
    eyebrow: string;
    title: string;
    desc: string;
    cards: { title: string; text: string }[];
    pledgeTitle: string;
    pledgeLead: string;
    pledgeQuote: string;
  };
  finalTitle: string;
  finalDesc: string;
  finalCta: string;
};

type TarifsContent = {
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  eyebrow: string;
  title: string;
  desc: string;
  recommendedBadge: string;
  tiers: {
    name: string;
    price: string;
    sub: string;
    features: string[];
    ctaLabel: string;
    ctaTo: string;
    highlighted?: boolean;
  }[];
  whyTitle: string;
  whyDesc: string;
};

type ContactContent = {
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  eyebrow: string;
  title: string;
  desc: string;
  fields: {
    name: string;
    email: string;
    subject: string;
    message: string;
    subjectPh: string;
    messagePh: string;
  };
  consent: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successDesc: string;
  successAgain: string;
  asideEmailTitle: string;
  asideDelayTitle: string;
  asideDelayText: string;
  asideConfTitle: string;
  asideConfText: string;
  errors: {
    nameMin: string;
    nameMax: string;
    emailInvalid: string;
    emailMax: string;
    subjectMin: string;
    subjectMax: string;
    messageMin: string;
    messageMax: string;
  };
};

type AuditContent = {
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  badge: string;
  title: string;
  desc: string;
  ctaPrimary: string;
  ctaBack: string;
};

type NotFoundContent = {
  title: string;
  desc: string;
  cta: string;
};

type ErrorBoundaryContent = {
  title: string;
  desc: string;
  retry: string;
  home: string;
};

export type Content = {
  site: SiteCommon;
  home: HomeContent;
  services: ServicesContent;
  methode: MethodeContent;
  tarifs: TarifsContent;
  contact: ContactContent;
  audit: AuditContent;
  notFound: NotFoundContent;
  errorBoundary: ErrorBoundaryContent;
};

const SHARED = {
  name: "Insight Medics",
  email: "helpinsightmedics@gmail.com",
  location: "Sousse, Tunisie",
} as const;

const fr: Content = {
  site: {
    ...SHARED,
    description:
      "Insight Medics aide les thésards en médecine à boucler stats, discussion et rédaction dans les délais — sans compromis sur la rigueur. Audit IA gratuit de votre base, puis prise en charge humaine.",
    nav: [
      { to: "/", label: "Accueil" },
      { to: "/services", label: "Services" },
      { to: "/methode", label: "Méthode" },
      { to: "/tarifs", label: "Tarifs" },
      { to: "/contact", label: "Contact" },
    ],
    ctaAuditLabel: "Lancer un audit gratuit",
    ctaAuditShort: "Lancer un audit",
    ctaOrderLabel: "Confier ma thèse",
    ctaOrderShort: "Commander",
    footerRights: "Tous droits réservés.",
    footerTagline: "Conçu pour les médecins, résidents et thésards francophones.",
    footerNavTitle: "Navigation",
    footerContactTitle: "Contact",
    footerContactForm: "Formulaire de contact",
    langToggleAria: "Changer la langue",
  },
  home: {
    seoTitle: "Insight Medics — Votre thèse de médecine, prête en 2 semaines",
    seoDescription:
      "Rédaction scientifique, analyse statistique et data visualisation pour les thèses de médecine. Audit IA gratuit de votre base, puis prise en charge humaine — sans compromis sur la rigueur.",
    ogTitle: "Insight Medics — Thèse de médecine, prête en 2 semaines",
    ogDescription:
      "Stats qui bloquent, discussion qui piétine, deadline qui écrase ? On reprend la main : audit IA gratuit, puis rédaction et analyse par des experts.",
    hero: {
      badge: "Nouveau · Audit IA gratuit de votre base",
      titleMain: "Votre thèse de médecine,",
      titleAccent: "prête en 2 semaines",
      titleSub: "Sans compromis sur la rigueur.",
      desc: [
        "Vos stats vous bloquent ? Votre discussion piétine ? La deadline vous écrase ? On reprend la main : ",
        { strong: "audit IA gratuit" },
        " de votre base, puis rédaction scientifique, analyse statistique et data visualisation par des experts.",
      ],
      ctaPrimary: "Lancer un audit gratuit",
      ctaSecondary: "Voir nos services",
      bullets: [
        "Audit gratuit, sans engagement",
        "Base anonymisée avant analyse",
        "Spécialisé thèses de médecine",
      ],
    },
    trust: [
      { value: "2 sem.", label: "Délai annoncé pour une thèse" },
      { value: "Gratuit", label: "Audit IA de votre base" },
      { value: "Rédaction · Stats · Dataviz", label: "Périmètre" },
      { value: "Sousse, Tunisie", label: "Basé à" },
    ],
    problem: {
      eyebrow: "Le problème",
      title: "Vos stats bloquent. Votre discussion piétine. La deadline approche.",
      points: [
        "Une base SPSS qui dort dans un .sav, sans savoir par où commencer.",
        "Des heures sur SPSS pour des résultats dont vous n'êtes pas sûr.",
        "Une discussion qui ne décolle pas, faute de temps pour la littérature.",
        "Un directeur de thèse exigeant et une soutenance qui se rapproche.",
      ],
    },
    solution: {
      eyebrow: "Notre approche",
      title: "On reprend la main. Vous gardez la signature.",
      points: [
        "Audit IA gratuit : qualité de la base, structure, pistes d'ajustement.",
        "Tous les chiffres sortent de code Python exécuté — zéro valeur hallucinée.",
        "Rédaction scientifique, analyse statistique et data visualisation prises en charge.",
        "Délais calés sur une soutenance : version exploitable en 2 semaines.",
      ],
    },
    audit: {
      eyebrow: "Module Audit · gratuit",
      title: "Votre base, radiographiée en quelques minutes.",
      desc: "Téléversez votre base (.sav, .xlsx, .csv). Notre IA pilote des analyses Python réelles sur vos données anonymisées et vous renvoie un rapport PDF avec un score de qualité /100.",
      ctaPrimary: "Lancer un audit gratuit",
      ctaSecondary: "Comment ça marche",
      features: [
        {
          title: "Anonymisation automatique",
          text: "Identifiants, noms, dates de naissance pseudonymisés avant toute analyse.",
        },
        {
          title: "LLM + exécution réelle",
          text: "Le modèle génère du code Python ; les chiffres viennent du code, pas du LLM.",
        },
        {
          title: "Rapport PDF brandé",
          text: "Score /100, tableaux par variable, recommandations priorisées.",
        },
        {
          title: "Stockage chiffré + purge",
          text: "Fichiers chiffrés au repos, supprimés automatiquement après la prestation.",
        },
      ],
    },
    how: {
      eyebrow: "Comment ça marche",
      title: "Quatre étapes, zéro chiffre halluciné.",
      desc: "L'IA orchestre, le code calcule, l'expert humain valide. C'est ce qui rend nos rapports utilisables dans une thèse.",
      steps: [
        {
          n: "01",
          title: "Vous téléversez votre base",
          text: "Formats acceptés : .sav (SPSS), .xlsx, .csv. La base est chiffrée et anonymisée avant toute lecture.",
        },
        {
          n: "02",
          title: "Cadrage en 2 minutes",
          text: "Type d'étude, variable principale, confusion, taille d'échantillon attendue. Le contexte oriente l'audit.",
        },
        {
          n: "03",
          title: "Audit IA piloté par code",
          text: "Qualité, structure, pistes d'ajustement. Toutes les valeurs proviennent de calculs Python réels.",
        },
        {
          n: "04",
          title: "Rapport PDF + score /100",
          text: "Résumé exécutif, tableaux variable par variable, recommandations priorisées, CTA vers la prestation humaine.",
        },
      ],
    },
    who: {
      eyebrow: "Pour qui",
      title: "Conçu pour les francophones qui manipulent du vrai patient.",
      desc: "Notre cible : la Tunisie, le Maghreb, la France. Vos données restent les vôtres ; nous travaillons sur une copie anonymisée.",
      audiences: [
        {
          title: "Thésards en médecine",
          text: "Vous voulez livrer une thèse propre, dans les temps, sans devenir biostatisticien.",
        },
        {
          title: "Médecins & résidents",
          text: "Vous publiez un article, un poster ou un mémoire. Vous avez besoin de fiabilité statistique.",
        },
        {
          title: "Équipes hospitalières",
          text: "Vous gérez une cohorte ou un registre. Vous voulez auditer la base avant de la valoriser.",
        },
      ],
    },
    finalCta: {
      title: "Audit gratuit aujourd'hui. Thèse prête en 2 semaines.",
      desc: "En 10 minutes, vous saurez si votre base est exploitable, ce qu'il faut corriger, et comment on peut prendre le relais sur la rédaction et la dataviz.",
      primary: "Lancer un audit gratuit",
      secondary: "Commander une analyse complète",
    },
  },
  services: {
    seoTitle: "Services — Insight Medics",
    seoDescription:
      "Audit IA gratuit de votre base, analyse statistique complète, accompagnement rédaction des résultats de thèse. Tous nos services.",
    ogTitle: "Services — Insight Medics",
    ogDescription:
      "Audit gratuit, analyse statistique complète, rédaction des résultats. Pour thèses, articles et mémoires médicaux.",
    eyebrow: "Services",
    title: "Trois manières de travailler avec nous.",
    desc: "Commencez par l'audit gratuit pour évaluer votre base. Si vous voulez aller plus loin, nous prenons le relais avec une prestation humaine, à la mesure de vos besoins.",
    items: [
      {
        badge: "Gratuit",
        title: "Audit de base de données",
        price: "0 €",
        description:
          "Une radiographie automatique de votre base : qualité, structure, pistes d'ajustement, avec un score /100.",
        features: [
          "Formats .sav, .xlsx, .csv",
          "Anonymisation automatique avant analyse",
          "Détection manquants, doublons, incohérences cliniques",
          "Rapport PDF brandé en quelques minutes",
          "Sans engagement",
        ],
        ctaLabel: "Lancer un audit gratuit",
        ctaTo: "/audit",
      },
      {
        badge: "Le plus demandé",
        title: "Analyse statistique complète",
        price: "Sur devis",
        description:
          "Le cœur de notre métier : descriptif, comparatif, multivarié, courbes de survie, modèles ajustés. Tout ce dont votre thèse a besoin.",
        features: [
          "Cadrage avec un biostatisticien",
          "Choix des tests adaptés à votre design",
          "Tableaux et figures publiables (FR/EN)",
          "Code source remis sur demande",
          "Délais cadrés sur votre soutenance",
        ],
        ctaLabel: "Confier ma thèse",
        ctaTo: "/contact",
        highlighted: true,
      },
      {
        title: "Rédaction des résultats",
        price: "Sur devis",
        description:
          "Nous rédigeons la partie « Résultats » de votre thèse dans un français académique, en cohérence avec vos tableaux et figures.",
        features: [
          "Texte calibré pour une thèse de médecine",
          "Cohérence stricte avec les analyses",
          "Aller-retours de relecture inclus",
          "Compatibilité avec votre plan",
        ],
        ctaLabel: "Confier ma thèse",
        ctaTo: "/contact",
      },
      {
        title: "Accompagnement complet thèse",
        price: "Sur devis",
        description:
          "De la base brute à la soutenance : cadrage, analyses, rédaction, soutien méthodologique jusqu'au dépôt.",
        features: [
          "Point hebdomadaire avec votre référent",
          "Audit + analyses + rédaction inclus",
          "Préparation de la défense statistique",
          "Priorité sur les délais",
        ],
        ctaLabel: "Confier ma thèse",
        ctaTo: "/contact",
      },
    ],
    notSureTitle: "Pas sûr de ce qu'il vous faut ?",
    notSureDesc:
      "Lancez l'audit gratuit. Le rapport vous indiquera exactement ce qui peut être exploité dans votre base et ce qui mérite l'œil d'un humain.",
    notSureCta: "Lancer un audit gratuit",
  },
  methode: {
    seoTitle: "Méthode — Insight Medics",
    seoDescription:
      "Notre méthode garantit qu'aucun chiffre n'est inventé : le LLM orchestre, le code Python calcule, l'humain valide. Détails techniques et engagements éthiques.",
    ogTitle: "Méthode — Insight Medics",
    ogDescription:
      "LLM + exécution de code Python + relecture humaine. Anonymisation, chiffrement et purge automatique de vos fichiers.",
    intro: {
      eyebrow: "Notre méthode",
      title: "Aucun chiffre n'est jamais inventé.",
      desc: "Une thèse engage votre nom et celui de votre directeur. C'est pour ça que nous avons conçu un pipeline où le LLM rédige uniquement le narratif, et où chaque valeur provient d'un calcul Python réel.",
    },
    pillars: [
      {
        title: "LLM pilote",
        text: "Le modèle lit le contexte de cadrage, choisit les analyses pertinentes et génère du code Python adapté à votre base.",
      },
      {
        title: "Exécution réelle",
        text: "Le code tourne dans un environnement isolé (pandas, pyreadstat, scipy). Les sorties — n, p-values, % de manquants — viennent du code.",
      },
      {
        title: "Validation humaine",
        text: "Pour la prestation complète, un biostatisticien revoit, ajuste et signe les analyses définitives avant livraison.",
      },
    ],
    separation: {
      eyebrow: "Garde-fou structurel",
      title: "Le narratif et les chiffres sont séparés, par construction.",
      desc: "Nos templates de rapport lisent les nombres uniquement depuis les sorties de code. Le LLM n'a aucun moyen d'injecter une valeur dans un tableau ou un score.",
      cards: [
        {
          title: "Score /100 calculé, pas estimé",
          text: "Le score qualité est une formule déterministe à partir de sous-scores objectifs : complétude, cohérence, structure, taille d'échantillon. Le barème est versionné et affiché dans le rapport.",
        },
        {
          title: "Pas de résultats définitifs en mode audit",
          text: "L'audit s'arrête au cadrage et à la qualité. Les analyses qui comptent pour la thèse — comparatives, multivariées — sont réservées à la prestation humaine. C'est une exigence de fiabilité.",
        },
      ],
    },
    data: {
      eyebrow: "Données & confidentialité",
      title: "Hygiène stricte, par éthique et par respect du patient.",
      desc: "Nous opérons depuis la Tunisie sans cadre RGPD imposé, mais nos clients manipulent du sensible. Nous nous comportons comme si nous étions soumis aux exigences les plus strictes.",
      cards: [
        {
          title: "Anonymisation à l'upload",
          text: "Les colonnes identifiantes (noms, identifiants directs, dates de naissance) sont détectées et pseudonymisées avant toute analyse.",
        },
        {
          title: "Chiffrement au repos",
          text: "Vos fichiers sont chiffrés côté client avant envoi, puis stockés chiffrés. Aucune donnée patient n'apparaît dans nos logs.",
        },
        {
          title: "Purge automatique",
          text: "Vos fichiers et la table de correspondance sont supprimés automatiquement après livraison, selon une politique configurable.",
        },
      ],
      pledgeTitle: "Votre engagement de responsabilité",
      pledgeLead: "Avant chaque upload, vous certifiez ceci :",
      pledgeQuote:
        "« Je certifie être responsable de cette base de données et habilité(e) à la traiter. Je m'engage à fournir une base dont j'ai le droit de disposer. Insight Medics anonymise le fichier pour l'analyse, le conserve de façon sécurisée le temps de la prestation, puis le supprime. »",
    },
    finalTitle: "Prêt à voir ce que vaut votre base ?",
    finalDesc: "L'audit est gratuit. Le rapport vous dit où vous en êtes, en clair.",
    finalCta: "Lancer un audit gratuit",
  },
  tarifs: {
    seoTitle: "Tarifs — Insight Medics",
    seoDescription:
      "Audit IA gratuit. Prestation humaine sur devis, calibrée selon la complexité de votre base et vos délais. Tarifs transparents.",
    ogTitle: "Tarifs — Insight Medics",
    ogDescription:
      "Audit IA gratuit, analyses humaines sur devis selon la complexité et l'urgence.",
    eyebrow: "Tarifs",
    title: "Audit gratuit. Prestation humaine sur devis.",
    desc: "Nous ne publions pas de grille fixe pour nos prestations humaines : chaque thèse a sa complexité, son urgence et son périmètre. Le devis est rapide et transparent.",
    recommendedBadge: "Recommandé",
    tiers: [
      {
        name: "Audit IA",
        price: "Gratuit",
        sub: "Sans engagement",
        features: [
          "Audit qualité, structure, pistes d'ajustement",
          "Score /100 et rapport PDF",
          "Anonymisation automatique",
          "Stockage chiffré + purge",
        ],
        ctaLabel: "Lancer un audit",
        ctaTo: "/audit",
      },
      {
        name: "Analyse complète",
        price: "Sur devis",
        sub: "Le plus demandé",
        features: [
          "Cadrage avec biostatisticien",
          "Descriptif + comparatif + multivarié",
          "Tableaux & figures publiables",
          "Délais cadrés sur votre soutenance",
          "Aller-retours de relecture",
        ],
        ctaLabel: "Demander un devis",
        ctaTo: "/contact",
        highlighted: true,
      },
      {
        name: "Accompagnement thèse",
        price: "Sur devis",
        sub: "Suivi complet",
        features: [
          "Audit + analyses + rédaction",
          "Point hebdomadaire dédié",
          "Préparation soutenance",
          "Priorité sur les délais",
        ],
        ctaLabel: "Discuter du projet",
        ctaTo: "/contact",
      },
    ],
    whyTitle: "Pourquoi un devis plutôt qu'un tarif fixe ?",
    whyDesc:
      "Le prix d'une analyse dépend de la complexité de votre base (nombre de variables, structure, qualité), du type d'étude (transversale, cohorte, cas-témoins, essai), du niveau d'ajustement attendu et de l'urgence. On vous répond en moins de 48h après réception de votre brief, et le devis est sans engagement.",
  },
  contact: {
    seoTitle: "Contact — Insight Medics",
    seoDescription:
      "Discutez de votre projet de thèse, de votre base de données ou de notre prestation d'analyse statistique. Réponse sous 48h.",
    ogTitle: "Contact — Insight Medics",
    ogDescription: "Réponse sous 48h. Décrivez votre projet et nous revenons vers vous.",
    eyebrow: "Contact",
    title: "Parlons de votre projet.",
    desc: "Décrivez en quelques lignes votre étude, l'état de votre base et vos délais. Nous revenons vers vous sous 48h.",
    fields: {
      name: "Nom complet",
      email: "Email",
      subject: "Sujet",
      message: "Votre message",
      subjectPh: "Ex. Analyse statistique pour thèse en cardiologie",
      messagePh: "Type d'étude, taille de la base, deadline, attentes…",
    },
    consent: "En envoyant ce message, vous acceptez d'être recontacté(e) par email.",
    submit: "Envoyer",
    submitting: "Envoi…",
    successTitle: "Message envoyé.",
    successDesc: "Merci. Nous vous répondons sous 48h ouvrées à l'adresse indiquée.",
    successAgain: "Envoyer un autre message",
    asideEmailTitle: "Email direct",
    asideDelayTitle: "Délais de réponse",
    asideDelayText:
      "Réponse sous 48h ouvrées. Pour les soutenances imminentes, signalez-le dès le premier message — nous traitons en priorité.",
    asideConfTitle: "Confidentialité",
    asideConfText:
      "Ne joignez pas votre base ici. Si nous lançons une prestation, vous nous l'enverrez via notre canal sécurisé d'upload.",
    errors: {
      nameMin: "Nom trop court",
      nameMax: "Nom trop long",
      emailInvalid: "Email invalide",
      emailMax: "Email trop long",
      subjectMin: "Sujet trop court",
      subjectMax: "Sujet trop long",
      messageMin: "Détaillez un peu plus (min. 20 caractères)",
      messageMax: "Message trop long (max. 2000 caractères)",
    },
  },
  audit: {
    seoTitle: "Audit IA — Insight Medics",
    seoDescription:
      "Lancez un audit IA gratuit de votre base de données médicale. Anonymisation automatique, rapport PDF, score de qualité /100.",
    ogTitle: "Audit IA — Insight Medics",
    ogDescription:
      "Audit gratuit de votre base médicale, rapport PDF brandé en quelques minutes.",
    badge: "Bientôt disponible",
    title: "Le module Audit arrive très bientôt.",
    desc: "Nous mettons la dernière main au pipeline d'anonymisation, d'exécution Python sandboxée et de génération du rapport PDF. En attendant, vous pouvez nous contacter pour discuter de votre projet.",
    ctaPrimary: "Discuter de mon projet",
    ctaBack: "Retour à l'accueil",
  },
  notFound: {
    title: "Page introuvable",
    desc: "La page que vous cherchez n'existe pas ou a été déplacée.",
    cta: "Retour à l'accueil",
  },
  errorBoundary: {
    title: "Cette page n'a pas pu charger",
    desc: "Une erreur est survenue. Vous pouvez réessayer ou revenir à l'accueil.",
    retry: "Réessayer",
    home: "Accueil",
  },
};

/**
 * Tunisien — derja en arabizi, ton léger & pro.
 * On garde les termes techniques (statistique, p-value, SPSS, anonymisation,
 * Python, RGPD, biostatisticien) en français pour rester crédible.
 */
const tn: Content = {
  site: {
    ...SHARED,
    description:
      "Insight Medics y3awnek bech tkamel thèstek b les stats, el discussion w el rédaction fel waqt — bel rigueur el matloub. Audit IA b lebess 3al base mte3ek, w ba3d na7nou nekhdmoulek el ba9i.",
    nav: [
      { to: "/", label: "El bidaya" },
      { to: "/services", label: "Khdemna" },
      { to: "/methode", label: "Méthode" },
      { to: "/tarifs", label: "Es3ar" },
      { to: "/contact", label: "Contact" },
    ],
    ctaAuditLabel: "A3mel audit b lebess",
    ctaAuditShort: "A3mel audit",
    ctaOrderLabel: "Khalini n7el thèstek",
    ctaOrderShort: "Commander",
    footerRights: "Kol el 7oukouk ma7foudha.",
    footerTagline: "Mas3oul lel doktoura, lel résidents w lel thésards.",
    footerNavTitle: "Navigation",
    footerContactTitle: "Contact",
    footerContactForm: "Formulaire de contact",
    langToggleAria: "Bedel el lougha",
  },
  home: {
    seoTitle: "Insight Medics — Thèstek f tibb, jahza f jouma3a 2",
    seoDescription:
      "Rédaction scientifique, analyse statistique w data visualisation lel thèses fel tibb. Audit IA b lebess 3al base mte3ek, w ba3d ena7nou nekhdmou — bel rigueur el matloub.",
    ogTitle: "Insight Medics — Thèstek f tibb, jahza f jouma3a 2",
    ogDescription:
      "Les stats wa9fou bik ? El discussion ma 3adetch tetharek ? El deadline 9arba ? Na7na n9oumou bel khedma : audit IA b lebess, w ba3d rédaction w analyse mta3 experts.",
    hero: {
      badge: "Jdid · Audit IA b lebess 3al base mte3ek",
      titleMain: "Thèstek f tibb,",
      titleAccent: "jahza f jouma3a 2",
      titleSub: "Bel rigueur el matloub, sans compromis.",
      desc: [
        "Les stats wa9fou bik ? El discussion ma temchich ? El deadline t7otek ta7t pression ? Na7na n9oumou bel 7ekeya : ",
        { strong: "audit IA b lebess" },
        " 3al base mte3ek, w ba3d rédaction scientifique, analyse statistique w data visualisation mta3 experts.",
      ],
      ctaPrimary: "A3mel audit b lebess",
      ctaSecondary: "Chouf el khdemna",
      bullets: [
        "Audit b lebess, sans engagement",
        "Base anonymisée 9bal el analyse",
        "Spécialisés f thèses fel tibb",
      ],
    },
    trust: [
      { value: "2 jouma3a", label: "Délai mta3 thèse" },
      { value: "B lebess", label: "Audit IA 3al base" },
      { value: "Rédaction · Stats · Dataviz", label: "Ech na3mlou" },
      { value: "Sousse, Tounes", label: "Mat7otna" },
    ],
    problem: {
      eyebrow: "El mochkla",
      title: "Les stats wa9fou bik. El discussion ma temchich. El deadline 9arba.",
      points: [
        "Base SPSS rê9da fi .sav, w ma ta3refch men wein tabda.",
        "Sa3et 3al SPSS w fel akher el résultats ma 3andekch confiance fihom.",
        "Discussion ma tetharekch, 3ala khater ma 3andekch wa9t lel littérature.",
        "Directeur mta3 thèse fih des exigences, w la date mta3 soutenance 9arba.",
      ],
    },
    solution: {
      eyebrow: "Ki na3mlou",
      title: "Na7na ne7lou. Enti tab9a 3andek el signature.",
      points: [
        "Audit IA b lebess : qualité mta3 base, structure, ki tnajem t7assan.",
        "El chiffres lkol kharjin men code Python yetnafez — zero valeur halluciné.",
        "Rédaction scientifique, analyse statistique w data visualisation — 3lina.",
        "Délais 3ala 9add soutenance : version exploitable f jouma3a 2.",
      ],
    },
    audit: {
      eyebrow: "Module Audit · b lebess",
      title: "El base mte3ek, radiographie f de9aye9.",
      desc: "Téléversi el base mte3ek (.sav, .xlsx, .csv). El IA mte3na te7ki des analyses Python 7a9i9iyin 3al data anonymisée w terja3lek rapport PDF b score qualité /100.",
      ctaPrimary: "A3mel audit b lebess",
      ctaSecondary: "Ki tekhdem",
      features: [
        {
          title: "Anonymisation automatique",
          text: "Les identifiants, asma, dates de naissance pseudonymisés 9bal ay analyse.",
        },
        {
          title: "LLM + exécution 7a9i9iya",
          text: "El modèle ya3mel code Python ; el chiffres jeyin men el code, mech men el LLM.",
        },
        {
          title: "Rapport PDF brandé",
          text: "Score /100, tableaux b variable, recommandations priorisées.",
        },
        {
          title: "Stockage chiffré + purge",
          text: "Les fichiers chiffrés, w yetmes7ou b wa7adhom ba3d el prestation.",
        },
      ],
    },
    how: {
      eyebrow: "Ki tekhdem",
      title: "Arba3a étapes, w zero chiffre halluciné.",
      desc: "El IA torchestri, el code y7esseb, l'expert el bnedem yvaliid. Hakeka rapports mte3na yetnajmou yet7otou f thèse.",
      steps: [
        {
          n: "01",
          title: "Téléversi el base mte3ek",
          text: "Formats accepted : .sav (SPSS), .xlsx, .csv. El base tetchiffer w tetanonymisi 9bal ay 9raya.",
        },
        {
          n: "02",
          title: "Cadrage f de9i9tein",
          text: "Type d'étude, variable principale, confusion, taille d'échantillon. El contexte yorienti l'audit.",
        },
        {
          n: "03",
          title: "Audit IA piloté b code",
          text: "Qualité, structure, ki tnajem t7assan. El valeurs lkol jeyin men calculs Python 7a9i9iyin.",
        },
        {
          n: "04",
          title: "Rapport PDF + score /100",
          text: "Résumé exécutif, tableaux b variable, recommandations priorisées, w CTA lel prestation b bnedem.",
        },
      ],
    },
    who: {
      eyebrow: "Lmen",
      title: "Conçu lel ness eli yekhdmou 3ala data 7a9i9iya mta3 patients.",
      desc: "El cible mte3na : Tounes, el Maghreb, France. El data mte3ek tab9a mte3ek ; na7na nekhdmou 3ala copie anonymisée.",
      audiences: [
        {
          title: "Thésards f tibb",
          text: "T7eb tsalem thèse propre, fel waqt, b la ma tweli biostatisticien.",
        },
        {
          title: "Doktoura & résidents",
          text: "Bech tepublish article, poster wala mémoire. La7eyek confiance statistique.",
        },
        {
          title: "Équipes hospitalières",
          text: "Tgéri cohorte wala registre. T7eb t3amel audit 9bal ma tvaloris el data.",
        },
      ],
    },
    finalCta: {
      title: "Audit b lebess el youm. Thèse jahza f jouma3a 2.",
      desc: "F 10 de9aye9, ta3ref ken el base mte3ek exploitable, ki tnajem t9awmiha, w ki na7nou n9oumou bel rédaction w el dataviz.",
      primary: "A3mel audit b lebess",
      secondary: "Commander analyse complète",
    },
  },
  services: {
    seoTitle: "Khdemna — Insight Medics",
    seoDescription:
      "Audit IA b lebess 3al base, analyse statistique kemla, accompagnement rédaction des résultats mta3 thèse. El khdemna lkol.",
    ogTitle: "Khdemna — Insight Medics",
    ogDescription:
      "Audit b lebess, analyse statistique kemla, rédaction des résultats. Lel thèses, articles w mémoires fel tibb.",
    eyebrow: "Khdemna",
    title: "Thletha tor9ouf bech tekhdem m3ena.",
    desc: "Abda bel audit b lebess bech tchouf el base mte3ek. Ki t7eb temchi akther, na7na n9oumou bel be9i b prestation bnedem, 3ala 9add ma t7eb.",
    items: [
      {
        badge: "B lebess",
        title: "Audit mta3 base de données",
        price: "0 DT",
        description:
          "Radiographie automatique lel base mte3ek : qualité, structure, ki tnajem t7assan, b score /100.",
        features: [
          "Formats .sav, .xlsx, .csv",
          "Anonymisation automatique 9bal el analyse",
          "Détection mta3 manquants, doublons, incohérences cliniques",
          "Rapport PDF brandé f de9aye9",
          "Sans engagement",
        ],
        ctaLabel: "A3mel audit b lebess",
        ctaTo: "/audit",
      },
      {
        badge: "El akther mat'loub",
        title: "Analyse statistique kemla",
        price: "Sur devis",
        description:
          "El core mta3 khedmetna : descriptif, comparatif, multivarié, courbes de survie, modèles ajustés. Kol chay eli y7tajou thèstek.",
        features: [
          "Cadrage m3a biostatisticien",
          "Choix mta3 tests adaptés lel design mte3ek",
          "Tableaux w figures publiables (FR/EN)",
          "Code source 3ala demande",
          "Délais cadrés 3ala soutenance mte3ek",
        ],
        ctaLabel: "Khalini n7el thèstek",
        ctaTo: "/contact",
        highlighted: true,
      },
      {
        title: "Rédaction mta3 résultats",
        price: "Sur devis",
        description:
          "Na7nou nektbou partie « Résultats » mta3 thèstek b français académique, b cohérence m3a tableaux w figures mte3ek.",
        features: [
          "Texte calibré lel thèse fel tibb",
          "Cohérence stricte m3a el analyses",
          "Aller-retours mta3 relecture inclus",
          "Compatible m3a el plan mte3ek",
        ],
        ctaLabel: "Khalini n7el thèstek",
        ctaTo: "/contact",
      },
      {
        title: "Accompagnement complet mta3 thèse",
        price: "Sur devis",
        description:
          "Men el base brute lel soutenance : cadrage, analyses, rédaction, soutien méthodologique 7ata dépôt.",
        features: [
          "Point hebdomadaire m3a référent mte3ek",
          "Audit + analyses + rédaction inclus",
          "Préparation mta3 défense statistique",
          "Priorité 3ala délais",
        ],
        ctaLabel: "Khalini n7el thèstek",
        ctaTo: "/contact",
      },
    ],
    notSureTitle: "Ma 3aref ech ye7tajek ?",
    notSureDesc:
      "A3mel audit b lebess. El rapport y9oulek bel zef ech ynajem yetkhdam fel base mte3ek, w ech ye7taj œil mta3 bnedem.",
    notSureCta: "A3mel audit b lebess",
  },
  methode: {
    seoTitle: "Méthode — Insight Medics",
    seoDescription:
      "El méthode mte3na tdhaman eli 7atta chiffre wa7ed ma yet3amelch invented : el LLM yorchestri, el code Python y7esseb, el bnedem yvaliid. Détails techniques w engagements éthiques.",
    ogTitle: "Méthode — Insight Medics",
    ogDescription:
      "LLM + exécution mta3 code Python + relecture b bnedem. Anonymisation, chiffrement w purge automatique mta3 les fichiers mte3ek.",
    intro: {
      eyebrow: "El méthode mte3na",
      title: "7atta chiffre wa7ed ma yet3amelch invented.",
      desc: "Thèse fiha esmek w esm el directeur mte3ek. 3al hekka 3amelna pipeline wein el LLM yekteb ken el narratif, w kol valeur jeya men calcul Python 7a9i9i.",
    },
    pillars: [
      {
        title: "LLM pilote",
        text: "El modèle ye9ra el contexte mta3 cadrage, yekhtar les analyses pertinents w ya3mel code Python adapté lel base mte3ek.",
      },
      {
        title: "Exécution 7a9i9iya",
        text: "El code yetnafez f environnement isolé (pandas, pyreadstat, scipy). Les sorties — n, p-values, % mta3 manquants — jeyin men el code.",
      },
      {
        title: "Validation b bnedem",
        text: "Lel prestation kemla, biostatisticien yer3a, yajusti w yemdhi les analyses définitives 9bal el livraison.",
      },
    ],
    separation: {
      eyebrow: "Garde-fou structurel",
      title: "El narratif w el chiffres mafsoulin, b la construction.",
      desc: "Les templates mta3 rapport ye9rou el chiffres ken men sorties mta3 code. El LLM ma 3andouch ki ydir bech y7ot valeur f tableau wala score.",
      cards: [
        {
          title: "Score /100 m7esseb, mech estimé",
          text: "El score qualité formule déterministe men sous-scores objectifs : complétude, cohérence, structure, taille d'échantillon. El barème versionné w mawjoud fel rapport.",
        },
        {
          title: "Mafamech résultats définitifs f mode audit",
          text: "L'audit yew9ef 3al cadrage w el qualité. Les analyses eli yet9assou f thèse — comparatives, multivariées — réservées lel prestation b bnedem. Hekka exigence mta3 fiabilité.",
        },
      ],
    },
    data: {
      eyebrow: "Data & confidentialité",
      title: "Hygiène stricte, b éthique w b respect lel patient.",
      desc: "Na7nou nekhdmou men Tounes b la cadre RGPD imposé, ama el clients mte3na ye3almou b data sensible. Na3mlou kima ken kanou 3lina exigences el akther strictes.",
      cards: [
        {
          title: "Anonymisation 3al upload",
          text: "Les colonnes identifiantes (asma, identifiants directs, dates de naissance) yetlawjou w yetpseudonymisi 9bal ay analyse.",
        },
        {
          title: "Chiffrement au repos",
          text: "Les fichiers mte3ek tetchiffer côté client 9bal envoi, w yet7afdhou chiffrés. 7atta data mta3 patient ma tetbenech fel logs mte3na.",
        },
        {
          title: "Purge automatique",
          text: "Les fichiers mte3ek w el table mta3 correspondance yetmes7ou b wa7adhom ba3d livraison, 7asb politique configurable.",
        },
      ],
      pledgeTitle: "Engagement mte3ek mta3 responsabilité",
      pledgeLead: "9bal kol upload, t9oul hetha :",
      pledgeQuote:
        "« Na7nou n7ot signature eli ena responsable 3al base hadhi w 3andi el 7a9 net3amel m3aha. Nlazem nrofdah base eli 3andi el 7a9 net3amel m3aha. Insight Medics yanonymisi el fichier lel analyse, y7afdh 3lih bel sécurité 9add el prestation, ba3d yamse7ou. »",
    },
    finalTitle: "Lesta bech tchouf el base mte3ek ki tjib ?",
    finalDesc: "L'audit b lebess. El rapport y9oulek wein enti, b sara7a.",
    finalCta: "A3mel audit b lebess",
  },
  tarifs: {
    seoTitle: "Es3ar — Insight Medics",
    seoDescription:
      "Audit IA b lebess. Prestation b bnedem sur devis, 3ala 9add complexité mta3 base w el délais. Es3ar transparents.",
    ogTitle: "Es3ar — Insight Medics",
    ogDescription:
      "Audit IA b lebess, analyses b bnedem sur devis 7asb complexité w l'urgence.",
    eyebrow: "Es3ar",
    title: "Audit b lebess. Prestation b bnedem sur devis.",
    desc: "Ma nepublishou ch grille fixe lel prestations b bnedem : kol thèse fiha complexité, urgence w périmètre mte3ha. El devis sari3 w transparent.",
    recommendedBadge: "Recommandé",
    tiers: [
      {
        name: "Audit IA",
        price: "B lebess",
        sub: "Sans engagement",
        features: [
          "Audit qualité, structure, ki tnajem t7assan",
          "Score /100 w rapport PDF",
          "Anonymisation automatique",
          "Stockage chiffré + purge",
        ],
        ctaLabel: "A3mel audit",
        ctaTo: "/audit",
      },
      {
        name: "Analyse kemla",
        price: "Sur devis",
        sub: "El akther mat'loub",
        features: [
          "Cadrage m3a biostatisticien",
          "Descriptif + comparatif + multivarié",
          "Tableaux & figures publiables",
          "Délais cadrés 3ala soutenance mte3ek",
          "Aller-retours mta3 relecture",
        ],
        ctaLabel: "Otleb devis",
        ctaTo: "/contact",
        highlighted: true,
      },
      {
        name: "Accompagnement thèse",
        price: "Sur devis",
        sub: "Suivi complet",
        features: [
          "Audit + analyses + rédaction",
          "Point hebdomadaire dédié",
          "Préparation mta3 soutenance",
          "Priorité 3ala délais",
        ],
        ctaLabel: "Net7adthou 3al projet",
        ctaTo: "/contact",
      },
    ],
    whyTitle: "3lech devis w mech ses3ir fixe ?",
    whyDesc:
      "Es3ar mta3 analyse y3temed 3ala complexité mta3 el base (3add variables, structure, qualité), type d'étude (transversale, cohorte, cas-témoins, essai), niveau mta3 ajustement w l'urgence. Nradou 3lik f a9al men 48 sa3a ba3d ma nrofdou el brief, w el devis sans engagement.",
  },
  contact: {
    seoTitle: "Contact — Insight Medics",
    seoDescription:
      "Net7adthou 3al projet thèstek, 3al base mte3ek wala 3al prestation mta3 analyse statistique. Réponse f 48 sa3a.",
    ogTitle: "Contact — Insight Medics",
    ogDescription:
      "Réponse f 48 sa3a. O9wel chnouwa el projet mte3ek w nradou 3lik.",
    eyebrow: "Contact",
    title: "Net7adthou 3al projet mte3ek.",
    desc: "O9wel f kelmet l'étude mte3ek, état mta3 base w el délais. Nradou 3lik f 48 sa3a.",
    fields: {
      name: "Esmek complet",
      email: "Email",
      subject: "Sujet",
      message: "El message mte3ek",
      subjectPh: "Mathalan : analyse statistique lel thèse f cardiologie",
      messagePh: "Type d'étude, taille mta3 base, deadline, ech tetstana…",
    },
    consent: "Ki tab3eth el message, t9bel eli na3awdou nektblouk b email.",
    submit: "Eb3eth",
    submitting: "Yetab3eth…",
    successTitle: "El message wsel.",
    successDesc: "Choukran. Nradou 3lik f 48 sa3a ouvrées 3al email eli 3titna.",
    successAgain: "Eb3eth message okhor",
    asideEmailTitle: "Email direct",
    asideDelayTitle: "Délais mta3 réponse",
    asideDelayText:
      "Réponse f 48 sa3a ouvrées. Lel soutenances 9oraba, 9oulna men el message lewl — n3almou bel priorité.",
    asideConfTitle: "Confidentialité",
    asideConfText:
      "Ma t7otch el base mte3ek hné. Ki nabdew prestation, tab3thalena 3la canal sécurisé mta3 upload.",
    errors: {
      nameMin: "Esm 9assir",
      nameMax: "Esm twil",
      emailInvalid: "Email invalide",
      emailMax: "Email twil",
      subjectMin: "Sujet 9assir",
      subjectMax: "Sujet twil",
      messageMin: "Détail chwaya akther (min. 20 caractères)",
      messageMax: "Message twil (max. 2000 caractères)",
    },
  },
  audit: {
    seoTitle: "Audit IA — Insight Medics",
    seoDescription:
      "A3mel audit IA b lebess 3al base mta3 data médicale. Anonymisation automatique, rapport PDF, score qualité /100.",
    ogTitle: "Audit IA — Insight Medics",
    ogDescription:
      "Audit b lebess 3al base médicale, rapport PDF brandé f de9aye9.",
    badge: "9rib jdid",
    title: "Module Audit yji 9rib b ezzef.",
    desc: "Na7nou nlamou el pipeline mta3 anonymisation, exécution Python sandboxée w génération mta3 rapport PDF. Lekn enti tnajem t3aytlina bech net7adthou 3al projet mte3ek.",
    ctaPrimary: "Net7adthou 3al projet",
    ctaBack: "Erja3 lel bidaya",
  },
  notFound: {
    title: "Page ma mawjouda",
    desc: "El page eli t7awas 3liha ma mawjouda wala tbadlet.",
    cta: "Erja3 lel bidaya",
  },
  errorBoundary: {
    title: "El page hadhi ma najmetch tatla3",
    desc: "Sar erreur. Tnajem t3awed wala terja3 lel bidaya.",
    retry: "3awed",
    home: "El bidaya",
  },
};

export const content: Record<Lang, Content> = { fr, tn };

export function useContent(lang: Lang): Content {
  return content[lang];
}
