import { GuideLink } from "@/components/guides/GuideLink";
import { Figure, H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "mise-en-forme-these-medecine-tunisie",
  category: "format",
  title: "Mise en forme de la thèse de médecine en Tunisie : les règles de chaque faculté",
  seoTitle: "Mise en forme de la thèse de médecine en Tunisie",
  description:
    "Marges, police, titres, légendes, références : ce qui est commun aux facultés de Sousse, Tunis, Monastir et Sfax, et ce qui change. Tableau comparatif.",
  keyword: "mise en forme thèse médecine Tunisie",
  datePublished: "2026-10-30",
  readingMinutes: 10,
  shortAnswer:
    "Les quatre facultés de médecine tunisiennes (Sousse, Tunis, Monastir, Sfax) partagent un socle : format A4, texte justifié en interligne 1,5, plan IMRaD, références Vancouver numérotées dans l'ordre d'apparition, tableaux en chiffres romains titrés au-dessus, figures en chiffres arabes légendées en dessous. Elles diffèrent sur la police (Times New Roman 12 ou 14, Tahoma 11), les marges, la numérotation des titres, la forme des appels de références et les pages intercalaires.",
  toc: [
    ["sources", "D'où viennent ces règles"],
    ["socle", "Ce qui est commun aux quatre facultés"],
    ["typographie", "La typographie française, partout"],
    ["comparatif", "Le tableau comparatif des quatre facultés"],
    ["titres", "Numérotation des titres : quatre systèmes"],
    ["references", "Appels et listes de références"],
    ["facultes", "Le guide détaillé de chaque faculté"],
    ["erreurs", "Les erreurs de mise en page qui coûtent cher"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="sources">D'où viennent ces règles</H2>
      <P>
        Chaque faculté fixe ses propres règles de présentation, mais elles ne les publient pas
        toutes de la même façon. La Faculté de médecine de Tunis (FMT) diffuse des « Procédures de
        la thèse de Doctorat en médecine » et une grille d'évaluation du jury. Celle de Monastir
        (FMM) publie une page « Procédure de thèse » qui fixe la présentation matérielle. Celle de
        Sfax (FMSf) diffuse des « Recommandations du déroulement et la rédaction des thèses ». Celle
        de Sousse (FMS) renvoie, dans l'article 37 de son règlement intérieur, à un guide
        méthodologique validé par le conseil scientifique, qui n'est pas public.
      </P>
      <P>
        Ces textes donnent les grandes règles : format, police, interligne, plan. Ils ne disent
        presque jamais la taille d'un titre de niveau 2 ou la couleur d'un filet de tableau. Les
        valeurs fines de ce guide ont donc été <strong>relevées</strong> : sur la copie finale de
        thèses soutenues, sur le gabarit Word de la faculté quand il existe, et sur des chapitres de
        thèses de chaque faculté que nous avons mis en forme. Le tableau ci-dessous distingue les
        deux niveaux.
      </P>
      <Table
        caption="Ce qui est écrit, ce qui a été relevé"
        head={["Faculté", "Texte officiel cité", "Valeurs relevées sur"]}
        rows={[
          [
            "Sousse (FMS)",
            "Règlement intérieur, articles 36 à 38 ; guide méthodologique non public",
            "La copie finale d'une thèse soutenue, qui sert de gabarit : toute la mise en page",
          ],
          [
            "Tunis (FMT)",
            "Procédures de la thèse (police, interligne, marges, en-tête, pagination) et grilles d'évaluation",
            "Des thèses soutenues : styles des titres, des tableaux et des légendes",
          ],
          [
            "Monastir (FMM)",
            "Page « Procédure de thèse » (format, police, taille 14, 100 pages au plus)",
            "La charte des mémoires de la faculté : marges, styles, taille 12",
          ],
          [
            "Sfax (FMSf)",
            "Recommandations (police, taille 14, marges, titres, références)",
            "Un modèle de thèse soutenue : marges réelles, polices des titres, style des tableaux",
          ],
        ]}
      />
      <Note>
        Ordre de priorité : le guide officiel de votre faculté, puis la consigne écrite de votre
        directeur de thèse, puis les valeurs relevées dans ce guide. Une couleur ou une police
        relevée sur un gabarit n'est pas une obligation réglementaire, sauf quand le texte de la
        faculté la cite. En cas de doute, demandez au service des thèses.
      </Note>

      <H2 id="socle">Ce qui est commun aux quatre facultés</H2>
      <P>Quelle que soit votre faculté, ces règles s'appliquent :</P>
      <List
        items={[
          <>
            <strong>Format A4</strong> (21 × 29,7 cm), texte <strong>justifié</strong>,{" "}
            <strong>interligne 1,5</strong>. L'interligne est écrit dans les règles de Tunis,
            Monastir et Sfax, et relevé à Sousse.
          </>,
          <>
            <strong>Plan IMRaD</strong> : Introduction, Matériel et méthodes, Résultats, Discussion,
            puis la Conclusion (« Conclusions » au pluriel à Tunis).
          </>,
          <>
            <strong>Références Vancouver</strong>, numérotées dans l'ordre de première citation. Une
            référence citée de nouveau garde son premier numéro.
          </>,
          <>
            <strong>Tableaux</strong> numérotés en chiffres romains (Tableau I, II, III…), titre{" "}
            <strong>au-dessus</strong>. <strong>Figures</strong> numérotées en chiffres arabes
            (Figure 1, 2, 3…), légende <strong>en dessous</strong>.
          </>,
          "Numérotation continue sur toute la thèse : les tableaux des Résultats suivent ceux du Matériel et méthodes, sans repartir à I.",
          "Chaque tableau et chaque figure est appelé dans le texte avant de paraître.",
          "Légende en forme nominale, sans point final, avec l'effectif total si utile : « Tableau III : Caractéristiques cliniques des patients (N = 120) ».",
          "Conclusion rédigée en prose, sans sous-titre et sans référence.",
          "Pages liminaires : liste des enseignants, serment, dédicaces, table des matières (ou plan), listes des abréviations, des tableaux et des figures.",
          "Résumé en français et abstract en anglais, avec titre et mots-clés.",
        ]}
      />
      <H3>Les pages intercalaires</H3>
      <P>
        Trois facultés sur quatre séparent les chapitres par une page intercalaire qui ne porte que
        le titre du chapitre : Sousse, Monastir et Sfax (où elle figure dans la règle écrite). À
        Tunis, les thèses relevées n'en ont pas : le titre du chapitre, centré, ouvre la première
        page du chapitre. Les pages intercalaires n'ont ni en-tête ni numéro affiché.
      </P>
      <H3>Les figures</H3>
      <P>
        Les thèses relevées utilisent dans les figures la même police que le texte, ne mettent aucun
        titre dans l'image (la légende Word est le seul titre) et gardent des caractères lisibles
        une fois la figure insérée. La légende reste liée à sa figure : jamais une légende seule en
        haut de page.
      </P>
      <Figure
        caption="Exemple de diagramme de flux : 134 patients recueillis, 14 exclus avec leur motif, 120 analysés puis répartis en deux groupes"
        source="Page de démonstration produite par notre chaîne de mise en page, sur une étude fictive."
      >
        <img
          src="/guides/exemples/figure-flux.png"
          alt="Diagramme de flux : bandeau Sélection, 134 patients recueillis, 14 exclus (dossier incomplet : 9 ; chirurgie associée : 5), 120 patients analysés ; bandeau Répartition, 21 avec complication (17,5 %) et 99 sans complication (82,5 %)"
          width={1800}
          height={1144}
          loading="lazy"
          className="mx-auto h-auto w-full max-w-[520px] rounded border border-border bg-white"
        />
      </Figure>

      <H2 id="typographie">La typographie française, partout</H2>
      <P>
        Une thèse rédigée en français suit la typographie française, dans le texte comme dans les
        tableaux. Ce sont les fautes les plus visibles pour un jury, et les plus faciles à éviter.
      </P>
      <Table
        caption="Typographie : écrire, éviter"
        head={["Écrire", "Éviter", "Règle"]}
        rows={[
          ["73,6 %", "73.6% ou 73,6%", "Virgule décimale, espace insécable avant %"],
          ["p = 0,032", "p=0.032", "Espaces autour du signe égal"],
          ["p < 0,001", "p = 0,000", "Une valeur de p n'est jamais nulle"],
          ["médiane 53 ans [34–63]", "[34-63]", "Tiret demi-cadratin dans les intervalles"],
          ["1 250 patients", "1250 ou 1.250 patients", "Espace insécable pour les milliers"],
          ["128 patients (73,6 %)", "128 (73,6 %) patients", "Le pourcentage suit le nom"],
          ["ÉVOLUTION", "EVOLUTION", "Capitales accentuées"],
          ["« âge »", '"âge"', "Guillemets français"],
          ["−2,4", "-2,4", "Vrai signe moins pour une valeur négative"],
        ]}
      />
      <P>
        Mettez aussi une espace insécable avant « : », « ; », « ? » et « ! », entre « Tableau » ou «
        Figure » et son numéro, et dans « IC 95 % ». Définissez chaque sigle à sa première
        apparition, entre parenthèses, et jamais dans un titre.
      </P>
      <Note>
        Thèse rédigée en anglais (admis à Tunis, Monastir et Sfax) : point décimal et pourcentage
        collé (« 38.6% »), « p = 0.014 », légendes « Table II: … » et « Figure 1: … » sans espace
        avant les deux-points, nombre écrit en toutes lettres en début de phrase.
      </Note>

      <H2 id="comparatif">Le tableau comparatif des quatre facultés</H2>
      <P>
        Les valeurs marquées « officiel » viennent du texte de la faculté. Les autres ont été
        relevées sur des thèses soutenues et sur le gabarit de la faculté. Marges dans l'ordre haut
        / bas / gauche / droite.
      </P>
      <Table
        caption="Mise en forme de la thèse de médecine : Sousse, Tunis, Monastir, Sfax"
        head={["Élément", "Sousse (FMS)", "Tunis (FMT)", "Monastir (FMM)", "Sfax (FMSf)"]}
        rows={[
          [
            "Marges",
            "2,5 / 2,5 / 3 / 2,5 cm",
            "2 / 2 / 4 (reliure) / 2,5 cm (officiel)",
            "2,5 / 2,3 / 2,5 / 2,5 cm",
            "Officiel : 2 / 2 / 3 / 2 cm ; modèle soutenu : 2,5 / 2,5 / 2,8 / 2,2 cm",
          ],
          [
            "Police du texte",
            "Times New Roman 12",
            "Tahoma 11 (officiel)",
            "Officiel : Times New Roman, Arial ou Calibri, taille 14 ; charte des mémoires : Times New Roman 12",
            "Times New Roman 14 (officiel)",
          ],
          ["Interligne", "1,5", "1,5 (officiel)", "1,5 (officiel)", "1,5 (officiel)"],
          ["Retrait de première ligne", "Aucun", "Aucun", "1,25 cm", "1,25 cm"],
          [
            "Titres",
            "AvantGarde Bk BT, gras ; I. / 1. / 1.1. / 1.1.1. ; « : » final",
            "Tahoma, gras ; 1. / 1.1. / 1.1.1. ; sans « : »",
            "Times New Roman, gras ; 1. / 1.1. / 1.1.1. ; sans « : »",
            "Georgia, gras ; 1. à 1.1.1.1. ; chiffres arabes seuls, jamais « : » (officiel)",
          ],
          [
            "Pages intercalaires",
            "Oui : Albertus 45, bleu ciel, à droite",
            "Non : titre de chapitre centré",
            "Oui : Times New Roman 36 gras, bleu, centré",
            "Oui (officiel) : Lucian BT 36 dans le modèle, à droite",
          ],
          [
            "Légende des tableaux",
            "Souvenir Lt BT 11, gras italique, bleu foncé, centrée",
            "Tahoma 10,5, « Tableau II : » en gras, alignée à gauche",
            "Times New Roman 12, gras, centrée",
            "Times New Roman 14, gras italique, centrée",
          ],
          [
            "Légende des figures",
            "Comme les tableaux, centrée",
            "Tahoma 10,5, « Figure 1 : » en gras, centrée",
            "Times New Roman 12, gras, centrée",
            "Times New Roman 14, gras italique, centrée",
          ],
          [
            "Texte des tableaux",
            "Times New Roman 11, filets bleus, sans filet vertical",
            "Tahoma 9,5, lignes alternées bleu pâle",
            "Times New Roman 10, lignes alternées bleu pâle",
            "Times New Roman 11, style de tableau du modèle ; abréviations interdites (officiel)",
          ],
          [
            "En-tête",
            "Nom du chapitre, à droite",
            "Titre de la thèse à gauche, chapitre à droite, italique 9 (officiel)",
            "Titre de la thèse à gauche, chapitre à droite",
            "Nom du chapitre, à droite",
          ],
          [
            "Appel des références",
            "(3,4,6)",
            "[4, 7] entre crochets (officiel)",
            "[1, 2]",
            "(12, 13)",
          ],
          ["« Analyse statistique » dans le M&M", "IX.", "6.", "7.", "8."],
          [
            "Conclusion",
            "CONCLUSION",
            "CONCLUSIONS, plan imposé (officiel)",
            "CONCLUSION visée par le directeur (officiel)",
            "CONCLUSION, 4 à 6 pages au plus (officiel)",
          ],
          [
            "Pagination",
            "Liminaires en chiffres romains minuscules, puis continue",
            "De l'Introduction à la fin des Conclusions (officiel)",
            "Intercalaires non numérotées",
            "De l'Introduction à la fin de la Conclusion (officiel) ; références en I, II…",
          ],
          [
            "Langues",
            "Français",
            "Français, anglais, arabe",
            "Français, anglais, arabe",
            "Français, anglais",
          ],
        ]}
      />
      <P>
        Trois polices de Sousse (AvantGarde Bk BT, Albertus, Souvenir Lt BT) et deux de Sfax (Lucian
        BT, CentSchbook BT) sont peu courantes. Si elles ne sont pas installées sur votre
        ordinateur, le PDF les remplace par une police voisine. Gardez les styles du gabarit tels
        quels et produisez le PDF final sur un poste où ces polices sont installées.
      </P>
      <Figure
        caption="La même page de Résultats (titre, paragraphe, Tableau IX et Figure 5) mise en forme à la charte de chacune des quatre facultés (pour Monastir, la charte des mémoires, texte en 12)"
        source="Page de démonstration produite par notre chaîne de mise en page, sur une étude fictive."
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <img
              src="/guides/exemples/resultats-fms.png"
              alt="Page 41 d'un chapitre Résultats à la charte de Sousse : titre « IV. FACTEURS ASSOCIÉS AUX COMPLICATIONS : » en capitales, sous-titre « 1. Analyse univariée : » en petites capitales, paragraphe justifié avec les p en gras, Tableau IX à légende bleue en gras italique au-dessus, puis Figure 5 en boîtes à moustaches légendée en dessous"
              width={1406}
              height={1988}
              loading="lazy"
              className="mx-auto h-auto w-full max-w-[520px] rounded border border-border bg-white"
            />
            <p className="mt-2 text-center text-sm text-muted-foreground">Sousse (FMS)</p>
          </div>
          <div>
            <img
              src="/guides/exemples/resultats-fmt.png"
              alt="Page 41 d'un chapitre Résultats à la charte de Tunis : texte en police sans empattement, titres « 5. Facteurs associés aux complications » en bleu et « 5.1. Analyse univariée », Tableau IX à légende alignée à gauche, une ligne sur deux sur fond bleu pâle, puis Figure 5 en boîtes à moustaches"
              width={1406}
              height={1988}
              loading="lazy"
              className="mx-auto h-auto w-full max-w-[520px] rounded border border-border bg-white"
            />
            <p className="mt-2 text-center text-sm text-muted-foreground">Tunis (FMT)</p>
          </div>
          <div>
            <img
              src="/guides/exemples/resultats-fmm.png"
              alt="Page 41 d'un chapitre Résultats à la charte de Monastir : en-tête bleu avec le titre de la thèse, titre « 3. Facteurs associés aux complications » en petites capitales bleu nuit, paragraphe avec retrait de première ligne, Tableau IX à légende centrée en gras, puis Figure 5 en boîtes à moustaches"
              width={1406}
              height={1988}
              loading="lazy"
              className="mx-auto h-auto w-full max-w-[520px] rounded border border-border bg-white"
            />
            <p className="mt-2 text-center text-sm text-muted-foreground">Monastir (FMM)</p>
          </div>
          <div>
            <img
              src="/guides/exemples/resultats-fmsf.png"
              alt="Page 41 d'un chapitre Résultats à la charte de Sfax : texte en Times New Roman 14, titre « 3. FACTEURS ASSOCIÉS AUX COMPLICATIONS » sans deux-points, « 3.1. Analyse univariée » plus en retrait, Tableau IX en texte bleuté avec abréviations explicitées dans la note ; la figure passe à la page suivante"
              width={1406}
              height={1988}
              loading="lazy"
              className="mx-auto h-auto w-full max-w-[520px] rounded border border-border bg-white"
            />
            <p className="mt-2 text-center text-sm text-muted-foreground">Sfax (FMSf)</p>
          </div>
        </div>
      </Figure>

      <H2 id="titres">Numérotation des titres : quatre systèmes</H2>
      <P>
        C'est la différence qui saute le plus aux yeux d'un jury. Une thèse de Sousse numérotée « à
        la mode de Sfax », ou l'inverse, se repère dès la table des matières.
      </P>
      <Table
        caption="Exemples de titres à chaque niveau, par faculté"
        head={["Faculté", "Niveau 1", "Niveau 2", "Niveau 3"]}
        rows={[
          ["Sousse", "II. POPULATION D'ÉTUDE :", "1. Critères d'inclusion :", "2.1. Âge :"],
          [
            "Tunis",
            "2. Population d'étude",
            "2.1. Critères d'inclusion",
            "2.5.1. Moment de survenue et causes",
          ],
          [
            "Monastir",
            "2. Population d'étude (petites capitales)",
            "2.2. Critères d'inclusion",
            "1.2.1. Âge",
          ],
          ["Sfax", "2. POPULATION DE L'ÉTUDE", "2.1. Critères d'inclusion", "1.2.1. Âge"],
        ]}
      />
      <List
        items={[
          <>
            <strong>Sousse</strong> combine chiffres romains au premier niveau et chiffres arabes
            ensuite, et termine chaque titre par une espace insécable et « : ».
          </>,
          <>
            <strong>Tunis</strong> et <strong>Monastir</strong> utilisent une numérotation décimale
            en chiffres arabes, sans « : » final.
          </>,
          <>
            <strong>Sfax</strong> l'écrit dans sa règle : chiffres arabes uniquement (chiffres
            romains et lettres proscrits), jamais de « : » après un titre, quatre niveaux de
            subdivision au plus, et aucun titre ni sous-titre dans l'Introduction et la Conclusion.
          </>,
        ]}
      />
      <H3>Où tombe « Analyse statistique »</H3>
      <P>
        Dans le plan type du Matériel et méthodes relevé dans chaque faculté, la partie « Analyse
        statistique » porte le numéro IX à Sousse, 6 à Tunis, 7 à Monastir et 8 à Sfax. Ce numéro
        dépend des parties qui la précèdent. À Sousse, deux parties n'existent que si l'étude évalue
        un geste, un test ou un traitement (« Technique étudiée », « Évaluation de la sécurité ») ;
        à Sfax, la partie « Technique » n'existe que si l'étude porte sur un geste ou un test. Sans
        elles, le numéro descend. Ce qui compte : une numérotation sans trou, identique dans le
        texte et dans la table des matières.
      </P>

      <H2 id="references">Appels et listes de références</H2>
      <P>
        Toutes les facultés demandent le style Vancouver, par ordre d'apparition. Mais la forme de
        l'appel dans le texte change : parenthèses à Sousse et à Sfax, crochets à Tunis (c'est la
        règle écrite) et à Monastir. Partout, l'appel est précédé d'une espace insécable et placé{" "}
        <strong>avant</strong> la ponctuation : « … dans la population tunisienne [12]. » et non « …
        tunisienne. [12] ».
      </P>
      <Table
        caption="Format des appels et de la liste de références"
        head={["Faculté", "Un appel", "Plusieurs", "Intervalle", "Liste"]}
        rows={[
          [
            "Sousse",
            "(25)",
            "(3,4,6), sans espace",
            "(5–8)",
            "Times New Roman 12, interligne 1,15",
          ],
          ["Tunis", "[17]", "[4, 7]", "[1–3]", "Tahoma 10, interligne 1 (officiel)"],
          ["Monastir", "[1]", "[1, 2]", "[3–5]", "Times New Roman 11, interligne 1"],
          [
            "Sfax",
            "(2)",
            "(12, 13), avec espace",
            "(5–8)",
            "Times New Roman 12, interligne 1,15 ; 40 à 100 références (officiel)",
          ],
        ]}
      />
      <Note>
        Modèle de notice Vancouver : « Nom AB, Nom CD, Nom EF, Nom GH, Nom IJ, Nom KL, et al. Titre
        de l'article tel que publié. Abréviation de la revue. Année;Volume(Numéro):pages. doi:… ».
        Six auteurs au plus, puis « et al. » (règle écrite à Sfax).
      </Note>
      <P>
        À Tunis, l'appel n'est ni en italique ni en gras (règle écrite). À Sfax, quand l'auteur est
        cité, le numéro suit immédiatement son nom : « [Auteur] et al. (3) ont rapporté… ».
      </P>

      <H2 id="facultes">Le guide détaillé de chaque faculté</H2>
      <P>
        Chaque page reprend le règlement cité, le plan type avec ses titres numérotés, la page, les
        titres niveau par niveau, les tableaux, les figures, les en-têtes, la pagination et ce que
        le jury vérifie.
      </P>
      <List
        items={[
          <>
            <GuideLink slug="mise-en-forme-these-faculte-medecine-sousse">
              Faculté de médecine de Sousse
            </GuideLink>{" "}
            : gabarit de la copie finale soutenue, titres en chiffres romains terminés par « : »,
            pages liminaires en chiffres romains minuscules.
          </>,
          <>
            <GuideLink slug="mise-en-forme-these-faculte-medecine-tunis">
              Faculté de médecine de Tunis
            </GuideLink>{" "}
            : Tahoma 11, marge de reliure de 4 cm, en-tête à deux zones, « Conclusions » au plan
            imposé, grille officielle du jury.
          </>,
          <>
            <GuideLink slug="mise-en-forme-these-faculte-medecine-monastir">
              Faculté de médecine de Monastir
            </GuideLink>{" "}
            : taille 14 officielle, 100 pages au plus, résumés en quatrième de couverture,
            conclusion visée par le directeur.
          </>,
          <>
            <GuideLink slug="mise-en-forme-these-faculte-medecine-sfax">
              Faculté de médecine de Sfax
            </GuideLink>{" "}
            : Times New Roman 14, chiffres arabes seuls, aucun « : » après un titre, 40 à 100
            références, titre de 10 mots au plus.
          </>,
        ]}
      />

      <H2 id="erreurs">Les erreurs de mise en page qui coûtent cher</H2>
      <P>
        Aucune de ces erreurs ne touche le fond de votre travail. Toutes donnent pourtant au jury
        l'impression d'une thèse relue trop vite, et certaines contredisent une règle écrite de la
        faculté.
      </P>
      <List
        items={[
          "Mélanger les conventions de deux facultés : chiffres romains ou « : » final dans une thèse de Sfax, crochets dans une thèse de Sousse.",
          "Un tableau ou une figure qui n'est pas appelé dans le texte, ou qui paraît avant son appel.",
          "Une numérotation qui repart à I dans les Résultats, ou qui saute un numéro.",
          "Une même donnée détaillée dans un tableau et dans une figure, ou un texte qui recopie le tableau ligne par ligne.",
          "Des chiffres discordants entre le texte, les tableaux et les figures : c'est un critère explicite de la grille du jury de Tunis.",
          "Des abréviations dans les titres (et, à Sfax, dans les tableaux et les figures).",
          "Une table des matières tapée à la main : utilisez les styles de titre de Word pour qu'elle se génère et se mette à jour.",
          "Une légende seule en haut de page, un titre seul en bas de page, ou un grand blanc laissé par une figure qui ne tient pas.",
          "« p = 0,000 », des points décimaux, des intervalles avec un trait d'union.",
          "Une thèse trop longue : 100 pages au plus à Monastir, corps de 50 à 100 pages à Sfax.",
          "Des références dans la Conclusion, ou une référence de la liste qui n'est citée nulle part dans le texte.",
        ]}
      />
      <P>
        Avant l'impression, relisez un PDF produit par Word, page par page : c'est lui qui montre
        les blancs, les légendes orphelines et les polices de remplacement.
      </P>
    </>
  );
}
