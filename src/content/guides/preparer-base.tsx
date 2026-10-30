import { Link } from "@tanstack/react-router";
import { GuideLink } from "@/components/guides/GuideLink";
import { Figure, H2, H3, List, Note, P, ShortAnswer, Table } from "@/components/guides/Prose";
import { EntryGrid, Recoding } from "@/components/guides/figures/DataGrid";
import type { GuideMeta } from "@/content/guides/types";

export const meta: GuideMeta = {
  slug: "preparer-base-donnees-excel-spss-these",
  category: "preparer",
  title: "Préparer sa base Excel ou SPSS : les 10 erreurs qui retardent l'analyse",
  seoTitle: "Préparer sa base Excel ou SPSS de thèse : 10 erreurs",
  description:
    "Une ligne par patient, des codes, des dates propres, des manquants bien saisis : les 10 erreurs qui retardent l'analyse de votre thèse.",
  keyword: "préparer base de données Excel SPSS thèse",
  datePublished: "2026-10-30",
  readingMinutes: 7,
  shortAnswer:
    "Une base exploitable suit trois règles : une ligne par patient, une colonne par variable, une seule information par cellule. Les variables qualitatives sont codées (1 = oui, 0 = non) et décrites dans un dictionnaire, les dates et les unités sont homogènes, une donnée inconnue reste une cellule vide, jamais un 0 ni une valeur devinée. La base ne contient ni nom, ni téléphone, ni numéro de dossier.",
  toc: [
    ["regles", "Les trois règles de base"],
    ["erreurs", "Les 10 erreurs en un tableau"],
    ["codage", "Coder les variables qualitatives"],
    ["formats", "Dates, unités et variables calculées"],
    ["manquantes", "Données manquantes : ne jamais deviner"],
    ["controles", "Valeurs impossibles et doublons"],
    ["anonymisation", "Anonymiser la base"],
    ["spss", "Passer d'Excel à SPSS"],
    ["checklist", "La check-list finale"],
  ],
};

