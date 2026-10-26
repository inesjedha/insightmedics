import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { siteConfig } from "@/lib/site-config";
import { LegalBlock } from "@/components/site/LegalBlock";

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
          <LegalBlock title="Qui est responsable du traitement ?">
            <p>
              <strong>{siteConfig.name}</strong>, basé à {siteConfig.location}, est responsable du
              traitement des données collectées via ce site.
            </p>
            <p>
              Pour toute question relative à vos données :{" "}
              <a href={`mailto:${siteConfig.email}`} className="text-brand hover:underline">
                {siteConfig.email}
              </a>
              .
            </p>
          </LegalBlock>

          <LegalBlock title="Quelles données collectons-nous ?">
            <p>Selon le formulaire utilisé, nous pouvons collecter :</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Coordonnées</strong> : nom, prénom, adresse email, numéro de téléphone.
              </li>
              <li>
                <strong>Informations sur votre projet</strong> : sujet de l'étude, problématique,
                objectif, offre(s) qui vous intéresse(nt), délai souhaité, message libre.
              </li>
              <li>
                <strong>Base de données soumise à l'audit</strong> : fichier téléversé
                volontairement (SPSS, Excel ou CSV) contenant vos données d'étude.
              </li>
              <li>
                <strong>Données techniques</strong> : informations non-personnelles liées à la
                navigation (type de navigateur, date/heure de visite). Aucun outil de suivi tiers
                (Google Analytics, Facebook Pixel…) n'est déployé à ce jour.
              </li>
            </ul>
          </LegalBlock>

          <LegalBlock title="Pourquoi ces données ?">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Vous recontacter</strong> par téléphone ou email pour cadrer votre projet et
                vous proposer une offre adaptée.
              </li>
              <li>
                <strong>Réaliser le test gratuit</strong> de votre base de données et vous
                transmettre le rapport.
              </li>
              <li>
                <strong>Délivrer les prestations</strong> que vous nous confiez (analyses,
                rédaction, accompagnement).
              </li>
              <li>
                <strong>Respecter nos obligations légales</strong>
                (facturation, comptabilité).
              </li>
            </ul>
            <p>
              <strong>Base légale</strong> : votre consentement explicite, donné au moment de la
              soumission du formulaire, et l'exécution du contrat lorsque vous devenez client.
            </p>
          </LegalBlock>

          <LegalBlock title="Combien de temps gardons-nous vos données ?">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Données de contact (leads)</strong> : conservées 12 mois à compter du
                dernier échange. Si vous devenez client, elles sont conservées le temps légal de la
                relation contractuelle et de ses obligations comptables.
              </li>
              <li>
                {/* Délai = FILE_RETENTION_DAYS du backend (purge automatique). */}
                <strong>Fichiers d'audit téléversés</strong> : votre base et votre protocole sont
                supprimés automatiquement 30 jours après le test gratuit, ou 30 jours après la
                livraison de l'audit complet (votre lien privé expire à la même date). Nous ne
                conservons ensuite qu'un résumé sans aucune donnée de patient (nom du fichier, score
                et statistiques globales) pour le suivi de votre demande ; vos coordonnées suivent
                la règle des données de contact ci-dessus.
              </li>
              <li>
                <strong>Livrables de l'audit</strong> (rapport, classeur, base nettoyée) :
                téléchargeables via votre lien privé pendant 30 jours après la livraison, puis
                supprimés avec vos fichiers. Pensez à les enregistrer de votre côté.
              </li>
            </ul>
          </LegalBlock>

          <LegalBlock title="Qui a accès à vos données ?">
            <p>
              Vos données sont strictement réservées à l'équipe {siteConfig.name} (biostatisticien,
              médecin, coordination). Aucune donnée n'est revendue, échangée ou cédée à des tiers à
              des fins commerciales.
            </p>
            <p>
              Nos sous-traitants techniques : l'hébergeur du site (Railway, serveurs dans l'Union
              européenne) et, pour l'audit complet uniquement, le service d'intelligence
              artificielle Claude (Anthropic, société américaine). Claude ne reçoit jamais votre
              base complète : les noms et libellés de vos variables, un extrait d'au plus 50 lignes
              dont les colonnes nominatives (nom, téléphone, e-mail, adresse, CIN, date de
              naissance) sont masquées, des statistiques calculées par notre code et, si vous l'avez
              fourni, le texte de votre protocole.
            </p>
            <p>
              Les bases de données patients que vous nous confiez doivent être
              <strong> anonymisées</strong> par vos soins avant transmission (suppression des noms,
              prénoms, numéros de dossier, dates de naissance précises et tout identifiant direct).
            </p>
          </LegalBlock>

          <LegalBlock title="Vos droits">
            <p>Vous disposez à tout moment des droits suivants :</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Accès à vos données.</li>
              <li>Rectification de données inexactes.</li>
              <li>Suppression (« droit à l'oubli »).</li>
              <li>Opposition au traitement à des fins commerciales.</li>
              <li>Portabilité de vos données.</li>
            </ul>
            <p>
              Pour exercer ces droits, écrivez à{" "}
              <a href={`mailto:${siteConfig.email}`} className="text-brand hover:underline">
                {siteConfig.email}
              </a>
              . Nous répondons sous 30 jours maximum.
            </p>
          </LegalBlock>

          <LegalBlock title="Sécurité">
            <p>
              Les échanges avec ce site sont chiffrés en transit (HTTPS). L'accès aux données
              collectées est restreint aux membres autorisés de l'équipe. Nous travaillons
              activement au déploiement de mesures complémentaires (chiffrement applicatif au repos,
              purge automatisée des fichiers d'audit) lors de la mise en production du backend.
            </p>
          </LegalBlock>

          <LegalBlock title="Cookies">
            <p>
              Ce site n'utilise pas de cookies de suivi publicitaire ni d'outils d'analyse tiers à
              ce jour. Aucune bannière de consentement n'est nécessaire en l'état actuel du site.
            </p>
          </LegalBlock>

          <p className="text-xs italic text-muted-foreground">
            Dernière mise à jour : octobre 2026.
          </p>
        </article>
      </Section>
    </SiteLayout>
  );
}
