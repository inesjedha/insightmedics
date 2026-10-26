import film16x9 from "@/assets/film/insight-medics-film-16x9.mp4";
import poster16x9 from "@/assets/film/poster-16x9.jpg";
import { FAQ } from "@/lib/faq";
import { FULL_AUDIT_PRICE_LABEL, OFFERS } from "@/lib/offers";
import { siteConfig } from "@/lib/site-config";

/**
 * Référencement (SEO) et citabilité par les moteurs IA (GEO) : balises de chaque page et
 * données structurées schema.org (JSON-LD), à partir des mêmes sources que le site
 * (offres, FAQ, équipe). Aucun fait ici qui ne soit déjà affiché sur le site.
 */

type JsonLd = Record<string, unknown>;

const URL = siteConfig.url;
export const absoluteUrl = (path: string) => `${URL}${path === "/" ? "/" : path}`;

const ORG_ID = `${URL}/#organisation`;
const SITE_ID = `${URL}/#site`;

/** Un bloc <script type="application/ld+json"> (le « < » est échappé pour rester dans la balise). */
export const ldScript = (data: JsonLd) => ({
  type: "application/ld+json",
  children: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c"),
});

/** Balises d'une page : titre, description, URL canonique, aperçus et JSON-LD. */
export function pageHead({
  path,
  title,
  description,
  ogTitle,
  ogType = "website",
  jsonLd = [],
}: {
  path: string;
  /** ≤ 60 caractères, mot-clé principal en tête. */
  title: string;
  /** ≤ 155 caractères. */
  description: string;
  ogTitle?: string;
  ogType?: "website" | "article";
  jsonLd?: JsonLd[];
}) {
  const url = absoluteUrl(path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: ogTitle ?? title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: ogType },
      { name: "twitter:title", content: ogTitle ?? title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: jsonLd.map(ldScript),
  };
}

/* ------------------------------------------------------------ Entités */

export const FOUNDERS = [
  {
    "@type": "Person",
    "@id": `${URL}/a-propos#hamza-ben-kheder`,
    name: "Hamza Ben Kheder",
    honorificPrefix: "Dr",
    jobTitle: "Médecin anesthésiste-réanimateur, cofondateur d'Insight Medics",
    worksFor: { "@id": ORG_ID },
  },
  {
    "@type": "Person",
    "@id": `${URL}/a-propos#ines-ben-amor`,
    name: "Inès Ben Amor",
    jobTitle: "Ingénieure IA, cofondatrice d'Insight Medics",
    worksFor: { "@id": ORG_ID },
  },
];

/** L'organisation, déclarée sur toutes les pages (gabarit racine). */
export const organizationLd: JsonLd = {
  "@type": ["Organization", "ProfessionalService"],
  "@id": ORG_ID,
  name: siteConfig.name,
  url: absoluteUrl("/"),
  logo: absoluteUrl("/icon-512.png"),
  image: absoluteUrl("/og-image.jpg"),
  email: siteConfig.email,
  description:
    "Accompagnement en statistiques et en rédaction de thèses de médecine, mémoires et articles, par une équipe de médecins et de biostatisticiens. L'étudiant reste l'auteur : nous analysons et rédigeons avec lui.",
  address: { "@type": "PostalAddress", addressLocality: "Sousse", addressCountry: "TN" },
  areaServed: { "@type": "Country", name: "Tunisie" },
  priceRange: `0 – ${OFFERS.map((o) => o.price).reduce((a, b) => Math.max(a, b))} TND`,
  knowsAbout: [
    "Biostatistique",
    "Thèse de médecine",
    "Analyse statistique SPSS",
    "Régression logistique",
    "Analyse de survie (Kaplan-Meier, Cox)",
    "Courbe ROC",
    "Rédaction scientifique IMRAD",
  ],
  founder: FOUNDERS.map((f) => ({ "@id": f["@id"] })),
  sameAs: [siteConfig.social.facebook],
};

export const websiteLd: JsonLd = {
  "@type": "WebSite",
  "@id": SITE_ID,
  url: absoluteUrl("/"),
  name: siteConfig.name,
  inLanguage: "fr",
  publisher: { "@id": ORG_ID },
};

/** Les formules et leur prix (pages Services et Tarifs). */
export const servicesLd: JsonLd = {
  "@type": "OfferCatalog",
  name: "Formules Insight Medics",
  url: absoluteUrl("/tarifs"),
  itemListElement: [
    {
      "@type": "Offer",
      name: "Test gratuit de la base de données",
      price: 0,
      priceCurrency: "TND",
      url: absoluteUrl("/audit"),
      itemOffered: {
        "@type": "Service",
        name: "Test gratuit de la base de données de thèse",
        description:
          "Score sur 100 et anomalies (données manquantes, doublons, codes non déclarés) en quelques minutes, calculés par notre code, sans IA ni inscription.",
        provider: { "@id": ORG_ID },
      },
    },
    {
      "@type": "Offer",
      name: "Audit complet de la base",
      price: Number(FULL_AUDIT_PRICE_LABEL.replace(/\D/g, "")),
      priceCurrency: "TND",
      url: absoluteUrl("/audit"),
      itemOffered: {
        "@type": "Service",
        name: "Audit complet de la base de données",
        description:
          "Verdict d'exploitabilité, plan de correction, rapport Word, classeur Excel et base nettoyée.",
        provider: { "@id": ORG_ID },
      },
    },
    ...OFFERS.map((o) => ({
      "@type": "Offer",
      name: o.title,
      price: o.price,
      priceCurrency: "TND",
      url: absoluteUrl(`/contact?offre=${o.id}`),
      itemOffered: {
        "@type": "Service",
        name: o.title,
        description: `${o.description} ${o.delay}.`,
        serviceType: "Accompagnement de thèse de médecine",
        areaServed: { "@type": "Country", name: "Tunisie" },
        provider: { "@id": ORG_ID },
      },
    })),
  ],
};

export const faqLd: JsonLd = {
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

/** Fil d'Ariane : [["Tarifs", "/tarifs"], …] (l'accueil est ajouté en tête). */
export function breadcrumbLd(items: [string, string][]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [["Accueil", "/"] as [string, string], ...items].map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

export function articleLd(a: {
  path: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
}): JsonLd {
  return {
    "@type": "Article",
    headline: a.title,
    description: a.description,
    url: absoluteUrl(a.path),
    mainEntityOfPage: absoluteUrl(a.path),
    datePublished: a.datePublished,
    dateModified: a.dateModified ?? a.datePublished,
    inLanguage: "fr",
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    image: absoluteUrl("/og-image.jpg"),
  };
}

/** Le film de présentation (accueil). */
export const filmLd: JsonLd = {
  "@type": "VideoObject",
  name: "Insight Medics en 52 secondes",
  description:
    "Statistiques et rédaction de thèse de médecine : analyses, rédaction avec vous, relecture par un médecin et un biostatisticien.",
  thumbnailUrl: absoluteUrl(poster16x9),
  contentUrl: absoluteUrl(film16x9),
  uploadDate: "2026-10-26",
  duration: "PT52S",
  inLanguage: "fr",
  publisher: { "@id": ORG_ID },
};
