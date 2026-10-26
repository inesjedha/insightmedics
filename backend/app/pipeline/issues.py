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


def detect_issues(p: dict[str, Any]) -> list[dict]:
    """Anomalies lisibles (niveau + libellé) déduites du profiling."""
    issues: list[dict] = []

    s = p["structure"]
    m = p["missing_summary"]
    dups = s["duplicates"]

    # Identifiant patient
    if not s["id_column"]:
        issues.append({"level": "critical", "label": "Aucune colonne identifiant patient détectée"})
    elif dups["duplicate_ids"] > 0:
        label = f"{dups['duplicate_ids']} identifiant(s) dupliqué(s)"
        n_conflicts = (dups.get("id_conflicts") or {}).get("n_ids", 0)
        if n_conflicts:
            label += (f", dont {n_conflicts} porté(s) par des profils différents "
                      "(probablement deux patients sous un même numéro)")
        issues.append({"level": "critical", "label": label})

    # Doublons stricts de lignes
    dup_pct = round(dups["exact_rows"] / max(s["n_rows"], 1) * 100, 1)
    if dup_pct > 0:
        issues.append({"level": "critical" if dup_pct > 5 else "warn",
                       "label": f"Lignes dupliquées : {dup_pct}%"})

    # Copies et doublons possibles (champs absents des audits antérieurs : .get)
    same_but_id = (dups.get("identical_except_id") or {}).get("n_groups", 0)
    if same_but_id:
        issues.append({"level": "warn",
                       "label": f"{same_but_id} groupe(s) de lignes identiques sauf l'identifiant "
                                "— copie probable, à vérifier"})
    for block in (dups.get("copied_blocks") or [])[:2]:
        a, b = block["source_lines"]
        c, d = block["copy_lines"]
        issues.append({"level": "warn",
                       "label": f"Bloc de {block['length']} lignes recopié : lignes de données {a} à {b} "
                                f"reprises en {c} à {d}"})
    same_profile = dups.get("same_profile_different_ids") or {}
    if same_profile.get("n_groups"):
        issues.append({"level": "warn",
                       "label": f"{same_profile['n_groups']} groupe(s) de patients aux identifiants "
                                f"différents mais mêmes {', '.join(same_profile['key_columns'])} "
                                "— doublons possibles, à vérifier au dossier"})

    # Lignes vides (souvent en fin de fichier)
    n_empty = (s.get("empty_rows") or {}).get("n", 0)
    if n_empty:
        issues.append({"level": "warn",
                       "label": f"{n_empty} ligne(s) sans aucune donnée — à ne pas compter "
                                "dans l'effectif"})

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

    if not issues:
        issues.append({"level": "info", "label": "Aucune anomalie majeure détectée"})
    return issues
