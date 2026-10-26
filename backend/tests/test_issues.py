"""Tests de detect_issues (issues.py) — fonction pure, déterministe, sans API.

Couvre chaque famille d'anomalie remontée au front, plus le cas « base saine ».
"""

from app.pipeline.issues import detect_issues


def _prof(**over):
    """Profiling minimal d'une base saine ; surchargé par test."""
    p = {
        "file": {"format": "csv"},
        "structure": {
            "id_column": "matricule", "n_rows": 100,
            "duplicates": {"duplicate_ids": 0, "exact_rows": 0},
            "empty_columns": [], "constant_columns": [],
        },
        "missing_summary": {"pct_global": 0.0, "declared_missing_in_file": True},
        "columns": [],
        "dates_audit": [],
        "pii_candidates": [],
    }
    p.update(over)
    return p


def _col(name, *, codes=None, flags=None, outliers=0):
    return {"name": name, "suspected_missing_codes": codes or [],
            "flags": flags or [], "outliers_iqr": {"n": outliers}}


def test_base_saine_aucune_anomalie():
    issues = detect_issues(_prof())
    assert len(issues) == 1 and issues[0]["level"] == "info"
    assert "Aucune anomalie" in issues[0]["label"]


def test_identifiant_absent():
    p = _prof()
    p["structure"]["id_column"] = None
    issues = detect_issues(p)
    assert any(i["level"] == "critical" and "identifiant" in i["label"].lower() for i in issues)


def test_identifiants_dupliques():
    p = _prof()
    p["structure"]["duplicates"]["duplicate_ids"] = 3
    issues = detect_issues(p)
    assert any("dupliqué" in i["label"] for i in issues)


def test_lignes_dupliquees_critique_au_dela_de_5pct():
    p = _prof()
    p["structure"]["duplicates"]["exact_rows"] = 10  # 10 % de 100
    dup = next(i for i in detect_issues(p) if "Lignes dupliquées" in i["label"])
    assert dup["level"] == "critical"


def test_manquants_seuils():
    high = _prof()
    high["missing_summary"]["pct_global"] = 30
    assert any(i["level"] == "critical" for i in detect_issues(high))
    mid = _prof()
    mid["missing_summary"]["pct_global"] = 15
    assert any(i["level"] == "warn" for i in detect_issues(mid))


def test_manquants_non_declares_dans_sav():
    p = _prof(file={"format": "sav"},
              missing_summary={"pct_global": 8, "declared_missing_in_file": False})
    assert any("Aucune valeur manquante déclarée" in i["label"] for i in detect_issues(p))


def test_codes_manquants_suspects():
    p = _prof(columns=[_col("age", codes=[999])])
    assert any("codes de valeurs" in i["label"] for i in detect_issues(p))


def test_numeriques_stockes_en_texte():
    p = _prof(columns=[_col("poids", flags=["numeric_stored_as_text"])])
    assert any("numériques stockées en texte" in i["label"] for i in detect_issues(p))


def test_colonnes_vides_ou_constantes():
    p = _prof()
    p["structure"]["empty_columns"] = ["c1"]
    p["structure"]["constant_columns"] = ["c2"]
    assert any("vide(s) ou constante(s)" in i["label"] for i in detect_issues(p))


def test_valeurs_extremes_massives():
    p = _prof(columns=[_col("crp", outliers=10)])  # 10 > 5 % de 100
    assert any("Valeurs extrêmes" in i["label"] for i in detect_issues(p))


def test_dates_suspectes():
    p = _prof(dates_audit=[{"column": "date_sortie", "n_future": 2, "n_before_1900": 0}])
    assert any("Dates suspectes" in i["label"] for i in detect_issues(p))


def test_pii_detectees_critique():
    issues = detect_issues(_prof(pii_candidates=[{"column": "tel"}]))
    assert any(i["level"] == "critical" and "identifiantes" in i["label"] for i in issues)


def test_identifiant_partage_par_deux_profils_precise_le_conflit():
    p = _prof()
    p["structure"]["duplicates"].update(duplicate_ids=2, id_conflicts={"n_ids": 1, "examples": []})
    label = next(i["label"] for i in detect_issues(p) if "dupliqué" in i["label"])
    assert "dont 1 porté(s) par des profils différents" in label


def test_copies_blocs_et_doublons_possibles():
    p = _prof()
    p["structure"]["duplicates"].update(
        identical_except_id={"n_groups": 2},
        copied_blocks=[{"length": 3, "source_lines": [1, 3], "copy_lines": [9, 11]}],
        same_profile_different_ids={"n_groups": 1,
                                    "key_columns": ["date_naissance", "sexe"]})
    labels = [i["label"] for i in detect_issues(p)]
    assert any("identiques sauf l'identifiant" in lb for lb in labels)
    assert any("lignes de données 1 à 3 reprises en 9 à 11" in lb for lb in labels)
    assert any("mêmes date_naissance, sexe" in lb for lb in labels)


def test_lignes_vides():
    p = _prof()
    p["structure"]["empty_rows"] = {"n": 2, "lines": [101, 102]}
    assert any("2 ligne(s) sans aucune donnée" in i["label"] for i in detect_issues(p))


def test_profiling_ancien_format_sans_les_nouveaux_champs():
    """Les audits enregistrés avant ces contrôles n'ont pas les nouveaux champs."""
    p = _prof()
    p["structure"]["duplicates"]["duplicate_ids"] = 1
    assert any(i["label"] == "1 identifiant(s) dupliqué(s)" for i in detect_issues(p))
