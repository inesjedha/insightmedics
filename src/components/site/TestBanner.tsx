import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FULL_AUDIT_PRICE_LABEL } from "@/lib/offers";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Point d'entrée commun à l'accueil, aux services et aux tarifs : le test gratuit de la
 * base, puis l'audit complet payant pour qui veut aller plus loin. Mêmes noms partout :
 * « test gratuit » (aperçu, sans IA) et « audit complet » (rapport et livrables).
 */
export function TestBanner({
  headingLevel = "h2",
  className,
}: {
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <div
      className={cn(
        "grid gap-8 rounded-md border border-foreground bg-card p-6 sm:p-8 lg:grid-cols-[1.15fr_1fr_auto] lg:items-center lg:gap-10",
        className,
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Pour commencer
        </p>
        <Heading className="mt-2 font-display text-4xl leading-tight">
          Test de votre base : <span className="mark">gratuit</span>
        </Heading>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          En quelques minutes, un score sur 100 et ce qui bloque : données manquantes, doublons,
          codes « 999 » non déclarés. Sans inscription. Aucune IA pendant le test : tout est calculé
          par notre code, sur vos données.
        </p>
      </div>

      <div className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Pour aller plus loin
        </p>
        <p className="mt-2 font-display text-3xl leading-tight">
          Audit complet : {FULL_AUDIT_PRICE_LABEL}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Verdict d'exploitabilité, plan de correction, rapport Word, classeur Excel et base
          nettoyée. Réglé après un appel avec nous, avant le lancement.
        </p>
      </div>

      <Button asChild size="lg" className="w-full lg:w-auto">
        <Link to={siteConfig.cta.audit.to}>
          {siteConfig.cta.audit.label}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
