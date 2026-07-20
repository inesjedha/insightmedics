"""Jalon M3 — Moteur de score officiel : grille de Hamza (§32 du prompt maître).

8 domaines (15/20/15/15/15/10/5/5 = 100), barèmes internes exacts, règles de
plafonnement, niveau de confiance. 100% déterministe : mêmes entrées → même score.

Les domaines 5, 6 et 8 dépendent de jugements méthodologiques (scoring_inputs,
produits par LLM-2 au jalon M5). En leur absence, chaque critère concerné est
noté « inévaluable » : moitié des points, motif explicite, et le niveau de
confiance est plafonné à « faible » (doc d'architecture §7.3).
"""

from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------- helpers


class Domain:
    def __init__(self, num: int, name: str, maximum: float):
        self.num, self.name, self.max = num, name, maximum
        self.criteria: list[dict] = []

    def add(self, label: str, mx: float, obtained: float, reason: str = "",
            inevaluable: bool = False) -> None:
        obtained = max(0.0, min(mx, round(obtained, 2)))
        self.criteria.append({
            "critere": label, "max": mx, "obtenu": obtained,
            "motif": reason or ("conforme" if obtained == mx else ""),
            "inevaluable": inevaluable,
        })

    @property
    def obtained(self) -> float:
        return round(sum(c["obtenu"] for c in self.criteria), 1)

    def as_dict(self) -> dict:
        return {"domaine": self.num, "nom": self.name, "max": self.max,
                "obtenu": self.obtained, "criteres": self.criteria}


def _grid(value: float | None, tiers: list[tuple[float, float]], absent: float) -> float:
    """Barème par tranches : tiers = [(seuil_min_inclus, points), ...] décroissant."""
    if value is None:
        return absent
    for threshold, points in tiers:
        if value >= threshold:
            return points
    return 0.0


QUALITY_LEVELS = [
    (90, "Excellente", "Base de très haute qualité, directement exploitable"),
    (80, "Bonne", "Base globalement fiable avec anomalies limitées"),
    (70, "Acceptable", "Base exploitable avec réserves méthodologiques"),
    (60, "Insuffisante", "Anomalies importantes nécessitant une intervention"),
    (40, "Faible", "Base partiellement exploitable, risque élevé de biais"),
    (20, "Très faible", "Analyses principales fortement compromises"),
    (0, "Critique", "Base non exploitable ou absence de données analysables"),
]

INEV = "inévaluable sans documents méthodologiques ni audit IA (jalon M5) — points partiels"


# ---------------------------------------------------------------- moteur

