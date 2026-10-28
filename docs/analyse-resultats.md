# Chaîne « Analyses + résultats » (offre à 500 DT)

Version 2, 27/10/2026. L'étudiant a reçu son audit et commande l'analyse statistique.
C'est nous qui nettoyons sa base : il ne fait que vérifier dans les dossiers ce que lui
seul peut vérifier. L'équipe pilote depuis l'admin ; l'IA propose le nettoyage et le plan
puis rédige, le code applique et calcule, Dr Hamza valide deux fois avant la livraison.

## Principe

| Étape                     | Qui fait                                                                 | Sortie                                                                     |
| ------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1. Commande               | admin, depuis l'audit (« Commander l'analyse »)                          | une analyse liée à l'audit                                                 |
| 2. Réponses de l'étudiant | admin note les réponses : dossiers vérifiés, doublons, critère principal | consignes ; base de départ = celle de l'audit                              |
| 3. Contre-audit           | code, seulement si l'étudiant a renvoyé une base corrigée (facultatif)   | effectif, copies restantes, valeurs corrigées ou non                       |
| 4. Nettoyage et plan      | IA (biostatisticien et data manager)                                     | plan en JSON fermé : corrections, population, colonnes calculées, analyses |
| 5. Validation du plan     | **Dr Hamza**                                                             | corrections et plan validés (modifiables)                                  |
| 6. Calculs                | code (scipy, statsmodels) : jamais l'IA                                  | tableaux, tests, figures, diagramme de flux                                |
| 7. Rédaction              | IA, à partir des seuls résultats calculés                                | partie Résultats, paragraphe « Analyse statistique »                       |
| 8. Contrôle des chiffres  | code                                                                     | chaque nombre du texte existe dans les résultats, sinon nouvelle rédaction |
| 9. Relecture et livraison | **Dr Hamza**                                                             | Word + Excel sur le lien privé de l'étudiant                               |

Règles reprises des prompts de Hamza : rien n'est inventé ; tests usuels ; aucune chasse
au p (aucun seuil, regroupement ou exclusion choisi pour obtenir p < 0,05) ; environ 10
événements par variable dans un modèle ; un pourcentage toujours avec son n/N ; pas de
formulation causale ; une ligne écartée n'est jamais supprimée (variable
`INCLUS_ANALYSE` et motif, pour le diagramme de flux).

## Le nettoyage (corrections du plan, `analysis/clean.py`)

Appliqué à une copie, avant tout le reste ; le fichier d'origine ne change jamais et
aucune ligne n'est supprimée. Automatique : espaces en trop, cellules blanches. Proposé
par l'IA à partir de l'audit (anomalies, liste de vérification, codes suspects) et des
réponses de l'étudiant, validé par Dr Hamza :

- `missing_codes` : codes « non renseigné » (999, NR…) → case vide ;
- `harmonize` : même réponse écrite autrement (« oui », « OUI ») → une seule forme ;
- `to_number`, `to_date` : texte → nombre ou date ; illisible → vide, et listé ;
- `set_missing` : valeur impossible (condition ou lignes) → vide ;
- `set_value` : uniquement une valeur relevée par l'étudiant dans le dossier, avec sa
  source.

Ce que seul le dossier peut trancher va dans `to_check` (analysé tel quel en attendant).
Chaque cellule modifiée est consignée (motif, lignes du fichier Excel, exemples avant →
après) : journal affiché dans l'admin et remis dans le classeur (« Journal des
corrections »).

## Le plan (JSON fermé, validé par pydantic)

- `population.exclusions` : motifs d'exclusion successifs `{label, expr}` (expression
  booléenne) ; alimentent le diagramme de flux.
- `derived` : colonnes calculées, de types fermés : `formula`, `recode`, `bins`,
  `parse_number`, `pct_change`.
- `groups` : variable de comparaison principale (facultative).
- `analyses` : liste typée, le moteur choisit le test exact selon les données :
  - `describe` : tableau 1 (effectifs, moyenne ± écart-type ou médiane [Q1-Q3], n (%)),
    par groupe avec p si `groups` ;
  - `proportion` : taux et IC 95 % (Wilson) ;
  - `compare` : variable × groupe → Student/Welch ou Mann-Whitney, ANOVA ou
    Kruskal-Wallis, Chi² ou Fisher selon la normalité et les effectifs attendus ;
  - `paired` : même mesure à plusieurs temps → t apparié ou Wilcoxon (2 temps), Friedman
    puis comparaisons au temps initial corrigées par Holm (3 temps et plus) ;
  - `correlation` : Pearson ou Spearman ;
  - `logistic` : régression logistique (OR bruts et ajustés, IC 95 %), avec contrôle du
    nombre d'événements par variable.
- `primary` : l'analyse du critère principal, présentée en premier.

Les expressions sont analysées par un interpréteur fermé (jamais `eval`) :
`col("Nom de colonne")`, nombres, textes, `+ - * /`, comparaisons, `and/or/not`,
`isnull()`, `notnull()`, `ifelse()`, `abs()`, `days_between()`.

## Ce qui reste à Dr Hamza

- Valider le plan avant les calculs, et relire le Word avant la livraison.
- Survie (Kaplan-Meier, Cox) et modèles mixtes : hors de la version 1, signalés dans le
  plan comme « à faire par le biostatisticien ».
- Format des facultés : les prompts de Hamza (v2.0 du 28/10/2026) sont intégrés. Quand la
  fiche de mission indique la faculté, la rédaction et les livrables suivent son plan et sa
  charte, et « Tout lancer » enchaîne les étapes : voir [`theses-faculte.md`](theses-faculte.md).
