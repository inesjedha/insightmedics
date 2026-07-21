"""Détection des anomalies lisibles pour le front (libellés en français).

Ces « issues » résument, pour l'affichage, les problèmes structurels repérés par le
profiling : identifiants, doublons, données manquantes, codes suspects, PII, dates…
Elles servent UNIQUEMENT à la présentation.

Le score de qualité /100 (grille en 8 domaines + plafonds + confiance) est calculé
séparément et fait seul foi : voir score_engine.compute_score. Ce module ne calcule
aucun score.
"""

from __future__ import annotations

from typing import Any


def detect_issues(p: dict[str, Any]) -> tuple[list[dict], list[str]]:
    """Retourne (issues pour le front, notes internes) à partir du profiling."""
    issues: list[dict] = []
    notes: list[str] = []

    s = p["structure"]
    m = p["missing_summary"]

    # Identifiant patient
    if not s["id_column"]:
        issues.append({"level": "critical", "label": "Aucune colonne identifiant patient détectée"})
    elif s["duplicates"]["duplicate_ids"] > 0:
        issues.append({"level": "critical",
                       "label": f"{s['duplicates']['duplicate_ids']} identifiant(s) dupliqué(s)"})

    # Doublons stricts de lignes
    dup_pct = round(s["duplicates"]["exact_rows"] / max(s["n_rows"], 1) * 100, 1)
    if dup_pct > 0:
        issues.append({"level": "critical" if dup_pct > 5 else "warn",
                       "label": f"Lignes dupliquées : {dup_pct}%"})

    # Données manquantes
    pct_missing = m["pct_global"]
    if pct_missing > 25:
        issues.append({"level": "critical",
                       "label": f"Taux global de données manquantes très élevé : {pct_missing}%"})
    elif pct_missing > 10:
        issues.append({"level": "warn",
                       "label": f"Taux global de données manquantes : {pct_missing}%"})

    if not m["declared_missing_in_file"] and pct_missing > 5 and p["file"]["format"] == "sav":
        issues.append({"level": "warn",
                       "label": "Aucune valeur manquante déclarée dans SPSS malgré "
                                f"{pct_missing}% de cellules vides"})

    # Codes de valeurs manquantes suspects (999, -1, « NA »…)
    cols_with_codes = [c for c in p["columns"] if c["suspected_missing_codes"]]
    if cols_with_codes:
        ex = ", ".join(f"{c['name']} ({c['suspected_missing_codes']})" for c in cols_with_codes[:3])
        issues.append({"level": "warn",
                       "label": f"{len(cols_with_codes)} variable(s) avec codes de valeurs "
                                f"manquantes non déclarés — ex. {ex}"})

    # Nombres stockés en texte
    text_num = [c["name"] for c in p["columns"] if "numeric_stored_as_text" in c["flags"]]
    if text_num:
        issues.append({"level": "warn",
                       "label": f"Variables numériques stockées en texte : {', '.join(text_num[:5])}"})

    # Colonnes vides ou constantes
    dead_cols = len(s["empty_columns"]) + len(s["constant_columns"])
    if dead_cols:
        issues.append({"level": "info",
                       "label": f"{dead_cols} colonne(s) vide(s) ou constante(s)"})

    # Valeurs extrêmes massives
    heavy_outliers = [c["name"] for c in p["columns"]
                      if c.get("outliers_iqr", {}).get("n", 0) > 0.05 * s["n_rows"]]
    if heavy_outliers:
        issues.append({"level": "warn",
                       "label": f"Valeurs extrêmes nombreuses : {', '.join(heavy_outliers[:5])}"})

    # Dates suspectes
    bad_dates = [d for d in p["dates_audit"] if d["n_future"] or d["n_before_1900"]]
    for d in bad_dates[:3]:
        issues.append({"level": "warn",
                       "label": f"Dates suspectes dans {d['column']} "
                                f"({d['n_future']} future(s), {d['n_before_1900']} avant 1900)"})

    # Données potentiellement identifiantes (PII)
    if p["pii_candidates"]:
        cols = ", ".join(c["column"] for c in p["pii_candidates"][:4])
        issues.append({"level": "critical",
                       "label": f"Données potentiellement identifiantes détectées : {cols} — "
                                "anonymisation recommandée avant analyse"})
        notes.append("PII détectées : colonnes masquées avant tout envoi à l'API IA.")

    if not issues:
        issues.append({"level": "info", "label": "Aucune anomalie majeure détectée"})
    return issues, notes
