import { GuideLink } from "@/components/guides/GuideLink";
import { H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "rediger-analyse-statistique-materiel-methodes-these",
  category: "rediger",
  title: "Rédiger la partie « Analyse statistique » du Matériel et méthodes",
  seoTitle: "Rédiger l'analyse statistique du Matériel et méthodes",
  description:
    "Logiciel, description des variables, normalité, tests et conditions, OR, modèle multivarié, seuil, données manquantes : le plan et un modèle à adapter.",
  keyword: "analyse statistique matériel et méthodes thèse",
  datePublished: "2026-10-30",
  readingMinutes: 10,
  shortAnswer:
    "La partie « Analyse statistique » du Matériel et méthodes décrit ce qui a réellement été fait, dans cet ordre : logiciel et version, description des variables quantitatives et qualitatives, vérification de la normalité, tests de comparaison avec leurs conditions, mesures d'association (OR et IC 95 %), analyse multivariée et règle de sélection des variables, seuil de signification, gestion des données manquantes. Chaque analyse des Résultats doit y être annoncée, et aucune autre.",
  toc: [
    ["place", "Sa place dans le Matériel et méthodes"],
    ["ordre", "Le contenu obligatoire, dans l'ordre"],
    ["description", "Logiciel, description et normalité"],
    ["comparaisons", "Les tests et leurs conditions"],
    ["multivarie", "Association et analyse multivariée"],
    ["modele", "Un modèle complet à adapter"],
    ["variantes", "Les variantes selon le type d'étude"],
    ["coherence", "La cohérence avec les Résultats"],
    ["erreurs", "Les erreurs fréquentes"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="place">Sa place dans le Matériel et méthodes</H2>
      <P>
        L'analyse statistique est l'une des dernières sous-parties du Matériel et méthodes
        (M&amp;M). Elle vient après le type et le cadre de l'étude, la population, le recueil des
        données, les variables étudiées et les critères de jugement, et avant les considérations
        éthiques. Son rôle : permettre à un lecteur de refaire vos calculs à partir de votre base.
      </P>
      <P>
        Son numéro et la forme de son titre dépendent de votre faculté : chiffres romains ou arabes,
        capitales ou non, deux-points final ou non. Par exemple, la Faculté de médecine de Sfax
        impose une numérotation exclusivement en chiffres arabes, sans « : » après les titres. Avant
        de numéroter, vérifiez les règles de votre faculté dans notre guide{" "}
        <GuideLink slug="mise-en-forme-these-medecine-tunisie">
          mise en forme de la thèse de médecine en Tunisie
        </GuideLink>
        .
      </P>
      <P>
        Le registre est celui de tout le M&amp;M : verbes au passé, tournures impersonnelles (« ont
        été comparées », « a été retenu »), jamais « nous avons choisi ».
      </P>

      <H2 id="ordre">Le contenu obligatoire, dans l'ordre</H2>
      <P>
        Suivez toujours le même ordre, du plus simple au plus complexe. Le jury retrouve ainsi
        chaque information à sa place, et vous n'oubliez rien.
      </P>
      <Table
        caption="Les huit éléments de la partie « Analyse statistique »"
        head={["Élément", "Ce qu'il faut écrire"]}
        rows={[
          ["1. Logiciel", "Nom exact et version du logiciel réellement utilisé"],
          ["2. Description", "Comment sont résumées les variables quantitatives et qualitatives"],
          ["3. Normalité", "Le test ou la méthode utilisés pour juger la distribution"],
          ["4. Comparaisons", "Chaque test, avec la condition qui le fait choisir"],
          ["5. Association", "Odds ratio (OR) et son intervalle de confiance à 95 % (IC 95 %)"],
          [
            "6. Analyse multivariée",
            "Type de modèle, règle de sélection des variables, méthode, vérification du modèle",
          ],
          ["7. Seuil de signification", "p < 0,05, tests bilatéraux (en général)"],
          ["8. Données manquantes", "Comment elles ont été traitées"],
        ]}
      />
      <P>
        Vous pouvez y ajouter un tableau « Plan de l'analyse statistique », qui relie chaque partie
        des Résultats aux outils utilisés. Nous y revenons plus bas : c'est le moyen le plus simple
        de vérifier la cohérence entre M&amp;M et Résultats.
      </P>

      <H2 id="description">Logiciel, description et normalité</H2>
      <H3>Le logiciel</H3>
      <P>
        Déclarez le logiciel <strong>que vous avez réellement utilisé</strong>, avec sa version : «
        IBM SPSS Statistics, version 26 », par exemple. SPSS est le plus courant chez les étudiants
        tunisiens ; un autre logiciel convient tout autant, à condition de le déclarer avec sa
        version, qui figure dans le menu « Aide ». Si la saisie a été faite sous Excel, vous pouvez
        le préciser.
      </P>
      <H3>La description des variables</H3>
      <List
        items={[
          <>
            <strong>Variables quantitatives</strong> : moyenne ± écart-type (avec les extrêmes) si
            la distribution est normale, médiane [Q1–Q3] dans le cas contraire.
          </>,
          <>
            <strong>Variables qualitatives</strong> : effectif et pourcentage, n (%), calculés sur
            les données disponibles.
          </>,
        ]}
      />
      <H3>La vérification de la normalité</H3>
      <P>
        Nommez le test : Shapiro-Wilk, ou Kolmogorov-Smirnov avec correction de Lilliefors. SPSS
        donne les deux dans le menu Explorer. Pour une comparaison, la normalité se vérifie{" "}
        <strong>dans chaque groupe</strong>, pas sur l'échantillon entier. Un histogramme et la
        comparaison moyenne/médiane complètent utilement le test, surtout sur un très petit ou un
        très grand effectif.
      </P>

      <H2 id="comparaisons">Les tests et leurs conditions</H2>
      <P>
        Pour chaque test, écrivez <strong>la condition</strong> qui l'a fait choisir. C'est ce qui
        rend votre méthode vérifiable. Si vous hésitez sur le test lui-même, consultez notre guide{" "}
        <GuideLink slug="quel-test-statistique-choisir-these-medecine">
          quel test statistique choisir
        </GuideLink>
        .
      </P>
      <Table
        caption="Les tests usuels et la condition à annoncer"
        head={["Situation", "Test", "Condition à écrire"]}
        rows={[
          [
            "Qualitative, groupes indépendants",
            "Chi² de Pearson (sans correction de Yates)",
            "Tous les effectifs théoriques ≥ 5",
          ],
          [
            "Qualitative, petits effectifs",
            "Test exact de Fisher",
            "Au moins un effectif théorique < 5",
          ],
          [
            "Quantitative, 2 groupes",
            "t de Student, ou Welch",
            "Distribution normale dans les deux groupes ; Welch si le test de Levene montre des variances inégales",
          ],
          ["Quantitative, 2 groupes", "U de Mann-Whitney", "Distribution non normale"],
          [
            "Quantitative, 3 groupes ou plus",
            "ANOVA, ou Kruskal-Wallis",
            "ANOVA si normale dans tous les groupes, Kruskal-Wallis sinon",
          ],
          [
            "Deux variables quantitatives",
            "Corrélation de Pearson, ou de Spearman",
            "Pearson si les deux sont normales et la relation linéaire",
          ],
        ]}
      />
      <P>
        L'effectif théorique est celui qu'on attendrait en l'absence de toute différence. Exemple
        fictif : 70 patients, 40 dans le groupe A et 30 dans le groupe B, 8 complications au total.
        L'effectif théorique de complications dans le groupe B vaut 30 × 8 / 70 = 3,4. Il est
        inférieur à 5 : le test exact de Fisher s'impose, même si les effectifs observés semblent
        corrects.
      </P>
      <Note>
        Dans la sortie de SPSS, retenez la ligne du Chi² de Pearson, et non celle de la correction
        pour continuité (Yates). Pour le test t, SPSS affiche deux lignes, variances égales et
        variances inégales (Welch) : le test de Levene, donné dans le même tableau, vous dit
        laquelle lire.
      </Note>

      <H2 id="multivarie">Association et analyse multivariée</H2>
      <H3>Odds ratio et intervalle de confiance</H3>
      <P>
        Quand vous cherchez des facteurs associés à un événement binaire (décès, complication,
        récidive), annoncez que la force de l'association a été exprimée par l'odds ratio (OR) avec
        son IC 95 %, et que l'association est significative lorsque l'intervalle ne contient pas 1.
        Si vous avez utilisé le test exact de Fisher, l'IC calculé par la méthode exacte est le plus
        cohérent avec le p.
      </P>
      <H3>Le modèle multivarié et sa règle de sélection</H3>
      <P>
        C'est l'oubli le plus fréquent. Le M&amp;M doit dire <strong>quelles variables</strong> sont
        entrées dans le modèle et <strong>selon quelle règle</strong> :
      </P>
      <List
        items={[
          "Le type de modèle : régression logistique binaire pour un événement oui/non, régression linéaire pour une variable continue, modèle de Cox pour un délai jusqu'à un événement.",
          "Le seuil d'entrée : variables significatives en univarié (p < 0,05), ou p < 0,20 ; les deux se rencontrent, l'important est de l'écrire.",
          "Les variables forcées dans le modèle pour leur intérêt clinique (âge, sexe, gravité), le cas échéant.",
          "La méthode : toutes les variables à la fois (méthode « Entrée » de SPSS) ou sélection pas à pas descendante, avec son critère de sortie (par exemple p > 0,10).",
          "La vérification du modèle : test de Hosmer-Lemeshow pour la régression logistique.",
        ]}
      />
      <P>
        Règle de prudence : comptez environ <strong>dix événements par variable</strong> introduite.
        Exemple fictif : 120 patients dont 30 décès autorisent trois variables. Au-delà, annoncez le
        modèle comme exploratoire. Pour la lecture des OR ajustés, voir notre guide{" "}
        <GuideLink slug="regression-logistique-interpreter-odds-ratio-these">
          régression logistique et odds ratio
        </GuideLink>
        .
      </P>
      <H3>Seuil de signification et données manquantes</H3>
      <P>
        Le seuil s'écrit en une phrase : « Le seuil de signification a été fixé à p &lt; 0,05 pour
        des tests bilatéraux. » Pour les données manquantes, la solution la plus simple et la plus
        fréquente est l'analyse sur les données disponibles, variable par variable, avec le
        dénominateur affiché dès qu'il diffère de l'effectif total (« 34/48 »). Le modèle
        multivarié, lui, ne porte que sur les patients complets pour toutes ses variables : indiquez
        leur nombre dans les Résultats. N'imputez aucune valeur sans l'annoncer.
      </P>

      <H2 id="modele">Un modèle complet à adapter</H2>
      <P>
        Voici un paragraphe type pour une étude analytique classique, qui compare deux groupes puis
        recherche des facteurs associés. Remplacez les mots entre crochets et supprimez toute phrase
        qui décrit une analyse que vous n'avez pas faite.
      </P>
      <Note>
        « Les données ont été saisies sur Microsoft Excel puis analysées avec le logiciel [IBM SPSS
        Statistics, version 26]. Les variables quantitatives ont été exprimées en moyenne ±
        écart-type, avec leurs valeurs extrêmes, lorsque leur distribution était normale selon le
        test de Shapiro-Wilk, et en médiane avec premier et troisième quartiles [Q1–Q3] dans le cas
        contraire. Les variables qualitatives ont été exprimées en effectifs et en pourcentages,
        calculés sur les données disponibles. Les variables qualitatives ont été comparées par le
        test du Chi² de Pearson lorsque tous les effectifs théoriques étaient supérieurs ou égaux à
        5, et par le test exact de Fisher dans le cas contraire. Les variables quantitatives de
        distribution normale dans les deux groupes ont été comparées par le test t de Student, ou
        par le test de Welch en cas de variances inégales (test de Levene) ; les variables de
        distribution non normale, par le test U de Mann-Whitney. La force de l'association a été
        exprimée par l'odds ratio (OR) avec son intervalle de confiance à 95 % (IC 95 %) ; un OR
        supérieur à 1 signifie que [l'événement] est plus fréquent en présence du facteur. Les
        variables associées à [l'événement] avec un p &lt; [0,05] en analyse univariée ont été
        introduites dans un modèle de régression logistique binaire [méthode Entrée], afin de
        rechercher les facteurs indépendamment associés à [l'événement]. Les résultats ont été
        exprimés en OR ajustés (ORa) avec leur IC 95 %. L'adéquation du modèle a été vérifiée par le
        test de Hosmer-Lemeshow. Les données manquantes n'ont pas été remplacées : les analyses ont
        porté sur les données disponibles. Le seuil de signification a été fixé à p &lt; 0,05 pour
        des tests bilatéraux. »
      </Note>

      <H2 id="variantes">Les variantes selon le type d'étude</H2>
      <H3>Étude descriptive seule</H3>
      <P>
        Pas de comparaison, donc pas de test : n'en citez aucun. Gardez le logiciel, la description
        des variables, la normalité (elle décide entre moyenne et médiane) et les données
        manquantes. Ajoutez l'intervalle de confiance de la proportion principale. Exemple fictif :
        42 complications sur 120 patients, soit 35,0 % [IC 95 % : 27,1–43,9] par la méthode de
        Wilson.
      </P>
      <Note>
        « La fréquence de [l'événement] a été accompagnée de son intervalle de confiance à 95 %,
        calculé par la méthode de Wilson. L'étude étant descriptive, aucun test de comparaison n'a
        été réalisé. »
      </Note>
      <H3>Étude diagnostique</H3>
      <P>
        Annoncez le test de référence, puis la sensibilité, la spécificité et leurs IC 95 %. Les
        valeurs prédictives positive et négative ne s'annoncent que si la fréquence de la maladie
        dans votre échantillon reflète celle de la population visée, jamais dans un recrutement de
        type cas-témoins. Pour une mesure continue, ajoutez la courbe ROC, l'aire sous la courbe
        (ASC) avec son IC 95 % et la méthode de choix du seuil (indice de Youden ou seuil publié).
        Le détail est dans notre guide{" "}
        <GuideLink slug="courbe-roc-seuil-optimal-these">
          courbe ROC et seuil optimal
        </GuideLink>
        .
      </P>
      <H3>Données appariées</H3>
      <P>
        Quand les mêmes patients sont mesurés deux fois (avant et après un traitement), annoncez des
        tests appariés : t de Student pour séries appariées si les différences individuelles suivent
        une loi normale, test des rangs signés de Wilcoxon sinon, test de McNemar pour une variable
        binaire. Dans une étude cas-témoins appariée, l'analyse doit aussi respecter l'appariement
        (McNemar en univarié, régression logistique conditionnelle en multivarié) : faites valider
        ce choix par votre encadrant.
      </P>
      <Note>
        « Les valeurs avant et après [le traitement] ont été comparées par le test t de Student pour
        séries appariées lorsque les différences individuelles suivaient une loi normale, et par le
        test des rangs signés de Wilcoxon dans le cas contraire. Les proportions mesurées deux fois
        chez les mêmes patients ont été comparées par le test de McNemar. »
      </Note>

      <H2 id="coherence">La cohérence avec les Résultats</H2>
      <P>
        La règle tient en deux phrases. Chaque analyse présentée dans les Résultats est annoncée
        dans le M&amp;M. Chaque méthode annoncée dans le M&amp;M a son résultat dans les Résultats.
        Un jury repère vite un Kaplan-Meier annoncé et jamais montré, ou un modèle multivarié qui
        surgit dans les Résultats sans avoir été décrit.
      </P>
      <P>
        L'outil le plus sûr est un tableau « Plan de l'analyse statistique », placé dans le M&amp;M,
        avec une ligne par partie des Résultats :
      </P>
      <Table
        caption="Exemple de plan de l'analyse statistique (étude fictive)"
        head={["Partie des résultats", "Question posée", "Outils statistiques"]}
        rows={[
          [
            "Analyse descriptive",
            "Qui sont les patients ?",
            "Moyenne ± écart-type ou médiane [Q1–Q3] ; n (%)",
          ],
          [
            "Objectif principal",
            "Quelle est la fréquence des complications ?",
            "Proportion et IC 95 % (Wilson)",
          ],
          [
            "Facteurs associés",
            "Quels facteurs sont liés aux complications ?",
            "Chi², Fisher, Student, Mann-Whitney ; OR et IC 95 %",
          ],
          [
            "Analyse multivariée",
            "Quels facteurs restent associés après ajustement ?",
            "Régression logistique binaire ; ORa et IC 95 % ; Hosmer-Lemeshow",
          ],
        ]}
      />
      <P>
        Relisez ce tableau après avoir fini les Résultats : ajoutez ce qui manque, retirez ce qui
        n'a pas été fait.
      </P>

      <H2 id="erreurs">Les erreurs fréquentes</H2>
      <List
        items={[
          "Citer un test qui n'a pas été utilisé, par copier-coller d'une autre thèse (ANOVA, Kaplan-Meier ou kappa « au cas où »).",
          "Déclarer un logiciel qu'on n'a pas utilisé, ou sans sa version.",
          "Oublier la règle de sélection des variables du modèle multivarié : seuil d'entrée, variables forcées, méthode.",
          "Écrire « tests paramétriques et non paramétriques selon le cas » sans dire quel cas mène à quel test.",
          "Annoncer le Chi² sans dire quand le test exact de Fisher le remplace.",
          "Annoncer la moyenne ± écart-type pour toutes les variables quantitatives, y compris très asymétriques (durées de séjour, CRP).",
          "Passer sous silence les données manquantes, ou les compter comme « non ».",
          "Écrire au futur ou au présent (« seront comparées ») un M&M de travail déjà réalisé.",
        ]}
      />
      <P>
        Une partie « Analyse statistique » juste se rédige mieux une fois l'analyse terminée : elle
        décrit ce qui a été fait, pas ce qui était prévu. Si votre protocole annonçait d'autres
        méthodes, mettez-la à jour avec votre encadrant.
      </P>
    </>
  );
}
