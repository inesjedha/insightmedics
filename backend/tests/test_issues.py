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
    issues, notes = detect_issues(_prof())
    assert len(issues) == 1 and issues[0]["level"] == "info"
    assert "Aucune anomalie" in issues[0]["label"] and notes == []


def test_identifiant_absent():
    p = _prof()
    p["structure"]["id_column"] = None
    issues, _ = detect_issues(p)
    assert any(i["level"] == "critical" and "identifiant" in i["label"].lower() for i in issues)


def test_identifiants_dupliques():
    p = _prof()
    p["structure"]["duplicates"]["duplicate_ids"] = 3
    issues, _ = detect_issues(p)
    assert any("dupliqué" in i["label"] for i in issues)


def test_lignes_dupliquees_critique_au_dela_de_5pct():
    p = _prof()
    p["structure"]["duplicates"]["exact_rows"] = 10  # 10 % de 100
    dup = next(i for i in detect_issues(p)[0] if "Lignes dupliquées" in i["label"])
    assert dup["level"] == "critical"


def test_manquants_seuils():
    high = _prof()
    high["missing_summary"]["pct_global"] = 30
    assert any(i["level"] == "critical" for i in detect_issues(high)[0])
    mid = _prof()
    mid["missing_summary"]["pct_global"] = 15
    assert any(i["level"] == "warn" for i in detect_issues(mid)[0])


def test_manquants_non_declares_dans_sav():
    p = _prof(file={"format": "sav"},
              missing_summary={"pct_global": 8, "declared_missing_in_file": False})
    assert any("Aucune valeur manquante déclarée" in i["label"] for i in detect_issues(p)[0])


def test_codes_manquants_suspects():
    p = _prof(columns=[_col("age", codes=[999])])
    assert any("codes de valeurs" in i["label"] for i in detect_issues(p)[0])


def test_numeriques_stockes_en_texte():
    p = _prof(columns=[_col("poids", flags=["numeric_stored_as_text"])])
    assert any("numériques stockées en texte" in i["label"] for i in detect_issues(p)[0])


def test_colonnes_vides_ou_constantes():
    p = _prof()
    p["structure"]["empty_columns"] = ["c1"]
    p["structure"]["constant_columns"] = ["c2"]
    assert any("vide(s) ou constante(s)" in i["label"] for i in detect_issues(p)[0])


def test_valeurs_extremes_massives():
    p = _prof(columns=[_col("crp", outliers=10)])  # 10 > 5 % de 100
    assert any("Valeurs extrêmes" in i["label"] for i in detect_issues(p)[0])


def test_dates_suspectes():
    p = _prof(dates_audit=[{"column": "date_sortie", "n_future": 2, "n_before_1900": 0}])
    assert any("Dates suspectes" in i["label"] for i in detect_issues(p)[0])


def test_pii_detectees_ajoute_note_interne():
    issues, notes = detect_issues(_prof(pii_candidates=[{"column": "tel"}]))
    assert any(i["level"] == "critical" and "identifiantes" in i["label"] for i in issues)
    assert any("PII" in n for n in notes)
