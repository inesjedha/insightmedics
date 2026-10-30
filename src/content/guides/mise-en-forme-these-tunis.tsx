import { GuideLink } from "@/components/guides/GuideLink";
import { H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "mise-en-forme-these-faculte-medecine-tunis",
  category: "format",
  title: "Mise en forme de la thèse à la Faculté de médecine de Tunis",
  seoTitle: "Mise en forme de la thèse : Faculté de médecine de Tunis",
  description:
    "Tahoma 11, marges de 4 cm côté reliure, en-tête, Conclusions au plan imposé, références entre crochets, grille du jury : la thèse à la FMT, en détail.",
  keyword: "mise en forme thèse faculté de médecine de Tunis",
  datePublished: "2026-10-30",
  readingMinutes: 8,
  shortAnswer:
    "La Faculté de médecine de Tunis impose par écrit sa mise en page : A4, Tahoma 11, interligne 1,5, texte justifié, marges de 4 cm côté reliure, 2,5 cm à l'extérieur, 2 cm en haut et en bas. Les références sont appelées entre crochets, avant la ponctuation, et listées en Tahoma 10, interligne 1. L'en-tête porte le titre de la thèse à gauche et le chapitre à droite. La thèse se termine par des « Conclusions » au plan imposé.",
  toc: [
    ["reglement", "Ce que disent les procédures de la FMT"],
    ["plan", "Le plan type et ses titres numérotés"],
    ["page", "La page : marges, police, interligne"],
    ["titres", "Les titres, niveau par niveau"],
    ["tableaux-figures", "Tableaux, figures et légendes"],
    ["pagination", "En-têtes, pagination et pages liminaires"],
    ["references", "Références et résumés"],
    ["jury", "La grille du jury"],
    ["erreurs", "Les erreurs fréquentes à Tunis"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="reglement">Ce que disent les procédures de la FMT</H2>
      <P>
        La Faculté de médecine de Tunis (FMT) est la plus explicite des quatre facultés. Ses «
        Procédures de la thèse de Doctorat en médecine » fixent, entre autres :
      </P>
      <List
        items={[
          "Le plan IMRaD suivi des « Conclusions », au pluriel.",
          "La langue : français, anglais ou arabe.",
          "Les normes de Vancouver (style Elsevier Vancouver), par ordre d'apparition ; l'appel des références avant la ponctuation, entre crochets, ni en italique ni en gras.",
          "La mise en page : A4, Tahoma 11, interligne 1,5, justifié ; marges de 4 cm côté reliure, 2,5 cm à l'extérieur, 2 cm en haut et en bas ; figures en couleur ; références et résumés en Tahoma 10, interligne 1.",
          "L'en-tête : titre de la thèse à gauche, titre du chapitre à droite, en italique, taille 9, avec une majuscule à la première lettre seulement (et aux noms propres). Le pied de page : le numéro de page, taille 9.",
          "La pagination : de l'Introduction à la dernière page des Conclusions ; la table des matières, les références et les annexes sont paginées séparément.",
          "Au moins 25 cas (de 10 à 24 cas, la thèse doit comporter une revue systématique).",
          "Un contrôle anti-plagiat (Ouriginal) : 20 % de similitudes au plus, 30 % pour une revue systématique.",
          "Un rapporteur désigné, membre de droit du jury.",
        ]}
      />
      <Note>
        Les valeurs ci-dessus sont celles des procédures. Les autres réglages de cette page (taille
        et couleur des titres, filets des tableaux, alignement des légendes) ont été relevés sur des
        thèses soutenues à la FMT et sur des chapitres de thèses de la FMT mis en forme selon ces
        règles. Ils ne sont pas imposés par écrit : le texte officiel de la faculté et les consignes
        de votre directeur priment.
      </Note>

      <H2 id="plan">Le plan type et ses titres numérotés</H2>
      <H3>L'ordre de la copie zéro</H3>
      <List
        ordered
        items={[
          "Couverture (titre et mots-clés).",
          "Table des matières.",
          "Liste des abréviations.",
          "Liste des tableaux et des figures.",
          "Corps de la thèse : Introduction, Matériel et méthodes, Résultats, Discussion.",
          "Conclusions.",
          "Références.",
          "Annexes.",
          "Abstract structuré (350 mots) puis résumé structuré en français (350 mots), chacun avec titre et mots-clés.",
        ]}
      />
      <P>
        La version définitive ajoute en tête : une page blanche, la reproduction de la couverture,
        le serment d'Hippocrate (version de la FMT), les dédicaces et remerciements (deux pages au
        plus) et la liste des enseignants de la FMT, puis les pièces de la copie zéro.
      </P>
      <H3>Le Matériel et méthodes</H3>
      <Table
        caption="Plan type du Matériel et méthodes relevé à Tunis"
        head={["Titre", "Sous-parties"]}
        rows={[
          ["1. Type et cadre de l'étude", ""],
          [
            "2. Population d'étude",
            "2.1. Critères d'inclusion ; 2.2. Critères de non-inclusion ; 2.3. Critères d'exclusion ; 2.4. Échantillonnage et taille de l'échantillon",
          ],
          ["3. Recueil des données", ""],
          [
            "4. Paramètres étudiés et définitions",
            "Une sous-partie par famille de variables, dans l'ordre de la prise en charge",
          ],
          [
            "5. Critères de jugement",
            "5.1. Critère de jugement principal ; 5.2. Critères de jugement secondaires ; 5.3. Facteurs étudiés",
          ],
          [
            "6. Analyse statistique",
            "6.1. Analyse descriptive ; 6.2. Analyse analytique ; 6.3. Analyse complémentaire",
          ],
          ["7. Recherche bibliographique", ""],
          ["8. Considérations éthiques", ""],
        ]}
      />
      <P>
        Les Résultats suivent le même ordre : « 1. Population d'étude » (avec le diagramme de flux),
        « 2. Caractéristiques des patients » (« 2.1. Caractéristiques sociodémographiques », « 2.2.
        Antécédents »…), puis la prise en charge, le critère de jugement principal, « 5. Facteurs
        associés à [l'événement] » et une analyse complémentaire. Pour rédiger la partie 6, voyez{" "}
        <GuideLink slug="rediger-analyse-statistique-materiel-methodes-these">
          comment rédiger l'analyse statistique
        </GuideLink>
        .
      </P>
      <Note>
        Objectifs, formulation relevée à Tunis (à l'imparfait) : « Ce travail avait pour objectif
        principal de … » puis « Les objectifs secondaires étaient de : », suivi d'une liste à puces
        « • », chaque puce terminée par « ; », la dernière par un point.
      </Note>
      <H3>Discussion et Conclusions</H3>
      <P>
        La Discussion relevée commence par « 1. Principaux résultats » et « 2. Points forts et
        limites de l'étude », reprend ensuite chaque partie des Résultats dans le même ordre, et se
        termine par « Recommandations et perspectives ». Les « CONCLUSIONS » suivent le plan imposé
        par la faculté : problématique, objectifs, méthodes, principaux résultats et leurs
        discussions, recommandations et perspectives. Elles sont rédigées en prose, sans sous-titre
        ni référence (deux à trois pages sur les thèses relevées).
      </P>

      <H2 id="page">La page : marges, police, interligne</H2>
      <Table
        caption="Réglages de la page à la FMT"
        head={["Élément", "Valeur", "Source"]}
        rows={[
          ["Format", "A4", "Procédures"],
          [
            "Marges",
            "Reliure (gauche) 4 cm ; extérieur (droite) 2,5 cm ; haut 2 cm ; bas 2 cm",
            "Procédures",
          ],
          ["Texte", "Tahoma 11, justifié, interligne 1,5", "Procédures"],
          ["Références et résumés", "Tahoma 10, interligne 1", "Procédures"],
          ["Figures", "En couleur", "Procédures"],
          ["Largeur utile", "14,5 cm", "Conséquence des marges"],
          ["En-tête et pied de page", "À 0,9 cm du bord", "Relevé"],
          ["Espacement des paragraphes", "0 pt avant, 6 pt après", "Relevé"],
          ["Retrait de première ligne", "Aucun", "Relevé"],
          ["Puces", "« • », retrait gauche 0,95 cm", "Relevé"],
        ]}
      />
      <P>
        Impression recto verso : la FMT demande alors les numéros de page pairs à gauche et impairs
        à droite. Réglez ce point avec votre imprimeur avant le tirage.
      </P>

      <H2 id="titres">Les titres, niveau par niveau</H2>
      <P>
        À Tunis, la numérotation est décimale, en chiffres arabes, sans « : » final. Les titres sont
        en casse normale ; seul le titre du chapitre est en capitales. Les thèses relevées n'ont pas
        de page intercalaire : le titre du chapitre, centré, ouvre sa première page.
      </P>
      <Table
        caption="Hiérarchie des titres relevée à Tunis"
        head={["Niveau", "Exemple", "Réglages relevés"]}
        rows={[
          [
            "Titre du chapitre (Titre 1)",
            "RÉSULTATS",
            "Tahoma 14 pt, gras, bleu foncé (1F4E79), centré, filet de 1 pt en dessous",
          ],
          [
            "Niveau 1 (Titre 2)",
            "1. Population d'étude",
            "Tahoma 12,5 pt, gras, bleu foncé, aligné à gauche",
          ],
          [
            "Niveau 1.1 (Titre 3)",
            "2.1. Caractéristiques sociodémographiques",
            "Tahoma 11,5 pt, gras, noir",
          ],
          [
            "Niveau 1.1.1 (Titre 4)",
            "2.5.1. Moment de survenue et causes",
            "Tahoma 11 pt, gras italique, noir",
          ],
        ]}
      />
      <P>
        Utilisez les styles Word « Titre 1 » à « Titre 4 » : la table des matières se génère alors
        seule. Tahoma est installée sur la plupart des ordinateurs ; aucune police particulière
        n'est nécessaire.
      </P>

      <H2 id="tableaux-figures">Tableaux, figures et légendes</H2>
      <H3>Les tableaux</H3>
      <List
        items={[
          "Chiffres romains, numérotation continue sur toute la thèse ; légende au-dessus, sans point final.",
          "Légende en Tahoma 10,5 : l'étiquette « Tableau II : » en gras, le titre en maigre, alignée à gauche sur les thèses relevées.",
          "Largeur ajustée au contenu (de 12 à 14,5 cm), tableau centré.",
          "Texte en Tahoma 9,5 (9 si le tableau est large), interligne simple ; en-tête en gras noir ; première colonne à gauche, autres centrées.",
          "Filets bleus (5B9BD5) de 1 pt au-dessus et au-dessous de la ligne d'en-tête et en bas du tableau ; aucun filet vertical.",
          "Une ligne sur deux sur fond bleu pâle (DDEBF7) ; lignes de regroupement (« Provenance ») en gras bleu foncé ; modalités en retrait de 0,3 cm.",
          "Notes sous le tableau en Tahoma 9 italique.",
        ]}
      />
      <Note>
        Exemple : « Tableau II : Caractéristiques sociodémographiques des patientes ». Espace
        insécable entre « Tableau » et son numéro, et avant les deux-points.
      </Note>
      <H3>Les figures</H3>
      <P>
        Légende sous la figure, centrée, en Tahoma 10,5, l'étiquette « Figure 1 : » en gras ;
        chiffres arabes, numérotation continue. Exemple : « Figure 1 : Diagramme de flux de la
        population d'étude ». Les figures sont en couleur (règle écrite) ; sur les thèses relevées,
        elles utilisent Tahoma comme le texte et font de 13 à 14,5 cm de large, jamais plus que la
        largeur utile. Pour le choix des graphiques, voyez{" "}
        <GuideLink slug="presenter-resultats-these-tableaux-figures">
          comment présenter vos résultats en tableaux et figures
        </GuideLink>
        .
      </P>

      <H2 id="pagination">En-têtes, pagination et pages liminaires</H2>
      <List
        items={[
          <>
            <strong>En-tête</strong> : titre complet de la thèse à gauche (sur deux lignes si
            besoin), nom du chapitre à droite (« Résultats »), en Tahoma 9 italique, majuscule
            initiale seulement. Sur les thèses relevées, il est construit dans un tableau de deux
            colonnes sans bordure.
          </>,
          <>
            <strong>Pied de page</strong> : numéro de page en Tahoma 9, aligné à droite.
          </>,
          <>
            <strong>Pagination</strong> : page 1 à l'Introduction, dernière page aux Conclusions.
            Table des matières, références et annexes ont leur propre pagination.
          </>,
        ]}
      />
      <P>
        Les pages liminaires ne se fabriquent pas toutes à la main. La couverture et la tranche sont
        générées par la plateforme des thèses de la faculté, et la liste actualisée des enseignants,
        visée par le doyen, est fournie par la faculté. La table des matières et les listes des
        tableaux et des figures se génèrent à l'assemblage, à partir des styles de titre et de
        légende. Pour les étapes administratives, voyez{" "}
        <GuideLink slug="etapes-these-medecine-tunisie">
          les étapes de la thèse de médecine en Tunisie
        </GuideLink>
        .
      </P>

      <H2 id="references">Références et résumés</H2>
      <List
        items={[
          "Style Elsevier Vancouver, ordre d'apparition ; une référence citée de nouveau garde son numéro.",
          "Appel entre crochets, précédé d'une espace insécable, avant la ponctuation, ni en italique ni en gras : « … abdominale [17]. »",
          "Plusieurs références : « [4, 7] » ; un intervalle : « [1–3] », avec un tiret demi-cadratin.",
          "Liste en Tahoma 10, interligne simple, alignée à gauche, retrait suspendu de 0,75 cm ; « 1. » suivi d'une tabulation.",
          "Six auteurs au plus, puis « et al. ».",
        ]}
      />
      <P>
        Les résumés sont structurés, de 350 mots chacun, avec titre et mots-clés, en Tahoma 10,
        interligne 1. Thèse en français : abstract puis résumé français. Thèse en anglais : résumé
        français puis abstract. Thèse en arabe : résumé français, abstract et résumé arabe.
      </P>

      <H2 id="jury">La grille du jury</H2>
      <P>
        La FMT publie une grille d'évaluation de la thèse par le jury, et une échelle d'évaluation
        par le rapporteur. La grille du jury est notée sur 100 ; le président et le rapporteur ont
        un coefficient 2.
      </P>
      <Table
        caption="Ce que regarde la grille du jury de la FMT"
        head={["Rubrique", "Ce qui est attendu"]}
        rows={[
          ["Méthodologie", "Type d'étude, objectif, mode de recueil, sélection des patients"],
          [
            "Résultats : contenu",
            "Population (avec diagramme de flux si besoin), objectif principal, objectifs secondaires ; tous les résultats, sans commentaire ; aucune donnée hors objectifs ; échantillon suffisant",
          ],
          [
            "Résultats : exactitude",
            "Tableaux et figures précis ; aucune discordance entre texte, tableaux et figures ; aucune erreur de calcul ; tests adaptés ; chronologie respectée",
          ],
          [
            "Résultats : forme",
            "Tahoma 11, interligne 1,5, justifié ; tableaux et figures sans redite avec le texte, numérotés et appelés ; verbes au passé",
          ],
        ]}
      />
      <P>
        Selon la grille, la rubrique « Méthodologie » compte de 10 à 20 points et la rubrique «
        Résultats » de 8 à 16 points.
      </P>
      <P>
        La forme est donc notée explicitement. Une police ou un interligne non conforme peut coûter
        des points avant même que le fond soit discuté.
      </P>

      <H2 id="erreurs">Les erreurs fréquentes à Tunis</H2>
      <List
        items={[
          "Écrire « Conclusion » au singulier, ou découper les Conclusions en sous-titres.",
          "Oublier une étape du plan imposé des Conclusions, en particulier les recommandations et les perspectives.",
          "Rédiger en Times New Roman, ou les références en Tahoma 11.",
          "Garder une marge gauche de 2,5 cm au lieu des 4 cm côté reliure.",
          "Un en-tête qui ne porte que le chapitre, ou un titre de thèse tout en capitales.",
          "Appeler les références entre parenthèses, après le point, ou en exposant gras.",
          "Paginer la table des matières ou les références avec le corps de la thèse.",
          "Ajouter « : » à la fin des titres, alors que les thèses de la FMT relevées n'en mettent pas.",
          "Moins de 25 cas sans revue systématique.",
        ]}
      />
      <P>
        Pour comparer avec Sousse, Monastir et Sfax, consultez{" "}
        <GuideLink slug="mise-en-forme-these-medecine-tunisie">
          les règles de mise en forme des quatre facultés
        </GuideLink>
        .
      </P>
    </>
  );
}
