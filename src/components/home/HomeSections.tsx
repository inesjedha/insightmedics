import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronLeft, ChevronRight, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FinalCTA } from "@/components/site/FinalCTA";
import { OfferCard } from "@/components/site/OfferCard";
import { Section, SectionHeader } from "@/components/site/Section";
import { siteConfig } from "@/lib/site-config";
import { OFFERS } from "@/lib/offers";

/* ------------------------------------------------------------------ Hero */

export function Hero() {
  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Thèses · mémoires · articles en médecine
          </p>
          <h1 className="mt-5 font-display text-[52px] leading-[0.95] text-balance sm:text-7xl lg:text-[88px]">
            Votre thèse de médecine,{" "}
            <span className="mark italic">des statistiques à la soutenance.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Envoyez votre base de données. On la reprend ligne par ligne, comme votre directeur de
            thèse, on fait les analyses et on rédige vos résultats et votre discussion. Un médecin
            et un biostatisticien relisent tout.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <p className="mt-8 -rotate-1 origin-left font-hand text-[26px] leading-snug text-brand">
            thèse complète : 2 semaines, 1 200 DT
            <br />
            stats + résultats rédigés : 1 semaine, 500 DT
          </p>
        </div>

        <AuditSample />
      </div>
    </section>
  );
}

