import { Link } from "@tanstack/react-router";
import { GuideLink } from "@/components/guides/GuideLink";
import { H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "etapes-these-medecine-tunisie",
  category: "preparer",
  title: "Les étapes de la thèse de médecine en Tunisie, du sujet à la soutenance",
  seoTitle: "Les étapes de la thèse de médecine en Tunisie",
  description:
    "Sujet, protocole, éthique, échantillon, base de données, statistiques, rédaction, mise en forme, dépôt, soutenance : la thèse de médecine étape par étape.",
  keyword: "étapes thèse de médecine Tunisie",
  datePublished: "2026-10-30",
  readingMinutes: 9,
  shortAnswer:
    "Une thèse de médecine en Tunisie suit dix étapes : choix du sujet et du directeur, protocole et fiche de recueil, éthique et autorisations, taille d'échantillon, recueil et base de données, analyse statistique, rédaction (Introduction, Matériel et méthodes, Résultats, Discussion, Conclusion), mise en forme selon la faculté, références, puis dépôt et soutenance. Les règles de forme, de dépôt et de jury diffèrent entre Sousse, Tunis, Monastir et Sfax : vérifiez-les auprès du service des thèses de votre faculté.",
  toc: [
    ["vue", "Vue d'ensemble des étapes"],
    ["sujet", "Choisir le sujet et le directeur"],
    ["protocole", "Protocole, fiche de recueil et éthique"],
    ["donnees", "Échantillon, recueil et base de données"],
    ["analyse", "L'analyse statistique"],
    ["redaction", "La rédaction, chapitre par chapitre"],
    ["forme", "Mise en forme et références"],
    ["depot", "Dépôt, plagiat et soutenance"],
    ["erreurs", "Les erreurs de planification"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="vue">Vue d'ensemble des étapes</H2>
      <P>
        La thèse de doctorat en médecine se construit dans un ordre précis : chaque étape produit un
        document dont dépend la suivante. Le tableau ci-dessous résume ce qu'il faut produire à
        chaque étape. Les durées sont des <strong>conseils de planification</strong>, pour un
        travail mené en parallèle du stage : ce ne sont pas des règles de faculté, et elles varient
        beaucoup selon le sujet.
      </P>
      <Table
        caption="Les étapes de la thèse et ce qu'il faut produire (durées indicatives)"
        head={["Étape", "Ce qu'il faut produire", "Durée indicative"]}
        rows={[
          [
            "1. Sujet et directeur",
            "Titre provisoire, question de recherche, accord du directeur",
            "2 à 4 semaines",
          ],
          [
            "2. Protocole et fiche de recueil",
            "Objectifs, critères d'inclusion, critère de jugement principal, fiche de recueil",
            "3 à 6 semaines",
          ],
          [
            "3. Éthique et autorisations",
            "Autorisation de l'établissement, avis du comité d'éthique",
            "Variable : à lancer tôt",
          ],
          [
            "4. Taille d'échantillon",
            "Calcul a priori, ou justification d'un recrutement exhaustif",
            "Quelques jours",
          ],
          [
            "5. Recueil et base de données",
            "Base Excel ou SPSS propre, dictionnaire des variables",
            "2 à 6 mois",
          ],
          ["6. Analyse statistique", "Tableaux, figures, résultats des tests", "2 à 4 semaines"],
          [
            "7. Rédaction",
            "Introduction, Matériel et méthodes, Résultats, Discussion, Conclusion",
            "2 à 4 mois",
          ],
          ["8. Mise en forme", "Manuscrit conforme aux règles de la faculté", "1 à 3 semaines"],
          [
            "9. Références",
            "Bibliographie Vancouver vérifiée, appels dans le texte",
            "En continu, puis 1 semaine de contrôle",
          ],
          [
            "10. Dépôt et soutenance",
            "Exemplaires déposés, présentation, réponses aux questions du jury",
            "Délais fixés par la faculté",
          ],
        ]}
      />
      <P>
        Le plus sûr est de planifier à rebours : partez de la date de soutenance visée, retirez les
        délais de dépôt et d'évaluation donnés par votre faculté, et vous saurez quand l'analyse
        doit être terminée.
      </P>

      <H2 id="sujet">Choisir le sujet et le directeur</H2>
      <P>
        Un bon sujet de thèse répond à une question précise, sur des données accessibles, dans un
        délai réaliste. Une question floue (« la prise en charge de l'appendicite ») produit une
        thèse descriptive sans fil conducteur ; une question précise (« les facteurs associés aux
        complications après appendicectomie au cours de la période étudiée ») donne d'emblée
        l'objectif principal et le plan de l'analyse.
      </P>
      <P>
        Les règles officielles varient selon la faculté. À la Faculté de médecine de Sousse, le
        règlement intérieur (article 36) prévoit que le sujet est agréé par le doyen, que le
        directeur est choisi parmi les enseignants des facultés de médecine et que la soutenance
        intervient après au moins une année de stage du troisième cycle (TCEM). À Monastir, la
        couverture porte le titre intégral approuvé par le doyen. À Sfax, le titre de la thèse
        compte <strong>10 mots au plus</strong> (articles non comptés). Pour les démarches
        d'inscription du sujet (formulaires, calendrier), renseignez-vous auprès du service des
        thèses de votre faculté : elles ne sont pas les mêmes partout.
      </P>
      <List
        items={[
          "Vérifiez que les données existent : dossiers archivés, registre du service, nombre de patients sur la période.",
          "Demandez au directeur une thèse soutenue récemment dans le service : elle montre le niveau attendu.",
          "Écrivez l'objectif principal en une phrase avant de commencer le recueil.",
        ]}
      />

      <H2 id="protocole">Protocole, fiche de recueil et éthique</H2>
      <H3>Le protocole</H3>
      <P>
        Le protocole fixe ce qui ne changera plus : type d'étude, population, critères d'inclusion,
        de non-inclusion et d'exclusion, période, objectifs et critère de jugement principal.
        Définissez ce critère en quatre éléments : la variable, le moment de la mesure, la
        comparaison et la méthode de mesure. Exemple : « mortalité hospitalière à J30, comparée
        entre les patients opérés avant et après 24 heures, relevée dans le dossier ».
      </P>
      <H3>La fiche de recueil</H3>
      <P>
        La fiche de recueil traduit le protocole en variables. Chaque question correspond à une
        colonne de votre future base, avec ses modalités prévues à l'avance (oui/non, classes,
        unités). Une fiche bien construite évite des semaines de nettoyage. Pour une étude sur
        dossiers, notre guide{" "}
        <GuideLink slug="etude-retrospective-dossiers-base-donnees-these">
          étude rétrospective : des dossiers à la base de données
        </GuideLink>{" "}
        détaille la méthode.
      </P>
      <H3>L'éthique et les autorisations</H3>
      <P>
        Le Matériel et méthodes devra mentionner le respect de la Déclaration d'Helsinki,
        l'autorisation de l'établissement, l'avis du comité d'éthique (nom du comité, numéro et date
        de l'avis), l'information ou le consentement des patients et la protection de leur anonymat.
        La procédure (comité compétent, dossier à fournir, délai de réponse) est fixée par
        l'établissement et la faculté : renseignez-vous dès le protocole, car c'est souvent l'étape
        la plus longue à obtenir.
      </P>

      <H2 id="donnees">Échantillon, recueil et base de données</H2>
      <H3>La taille d'échantillon</H3>
      <P>
        Le calcul se fait <strong>avant</strong> le recueil, à partir de l'objectif principal. Pour
        une étude rétrospective exhaustive, on écrit simplement que tous les patients de la période
        ont été inclus ; inventer un calcul a posteriori est une faute. Certaines facultés fixent un
        minimum : à Tunis, la thèse porte sur au moins 25 cas, ou de 10 à 24 cas accompagnés d'une
        revue systématique. La méthode est expliquée dans notre guide{" "}
        <GuideLink slug="calculer-taille-echantillon-these-medecine">
          calculer la taille d'échantillon
        </GuideLink>
        .
      </P>
      <H3>Le recueil et la base</H3>
      <P>
        Une ligne par patient (ou par unité étudiée : œil, séjour, cycle), une colonne par variable,
        un codage constant, des dates au même format, aucune cellule fusionnée. Tenez un
        dictionnaire des variables à côté de la base. Notre guide{" "}
        <GuideLink slug="preparer-base-donnees-excel-spss-these">
          préparer sa base de données Excel ou SPSS
        </GuideLink>{" "}
        donne les règles de saisie. Avant l'analyse, contrôlez l'effectif, les doublons, les valeurs
        impossibles et les données manquantes ; vous pouvez{" "}
        <Link to="/audit">tester votre base gratuitement</Link>.
      </P>
      <Note>
        Si vos données sont sur des fiches papier, prévoyez le temps de saisie dans votre planning :
        c'est souvent l'étape la plus sous-estimée.
      </Note>

      <H2 id="analyse">L'analyse statistique</H2>
      <P>
        L'analyse découle du protocole : description de la population, objectif principal, objectifs
        secondaires, puis facteurs associés. Choisissez les tests avant de voir les résultats,
        jamais après. Quatre guides de la série couvrent les questions les plus fréquentes :
      </P>
      <List
        items={[
          <>
            <GuideLink slug="quel-test-statistique-choisir-these-medecine">
              Quel test statistique choisir
            </GuideLink>{" "}
            selon le type de variable et de groupes.
          </>,
          <>
            <GuideLink slug="regression-logistique-interpreter-odds-ratio-these">
              La régression logistique et l'odds ratio
            </GuideLink>{" "}
            pour les facteurs associés.
          </>,
          <>
            <GuideLink slug="courbe-roc-seuil-optimal-these">
              La courbe ROC et le seuil optimal
            </GuideLink>{" "}
            pour un test diagnostique ou un score.
          </>,
          <>
            <GuideLink slug="interpreter-valeur-p-intervalle-confiance-these">
              La valeur de p et l'intervalle de confiance
            </GuideLink>{" "}
            pour lire et écrire vos résultats sans contresens.
          </>,
        ]}
      />

      <H2 id="redaction">La rédaction, chapitre par chapitre</H2>
      <P>
        La plupart des thèses suivent le plan IMRaD : Introduction, Matériel et méthodes, Résultats
        et Discussion, puis la Conclusion. Rédigez dans l'ordre qui sécurise les chiffres : Matériel
        et méthodes et Résultats d'abord, Discussion ensuite, Introduction et Conclusion en dernier.
      </P>
      <Table
        caption="Ce que contient chaque chapitre"
        head={["Chapitre", "Contenu", "À éviter"]}
        rows={[
          [
            "Introduction",
            "Du problème général à la question posée, puis les objectifs",
            "Un cours théorique, des résultats de la thèse",
          ],
          [
            "Matériel et méthodes",
            "Type d'étude, population, variables, critères de jugement, analyse statistique, éthique",
            "Une méthode qui n'a pas été appliquée",
          ],
          [
            "Résultats",
            "Population, objectif principal, objectifs secondaires, au passé",
            "Commentaire, comparaison à la littérature",
          ],
          [
            "Discussion",
            "Comparaison chiffrée à la littérature, écarts expliqués, forces et limites",
            "Des résultats nouveaux, des rappels théoriques",
          ],
          [
            "Conclusion",
            "Réponse à la question, recommandations, perspectives",
            "Des références (la conclusion n'en cite pas)",
          ],
        ]}
      />
      <P>
        Les facultés précisent certains points. À Tunis, le chapitre s'intitule « Conclusions », au
        pluriel, avec un plan imposé : problématique, objectifs, méthodes, principaux résultats et
        leur discussion, recommandations et perspectives. À Sfax, la Conclusion reprend les
        objectifs, la méthodologie, les résultats importants, les perspectives et les conduites
        pratiques, en 4 à 6 pages au plus et sans référence. À Monastir, la conclusion est visée par
        le directeur.
      </P>
      <P>
        Deux guides vous aident pour les chapitres les plus techniques :{" "}
        <GuideLink slug="rediger-analyse-statistique-materiel-methodes-these">
          rédiger la partie « Analyse statistique » du Matériel et méthodes
        </GuideLink>{" "}
        et{" "}
        <GuideLink slug="presenter-resultats-these-tableaux-figures">
          présenter les résultats en tableaux et figures
        </GuideLink>
        .
      </P>

      <H2 id="forme">Mise en forme et références</H2>
      <P>
        Chaque faculté a ses règles de présentation : police, taille, marges, numérotation des
        titres, format des appels de références. Quelques exemples tirés des règles publiées : à
        Tunis, Tahoma 11, interligne 1,5, et des appels entre crochets placés avant la ponctuation ;
        à Monastir, taille 14, interligne 1,5 et 100 pages au plus ; à Sfax, Times New Roman 14, un
        corps de thèse de 50 à 100 pages et une numérotation des titres en chiffres arabes
        seulement. Le détail est dans notre guide pilier{" "}
        <GuideLink slug="mise-en-forme-these-medecine-tunisie">
          mise en forme de la thèse de médecine en Tunisie
        </GuideLink>{" "}
        et dans les guides par faculté :
      </P>
      <List
        items={[
          <GuideLink key="fms" slug="mise-en-forme-these-faculte-medecine-sousse">
            Faculté de médecine de Sousse
          </GuideLink>,
          <GuideLink key="fmt" slug="mise-en-forme-these-faculte-medecine-tunis">
            Faculté de médecine de Tunis
          </GuideLink>,
          <GuideLink key="fmm" slug="mise-en-forme-these-faculte-medecine-monastir">
            Faculté de médecine de Monastir
          </GuideLink>,
          <GuideLink key="fmsf" slug="mise-en-forme-these-faculte-medecine-sfax">
            Faculté de médecine de Sfax
          </GuideLink>,
        ]}
      />
      <P>
        Pour les références, le dénominateur commun est le style Vancouver, numéroté par ordre
        d'apparition dans le texte. Sfax demande en outre 40 à 100 références, sauf justification
        écrite signée du directeur, et proscrit les articles soumis, les résumés de congrès non
        publiés et les sites web non officiels. Gérez vos références dès le début avec un logiciel
        bibliographique (Zotero, par exemple) : renuméroter cent références à la main la veille du
        dépôt est une source d'erreurs.
      </P>

      <H2 id="depot">Dépôt, plagiat et soutenance</H2>
      <P>
        Le dépôt est l'étape où les règles diffèrent le plus d'une faculté à l'autre. Voici ce que
        prévoient les textes publiés que nous avons consultés :
      </P>
      <Table
        caption="Ce que prévoient les règles publiées, par faculté"
        head={["Faculté", "Ce qui est documenté"]}
        rows={[
          [
            "Sousse (FMS)",
            "Rédaction et soutenance conformes au guide méthodologique validé par le conseil scientifique (art. 37 du règlement intérieur) ; plagiat sanctionné par le refus ou le report de la soutenance (art. 38) ; plateforme des thèses de la faculté (thesefms.com)",
          ],
          [
            "Tunis (FMT)",
            "Copie zéro dans un ordre défini, avec abstract et résumé structurés de 350 mots ; contrôle anti-plagiat (Ouriginal) avec 20 % de similitudes au plus (30 % pour une revue systématique) ; rapporteur désigné, membre de droit du jury ; grille d'évaluation publiée, notée sur 100",
          ],
          [
            "Monastir (FMM)",
            "Pas de rapporteur : le jury évalue la copie zéro sous 15 jours ; dépôt à la bibliothèque 7 jours avant la soutenance (1 exemplaire papier et 2 CD) ; soutenances du 1er septembre au 30 juin ; 20 % de plagiat au plus",
          ],
          [
            "Sfax (FMSf)",
            "La commission des thèses contrôle la copie (15 jours) et cachette chaque exemplaire ; jury d'au moins 4 membres, dont au moins 2 extérieurs au service et 1 extérieur à la spécialité",
          ],
        ]}
      />
      <P>
        Ces règles peuvent évoluer. Pour tout ce qui n'y figure pas (formulaires, nombre
        d'exemplaires, délais entre dépôt et soutenance, composition exacte du dossier), la faculté
        fixe la démarche : vérifiez-la auprès du service des thèses avant d'arrêter votre date.
        Passez votre manuscrit au contrôle de similitudes avant le dépôt, pas après.
      </P>
      <P>
        La soutenance elle-même se prépare comme une présentation scientifique : temps fixé par le
        jury, une idée par diapositive, réponses prêtes sur la méthode et les limites. Tout est dans
        notre guide{" "}
        <GuideLink slug="presentation-soutenance-these-medecine">
          réussir sa présentation de soutenance
        </GuideLink>
        .
      </P>

      <H2 id="erreurs">Les erreurs de planification</H2>
      <List
        items={[
          "Commencer le recueil avant d'avoir écrit l'objectif principal et la fiche de recueil.",
          "Demander l'avis du comité d'éthique trop tard, alors que le recueil est déjà fait.",
          "Saisir les données sans codage fixé, puis passer des semaines à nettoyer la base.",
          "Choisir les tests après avoir vu les résultats.",
          "Rédiger la Discussion avant que les Résultats soient définitifs : chaque chiffre modifié doit alors être corrigé deux fois.",
          "Découvrir les règles de mise en forme de sa faculté au moment du dépôt.",
          "Fixer la date de soutenance sans connaître les délais de dépôt et d'évaluation de la copie.",
        ]}
      />
      <P>
        Une thèse se joue rarement sur la rédaction seule : elle se joue sur un protocole clair et
        une base propre. Investissez dans les premières étapes, les suivantes iront plus vite.
      </P>
    </>
  );
}
