import { Figure, H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import { OddsRatioForest } from "@/components/guides/figures/ConfidenceIntervals";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "regression-logistique-interpreter-odds-ratio-these",
  category: "statistiques",
  title: "Régression logistique : interpréter un odds ratio dans votre thèse",
  seoTitle: "Régression logistique et odds ratio : interpréter en thèse",
  description:
    "Lire un odds ratio, son intervalle de confiance et sa valeur de p, distinguer OR brut et ajusté, et rédiger vos résultats sans contresens. Exemples chiffrés.",
  keyword: "interpréter odds ratio régression logistique",
  datePublished: "2026-10-26",
  readingMinutes: 10,
  shortAnswer:
    "Un odds ratio (OR) compare la cote de l'événement entre deux groupes. OR = 1 : pas d'association. OR > 1 : l'événement est plus fréquent avec le facteur. OR < 1 : il l'est moins. L'association est significative au seuil de 5 % quand l'intervalle de confiance à 95 % exclut 1. En régression logistique multivariée, l'OR est « ajusté » : il mesure l'effet du facteur à valeurs égales des autres variables du modèle.",
  toc: [
    ["principe", "À quoi sert la régression logistique"],
    ["lire", "Lire un odds ratio"],
    ["ic", "L'intervalle de confiance et la valeur de p"],
    ["ajuste", "OR brut et OR ajusté"],
    ["quantitatif", "Un facteur quantitatif"],
    ["or-rr", "Odds ratio n'est pas risque relatif"],
    ["modele", "Construire un modèle solide"],
    ["rediger", "Rédiger vos résultats"],
    ["erreurs", "Les contresens fréquents"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="principe">À quoi sert la régression logistique</H2>
      <P>
        La régression logistique explique une variable <strong>binaire</strong> : décès oui/non,
        complication oui/non, succès du traitement oui/non. Elle répond à la question la plus
        fréquente des thèses de médecine : <em>quels sont les facteurs associés à cet événement</em>
        , une fois les autres facteurs pris en compte ?
      </P>
      <P>
        Elle produit, pour chaque facteur, un <strong>odds ratio</strong> (OR) accompagné de son
        intervalle de confiance et d'une valeur de p. C'est ce trio qui figure dans votre tableau de
        résultats et que le jury vous demandera d'expliquer.
      </P>

      <H2 id="lire">Lire un odds ratio</H2>
      <P>
        La <strong>cote</strong> (odds) d'un événement est le rapport entre la probabilité qu'il
        survienne et la probabilité qu'il ne survienne pas. Si 20 % des patients décèdent, la cote
        du décès est de 0,20 / 0,80 = 0,25. L'odds ratio est le rapport des cotes entre deux
        groupes.
      </P>
      <Table
        caption="Comment lire la valeur d'un odds ratio"
        head={["Valeur de l'OR", "Lecture"]}
        rows={[
          ["OR = 1", "Pas d'association entre le facteur et l'événement"],
          ["OR > 1", "Le facteur est associé à une cote plus élevée de l'événement"],
          ["OR < 1", "Le facteur est associé à une cote plus faible (effet « protecteur »)"],
        ]}
      />
      <P>
        Exemple : dans une étude de réanimation, un score SAPS II supérieur à 40 est associé au
        décès avec un OR de 3,4. La cote du décès est 3,4 fois plus élevée chez les patients dont le
        score dépasse 40 que chez les autres. Un OR de 0,6 pour un traitement signifierait une cote
        de l'événement réduite de 40 % (1 − 0,6).
      </P>

      <H2 id="ic">L'intervalle de confiance et la valeur de p</H2>
      <P>
        L'OR calculé sur votre échantillon n'est qu'une estimation. L'
        <strong>intervalle de confiance à 95 %</strong> (IC 95 %) donne la fourchette des valeurs
        compatibles avec vos données. Reprenons l'exemple : OR = 3,4 [IC 95 % : 2,2 – 5,1].
      </P>
      <List
        items={[
          "L'intervalle exclut 1 : l'association est statistiquement significative au seuil de 5 % (p < 0,05).",
          "Sa borne basse (2,2) indique que, même dans l'hypothèse la plus prudente, la cote du décès est plus que doublée.",
          "Sa largeur renseigne sur la précision : un intervalle de 1,1 à 25 serait significatif mais très imprécis, souvent faute d'effectif.",
        ]}
      />
      <Note>
        Un intervalle qui contient 1, par exemple [0,8 – 2,9], ne prouve pas l'absence d'effet : il
        signifie que vos données ne permettent pas de conclure. Écrivez « aucune association
        significative n'a été mise en évidence », et non « le facteur n'a pas d'influence ».
      </Note>
      <Figure
        caption="Figure 1. Lire un odds ratio et son IC 95 % sur une échelle logarithmique : tout se joue par rapport à la ligne verticale OR = 1"
        source="Odds ratios ajustés de l'exemple rédigé plus bas (décès à 90 jours), puis les deux intervalles cités dans cette partie, dont le texte ne donne que les bornes."
      >
        <OddsRatioForest />
      </Figure>

      <H2 id="ajuste">OR brut et OR ajusté</H2>
      <P>
        L'<strong>OR brut</strong> (analyse univariée) mesure l'association d'un facteur avec
        l'événement, seul. L'<strong>OR ajusté</strong> (analyse multivariée) mesure cette
        association à valeurs égales des autres variables du modèle : âge, sexe, gravité, etc.
      </P>
      <P>
        La différence entre les deux est souvent l'information la plus intéressante de votre thèse.
        Si l'âge a un OR brut de 2,8 mais un OR ajusté de 1,2 non significatif, c'est que l'effet
        apparent de l'âge passait en réalité par un autre facteur (les patients âgés étant, par
        exemple, plus graves à l'admission). On parle de <strong>facteur de confusion</strong>.
      </P>
      <P>Présentez les deux côte à côte : c'est la norme dans les revues et les jurys.</P>

      <H2 id="quantitatif">Un facteur quantitatif</H2>
      <P>
        Pour une variable continue comme l'âge, l'OR s'applique à{" "}
        <strong>une unité supplémentaire</strong>. Un OR de 1,03 pour l'âge signifie que la cote de
        l'événement augmente de 3 % par année d'âge. Pour un écart de dix ans, il faut élever l'OR à
        la puissance dix : 1,03¹⁰ ≈ 1,34, soit une cote augmentée d'environ 34 %.
      </P>
      <P>
        Un OR de 1,03 n'est donc pas « faible » : tout dépend de l'unité. Choisissez une unité
        cliniquement parlante (10 ans, 10 mmHg, 1 g/dL) et dites-le explicitement dans le tableau.
        Vérifiez aussi que la relation est à peu près linéaire ; sinon, découpez la variable en
        classes justifiées cliniquement.
      </P>

      <H2 id="or-rr">Odds ratio n'est pas risque relatif</H2>
      <P>
        L'OR compare des cotes, le risque relatif (RR) compare des probabilités. Les deux sont
        proches quand l'événement est rare (moins de 10 % environ). Quand il est fréquent, l'OR
        s'éloigne de 1 plus que le RR et exagère l'effet si on le lit comme un risque.
      </P>
      <Table
        caption="Exemple : décès chez 40 % des exposés et 20 % des non-exposés"
        head={["Mesure", "Calcul", "Valeur"]}
        rows={[
          ["Risque relatif", "0,40 / 0,20", "2,0"],
          ["Odds ratio", "(0,40 / 0,60) / (0,20 / 0,80)", "2,7"],
        ]}
      />
      <P>
        Dans ce cas, écrire « le risque de décès est multiplié par 2,7 » est faux : il est multiplié
        par 2. Dites « la cote du décès est multipliée par 2,7 », ou « le facteur est associé au
        décès (OR 2,7) ».
      </P>

      <H2 id="modele">Construire un modèle solide</H2>
      <H3>Choisir les variables</H3>
      <P>
        Introduisez les variables pertinentes cliniquement et celles associées à l'événement en
        analyse univariée (un seuil de p &lt; 0,20 est courant). Ne vous en remettez pas uniquement
        à une sélection pas à pas automatique : elle peut écarter un facteur de confusion connu.
      </P>
      <H3>Respecter le nombre d'événements</H3>
      <P>
        Comptez environ <strong>dix événements par variable</strong> introduite. Avec 45 décès,
        visez quatre à cinq variables au plus. Au-delà, les OR deviennent instables et leurs
        intervalles très larges.
      </P>
      <H3>Vérifier le modèle</H3>
      <List
        items={[
          <>
            <strong>Multicolinéarité</strong> : deux variables très liées (poids et IMC) se
            disputent le même effet. Le facteur d'inflation de la variance (VIF) aide à la repérer.
          </>,
          <>
            <strong>Calibration</strong> : le test de Hosmer-Lemeshow vérifie que les probabilités
            prédites correspondent aux fréquences observées (p &gt; 0,05 attendu).
          </>,
          <>
            <strong>Discrimination</strong> : l'aire sous la courbe ROC du modèle (AUC) mesure sa
            capacité à séparer les patients avec et sans événement.
          </>,
        ]}
      />

      <H2 id="rediger">Rédiger vos résultats</H2>
      <P>Une phrase de résultat complète donne le sens, la taille de l'effet et sa précision :</P>
      <Note>
        « En analyse multivariée, un score SAPS II supérieur à 40 (OR ajusté 3,4 ; IC 95 % 2,2 – 5,1
        ; p &lt; 0,001) et le recours à la ventilation mécanique (OR ajusté 2,1 ; IC 95 % 1,3 – 3,4
        ; p = 0,003) étaient indépendamment associés au décès à 90 jours. »
      </Note>
      <P>
        Dans votre tableau, une ligne par facteur, avec les colonnes : OR brut [IC 95 %], p, OR
        ajusté [IC 95 %], p. Indiquez la modalité de référence de chaque variable qualitative.
      </P>

      <H2 id="erreurs">Les contresens fréquents</H2>
      <List
        items={[
          "Lire un OR comme un risque relatif quand l'événement est fréquent.",
          "Conclure à une causalité : une étude observationnelle montre une association, pas un effet causal.",
          "Écrire « pas d'effet » quand l'intervalle de confiance contient 1.",
          "Oublier l'unité d'une variable quantitative, ce qui rend l'OR impossible à interpréter.",
          "Introduire quinze variables pour trente événements.",
          "Ne présenter que les OR ajustés significatifs, sans les autres variables du modèle.",
        ]}
      />
      <P>
        Avant de lancer votre modèle, vérifiez que votre base le permet : données manquantes,
        codages incohérents et doublons faussent les OR bien plus souvent qu'un mauvais choix de
        méthode.
      </P>
    </>
  );
}
