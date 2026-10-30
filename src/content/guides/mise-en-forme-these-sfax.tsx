import { GuideLink } from "@/components/guides/GuideLink";
import { H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "mise-en-forme-these-faculte-medecine-sfax",
  category: "format",
  title: "Mise en forme de la thèse à la Faculté de médecine de Sfax",
  seoTitle: "Mise en forme de la thèse : Faculté de médecine de Sfax",
  description:
    "Times New Roman 14, chiffres arabes seuls, aucun « : » après un titre, 40 à 100 références, titre de 10 mots : la mise en forme d'une thèse à la FMSf.",
  keyword: "mise en forme thèse faculté de médecine de Sfax",
  datePublished: "2026-10-30",
  readingMinutes: 9,
  shortAnswer:
    "La Faculté de médecine de Sfax demande une thèse en Times New Roman 14, interligne 1,5, sur A4, avec une marge gauche de 3 cm et 2 cm ailleurs. Les titres sont numérotés en chiffres arabes uniquement, sans « : », sur quatre niveaux au plus ; l'Introduction et la Conclusion n'ont aucun sous-titre. Le titre de la thèse compte 10 mots au plus, le corps 50 à 100 pages, la bibliographie 40 à 100 références.",
  toc: [
    ["reglement", "Ce que disent les recommandations de la FMSf"],
    ["plan", "Le plan type et ses titres numérotés"],
    ["page", "La page : règle écrite et modèle soutenu"],
    ["titres", "Les titres, niveau par niveau"],
    ["tableaux-figures", "Tableaux, figures et légendes"],
    ["pagination", "En-têtes, pagination et pages liminaires"],
    ["references", "Les références"],
    ["jury", "Le jury et la commission des thèses"],
    ["erreurs", "Les erreurs fréquentes à Sfax"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="reglement">Ce que disent les recommandations de la FMSf</H2>
      <P>
        La Faculté de médecine de Sfax (FMSf) diffuse des « Recommandations du déroulement et la
        rédaction des thèses ». C'est le texte le plus détaillé des quatre facultés sur la rédaction
        elle-même. Il fixe notamment :
      </P>
      <List
        items={[
          "La langue : français scientifique ou anglais ; la structure IMRaD ; un chapitre supplémentaire (historique, physiopathologie) peut suivre l'Introduction, dans la limite de 20 % de la thèse.",
          "La longueur : un corps de thèse de 50 à 100 pages ; un titre de 10 mots au plus, articles non comptés.",
          "La mise en page : A4, Times New Roman 14, interligne 1,5, marge gauche de 3 cm et 2 cm pour les autres ; titres de chapitres dans la police du texte ; pages intercalaires portant le titre du chapitre.",
          "Le plan : titres de chapitres en majuscules, sans numérotation ; subdivisions jusqu'à la quatrième ; numérotation exclusivement en chiffres arabes (chiffres romains et lettres proscrits) ; aucun « : » après les titres ; aucun titre ni sous-titre dans l'Introduction et la Conclusion.",
          "Le style : passé pour les faits survenus, présent seulement pour les notions établies ; ni expressions émotionnelles ni passif de modestie ; aucune abréviation dans les titres, les tableaux et les figures.",
          "La couverture : cartonnée blanche, texte noir ; dos avec résumé et mots-clés ; reliure en spirale proscrite.",
        ]}
      />
      <Note>
        Les autres valeurs de cette page ont été relevées sur un modèle de thèse soutenue à la FMSf
        et sur des chapitres de thèses de la faculté mis en forme selon ce modèle. Sur deux points,
        le modèle s'écarte de la règle écrite : les marges et la police des titres (voir plus bas).
        La règle écrite et les consignes de votre directeur priment ; avant de reprendre un écart du
        modèle, demandez son avis à votre directeur ou à la commission des thèses.
      </Note>

      <H2 id="plan">Le plan type et ses titres numérotés</H2>
      <P>
        L'Introduction n'a <strong>aucun titre</strong> : seulement des paragraphes, en trois temps
        (aspect général du sujet, problématique, objectifs). Les objectifs forment le dernier
        paragraphe, rédigés en phrases (« Ce travail avait pour objectifs de … ») ou en liste à
        puces simple, sans titre. La Conclusion n'a, elle non plus, aucun titre interne.
      </P>
      <Table
        caption="Plan type du Matériel et méthodes relevé à Sfax"
        head={["Titre", "Sous-parties"]}
        rows={[
          ["1. TYPE ET CADRE DE L'ÉTUDE", ""],
          [
            "2. POPULATION DE L'ÉTUDE",
            "2.1. Critères d'inclusion ; 2.2. Critères de non-inclusion ; 2.3. Critères d'exclusion ; 2.4. Taille de l'échantillon",
          ],
          ["3. RECUEIL DES DONNÉES", ""],
          [
            "4. [TECHNIQUE, TEST ÉVALUÉ OU PROTOCOLE]",
            "Seulement si l'étude porte sur un geste ou un test",
          ],
          ["5. [TEST DE RÉFÉRENCE OU DÉFINITIONS CLINIQUES]", ""],
          ["6. DÉFINITION DES VARIABLES", "Une sous-partie par famille de variables"],
          [
            "7. CRITÈRES DE JUGEMENT",
            "7.1. Critère de jugement principal ; 7.2. Critères de jugement secondaires",
          ],
          [
            "8. ANALYSE STATISTIQUE",
            "Une sous-partie par étape ; données manquantes et seuil de signification",
          ],
          ["9. CONSIDÉRATIONS ÉTHIQUES", ""],
        ]}
      />
      <P>
        Les numéros entre crochets dépendent de votre étude : sans partie technique, « Analyse
        statistique » remonte d'un rang. Les Résultats suivent le même ordre : « 1. DESCRIPTION DE
        LA POPULATION » (« 1.1. Effectif et diagnostic final » avec le diagramme de flux, « 1.2.
        Caractéristiques sociodémographiques et terrain »), puis l'objectif principal, puis les
        objectifs secondaires (« 3.1. Analyse univariée », « 3.2. Analyse multivariée »). Pour la
        partie 8, voyez{" "}
        <GuideLink slug="rediger-analyse-statistique-materiel-methodes-these">
          comment rédiger l'analyse statistique
        </GuideLink>
        .
      </P>
      <H3>Discussion et Conclusion</H3>
      <P>
        La règle écrite est nette : la Discussion respecte les objectifs, compare à la littérature
        et peut aboutir à des applications pratiques, mais n'apporte{" "}
        <strong>pas de nouveaux résultats</strong> et évite les rappels théoriques. Sur les thèses
        relevées, elle s'ouvre par « 1. PRINCIPAUX RÉSULTATS » et se termine par « FORCES ET LIMITES
        DE L'ÉTUDE », « PERSPECTIVES » et « PROPOSITION D'UNE CONDUITE À TENIR ». La Conclusion
        reprend les objectifs, la méthodologie et les résultats importants, puis propose des
        perspectives et des conduites pratiques ; elle tient en <strong>4 à 6 pages au plus</strong>
        , sans référence.
      </P>

      <H2 id="page">La page : règle écrite et modèle soutenu</H2>
      <Table
        caption="Réglages de la page à Sfax"
        head={["Élément", "Règle écrite", "Modèle soutenu (relevé)"]}
        rows={[
          ["Format", "A4", "A4"],
          [
            "Marges",
            "Gauche 3 cm ; haut, bas et droite 2 cm",
            "Haut 2,5 cm ; bas 2,5 cm ; gauche 2,8 cm ; droite 2,2 cm",
          ],
          ["Texte", "Times New Roman 14", "Times New Roman 14, justifié"],
          ["Interligne", "1,5", "1,5, sans espace après les paragraphes"],
          ["Retrait de première ligne", "Non précisé", "1,25 cm"],
          ["En-tête et pied de page", "Non précisés", "À 2 cm du bord"],
          ["Titres de chapitres", "Police du texte", "Lucian BT 36 (voir plus bas)"],
          ["Puces", "Non précisées", "Times New Roman 14, retrait gauche 1,5 cm"],
        ]}
      />
      <P>
        Pour les marges, la règle écrite prime : 3 cm à gauche, 2 cm ailleurs, sauf consigne
        contraire de votre directeur ou de la commission des thèses. Le modèle soutenu montre
        seulement qu'un écart a déjà été accepté.
      </P>

      <H2 id="titres">Les titres, niveau par niveau</H2>
      <P>
        Le titre du chapitre, en majuscules et non numéroté, occupe seul la page intercalaire. Les
        parties sont numérotées en chiffres arabes, jamais suivies de « : », et décalées vers la
        droite à chaque niveau.
      </P>
      <Table
        caption="Hiérarchie des titres relevée sur le modèle de Sfax"
        head={["Niveau", "Exemple", "Réglages relevés"]}
        rows={[
          [
            "Chapitre et page intercalaire",
            "RÉSULTATS",
            "Lucian BT 36 pt, gras, capitales, aligné à droite, filet fin en dessous, seul sur sa page",
          ],
          [
            "Niveau 1",
            "1. TYPE ET CADRE DE L'ÉTUDE",
            "Georgia 16 pt, gras, capitales, retrait de 1 cm",
          ],
          ["Niveau 2", "2.1. Critères d'inclusion", "Georgia 14 pt, gras, retrait de 2 cm"],
          ["Niveau 3", "1.2.1. Âge", "Georgia 13 pt, gras italique, retrait de 3 cm"],
          ["Niveau 4 (rare)", "1.2.1.1. Tranche d'âge", "Georgia 13 pt, gras, retrait de 4 cm"],
        ]}
      />
      <P>
        Attention : la règle écrite demande des titres de chapitres « dans la police du texte »,
        donc en Times New Roman. Le modèle soutenu utilise Lucian BT pour les chapitres et Georgia
        pour les parties. Si votre directeur n'exige pas le modèle, des titres en Times New Roman
        respectent la lettre de la règle.
      </P>
      <H3>Les polices du modèle</H3>
      <P>
        Lucian BT (chapitres), CentSchbook BT (numéros de page) et Lucida Calligraphy (en-têtes)
        sont les polices du modèle ; les deux premières sont peu courantes. Si elles manquent sur
        votre ordinateur, le PDF les remplace par une police voisine. Gardez les styles tels quels
        et produisez le PDF final sur un poste où elles sont installées. Pour les titres de
        chapitres, la règle écrite vous permet de toute façon d'utiliser la police du texte.
      </P>

      <H2 id="tableaux-figures">Tableaux, figures et légendes</H2>
      <H3>Les tableaux</H3>
      <List
        items={[
          "Chiffres romains ; titre au-dessus (règle écrite) ; numérotation continue sur toute la thèse.",
          "Légende en Times New Roman 14, gras italique, noir, centrée, sans point final.",
          "Aucune abréviation (règle écrite) : écrivez les termes en entier, ou explicitez-les dans la note sous le tableau.",
          "Si le tableau est repris d'un article, la source figure entre parenthèses à la fin du titre (règle écrite).",
          "Style de tableau Word du modèle (« Tableau Liste 6 Couleur - Accentuation 51 », texte et lignes bleutés), largeur de 16 cm, centré.",
          "Texte en Times New Roman 11 (10 si le tableau est dense), interligne simple ; première colonne à gauche, autres centrées ; en-tête répété à chaque page.",
          "Notes sous le tableau en Times New Roman 10.",
        ]}
      />
      <Note>
        Exemple de légende : « Tableau IV : Caractéristiques échographiques des patientes selon le
        diagnostic final ». Sans « HTA » ni « IMC » dans le titre : à Sfax, l'abréviation est
        interdite.
      </Note>
      <H3>Les figures</H3>
      <P>
        Chiffres arabes ; légende en dessous (règle écrite), dans le même style que les tableaux.
        Exemple : « Figure 1 : Diagramme de flux des patientes ». Sur les thèses relevées, les
        figures utilisent Times New Roman et font de 14,5 à 16 cm de large (9 à 12 cm pour un schéma
        étroit). Le modèle est enregistré en mode de compatibilité d'une ancienne version de Word :
        le PDF qu'il produit réduit les images à environ 200 points par pouce, alors que le fichier
        Word garde leur résolution d'origine. Pour le choix des graphiques, voyez{" "}
        <GuideLink slug="presenter-resultats-these-tableaux-figures">
          comment présenter vos résultats en tableaux et figures
        </GuideLink>
        .
      </P>

      <H2 id="pagination">En-têtes, pagination et pages liminaires</H2>
      <List
        items={[
          <>
            <strong>Pagination</strong> (règle écrite) : de l'Introduction à la Conclusion, en
            chiffres arabes à partir de 1. Sur le modèle, la section « RÉFÉRENCES » est paginée en
            chiffres romains majuscules (I, II…), les annexes ne sont pas numérotées et les pages
            intercalaires sont comptées sans numéro affiché.
          </>,
          <>
            <strong>En-tête</strong> (relevé) : nom du chapitre en Lucida Calligraphy 9, aligné à
            droite, filet fin en dessous ; aucun en-tête sur la page intercalaire.
          </>,
          <>
            <strong>Pied de page</strong> (relevé) : numéro en CentSchbook BT 10 gras, aligné à
            droite.
          </>,
        ]}
      />
      <H3>Les pages liminaires du modèle</H3>
      <List
        ordered
        items={[
          "Page de garde : à gauche « République tunisienne », le ministère et « Université de Sfax » ; à droite l'année universitaire et le numéro ; puis FACULTÉ DE MÉDECINE DE SFAX, THÈSE, DOCTEUR EN MÉDECINE, un tableau encadré titre et mots-clés en deux langues, un tableau du jury et du directeur.",
          "Liste des enseignants, dans sa dernière version publiée par la faculté.",
          "Serment.",
          "Dédicaces et remerciements (facultatifs).",
          "PLAN (le sommaire).",
          "LISTE DES ABRÉVIATIONS, par ordre alphabétique : elle suit le plan (règle écrite).",
          "LISTE DES TABLEAUX, puis LISTE DES FIGURES.",
        ]}
      />
      <P>
        En fin de thèse : les références, puis les annexes (facultatives, règle écrite). Le résumé
        et ses mots-clés vont au dos de la thèse ; sur le modèle, l'abstract est en dernière page.
      </P>

      <H2 id="references">Les références</H2>
      <List
        items={[
          "Vancouver, ordre d'apparition, chiffres arabes ; une référence citée de nouveau garde son numéro (règle écrite).",
          "Aucune référence non citée ; six auteurs, puis « et al. » (règle écrite).",
          "40 à 100 références pour la thèse ; en dehors de cette fourchette, une justification écrite signée du directeur (règle écrite).",
          "Proscrits : articles soumis, résumés de congrès non publiés, communications, sites web non officiels (règle écrite).",
          "Appel entre parenthèses, précédé d'une espace insécable, avant la ponctuation : « … (2). » ; plusieurs : « (12, 13) », avec une espace ; intervalle : « (5–8) ».",
          "Quand l'auteur est cité, le numéro suit son nom : « [Auteur] et al. (3) ont rapporté… ».",
          "Liste en Times New Roman 12, interligne 1,15, alignée à gauche, retrait suspendu de 1 cm.",
        ]}
      />

      <H2 id="jury">Le jury et la commission des thèses</H2>
      <List
        items={[
          "Le jury compte au moins quatre membres, avec un président de la FMSf et au moins deux membres extérieurs au service, dont un d'une autre spécialité.",
          "La commission des thèses contrôle la copie (dans un délai de 15 jours) et cachette chaque exemplaire.",
          "Une grille d'évaluation est jointe au procès-verbal ; elle n'est pas publique.",
        ]}
      />
      <P>
        Les critères de la grille publiée par la Faculté de médecine de Tunis sont un bon repère :
        population, objectif principal, objectifs secondaires, aucune discordance entre texte,
        tableaux et figures, tests adaptés, tableaux et figures appelés, verbes au passé. À Sfax, la
        copie est d'abord contrôlée par la commission des thèses : relisez-la point par point contre
        les recommandations écrites avant de la déposer.
      </P>

      <H2 id="erreurs">Les erreurs fréquentes à Sfax</H2>
      <List
        items={[
          "Mettre « : » après un titre, ou numéroter avec des chiffres romains ou des lettres (« A. », « B. »).",
          "Ajouter des sous-titres dans l'Introduction ou dans la Conclusion.",
          "Numéroter les titres de chapitres.",
          "Laisser des abréviations dans un titre, un tableau ou une figure.",
          "Un titre de thèse de plus de 10 mots, articles non comptés.",
          "Une Conclusion de plus de 6 pages, ou qui cite des références.",
          "Moins de 40 ou plus de 100 références sans justification signée du directeur.",
          "Citer un résumé de congrès non publié ou un site web non officiel.",
          "Ouvrir la Discussion par des rappels théoriques, ou y présenter un résultat nouveau.",
          "Relier la thèse par une spirale.",
        ]}
      />
      <P>
        Pour comparer avec Sousse, Tunis et Monastir, consultez{" "}
        <GuideLink slug="mise-en-forme-these-medecine-tunisie">
          les règles de mise en forme des quatre facultés
        </GuideLink>
        .
      </P>
    </>
  );
}
