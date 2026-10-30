import { GuideLink } from "@/components/guides/GuideLink";
import { H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "mise-en-forme-these-faculte-medecine-sousse",
  category: "format",
  title: "Mise en forme de la thèse à la Faculté de médecine de Sousse",
  seoTitle: "Mise en forme de la thèse : Faculté de médecine de Sousse",
  description:
    "Plan type, titres « I. … : », marges, polices du gabarit, tableaux, légendes, pagination et pages liminaires : la thèse à la Faculté de médecine de Sousse.",
  keyword: "mise en forme thèse faculté de médecine de Sousse",
  datePublished: "2026-10-30",
  readingMinutes: 9,
  shortAnswer:
    "Le guide méthodologique de la Faculté de médecine de Sousse n'est pas public : la référence est la copie finale soutenue, qui sert de gabarit. On y relève un texte en Times New Roman 12, justifié, interligne 1,5, sans retrait ; des marges de 2,5 cm (3 cm à gauche) ; des titres numérotés I., 1., 1.1., terminés par « : » ; des pages intercalaires ; des références appelées entre parenthèses, par ordre d'apparition.",
  toc: [
    ["reglement", "Ce que dit le règlement de la faculté"],
    ["plan", "Le plan type et ses titres numérotés"],
    ["page", "La page : marges, police, interligne"],
    ["titres", "Les titres, niveau par niveau"],
    ["tableaux-figures", "Tableaux, figures et légendes"],
    ["pagination", "En-têtes, pagination et pages liminaires"],
    ["references", "Les références"],
    ["jury", "Ce que le jury vérifie"],
    ["erreurs", "Les erreurs fréquentes à Sousse"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="reglement">Ce que dit le règlement de la faculté</H2>
      <P>
        La Faculté de médecine de Sousse (FMS, faculté Ibn El Jazzar) encadre la thèse dans les
        articles 36 à 38 de son règlement intérieur :
      </P>
      <List
        items={[
          <>
            <strong>Article 36</strong> : le sujet est agréé par le doyen ; le directeur de thèse
            est choisi parmi les enseignants des facultés de médecine ; la soutenance a lieu après
            au moins une année de stage du troisième cycle (TCEM).
          </>,
          <>
            <strong>Article 37</strong> : « la rédaction et la soutenance de la thèse doivent obéir
            au guide méthodologique validé par le conseil scientifique de la faculté ».
          </>,
          <>
            <strong>Article 38</strong> : le plagiat est sanctionné par le refus ou le report de la
            soutenance (décret n° 2008-2422).
          </>,
        ]}
      />
      <P>
        La faculté dispose d'une plateforme des thèses, thesefms.com. Les thèses y sont rédigées
        presque toujours en français, et sont en majorité des travaux originaux. La page de garde
        peut porter la mention « proposition au prix des thèses ».
      </P>
      <Note>
        Le guide méthodologique cité à l'article 37 n'est pas public. Toutes les valeurs de mise en
        page de cette page ont été relevées sur la copie finale d'une thèse soutenue à la faculté,
        qui sert de gabarit, et sur des chapitres de thèses de la FMS mis en forme selon ce gabarit.
        Si votre service vous remet le guide officiel, ou si votre directeur vous donne une consigne
        écrite, ce sont eux qui priment.
      </Note>

      <H2 id="plan">Le plan type et ses titres numérotés</H2>
      <P>
        La thèse suit le plan IMRaD. Dans l'ordre : pages liminaires, Introduction, Matériel et
        méthodes, Résultats, Discussion, Conclusion, Références. Chaque chapitre s'ouvre sur une
        page intercalaire. L'Introduction n'a pas de sous-titre ; elle se termine par les objectifs.
      </P>
      <Note>
        Objectifs, formulation relevée à Sousse (au présent) : « Ce travail a pour objectif
        principal de … » puis « Les objectifs secondaires sont : », suivi d'une liste à puces dont
        chaque puce commence par « de » et finit par « ; », la dernière par un point.
      </Note>
      <H3>Matériel et méthodes</H3>
      <Table
        caption="Plan type du Matériel et méthodes relevé à Sousse"
        head={["Titre", "Remarque"]}
        rows={[
          ["I. TYPE ET CADRE DE L'ÉTUDE :", "Type exact, service, hôpital, période"],
          [
            "II. POPULATION D'ÉTUDE :",
            "1. Critères d'inclusion : / 2. Critères de non-inclusion : / 3. Critères d'exclusion : / 4. Échantillonnage :",
          ],
          ["III. DÉROULEMENT DE L'ÉTUDE :", ""],
          [
            "IV. [TECHNIQUE OU EXAMEN ÉTUDIÉ] :",
            "Seulement si l'étude porte sur un geste, un test ou un traitement",
          ],
          ["V. VARIABLES ÉTUDIÉES :", "Une sous-partie par famille de variables"],
          [
            "VI. CRITÈRES DE JUGEMENT :",
            "1. Critère de jugement principal : / 2. Critères de jugement secondaires :",
          ],
          [
            "VII. [ÉVALUATION DE LA SÉCURITÉ] :",
            "Seulement si l'étude évalue un geste ou un traitement",
          ],
          ["VIII. RECUEIL DES DONNÉES :", ""],
          [
            "IX. ANALYSE STATISTIQUE :",
            "1. Logiciel : / 2. Plan de l'analyse : / 3. Analyse descriptive : …",
          ],
          ["X. CONSIDÉRATIONS ÉTHIQUES :", ""],
          ["RÉFÉRENCES :", "Références nouvelles du chapitre"],
        ]}
      />
      <P>
        Sans les deux parties facultatives (IV et VII), les numéros suivants remontent : l'analyse
        statistique devient alors VII. Gardez une suite sans trou. Pour le contenu de cette partie,
        voyez{" "}
        <GuideLink slug="rediger-analyse-statistique-materiel-methodes-these">
          comment rédiger l'analyse statistique du Matériel et méthodes
        </GuideLink>
        .
      </P>
      <H3>Résultats et Discussion</H3>
      <P>
        Les Résultats suivent l'ordre du Matériel et méthodes : « I. ANALYSE DESCRIPTIVE : » (avec «
        1. Population de l'étude : », « 2. Caractéristiques démographiques et terrain : », « 2.1.
        Âge : »…), puis une partie par objectif (« II. [OBJECTIF PRINCIPAL] : »), puis « IV.
        FACTEURS ASSOCIÉS À [L'ÉVÉNEMENT] : ». La Discussion relevée reprend le même ordre, de « I.
        PROFIL ÉPIDÉMIOLOGIQUE : » jusqu'à « X. FORCES ET LIMITES DE L'ÉTUDE : » et « XI.
        PERSPECTIVES : ». La Conclusion, intitulée « CONCLUSION », est une prose de deux à trois
        pages, sans sous-titre ni référence.
      </P>

      <H2 id="page">La page : marges, police, interligne</H2>
      <Table
        caption="Réglages de la page relevés sur le gabarit de Sousse"
        head={["Élément", "Valeur relevée"]}
        rows={[
          ["Format", "A4"],
          ["Marges", "Haut 2,5 cm ; bas 2,5 cm ; gauche 3 cm ; droite 2,5 cm"],
          ["En-tête et pied de page", "À 1,25 cm du bord"],
          ["Largeur utile", "15,5 cm"],
          ["Texte", "Times New Roman 12, noir, justifié"],
          ["Interligne", "1,5 ; 0 pt avant, 10 pt après chaque paragraphe"],
          ["Retrait de première ligne", "Aucun"],
          ["Puces", "Flèche « ➢ » du gabarit, retrait gauche 1,23 cm, 6 pt après"],
          [
            "Notes sous les tableaux et figures",
            "Times New Roman 10, italique, justifiées, interligne simple",
          ],
        ]}
      />
      <P>
        Point d'attention : la copie finale de référence n'est pas homogène. À partir des Résultats,
        elle passe à une marge gauche de 2,5 cm et une marge basse de 3 cm. Pour une thèse assemblée
        propre, gardez les mêmes marges (3 cm à gauche, 2,5 cm en bas) dans tous les chapitres, sauf
        consigne contraire de votre directeur.
      </P>

      <H2 id="titres">Les titres, niveau par niveau</H2>
      <P>
        Sousse est la seule des quatre facultés à combiner chiffres romains et chiffres arabes, et à
        terminer chaque titre par une espace insécable suivie de « : ». Le niveau I est en
        capitales, saisies avec leurs accents.
      </P>
      <Table
        caption="Hiérarchie des titres relevée sur le gabarit de Sousse"
        head={["Niveau", "Exemple", "Réglages relevés"]}
        rows={[
          [
            "Page intercalaire",
            "Résultats",
            "Albertus 45 pt, gras, petites capitales, bleu ciel (00B0F0), aligné à droite, filet gris en dessous",
          ],
          ["Titre du chapitre", "RÉSULTATS", "AvantGarde Bk BT 22 pt, gras, bleu (0070C0), centré"],
          ["Niveau I", "I. ANALYSE DESCRIPTIVE :", "AvantGarde Bk BT 15 pt, gras, capitales"],
          [
            "Niveau 1",
            "1. Population de l'étude :",
            "AvantGarde Bk BT 15 pt, gras, petites capitales",
          ],
          ["Niveau 1.1", "2.1. Âge :", "AvantGarde Bk BT 13 pt, gras"],
          ["Niveau 1.1.1", "2.1.1. Tranches d'âge :", "AvantGarde Bk BT 13 pt, gras italique"],
        ]}
      />
      <P>
        Les titres sont espacés de 18 pt avant et après, et liés au paragraphe suivant pour ne
        jamais rester seuls en bas de page.
      </P>
      <H3>Les polices du gabarit</H3>
      <P>
        AvantGarde Bk BT, Albertus et Souvenir Lt BT (légendes) sont les polices du gabarit ; elles
        sont peu courantes. Si elles manquent sur votre ordinateur, Word les remplace à l'écran et
        dans le PDF par une police voisine. Ne changez pas les styles : produisez le PDF final sur
        un poste où ces polices sont installées.
      </P>
      <Note>
        Astuce : dans le style du niveau 1, en petites capitales, Word peut faire disparaître les
        accents. Saisissez le titre en casse normale et réglez la langue du titre sur « Français
        (Belgique) » : les accents sont conservés.
      </Note>

      <H2 id="tableaux-figures">Tableaux, figures et légendes</H2>
      <H3>Les tableaux</H3>
      <List
        items={[
          "Numérotation en chiffres romains, continue sur toute la thèse : les tableaux des Résultats suivent ceux du Matériel et méthodes.",
          "Légende au-dessus, centrée, en Souvenir Lt BT 11 pt gras italique, bleu foncé (1F497D), sans point final.",
          "Largeur de 15,5 cm (la largeur utile), tableau centré.",
          "Texte en Times New Roman 11, interligne simple ; en-tête en gras ; première colonne à gauche, autres colonnes centrées.",
          "Filets bleus (156082) : 1 pt en haut et en bas du tableau, 0,75 pt sous la ligne d'en-tête ; aucun filet vertical ni intérieur.",
          "Lignes de regroupement (« Antécédents pathologiques ») en gras sur fond bleu clair (B7D4EF), modalités en retrait de 0,3 cm.",
          "Ligne d'en-tête répétée en haut de chaque page, lignes qui ne se coupent pas entre deux pages.",
        ]}
      />
      <Note>
        Exemple de légende : « Tableau IV : Caractéristiques cliniques des patients (N = 80) ».
        Mettez une espace insécable entre « Tableau » et son numéro, et avant les deux-points.
      </Note>
      <H3>Les figures</H3>
      <P>
        Légende sous la figure, dans le même style que celle des tableaux, centrée ; numérotation en
        chiffres arabes, continue. Exemple : « Figure 2 : Distribution de l'âge des patients (A) et
        répartition par tranche d'âge (B) ». Les figures relevées sont insérées sur 15,5 cm de large
        (10 à 14 cm pour une figure étroite), en Times New Roman comme le texte, sans titre dans
        l'image. Pour choisir entre tableau et figure, voyez{" "}
        <GuideLink slug="presenter-resultats-these-tableaux-figures">
          comment présenter vos résultats en tableaux et figures
        </GuideLink>
        .
      </P>

      <H2 id="pagination">En-têtes, pagination et pages liminaires</H2>
      <List
        items={[
          <>
            <strong>En-tête</strong> : le nom du chapitre (« Résultats », « Discussion »), en Times
            New Roman 12 gras italique, aligné à droite, souligné d'un filet noir de 1 pt.
          </>,
          <>
            <strong>Pied de page</strong> : le numéro de page en Times New Roman 12 gras, aligné à
            droite, surmonté d'un filet noir de 1 pt.
          </>,
          <>
            <strong>Pagination</strong> : pages liminaires en chiffres romains minuscules (i, ii,
            iii…), puis pagination continue de l'Introduction à la fin. La page intercalaire est
            comptée mais ne porte ni numéro ni en-tête.
          </>,
        ]}
      />
      <H3>L'ordre des pages liminaires</H3>
      <List
        ordered
        items={[
          "Page de garde : logo, titre et mots-clés dans un tableau, tableau du jury. Sur le gabarit, le titre doit tenir en trois lignes, les mots-clés en une, le libellé du directeur en une ; sinon la ligne « Rapporteur » glisse en page 2.",
          "Liste des enseignants de l'année universitaire en cours.",
          "Serments du médecin, en arabe puis en français.",
          "Dédicaces (« Je dédie cette Thèse ») et remerciements.",
          "Table des matières.",
          "Liste des figures, puis liste des tableaux.",
          "Liste des abréviations, par ordre alphabétique : sigle en gras, deux-points, puis le sens.",
          "Page intercalaire « Introduction », puis le chapitre.",
        ]}
      />
      <P>
        La table des matières et les listes doivent être des tables automatiques, construites sur
        les styles de titre et de légende du gabarit. Après l'assemblage des chapitres, mettez-les à
        jour : si les champs sont verrouillés, sélectionnez-les, déverrouillez-les avec
        Ctrl+Maj+F11, puis actualisez avec F9.
      </P>

      <H2 id="references">Les références</H2>
      <List
        items={[
          "Style Vancouver, numérotation dans l'ordre de première citation ; une référence citée de nouveau garde son numéro.",
          "Appel entre parenthèses, précédé d'une espace insécable et placé avant la ponctuation : « … en Australie (25). »",
          "Plusieurs références : « (3,4,6) », sans espace ; un intervalle : « (5–8) », avec un tiret demi-cadratin.",
          "Liste en Times New Roman 12, alignée à gauche, retrait suspendu de 0,75 cm, interligne 1,15, 4 pt après chaque notice.",
          "Six auteurs au plus, puis « et al. ».",
        ]}
      />
      <P>
        Sur les chapitres relevés, une liste « RÉFÉRENCES : » ferme l'Introduction et le Matériel et
        méthodes, et la liste complète de la thèse figure à la fin, après la Discussion. Les numéros
        du Matériel et méthodes poursuivent ceux de l'Introduction.
      </P>
      <P>
        Résumé et abstract : la faculté ne publie pas de longueur. Vérifiez-la auprès du service des
        thèses avant de rédiger.
      </P>

      <H2 id="jury">Ce que le jury vérifie</H2>
      <P>
        La FMS n'a pas publié de grille d'évaluation propre. La seule grille publiée parmi les
        quatre facultés est celle de Tunis ; ses critères décrivent bien ce qu'un jury tunisien
        regarde :
      </P>
      <List
        items={[
          "Une population décrite, avec un diagramme de flux, puis l'objectif principal, puis les objectifs secondaires.",
          "Tous les résultats, sans commentaire et sans donnée hors des objectifs.",
          "Des tableaux et des figures précis, numérotés et appelés dans le texte.",
          "Aucune discordance entre le texte, les tableaux et les figures, aucune erreur de calcul.",
          "Des tests statistiques adaptés et des verbes au passé.",
        ]}
      />
      <P>
        Le jury lit aussi la forme : une hiérarchie de titres conforme au gabarit et une table des
        matières juste sont la première impression qu'il a de votre travail.
      </P>

      <H2 id="erreurs">Les erreurs fréquentes à Sousse</H2>
      <List
        items={[
          "Oublier le « : » final d'un titre, ou l'espace insécable qui le précède.",
          "Numéroter en décimal (« 1. », « 1.1. ») dès le premier niveau, comme à Tunis : à Sousse, le premier niveau est en chiffres romains.",
          "Saisir les titres en capitales sans accents (« EVOLUTION » au lieu de « ÉVOLUTION »).",
          "Appeler les références entre crochets, ou mettre des espaces dans « (3,4,6) ».",
          "Changer de marges d'un chapitre à l'autre au moment de l'assemblage.",
          "Un titre de page de garde trop long, qui décale le tableau du jury.",
          "Imprimer un PDF où les polices du gabarit ont été remplacées sans le vérifier.",
          "Mettre en-tête et numéro sur les pages intercalaires.",
        ]}
      />
      <P>
        Pour comparer avec les autres facultés, consultez{" "}
        <GuideLink slug="mise-en-forme-these-medecine-tunisie">
          les règles de mise en forme des quatre facultés tunisiennes
        </GuideLink>
        .
      </P>
    </>
  );
}
