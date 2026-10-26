import { Plus } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/Section";
import { FAQ } from "@/lib/faq";

/** Questions fréquentes en accordéon natif (<details>) : accessible, sans JavaScript. */
export function FaqSection({ className }: { className?: string }) {
  return (
    <Section className={className}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <SectionHeader
          eyebrow="Questions fréquentes"
          title="Vos questions, nos réponses."
          description="Ce que les étudiants nous demandent avant de nous confier leur thèse."
        />
        <div className="border-t border-foreground">
          {FAQ.map((item) => (
            <details key={item.question} className="group border-b border-border">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[17px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus
                  className="h-5 w-5 shrink-0 text-brand transition-transform group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="pb-5 pr-9 text-[15px] leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
