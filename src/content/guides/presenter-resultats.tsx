import { Link } from "@tanstack/react-router";
import { GuideLink } from "@/components/guides/GuideLink";
import { H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "presenter-resultats-these-tableaux-figures",
  category: "rediger",
  title: "Présenter les résultats de sa thèse : tableaux et figures aux normes",
  seoTitle: "Présenter les résultats de sa thèse : tableaux et figures",
  description:
    "Ordre du chapitre, n (%), moyenne ± écart-type, médiane [Q1–Q3], tableaux de comparaison, choix des figures et numérotation. Exemple rédigé et check-list.",
  keyword: "présenter résultats thèse tableaux figures",
  datePublished: "2026-10-30",
  readingMinutes: 8,
  shortAnswer:
    "Le chapitre Résultats suit un ordre fixe : population et diagramme de flux, description des patients, objectif principal, objectifs secondaires, puis analyse multivariée. Il rapporte les faits, au passé, sans commentaire ni comparaison à la littérature. Chaque donnée a un seul support : le texte résume, le détail figure dans un tableau ou dans une figure, jamais les deux. Chaque tableau et chaque figure est numéroté et appelé dans le texte avant d'apparaître.",
  toc: [
    ["ordre", "L'ordre du chapitre Résultats"],
    ["regles", "Les règles de rédaction"],
    ["chiffres", "Écrire les chiffres"],
    ["tableau", "Construire un tableau de comparaison"],
    ["figures", "Quand choisir une figure, et laquelle"],
    ["numerotation", "Numéroter et appeler tableaux et figures"],
    ["exemple", "Un exemple de paragraphe de résultats"],
    ["checklist", "La check-list avant de rendre"],
    ["erreurs", "Les erreurs fréquentes"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="ordre">L'ordre du chapitre Résultats</H2>
      <P>
        Le chapitre Résultats suit le plan annoncé dans votre Matériel et méthodes, dans le même
        ordre. Chaque objectif et chaque paramètre étudié y a sa partie ; aucune analyse n'y
        apparaît sans avoir été annoncée.
      </P>
      <List
        ordered
        items={[
          <>
            <strong>Population</strong> : une phrase de synthèse (« Au total, 120 patients ont été
            inclus. »), puis le diagramme de flux, en Figure 1 : patients éligibles, exclus avec
            leurs motifs, inclus, analysés.
          </>,
          <>
            <strong>Analyse descriptive</strong> : une sous-partie par famille de paramètres, dans
            l'ordre chronologique de la prise en charge (terrain, clinique, paraclinique,
            traitement, évolution).
          </>,
          <>
            <strong>Objectif principal</strong> : le critère de jugement principal, avec son
            intervalle de confiance à 95 %.
          </>,
          <>
            <strong>Objectifs secondaires</strong>, dans l'ordre de votre fiche d'inscription.
          </>,
          <>
            <strong>Facteurs associés</strong> : comparaisons univariées par famille de facteurs,
            puis le modèle multivarié.
          </>,
        ]}
      />
      <P>
        La grille d'évaluation du jury de la Faculté de médecine de Tunis, par exemple, vérifie
        précisément ces points : la population (avec un diagramme de flux si besoin), l'objectif
        principal, les objectifs secondaires, l'absence de commentaire et de données hors objectifs,
        des tableaux et figures sans redite avec le texte, numérotés et appelés, aucune discordance
        entre texte, tableaux et figures, et des verbes au passé.
      </P>

      <H2 id="regles">Les règles de rédaction</H2>
      <H3>Des faits, sans commentaire</H3>
      <P>
        Les Résultats rapportent ce que vous avez observé, rien de plus. Pas d'interprétation, pas
        d'explication, pas de comparaison à la littérature, pas de causalité : tout cela appartient
        à la Discussion. « Ce résultat s'explique probablement par… » ou « contrairement à la série
        de… » n'ont pas leur place ici.
      </P>
      <H3>Des verbes au passé</H3>
      <P>
        Le chapitre s'écrit à l'imparfait et au passé composé, avec des tournures impersonnelles : «
        L'âge moyen était de… », « Une complication est survenue chez… », « Aucune différence
        significative n'a été mise en évidence… ».
      </P>
      <H3>Une donnée, un seul support</H3>
      <P>
        Le texte résume l'essentiel : la modalité la plus fréquente, les extrêmes, le résultat du
        test. Le détail va dans un tableau <strong>ou</strong> dans une figure, jamais dans les
        deux. Si une figure montre la répartition par tranche d'âge, retirez cette répartition du
        tableau. Ne récitez pas non plus le tableau ligne par ligne dans le texte.
      </P>

      <H2 id="chiffres">Écrire les chiffres</H2>
      <Table
        caption="Quel format pour quelle variable"
        head={["Variable", "Format", "Exemple"]}
        rows={[
          ["Qualitative", "n (%)", "68 hommes (56,7 %)"],
          ["Quantitative de distribution normale", "moyenne ± écart-type", "57,7 ± 12,9 ans"],
          [
            "Quantitative asymétrique (durées, scores, biologie)",
            "médiane [Q1–Q3]",
            "76 min [62–103]",
          ],
          ["Donnée manquante pour certains patients", "n/N (%)", "34/48 (70,8 %)"],
        ]}
      />
      <P>
        La normalité se vérifie variable par variable, en général par le test de Shapiro-Wilk
        complété par l'histogramme. Une durée de séjour ou une CRP est presque toujours asymétrique
        : la moyenne y est tirée par quelques valeurs extrêmes, la médiane est plus juste. Pour
        l'âge et les durées, ajoutez les valeurs extrêmes (« avec des extrêmes de 23 et 75 ans »).
      </P>
      <Note>
        Excel et SPSS ne calculent pas les quartiles de la même façon : les valeurs peuvent différer
        légèrement. Utilisez le même logiciel pour toute la thèse.
      </Note>
      <H3>Un nombre de décimales cohérent</H3>
      <Table
        caption="Conventions de décimales, à garder identiques dans toute la thèse"
        head={["Valeur", "Décimales", "Exemple"]}
        rows={[
          ["Pourcentage", "une", "56,7 %"],
          ["Moyenne et écart-type", "une de plus que la mesure", "57,7 ± 12,9 ans"],
          ["Médiane, quartiles, extrêmes", "celles de la mesure", "76 min [62–103]"],
          ["Valeur de p", "trois", "p = 0,033 ; p < 0,001"],
          ["Odds ratio et son IC", "deux", "3,86 [1,65 – 9,01]"],
          ["Aire sous la courbe ROC", "trois", "0,874"],
        ]}
      />
      <P>
        Deux règles d'écriture encore : une phrase ne commence jamais par un chiffre (« Au total, 8
        patients… » ou « Huit patients… ») ; et l'unité suit le nombre, pas le pourcentage (« 128
        patients (73,6 %) », et non « 128 (73,6 %) patients »). Pour l'écriture des p, voyez notre
        guide pour{" "}
        <GuideLink slug="interpreter-valeur-p-intervalle-confiance-these">
          interpréter la valeur de p et l'intervalle de confiance
        </GuideLink>
        .
      </P>

      <H2 id="tableau">Construire un tableau de comparaison</H2>
      <P>
        Un tableau de comparaison a une colonne de variables, une colonne par groupe avec son
        effectif dans l'en-tête, et une colonne p. Les unités vont dans la première colonne, le nom
        des tests dans une note sous le tableau. Voici un exemple fictif :
      </P>
      <Table
        caption="Tableau IV : Caractéristiques des patients selon la survenue d'une complication postopératoire (N = 120)"
        head={["Variable", "Complication (n = 40)", "Pas de complication (n = 80)", "p"]}
        rows={[
          ["Âge, ans", "61,2 ± 11,8", "55,9 ± 13,1", <strong key="a">0,033</strong>],
          ["Sexe masculin", "26 (65,0)", "42 (52,5)", "0,193"],
          ["Diabète", "18 (45,0)", "14 (17,5)", <strong key="d">0,001</strong>],
          ["Hypertension artérielle", "15 (37,5)", "24 (30,0)", "0,408"],
          ["Durée opératoire, min", "93 [67–118]", "73 [60–93]", <strong key="m">0,005</strong>],
        ]}
      />
      <P>
        <em>
          Note : valeurs exprimées en effectif (pourcentage), moyenne ± écart-type ou médiane
          [Q1–Q3]. Tests : t de Student (âge), Chi² de Pearson (sexe, diabète, hypertension
          artérielle), U de Mann-Whitney (durée opératoire).
        </em>
      </P>
      <List
        items={[
          "Le titre du tableau est placé au-dessus, en forme nominale, sans point final, avec l'effectif total si utile.",
          "Ne présentez qu'une seule ligne pour une variable binaire (« Diabète » suffit, la ligne « Pas de diabète » est redondante).",
          "Les p inférieurs à 0,05 peuvent être mis en gras, sans couleur ni étoile.",
          "Visez une quinzaine de lignes au plus : au-delà, découpez par famille de variables (terrain, clinique, biologie).",
        ]}
      />
      <P>
        Pour chaque ligne, le test dépend du type de variable et de sa distribution : voyez{" "}
        <GuideLink slug="quel-test-statistique-choisir-these-medecine">
          quel test statistique choisir pour votre thèse
        </GuideLink>
        .
      </P>

      <H2 id="figures">Quand choisir une figure, et laquelle</H2>
      <P>
        Une figure vaut mieux qu'un tableau quand elle montre une forme : une distribution, une
        évolution dans le temps, une différence entre groupes visible d'un coup d'œil. Un tableau
        vaut mieux quand le lecteur doit retrouver des valeurs précises, ou quand il y a beaucoup de
        variables. Pour deux ou trois pourcentages, une phrase suffit.
      </P>
      <Table
        caption="Quel graphique pour quelle donnée"
        head={["Ce que vous voulez montrer", "Graphique adapté"]}
        rows={[
          ["Catégories (motif de consultation, service)", "Barres horizontales triées, avec n (%)"],
          ["Catégories ordonnées (stade, grade)", "Barres dans l'ordre naturel des catégories"],
          ["Distribution d'une variable continue (âge)", "Histogramme"],
          ["Variable continue selon deux groupes ou plus", "Boîtes à moustaches"],
          ["Mesure répétée chez les mêmes patients", "Courbes ou lignes par temps de mesure"],
          ["Survie, délai jusqu'à un événement", "Courbe de Kaplan-Meier avec effectifs à risque"],
          ["Performance d'un test diagnostique", "Courbe ROC"],
          ["Sélection des patients", "Diagramme de flux"],
        ]}
      />
      <P>À éviter :</P>
      <List
        items={[
          "les camemberts, surtout en 3D : les angles se comparent mal et la perspective déforme les parts ;",
          "tout effet 3D, ombre ou dégradé décoratif ;",
          "les doubles axes verticaux, qui suggèrent des liens trompeurs ;",
          "un titre dans l'image : la légende sous la figure est son seul titre ;",
          "une figure qui répète exactement un tableau.",
        ]}
      />
      <P>
        Une figure lisible a des axes nommés avec leurs unités, des effectifs visibles, une virgule
        décimale, des couleurs distinguables par un lecteur daltonien et des caractères assez grands
        une fois insérée dans la page. Pour la courbe ROC en particulier, voyez notre guide sur la{" "}
        <GuideLink slug="courbe-roc-seuil-optimal-these">courbe ROC et le seuil optimal</GuideLink>.
      </P>

      <H2 id="numerotation">Numéroter et appeler tableaux et figures</H2>
      <List
        items={[
          "Les tableaux et les figures ont chacun leur numérotation, continue dans toute la thèse : les tableaux des Résultats suivent ceux du Matériel et méthodes.",
          "Le titre d'un tableau se place au-dessus du tableau ; la légende d'une figure se place en dessous.",
          "Chaque tableau et chaque figure est appelé dans le texte avant d'apparaître : « (Tableau III) » ou « … est présentée dans la Figure 2 ». Placez-le juste après le paragraphe qui l'appelle.",
          "Les numéros suivent l'ordre des premiers appels, sans trou ni doublon.",
        ]}
      />
      <P>
        Dans les thèses des facultés tunisiennes, l'usage est de numéroter les tableaux en chiffres
        romains (Tableau I, II, III) et les figures en chiffres arabes (Figure 1, 2, 3). Les règles
        de présentation varient toutefois d'une faculté à l'autre : vérifiez celles de la vôtre dans
        notre guide de la{" "}
        <GuideLink slug="mise-en-forme-these-medecine-tunisie">
          mise en forme de la thèse de médecine en Tunisie
        </GuideLink>
        .
      </P>

      <H2 id="exemple">Un exemple de paragraphe de résultats</H2>
      <P>
        Reprenons l'étude fictive du Tableau IV : 120 patients opérés, dont 40 ont présenté une
        complication postopératoire. Le texte résume, appelle les supports et donne le résultat des
        tests, sans commentaire :
      </P>
      <Note>
        « Au total, 120 patients ont été inclus (Figure 1). L'âge moyen était de 57,7 ± 12,9 ans. La
        population comptait 68 hommes (56,7 %) et 52 femmes (43,3 %), soit un sex-ratio (H/F) de
        1,31. Une complication postopératoire est survenue chez 40 patients (33,3 % ; IC 95 % 25,5 –
        42,2). Les patients ayant présenté une complication étaient plus âgés (61,2 ± 11,8 ans
        contre 55,9 ± 13,1 ans ; <strong>p = 0,033</strong>) et plus souvent diabétiques (45,0 %
        contre 17,5 % ; <strong>p = 0,001</strong>). Leur durée opératoire médiane était plus longue
        (93 min [67–118] contre 73 min [60–93] ; <strong>p = 0,005</strong>). Le sexe et
        l'hypertension artérielle n'étaient pas associés significativement à la survenue d'une
        complication (Tableau IV). »
      </Note>
      <P>
        Remarquez ce qui n'y figure pas : aucune explication du lien entre diabète et complication,
        aucune référence, aucun « tendance » pour le sexe. Ces éléments iront dans la Discussion.
      </P>

      <H2 id="checklist">La check-list avant de rendre</H2>
      <List
        items={[
          "Le chapitre suit l'ordre du Matériel et méthodes, et chaque objectif a sa partie.",
          "Le diagramme de flux est en Figure 1 et ses effectifs concordent avec le texte.",
          "Chaque chiffre du texte se retrouve à l'identique dans un tableau, une figure ou la base.",
          "Les pourcentages de chaque variable totalisent 100 % (à l'arrondi près) ; les dénominateurs sont donnés quand des données manquent.",
          "Le format (n (%), moyenne ± écart-type, médiane [Q1–Q3]) correspond à la distribution de chaque variable.",
          "Les décimales sont cohérentes partout ; aucun « p = 0,000 ».",
          "Chaque tableau et chaque figure est numéroté, titré et appelé avant d'apparaître.",
          "Aucune donnée n'apparaît à la fois dans un tableau et dans une figure.",
          "Tous les verbes sont au passé ; aucun commentaire, aucune référence bibliographique.",
          "Les tests utilisés sont indiqués en note sous chaque tableau.",
        ]}
      />

      <H2 id="erreurs">Les erreurs fréquentes</H2>
      <List
        items={[
          "Commenter ou expliquer un résultat, ou le comparer à une autre série.",
          "Présenter la même donnée dans le texte, un tableau et une figure.",
          "Donner une moyenne ± écart-type pour une variable très asymétrique.",
          "Calculer des pourcentages sur l'effectif total alors que la donnée manque chez certains patients.",
          "Écrire « une tendance » pour un p supérieur à 0,05.",
          "Placer un tableau avant la phrase qui l'appelle, ou laisser un trou dans la numérotation.",
          "Utiliser un camembert en 3D ou une figure sans unité sur les axes.",
          "Présenter des résultats qui ne répondent à aucun objectif annoncé.",
          "Laisser des discordances entre le texte et les tableaux après une dernière correction.",
        ]}
      />
      <P>
        Des tableaux justes commencent par une base propre : codages cohérents, données manquantes
        identifiées, pas de doublons. Avant de lancer vos analyses, vous pouvez{" "}
        <Link to="/audit">tester votre base gratuitement</Link>.
      </P>
    </>
  );
}