export function Body() {
  return (
    <>
      <ShortAnswer>{meta.shortAnswer}</ShortAnswer>

      <H2 id="regles">Les trois règles de base</H2>
      <P>
        La plupart des retards d'analyse ne viennent pas des statistiques mais de la base. Une base
        mal structurée doit être reprise avant le moindre test, parfois dossier par dossier. Trois
        règles évitent l'essentiel des problèmes :
      </P>
      <List
        ordered
        items={[
          <>
            <strong>Une ligne = un patient</strong> (ou une unité d'analyse : un œil, un séjour, un
            cycle). Pas de ligne de titre au milieu, pas de ligne de total en bas, pas de deuxième
            tableau à côté.
          </>,
          <>
            <strong>Une colonne = une variable</strong>, avec un nom court sur une seule ligne
            d'en-tête. Pas de cellules fusionnées, pas d'en-têtes sur deux niveaux.
          </>,
          <>
            <strong>Une cellule = une seule information</strong>. « HTA + diabète » dans une cellule
            contient deux variables ; « 38,5 °C » mélange une valeur et une unité.
          </>,
        ]}
      />
      <P>
        Ajoutez une première colonne avec un <strong>identifiant d'étude</strong> (1, 2, 3… ou P001,
        P002…), propre à votre thèse et sans lien visible avec l'identité du patient. Gardez les
        données sur une seule feuille, et le dictionnaire des variables sur une autre.
      </P>
      <Note>
        N'utilisez jamais la couleur comme information. Une ligne surlignée en rouge pour « décédé »
        est invisible pour SPSS : créez une colonne deces (0/1).
      </Note>

      <H2 id="erreurs">Les 10 erreurs en un tableau</H2>
      <Table
        caption="Mauvaise saisie et bonne saisie, exemples illustratifs"
        head={["Erreur", "Mauvaise saisie", "Bonne saisie"]}
        rows={[
          [
            "1. Plusieurs informations par cellule",
            "atcd : « HTA, diabète »",
            "hta : 1 ; diabete : 1 (une colonne 0/1 par antécédent)",
          ],
          [
            "2. Structure en désordre",
            "Deux lignes pour un patient, cellules fusionnées, couleurs",
            "Une ligne par patient, une colonne par variable",
          ],
          [
            "3. Texte libre non codé",
            "« Oui », « oui », « O », « + », « présent »",
            "1 = oui, 0 = non, partout",
          ],
          [
            "4. Cases multiples dans une colonne",
            "symptomes : « fièvre, toux »",
            "fievre : 1 ; toux : 1 ; dyspnee : 0",
          ],
          [
            "5. Dates hétérogènes",
            "« 12/3/23 », « mars 2023 », « 2023.03.12 »",
            "12/03/2023, au format date d'Excel",
          ],
          [
            "6. Unités mélangées",
            "Hb : « 115 » (g/L) et « 11,5 » (g/dL)",
            "hb_gdl : 11,5 pour tous",
          ],
          [
            "7. Manquants confondus",
            "« 0 », « NR », « ? », « / » pour une donnée inconnue",
            "Cellule vide",
          ],
          [
            "8. Valeur impossible",
            "Âge 250 ans, PAS 1120 mmHg",
            "Valeur vérifiée dans le dossier, sinon cellule vide",
          ],
          [
            "9. Doublon",
            "Même patient saisi deux fois sous deux identifiants",
            "Un identifiant unique, vérifié avant l'analyse",
          ],
          [
            "10. Variable calculée seule",
            "obesite : « oui », sans poids ni taille",
            "poids_kg, taille_cm (l'IMC se calcule ensuite)",
          ],
        ]}
      />
      <P>
        Une onzième faute, plus grave que les autres : laisser dans la base des noms, des numéros de
        téléphone ou des numéros de dossier. Nous y revenons plus bas.
      </P>

      <H3>Un exemple avant et après</H3>
      <P>
        Dans une base mal construite, on trouve souvent une seule cellule de ce type : « Mme, 54
        ans, HTA, Hb 115, entrée le 12/3/23 ». Toutes ces informations existent, mais aucune n'est
        analysable. La même patiente, dans une base exploitable :
      </P>
      <Table
        caption="La même information, saisie de façon exploitable"
        head={["id", "sexe", "age", "hta", "diabete", "hb_gdl", "date_adm"]}
        rows={[["P001", "2", "54", "1", "0", "11,5", "12/03/2023"]]}
      />
      <P>
        Chaque colonne est une variable, chaque code est décrit dans le dictionnaire (sexe : 1 =
        homme, 2 = femme), l'hémoglobine est convertie dans l'unité choisie et la date est une vraie
        date. Le diabète, absent de la cellule d'origine, n'est saisi 0 que si le dossier indique
        explicitement son absence ; sinon, la cellule reste vide.
      </P>
      <Figure
        caption="Figure 1. La même patiente, saisie dans une seule cellule puis en base exploitable"
        source="Exemple de ce guide. Le diabète n'est saisi 0 que si le dossier indique explicitement son absence."
      >
        <EntryGrid />
      </Figure>

      <H2 id="codage">Coder les variables qualitatives</H2>
      <H3>Des codes numériques, toujours les mêmes</H3>
      <P>
        Saisissez des codes plutôt que du texte : 1 = oui, 0 = non pour les variables binaires ; 1,
        2, 3… pour les variables à plusieurs modalités (stade I, II, III). Le même code doit avoir
        le même sens dans toute la base : si 1 = oui pour l'HTA, 1 = oui aussi pour le diabète. Pour
        les variables ordonnées, suivez l'ordre clinique (1 = léger, 2 = modéré, 3 = sévère).
      </P>
      <H3>Le dictionnaire des variables</H3>
      <P>
        Sur une feuille séparée, une ligne par variable : nom court, libellé complet, unité, codes
        et leur signification, valeurs plausibles. C'est le document qui permet à votre encadrant ou
        au statisticien de lire la base sans vous appeler.
      </P>
      <Table
        caption="Extrait de dictionnaire des variables (exemple)"
        head={["Variable", "Libellé", "Type", "Codes ou unité"]}
        rows={[
          ["id", "Identifiant d'étude", "Texte", "P001, P002…"],
          ["sexe", "Sexe", "Qualitative", "1 = homme, 2 = femme"],
          ["age", "Âge à l'admission", "Quantitative", "années"],
          ["hta", "Hypertension artérielle", "Binaire", "0 = non, 1 = oui"],
          ["nyha", "Classe NYHA", "Ordinale", "1 = I, 2 = II, 3 = III, 4 = IV"],
          ["creat", "Créatinine à l'admission", "Quantitative", "µmol/L"],
        ]}
      />
      <H3>Texte libre et cases à cocher multiples</H3>
      <P>
        Le texte libre ne s'analyse pas. Si une information n'existe qu'en clair dans les dossiers
        (motif de consultation, compte rendu opératoire), définissez des catégories avant la saisie
        et codez-les. Une colonne de commentaire peut rester, mais elle ne sert pas à l'analyse.
      </P>
      <P>
        Quand plusieurs réponses sont possibles (symptômes, antécédents, complications), créez une
        colonne 0/1 par réponse. Une seule colonne « fièvre, toux, dyspnée » oblige à tout
        redécouper à la main.
      </P>
      <Figure
        caption="Figure 2. Une réponse, un code : harmoniser le texte libre et les données inconnues avant l'analyse"
        source="Écritures tirées des erreurs 3 et 7 du tableau ci-dessus. Un 0 ne reste que si la valeur vaut réellement zéro."
      >
        <Recoding />
      </Figure>

      <H2 id="formats">Dates, unités et variables calculées</H2>
      <H3>Les dates</H3>
      <P>
        Une date par colonne (naissance, admission, intervention, sortie), toutes au même format
        jour/mois/année et reconnues comme des dates par Excel. Une date alignée à gauche dans la
        cellule est souvent du texte : elle ne permettra aucun calcul de délai. Si seule l'année est
        connue, ne fabriquez pas un « 01/01 » : notez-le dans le dictionnaire ou utilisez une
        colonne séparée.
      </P>
      <H3>Les nombres et les unités</H3>
      <P>
        Une colonne quantitative ne contient que des nombres : pas de « 38,5 °C », de « &lt; 5 » ni
        de « environ 60 ». Mettez l'unité dans le nom de la colonne (creat_umol, hb_gdl) et
        convertissez toutes les valeurs dans cette unité. Vérifiez aussi le séparateur décimal : sur
        un poste réglé en français, « 11.5 » saisi avec un point est souvent lu comme du texte.
      </P>
      <H3>Les mesures répétées</H3>
      <P>
        Si une même mesure est relevée à plusieurs temps (hémoglobine à J0, J7 et J30), gardez une
        ligne par patient et créez une colonne par temps : hb_j0, hb_j7, hb_j30. C'est le format
        qu'attendent les tests appariés dans SPSS. Ajouter une ligne par consultation oblige à
        restructurer la base avant l'analyse.
      </P>
      <H3>Les variables calculées</H3>
      <P>
        Saisissez les valeurs brutes, pas seulement leur résumé : l'âge (ou les dates) plutôt que la
        classe d'âge, le poids et la taille plutôt que « obèse oui/non », la valeur de la troponine
        plutôt que « positive ». Les classes, l'IMC, les délais et les scores se calculent ensuite,
        selon des définitions écrites dans votre M&M. L'inverse est impossible : une classe d'âge ne
        redonne jamais l'âge.
      </P>

      <H2 id="manquantes">Données manquantes : ne jamais deviner</H2>
      <P>
        Une donnée absente du dossier reste absente. Ne la remplacez ni par 0, ni par la valeur «
        habituelle », ni par celle du patient voisin. Distinguez soigneusement ce qui ressemble à
        une absence :
      </P>
      <Table
        caption="Ne pas confondre les situations"
        head={["Situation", "Saisie conseillée"]}
        rows={[
          ["Examen fait, résultat normal", "Le code « normal » ou la valeur mesurée"],
          ["Examen fait, résultat anormal", "Le code « anormal » ou la valeur mesurée"],
          [
            "Examen non fait",
            "Un code dédié (par exemple 9 = non fait), déclaré manquant dans SPSS",
          ],
          ["Information non retrouvée dans le dossier", "Cellule vide"],
          ["Valeur réellement égale à zéro", "0"],
        ]}
      />
      <P>
        Pourquoi c'est important : si une donnée inconnue est saisie 0 (« non »), les pourcentages
        sont faussés sans que personne le voie. Si elle est saisie « NR » dans une colonne de
        nombres, SPSS transforme toute la colonne en texte. Une cellule vide est simplement exclue
        du calcul, et le dénominateur réel s'affiche dans vos tableaux (par exemple 34/48).
      </P>
      <P>
        Cette règle se retrouve dans votre M&M, qui doit dire comment les données manquantes ont été
        traitées. Une formulation simple suffit dans la plupart des thèses :
      </P>
      <Note>
        « Les pourcentages ont été calculés sur les données disponibles ; le dénominateur est
        précisé lorsqu'il diffère de l'effectif total. Les données manquantes n'ont fait l'objet
        d'aucune imputation. »
      </Note>
      <Note>
        Si vous utilisez un code pour « manquant » (99 ou 999), déclarez-le comme valeur manquante
        dans SPSS. Sinon, il entre dans les moyennes : un âge moyen de 112 ans trahit souvent un 999
        oublié.
      </Note>

      <H2 id="controles">Valeurs impossibles et doublons</H2>
      <P>
        Avant d'envoyer votre base, triez chaque colonne quantitative du plus petit au plus grand et
        regardez les extrêmes. Une pression artérielle de 1120 mmHg (pour 112), une hémoglobine de
        57 g/dL (une valeur en g/L saisie dans une colonne en g/dL), une date de sortie antérieure à
        l'admission : retournez au dossier. Si la valeur juste n'est pas retrouvée, laissez la
        cellule vide. Ne corrigez jamais « au jugé ».
      </P>
      <P>
        Pour les doublons, triez par identifiant, puis par date de naissance et date d'admission.
        Deux lignes presque identiques peuvent être un doublon de saisie ou deux séjours du même
        patient. Ne supprimez rien sans avoir vérifié dans les dossiers, et décidez à l'avance de
        l'unité d'analyse : le patient ou le séjour.
      </P>

      <H3>Les contrôles de cohérence</H3>
      <P>
        Certaines erreurs ne se voient qu'en croisant deux colonnes. Quelques vérifications rapides,
        par filtre ou tableau croisé :
      </P>
      <List
        items={[
          "une date de sortie antérieure à la date d'admission, ou un délai négatif ;",
          "une grossesse chez un patient codé homme ;",
          "une complication postopératoire chez un patient non opéré ;",
          "un âge qui ne correspond pas à la date de naissance et à la date d'admission ;",
          "une variable « autre, préciser » cochée sans précision, ou une précision sans case cochée.",
        ]}
      />
      <Note>
        Gardez toujours une copie intacte de la base d'origine et travaillez sur une copie. Notez
        chaque correction dans un journal : identifiant du patient, variable, valeur avant, valeur
        après, motif. Vous pourrez justifier chaque chiffre devant votre encadrant ou le jury.
      </Note>

      <H2 id="anonymisation">Anonymiser la base</H2>
      <P>
        La base qui circule (vers votre encadrant, un statisticien, une clé USB) ne doit contenir
        aucune donnée permettant d'identifier un patient :
      </P>
      <List
        items={[
          "ni nom, ni prénom, ni initiales ;",
          "ni numéro de téléphone, ni adresse précise ;",
          "ni numéro de dossier, ni numéro d'identité ou d'assurance.",
        ]}
      />
      <P>
        Si vous devez pouvoir revenir au dossier pour une vérification, tenez une table de
        correspondance (identifiant d'étude, numéro de dossier) dans un fichier séparé, protégé, que
        vous gardez pour vous et qui ne quitte pas le service. Remplacez la date de naissance par
        l'âge si l'analyse n'a pas besoin des dates exactes.
      </P>

      <H2 id="spss">Passer d'Excel à SPSS</H2>
      <P>
        Une base Excel bien construite s'importe dans SPSS en quelques minutes. La ligne d'en-tête
        devient le nom des variables : des noms courts, commençant par une lettre, sans espace ni
        accent ni caractère spécial (age, hta, creat_umol) passent sans difficulté. Ensuite, dans
        l'onglet <strong>Affichage des variables</strong> :
      </P>
      <List
        items={[
          <>
            <strong>Étiquette</strong> : le libellé complet (« Créatinine à l'admission (µmol/L) »),
            qui apparaîtra dans les tableaux.
          </>,
          <>
            <strong>Valeurs</strong> : les étiquettes de valeurs (1 = « Homme », 2 = « Femme »).
            Sans elles, vos tableaux affichent des 1 et des 2.
          </>,
          <>
            <strong>Manquant</strong> : les codes de valeurs manquantes (9, 99, 999), s'il y en a.
          </>,
          <>
            <strong>Mesure</strong> : Échelle pour les quantitatives, Ordinale pour les classes
            ordonnées, Nominale pour les catégories sans ordre. Ce réglage conditionne les analyses
            proposées.
          </>,
        ]}
      />
      <P>
        Vérifiez enfin le type de chaque variable : une colonne quantitative importée en « Chaîne »
        contient au moins une cellule de texte (un « NR », une unité, une virgule mal placée). Elle
        ne pourra pas être moyennée tant qu'elle n'est pas corrigée. Une base propre permet ensuite
        de choisir sereinement{" "}
        <GuideLink slug="quel-test-statistique-choisir-these-medecine">
          le test statistique adapté
        </GuideLink>
        .
      </P>

      <P>
        Avant l'import, gardez une seule feuille de données, vérifiez que la première ligne contient
        bien les noms des variables et supprimez les lignes vides ou de commentaires sous le tableau
        : une ligne vide importée devient un patient fantôme, qui fausse l'effectif et les
        pourcentages.
      </P>

      <H2 id="checklist">La check-list finale</H2>
      <List
        items={[
          "Une ligne par patient, une colonne par variable, une seule ligne d'en-tête.",
          "Un identifiant d'étude unique, sans doublon.",
          "Aucune cellule fusionnée, aucune information portée par une couleur.",
          "Des codes numériques identiques dans toute la base, décrits dans un dictionnaire.",
          "Une colonne 0/1 par réponse pour les questions à choix multiples.",
          "Des dates reconnues comme dates, au même format.",
          "Une seule unité par variable, indiquée dans son nom.",
          "Des colonnes quantitatives sans texte, sans unité, sans « < ».",
          "Des données manquantes laissées vides (ou codées et déclarées), jamais devinées.",
          "Des minimums et maximums plausibles pour chaque variable.",
          "Les valeurs brutes conservées à côté des variables calculées.",
          "Aucun nom, téléphone ou numéro de dossier.",
          "Le nombre de lignes égal à l'effectif annoncé dans votre M&M.",
        ]}
      />
      <P>
        Pour une étude sur dossiers papier, la qualité se joue encore plus tôt, dès la fiche de
        recueil : voir notre guide sur l'
        <GuideLink slug="etude-retrospective-dossiers-base-donnees-these">
          étude rétrospective, de la fiche papier à la base
        </GuideLink>
        . Et si vous voulez savoir où en est votre fichier avant de lancer l'analyse, vous pouvez{" "}
        <Link to="/audit">tester votre base gratuitement</Link> : vous saurez si elle est
        exploitable et ce qu'il reste à reprendre.
      </P>
    </>
  );
}
