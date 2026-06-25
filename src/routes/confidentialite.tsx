import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Insight Medics" },
      {
        name: "description",
        content:
          "Comment Insight Medics collecte, utilise et protège vos données personnelles et les bases médicales que vous nous confiez.",
      },
      {
        property: "og:title",
        content: "Politique de confidentialité — Insight Medics",
      },
      {
        property: "og:description",
        content:
          "Données collectées, finalités, durée de conservation, droits — tout est expliqué.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Vos données"
        title={
          <>
            Politique de <span className="text-brand">confidentialité</span>.
          </>
        }
        description="Ce que nous collectons, pourquoi, combien de temps nous le gardons, et comment vous pouvez exercer vos droits."
      />

      <Section className="pt-4 sm:pt-6">
        <article className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-foreground/90">
          <LegalBlock title="Qui est responsable du traitement ?">
            <p>
              <strong>{siteConfig.name}</strong>, basé à {siteConfig.location},
              est responsable du traitement des données collectées via ce site.
            </p>
            <p>
              Pour toute question relative à vos données :{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-brand hover:underline"
              >
                {siteConfig.email}
              </a>
              .
            </p>
          </LegalBlock>

          <LegalBlock title="Quelles données collectons-nous ?">
            <p>Selon le formulaire utilisé, nous pouvons collecter :</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Coordonnées</strong> : nom, prénom, adresse email,
                numéro de téléphone.
              </li>
              <li>
                <strong>Informations sur votre projet</strong> : sujet de
                l'étude, problématique, objectif, offre(s) qui vous
                intéresse(nt), délai souhaité, message libre.
              </li>
              <li>
                <strong>Base de données soumise à l'audit</strong> : fichier
                téléversé volontairement (CSV, Excel, SPSS, Stata…) contenant
                vos données d'étude.
              </li>
              <li>
                <strong>Données techniques</strong> : informations
                non-personnelles liées à la navigation (type de navigateur,
                date/heure de visite). Aucun outil de suivi tiers (Google
                Analytics, Facebook Pixel…) n'est déployé à ce jour.
              </li>
            </ul>
          </LegalBlock>

          <LegalBlock title="Pourquoi ces données ?">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Vous recontacter</strong> par téléphone ou email pour
                cadrer votre projet et vous proposer une offre adaptée.
              </li>
              <li>
                <strong>Réaliser l'audit gratuit</strong> de votre base de
                données et vous transmettre le rapport.
              </li>
              <li>
                <strong>Délivrer les prestations</strong> que vous nous
                confiez (analyses, rédaction, accompagnement).
              </li>
              <li>
                <strong>Respecter nos obligations légales</strong>
                (facturation, comptabilité).
              </li>
            </ul>
            <p>
              <strong>Base légale</strong> : votre consentement explicite, donné
              au moment de la soumission du formulaire, et l'exécution du
              contrat lorsque vous devenez client.
            </p>
          </LegalBlock>

          <LegalBlock title="Combien de temps gardons-nous vos données ?">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Données de contact (leads)</strong> : conservées 12 mois
                à compter du dernier échange. Si vous devenez client, elles sont
                conservées le temps légal de la relation contractuelle et de
                ses obligations comptables.
              </li>
              <li>
                <strong>Fichiers d'audit téléversés</strong> : nous nous
                engageons à les supprimer dans des délais courts une fois
                l'audit traité. La purge automatisée et son délai exact
                dépendent du backend qui sera connecté à la mise en production
                — d'ici là, aucun fichier n'est stocké sur des serveurs tiers
                par cette interface de démonstration.
              </li>
              <li>
                <strong>Livrables clients</strong> : conservés jusqu'à 24 mois
                après la livraison, pour permettre les révisions et
                réutilisations à votre demande.
              </li>
            </ul>
          </LegalBlock>

          <LegalBlock title="Qui a accès à vos données ?">
            <p>
              Vos données sont strictement réservées à l'équipe{" "}
              {siteConfig.name} (biostatisticien, médecin, coordination).
              Aucune donnée n'est revendue, échangée ou cédée à des tiers à des
              fins commerciales.
            </p>
            <p>
              Les bases de données patients que vous nous confiez doivent être
              <strong> anonymisées</strong> par vos soins avant transmission
              (suppression des noms, prénoms, numéros de dossier, dates de
              naissance précises et tout identifiant direct).
            </p>
          </LegalBlock>

          <LegalBlock title="Vos droits">
            <p>Vous disposez à tout moment des droits suivants :</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Accès à vos données.</li>
              <li>Rectification de données inexactes.</li>
              <li>Suppression (« droit à l'oubli »).</li>
              <li>Opposition au traitement à des fins commerciales.</li>
              <li>Portabilité de vos données.</li>
            </ul>
            <p>
              Pour exercer ces droits, écrivez à{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-brand hover:underline"
              >
                {siteConfig.email}
              </a>
              . Nous répondons sous 30 jours maximum.
            </p>
          </LegalBlock>

          <LegalBlock title="Sécurité">
            <p>
              Les échanges avec ce site sont chiffrés en transit (HTTPS). L'accès
              aux données collectées est restreint aux membres autorisés de
              l'équipe. Nous travaillons activement au déploiement de mesures
              complémentaires (chiffrement applicatif au repos, purge
              automatisée des fichiers d'audit) lors de la mise en production
              du backend.
            </p>
          </LegalBlock>

          <LegalBlock title="Cookies">
            <p>
              Ce site n'utilise pas de cookies de suivi publicitaire ni
              d'outils d'analyse tiers à ce jour. Aucune bannière de
              consentement n'est nécessaire en l'état actuel du site.
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
