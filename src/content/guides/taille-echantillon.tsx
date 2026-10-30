import { GuideLink } from "@/components/guides/GuideLink";
import { Figure, H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import { PowerCurve, PrecisionCurve } from "@/components/guides/figures/PowerCurve";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "calculer-taille-echantillon-these-medecine",
  category: "statistiques",
  title: "Calculer la taille d'échantillon de sa thèse de médecine",
  seoTitle: "Taille d'échantillon de thèse : calcul et exemples",
  description:
    "Combien de patients pour votre thèse ? Risque alpha, puissance, effet attendu : les formules, des exemples chiffrés et la phrase type du M&M.",
  keyword: "calcul nombre de sujets nécessaires thèse",
  datePublished: "2026-10-30",
  readingMinutes: 8,
  shortAnswer:
    "Le nombre de sujets nécessaires se calcule avant le recueil, à partir de quatre ingrédients : le risque alpha (5 %), la puissance (80 % en général), l'effet attendu (prévalence supposée ou différence cliniquement pertinente) et la variabilité de la mesure. Pour estimer une prévalence de 30 % à ± 5 points près, il faut 323 patients. Si l'effectif est imposé, comme dans une étude rétrospective, on calcule la précision ou la puissance obtenue, et on l'écrit.",
  toc: [
    ["pourquoi", "Pourquoi calculer la taille d'échantillon"],
    ["ingredients", "Les ingrédients du calcul"],
    ["proportion", "Estimer une proportion (étude descriptive)"],
    ["comparaison", "Comparer deux groupes"],
    ["ajustements", "Perdus de vue et dossiers inexploitables"],
    ["retrospective", "Effectif imposé : l'étude rétrospective"],
    ["multivarie", "Prévoir une régression logistique"],
    ["outils", "Les outils et la phrase du M&M"],
    ["erreurs", "Les erreurs fréquentes"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="pourquoi">Pourquoi calculer la taille d'échantillon</H2>
      <P>
        « Combien de patients faut-il pour ma thèse ? » La réponse n'est ni « le plus possible », ni
        « une centaine, c'est bien ». Elle dépend de ce que vous cherchez à montrer. Un effectif
        trop petit expose à un résultat non significatif alors qu'une différence réelle existe :
        c'est un manque de <strong>puissance</strong>. Votre travail ne permet alors pas de
        conclure, quelle que soit la qualité du recueil.
      </P>
      <P>
        Le jury le sait. Une question revient souvent en soutenance : « Votre effectif était-il
        suffisant pour répondre à votre objectif ? » Un calcul fait avant le recueil, ou à défaut
        une estimation honnête de la précision obtenue, vous permet d'y répondre en une phrase.
      </P>
      <Note>
        Le calcul porte toujours sur l'<strong>objectif principal</strong>. Les objectifs
        secondaires n'entrent pas dans le calcul : leurs résultats sont exploratoires.
      </Note>

      <H2 id="ingredients">Les ingrédients du calcul</H2>
      <P>
        Quelle que soit la formule, vous aurez besoin des mêmes éléments. Les valeurs d'effet et de
        variabilité ne s'inventent pas : elles viennent de la littérature, d'une étude pilote ou des
        données de votre service, et vous devez pouvoir citer leur source.
      </P>
      <Table
        caption="Les paramètres d'un calcul de taille d'échantillon"
        head={["Paramètre", "Ce que c'est", "Valeur habituelle"]}
        rows={[
          [
            "Risque alpha (α)",
            "Risque de conclure à une différence qui n'existe pas (faux positif)",
            "5 %, test bilatéral : Z = 1,96",
          ],
          [
            "Puissance (1 − β)",
            "Probabilité de détecter la différence si elle existe vraiment",
            "80 % (Z = 0,84) ou 90 % (Z = 1,28)",
          ],
          [
            "Effet attendu",
            "Différence minimale cliniquement pertinente entre les groupes",
            "Tirée de la littérature ou de l'avis clinique",
          ],
          [
            "Variabilité",
            "Écart-type d'une mesure quantitative",
            "Publications, étude pilote, données du service",
          ],
          [
            "Prévalence attendue",
            "Fréquence supposée de l'événement (étude descriptive)",
            "Publications ; 50 % si aucune donnée",
          ],
          [
            "Précision (d)",
            "Demi-largeur souhaitée de l'IC 95 %",
            "± 5 points en général, moins si l'événement est rare",
          ],
        ]}
      />
      <P>
        Retenez une règle de bon sens : plus l'effet cherché est petit, ou plus la mesure est
        variable, plus il faut de patients. Diviser par deux la différence attendue multiplie
        l'effectif nécessaire par quatre environ.
      </P>

      <H3>Où trouver les valeurs</H3>
      <List
        items={[
          "Une étude publiée sur une population proche de la vôtre (même type de patients, même contexte de soins) : prévalence, taux d'événement, écart-type.",
          "Une étude pilote ou les données d'une année du service, relevées sur quelques dizaines de dossiers.",
          "L'avis clinique de votre encadrant pour la différence minimale qui changerait la pratique : c'est elle qui compte, pas la différence que vous espérez trouver.",
        ]}
      />
      <P>
        Citez la source de chaque valeur dans votre M&M. Un écart-type tiré d'une population très
        différente peut fausser le calcul du simple au double.
      </P>

      <H2 id="proportion">Estimer une proportion (étude descriptive)</H2>
      <P>
        Votre objectif est de décrire une fréquence : la prévalence d'une complication, le taux de
        succès d'une technique, la proportion de patients bien contrôlés. La formule est :
      </P>
      <Note>
        <strong>n = Z² × p × (1 − p) / d²</strong>, avec Z = 1,96 pour un IC 95 %, p la prévalence
        attendue et d la précision souhaitée, toutes deux exprimées en proportion (0,30 pour 30 %,
        0,05 pour ± 5 points).
      </Note>
      <P>
        Par exemple, vous estimez la proportion de diabétiques de type 2 dont l'HbA1c est supérieure
        à 7 %. La littérature suggère environ 30 %. Pour une précision de ± 5 points : n = 1,96² ×
        0,30 × 0,70 / 0,05² = 3,8416 × 0,21 / 0,0025 = 322,7. On arrondit toujours à l'entier
        supérieur : <strong>323 patients</strong>.
      </P>
      <Table
        caption="Nombre de patients pour estimer une proportion (IC 95 %), exemples illustratifs"
        head={["Prévalence attendue", "Précision souhaitée", "Patients nécessaires"]}
        rows={[
          ["50 % (aucune donnée)", "± 5 points", "385"],
          ["30 %", "± 5 points", "323"],
          ["30 %", "± 7 points", "165"],
          ["20 %", "± 5 points", "246"],
          ["10 %", "± 3 points", "385"],
          ["5 %", "± 2 points", "457"],
        ]}
      />
      <P>
        Prendre p = 50 % donne l'effectif maximal : c'est le choix prudent quand aucune donnée
        n'existe. À l'inverse, pour un événement rare, une précision de ± 5 points n'a pas de sens :
        estimer une prévalence de 5 % « entre 0 et 10 % » n'apprend rien. Choisissez alors une
        précision plus fine, de l'ordre de la moitié de la prévalence attendue ou moins.
      </P>
      <Figure
        caption="Figure 1. La précision s'améliore vite au début, puis lentement : passer de ± 7 à ± 5 points demande presque deux fois plus de patients"
        source="Demi-largeur de l'IC 95 % d'une proportion, 1,96 × √[p(1 − p) / n] ; points repris du tableau ci-dessus."
      >
        <PrecisionCurve />
      </Figure>

      <H2 id="comparaison">Comparer deux groupes</H2>
      <P>
        Votre objectif principal compare un critère entre deux groupes indépendants : traités contre
        non traités, deux techniques chirurgicales, patients avec et sans un facteur. Le calcul
        donne un effectif <strong>par groupe</strong>, pour des groupes de même taille. Le test
        prévu doit être cohérent avec celui de l'analyse (voir{" "}
        <GuideLink slug="quel-test-statistique-choisir-these-medecine">
          quel test statistique choisir
        </GuideLink>
        ).
      </P>
      <H3>Deux proportions</H3>
      <P>
        Formule simplifiée, par groupe : n = (Zα + Zβ)² × [p1(1 − p1) + p2(1 − p2)] / (p1 − p2)².
        Avec α = 5 % bilatéral et une puissance de 80 %, (1,96 + 0,84)² ≈ 7,85.
      </P>
      <P>
        Exemple fictif : une nouvelle technique doit réduire le taux d'infection du site opératoire
        de 30 % à 15 %. n = 7,85 × (0,30 × 0,70 + 0,15 × 0,85) / 0,15² = 7,85 × 0,3375 / 0,0225 ≈
        117,7, soit <strong>118 patients par groupe</strong>, 236 au total.
      </P>
      <P>
        Les logiciels proposent des variantes de cette formule (variance commune, correction de
        continuité). Pour le même exemple, ils donnent entre 118 et environ 135 patients par groupe
        selon la méthode. Aucune n'est fausse : indiquez simplement celle que vous avez utilisée.
      </P>
      <H3>Deux moyennes</H3>
      <P>
        Formule par groupe : n = 2 × (Zα + Zβ)² × σ² / Δ², où σ est l'écart-type de la mesure et Δ
        la différence de moyennes que vous voulez détecter.
      </P>
      <P>
        Exemple fictif : détecter une différence de pression artérielle systolique de 10 mmHg entre
        deux traitements, avec un écart-type de 20 mmHg tiré de la littérature. n = 2 × 7,85 × 20² /
        10² = 62,8, soit 63 patients par groupe. G*Power, qui utilise la loi de Student au lieu de
        l'approximation normale, donne <strong>64 patients par groupe</strong>. Cet écart de un ou
        deux patients est normal.
      </P>
      <Table
        caption="Patients par groupe selon la différence attendue et la puissance (deux moyennes, écart-type 20 mmHg, formule simplifiée)"
        head={["Différence attendue", "Puissance 80 %", "Puissance 90 %"]}
        rows={[
          ["20 mmHg", "16", "22"],
          ["10 mmHg", "63", "85"],
          ["5 mmHg", "252", "337"],
        ]}
      />

      <H3>Groupes de tailles inégales</H3>
      <P>
        Si un groupe est naturellement plus petit (deux témoins pour un cas, par exemple),
        l'effectif total augmente. Pour deux moyennes, avec k fois plus de patients dans le second
        groupe : n1 = (1 + 1/k) × (Zα + Zβ)² × σ² / Δ², puis n2 = k × n1. Dans l'exemple précédent,
        avec k = 2 : n1 = 1,5 × 7,85 × 400 / 100 ≈ 47,1, soit 48 patients dans le premier groupe et
        96 dans le second, 144 au total contre 126 avec des groupes égaux.
      </P>
      <P>
        Dans une étude cas-témoins, augmenter le nombre de témoins par cas améliore la puissance
        quand les cas sont rares, mais le gain devient faible au-delà de quatre témoins par cas.
      </P>

      <H2 id="ajustements">Perdus de vue et dossiers inexploitables</H2>
      <P>
        Le nombre calculé est celui des patients <strong>analysables</strong>. Si vous prévoyez
        qu'une partie sera perdue de vue, ou que certains dossiers seront incomplets, augmentez
        l'effectif à recruter :
      </P>
      <Note>
        <strong>n à recruter = n calculé / (1 − taux de perte prévu)</strong>
      </Note>
      <P>
        Avec 64 patients par groupe et 15 % de perdus de vue attendus : 64 / 0,85 = 75,3, soit 76
        patients par groupe. Multiplier par 1,15 donnerait 74 : c'est une erreur fréquente, qui
        laisse un effectif analysable trop faible. Pour l'étude descriptive à 323 patients, avec 10
        % de dossiers inexploitables : 323 / 0,9 = 358,9, soit 359 dossiers à relever.
      </P>

      <H2 id="retrospective">Effectif imposé : l'étude rétrospective</H2>
      <P>
        C'est le cas le plus fréquent en thèse : vous incluez tous les dossiers d'un service sur une
        période donnée. L'effectif n'est pas choisi, il est constaté. Dans ce cas, n'inventez pas un
        calcul « a priori » après coup pour justifier le chiffre obtenu : un jury attentif le
        repère, et c'est méthodologiquement faux. Écrivez que le recrutement a été exhaustif sur la
        période, puis renseignez honnêtement ce que cet effectif permet.
      </P>
      <H3>Pour une étude descriptive : la précision obtenue</H3>
      <P>
        On inverse la formule : d = 1,96 × √[p(1 − p) / n]. Par exemple, 150 dossiers et une
        prévalence observée de 20 % (30 patients) : d = 1,96 × √(0,20 × 0,80 / 150) ≈ 0,064, soit
        une précision d'environ ± 6,4 points. L'IC 95 % de Wilson, que vous rapporterez dans les
        résultats, va de 14,4 % à 27,1 %.
      </P>
      <H3>Pour une comparaison : la puissance pour une différence fixée à l'avance</H3>
      <P>
        Vous disposez de 80 patients par groupe et la différence cliniquement pertinente est de 30 %
        contre 15 %. La puissance obtenue est d'environ 62 à 64 % selon la méthode de calcul, contre
        80 % habituellement visés. Autrement formulé : avec cet effectif, seule une différence
        d'environ 15 % contre 34 %, ou plus grande, serait détectée avec une puissance de 80 %.
      </P>
      <Figure
        caption="Figure 2. Puissance pour détecter une baisse de l'infection de 30 % à 15 %, selon le nombre de patients par groupe"
        source="Exemple fictif de ce guide : α = 5 % bilatéral, formule simplifiée présentée plus haut. Les logiciels donnent 62 à 64 % pour 80 patients par groupe selon la méthode."
      >
        <PowerCurve />
      </Figure>
      <Note>
        Ne calculez pas une « puissance a posteriori » à partir de la différence observée dans vos
        résultats : elle découle directement de la valeur de p et n'apporte aucune information. La
        différence qui sert au calcul doit être fixée sur un critère clinique, indépendamment de vos
        résultats.
      </Note>
      <P>
        Un résultat non significatif obtenu avec une puissance faible se discute avec prudence :
        l'absence de différence n'est pas démontrée, et l'intervalle de confiance de l'effet observé
        dit mieux que la valeur de p ce que vos données permettent d'exclure. Pour organiser le
        recueil lui-même, consultez notre guide sur l'
        <GuideLink slug="etude-retrospective-dossiers-base-donnees-these">
          étude rétrospective sur dossiers
        </GuideLink>
        .
      </P>

      <H2 id="multivarie">Prévoir une régression logistique</H2>
      <P>
        Si votre objectif est de rechercher les facteurs associés à un événement par{" "}
        <GuideLink slug="regression-logistique-interpreter-odds-ratio-these">
          régression logistique
        </GuideLink>
        , la contrainte principale n'est pas le nombre de patients mais le nombre d'
        <strong>événements</strong>. Le repère habituel est d'environ dix événements par variable
        introduite dans le modèle (une variable qualitative à k modalités compte pour k − 1). On
        compte la modalité la moins fréquente de l'issue : les décès si la mortalité est de 25 %,
        les survivants si elle était de 80 %.
      </P>
      <P>
        Par exemple, vous voulez tester cinq facteurs et la mortalité attendue est de 25 %. Il faut
        5 × 10 = 50 décès, donc 50 / 0,25 = <strong>200 patients</strong>. Avec 120 patients, vous
        n'auriez que 30 décès environ : le modèle devrait se limiter à trois variables.
      </P>
      <P>
        Ce repère est discuté dans la littérature méthodologique : ce n'est ni une loi ni une
        garantie. En dessous, entre cinq et neuf événements par variable, un modèle reste possible
        mais doit être présenté comme exploratoire. Avec très peu d'événements (quelques-uns
        seulement), on renonce au modèle multivarié et on se limite à une description et à des tests
        exacts.
      </P>

      <H2 id="outils">Les outils et la phrase du M&M</H2>
      <Table
        caption="Outils courants pour le calcul de taille d'échantillon"
        head={["Outil", "Atouts", "À savoir"]}
        rows={[
          [
            "G*Power",
            "Gratuit ; moyennes, proportions, corrélations, régressions",
            "Demande une taille d'effet ; bien lire les options du test choisi",
          ],
          [
            "OpenEpi",
            "Gratuit, en ligne ; proportions, cohortes, cas-témoins",
            "Affiche plusieurs méthodes côte à côte : citez celle retenue",
          ],
          [
            "SPSS (versions récentes)",
            "Menu d'analyse de puissance intégré (à partir de la version 27)",
            "Absent des versions antérieures, encore répandues",
          ],
          [
            "Formules dans Excel",
            "Transparent, facile à vérifier",
            "Limité aux cas simples présentés ici",
          ],
        ]}
      />
      <P>
        Dans G*Power, l'exemple des deux moyennes se règle ainsi : famille « t tests », test «
        Means: Difference between two independent means (two groups) », analyse « A priori », test
        bilatéral, taille d'effet d = 0,5 (10 / 20), α = 0,05, puissance 0,80, rapport des groupes
        1. Le logiciel affiche 64 patients par groupe, 128 au total. La taille d'effet d est la
        différence attendue divisée par l'écart-type.
      </P>
      <P>
        Dans la partie Matériel et méthodes, le calcul figure dans la population d'étude, avec tous
        ses paramètres, pour qu'un lecteur puisse le refaire (voir{" "}
        <GuideLink slug="rediger-analyse-statistique-materiel-methodes-these">
          rédiger l'analyse statistique du M&M
        </GuideLink>
        ). Deux formulations selon votre situation :
      </P>
      <Note>
        Calcul a priori : « Le nombre de sujets nécessaires a été calculé pour mettre en évidence
        une diminution du taux d'infection du site opératoire de 30 % à 15 %, avec un risque alpha
        de 5 % en situation bilatérale et une puissance de 80 %. Il était de 118 patients par
        groupe, porté à 132 pour tenir compte d'environ 10 % de dossiers inexploitables. »
      </Note>
      <Note>
        Effectif imposé : « Aucun calcul de taille d'échantillon n'a été réalisé a priori : tous les
        patients répondant aux critères d'inclusion sur la période d'étude ont été inclus
        (recrutement exhaustif). Avec 150 patients, la prévalence de [l'événement] pouvait être
        estimée avec une précision d'environ ± 6,4 points. »
      </Note>

      <H2 id="erreurs">Les erreurs fréquentes</H2>
      <List
        items={[
          "Présenter comme « a priori » un calcul fait après le recueil pour justifier l'effectif obtenu.",
          "Ajuster la différence attendue jusqu'à tomber sur le nombre de dossiers disponibles.",
          "Calculer l'effectif sur un objectif secondaire, ou sur un autre critère que celui de l'analyse principale.",
          "Confondre précision absolue et relative : ± 5 points de pourcentage n'est pas ± 5 % de la valeur.",
          "Choisir un test unilatéral pour réduire l'effectif sans justification clinique.",
          "Prendre un écart-type ou une prévalence sans source, ou issus d'une population très différente.",
          "Multiplier par (1 + taux de perte) au lieu de diviser par (1 − taux de perte).",
          "Oublier la règle des dix événements par variable quand l'objectif est une analyse multivariée.",
          "Calculer une puissance a posteriori avec la différence observée.",
        ]}
      />
      <P>
        Un calcul de taille d'échantillon tient en quelques lignes, mais chaque paramètre doit être
        justifié. Préparez-le avec votre encadrant avant le recueil : c'est à ce moment-là qu'il
        oriente vraiment votre travail.
      </P>
    </>
  );
}
