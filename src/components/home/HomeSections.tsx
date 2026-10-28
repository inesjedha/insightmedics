import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronLeft, ChevronRight, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExplainerVideo } from "@/components/home/ExplainerVideo";
import { FilmButton } from "@/components/home/FilmButton";
import { FinalCTA } from "@/components/site/FinalCTA";
import { OFFER_GRID, OfferCard } from "@/components/site/OfferCard";
import { TestBanner } from "@/components/site/TestBanner";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";
import hamzaPhoto from "@/assets/team/hamza-ben-kheder.jpg";
import inesPhoto from "@/assets/team/ines-ben-amor.jpg";
import { FULL_AUDIT_PRICE_LABEL, OFFERS, getOffer, weeksLabel } from "@/lib/offers";
import { ExtraOffersStrip } from "@/components/site/ExtraOffers";

const analyses = getOffer("analyses");
const these = getOffer("these");

/* ------------------------------------------------------------------ Hero */

export function Hero() {
  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-14">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Thèses · mémoires · articles en médecine
          </p>
          <h1 className="mt-5 font-display text-[52px] leading-[0.95] text-balance sm:text-7xl lg:text-[84px]">
            Votre thèse de médecine,{" "}
            <span className="italic">
              des statistiques à la <span className="mark">soutenance.</span>
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Envoyez votre base de données. Nous réalisons les analyses, rédigeons avec vous les
            résultats et la discussion, puis un médecin et un biostatisticien relisent tout.{" "}
            <span className="text-foreground">
              Vous restez l'auteur, et vous comprenez chaque chiffre.
            </span>
          </p>
          <p className="mt-6 origin-left -rotate-1 font-hand text-2xl sm:text-[26px] leading-snug text-brand">
            thèse complète : {weeksLabel(these.delayWeeks)}, {these.priceLabel}
            <br />
            analyses + résultats : {weeksLabel(analyses.delayWeeks)}, {analyses.priceLabel}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link to={siteConfig.cta.audit.to}>
                {siteConfig.cta.audit.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="link" className="px-2 text-foreground">
              <Link to="/tarifs">Voir les formules et tarifs</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Test gratuit et sans inscription · Prix fixé avant de commencer
          </p>
        </div>

        <div className="mx-auto w-full max-w-[440px] lg:mr-1.5 lg:max-w-none">
          <ExplainerVideo />
          <FilmButton />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- Constat / réponse */

export function ProblemApproach() {
  const problems = [
    "Une base saisie, mais difficile à exploiter seul.",
    "Des heures sur SPSS, sans être sûr du bon test.",
    "Une discussion qui n'avance pas, faute de temps pour lire la littérature.",
    "La peur des questions du jury sur la méthode.",
  ];
  const answers = [
    "Le bon test pour votre question, choisi et vérifié par un biostatisticien.",
    "Des résultats et une discussion rédigés au format IMRAD, avec vous.",
    "Des tableaux et des figures prêts à insérer dans votre manuscrit.",
    "Une restitution expliquée : vous comprenez chaque chiffre avant la soutenance.",
  ];

  return (
    <Section>
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Le constat
          </p>
          <h2 className="mt-3 font-display text-4xl text-balance sm:text-5xl">
            Votre base est prête. Vos résultats, pas encore.
          </h2>
          <ul className="mt-8 border-t border-foreground">
            {problems.map((t) => (
              <li key={t} className="flex gap-4 border-b border-border py-4 text-muted-foreground">
                <X className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Notre réponse
          </p>
          <h2 className="mt-3 font-display text-4xl text-balance sm:text-5xl">
            Des analyses justes, une rédaction claire,{" "}
            <span className="italic text-brand">une thèse que vous savez défendre.</span>
          </h2>
          <ul className="mt-8 border-t border-foreground">
            {answers.map((t) => (
              <li key={t} className="flex gap-4 border-b border-border py-4">
                <Check className="mt-1 h-4 w-4 shrink-0 text-brand" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------ Audit gratuit */

export function AuditTeaser() {
  const steps = [
    {
      title: "Déposez votre fichier",
      text: "SPSS, Excel ou CSV. Votre fichier d'origine n'est jamais modifié.",
    },
    {
      title: "Lisez le détail de chaque contrôle",
      text: "Le journal de la vérification s'affiche à la fin, en quelques minutes.",
    },
    {
      title: "Recevez votre score sur 100",
      text: "Manquants, doublons, codes « 999 » non déclarés : tout est chiffré.",
    },
    {
      title: "Sachez ce qui bloque",
      text: "Les points à régler en priorité, avant de lancer vos statistiques.",
    },
  ];

  return (
    <section className="bg-ink text-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/60">
          Test gratuit · sans inscription
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl text-balance sm:text-6xl">
          Votre base est-elle exploitable ?{" "}
          <span className="italic text-brand-on-ink">Réponse en quelques minutes.</span>
        </h2>
        <ol className="mt-12 grid gap-8 border-t border-background/20 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span aria-hidden className="font-hand text-4xl leading-none text-brand-on-ink">
                {i + 1}.
              </span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-background/75">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-3xl text-[15px] leading-relaxed text-background/75">
          Besoin d'aller plus loin ? L'audit complet ({FULL_AUDIT_PRICE_LABEL}) vous dit si votre
          base est exploitable et vous remet vos missions aux archives, les questions pour votre
          directeur et un classeur Excel prêt à imprimer.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className="bg-background text-foreground hover:bg-background/90"
          >
            <Link to={siteConfig.cta.audit.to}>
              {siteConfig.cta.audit.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <p className="inline-flex items-start gap-2 text-sm text-background/70">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Aucune IA pendant le test : chaque chiffre est calculé par notre code, sur vos données.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- IA + humain */

export function AiHuman() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            IA + humain
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.1] text-balance sm:text-5xl">
            L'IA nous fait gagner du temps.{" "}
            <span className="mark">Un médecin et un biostatisticien</span> relisent tout.
          </h2>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
            Elle accélère les tâches répétitives. Les choix statistiques, la lecture clinique et la
            validation finale restent entre des mains humaines.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
          <div className="border-t border-foreground pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Ce que fait l'IA
            </h3>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li>
                Lit au plus 50 lignes de votre base, colonnes nominatives masquées, jamais le
                fichier entier.
              </li>
              <li>
                Propose un verdict et un plan de correction à partir des contrôles de notre code.
              </li>
              <li>Nous aide à mettre en forme les tableaux et le rapport d'audit.</li>
            </ul>
          </div>
          <div className="border-t border-brand pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">
              Ce que valident les experts
            </h3>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li>Un médecin vérifie la pertinence clinique.</li>
              <li>Un biostatisticien valide chaque analyse.</li>
              <li>Aucune formule n'est livrée sans relecture humaine.</li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ Équipe */

const TEAM_ROLES = [
  {
    title: "Des médecins",
    text: "Ils vérifient la cohérence clinique de vos résultats et vous préparent aux questions du jury.",
  },
  {
    title: "Des biostatisticiens",
    text: "Ils choisissent les tests adaptés à votre étude, vérifient leurs conditions d'application et valident chaque analyse.",
  },
  {
    title: "Une équipe data",
    text: "Elle a conçu les contrôles automatiques qui repèrent les erreurs de votre base avant toute analyse.",
  },
];

const FOUNDERS = [
  {
    name: "Dr Hamza Ben Kheder",
    role: "Médecin anesthésiste-réanimateur, passionné de tech",
    photo: hamzaPhoto,
  },
  {
    name: "Inès Ben Amor",
    role: "Ingénieure IA, ex\u2011Lead Data Scientist dans la Silicon Valley",
    photo: inesPhoto,
  },
];

/** `founders` : bandeau « Fondé par » (masqué sur la page À propos, qui les présente en détail). */
export function Team({ founders = true }: { founders?: boolean }) {
  return (
    <Section className="border-t border-border">
      <SectionHeader
        eyebrow="Qui sommes-nous"
        title={
          <>
            Une équipe de médecins et de biostatisticiens,{" "}
            <span className="italic text-brand">derrière chaque thèse.</span>
          </>
        }
        description="Votre travail passe entre plusieurs mains avant de vous être rendu : la méthode d'un côté, la lecture clinique de l'autre."
      />

      <ol className="mt-10 grid gap-8 md:grid-cols-3">
        {TEAM_ROLES.map((r, i) => (
          <li key={r.title} className="border-t border-foreground pt-5">
            <span aria-hidden className="font-hand text-3xl leading-none text-brand">
              {i + 1}.
            </span>
            <h3 className="mt-2 font-display text-3xl">{r.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{r.text}</p>
          </li>
        ))}
      </ol>

      {founders && (
        <div className="mt-12 flex flex-col gap-6 rounded-md border border-border bg-surface p-6 sm:p-7 lg:flex-row lg:items-center lg:gap-10">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Fondé par
          </p>
          <ul className="grid flex-1 gap-6 sm:grid-cols-2">
            {FOUNDERS.map((f) => (
              <li key={f.name} className="flex items-center gap-4">
                <img
                  src={f.photo}
                  alt={`Portrait de ${f.name}`}
                  width={64}
                  height={64}
                  loading="lazy"
                  className="size-16 shrink-0 rounded-md border border-foreground object-cover"
                />
                <div className="min-w-0">
                  <p className="font-display text-2xl leading-tight">{f.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{f.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

/* ------------------------------------------------------ Intégrité académique */

export function Authorship() {
  const points = [
    {
      title: "Vous gardez la main",
      text: "Votre question de recherche, vos hypothèses, vos choix : tout est discuté avec vous avant le moindre calcul.",
    },
    {
      title: "Vous comprenez tout",
      text: "Nous vous présentons chaque résultat, répondons à vos questions et vous expliquons chaque choix de méthode.",
    },
    {
      title: "Vous restez l'auteur",
      text: "Vous signez et vous soutenez ; la thèse est la vôtre. Notre travail : la rendre solide, et vous rendre capable de la défendre.",
    },
  ];
  return (
    <Section className="border-t border-border bg-surface">
      <SectionHeader
        eyebrow="Votre thèse, votre nom"
        title={
          <>
            Un accompagnement, <span className="italic text-brand">pas un prête-plume.</span>
          </>
        }
        description="Votre thèse engage votre nom et celui de votre directeur. Notre rôle : vous donner des analyses justes et une rédaction solide, que vous savez expliquer."
      />
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {points.map((p, i) => (
          <div key={p.title} className="border-t border-foreground pt-5">
            <span aria-hidden className="font-hand text-3xl leading-none text-brand">
              {i + 1}.
            </span>
            <h3 className="mt-2 font-display text-3xl">{p.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- Formules */

export function ServicesTeaser() {
  return (
    <Section className="border-y border-border bg-surface">
      <SectionHeader
        eyebrow="Formules"
        title="Choisissez l'aide dont vous avez besoin."
        description="Commencez par tester votre base gratuitement. Ensuite, ne prenez que ce qui vous manque."
      />

      <TestBanner headingLevel="h3" className="mt-10" />

      <div className={`mt-8 ${OFFER_GRID}`}>
        {OFFERS.map((o) => (
          <OfferCard
            key={o.id}
            number={o.number}
            title={o.shortTitle}
            tagline={o.tagline}
            price={o.priceLabel}
            delay={o.delay}
            features={o.features}
            ctaLabel={o.ctaLabel}
            ctaHref="/contact"
            offerId={o.id}
            highlight={o.highlight}
            badge={o.badge}
          />
        ))}
      </div>

      <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[15px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand" aria-hidden />
          Prix fixé avant de commencer
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand" aria-hidden />
          Relu par un médecin et un biostatisticien
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand" aria-hidden />
          Devis sur mesure pour articles et mémoires
        </li>
      </ul>

      <ExtraOffersStrip className="mt-8" />
    </Section>
  );
}

/* ------------------------------------------------------------- Témoignages */

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  city: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "L'audit a tout de suite repéré les variables mal codées dans ma base. J'ai gagné trois semaines sur ma thèse.",
    name: "Yosra",
    role: "Interne en médecine interne",
    city: "Sousse",
  },
  {
    quote:
      "Analyses propres, tableaux directement utilisables et une discussion solide. Mon jury n'avait aucune question piège sur la méthode.",
    name: "Mohamed Aziz",
    role: "Résident en cardiologie",
    city: "Tunis",
  },
  {
    quote:
      "J'avais peur de la partie stats, ils m'ont accompagnée du plan d'analyse jusqu'à la soutenance. Délais tenus à la lettre.",
    name: "Ines",
    role: "Étudiante en 6e année de médecine",
    city: "Monastir",
  },
  {
    quote:
      "Très bonne réactivité et un vrai dialogue scientifique, pas juste un prestataire. Recommandé pour une thèse originale et pertinente.",
    name: "Khalil",
    role: "Médecin hospitalier",
    city: "Sfax",
  },
  {
    quote:
      "La rédaction IMRAD est claire et bien référencée. C'est exactement ce qu'attendait ma faculté.",
    name: "Rania",
    role: "Thésarde en pédiatrie",
    city: "Bizerte",
  },
];

function TestimonialCard({ t, className }: { t: Testimonial; className?: string }) {
  return (
    <figure
      className={"flex flex-col rounded-md border border-border bg-card p-5 " + (className ?? "")}
    >
      <span aria-hidden className="font-display text-5xl leading-none text-brand">
        “
      </span>
      <blockquote className="mb-5 mt-1 text-[15px] leading-relaxed">{t.quote}</blockquote>
      <figcaption className="mt-auto border-t border-border pt-3">
        <p className="font-display text-xl leading-none">{t.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.role} · {t.city}
        </p>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Témoignages"
        title="Ils nous ont confié leur thèse."
        description="Quelques retours d'étudiants et de médecins accompagnés en Tunisie."
      />
      <div className="mt-10 sm:hidden">
        <TestimonialsMobileCarousel items={TESTIMONIALS} />
      </div>
      {/* Grille : toutes les cartes d'une même rangée ont la même hauteur. */}
      <div className="mt-10 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <TestimonialCard key={t.name + t.city} t={t} className="h-full" />
        ))}
      </div>
    </Section>
  );
}

function TestimonialsMobileCarousel({ items }: { items: Testimonial[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const slideWidth = el.scrollWidth / items.length;
        const idx = Math.round(el.scrollLeft / slideWidth);
        setActive(Math.max(0, Math.min(items.length - 1, idx)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items.length]);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slideWidth = el.scrollWidth / items.length;
    el.scrollTo({ left: slideWidth * i, behavior: "smooth" });
  };

  return (
    <div className="-mx-4">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((t) => (
          <TestimonialCard key={t.name + t.city} t={t} className="w-[84%] shrink-0 snap-center" />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between px-4">
        <button
          type="button"
          aria-label="Témoignage précédent"
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active === 0}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-foreground bg-card text-foreground disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {active + 1} / {items.length}
        </p>
        <button
          type="button"
          aria-label="Témoignage suivant"
          onClick={() => goTo(Math.min(items.length - 1, active + 1))}
          disabled={active === items.length - 1}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-foreground bg-card text-foreground disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Pour qui */

export function ForWho() {
  const audiences = [
    {
      title: "Étudiants et internes",
      text: "Soutenir une thèse solide, dans les temps, sans devenir biostatisticien.",
    },
    {
      title: "Résidents et médecins",
      text: "Un article, un poster ou un mémoire solide sur le plan statistique.",
    },
    {
      title: "Équipes hospitalières",
      text: "Vérifier une cohorte ou un registre avant de l'exploiter.",
    },
  ];
  return (
    <Section>
      <SectionHeader
        eyebrow="Pour qui"
        title="Pour ceux qui travaillent sur de vraies données patients."
      />
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {audiences.map((a, i) => (
          <div key={a.title} className="border-t border-foreground pt-5">
            <span aria-hidden className="font-hand text-3xl leading-none text-brand">
              {i + 1}.
            </span>
            <h3 className="mt-2 font-display text-3xl">{a.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{a.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 flex items-start gap-2 text-[15px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
        Vos données restent confidentielles : identifiants masqués, fichiers supprimés au bout de 30
        jours, jamais réutilisés.
      </p>
    </Section>
  );
}

/* ---------------------------------------------------------------- Final CTA */

export function FinalCta() {
  return (
    <FinalCTA
      title={
        <>
          Testez votre base ce soir.{" "}
          <span className="italic text-brand-on-ink">Avancez sereinement demain.</span>
        </>
      }
      description="En quelques minutes, vous saurez si votre base est exploitable et ce qu'il reste à corriger. Gratuit, sans inscription."
      primary={{ to: siteConfig.cta.audit.to, label: siteConfig.cta.audit.label }}
      secondary={{ to: "/contact", label: "Parler à un expert" }}
    />
  );
}
