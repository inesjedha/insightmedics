import { GuideLink } from "@/components/guides/GuideLink";
import { H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "mise-en-forme-these-faculte-medecine-monastir",
  category: "format",
  title: "Mise en forme de la thèse à la Faculté de médecine de Monastir",
  seoTitle: "Mise en forme de la thèse : Faculté de médecine de Monastir",
  description:
    "Taille 14, 100 pages au plus, ordre imposé des pages, résumés en 4e de couverture, titres, tableaux et références : la mise en forme d'une thèse à la FMM.",
  keyword: "mise en forme thèse faculté de médecine de Monastir",
  datePublished: "2026-10-30",
  readingMinutes: 8,
  shortAnswer:
    "La Faculté de médecine de Monastir demande une thèse sur papier blanc A4, en Times New Roman, Arial ou Calibri taille 14, interligne 1,5, de 100 pages au plus, au plan IMRaD. L'ordre des pages est imposé, du plan détaillé avec renvois jusqu'aux résumés français et anglais placés en quatrième de couverture. La conclusion doit être visée par le directeur, et la bibliographie numérotée par ordre d'apparition, selon Vancouver.",
  toc: [
    ["reglement", "Ce que dit la procédure de la FMM"],
    ["plan", "Le plan type et ses titres numérotés"],
    ["page", "La page : taille 14 ou charte des mémoires"],
    ["titres", "Les titres, niveau par niveau"],
    ["tableaux-figures", "Tableaux, figures et légendes"],
    ["pagination", "En-têtes, pagination et pages liminaires"],
    ["references", "Références et résumés"],
    ["jury", "Le jury et le dépôt"],
    ["erreurs", "Les erreurs fréquentes à Monastir"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="reglement">Ce que dit la procédure de la FMM</H2>
      <P>
        La Faculté de médecine de Monastir (FMM) publie une page « Procédure de thèse » qui couvre
        l'inscription, le dépôt, la soutenance et la présentation matérielle. Elle retient :
      </P>
      <List
        items={[
          <>
            <strong>Deux formats</strong> : la présentation classique, ou la thèse-article
            (structure IMRaD, au moins 5 000 mots hors références et résumés, au moins 5 figures ou
            tableaux).
          </>,
          <>
            <strong>La présentation</strong> : papier blanc 21 × 29,7 cm ; police Times New Roman,
            Arial ou Calibri ; <strong>taille 14</strong> ; interligne 1,5 ;{" "}
            <strong>100 pages au plus</strong> ; structure IMRaD ; thèse reliée.
          </>,
          <>
            <strong>Un ordre des pages imposé</strong>, de la couverture cartonnée aux résumés
            (détail plus bas).
          </>,
          <>
            <strong>Une conclusion visée par le directeur</strong> de thèse.
          </>,
          <>
            <strong>Une bibliographie</strong> par ordre d'apparition, numérotée de 1 à N, selon
            Vancouver ; tout auteur de la bibliographie doit être cité dans le texte.
          </>,
          <>
            <strong>Un plagiat limité</strong> à 20 % au plus.
          </>,
        ]}
      />
      <Note>
        Seuls les points ci-dessus sont écrits par la faculté. Les marges, les styles de titres, les
        filets et les couleurs de cette page ont été relevés sur la charte des mémoires de la FMM et
        sur des chapitres de thèses de la FMM mis en forme selon cette charte. Ils ne sont pas
        imposés : la procédure de la faculté et les consignes de votre directeur priment.
      </Note>

      <H2 id="plan">Le plan type et ses titres numérotés</H2>
      <P>
        À Monastir, le titre du chapitre ne figure que sur sa page intercalaire. Le chapitre
        commence directement par sa première partie numérotée, en chiffres arabes, sans « : » final.
      </P>
      <Table
        caption="Plan type du Matériel et méthodes relevé à Monastir"
        head={["Titre", "Sous-parties"]}
        rows={[
          [
            "1. Type et cadre de l'étude",
            "1.1. Type d'étude ; 1.2. Cadre de l'étude ; 1.3. Période de l'étude ; 1.4. Objectifs",
          ],
          [
            "2. Population d'étude",
            "2.1. Sélection des patients ; 2.2. Critères d'inclusion ; 2.3. Critères de non-inclusion et d'exclusion ; 2.4. Taille de l'échantillon ; 2.5. Groupes d'analyse",
          ],
          ["3. Recueil des données", ""],
          ["4. Méthodes", "Technique, examen ou protocole : 4.1, 4.2…"],
          ["5. Définition des variables", ""],
          [
            "6. Critères de jugement",
            "6.1. Critère de jugement principal ; 6.2. Critères de jugement secondaires",
          ],
          [
            "7. Analyse statistique",
            "7.1. Logiciel ; 7.2. Statistique descriptive ; une sous-partie par étape ; seuil de signification",
          ],
          ["8. Considérations éthiques", ""],
          ["Références citées dans ce chapitre", ""],
        ]}
      />
      <P>
        Les Résultats suivent : « 1. Étude descriptive » (« 1.1. Population d'étude » avec le
        diagramme de flux, « 1.2. Caractéristiques des patients », « 1.2.1. Âge »…), puis une partie
        pour l'objectif principal, une pour les objectifs secondaires ou les facteurs associés («
        3.1. Analyse univariée », « 3.2. Analyse multivariée ») et, si besoin, des analyses
        complémentaires. La Discussion reprend l'ordre des Résultats. Pour la partie 7, voyez{" "}
        <GuideLink slug="rediger-analyse-statistique-materiel-methodes-these">
          comment rédiger l'analyse statistique
        </GuideLink>
        .
      </P>
      <Note>
        Objectifs, formulation relevée à Monastir (à l'imparfait) : « Ce travail avait pour objectif
        principal de … » puis « Les objectifs secondaires étaient de : », suivi d'une liste à tirets
        « – ».
      </Note>
      <P>
        La conclusion, intitulée « CONCLUSION » sur sa page intercalaire, est une prose sans
        sous-titre ni référence. Comme elle doit être visée par votre directeur, donnez-la-lui assez
        tôt avant le dépôt.
      </P>

      <H2 id="page">La page : taille 14 ou charte des mémoires</H2>
      <P>
        La règle publiée est la <strong>taille 14</strong>. Certaines thèses de la FMM suivent
        pourtant la charte des mémoires de la faculté, en Times New Roman 12. Ne retenez la taille
        12 qu'avec l'accord écrit de votre directeur ; sans cet accord, appliquez la taille 14.
      </P>
      <Table
        caption="Réglages de la page à Monastir"
        head={["Élément", "Règle publiée", "Charte des mémoires (relevé)"]}
        rows={[
          ["Format", "Papier blanc 21 × 29,7 cm", "A4"],
          ["Police du texte", "Times New Roman, Arial ou Calibri, taille 14", "Times New Roman 12"],
          ["Interligne", "1,5", "1,5, justifié, 4 pt après"],
          ["Retrait de première ligne", "Non précisé", "1,25 cm"],
          ["Marges", "Non précisées", "Haut 2,5 cm ; bas 2,3 cm ; gauche 2,5 cm ; droite 2,5 cm"],
          ["En-tête et pied de page", "Non précisés", "À 1 cm et 1,2 cm du bord"],
          ["Largeur utile", "Non précisée", "16 cm"],
          ["Puces", "Non précisées", "Tiret « – », retrait gauche 1 cm"],
          ["Longueur", "100 pages au plus", "Même limite"],
        ]}
      />
      <Note>
        Si vous passez de la charte des mémoires à la taille 14 : texte en 14, titres en 16, 14 et
        14 pour les trois niveaux, puis reprenez toute la mise en page. Le texte s'allonge :
        surveillez la limite des 100 pages.
      </Note>

      <H2 id="titres">Les titres, niveau par niveau</H2>
      <Table
        caption="Hiérarchie des titres relevée à Monastir (charte des mémoires, texte en 12)"
        head={["Niveau", "Exemple", "Réglages relevés"]}
        rows={[
          [
            "Page intercalaire",
            "RÉSULTATS",
            "Times New Roman 36 pt, gras, capitales, bleu (215E99), centré horizontalement et verticalement",
          ],
          [
            "Niveau 1 (Titre 1)",
            "1. Étude descriptive",
            "Times New Roman 14 pt, gras, petites capitales, bleu nuit (001F5F), aligné à gauche",
          ],
          [
            "Niveau 1.1 (Titre 2)",
            "1.1. Population d'étude",
            "Times New Roman 12 pt, gras, bleu (1F487C)",
          ],
          [
            "Niveau 1.1.1 (Titre 3)",
            "1.2.1. Âge",
            "Times New Roman 12 pt, gras italique, bleu clair (4F81BC)",
          ],
        ]}
      />
      <P>
        Les couleurs viennent de la charte des mémoires, pas de la procédure de la faculté. Toutes
        les polices utilisées sont courantes ; aucune installation particulière n'est nécessaire.
        Construisez vos titres avec les styles Word « Titre 1 » à « Titre 3 » : le plan détaillé
        avec renvois, demandé par la faculté, se génère alors automatiquement.
      </P>

      <H2 id="tableaux-figures">Tableaux, figures et légendes</H2>
      <H3>Les tableaux</H3>
      <List
        items={[
          "Chiffres romains, numérotation continue sur toute la thèse ; légende au-dessus, sans point final.",
          "Légende en Times New Roman 12, gras, noir, centrée.",
          "Largeur de 16 cm (la largeur utile), tableau centré.",
          "Texte en Times New Roman 10 (9,5 si le tableau est large), interligne simple ; en-tête en gras ; première colonne à gauche, autres centrées.",
          "Filets bleus (4F81BD) : 1 pt en haut et en bas, 0,75 pt sous la ligne d'en-tête ; aucun filet vertical.",
          "Une ligne sur deux sur fond bleu très pâle (F2F6FB) ; lignes de regroupement en gras sur fond bleu clair (DCE6F2).",
          "Notes sous le tableau en Times New Roman 10, justifiées.",
        ]}
      />
      <Note>
        Exemple de légende : « Tableau III : Répartition des patientes selon le stade tumoral (N =
        64) ». Espace insécable entre « Tableau » et son numéro, et avant les deux-points.
      </Note>
      <H3>Les figures</H3>
      <P>
        Légende sous la figure, en Times New Roman 12 gras, centrée ; chiffres arabes, numérotation
        continue. Exemple : « Figure 3 : Distribution de l'âge des patientes et répartition par
        tranche d'âge ». Sur les thèses relevées, les figures utilisent Times New Roman comme le
        texte et font de 13,8 à 15,5 cm de large. Une thèse-article doit en compter, avec les
        tableaux, au moins cinq. Pour le choix des graphiques, voyez{" "}
        <GuideLink slug="presenter-resultats-these-tableaux-figures">
          comment présenter vos résultats en tableaux et figures
        </GuideLink>
        .
      </P>

      <H2 id="pagination">En-têtes, pagination et pages liminaires</H2>
      <List
        items={[
          <>
            <strong>En-tête</strong> (relevé) : titre de la thèse à gauche, en Times New Roman 10
            italique bleu, sur deux lignes si besoin ; nom du chapitre à droite ; filet fin en
            dessous.
          </>,
          <>
            <strong>Pied de page</strong> (relevé) : numéro de page en Times New Roman 10,5, aligné
            à droite.
          </>,
          <>
            <strong>Pages intercalaires</strong> : ni en-tête ni numéro.
          </>,
        ]}
      />
      <H3>L'ordre imposé par la faculté</H3>
      <List
        ordered
        items={[
          "Couverture cartonnée : Faculté de Médecine de Monastir, année universitaire, numéro, « Thèse pour le Diplôme National de Docteur en Médecine », date de soutenance, nom, titre intégral approuvé par le doyen, mots-clés MeSH, jury, directeur.",
          "Liste du personnel enseignant (fournie par le secrétariat de la faculté).",
          "Dédicace.",
          "Serment d'Hippocrate.",
          "Plan détaillé avec renvois.",
          "Corps de la thèse, puis la conclusion visée par le directeur.",
          "Bibliographie.",
          "Résumés français et anglais, avec titre et mots-clés, au verso de la thèse (quatrième de couverture).",
        ]}
      />
      <P>
        Le titre de la couverture doit être exactement celui approuvé par le doyen. Les mots-clés
        doivent être des termes MeSH : vérifiez-les et donnez-les en français et en anglais. Les
        listes des tableaux, des figures et des abréviations, quand vous les ajoutez, se placent
        après le plan.
      </P>

      <H2 id="references">Références et résumés</H2>
      <List
        items={[
          "Vancouver, par ordre d'apparition, numérotation de 1 à N.",
          "Appel entre crochets, précédé d'une espace insécable et placé avant la ponctuation : « … de l'Organisation mondiale de la santé [1]. »",
          "Plusieurs références : « [1, 2] » ; un intervalle : « [3–5] ».",
          "Liste en Times New Roman 11, interligne simple, alignée à gauche, retrait suspendu de 0,8 cm.",
          "Six auteurs au plus, puis « et al. ».",
          "Aucune référence de la liste sans appel dans le texte : c'est une règle de la faculté.",
        ]}
      />
      <P>
        Sur les chapitres relevés, une liste « Références citées dans ce chapitre » ferme chaque
        chapitre ; toutes sont fusionnées dans la bibliographie générale en fin de thèse. Les
        résumés, en français et en anglais, avec titre et mots-clés MeSH, vont en quatrième de
        couverture.
      </P>

      <H2 id="jury">Le jury et le dépôt</H2>
      <List
        items={[
          "Pas de rapporteur : le jury évalue lui-même la copie zéro, dans un délai de 15 jours.",
          "Le jury compte 3 à 5 membres, dont plus de la moitié sont enseignants de la FMM ; le directeur n'en fait pas partie.",
          "Le jury remplit une grille d'évaluation jointe au procès-verbal ; elle n'est pas publique.",
          "Dépôt à la bibliothèque avant la soutenance : une semaine avant, un exemplaire papier et deux CD.",
          "Les soutenances ont lieu du 1er septembre au 30 juin.",
        ]}
      />
      <P>
        Faute de grille publique, les critères de la grille publiée par la Faculté de médecine de
        Tunis sont un bon repère : population avec diagramme de flux, objectif principal puis
        objectifs secondaires, tous les résultats sans commentaire, aucune discordance entre texte,
        tableaux et figures, tests adaptés, tableaux et figures numérotés et appelés, verbes au
        passé. Pour le calendrier complet, voyez{" "}
        <GuideLink slug="etapes-these-medecine-tunisie">
          les étapes de la thèse de médecine en Tunisie
        </GuideLink>
        .
      </P>

      <H2 id="erreurs">Les erreurs fréquentes à Monastir</H2>
      <List
        items={[
          "Dépasser 100 pages, surtout après le passage en taille 14.",
          "Rédiger en taille 12 sans l'accord écrit du directeur.",
          "Un titre de couverture différent de celui approuvé par le doyen.",
          "Des mots-clés qui ne sont pas des termes MeSH.",
          "Placer les résumés en fin de thèse au lieu de la quatrième de couverture.",
          "Remettre la conclusion au directeur trop tard pour qu'il la vise avant le dépôt.",
          "Une référence de la bibliographie qui n'est appelée nulle part.",
          "Appeler les références entre parenthèses, ou après la ponctuation.",
          "Répéter le titre du chapitre en tête du texte, alors qu'il figure déjà sur la page intercalaire.",
        ]}
      />
      <P>
        Pour comparer avec Sousse, Tunis et Sfax, consultez{" "}
        <GuideLink slug="mise-en-forme-these-medecine-tunisie">
          les règles de mise en forme des quatre facultés
        </GuideLink>
        .
      </P>
    </>
  );
}
