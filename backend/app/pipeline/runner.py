"""Orchestrateur du pipeline d'audit (jalons M1+M2 ; M3-M6 à venir)."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .ingest import ingest
from .llm1 import run_llm1
from .profile import profile
from .rules_engine import execute_rules
from .score import score_and_issues
from .score_engine import compute_score


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_audit(path: str | Path, original_name: str,
              protocol_text: str | None = None) -> dict[str, Any]:
    """Exécute l'audit et retourne un dict complet (résumé + profiling + events)."""
    events: list[dict] = []

    def log(level: str, message: str) -> None:
        events.append({"ts": _now(), "level": level, "message": message})

    started_at = _now()
    log("info", f"Fichier reçu : {original_name}"
                + (" + protocole de recherche" if protocol_text else ""))

    df, meta = ingest(path, original_name)
    log("info", f"Parsing OK — {len(df)} lignes × {len(df.columns)} colonnes "
                f"(format {meta['format']})")

    log("info", "Profilage des variables, manquants, doublons, dates…")
    profiling = profile(df, meta)

    # --- M4 : audit IA (dictionnaire + règles) puis exécution des règles ---
    ai_audit: dict[str, Any] | None = None
    scoring_inputs: dict[str, Any] = {}
    log("info", "Audit IA : compréhension des variables et génération des "
                "règles de cohérence cliniques…")
    llm_out, llm_notes = run_llm1(profiling, df, protocol_text)
    if llm_out is not None:
        id_col = profiling["structure"]["id_column"]
        ids = df[id_col] if id_col else df.index.to_series()
        rules = [r.model_dump() for r in llm_out.coherence_rules]
        log("info", f"Vérification de {len(rules)} règle(s) de cohérence sur "
                    "toute la base…")
        violations = execute_rules(rules, df, ids)
        scoring_inputs["rule_violations"] = violations
        ai_audit = {
            "study": llm_out.study.model_dump() if llm_out.study else None,
            "dictionary": [e.model_dump() for e in llm_out.dictionary],
            "rules": rules,
            "violations": violations,
            "derived_variables": [d.model_dump() for d in llm_out.derived_variables],
            "notes": llm_notes,
        }
        n_viol = violations["total_violations"]
        log("warn" if n_viol else "success",
            f"Règles exécutées : {violations['rules_tested']} testées, "
            f"{n_viol} violation(s) dont {violations['n_major']} règle(s) "
            "majeure(s) touchée(s)")
        # Le critère principal identifié par l'IA alimente la complétude (D2)
        ep = llm_out.study.primary_endpoint if llm_out.study else None
        if ep and ep.candidate_columns:
            cand = next((c for c in profiling["columns"]
                         if c["name"] in ep.candidate_columns), None)
            if cand:
                scoring_inputs["primary_endpoint_missing_pct"] = cand["pct_missing"]
    else:
        log("warn", "Audit IA non exécuté : " + "; ".join(llm_notes))

    log("info", "Calcul du score de qualité /100 (grille officielle en 8 domaines)…")
    _, issues, notes = score_and_issues(profiling)  # issues lisibles pour le front
    score_detail = compute_score(profiling, scoring_inputs or None)  # grille M3
    score = score_detail["score_final"]
    if score_detail["plafonds_appliques"]:
        for c in score_detail["plafonds_appliques"]:
            issues.insert(0, {"level": "critical",
                              "label": f"Plafond appliqué ({c['plafond']}/100) : {c['defaut']}"})
    if ai_audit and ai_audit["violations"]["total_violations"]:
        v = ai_audit["violations"]
        worst = sorted((r for r in v["results"] if r["n_violations"]),
                       key=lambda r: -r["n_violations"])[:3]
        for w in worst:
            issues.append({"level": "critical" if w["severity"] in ("critical", "major")
                           else "warn",
                           "label": f"Règle violée ({w['n_violations']}×) : {w['description']}"})
    n_crit = sum(1 for i in issues if i["level"] == "critical")
    log("success" if n_crit == 0 else "warn",
        f"Audit terminé — score {score}/100 ({score_detail['niveau_qualite']}), "
        f"{n_crit} anomalie(s) critique(s), confiance {score_detail['confiance']['niveau']}")

    m = profiling["missing_summary"]
    s = profiling["structure"]
    return {
        "started_at": started_at,
        "finished_at": _now(),
        "score": score,
        "row_count": s["n_rows"],
        "column_count": s["n_cols"],
        "missing_pct": m["pct_global"],
        "duplicates_pct": round(s["duplicates"]["exact_rows"] / max(s["n_rows"], 1) * 100, 1),
        "issues": issues,
        "critical_issues": n_crit,
        "profiling": profiling,
        "score_detail": score_detail,
        "ai_audit": ai_audit,
        "events": events,
        "internal_notes": notes,
    }
