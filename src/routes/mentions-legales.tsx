import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Insight Medics" },
      {
        name: "description",
        content:
          "Mentions légales d'Insight Medics : éditeur, contact, hébergeur, propriété intellectuelle.",
      },
      { property: "og:title", content: "Mentions légales — Insight Medics" },
      {
        property: "og:description",
        content: "Informations légales sur l'éditeur d'Insight Medics.",
      },
    ],
  }),
  component: MentionsPage,
});

function MentionsPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Informations légales"
        title={<>Mentions <span className="text-brand">légales</span>.</>}
        description="Informations sur l'éditeur du site et les conditions d'utilisation."
      />

      <Section className="pt-4 sm:pt-6">
        <article className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-foreground/90">
          <LegalBlock title="Éditeur du site">
            <p>
              <strong>{siteConfig.name}</strong> — accompagnement à la rédaction
              de thèses et publications scientifiques en médecine.
            </p>
            <p>Basé à {siteConfig.location}.</p>
            <p>
              Contact :{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-brand hover:underline"
              >
                {siteConfig.email}
              </a>
            </p>
          </LegalBlock>

          <LegalBlock title="Directeur de la publication">
            <p>
              La direction de la publication est assurée par l'équipe{" "}
              {siteConfig.name}. Pour toute question éditoriale, contactez-nous
              par email.
            </p>
          </LegalBlock>

          <LegalBlock title="Hébergement">
            <p>
              Les coordonnées complètes de l'hébergeur seront précisées lors de
              la mise en production sur un domaine définitif.
            </p>
          </LegalBlock>

          <LegalBlock title="Propriété intellectuelle">
            <p>
              L'ensemble des contenus présents sur ce site (textes, visuels,
              méthode, marque) est la propriété d'{siteConfig.name} ou de ses
              partenaires. Toute reproduction, totale ou partielle, est
              interdite sans autorisation écrite préalable.
            </p>
            <p>
              Les livrables remis aux clients (analyses, rédactions, rapports)
              deviennent leur propriété pleine et entière après règlement, dans
              les conditions définies par nos{" "}
              <a href="/cgv" className="text-brand hover:underline">
                conditions générales de vente
              </a>
              .
            </p>
          </LegalBlock>

          <LegalBlock title="Limites de responsabilité">
            <p>
              {siteConfig.name} apporte le plus grand soin à la qualité des
              informations diffusées sur ce site, sans toutefois pouvoir
              garantir l'absence totale d'inexactitudes. L'utilisateur reste
              seul responsable de l'usage qu'il fait des informations
              consultées.
            </p>
            <p>
              Les contenus à visée médicale ou scientifique sont fournis à titre
              informatif et ne se substituent pas à un avis professionnel
              qualifié.
            </p>
          </LegalBlock>

          <LegalBlock title="Données personnelles">
            <p>
              Le traitement des données personnelles collectées via les
              formulaires de ce site est détaillé dans notre{" "}
              <a href="/confidentialite" className="text-brand hover:underline">
                politique de confidentialité
              </a>
              .
            </p>
          </LegalBlock>

          <LegalBlock title="Droit applicable">
            <p>
              Les présentes mentions sont régies par le droit tunisien. Tout
              litige relèvera de la compétence exclusive des tribunaux de
              Sousse, sauf disposition légale contraire.
            </p>
          </LegalBlock>

          <p className="text-xs italic text-muted-foreground">
            Dernière mise à jour : juin 2026 — version initiale, à faire valider
            par un juriste avant exploitation commerciale.
          </p>
        </article>
      </Section>
    </SiteLayout>
  );
}

function LegalBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}
