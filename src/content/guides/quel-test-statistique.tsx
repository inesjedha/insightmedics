import { Figure, H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import { TestDecisionTree } from "@/components/guides/figures/DecisionTree";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "quel-test-statistique-choisir-these-medecine",
  category: "statistiques",
  title: "Quel test statistique choisir pour votre thèse de médecine ?",
  seoTitle: "Quel test statistique choisir pour sa thèse de médecine",
  description:
    "Le bon test dépend de votre question, du type de variables et du lien entre les groupes. Tableau de décision, cas fréquents en thèse et erreurs à éviter.",
  keyword: "quel test statistique choisir thèse",
  datePublished: "2026-10-26",
  readingMinutes: 9,
  shortAnswer:
    "Le test dépend de trois choses : le type de la variable étudiée (quantitative ou qualitative), le nombre de groupes comparés, et le fait que les mesures soient indépendantes ou appariées. Pour comparer une variable quantitative entre deux groupes indépendants : test t de Student (ou Mann-Whitney si la distribution est très asymétrique). Pour comparer des pourcentages : Chi-2 (ou Fisher si un effectif attendu est inférieur à 5 dans un tableau 2 × 2). Pour tenir compte de plusieurs facteurs à la fois : une régression.",
  toc: [
    ["question", "Partez de votre question"],
    ["variables", "Le type de vos variables"],
    ["appariement", "Groupes indépendants ou appariés"],
    ["normalite", "Paramétrique ou non paramétrique"],
    ["tableau", "Le tableau de décision"],
    ["ajustement", "Plusieurs facteurs : la régression"],
    ["cas", "Les cas fréquents en thèse"],
    ["erreurs", "Les erreurs qui reviennent"],
    ["rediger", "Comment le présenter dans vos méthodes"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="question">Partez de votre question, pas du logiciel</H2>
      <P>
        L'erreur la plus courante est d'ouvrir SPSS et de chercher « le test qui marche ». Le choix
        se fait avant : il découle de votre <strong>objectif principal</strong>, tel qu'il est écrit
        dans votre protocole. Reformulez-le en une phrase du type « Je compare <em>X</em> entre{" "}
        <em>tel et tel groupe</em> » ou « Je cherche les facteurs associés à <em>Y</em> ».
      </P>
      <P>
        Exemple : « Je compare le score SAPS II entre les patients décédés et les survivants » est
        une comparaison de deux groupes. « Je cherche les facteurs associés au décès à 90 jours »
        appelle une analyse multivariée. Les deux phrases ne mènent pas au même test.
      </P>

      <H2 id="variables">Identifiez le type de vos variables</H2>
      <P>Chaque variable de votre base entre dans l'une de ces familles :</P>
      <List
        items={[
          <>
            <strong>Quantitative</strong> (continue ou discrète) : âge, tension, score SAPS II,
            durée de séjour. On la résume par une moyenne ± écart-type ou une médiane [IQR].
          </>,
          <>
            <strong>Qualitative binaire</strong> : décès oui/non, sexe, HTA oui/non. On la résume
            par un effectif et un pourcentage.
          </>,
          <>
            <strong>Qualitative à plus de deux modalités</strong> : groupe sanguin, stade, service
            d'origine. Si les modalités sont ordonnées (stade I à IV), on parle de variable
            ordinale.
          </>,
          <>
            <strong>Délai jusqu'à un événement</strong> : temps jusqu'au décès ou à la récidive,
            avec des patients perdus de vue. C'est une donnée de survie, qui a ses propres méthodes.
          </>,
        ]}
      />
      <P>
        Distinguez aussi la variable que vous cherchez à expliquer (le critère de jugement) des
        variables qui pourraient l'expliquer (les facteurs étudiés).
      </P>

      <H2 id="appariement">Groupes indépendants ou mesures appariées ?</H2>
      <P>
        Deux groupes sont <strong>indépendants</strong> quand ils contiennent des patients
        différents (hommes contre femmes, traités contre non traités). Les mesures sont{" "}
        <strong>appariées</strong> quand ce sont les mêmes patients mesurés deux fois (avant et
        après traitement), ou des patients appariés un à un (cas-témoins appariés). Les tests ne
        sont pas les mêmes : utiliser un test pour groupes indépendants sur des données appariées
        fait perdre de la puissance et fausse les conclusions.
      </P>

      <H2 id="normalite">Paramétrique ou non paramétrique ?</H2>
      <P>
        Les tests paramétriques (Student, ANOVA) comparent des moyennes et supposent une
        distribution à peu près normale dans chaque groupe. Ils sont robustes quand les effectifs
        sont suffisants et la distribution peu asymétrique. Les tests non paramétriques
        (Mann-Whitney, Kruskal-Wallis, Wilcoxon) comparent des rangs : ils conviennent aux petits
        effectifs, aux distributions très asymétriques et aux variables ordinales.
      </P>
      <Note>
        Ne vous fiez pas qu'au test de Shapiro-Wilk : sur un grand échantillon, il devient
        significatif pour d'infimes écarts ; sur un petit, il ne détecte presque rien. Regardez
        aussi l'histogramme et comparez moyenne et médiane.
      </Note>

      <H2 id="tableau">Le tableau de décision</H2>
      <Table
        caption="Quel test pour comparer une variable entre des groupes"
        head={["Variable étudiée", "Groupes", "Test de référence", "Alternative"]}
        rows={[
          ["Quantitative", "2 groupes indépendants", "t de Student", "Mann-Whitney"],
          ["Quantitative", "2 mesures appariées", "t de Student apparié", "Wilcoxon"],
          ["Quantitative", "3 groupes ou plus", "ANOVA", "Kruskal-Wallis"],
          ["Quantitative", "3 mesures répétées ou plus", "ANOVA à mesures répétées", "Friedman"],
          [
            "Qualitative",
            "Groupes indépendants",
            "Chi-2 de Pearson",
            "Fisher (tableau 2 × 2 avec un effectif attendu < 5)",
          ],
          ["Qualitative binaire", "2 mesures appariées", "McNemar", "—"],
          [
            "Deux variables quantitatives",
            "Liaison",
            "Corrélation de Pearson",
            "Corrélation de Spearman",
          ],
          ["Délai jusqu'à un événement", "2 groupes ou plus", "Log-rank (Kaplan-Meier)", "—"],
        ]}
      />
      <P>
        Pour une variable quantitative, l'alternative est le test non paramétrique, à préférer quand
        la distribution est très asymétrique ou l'effectif petit. Pour une variable qualitative, ce
        sont les effectifs attendus qui décident : dans un tableau 2 × 2, Fisher remplace le Chi-2
        dès qu'un effectif attendu est inférieur à 5 ; dans un tableau plus grand, le Chi-2 reste
        acceptable si au plus 20 % des cases ont un effectif attendu inférieur à 5 et aucune
        inférieur à 1. Le Chi-2, McNemar et le log-rank ne sont pas des tests paramétriques : ils
        figurent dans la colonne « référence » parce qu'ils sont le premier choix.
      </P>
      <Figure
        caption="Figure 1. Le choix du test en trois questions : le type de la variable étudiée, les groupes comparés, puis la distribution ou les effectifs"
        source="Même contenu que le tableau de décision ci-dessus, lu de gauche à droite."
      >
        <TestDecisionTree />
      </Figure>

      <H2 id="ajustement">Plusieurs facteurs à la fois : la régression</H2>
      <P>
        Les tests ci-dessus comparent les groupes deux à deux, sans tenir compte des autres
        facteurs. Or en clinique, tout est lié : les patients les plus âgés sont souvent les plus
        graves. Pour savoir si un facteur reste associé au critère de jugement{" "}
        <strong>à âge et gravité égaux</strong>, il faut un modèle multivarié :
      </P>
      <List
        items={[
          <>
            <strong>Régression linéaire</strong> si le critère de jugement est quantitatif (durée de
            séjour, par exemple).
          </>,
          <>
            <strong>Régression logistique</strong> s'il est binaire (décès oui/non) : elle donne des
            odds ratios ajustés.
          </>,
          <>
            <strong>Modèle de Cox</strong> s'il s'agit d'un délai jusqu'à un événement : il donne
            des hazard ratios.
          </>,
        ]}
      />
      <P>
        Règle de prudence : prévoyez environ dix événements par variable introduite dans le modèle
        (en régression logistique, dix patients de la modalité la moins fréquente, par exemple dix
        décès, pour chaque facteur testé). En dessous de ce repère, le modèle devient instable et
        ses résultats peu fiables.
      </P>

      <H2 id="cas">Les cas fréquents en thèse</H2>
      <H3>Évaluer un test diagnostique ou un score pronostique</H3>
      <P>
        Sensibilité, spécificité, valeurs prédictives et courbe ROC. L'aire sous la courbe (AUC)
        résume la capacité du score à distinguer malades et non-malades : 0,5 correspond au hasard,
        1 à une discrimination parfaite. L'indice de Youden aide à choisir le seuil.
      </P>
      <H3>Étudier la survie</H3>
      <P>
        Courbes de Kaplan-Meier pour décrire la survie, test du log-rank pour comparer deux groupes,
        modèle de Cox pour ajuster sur plusieurs facteurs. Ces méthodes gèrent les patients perdus
        de vue, ce que ne fait pas un simple pourcentage de décès.
      </P>
      <H3>Mesurer un accord entre deux observateurs</H3>
      <P>
        Coefficient kappa de Cohen pour une variable qualitative, coefficient de corrélation
        intraclasse (ICC) pour une variable quantitative.
      </P>

      <H2 id="erreurs">Les erreurs qui reviennent</H2>
      <List
        items={[
          "Multiplier les tests sur vingt variables sans le dire : sur vingt comparaisons sans aucune différence réelle, une en moyenne sortira significative par hasard, et le risque d'au moins un faux positif atteint 64 %.",
          "Utiliser le Chi-2 sur un tableau 2 × 2 avec un effectif attendu inférieur à 5 au lieu du test exact de Fisher.",
          "Comparer avant et après traitement avec un test pour groupes indépendants.",
          "Donner une valeur de p sans l'effet mesuré ni son intervalle de confiance.",
          "Confondre significativité statistique et pertinence clinique : une différence de 1 mmHg peut être significative sur 5 000 patients sans rien changer pour eux.",
          "Choisir le test après avoir vu les résultats, pour obtenir p < 0,05.",
        ]}
      />

      <H2 id="rediger">Comment le présenter dans vos méthodes</H2>
      <P>
        Le paragraphe « Analyse statistique » de votre partie Matériel et méthodes doit permettre à
        un lecteur de refaire vos calculs. Il précise : le logiciel et sa version, la façon de
        décrire les variables, le test choisi pour chaque comparaison, le seuil de significativité
        et la gestion des données manquantes. Par exemple :
      </P>
      <Note>
        « Les analyses ont été réalisées avec le logiciel [IBM SPSS Statistics, version …]. Les
        variables quantitatives ont été exprimées en moyenne ± écart-type lorsque leur distribution
        était normale (test de Shapiro-Wilk et histogramme), en médiane [intervalle interquartile]
        dans le cas contraire, et comparées respectivement par le test t de Student et par le test
        de Mann-Whitney. Les variables qualitatives ont été exprimées en effectif (pourcentage) et
        comparées par le test du Chi-2, ou par le test exact de Fisher lorsqu'un effectif attendu
        était inférieur à 5. Les facteurs associés au décès à 90 jours ont été recherchés par
        régression logistique multivariée. Les pourcentages ont été calculés sur les données
        disponibles. Le seuil de significativité a été fixé à 5 %, pour des tests bilatéraux. »
      </Note>
      <P>
        Vous ne savez pas par où commencer ? Testez d'abord votre base : vous saurez en quelques
        minutes si elle est exploitable, avant de choisir le moindre test.
      </P>
    </>
  );
}
