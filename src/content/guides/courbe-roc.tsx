import { GuideLink } from "@/components/guides/GuideLink";
import { Figure, H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import { ConfusionMatrix } from "@/components/guides/figures/ConfusionMatrix";
import { PrevalenceCurve, RocCurve } from "@/components/guides/figures/RocCurve";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "courbe-roc-seuil-optimal-these",
  category: "statistiques",
  title: "Courbe ROC et seuil optimal : le guide pour votre thèse",
  seoTitle: "Courbe ROC, AUC et seuil optimal : le guide pour sa thèse",
  description:
    "Sensibilité, spécificité, VPP, VPN, aire sous la courbe et indice de Youden : faire une courbe ROC sous SPSS et rédiger vos résultats. Exemple chiffré.",
  keyword: "courbe ROC seuil optimal thèse",
  datePublished: "2026-10-30",
  readingMinutes: 9,
  shortAnswer:
    "La courbe ROC représente la sensibilité d'un test en fonction de 1 − spécificité, pour tous les seuils possibles. L'aire sous la courbe (AUC) résume sa capacité à distinguer malades et non-malades : 0,5 correspond au hasard, 1 à une discrimination parfaite. Donnez-la avec son IC 95 %. Le seuil optimal se choisit le plus souvent par l'indice de Youden (sensibilité + spécificité − 1), ou selon un seuil publié.",
  toc: [
    ["indicateurs", "Sensibilité, spécificité, VPP et VPN"],
    ["courbe", "Construire et lire la courbe ROC"],
    ["auc", "L'aire sous la courbe (AUC)"],
    ["seuil", "Choisir le seuil optimal"],
    ["exemple", "Un exemple chiffré complet"],
    ["comparer", "Comparer deux marqueurs"],
    ["spss", "Faire la courbe ROC sous SPSS"],
    ["rediger", "Rédiger le M&M et les Résultats"],
    ["erreurs", "Les erreurs fréquentes"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="indicateurs">Sensibilité, spécificité, VPP et VPN</H2>
      <P>
        Évaluer un test diagnostique, c'est confronter son résultat (positif ou négatif) à la
        vérité, établie par un examen de référence : l'anatomopathologie, l'imagerie, l'évolution.
        On range les patients dans un tableau à quatre cases : vrais positifs (VP), faux positifs
        (FP), faux négatifs (FN) et vrais négatifs (VN).
      </P>
      <Table
        caption="Les quatre indicateurs d'un test diagnostique"
        head={["Indicateur", "Formule", "Question à laquelle il répond"]}
        rows={[
          [
            "Sensibilité (Se)",
            "VP / (VP + FN)",
            "Chez les malades, quelle part le test détecte-t-il ?",
          ],
          [
            "Spécificité (Sp)",
            "VN / (VN + FP)",
            "Chez les non-malades, quelle part le test classe-t-il négatifs ?",
          ],
          [
            "Valeur prédictive positive (VPP)",
            "VP / (VP + FP)",
            "Si le test est positif, quelle est la probabilité d'être malade ?",
          ],
          [
            "Valeur prédictive négative (VPN)",
            "VN / (VN + FN)",
            "Si le test est négatif, quelle est la probabilité de ne pas l'être ?",
          ],
        ]}
      />
      <P>
        La sensibilité et la spécificité décrivent le test lui-même. Les valeurs prédictives
        décrivent ce que vaut un résultat pour le patient en face de vous : ce sont elles qui
        intéressent le clinicien, mais elles sont plus fragiles.
      </P>
      <Figure
        caption="Figure 1. Lire un tableau 2 × 2 : la sensibilité et la spécificité se lisent en colonne, les valeurs prédictives en ligne"
        source="Exemple fictif de ce guide : 150 enfants, dont 60 appendicites, CRP au seuil de 30 mg/L."
      >
        <ConfusionMatrix />
      </Figure>
      <H3>Pourquoi VPP et VPN dépendent de la prévalence</H3>
      <P>
        Un même test, avec la même sensibilité et la même spécificité, n'a pas la même VPP aux
        urgences d'un CHU et en consultation de ville. Plus la maladie est rare, plus les faux
        positifs pèsent lourd parmi les tests positifs, et plus la VPP chute. Avec une sensibilité
        de 85,0 % et une spécificité de 75,6 % (les valeurs de l'exemple plus bas) :
      </P>
      <Table
        caption="Même test, prévalences différentes (calcul par le théorème de Bayes)"
        head={["Prévalence de la maladie", "VPP", "VPN"]}
        rows={[
          ["40 %", "69,9 %", "88,3 %"],
          ["10 %", "27,9 %", "97,8 %"],
          ["2 %", "6,6 %", "99,6 %"],
        ]}
      />
      <Figure
        caption="Figure 2. À sensibilité et spécificité égales, la VPP s'effondre quand la maladie devient rare"
        source="Sensibilité 85,0 % et spécificité 75,6 % fixes ; VPP et VPN calculées par le théorème de Bayes pour chaque prévalence. Les points sont ceux du tableau ci-dessus."
      >
        <PrevalenceCurve />
      </Figure>
      <P>
        Conséquence directe :{" "}
        <strong>VPP et VPN ne se calculent pas dans une étude cas-témoins</strong>. Si vous avez
        recruté 50 malades et 50 témoins, la « prévalence » de 50 % de votre échantillon est fixée
        par vous, pas par la réalité. Les valeurs prédictives qui en découleraient ne veulent rien
        dire. Donnez-les seulement si votre échantillon reflète la population visée (patients
        consécutifs, recrutement exhaustif sur une période).
      </P>

      <H2 id="courbe">Construire et lire la courbe ROC</H2>
      <P>
        Quand le test est une mesure continue (CRP, troponine, score clinique), chaque seuil donne
        un couple sensibilité-spécificité différent. Abaisser le seuil augmente la sensibilité mais
        diminue la spécificité, et inversement. La courbe ROC (
        <em>receiver operating characteristic</em>) montre ce compromis pour tous les seuils à la
        fois :
      </P>
      <List
        items={[
          "en abscisse : 1 − spécificité (la proportion de faux positifs chez les non-malades) ;",
          "en ordonnée : la sensibilité ;",
          "chaque point de la courbe correspond à un seuil ;",
          "la diagonale représente un test qui ne fait pas mieux que le hasard.",
        ]}
      />
      <P>
        Plus la courbe se rapproche du coin supérieur gauche (sensibilité de 100 %, aucun faux
        positif), meilleur est le test. Une courbe collée à la diagonale signale un marqueur sans
        valeur diagnostique.
      </P>

      <H2 id="auc">L'aire sous la courbe (AUC)</H2>
      <P>
        L'aire sous la courbe (AUC, ou ASC en français) résume la courbe en un nombre entre 0 et 1.
        Elle a une lecture simple : c'est la probabilité qu'un malade tiré au hasard ait une valeur
        du marqueur plus élevée qu'un non-malade tiré au hasard. Une AUC de 0,80 signifie que le
        marqueur classe correctement 8 paires malade/non-malade sur 10.
      </P>
      <P>Présentez toujours l'AUC avec :</P>
      <List
        items={[
          <>
            son <strong>intervalle de confiance à 95 %</strong>, qui dit avec quelle précision elle
            est estimée ;
          </>,
          <>
            la <strong>valeur de p</strong> du test qui la compare à 0,5 (le hasard). Un p &lt; 0,05
            dit seulement que le marqueur fait mieux que le hasard, pas qu'il est bon.
          </>,
        ]}
      />
      <Table
        caption="Une grille de lecture usuelle de l'AUC (Hosmer et Lemeshow)"
        head={["AUC", "Discrimination"]}
        rows={[
          ["0,5", "Nulle (équivalent du hasard)"],
          ["0,5 à 0,7", "Faible"],
          ["0,7 à 0,8", "Acceptable"],
          ["0,8 à 0,9", "Excellente"],
          ["0,9 et plus", "Exceptionnelle"],
        ]}
      />
      <Note>
        D'autres grilles existent, avec des bornes et des mots un peu différents. Choisissez-en une,
        citez sa référence dans votre Matériel et méthodes, et tenez-vous-y dans toute la thèse.
      </Note>

      <H2 id="seuil">Choisir le seuil optimal</H2>
      <H3>L'indice de Youden</H3>
      <P>
        La méthode la plus utilisée en thèse est l'indice de Youden :{" "}
        <strong>J = sensibilité + spécificité − 1</strong>. On le calcule pour chaque seuil et on
        retient celui qui le maximise. Il donne le même poids aux faux positifs et aux faux
        négatifs. Sur la courbe, c'est le point le plus éloigné de la diagonale.
      </P>
      <H3>Les alternatives</H3>
      <List
        items={[
          <>
            <strong>Un seuil publié</strong> : si une recommandation ou une étude de référence
            propose un seuil, testez-le. Vos résultats seront comparables à la littérature.
          </>,
          <>
            <strong>Priorité à la sensibilité</strong> : pour un dépistage, ou pour écarter un
            diagnostic grave, mieux vaut ne rater presque aucun malade. On choisit alors le seuil
            qui donne, par exemple, une sensibilité d'au moins 90 %, quitte à perdre en spécificité.
          </>,
          <>
            <strong>Priorité à la spécificité</strong> : pour confirmer un diagnostic avant un
            traitement lourd, on cherche au contraire à limiter les faux positifs.
          </>,
        ]}
      />
      <P>
        Le choix doit être annoncé dans le Matériel et méthodes et justifié cliniquement. Un seuil «
        rond » choisi sans raison n'est pas défendable devant le jury.
      </P>

      <H2 id="exemple">Un exemple chiffré complet</H2>
      <P>
        Prenons une étude fictive : 150 enfants admis consécutivement aux urgences pour douleur
        abdominale aiguë, dont 60 ont une appendicite confirmée (prévalence de 40 %). On évalue la
        CRP à l'admission. Le tableau ci-dessous donne, pour quelques seuils, la sensibilité, la
        spécificité et l'indice de Youden.
      </P>
      <Table
        caption="Performances de la CRP selon le seuil (étude fictive, N = 150)"
        head={["Seuil (CRP ≥)", "Sensibilité", "Spécificité", "1 − spécificité", "Youden (J)"]}
        rows={[
          ["10 mg/L", "96,7 %", "42,2 %", "57,8 %", "0,389"],
          ["20 mg/L", "91,7 %", "61,1 %", "38,9 %", "0,528"],
          [
            <strong key="s">30 mg/L</strong>,
            "85,0 %",
            "75,6 %",
            "24,4 %",
            <strong key="j">0,606</strong>,
          ],
          ["50 mg/L", "70,0 %", "87,8 %", "12,2 %", "0,578"],
          ["80 mg/L", "45,0 %", "95,6 %", "4,4 %", "0,406"],
        ]}
      />
      <P>
        L'indice de Youden est maximal au seuil de 30 mg/L. Voici le tableau 2 × 2 correspondant :
      </P>
      <Table
        caption="Tableau 2 × 2 au seuil de 30 mg/L"
        head={["", "Appendicite (n = 60)", "Pas d'appendicite (n = 90)", "Total"]}
        rows={[
          ["CRP ≥ 30 mg/L", "51 (VP)", "22 (FP)", "73"],
          ["CRP < 30 mg/L", "9 (FN)", "68 (VN)", "77"],
          ["Total", "60", "90", "150"],
        ]}
      />
      <List
        items={[
          "Sensibilité = 51 / 60 = 85,0 % (IC 95 % 73,9 – 91,9).",
          "Spécificité = 68 / 90 = 75,6 % (IC 95 % 65,8 – 83,3).",
          "VPP = 51 / 73 = 69,9 %.",
          "VPN = 68 / 77 = 88,3 %.",
          "Youden = 0,850 + 0,756 − 1 = 0,606.",
        ]}
      />
      <P>
        Supposons que SPSS donne une AUC de 0,874 (IC 95 % 0,812 – 0,936 ; p &lt; 0,001). La
        discrimination est excellente selon la grille ci-dessus. Les intervalles de confiance de la
        sensibilité et de la spécificité sont ici calculés par la méthode de Wilson, adaptée aux
        proportions. Les VPP et VPN sont interprétables parce que les patients sont consécutifs :
        dans un cas-témoins, on s'arrêterait à la sensibilité et à la spécificité.
      </P>
      <Figure
        caption="Figure 3. Courbe ROC de la CRP : chaque point est un seuil, le seuil de Youden est le plus éloigné de la diagonale"
        source="Exemple fictif de ce guide : 150 enfants, dont 60 appendicites. Courbe empirique construite pour passer par les cinq seuils du tableau, avec une aire de 0,874."
      >
        <RocCurve />
      </Figure>
      <P>
        Si l'objectif était de ne manquer aucune appendicite, le seuil de 20 mg/L (sensibilité 91,7
        %) serait plus logique, au prix de davantage de faux positifs (spécificité 61,1 %).
      </P>

      <H2 id="comparer">Comparer deux marqueurs</H2>
      <P>
        Vous voulez savoir si la CRP fait mieux que le taux de leucocytes, mesuré chez les mêmes
        enfants ? Comparer les deux AUC « à l'œil », ou vérifier si leurs intervalles de confiance
        se chevauchent, ne suffit pas. Les deux mesures viennent des mêmes patients : leurs AUC sont
        corrélées. Le test adapté est le <strong>test de DeLong</strong>, qui tient compte de cet
        appariement et donne une valeur de p pour la différence entre les deux aires.
      </P>
      <P>
        Sur la figure, superposez les deux courbes, une couleur par marqueur, avec la diagonale en
        pointillés et l'AUC de chaque courbe dans la légende.
      </P>

      <H2 id="spss">Faire la courbe ROC sous SPSS</H2>
      <List
        ordered
        items={[
          "Vérifiez le codage de la variable d'état (le diagnostic de référence) : par exemple 1 = appendicite, 0 = pas d'appendicite.",
          "Ouvrez le menu Analyse > Courbe ROC (selon la version, il peut se trouver sous Analyse > Classification).",
          "Placez le marqueur (CRP) en variable de test et le diagnostic en variable d'état. Indiquez la valeur de la variable d'état qui désigne les malades (ici 1).",
          "Cochez l'affichage de la courbe ROC, la ligne de référence diagonale, l'erreur standard avec l'intervalle de confiance, et les points de coordonnées de la courbe.",
          "Dans les options, vérifiez le sens du test : par défaut, une valeur plus élevée est considérée comme plus en faveur de la maladie. Pour un marqueur qui baisse chez les malades (albumine, plaquettes), inversez ce réglage.",
          "Lisez le tableau de l'aire sous la courbe : l'aire, son erreur standard, la signification asymptotique (le p contre 0,5) et l'intervalle de confiance à 95 %.",
          "Copiez le tableau des coordonnées dans Excel, ajoutez une colonne Sensibilité − (1 − Spécificité) : la valeur maximale désigne le seuil de Youden.",
          "Pour le tableau 2 × 2, créez une variable binaire (CRP ≥ 30 ou non) par recodage, puis croisez-la avec le diagnostic dans un tableau croisé.",
        ]}
      />
      <Note>
        SPSS propose comme seuils les valeurs situées à mi-chemin entre deux valeurs observées (par
        exemple 29,5 mg/L). Retenez un seuil cliniquement utilisable et recalculez la sensibilité et
        la spécificité à ce seuil exact, par le tableau croisé.
      </Note>
      <P>
        La procédure Courbe ROC classique ne compare pas deux aires entre elles. Les versions
        récentes de SPSS proposent une procédure d'analyse ROC qui permet la comparaison de deux
        courbes mesurées chez les mêmes patients : vérifiez ce que propose votre version.
      </P>

      <H2 id="rediger">Rédiger le M&M et les Résultats</H2>
      <P>
        Dans la partie Analyse statistique du Matériel et méthodes, une ou deux phrases suffisent.
        Pour l'ensemble de ce paragraphe, voyez notre guide pour{" "}
        <GuideLink slug="rediger-analyse-statistique-materiel-methodes-these">
          rédiger l'analyse statistique du Matériel et méthodes
        </GuideLink>
        .
      </P>
      <Note>
        « La capacité de la CRP à l'admission à distinguer les enfants avec et sans appendicite a
        été évaluée par l'aire sous la courbe ROC (ASC), présentée avec son intervalle de confiance
        à 95 % (IC 95 %) et interprétée selon la grille de Hosmer et Lemeshow (réf.). Le seuil
        optimal a été celui qui maximisait l'indice de Youden (sensibilité + spécificité − 1). La
        sensibilité, la spécificité et les valeurs prédictives ont été calculées à ce seuil. »
      </Note>
      <P>Dans les Résultats, sans commentaire ni comparaison à la littérature :</P>
      <Note>
        « L'ASC de la CRP pour le diagnostic d'appendicite aiguë était de 0,874 (IC 95 % 0,812 –
        0,936 ; p &lt; 0,001). Le seuil optimal selon l'indice de Youden était de 30 mg/L, avec une
        sensibilité de 85,0 % (IC 95 % 73,9 – 91,9), une spécificité de 75,6 % (IC 95 % 65,8 –
        83,3), une valeur prédictive positive de 69,9 % et une valeur prédictive négative de 88,3 %.
        »
      </Note>
      <P>
        Pour la mise en forme de la figure et du tableau des performances, suivez les règles de
        notre guide pour{" "}
        <GuideLink slug="presenter-resultats-these-tableaux-figures">
          présenter les résultats de votre thèse
        </GuideLink>
        .
      </P>

      <H2 id="erreurs">Les erreurs fréquentes</H2>
      <List
        items={[
          "Choisir le seuil sur les données de l'étude sans le dire. Un seuil de Youden calculé sur votre échantillon y est forcément flatteur : annoncez-le et citez ce point dans les limites.",
          "Obtenir une AUC inférieure à 0,5 et l'interpréter. C'est presque toujours une variable inversée : mauvais sens du test dans les options, ou codage de la variable d'état à l'envers.",
          "Calculer une VPP et une VPN dans une étude cas-témoins.",
          "Prendre un p < 0,05 pour une preuve de bonne performance : une AUC de 0,62 peut être significative sur un grand effectif et rester faible.",
          "Comparer deux marqueurs mesurés chez les mêmes patients par le chevauchement des intervalles, au lieu du test de DeLong.",
          "Donner la sensibilité et la spécificité sans intervalle de confiance, ou sans préciser le seuil.",
          "Oublier les patients sans valeur du marqueur : précisez l'effectif réellement analysé.",
        ]}
      />
      <P>
        La courbe ROC ne sert pas qu'aux marqueurs biologiques : elle mesure aussi la discrimination
        d'un score ou d'un modèle de{" "}
        <GuideLink slug="regression-logistique-interpreter-odds-ratio-these">
          régression logistique
        </GuideLink>
        . Les mêmes règles de lecture et de rédaction s'appliquent.
      </P>
    </>
  );
}
