"""Score de qualité v0 — PROVISOIRE (jalon M3 = grille complète de Hamza).

Score déterministe calculé uniquement à partir du profiling. Sera remplacé par
l'implémentation exacte de la grille en 8 domaines + plafonds (doc d'architecture §7).
Les issues sont libellées en français pour affichage direct dans le front.
"""

from __future__ import annotations

from typing import Any


def score_and_issues(p: dict[str, Any]) -> tuple[float, list[dict], list[str]]:
    """Retourne (score, issues pour le front, notes internes)."""
    issues: list[dict] = []
    notes: list[str] = []
    score = 100.0

    s = p["structure"]
    m = p["missing_summary"]

    # Identifiant
    if not s["id_column"]:
        score -= 8
        issues.append({"level": "critical",
                       "label": "Aucune colonne identifiant patient détectée"})
    elif s["duplicates"]["duplicate_ids"] > 0:
        score -= 5
        issues.append({"level": "critical",
                       "label": f"{s['duplicates']['duplicate_ids']} identifiant(s) dupliqué(s)"})

    # Doublons stricts
    dup_pct = round(s["duplicates"]["exact_rows"] / max(s["n_rows"], 1) * 100, 1)
    if dup_pct > 0:
        score -= min(10, dup_pct * 2)
        issues.append({"level": "critical" if dup_pct > 5 else "warn",
                       "label": f"Lignes dupliquées : {dup_pct}%"})

    # Manquants
    pct_missing = m["pct_global"]
    score -= min(30, pct_missing * 1.2)
    if pct_missing > 25:
        issues.append({"level": "critical",
                       "label": f"Taux global de données manquantes très élevé : {pct_missing}%"})
    elif pct_missing > 10:
        issues.append({"level": "warn",
                       "label": f"Taux global de données manquantes : {pct_missing}%"})

    if not m["declared_missing_in_file"] and pct_missing > 5 and p["file"]["format"] == "sav":
        score -= 3
        issues.append({"level": "warn",
                       "label": "Aucune valeur manquante déclarée dans SPSS malgré "
                                f"{pct_missing}% de cellules vides"})

    # Codes manquants suspects (999, -1, "NA"...)
    cols_with_codes = [c for c in p["columns"] if c["suspected_missing_codes"]]
    if cols_with_codes:
        score -= min(10, 2.5 * len(cols_with_codes))
        ex = ", ".join(f"{c['name']} ({c['suspected_missing_codes']})" for c in cols_with_codes[:3])
        issues.append({"level": "warn",
                       "label": f"{len(cols_with_codes)} variable(s) avec codes de valeurs "
                                f"manquantes non déclarés — ex. {ex}"})

    # Nombres stockés en texte
    text_num = [c["name"] for c in p["columns"] if "numeric_stored_as_text" in c["flags"]]
    if text_num:
        score -= min(8, 2 * len(text_num))
        issues.append({"level": "warn",
                       "label": f"Variables numériques stockées en texte : {', '.join(text_num[:5])}"})

    # Colonnes vides / constantes
    dead_cols = len(s["empty_columns"]) + len(s["constant_columns"])
    if dead_cols:
        score -= min(5, dead_cols)
        issues.append({"level": "info",
                       "label": f"{dead_cols} colonne(s) vide(s) ou constante(s)"})

    # Outliers massifs
    heavy_outliers = [c["name"] for c in p["columns"]
                      if c.get("outliers_iqr", {}).get("n", 0) > 0.05 * s["n_rows"]]
    if heavy_outliers:
        score -= min(5, len(heavy_outliers))
        issues.append({"level": "warn",
                       "label": f"Valeurs extrêmes nombreuses : {', '.join(heavy_outliers[:5])}"})

    # Dates suspectes
    bad_dates = [d for d in p["dates_audit"] if d["n_future"] or d["n_before_1900"]]
    for d in bad_dates[:3]:
        score -= 2
        issues.append({"level": "warn",
                       "label": f"Dates suspectes dans {d['column']} "
                                f"({d['n_future']} future(s), {d['n_before_1900']} avant 1900)"})

    # PII
    if p["pii_candidates"]:
        cols = ", ".join(c["column"] for c in p["pii_candidates"][:4])
        issues.append({"level": "critical",
                       "label": f"Données potentiellement identifiantes détectées : {cols} — "
                                "anonymisation recommandée avant analyse"})
        notes.append("PII détectées : colonnes masquées avant tout envoi à l'API IA.")

    score = max(0.0, min(100.0, round(score, 1)))
    if not issues:
        issues.append({"level": "info", "label": "Aucune anomalie majeure détectée"})
    notes.append("Score v0 provisoire — grille complète (8 domaines + plafonds) au jalon M3.")
    return score, issues, notes
