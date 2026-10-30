import { GuideLink } from "@/components/guides/GuideLink";
import { Figure, H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import { RetroFlow } from "@/components/guides/figures/FlowDiagram";
import { FormSketch } from "@/components/guides/figures/FormSketch";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "etude-retrospective-dossiers-base-donnees-these",
  category: "preparer",
  title: "Étude rétrospective sur dossiers : de la fiche papier à une base exploitable",
  seoTitle: "Étude rétrospective sur dossiers : réussir son recueil",
  description:
    "Critères d'inclusion, fiche de recueil, relevé reproductible, manquants, diagramme de flux et biais : préparer une thèse rétrospective sur dossiers.",
  keyword: "étude rétrospective sur dossiers thèse",
  datePublished: "2026-10-30",
  readingMinutes: 7,
  shortAnswer:
    "Une étude rétrospective sur dossiers se prépare avant d'ouvrir le premier dossier : population et critères d'inclusion écrits, fiche de recueil limitée aux variables utiles aux objectifs, réponses fermées et codées, mêmes définitions pour tous les dossiers. Testez la fiche sur une dizaine de dossiers, faites relire un échantillon par une seconde personne, laissez vide ce qui n'est pas retrouvé et notez chaque exclusion avec son motif pour le diagramme de flux.",
  toc: [
    ["population", "Définir la population avant d'ouvrir les dossiers"],
    ["fiche", "Construire la fiche de recueil"],
    ["releve", "Relever de façon reproductible"],
    ["manquantes", "Dossiers incomplets et données manquantes"],
    ["flux", "Le diagramme de flux"],
    ["confidentialite", "Confidentialité et éthique"],
    ["temps", "Le temps à prévoir"],
    ["biais", "Les biais à discuter"],
    ["erreurs", "Les erreurs fréquentes"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="population">Définir la population avant d'ouvrir les dossiers</H2>
      <P>
        Vous avez accès à des dizaines ou des centaines de dossiers papier, et l'envie de commencer
        tout de suite. Résistez : un relevé lancé sans cadre se termine souvent par une seconde
        lecture complète des dossiers. Écrivez d'abord, avec votre encadrant :
      </P>
      <List
        items={[
          <>
            <strong>La période d'étude</strong>, avec des dates exactes (du 1er janvier 2021 au 31
            décembre 2023, par exemple).
          </>,
          <>
            <strong>La source d'identification</strong> des patients : registre des admissions,
            cahier du bloc opératoire, liste du laboratoire, codage des diagnostics. Elle doit
            permettre un recrutement exhaustif ou consécutif sur la période.
          </>,
          <>
            <strong>Les critères d'inclusion</strong> : qui entre dans l'étude (adultes opérés d'une
            cholécystectomie pour lithiase, par exemple).
          </>,
          <>
            <strong>Les critères de non-inclusion</strong> : qui en est écarté d'emblée (patients
            opérés dans un autre centre et transférés, par exemple).
          </>,
          <>
            <strong>Les critères d'exclusion</strong> : qui, inclus au départ, sort de l'analyse
            (dossier introuvable, critère de jugement principal non renseigné).
          </>,
        ]}
      />
      <P>
        Fixés à l'avance, ces critères s'appliquent de la même façon à tous les dossiers. Fixés en
        cours de route, ils exposent au soupçon d'avoir écarté les patients « qui dérangent ».
        Pensez aussi à l'effectif : avec un recrutement exhaustif, l'effectif est imposé, et il faut
        savoir ce qu'il permet de montrer (voir{" "}
        <GuideLink slug="calculer-taille-echantillon-these-medecine">
          calculer la taille d'échantillon
        </GuideLink>
        ).
      </P>

      <P>
        Ces éléments forment le début de votre M&M. Une fois rédigés, ils tiennent en quelques
        lignes :
      </P>
      <Note>
        « Il s'agit d'une étude rétrospective, descriptive et analytique, monocentrique, menée au
        service de [chirurgie générale] de [l'hôpital], portant sur tous les patients opérés d'une
        cholécystectomie pour lithiase entre le 1er janvier 2021 et le 31 décembre 2023 (recrutement
        exhaustif). Les patients ont été identifiés à partir du registre du bloc opératoire. »
      </Note>

      <H2 id="fiche">Construire la fiche de recueil</H2>
      <H3>Seulement les variables utiles aux objectifs</H3>
      <P>
        Partez de vos objectifs, pas du dossier. Pour chaque variable, demandez-vous à quelle
        question elle répond : le critère de jugement principal, les critères secondaires, les
        facteurs étudiés, les caractéristiques qui décrivent la population. Une variable qui ne sert
        aucun objectif coûte du temps de relevé et ne sera pas analysée. Une fiche de deux ou trois
        pages suffit dans la plupart des thèses.
      </P>
      <Table
        caption="De l'objectif aux variables à relever (exemple fictif)"
        head={["Élément du protocole", "Variables de la fiche"]}
        rows={[
          [
            "Objectif principal : taux d'infection du site opératoire à J30",
            "Infection oui/non ; date de l'infection ; critère diagnostique retenu",
          ],
          [
            "Objectif secondaire : facteurs associés à l'infection",
            "Âge, sexe, diabète, IMC, score ASA, durée opératoire, antibioprophylaxie",
          ],
          [
            "Description de la population",
            "Indication opératoire, voie d'abord, caractère urgent ou programmé",
          ],
          ["Diagramme de flux", "Motif d'exclusion éventuel, pour chaque dossier écarté"],
        ]}
      />
      <H3>Des réponses fermées et codées</H3>
      <P>
        Chaque question doit avoir une réponse attendue, de préférence à cocher. Prévoyez
        systématiquement une case « non renseigné » : elle distingue « le dossier dit non » de « le
        dossier ne dit rien ».
      </P>
      <Table
        caption="Question ouverte et question fermée sur une fiche de recueil"
        head={["Question mal posée", "Question bien posée"]}
        rows={[
          [
            "Antécédents : ……………",
            "HTA : □ oui (1) □ non (0) □ non renseigné ; diabète : □ oui □ non □ non renseigné",
          ],
          ["Évolution : ……………", "Infection du site opératoire à J30 : □ oui □ non □ non renseigné"],
          ["Biologie : ……………", "Créatinine à l'admission : ……… µmol/L □ non faite"],
          ["Date d'entrée : ……………", "Date d'admission : __ __ / __ __ / __ __ __ __"],
        ]}
      />
      <P>
        Imprimez les codes sur la fiche elle-même (1 = oui, 0 = non) et précisez l'unité attendue à
        côté de chaque valeur. La saisie dans Excel ou SPSS en sera beaucoup plus rapide et plus
        fiable. Les règles de construction de la base sont détaillées dans notre guide pour{" "}
        <GuideLink slug="preparer-base-donnees-excel-spss-these">
          préparer sa base Excel ou SPSS
        </GuideLink>
        .
      </P>
      <Figure
        caption="Figure 1. Questions ouvertes ou questions fermées : la seconde fiche se saisit sans interprétation"
        source="Questions reprises du tableau ci-dessus. La case « non renseigné » distingue « le dossier dit non » de « le dossier ne dit rien »."
      >
        <FormSketch />
      </Figure>
      <H3>Fiche papier ou saisie directe ?</H3>
      <P>
        Saisir directement dans Excel pendant la lecture des dossiers évite une étape, mais demande
        un ordinateur aux archives et une base déjà structurée, avec des listes de choix pour
        limiter les fautes de frappe. La fiche papier est plus souple sur place et laisse une trace
        consultable pour toute vérification. Dans les deux cas, les questions, les codes et les
        définitions sont les mêmes.
      </P>
      <H3>Tester la fiche sur une dizaine de dossiers</H3>
      <P>
        Avant le relevé complet, remplissez la fiche sur une dizaine de dossiers. Vous verrez vite
        les questions auxquelles les dossiers ne répondent jamais, les cases qui manquent et les
        définitions ambiguës. Corrigez la fiche à ce moment-là, puis ne la modifiez plus. La version
        finale de la fiche figure en annexe de votre thèse et le M&M y renvoie.
      </P>

      <H2 id="releve">Relever de façon reproductible</H2>
      <P>
        Deux personnes qui lisent le même dossier doivent remplir la même fiche. Pour cela, chaque
        variable a une <strong>définition opérationnelle écrite</strong>, appliquée à tous :
      </P>
      <List
        items={[
          "HTA : antécédent mentionné dans le dossier ou traitement antihypertenseur à l'admission.",
          "Infection du site opératoire : diagnostic noté par le chirurgien ou prélèvement positif, dans les 30 jours suivant l'intervention.",
          "Valeur biologique à l'admission : premier résultat dans les 24 premières heures.",
        ]}
      />
      <P>
        Ces définitions figureront ensuite dans la partie « Variables étudiées » de votre M&M. Si
        plusieurs étudiants relèvent les dossiers, réunissez-vous après les premiers dossiers pour
        comparer vos fiches.
      </P>
      <H3>Les pièges de lecture des dossiers</H3>
      <List
        items={[
          <>
            <strong>Plusieurs valeurs pour une même variable</strong> (trois créatinines pendant le
            séjour) : décidez à l'avance laquelle relever, la première, la plus haute ou celle de la
            sortie, et tenez-vous-y.
          </>,
          <>
            <strong>Des sources contradictoires</strong> (compte rendu opératoire et lettre de
            sortie) : fixez un ordre de priorité entre les documents du dossier.
          </>,
          <>
            <strong>Une écriture illisible ou une abréviation ambiguë</strong> : notez « non
            renseigné » plutôt que d'interpréter.
          </>,
          <>
            <strong>Une date approximative</strong> (« fin mars ») : relevez ce qui est écrit et
            décidez avec votre encadrant de la règle à appliquer, la même pour tous les dossiers.
          </>,
        ]}
      />
      <H3>Contrôler la qualité du relevé</H3>
      <P>
        La double saisie complète (deux saisies indépendantes, puis comparaison) est la méthode la
        plus sûre, mais elle double le temps de saisie. Une solution réaliste : faire relever à
        nouveau un échantillon tiré au hasard, par exemple 10 % des dossiers, par une seconde
        personne, et comparer les fiches sur les variables clés. Si les désaccords sont nombreux sur
        une variable, revoyez sa définition et reprenez-la sur l'ensemble des dossiers.
      </P>
      <Note>
        Phrase type pour le M&M : « Les données ont été recueillies à partir des dossiers médicaux à
        l'aide d'une fiche de recueil préétablie (Annexe [n°]). Un échantillon de [30] dossiers
        tirés au sort a fait l'objet d'un second relevé indépendant afin de vérifier la concordance
        des données recueillies. »
      </Note>

      <H2 id="manquantes">Dossiers incomplets et données manquantes</H2>
      <P>
        Un dossier rétrospectif est toujours incomplet : il a été rempli pour soigner, pas pour la
        recherche. Trois règles :
      </P>
      <List
        ordered
        items={[
          "Ne jamais deviner. Ce qui n'est pas écrit est « non renseigné », pas « non ». Une complication non mentionnée n'est pas une absence de complication démontrée.",
          "Distinguer « non fait » de « normal ». Un examen non réalisé n'est pas un examen normal.",
          "N'exclure un dossier que selon un critère fixé à l'avance, par exemple l'absence du critère de jugement principal. Un dossier auquel il manque une variable secondaire reste inclus ; la variable sera simplement manquante pour ce patient.",
        ]}
      />
      <P>
        Dans les résultats, chaque pourcentage est calculé sur les données disponibles, et le
        dénominateur est indiqué quand il diffère de l'effectif total : « une HTA était notée chez
        41 des 288 patients dont l'antécédent était renseigné (14,2 %) ». Si une variable importante
        est manquante dans une grande partie des dossiers, dites-le : c'est une limite à discuter,
        pas un chiffre à cacher.
      </P>
      <Note>
        Phrase type pour le M&M : « Les pourcentages ont été calculés sur les données disponibles ;
        le dénominateur est précisé lorsqu'il diffère de l'effectif total. Les données manquantes
        n'ont fait l'objet d'aucune imputation. »
      </Note>

      <H2 id="flux">Le diagramme de flux</H2>
      <P>
        Le diagramme de flux montre au jury le passage des dossiers identifiés aux patients
        analysés. Il est généralement la première figure des résultats. Pour le construire, notez{" "}
        <strong>dès le relevé</strong> chaque dossier écarté avec son motif ; le reconstituer après
        coup est presque impossible.
      </P>
      <P>Les motifs à prévoir sur votre liste de suivi des dossiers :</P>
      <List
        items={[
          "dossier introuvable ou inaccessible aux archives ;",
          "patient hors de la période d'étude ou ne répondant pas aux critères d'inclusion ;",
          "critère de non-inclusion, en précisant lequel ;",
          "même patient retrouvé deux fois (deux séjours, deux numéros), selon l'unité d'analyse choisie ;",
          "critère de jugement principal non renseigné.",
        ]}
      />
      <Table
        caption="Exemple fictif de diagramme de flux, présenté sous forme de tableau"
        head={["Étape", "Effectif"]}
        rows={[
          ["Patients identifiés dans le registre du bloc (2021–2023)", "412"],
          ["Exclus : dossier introuvable", "37"],
          ["Exclus : critère de non-inclusion (opéré dans un autre centre)", "25"],
          ["Exclus : critère de jugement principal non renseigné", "18"],
          [<strong>Patients inclus et analysés</strong>, <strong>332</strong>],
          ["Dont chirurgie en urgence", "214 (64,5 %)"],
          ["Dont chirurgie programmée", "118 (35,5 %)"],
        ]}
      />
      <P>
        Vérifiez l'arithmétique : 412 − (37 + 25 + 18) = 332, et 214 + 118 = 332. La première phrase
        de vos résultats reprend ce chiffre : « Au total, 332 patients ont été inclus. » Pour la
        mise en forme de la figure et des tableaux, voir{" "}
        <GuideLink slug="presenter-resultats-these-tableaux-figures">
          présenter les résultats de sa thèse
        </GuideLink>
        .
      </P>
      <Figure
        caption="Figure 2. Le même exemple sous forme de diagramme de flux, tel qu'il apparaîtra en Figure 1 de vos Résultats"
        source="Exemple fictif de ce guide : cholécystectomies pour lithiase, 2021–2023. 412 − (37 + 25 + 18) = 332 ; 214 + 118 = 332."
      >
        <RetroFlow />
      </Figure>

      <H2 id="confidentialite">Confidentialité et éthique</H2>
      <P>
        Les dossiers contiennent des données de santé identifiantes. Quelques principes valent
        partout :
      </P>
      <List
        items={[
          "Les fiches de recueil ne portent ni nom, ni numéro de téléphone, ni numéro de dossier : seulement un identifiant d'étude (P001, P002…).",
          "La correspondance entre identifiant d'étude et numéro de dossier, si elle est nécessaire pour revenir vérifier une donnée, est conservée à part, protégée, et ne quitte pas le service.",
          "Les dossiers restent consultés dans les conditions fixées par le service et l'établissement ; on ne les photographie pas sur un téléphone personnel.",
          "La base transmise à un tiers (encadrant, statisticien) est anonymisée.",
        ]}
      />
      <P>
        Avant le recueil, obtenez l'avis du comité d'éthique ou l'accord exigé par votre faculté et
        par l'établissement. Les démarches et les pièces demandées varient : vérifiez-les auprès du
        service des thèses de votre faculté et de la direction de l'établissement. Mentionnez
        ensuite cet avis dans le paragraphe « Considérations éthiques » du M&M.
      </P>

      <H2 id="temps">Le temps à prévoir</H2>
      <P>Le relevé est presque toujours plus long que prévu. Les postes à compter :</P>
      <List
        items={[
          "la recherche des dossiers aux archives, souvent la partie la plus lente ;",
          "la lecture et le remplissage de la fiche, qui varient fortement selon l'épaisseur du dossier ;",
          "la saisie des fiches dans Excel ou SPSS ;",
          "le contrôle d'un échantillon et la vérification des valeurs douteuses.",
        ]}
      />
      <P>
        Mesurez votre temps sur les dix dossiers du test. Par exemple, à 20 minutes par dossier, 300
        dossiers représentent 100 heures de relevé, sans compter les archives ni la saisie. Mieux
        vaut le savoir avant de fixer la date de soutenance.
      </P>
      <P>
        La saisie peut aussi être confiée. L'équipe d'Insight Medics saisit des fiches papier ou
        scannées dans une base Excel ou SPSS structurée, accompagnée de son dictionnaire des
        variables, prête pour l'analyse. Vous gardez la maîtrise du relevé et des définitions ; la
        base suit vos codes.
      </P>
      <P>
        Que la saisie soit faite par vous ou confiée, terminez par trois vérifications : le nombre
        de lignes de la base est égal au nombre de fiches retenues dans le diagramme de flux, chaque
        identifiant n'apparaît qu'une fois, et quelques fiches tirées au hasard correspondent
        exactement à leur ligne dans la base.
      </P>

      <H3>Les étapes dans l'ordre</H3>
      <List
        ordered
        items={[
          "Rédiger le protocole avec l'encadrant : objectifs, population, critères, variables.",
          "Obtenir l'avis ou l'accord requis avant tout recueil.",
          "Établir la liste des patients éligibles à partir de la source d'identification.",
          "Construire la fiche de recueil et la tester sur une dizaine de dossiers.",
          "Relever les dossiers, en notant chaque exclusion et son motif.",
          "Saisir les fiches, puis contrôler un échantillon et les valeurs douteuses.",
          "Transmettre la base anonymisée, avec son dictionnaire, pour l'analyse.",
        ]}
      />

      <H2 id="biais">Les biais à discuter</H2>
      <P>
        Le jury attend que vous connaissiez les limites propres au rétrospectif. Elles se discutent
        dans la partie Discussion, sans s'excuser ni minimiser.
      </P>
      <Table
        caption="Biais fréquents des études rétrospectives sur dossiers"
        head={["Biais", "D'où il vient", "Exemple"]}
        rows={[
          [
            "Biais d'information",
            "Données notées pour le soin, de façon variable selon les praticiens",
            "Antécédents ou complications mineures sous-déclarés",
          ],
          [
            "Biais de sélection",
            "Dossiers perdus ou exclus qui ne le sont pas au hasard",
            "Dossiers des patients décédés ou transférés plus souvent introuvables",
          ],
          [
            "Biais de recrutement",
            "Population d'un seul service, souvent de référence",
            "Patients plus graves que dans la population générale",
          ],
          [
            "Facteurs de confusion non mesurés",
            "Variables utiles jamais notées dans les dossiers",
            "Tabagisme ou niveau socio-économique absents",
          ],
        ]}
      />
      <Note>
        Phrase type pour la Discussion : « Le caractère rétrospectif de ce travail expose à un biais
        d'information, les données ayant été recueillies à partir de dossiers médicaux non conçus
        pour la recherche, et à des données manquantes pour certaines variables. Son caractère
        monocentrique limite par ailleurs l'extrapolation des résultats à d'autres populations. »
      </Note>
      <P>
        Les biais ne disparaissent pas, mais ils se réduisent : recrutement exhaustif plutôt que
        sélectionné, définitions écrites à l'avance, second relevé d'un échantillon. Si de nombreux
        dossiers ont été exclus, comparez les patients exclus et inclus sur les quelques
        caractéristiques disponibles (âge, sexe, année) : des groupes proches rassurent sur le
        risque de biais de sélection, et le jury apprécie cette démarche.
      </P>

      <H2 id="erreurs">Les erreurs fréquentes</H2>
      <List
        items={[
          "Ouvrir les dossiers avant d'avoir écrit les critères d'inclusion et d'exclusion.",
          "Relever « tout ce qui est dans le dossier » au lieu des seules variables utiles aux objectifs.",
          "Laisser des questions ouvertes sur la fiche, puis devoir coder du texte libre au moment de l'analyse.",
          "Confondre « non renseigné » et « non », ou « non fait » et « normal ».",
          "Modifier une définition en cours de relevé sans reprendre les dossiers déjà lus.",
          "Ne pas noter les motifs d'exclusion, et ne plus pouvoir construire le diagramme de flux.",
          "Faire circuler des fiches ou une base avec des noms ou des numéros de dossier.",
          "Sous-estimer le temps d'accès aux archives.",
          "Commencer le recueil avant d'avoir obtenu l'avis ou l'accord requis.",
          "Relever la valeur « la plus parlante » d'un dossier au lieu de celle définie à l'avance (la première, la plus haute…).",
          "Taire les biais du rétrospectif dans la discussion.",
        ]}
      />
      <P>
        Une étude rétrospective bien préparée donne une base propre dès la première saisie. Les
        quelques heures passées sur les critères et la fiche de recueil en font gagner bien
        davantage au moment de l'analyse.
      </P>
    </>
  );
}
