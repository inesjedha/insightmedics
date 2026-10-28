# Thèses au format des facultés (Sousse, Tunis, Monastir, Sfax)

Version 1, 28/10/2026. Cahier des charges : les prompts de Dr Hamza Ben Kheder
(« Prompts_theses » v2.0 du 28/10/2026), écrits pour son poste où un agent IA rédige les
thèses. La plateforme en reprend les règles, mais les répartit autrement : ce que le code
peut garantir est fait par le code, l'IA ne fait que rédiger.

## Ce que fait la plateforme aujourd'hui (offre « Analyses + résultats », 500 DT)

1. **Fiche de mission** : titre, faculté, objectifs, critère principal… (schéma de Hamza,
   `backend/app/theses/hamza/Fiche_mission_these.json`). L'étudiant remplit ses champs sur
   son lien privé dès que l'analyse est commandée ; l'équipe complète les siens dans
   l'admin. « Je ne sais pas » est accepté : jamais deviné, mention `[À CONFIRMER : …]`.
2. **La faculté** est choisie en tête de la fiche, dans l'admin (ou indiquée par l'étudiant) :
   elle décide du plan, de la charte et du seul rendu produit. « Tout lancer » la demande.
3. **Tout lancer** (admin) : nettoyage et plan (IA) → calculs (code) → rédaction (IA) →
   mise en page d'essai et contrôles (code), d'une traite. Le workflow s'arrête au plan
   si l'IA pose une question à trancher (copies suspectes, critère principal flou…), comme
   la table de décisions de Hamza le prévoit.
4. **Relecture puis « Livrer »** : un clic de l'équipe. Refusé tant qu'un contrôle
   bloquant subsiste.

Livrables, au format de la faculté :

| Fichier                                  | Contenu                                                                                                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Analyse_statistique_These_<Sujet>.docx` | partie « Analyse statistique » du M&M, numérotée comme dans le plan type (IX à Sousse, 6 à Tunis, 7 à Monastir, 8 à Sfax), avec le tableau « Plan de l'analyse statistique » |
| `Resultats_These_<Sujet>.docx`           | chapitre Résultats : page intercalaire, titres numérotés, tableaux et figures à la charte                                                                                    |
| `Classeur_resultats_These_<Sujet>.xlsx`  | tableaux, base d'analyse, diagramme de flux, journal des corrections (inchangé)                                                                                              |

## Qui fait quoi

| Règle de Hamza                                           | Où elle vit                                        | Garantie                                                                         |
| -------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| Statistiques réglées comme SPSS (§ 8)                    | `app/analysis/stats.py`                            | code, testé (`tests/test_analysis_stats_spss.py`)                                |
| Charte de mise en page (§ 10, § 12, `04_Charte_*.json`)  | `app/theses/charte.py`, `render_docx.py`           | code ; test de cohérence avec les JSON de Hamza                                  |
| Figures (§ 11)                                           | `app/theses/figures.py`                            | code (l'IA choisit parmi les figures proposées)                                  |
| Numéros de titres, tableaux, figures                     | `render_docx.py` (appels `{{TAB:…}}`, `{{FIG:…}}`) | code : l'IA n'écrit jamais un numéro                                             |
| « Rien n'est inventé »                                   | `analysis/llm_write.py` (`inconsistencies_in`)     | brouillon refusé si un chiffre, un n (%) ou un p n'existe pas dans les résultats |
| Plan, phrases types, rédaction (§ 1-2, 4, 6.2-6.5, 7, 9) | `app/prompts/theses/resultats_<FAC>.md`            | prompt (importé des prompts de Hamza)                                            |
| Contrôles avant livraison (§ 14)                         | `app/theses/controles.py`                          | code : bloquant ou avertissement                                                 |

Réglages SPSS repris : arrondi demie vers le haut ; précision de la variable (médiane) et
une décimale de plus (moyenne ± ET) ; quartiles HAVERAGE ; Student, ou Welch si Levene
(centré sur la moyenne) p ≤ 0,05 ; Mann-Whitney asymptotique sans correction de
continuité ; Chi² sans Yates, Fisher en 2 × 2, Fisher-Freeman-Halton par Monte-Carlo
(100 000 tirages, graine 20261012) au-delà ; OR de Woolf ou exact conditionnel, Haldane
si case nulle, donné pour les associations significatives ; Hosmer-Lemeshow.

## Le logiciel déclaré

Les prompts de Hamza font déclarer « IBM SPSS Statistics 26 » dans le M&M. Les calculs de
la plateforme sont faits par notre moteur (réglages identiques à SPSS), pas par SPSS : le
code ne déclare donc aucun logiciel par défaut, et la phrase devient une mention
`[À CONFIRMER : logiciel d'analyse]` que l'équipe tranche à la relecture. Pour déclarer un
logiciel automatiquement : variable d'environnement `THESIS_SOFTWARE` (ex. le logiciel
avec lequel l'équipe refait réellement les tests principaux).

## Mettre à jour quand Hamza modifie ses prompts

```bash
cd backend
python scripts/import_prompts_hamza.py "<dossier Prompts_theses>"
pytest tests/test_theses_charte.py tests/test_theses_chaine.py
```

Le script réécrit `app/prompts/theses/resultats_<FAC>.md` (parties de rédaction de la
version B du prompt 1) et recopie les chartes JSON et la fiche de mission. Une valeur de
charte modifiée par Hamza fait échouer `test_theses_charte.py` : reporter l'écart dans
`charte.py`.

## Limites connues (version 1)

- **Polices des gabarits** (AvantGarde, Albertus, Souvenir, Lucian BT, CentSchbook) :
  déclarées dans les styles Word, affichées chez l'étudiant qui les a, remplacées sinon.
  Les figures utilisent Liberation Serif (même chasse que Times New Roman, livrée avec le
  code).
- **Pagination** : le contrôle automatique lit le texte ; les blancs de bas de page et les
  légendes orphelines se vérifient en ouvrant le Word (relecture humaine), comme Hamza
  le fait sur un PDF produit par Word.
- **Pas encore automatisé** : Introduction, Discussion et Conclusion (recherche et
  lecture d'articles), pages liminaires, version « figures Excel » des Résultats,
  survie (Kaplan-Meier, Cox), courbes ROC, kappa, thèses en arabe.
- Les gabarits Word de chaque faculté (« THESE copie finale.docx » à Sousse…) ne sont pas
  encore dans le dépôt : le rendu applique la charte mesurée, pas le fichier gabarit.
