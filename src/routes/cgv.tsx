import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/cgv")({
  head: () => ({
    meta: [
      { title: "CGV — Insight Medics" },
      {
        name: "description",
        content:
          "Conditions générales de vente d'Insight Medics : offres, tarifs en DT, modalités de paiement à la livraison, révisions, propriété des livrables.",
      },
      { property: "og:title", content: "CGV — Insight Medics" },
      {
        property: "og:description",
        content:
          "Tarifs en dinars tunisiens, paiement à la livraison, délais et révisions.",
      },
    ],
  }),
  component: CgvPage,
});

function CgvPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Conditions de vente"
        title={
          <>
            Conditions <span className="text-brand">générales de vente</span>.
          </>
        }
        description="Les règles qui encadrent nos prestations : offres, tarifs, paiement, délais, révisions et propriété des livrables."
      />

      <Section className="pt-4 sm:pt-6">
        <article className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-foreground/90">
          <LegalBlock title="1. Objet">
            <p>
              Les présentes conditions encadrent les prestations
              d'accompagnement scientifique délivrées par {siteConfig.name} :
              audit de bases de données médicales, analyses statistiques,
              rédaction des résultats, rédaction de la discussion, et
              accompagnement complet de thèse au standard IMRAD.
            </p>
          </LegalBlock>

          <LegalBlock title="2. Offres et tarifs">
            <p>Les tarifs sont exprimés en dinars tunisiens (DT) :</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Audit IA</strong> : gratuit, sans engagement.
              </li>
              <li>
                <strong>Analyse + rédaction des résultats</strong> : 500 DT.
              </li>
              <li>
                <strong>Rédaction de la discussion</strong> : 500 DT.
              </li>
              <li>
                <strong>Accompagnement thèse complète</strong> : 1 200 DT.
              </li>
            </ul>
            <p>
              Les devis pour articles, mémoires ou périmètres spécifiques sont
              établis sur demande après échange avec le client.
            </p>
          </LegalBlock>

          <LegalBlock title="3. Commande et acceptation">
            <p>
              Toute commande est précédée d'un échange (téléphone ou email)
              permettant de cadrer le périmètre exact, le délai et le tarif. Le
              démarrage de la prestation vaut acceptation des présentes
              conditions.
            </p>
          </LegalBlock>

          <LegalBlock title="4. Délais de livraison">
            <p>Les délais standards à compter de la réception d'une base exploitable :</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Analyses + résultats</strong> : 1 semaine.
              </li>
              <li>
                <strong>Discussion</strong> : 1 semaine.
              </li>
              <li>
                <strong>Thèse complète</strong> : 2 semaines.
              </li>
            </ul>
            <p>
              Les délais peuvent être ajustés selon la qualité initiale de la
              base et le volume de retravaux nécessaires. Toute évolution est
              communiquée au client avant impact.
            </p>
          </LegalBlock>

          <LegalBlock title="5. Paiement à la livraison">
            <p>
              Aucun acompte n'est demandé pour les prestations facturées en
              dinars tunisiens. Le règlement intervient à la livraison du
              livrable validé, par virement bancaire ou tout moyen convenu d'un
              commun accord.
            </p>
          </LegalBlock>

          <LegalBlock title="6. Révisions et aller-retours">
            <p>
              Chaque offre inclut des aller-retours de relecture raisonnables,
              dans la limite du périmètre initialement défini. Les demandes
              dépassant ce cadre (changement de question de recherche, ajout de
              variables après livraison, refonte complète) font l'objet d'un
              devis complémentaire.
            </p>
          </LegalBlock>

          <LegalBlock title="7. Obligations du client">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                Fournir une base de données <strong>anonymisée</strong> (cf.{" "}
                <a
                  href="/confidentialite"
                  className="text-brand hover:underline"
                >
                  politique de confidentialité
                </a>
                ).
              </li>
              <li>
                Répondre dans des délais raisonnables aux sollicitations
                nécessaires à l'avancée du projet.
              </li>
              <li>
                Vérifier la pertinence scientifique et clinique des livrables
                avant soutenance ou publication. {siteConfig.name} apporte son
                expertise méthodologique mais la responsabilité scientifique
                finale incombe à l'auteur de la thèse ou de la publication.
              </li>
            </ul>
          </LegalBlock>

          <LegalBlock title="8. Propriété des livrables">
            <p>
              Après règlement, le client devient pleinement propriétaire des
              livrables (analyses, tableaux, figures, textes rédigés). Il peut
              les intégrer librement à sa thèse, son article ou tout autre
              support, sous sa seule signature.
            </p>
            <p>
              {siteConfig.name} se réserve le droit de mentionner anonymement
              les types de projets accompagnés à des fins de communication, sans
              jamais divulguer de données patients ni le nom du client sans son
              accord écrit.
            </p>
          </LegalBlock>

          <LegalBlock title="9. Confidentialité">
            <p>
              {siteConfig.name} s'engage à la stricte confidentialité de toutes
              les informations transmises dans le cadre de la prestation. Voir
              notre{" "}
              <a href="/confidentialite" className="text-brand hover:underline">
                politique de confidentialité
              </a>{" "}
              pour le détail des traitements et durées de conservation.
            </p>
          </LegalBlock>

          <LegalBlock title="10. Droit applicable et juridiction">
            <p>
              Les présentes conditions sont régies par le droit tunisien. Tout
              litige qui n'aurait pas trouvé de résolution amiable relèvera de
              la compétence exclusive des tribunaux de Sousse.
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