/** Extrait d'aperçu d'audit, données fictives : montre le produit plutôt que d'en parler. */
function AuditSample() {
  const rows = [
    { id: "P-014", age: "47", sexe: "F", saps: "38" },
    { id: "P-015", age: "212", sexe: "M", saps: "41", flag: "age" },
    { id: "P-016", age: "63", sexe: "M", saps: "—", flag: "dup" },
  ] as const;

  return (
    <figure className="mr-1.5 min-w-0 rounded-md border border-foreground bg-card p-5 shadow-offset sm:mr-0 sm:p-7">
      <figcaption className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Votre audit gratuit · exemple fictif
      </figcaption>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[300px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b-2 border-foreground text-left">
              <th scope="col" className="py-2 pr-3 font-semibold">
                id
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                âge
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                sexe
              </th>
              <th scope="col" className="py-2 pl-3 font-semibold">
                SAPS II
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="py-2.5 pr-3">
                  <span
                    className={
                      "flag" in r && r.flag === "dup"
                        ? "line-through decoration-brand decoration-2"
                        : undefined
                    }
                  >
                    {r.id}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={"flag" in r && r.flag === "age" ? "circled" : undefined}>
                    {r.age}
                  </span>
                </td>
                <td className="px-3 py-2.5">{r.sexe}</td>
                <td className="py-2.5 pl-3">{r.saps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-hand text-2xl leading-tight text-brand">
        âge impossible · P-016 en double · SAPS II manquant
      </p>
      <div className="mt-5 flex items-baseline justify-between border-t border-dashed border-muted-foreground/50 pt-4">
        <span className="text-[15px] text-muted-foreground">Score de la base</span>
        <span className="font-display text-6xl leading-none">
          64<span className="text-2xl text-muted-foreground">/100</span>
        </span>
      </div>
    </figure>
  );
}

/* -------------------------------------------------------- Constat / réponse */

export function ProblemApproach() {
  const problems = [
    "Une base de données saisie, mais difficile à exploiter seul.",
    "Des heures sur SPSS sans certitude sur la validité des résultats.",
    "Une discussion qui n'avance pas, faute de temps pour la littérature.",
    "Une méthodologie à défendre devant le jury, sans filet.",
  ];
  const answers = [
    "Analyses statistiques conçues et vérifiées par un biostatisticien.",
    "Rédaction scientifique au standard IMRAD.",
    "Tableaux et figures prêts pour publication.",
    "Un interlocuteur unique, du début à la soutenance.",
  ];

  return (
    <Section>
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Le constat
          </p>
          <h2 className="mt-3 font-display text-4xl text-balance sm:text-5xl">
            Une base prête, des résultats incertains, une deadline qui approche.
          </h2>
          <ul className="mt-8 border-t border-foreground">
            {problems.map((t) => (
              <li key={t} className="flex gap-4 border-b border-border py-4 text-muted-foreground">
                <X className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
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
            Des analyses cadrées. Une rédaction structurée.{" "}
            <span className="italic text-brand">Une thèse défendable.</span>
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

/* ------------------------------------------------------------ Audit offert */

export function AuditTeaser() {
  const steps = [
    {
      title: "Déposez votre fichier",
      text: "SPSS, Excel ou CSV. Votre original n'est jamais modifié.",
    },
    { title: "Suivez l'analyse en direct", text: "Chaque contrôle s'affiche sous vos yeux." },
    {
      title: "Recevez un score sur 100",
      text: "Données manquantes, doublons, valeurs impossibles.",
    },
    {
      title: "Sachez quoi corriger",
      text: "Une liste par ordre de priorité, avant vos statistiques.",
    },
  ];

  return (
    <section className="bg-ink text-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/60">
          Gratuit · sans engagement
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl text-balance sm:text-6xl">
          Votre base est-elle exploitable ?{" "}
          <span className="italic text-[#A9B8FF]">Réponse en quelques minutes.</span>
        </h2>
        <ol className="mt-12 grid gap-8 border-t border-background/20 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span aria-hidden className="font-hand text-4xl leading-none text-[#A9B8FF]">
                {i + 1}.
              </span>
              <h3 className="mt-3 font-sans text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-background/75">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
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
            Chaque chiffre est calculé directement sur vos données, rien n'est estimé.
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
          <p className="mt-4 font-display text-4xl leading-[1.1] text-balance sm:text-5xl">
            L'IA fait le tri. <span className="mark">Un humain relit tout,</span> avant que vous ne
            voyiez quoi que ce soit.
          </p>
          <p className="mt-6 -rotate-1 origin-left font-hand text-[26px] text-brand">
            relu par un médecin et un biostatisticien, à chaque fois
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
          <div className="border-t border-foreground pt-5">
            <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Ce que l'IA prend en charge
            </h3>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li>Profilage et tri automatique de la base.</li>
              <li>Détection des anomalies, valeurs aberrantes et manquantes.</li>
              <li>Premières analyses descriptives.</li>
            </ul>
          </div>
          <div className="border-t border-brand pt-5">
            <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-brand">
              Ce qu'un expert valide
            </h3>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li>Un médecin vérifie la pertinence clinique.</li>
              <li>Un biostatisticien valide chaque analyse.</li>
              <li>Aucun livrable envoyé sans relecture humaine.</li>
            </ul>
          </div>
        </div>
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
        title="Choisissez la formule qui correspond à votre étape."
        description="Commencez par l'audit gratuit de votre base. Ajoutez ensuite ce dont vous avez besoin : analyses, discussion, ou thèse complète."
      />

      <div className="mt-10 flex flex-col gap-5 rounded-md border border-foreground bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="font-display text-3xl">
            Audit de votre base : <span className="mark">0 DT</span>
          </p>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Contrôle qualité complet, score sur 100, sans engagement.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to={siteConfig.cta.audit.to}>
            {siteConfig.cta.audit.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {OFFERS.map((o) => (
          <OfferCard
            key={o.id}
            number={String(Number(o.number))}
            title={o.shortTitle}
            price={o.priceLabel}
            delay={o.delay}
            features={o.features}
            ctaLabel="Choisir cette formule"
            ctaHref="/contact"
            highlight={o.highlight}
            badge={o.badge}
          />
        ))}
      </div>

      <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[15px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand" aria-hidden />
          Paiement à la livraison
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand" aria-hidden />
          Relu par un médecin et un biostatisticien
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand" aria-hidden />
          Devis personnalisé pour articles et mémoires
        </li>
      </ul>
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
      className={
        "flex h-full flex-col rounded-md border border-border bg-card p-5 " + (className ?? "")
      }
    >
      <span aria-hidden className="font-display text-5xl leading-none text-brand">
        “
      </span>
      <blockquote className="mt-1 flex-1 text-[15px] leading-relaxed">{t.quote}</blockquote>
      <figcaption className="mt-5 border-t border-border pt-3">
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
      <div className="mt-10 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <TestimonialCard key={t.name + t.city} t={t} />
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
      title: "Étudiants en médecine",
      text: "Livrer une thèse solide, dans les temps, sans devenir biostatisticien.",
    },
    {
      title: "Médecins résidents",
      text: "Un article, un poster ou un mémoire qui tient sur le plan statistique.",
    },
    {
      title: "Équipes hospitalières",
      text: "Auditer une cohorte ou un registre avant de le valoriser.",
    },
  ];
  return (
    <Section className="border-t border-border bg-surface">
      <SectionHeader
        eyebrow="Pour qui"
        title="Pensé pour ceux qui travaillent sur de vraies données patients."
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
      <p className="mt-10 flex items-center gap-2 text-[15px] text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand" aria-hidden />
        Vos données restent confidentielles et ne sont jamais réutilisées.
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
          Testez votre base aujourd'hui.{" "}
          <span className="italic text-[#A9B8FF]">Avancez sereinement.</span>
        </>
      }
      description="En quelques minutes, vous saurez si votre base est exploitable et ce qu'il reste à corriger. En cas d'alerte critique, un expert vous recontacte sous 48 h ouvrées."
      primary={{ to: siteConfig.cta.audit.to, label: siteConfig.cta.audit.label }}
      secondary={{ to: "/contact", label: "Nous contacter" }}
    />
  );
}
