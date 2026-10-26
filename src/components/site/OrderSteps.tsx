import { Section, SectionHeader } from "@/components/site/Section";

const STEPS = [
  {
    title: "Testez votre base",
    text: "Gratuit, en quelques minutes, sans inscription.",
  },
  {
    title: "Décrivez votre projet",
    text: "Quelques lignes suffisent dans le formulaire de contact.",
  },
  {
    title: "On vous rappelle sous 48 h ouvrées",
    text: "Pour cadrer ensemble le travail, le délai et le prix.",
  },
  {
    title: "Vous réglez, on démarre",
    text: "Paiement au lancement, au prix convenu. Allers-retours de relecture inclus jusqu'à la livraison.",
  },
];

/** Déroulé d'une commande, du test gratuit au paiement (pages Services et Tarifs). */
export function OrderSteps() {
  return (
    <Section className="border-t border-border bg-surface">
      <SectionHeader eyebrow="Comment ça se passe" title="De votre premier clic à la livraison." />
      <ol className="mt-10 grid gap-8 border-t border-foreground pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span aria-hidden className="font-hand text-4xl leading-none text-brand">
              {i + 1}.
            </span>
            <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
