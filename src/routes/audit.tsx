import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit IA — Insight Medics" },
      {
        name: "description",
        content:
          "Lancez un audit IA gratuit de votre base de données médicale. Anonymisation automatique, rapport PDF, score de qualité /100.",
      },
      { property: "og:title", content: "Audit IA — Insight Medics" },
      {
        property: "og:description",
        content: "Audit gratuit de votre base médicale, rapport PDF brandé en quelques minutes.",
      },
    ],
  }),
  component: AuditPlaceholder,
});

function AuditPlaceholder() {
  return (
    <SiteLayout>
      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="border-brand/30 bg-brand/5 text-brand">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Bientôt disponible
          </Badge>
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl text-balance">
            Le module Audit arrive très bientôt.
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg text-balance">
            Nous mettons la dernière main au pipeline d'anonymisation,
            d'exécution Python sandboxée et de génération du rapport PDF. En
            attendant, vous pouvez nous contacter pour discuter de votre projet.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/contact">Discuter de mon projet</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