def compute_score(profiling: dict[str, Any],
                  scoring_inputs: dict[str, Any] | None = None) -> dict[str, Any]:
    si = scoring_inputs or {}
    s = profiling["structure"]
    m = profiling["missing_summary"]
    cols = profiling["columns"]
    n_rows, n_cols = s["n_rows"], s["n_cols"]
    # Les jugements méthodologiques (M5) sont distincts des sorties mécaniques
    # du moteur de règles (M4) : seuls les premiers élèvent la confiance.
    has_si = any(k not in ("rule_violations", "primary_endpoint_missing_pct")
                 for k in si)

    domains: list[Domain] = []

    # ---- Domaine 1 — Intégrité structurelle et identifiants (15) ----
    d1 = Domain(1, "Intégrité structurelle et identifiants", 15)
    d1.add("Table principale identifiée et remplie", 2, 2 if n_rows > 0 else 0,
           "" if n_rows > 0 else "aucune observation")
    unit = si.get("statistical_unit_clear")
    if unit is None:
        d1.add("Unité statistique clairement définie", 2, 1, INEV, True)
    else:
        d1.add("Unité statistique clairement définie", 2, 2 if unit else 0,
               "" if unit else "unité statistique ambiguë")
    id_col = s["id_column"]
    if id_col:
        # part d'identifiants renseignés
        idc = next((c for c in cols if c["name"] == id_col), None)
        pct_missing_id = (idc["pct_missing"] / 100) if idc else 0.0
        d1.add("Identifiant présent pour toutes les observations", 3,
               3 * (1 - pct_missing_id),
               "" if pct_missing_id == 0 else
               f"{idc['n_missing']} identifiant(s) manquant(s) sur {n_rows}")
        uniq_ratio = s["n_unique_ids"] / max(n_rows, 1)
        dup_ids = s["duplicates"]["duplicate_ids"]
        d1.add("Identifiants uniques ou répétitions documentées", 3, 3 * uniq_ratio,
               "" if dup_ids == 0 else f"{dup_ids} identifiant(s) dupliqué(s) non documenté(s)")
    else:
        d1.add("Identifiant présent pour toutes les observations", 3, 0,
               "aucune colonne identifiant détectée")
        d1.add("Identifiants uniques ou répétitions documentées", 3, 0,
               "aucun identifiant à évaluer")
    dup_rows = s["duplicates"]["exact_rows"]
    dup_rate = dup_rows / max(n_rows, 1)
    d1.add("Absence de doublons injustifiés", 2, 2 * (1 - min(1, dup_rate * 5)),
           "" if dup_rows == 0 else f"{dup_rows} ligne(s) strictement dupliquée(s)")
    structure_ok = si.get("structure_fits_study")
    if structure_ok is None:
        d1.add("Structure adaptée à l'étude", 2, 1, INEV, True)
    else:
        d1.add("Structure adaptée à l'étude", 2, 2 if structure_ok else 0)
    d1.add("Possibilité fiable de relier les tables", 1, 1,
           "table unique — non applicable, points accordés")
    domains.append(d1)

    # ---- Domaine 2 — Complétude des données (20) ----
    d2 = Domain(2, "Complétude des données", 20)
    completeness = 100 - m["pct_global"]
    pts = _grid(completeness, [(98, 6), (95, 5), (90, 4), (85, 3), (75, 2), (60, 1)], 0)
    d2.add("Complétude globale", 6, pts,
           f"{completeness:.1f}% de données disponibles")
    cjp_missing = si.get("primary_endpoint_missing_pct")
    cjp_status = si.get("primary_endpoint_status")
    if cjp_status in ("non_exploitable",) or cjp_status == "absent":
        d2.add("Complétude du critère principal", 5, 0, "critère principal absent")
    elif cjp_missing is not None:
        avail = 100 - cjp_missing
        pts = _grid(avail, [(99, 5), (95, 4), (90, 3), (80, 2), (60, 1)], 0)
        d2.add("Complétude du critère principal", 5, pts,
               f"{avail:.1f}% de données disponibles sur le critère principal")
    else:
        d2.add("Complétude du critère principal", 5, 2.5,
               "critère principal non identifié — " + INEV, True)
    for label, mx, key in [
        ("Complétude des variables de l'objectif principal", 4, "primary_objective_vars_available"),
        ("Complétude des variables des objectifs secondaires", 2, "secondary_objectives_vars_available"),
    ]:
        v = si.get(key)
        if v is None:
            d2.add(label, mx, mx / 2, INEV, True)
        else:
            pts = {"complet": mx, "partiel": mx / 2, "absent": 0, "inevaluable": mx / 2}.get(v, mx / 2)
            d2.add(label, mx, pts, f"statut : {v}")
    diff = si.get("differential_missing")
    if diff is None:
        # Heuristique honnête : gros blocs manquants = suspicion de profils différentiels
        big_blocks = [b for b in m["missing_blocks"] if b["n_rows"] > 0.2 * n_rows]
        d2.add("Absence de profils différentiels de manquants", 2,
               1 if big_blocks else 1.5,
               ("blocs de variables manquantes ensemble détectés — analyse fine au M5"
                if big_blocks else "pas de bloc majeur détecté — confirmation au M5"), True)
    else:
        d2.add("Absence de profils différentiels de manquants", 2, 0 if diff else 2)
    d2.add("Distinction manquant / inconnu / non applicable", 1,
           1 if m["declared_missing_in_file"] else 0,
           "" if m["declared_missing_in_file"] else
           "aucune valeur manquante déclarée dans le fichier")
    domains.append(d2)

    # ---- Domaine 3 — Validité des valeurs et des formats (15) ----
    d3 = Domain(3, "Validité des valeurs et des formats", 15)
    n_text_num = sum(1 for c in cols if "numeric_stored_as_text" in c["flags"])
    d3.add("Types informatiques adaptés", 2, 2 - min(2, n_text_num * 0.5),
           "" if n_text_num == 0 else f"{n_text_num} variable(s) numérique(s) stockée(s) en texte")
    n_fmt = sum(1 for c in cols if "leading_trailing_whitespace" in c["flags"])
    d3.add("Formats homogènes", 2, 2 - min(2, n_fmt * 0.5),
           "" if n_fmt == 0 else f"{n_fmt} variable(s) avec espaces parasites")
    n_bad_labels = sum(1 for c in cols if "values_outside_labels" in c["flags"])
    n_cat = max(1, sum(1 for c in cols if c.get("categories")))
    d3.add("Modalités catégorielles valides", 3, 3 * (1 - min(1, n_bad_labels / n_cat)),
           "" if n_bad_labels == 0 else
           f"{n_bad_labels} variable(s) avec valeurs hors libellés déclarés")
    n_codes = sum(1 for c in cols if c["suspected_missing_codes"])
    n_num = max(1, sum(1 for c in cols if c.get("numeric_stats")))
    d3.add("Valeurs quantitatives dans les bornes", 3, 3 * (1 - min(1, n_codes / n_num)),
           "" if n_codes == 0 else
           f"{n_codes} variable(s) avec codes suspects (999, -1…) hors distribution")
    units = si.get("units_consistent")
    if units is None:
        d3.add("Unités définies et homogènes", 2, 1, INEV, True)
    else:
        d3.add("Unités définies et homogènes", 2, 2 if units else 0)
    n_bad_dates = sum(1 for d in profiling["dates_audit"] if d["n_future"] or d["n_before_1900"])
    n_dates = max(1, len(profiling["dates_audit"]))
    d3.add("Dates valides", 2, 2 * (1 - min(1, n_bad_dates / n_dates)),
           "" if n_bad_dates == 0 else f"{n_bad_dates} variable(s) date avec valeurs impossibles")
    codes_ok = m["declared_missing_in_file"] or n_codes == 0
    d3.add("Codes de données manquantes identifiés", 1, 1 if codes_ok else 0,
           "" if codes_ok else "codes de manquants utilisés mais non déclarés")
    domains.append(d3)

    # ---- Domaine 4 — Cohérence interne et inter-variables (15) ----
    d4 = Domain(4, "Cohérence interne et inter-variables", 15)
    chrono_ok = n_bad_dates == 0
    d4.add("Cohérence chronologique", 3, 3 if chrono_ok else 1.5,
           "" if chrono_ok else "dates impossibles détectées ; ordre inter-dates vérifié au M4")
    violations = si.get("rule_violations")  # fourni par le moteur de règles (M4)
    if violations is None:
        d4.add("Cohérence entre variables cliniquement liées", 4, 2,
               "règles inter-variables exécutées au jalon M4 — " + INEV, True)
        d4.add("Cohérence variables synthétiques / détaillées", 3, 1.5, INEV, True)
        d4.add("Cohérence totaux / composantes", 2, 1, INEV, True)
        d4.add("Absence d'incohérences majeures non résolues", 3, 1.5, INEV, True)
    else:
        rate = violations.get("violation_rate", 0)
        n_major = violations.get("n_major", 0)
        d4.add("Cohérence entre variables cliniquement liées", 4, 4 * (1 - min(1, rate / 10)),
               f"taux de violations : {rate}%")
        d4.add("Cohérence variables synthétiques / détaillées", 3,
               3 * (1 - min(1, violations.get("synthetic_rate", 0) / 10)), "")
        d4.add("Cohérence totaux / composantes", 2,
               2 * (1 - min(1, violations.get("totals_rate", 0) / 10)), "")
        d4.add("Absence d'incohérences majeures non résolues", 3,
               max(0, 3 - n_major * 0.5),
               "" if n_major == 0 else f"{n_major} violation(s) majeure(s)")
    domains.append(d4)

    # ---- Domaine 5 — Concordance protocole / objectifs (15) ----
    d5 = Domain(5, "Concordance avec le protocole et les objectifs", 15)
    cjp_pts = {"exploitable": 4, "exploitable_reserves": 3, "partiel": 2,
               "non_exploitable": 0, "inevaluable": 2}
    if cjp_status is None:
        d5.add("Critère principal disponible et correctement défini", 4, 2, INEV, True)
    else:
        d5.add("Critère principal disponible et correctement défini", 4,
               cjp_pts.get(cjp_status, 2), f"statut : {cjp_status}")
    for label, mx, key, table in [
        ("Variables de l'objectif principal disponibles", 3, "primary_objective_vars_available",
         {"complet": 3, "partiel": 1.5, "absent": 0, "inevaluable": 1.5}),
        ("Variables des objectifs secondaires disponibles", 2, "secondary_objectives_vars_available",
         {"complet": 2, "partiel": 1, "absent": 0, "inevaluable": 1}),
        ("Groupes et expositions reconstructibles", 2, "groups_reconstructible",
         {"oui": 2, "avec_reserves": 1, "non": 0, "non_applicable": 2, "inevaluable": 1}),
    ]:
        v = si.get(key)
        if v is None:
            d5.add(label, mx, mx / 2, INEV, True)
        else:
            d5.add(label, mx, table.get(v, mx / 2), f"statut : {v}")
    incl = si.get("inclusion_criteria_verifiable")
    d5.add("Critères d'inclusion et d'exclusion vérifiables", 2,
           1 if incl is None else (2 if incl else 0),
           INEV if incl is None else "", incl is None)
    d5.add("Temporalité conforme", 1, 0.5 if not has_si else
           (1 if si.get("temporality_ok", True) else 0), INEV if not has_si else "", not has_si)
    d5.add("Codages et unités conformes", 1, 0.5 if not has_si else
           (1 if si.get("codings_ok", True) else 0), INEV if not has_si else "", not has_si)
    domains.append(d5)

    # ---- Domaine 6 — Variables dérivées et critères de jugement (10) ----
    d6 = Domain(6, "Variables dérivées et critères de jugement", 10)
    if cjp_status is None:
        d6.add("Critère principal correctement calculé ou codé", 3, 1.5, INEV, True)
    else:
        d6.add("Critère principal correctement calculé ou codé", 3,
               {"exploitable": 3, "exploitable_reserves": 2, "partiel": 1,
                "non_exploitable": 0}.get(cjp_status, 1.5), f"statut : {cjp_status}")
    rel = si.get("derived_vars_reliability")
    if rel is None:
        d6.add("Scores cliniques vérifiables et conformes", 2, 1,
               "recalcul des dérivées au jalon M4 — " + INEV, True)
    else:
        d6.add("Scores cliniques vérifiables et conformes", 2,
               {"fiable": 2, "reserves": 1, "non_fiable": 0}.get(rel, 1), f"statut : {rel}")
    d6.add("Durées et délais cohérents", 2, 2 if chrono_ok else 1,
           "" if chrono_ok else "dates suspectes — durées à recalculer au M4")
    d6.add("Variables composites conformes", 1, 0.5 if rel is None else
           {"fiable": 1, "reserves": 0.5, "non_fiable": 0}.get(rel, 0.5),
           INEV if rel is None else "", rel is None)
    has_labels = any(c["spss_label"] for c in cols)
    d6.add("Traçabilité jusqu'aux variables sources", 1, 1 if has_labels else 0,
           "" if has_labels else "aucun libellé de variable disponible")
    d6.add("Absence de divergences majeures non résolues", 1, 0.5 if rel is None else
           (1 if rel == "fiable" else 0), INEV if rel is None else "", rel is None)
    domains.append(d6)

    # ---- Domaine 7 — Documentation et traçabilité (5) ----
    d7 = Domain(7, "Documentation et traçabilité", 5)
    has_value_labels = any(c["value_labels"] for c in cols)
    dico = (si.get("documentation_level") or {}).get("dictionnaire",
            has_labels and has_value_labels)
    d7.add("Dictionnaire disponible ou reconstructible", 1, 1 if dico else 0,
           "" if dico else "ni dictionnaire fourni ni labels complets")
    doc = si.get("documentation_level") or {}
    d7.add("Règles de codage documentées", 1, 1 if doc.get("regles_codage") else 0,
           "" if doc.get("regles_codage") else "règles de codage non fournies")
    d7.add("Provenance des principales variables connue", 1, 1 if has_labels else 0,
           "" if has_labels else "pas de libellés de variables")
    d7.add("Variables dérivées documentées", 1, 1 if doc.get("derivees_documentees") else 0,
           "" if doc.get("derivees_documentees") else "formules des dérivées non documentées")
    d7.add("Fichier original identifiable et non ambigu", 1, 1,
           "hash SHA-256 enregistré")
    domains.append(d7)

    # ---- Domaine 8 — Aptitude aux analyses statistiques (5) ----
    d8 = Domain(8, "Aptitude aux analyses statistiques prévues", 5)
    d8.add("Effectif analysable pour l'objectif principal", 1,
           1 if m["complete_cases"] > 0 else 0.5,
           f"{m['complete_cases']} dossier(s) complet(s) sur {n_rows}")
    feas = si.get("planned_analyses_feasibility")
    feas_pts = {"adaptees": 1, "sous_conditions": 0.5, "inadaptees": 0,
                "irrealisables": 0, "inevaluable": 0.5}
    for label, key in [("Nombre d'événements compatible avec les analyses", feas),
                       ("Structure compatible avec les méthodes prévues", feas)]:
        if key is None:
            d8.add(label, 1, 0.5, INEV, True)
        else:
            d8.add(label, 1, feas_pts.get(key, 0.5), f"statut : {key}")
    grp = si.get("groups_reconstructible")
    if grp is None:
        d8.add("Groupes correctement définis", 1, 0.5, INEV, True)
    else:
        d8.add("Groupes correctement définis", 1,
               {"oui": 1, "avec_reserves": 0.5, "non": 0, "non_applicable": 1}.get(grp, 0.5))
    adj = si.get("adjustment_vars_available")
    d8.add("Variables d'ajustement indispensables disponibles", 1,
           0.5 if adj is None else (1 if adj else 0), INEV if adj is None else "", adj is None)
    domains.append(d8)

    # ---- Score brut ----
    score_brut = round(sum(d.obtained for d in domains), 1)

    # ---- Plafonds (§32.12) ----
    caps: list[dict] = []

    def cap(condition: bool, label: str, value: float) -> None:
        if condition:
            caps.append({"defaut": label, "plafond": value})

    cap(n_rows == 0, "Absence de véritables observations / table vide", 10)
    cap(cjp_status in ("non_exploitable", "absent"), "Critère principal totalement absent", 49)
    cap(id_col is None, "Identifiant absent et patients non individualisables", 49)
    cap(si.get("groups_reconstructible") == "non",
        "Groupes principaux impossibles à reconstruire", 59)
    cap(cjp_missing is not None and cjp_missing > 40,
        "Plus de 40 % de données manquantes pour le critère principal", 59)
    cap(bool(si.get("major_errors_on_primary_endpoint")),
        "Erreurs majeures affectant directement le critère principal", 59)
    cap(si.get("primary_objective_vars_available") == "absent",
        "Variables indispensables à l'objectif principal absentes", 59)
    cap(s["duplicates"]["duplicate_ids"] > 0.1 * n_rows,
        "Doublons majeurs empêchant de déterminer l'effectif réel", 59)

    score_final = score_brut
    applied = []
    for c in caps:
        if score_final > c["plafond"]:
            score_final = c["plafond"]
            applied.append(c)
    score_final = round(score_final, 1)

    # ---- Niveau de qualité ----
    quality = next((lvl for th, lvl, _ in QUALITY_LEVELS if score_final >= th), "Critique")
    quality_desc = next((d for th, _, d in QUALITY_LEVELS if score_final >= th), "")

    # ---- Niveau de confiance (§32.13) ----
    n_inev = sum(1 for d in domains for c in d.criteria if c["inevaluable"])
    reasons = []
    if not has_si:
        confidence = "faible"
        reasons.append("audit méthodologique IA non exécuté (jalon M5) : "
                       f"{n_inev} critère(s) noté(s) partiellement")
    elif n_inev > 4 or not doc.get("dictionnaire"):
        confidence = "modérée"
        reasons.append(f"{n_inev} critère(s) inévaluable(s) ou documentation incomplète")
    else:
        confidence = "élevée"
        reasons.append("protocole et dictionnaire exploités, jugements complets")

    return {
        "version_grille": "hamza-v1",
        "score_brut": score_brut,
        "plafonds_detectes": caps,
        "plafonds_appliques": applied,
        "score_final": score_final,
        "niveau_qualite": quality,
        "interpretation": quality_desc,
        "confiance": {"niveau": confidence, "raisons": reasons},
        "criteres_inevaluables": n_inev,
        "domaines": [d.as_dict() for d in domains],
    }
