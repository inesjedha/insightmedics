import { GuideLink } from "@/components/guides/GuideLink";
import { Figure, H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import { SlideBeforeAfter, TimePlan } from "@/components/guides/figures/SlideSketch";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "presentation-soutenance-these-medecine",
  category: "rediger",
  title: "Réussir sa présentation de soutenance de thèse de médecine",
  seoTitle: "Présentation de soutenance de thèse de médecine : conseils",
  description:
    "Durée, nombre de diapositives, plan type, tableaux lisibles, figures, répétitions, questions du jury : préparer une soutenance de thèse de médecine claire.",
  keyword: "présentation soutenance thèse médecine",
  datePublished: "2026-10-30",
  readingMinutes: 8,
  shortAnswer:
    "Une bonne présentation de soutenance tient dans le temps fixé par le jury, avec environ une diapositive par minute de parole. Elle suit le plan de la thèse : contexte, objectifs, méthodes, résultats clés, discussion, conclusion. Chaque diapositive porte une seule idée, écrite dans son titre. Les tableaux de la thèse sont réduits aux lignes qui portent le message. Répétez à voix haute, chronomètre en main, et préparez les questions sur la méthode, les p, les biais et les limites.",
  toc: [
    ["duree", "Durée et nombre de diapositives"],
    ["plan", "Le plan type"],
    ["une-idee", "Une idée par diapositive"],
    ["tableaux", "D'un tableau de thèse à une diapositive"],
    ["lisibilite", "Figures, police et contraste"],
    ["repetitions", "Répéter et minuter"],
    ["questions", "Préparer les questions du jury"],
    ["erreurs", "Les erreurs fréquentes"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="duree">Durée et nombre de diapositives</H2>
      <P>
        Le temps de présentation n'est pas le même partout : il est fixé par votre faculté et par le
        président du jury. Avant de construire la moindre diapositive, demandez-le à votre directeur
        de thèse ou au service des thèses. Tout le reste en découle.
      </P>
      <P>
        Une fois ce temps connu, un repère simple aide à calibrer :{" "}
        <strong>environ une diapositive par minute de parole</strong>, sans compter la page de titre
        et les remerciements. Une diapositive de résultats chargée peut demander deux minutes ; une
        diapositive de transition, vingt secondes. Au-delà de ce rythme, vous lirez vos diapositives
        au lieu de les commenter.
      </P>
      <Note>
        Visez une présentation qui tient en 90 % du temps accordé lors de vos répétitions. Le jour
        de la soutenance, le trac, une question d'organisation ou un projecteur capricieux
        consomment toujours une ou deux minutes.
      </Note>

      <H2 id="plan">Le plan type</H2>
      <P>
        La présentation suit le plan de votre thèse, mais pas ses proportions : les résultats et
        leur discussion occupent la moitié du temps, l'introduction et les méthodes sont resserrées.
        Exemple pour un temps de parole de 15 minutes, à adapter à celui qui vous est accordé :
      </P>
      <Table
        caption="Exemple de répartition pour 15 minutes de présentation"
        head={["Partie", "Diapositives", "Temps", "Contenu"]}
        rows={[
          ["Titre", "1", "30 s", "Titre exact, nom, directeur, faculté, date"],
          [
            "Contexte",
            "2 à 3",
            "2 min",
            "Le problème, son poids chiffré, ce qu'on ne sait pas encore",
          ],
          ["Objectifs", "1", "30 s", "Objectif principal, puis objectifs secondaires"],
          [
            "Méthodes",
            "2 à 3",
            "2 min 30",
            "Type d'étude, lieu, période, critères, critère de jugement, analyse statistique",
          ],
          [
            "Résultats clés",
            "5 à 7",
            "5 min 30",
            "Diagramme de flux, population, objectif principal, facteurs associés",
          ],
          [
            "Discussion",
            "2 à 3",
            "2 min 30",
            "Comparaison à la littérature, points forts, limites",
          ],
          ["Conclusion", "1", "1 min", "Message principal, recommandations, perspectives"],
          ["Remerciements", "1", "30 s", "Bref, sans liste de noms interminable"],
        ]}
      />
      <Figure
        caption="Figure 1. Pour 15 minutes de parole, les résultats et la discussion prennent 8 minutes"
        source="Répartition du tableau ci-dessus, partie par partie, sur une frise de 15 minutes."
      >
        <TimePlan />
      </Figure>
      <P>
        Total : 15 à 20 diapositives pour 15 minutes. Les méthodes doivent permettre au jury de
        juger vos résultats : une diapositive sur la population et le recueil, une sur le critère de
        jugement principal et l'analyse statistique suffisent souvent. Ne recopiez pas la partie{" "}
        <GuideLink slug="rediger-analyse-statistique-materiel-methodes-these">
          « Analyse statistique » du Matériel et méthodes
        </GuideLink>{" "}
        : citez les tests principaux et le seuil de signification.
      </P>

      <H2 id="une-idee">Une idée par diapositive</H2>
      <P>
        Chaque diapositive répond à une seule question. Le moyen le plus efficace de s'y tenir :
        écrire le message <strong>dans le titre</strong>, sous forme de phrase, plutôt qu'un
        intitulé de rubrique.
      </P>
      <Table
        caption="Titre de rubrique ou titre-message"
        head={["À éviter", "À préférer"]}
        rows={[
          ["Résultats (3)", "Le diabète était plus fréquent en cas de récidive"],
          ["Population", "120 patients inclus sur 4 ans, dont 64 % d'hommes"],
          ["Analyse multivariée", "Deux facteurs restaient associés au décès après ajustement"],
        ]}
      />
      <P>
        Le corps de la diapositive apporte ensuite la preuve : un chiffre, un tableau réduit, une
        figure. Si vous ne trouvez pas de phrase-titre, c'est souvent que la diapositive mélange
        deux idées : coupez-la en deux. Les chiffres du titre doivent être ceux de la thèse, à la
        décimale près.
      </P>

      <H2 id="tableaux">D'un tableau de thèse à une diapositive</H2>
      <P>
        Un tableau de thèse est fait pour être lu ; une diapositive, pour être vue en quelques
        secondes. Recopier un tableau de quinze lignes en police 10 est l'erreur la plus fréquente.
        Transformez-le en quatre étapes :
      </P>
      <List
        ordered
        items={[
          "Gardez les lignes qui portent le message : le critère principal, les associations significatives, éventuellement une variable attendue par le jury même si elle n'est pas significative.",
          "Supprimez les colonnes secondaires : statistique du test, effectifs intermédiaires, notes de bas de tableau.",
          "Arrondissez pour la lecture, sans changer les valeurs : un pourcentage à une décimale, un p à trois décimales.",
          "Mettez en évidence le résultat clé (gras ou couleur) et renvoyez le reste à une diapositive de réserve.",
        ]}
      />
      <P>
        Exemple fictif : un tableau de thèse compare douze caractéristiques entre 20 patients avec
        récidive et 40 sans récidive. Une seule est significative : le diabète, présent chez 9
        patients sur 20 (45,0 %) contre 5 sur 40 (12,5 %), p = 0,009 (test exact de Fisher). La
        diapositive peut se limiter à cette ligne, avec un diagramme en barres à deux barres, et une
        mention discrète : « Âge, sexe, tabagisme, HTA et autres antécédents : différence non
        significative ».
      </P>
      <Figure
        caption="Figure 2. La même diapositive de résultats, avant et après réduction du tableau"
        source="Exemple fictif de ce guide : diabète chez 9 patients sur 20 avec récidive contre 5 sur 40 sans récidive. Le tableau de la première diapositive est figuré, sans données."
      >
        <SlideBeforeAfter />
      </Figure>
      <P>
        Pour choisir entre tableau et figure dans la thèse elle-même, voir notre guide{" "}
        <GuideLink slug="presenter-resultats-these-tableaux-figures">
          présenter les résultats en tableaux et figures
        </GuideLink>
        .
      </P>

      <H2 id="lisibilite">Figures, police et contraste</H2>
      <H3>Les figures</H3>
      <List
        items={[
          "Une figure par diapositive, avec des étiquettes lisibles du fond de la salle.",
          "Barres plutôt que secteurs dès qu'il y a plus de trois modalités ; jamais d'effet 3D.",
          "Axes titrés avec leur unité ; effectifs indiqués (n = 60).",
          "Figures refaites à la taille de la diapositive, plutôt qu'une capture d'écran floue de la thèse.",
        ]}
      />
      <H3>La police et le contraste</H3>
      <P>
        Choisissez une police sans empattement (Arial, Calibri) et gardez-la partout. Repères
        courants : 28 à 36 points pour les titres, au moins 20 points pour le texte et les
        étiquettes. Si un texte ne tient qu'en 14 points, il y a trop de texte.
      </P>
      <P>
        Le contraste compte plus que les couleurs : texte foncé sur fond clair, ou l'inverse, mais
        jamais du gris clair sur du blanc. Une salle éclairée et un vieux projecteur écrasent les
        nuances. Évitez d'opposer le rouge et le vert, que certains membres du jury distinguent mal.
        Deux ou trois couleurs suffisent : une pour votre série, une pour la comparaison, une pour
        mettre en évidence.
      </P>

      <H2 id="repetitions">Répéter et minuter</H2>
      <P>
        Une présentation se prépare à voix haute, pas dans sa tête. Prévoyez au moins trois
        répétitions complètes, chronomètre en main :
      </P>
      <List
        ordered
        items={[
          "Seul, pour caler le texte et noter le temps de chaque partie.",
          "Devant un collègue ou un proche, qui vous signale ce qu'il n'a pas compris.",
          "Devant votre directeur ou des résidents du service, en conditions réelles, avec des questions.",
        ]}
      />
      <P>
        Notez vos temps de passage : si les résultats commencent après la sixième minute sur quinze,
        l'introduction est trop longue. Préparez une phrase d'ouverture et une phrase de conclusion
        apprises par cœur ; le reste se dit avec vos mots, en vous appuyant sur les diapositives.
      </P>
      <Note>
        « Ce travail a eu pour objectif principal de [objectif]. Il s'agit d'une étude [type], menée
        au service de [service] sur la période [période], incluant [n] patients. »
      </Note>
      <P>
        La veille, vérifiez le matériel : la présentation en deux formats (PowerPoint et PDF), sur
        une clé USB et dans votre messagerie, et un essai sur l'ordinateur de la salle si c'est
        possible. Les animations et les vidéos sont les premières à ne pas fonctionner.
      </P>
      <H3>Le jour de la soutenance</H3>
      <List
        items={[
          "Arrivez tôt pour installer la présentation et vérifier l'affichage des figures et des couleurs.",
          "Parlez au jury, pas à l'écran : un coup d'œil à la diapositive, puis le regard vers les membres du jury.",
          "Utilisez le pointeur avec parcimonie, pour désigner un chiffre précis, pas pour souligner chaque ligne.",
          "Ralentissez sur le résultat principal : c'est la phrase que le jury doit retenir.",
          "Gardez une montre visible, ou demandez à un proche de vous faire signe à mi-parcours.",
        ]}
      />

      <H2 id="questions">Préparer les questions du jury</H2>
      <P>
        Une bonne part des questions vise votre méthode et votre capacité à défendre vos chiffres,
        plus que la clinique elle-même. Listez les trois ou quatre questions les plus probables et
        préparez pour chacune une réponse courte, avec le passage de la thèse qui y répond.
      </P>
      <Table
        caption="Les questions qui reviennent, et ce qu'il faut préparer"
        head={["Thème", "Question type", "À préparer"]}
        rows={[
          [
            "Méthodologie",
            "Pourquoi une étude rétrospective ? Pourquoi ces critères d'inclusion ?",
            "Le type d'étude, sa justification et ses conséquences",
          ],
          [
            "Effectif",
            "Votre échantillon est-il suffisant ?",
            "Calcul a priori s'il existe, sinon recrutement exhaustif sur la période",
          ],
          [
            "Valeur de p",
            "Que signifie p = 0,07 ici ?",
            "Pas de différence significative mise en évidence, ce qui ne prouve pas l'absence d'effet",
          ],
          [
            "Intervalle de confiance",
            "Votre OR de 4,1 a un IC très large : qu'en concluez-vous ?",
            "Si l'IC exclut 1 : une association mise en évidence, mais dont l'ampleur est estimée avec peu de précision",
          ],
          [
            "Biais",
            "Vos patients sont-ils représentatifs ?",
            "Recrutement du service, données manquantes, facteurs de confusion",
          ],
          [
            "Limites",
            "Quelle est la principale limite de votre travail ?",
            "Une limite assumée et son effet concret sur les résultats",
          ],
        ]}
      />
      <P>
        Pour les questions de statistique, maîtrisez au minimum la lecture d'un p et d'un intervalle
        de confiance : notre guide{" "}
        <GuideLink slug="interpreter-valeur-p-intervalle-confiance-these">
          interpréter une valeur de p et un intervalle de confiance
        </GuideLink>{" "}
        reprend les formulations justes. Préparez aussi des diapositives de réserve, placées après
        les remerciements : tableau univarié complet, définitions, résultats secondaires. Vous les
        affichez si une question les appelle.
      </P>
      <H3>Répondre aux questions</H3>
      <P>
        Écoutez la question jusqu'au bout, remerciez, puis répondez en trois temps : la réponse
        directe, l'argument (un chiffre de vos résultats ou une référence de votre Discussion),
        puis, si besoin, la limite. Une réponse d'une minute convainc plus qu'un exposé de cinq. Si
        un membre du jury relève une erreur réelle, reconnaissez-la simplement et dites comment elle
        sera corrigée dans la version définitive.
      </P>
      <Note>
        À la question « Pourquoi ne parlez-vous pas de tendance pour p = 0,07 ? » : « Parce qu'avec
        un p supérieur à 0,05, notre étude ne met pas en évidence de différence significative. Cela
        ne prouve pas l'absence de différence : l'effectif était peut-être insuffisant pour la
        détecter. »
      </Note>
      <Note>
        Face à une question dont vous n'avez pas la réponse : « C'est une limite de notre travail :
        cette donnée n'était pas disponible dans les dossiers. Une étude prospective permettrait de
        la recueillir. » Reconnaître une limite vaut mieux qu'improviser un chiffre.
      </Note>

      <H2 id="erreurs">Les erreurs fréquentes</H2>
      <List
        items={[
          "Dépasser le temps accordé, souvent à cause d'une introduction qui refait un cours.",
          "Lire les diapositives, dos au jury.",
          "Recopier les tableaux de la thèse sans les réduire.",
          "Présenter des chiffres différents de ceux du manuscrit, après une correction de dernière minute non reportée.",
          "Écrire « tendance » pour un p supérieur à 0,05, ou conclure à une causalité à partir d'une association.",
          "Oublier les limites, que le jury soulèvera de toute façon.",
          "Une conclusion qui ajoute un résultat absent de la thèse.",
          "Ne jamais avoir projeté la présentation avant le jour J.",
        ]}
      />
      <P>
        Pour situer la soutenance dans l'ensemble du parcours, voir notre guide{" "}
        <GuideLink slug="etapes-these-medecine-tunisie">
          les étapes de la thèse de médecine en Tunisie
        </GuideLink>
        . Insight Medics réalise aussi des présentations de soutenance à partir de votre thèse, que
        vous relisez et adaptez ensuite avec votre directeur.
      </P>
    </>
  );
}
