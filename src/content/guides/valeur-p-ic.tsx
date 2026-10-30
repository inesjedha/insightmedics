import { GuideLink } from "@/components/guides/GuideLink";
import { Figure, H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import { CiBySampleSize } from "@/components/guides/figures/ConfidenceIntervals";
import { AlphaInflation } from "@/components/guides/figures/PowerCurve";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "interpreter-valeur-p-intervalle-confiance-these",
  category: "statistiques",
  title: "Valeur de p et intervalle de confiance : interpréter sans se tromper",
  seoTitle: "Valeur de p et intervalle de confiance : bien interpréter",
  description:
    "Ce que veut dire un p, pourquoi non significatif ne veut pas dire sans effet, comment lire un IC 95 % et écrire vos p. Phrases justes et questions du jury.",
  keyword: "interpréter valeur de p intervalle de confiance",
  datePublished: "2026-10-30",
  readingMinutes: 8,
  shortAnswer:
    "La valeur de p est la probabilité d'observer une différence au moins aussi grande que celle de votre étude si, en réalité, il n'y avait aucune différence. Ce n'est pas la probabilité que l'hypothèse nulle soit vraie. Un p < 0,05 est dit significatif, mais ne dit rien de l'importance clinique. Un p ≥ 0,05 ne prouve pas l'absence d'effet. L'intervalle de confiance à 95 % donne l'ampleur de l'effet et sa précision : lisez-le toujours avec le p.",
  toc: [
    ["definition", "Ce que mesure vraiment la valeur de p"],
    ["significatif", "Significatif ne veut pas dire important"],
    ["non-significatif", "Non significatif ne veut pas dire sans effet"],
    ["ic", "L'intervalle de confiance à 95 %"],
    ["ecrire", "Comment écrire une valeur de p"],
    ["multiples", "Les tests multiples"],
    ["jury", "Répondre aux questions du jury"],
    ["phrases", "Phrases fausses, phrases justes"],
    ["erreurs", "Les erreurs fréquentes"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="definition">Ce que mesure vraiment la valeur de p</H2>
      <P>
        Tout test statistique part d'une <strong>hypothèse nulle</strong> (H0) : il n'y a pas de
        différence entre les groupes, ou pas d'association entre le facteur et l'événement. La
        valeur de p répond à une seule question : <em>si H0 était vraie</em>, quelle serait la
        probabilité d'observer, par le seul jeu du hasard de l'échantillonnage, une différence au
        moins aussi grande que celle que vous avez trouvée ?
      </P>
      <P>
        Un p de 0,03 signifie donc : si les deux groupes ne différaient pas réellement, une
        différence au moins aussi marquée que la vôtre apparaîtrait dans environ 3 % des études
        comme la vôtre. C'est peu : on juge alors H0 peu compatible avec les données.
      </P>
      <Note>
        La valeur de p n'est pas la probabilité que H0 soit vraie, ni la probabilité que votre
        résultat soit « dû au hasard », ni la probabilité de retrouver le même résultat dans une
        autre étude. Ces trois lectures sont fausses et reviennent souvent en soutenance.
      </Note>
      <H3>Le seuil de 0,05</H3>
      <P>
        Le seuil de 5 % (le risque alpha) est une convention : c'est le risque que vous acceptez de
        conclure à une différence qui n'existe pas. Il se fixe <strong>avant</strong> l'analyse, se
        déclare dans le Matériel et méthodes (« seuil de signification fixé à p &lt; 0,05, tests
        bilatéraux ») et ne se négocie plus ensuite. Le choix du test lui-même dépend de vos
        variables : voyez{" "}
        <GuideLink slug="quel-test-statistique-choisir-these-medecine">
          quel test statistique choisir
        </GuideLink>
        .
      </P>

      <H2 id="significatif">Significatif ne veut pas dire important</H2>
      <P>
        La valeur de p dépend de deux choses : la taille de l'effet et la taille de l'échantillon.
        Sur un très grand effectif, une différence minuscule devient significative.
      </P>
      <P>
        Par exemple, dans une étude fictive de 5 000 patients par groupe, une différence de pression
        artérielle systolique de 1 mmHg (écart-type de 15 mmHg) donne un p &lt; 0,001, avec un IC 95
        % de la différence allant de 0,4 à 1,6 mmHg. Le résultat est très significatif
        statistiquement et sans intérêt clinique : aucun clinicien ne changerait sa pratique pour 1
        mmHg.
      </P>
      <P>
        La question à vous poser après un p &lt; 0,05 est donc toujours : l'effet mesuré, et la
        borne la plus prudente de son intervalle de confiance, sont-ils cliniquement importants ?
      </P>

      <H2 id="non-significatif">Non significatif ne veut pas dire sans effet</H2>
      <P>
        C'est le contresens le plus fréquent dans les thèses. Un p ≥ 0,05 signifie que vos données
        ne permettent pas de rejeter H0. Il ne démontre pas que H0 est vraie. L'absence de preuve
        n'est pas la preuve de l'absence.
      </P>
      <P>
        Exemple fictif : on compare deux pansements chez 60 patients par groupe. La cicatrisation à
        3 mois est obtenue chez 45 patients (75,0 %) avec le pansement A et 36 patients (60,0 %)
        avec le pansement B. La différence est de 15 points, mais le Chi² de Pearson donne p =
        0,079.
      </P>
      <Table
        caption="Même différence de 15 points, deux tailles d'échantillon (exemple fictif)"
        head={["Effectif par groupe", "A contre B", "Différence [IC 95 %]", "p"]}
        rows={[
          ["60", "75,0 % contre 60,0 %", "15,0 points [−1,5 ; 31,5]", "0,079"],
          ["240", "75,0 % contre 60,0 %", "15,0 points [6,7 ; 23,3]", "< 0,001"],
        ]}
      />
      <Figure
        caption="Figure 1. La même différence de 15 points : avec 60 patients par groupe, l'intervalle contient 0 ; avec 240, il l'exclut"
        source="Exemple fictif de ce guide : cicatrisation à 3 mois de 75,0 % (pansement A) contre 60,0 % (pansement B). Carré : différence observée ; trait : IC 95 %."
      >
        <CiBySampleSize />
      </Figure>
      <P>
        Avec 60 patients par groupe, l'intervalle va de −1,5 à 31,5 points : il est compatible avec
        une absence de différence, mais aussi avec un bénéfice de plus de 30 points. L'étude manque
        de <strong>puissance</strong>. Avec quatre fois plus de patients, la même différence devient
        significative. C'est tout l'intérêt de{" "}
        <GuideLink slug="calculer-taille-echantillon-these-medecine">
          calculer la taille de l'échantillon
        </GuideLink>{" "}
        avant de commencer.
      </P>
      <H3>Pas de « tendance »</H3>
      <P>
        N'écrivez jamais qu'un p de 0,06 ou 0,08 montre « une tendance » ou un résultat «
        marginalement significatif ». Le seuil a été fixé à 0,05 : au-dessus, la différence n'est
        pas significative. Rapportez l'effet, son intervalle de confiance et le p exact, sans
        l'enjoliver. Vous pourrez discuter, dans la Discussion, d'un possible manque de puissance.
      </P>

      <H2 id="ic">L'intervalle de confiance à 95 %</H2>
      <P>
        L'intervalle de confiance à 95 % (IC 95 %) donne la fourchette des valeurs de l'effet
        compatibles avec vos données. Lecture rigoureuse : si l'on répétait l'étude un grand nombre
        de fois, 95 % des intervalles ainsi calculés contiendraient la vraie valeur. Il apporte deux
        informations que le p ne donne pas :
      </P>
      <List
        items={[
          <>
            <strong>L'ampleur de l'effet</strong> : la valeur centrale et les bornes disent si
            l'effet est faible, modéré ou important.
          </>,
          <>
            <strong>La précision</strong> : un intervalle large traduit un effectif faible ou une
            grande variabilité. Multiplier l'effectif par quatre divise sa largeur environ par deux
            (de 33 à 16,6 points dans le tableau ci-dessus).
          </>,
        ]}
      />
      <H3>Le lien avec le p</H3>
      <P>
        Lorsque l'intervalle et le test reposent sur la même méthode, ils concluent dans le même
        sens. Tout dépend de la <strong>valeur de « non-effet »</strong> :
      </P>
      <Table
        caption="Lire un IC 95 % selon la mesure de l'effet"
        head={["Mesure", "Valeur de non-effet", "Significatif au seuil de 5 % si l'IC…"]}
        rows={[
          ["Différence de moyennes ou de pourcentages", "0", "ne contient pas 0"],
          ["Odds ratio, risque relatif, hazard ratio", "1", "ne contient pas 1"],
        ]}
      />
      <P>
        Dans l'exemple des pansements, le risque relatif de cicatrisation vaut 1,25 avec un IC 95 %
        de 0,97 à 1,61 : l'intervalle contient 1, ce qui concorde avec p = 0,079. Pour la lecture
        détaillée des odds ratios, voyez notre guide sur la{" "}
        <GuideLink slug="regression-logistique-interpreter-odds-ratio-these">
          régression logistique et l'odds ratio
        </GuideLink>
        .
      </P>

      <H2 id="ecrire">Comment écrire une valeur de p</H2>
      <Table
        caption="Écrire un p dans le texte et les tableaux"
        head={["À écrire", "À éviter", "Pourquoi"]}
        rows={[
          ["p = 0,032", "p = .032 ; p=0,03", "Virgule décimale, espaces, trois décimales"],
          ["p < 0,001", "p = 0,000", "Un p n'est jamais nul : SPSS affiche ,000 quand p < 0,0005"],
          ["p = 0,412", "NS ; p > 0,05", "Donnez la valeur exacte, même non significative"],
          [
            "p = 0,032 avec l'effet et son IC",
            "p = 0,032 seul",
            "Le p ne dit ni le sens ni l'ampleur de l'effet",
          ],
        ]}
      />
      <List
        items={[
          "Gardez le même nombre de décimales dans toute la thèse : trois pour les p est l'usage le plus courant.",
          "Si SPSS affiche ,050, affichez davantage de décimales (en double-cliquant sur la cellule du tableau de résultats) avant de conclure : 0,0496 et 0,0504 ne mènent pas à la même conclusion.",
          "Beaucoup de thèses mettent en gras les p inférieurs à 0,05 : suivez l'usage de votre faculté et de votre directeur, et tenez-vous-y.",
          "Indiquez le test utilisé, dans le texte du Matériel et méthodes ou en note sous le tableau.",
        ]}
      />

      <H2 id="multiples">Les tests multiples</H2>
      <P>
        Quand aucune différence n'existe, chaque test réalisé au seuil de 5 % a 5 % de risque de
        donner un faux positif. Si vous comparez 20 variables entre deux groupes qui ne diffèrent en
        réalité sur aucune, la probabilité d'obtenir au moins un p &lt; 0,05 est d'environ 64 % (1 −
        0,95²⁰, pour des tests indépendants). Un résultat significatif isolé, au milieu de vingt
        comparaisons, est donc à lire avec prudence.
      </P>
      <Figure
        caption="Figure 2. Plus on multiplie les tests, plus un faux positif devient probable : 64,2 % de risque avec 20 comparaisons"
        source="Probabilité d'obtenir au moins un p < 0,05 alors qu'aucune différence n'existe, 1 − 0,95ⁿ pour n tests indépendants au seuil de 5 %."
      >
        <AlphaInflation />
      </Figure>
      <List
        items={[
          "Définissez un objectif principal et un critère de jugement principal avant l'analyse : c'est sur lui que porte la conclusion.",
          "Présentez les objectifs secondaires comme tels, et les analyses non prévues comme exploratoires.",
          "Ne cherchez pas de sous-groupes après coup jusqu'à trouver un p < 0,05.",
          "Une correction existe, celle de Bonferroni (seuil divisé par le nombre de tests : 0,05 / 20 = 0,0025). Ne l'appliquez que si elle est prévue avec votre directeur, et annoncez-la dans le Matériel et méthodes.",
        ]}
      />

      <H2 id="jury">Répondre aux questions du jury</H2>
      <H3>« Que signifie votre p = 0,03 ? »</H3>
      <P>
        « Si les deux groupes ne différaient pas réellement, nous aurions eu environ 3 % de chances
        d'observer une différence au moins aussi grande. Nous avons donc conclu à une différence
        significative au seuil de 5 %. »
      </P>
      <H3>« Votre facteur n'est pas significatif : il n'a donc aucun rôle ? »</H3>
      <P>
        « Non. Nos données ne permettent pas de conclure. L'intervalle de confiance va de […] à […]
        : il reste compatible avec un effet cliniquement important. Notre effectif n'avait pas été
        calculé pour mettre en évidence cette différence. »
      </P>
      <H3>« Votre différence est significative : est-elle importante ? »</H3>
      <P>
        Répondez par l'ampleur de l'effet et la borne prudente de l'intervalle, comparées à ce qui
        compte pour le patient : « La différence est de […], au minimum de […] selon l'intervalle de
        confiance, ce qui correspond à […] en pratique. »
      </P>
      <H3>« Pourquoi 0,05 ? »</H3>
      <P>
        « C'est le seuil conventionnel, fixé avant l'analyse : il correspond au risque accepté de 5
        % de conclure à tort à une différence. »
      </P>

      <H2 id="phrases">Phrases fausses, phrases justes</H2>
      <Table
        caption="Corriger les formulations les plus fréquentes"
        head={["Phrase fausse", "Phrase juste"]}
        rows={[
          [
            "« p = 0,03 : il y a 3 % de chances que l'hypothèse nulle soit vraie. »",
            "« La différence était significative (p = 0,030). »",
          ],
          [
            "« Il n'y a pas de différence entre les deux groupes (p = 0,41). »",
            "« Aucune différence significative n'a été mise en évidence entre les deux groupes (p = 0,410). »",
          ],
          [
            "« On note une tendance à la significativité (p = 0,07). »",
            "« La différence n'était pas significative (p = 0,070). »",
          ],
          [
            "« Le résultat est hautement significatif (p = 0,000). »",
            "« La différence était significative (p < 0,001). »",
          ],
          [
            "« Les deux traitements sont équivalents (p = 0,62). »",
            "« Aucune différence significative n'a été mise en évidence (p = 0,620). »",
          ],
          [
            "« Le diabète triple le risque de complication (p = 0,001). »",
            "« Le diabète était associé à la survenue d'une complication (OR 3,86 ; IC 95 % 1,65 – 9,01 ; p = 0,001). »",
          ],
        ]}
      />
      <Note>
        Phrase type pour un résultat non significatif : « Le taux de cicatrisation à 3 mois était de
        75,0 % avec le pansement A contre 60,0 % avec le pansement B, sans différence significative
        (différence de 15,0 points ; IC 95 % −1,5 à 31,5 ; p = 0,079). »
      </Note>

      <H2 id="erreurs">Les erreurs fréquentes</H2>
      <List
        items={[
          "Lire le p comme la probabilité que l'hypothèse nulle soit vraie.",
          "Conclure à l'absence d'effet, ou à l'équivalence, parce que p ≥ 0,05.",
          "Parler de « tendance » pour un p entre 0,05 et 0,10.",
          "Recopier le ,000 de SPSS au lieu d'écrire p < 0,001.",
          "Donner un p sans l'effet mesuré ni son intervalle de confiance.",
          "Confondre significativité statistique et importance clinique.",
          "Multiplier les tests et ne rapporter que ceux qui sont significatifs.",
          "Écrire « hautement significatif » : un p plus petit ne veut pas dire un effet plus grand.",
          "Utiliser un vocabulaire causal (« entraîne », « protège », « favorise ») dans une étude observationnelle.",
        ]}
      />
    </>
  );
}
