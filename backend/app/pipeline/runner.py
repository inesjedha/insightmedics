"""Orchestrateur du pipeline d'audit : ingestion → profiling → audit IA → score.

`run_audit` enchaîne les étapes et retourne un dict complet (résumé, profiling, score,
audit IA, journal d'événements). Le détail de l'audit IA (M4 règles + M5 jugement) est
isolé dans `_run_ai_audit` pour garder l'orchestrateur lisible.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from .ingest import ingest
from .issues import detect_issues
from .llm1 import run_llm1
from .llm2 import run_llm2
from .profile import profile
from .rules_engine import execute_rules
from .score_engine import compute_score

LogFn = Callable[[str, str], None]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _run_ai_audit(profiling: dict[str, Any], df: pd.DataFrame, protocol_text: str | None,
                  scoring_inputs: dict[str, Any], log: LogFn) -> dict[str, Any] | None:
    """Audit IA — M4 (dictionnaire + règles exécutées) puis M5 (jugement + verdict).

    Alimente `scoring_inputs` en place et retourne l'audit IA, ou None si l'IA n'a pas
    pu produire l'étape M4 (clé API absente, etc.). Si M4 réussit mais pas M5, on retourne
    l'audit partiel (sans « assessment »).
    """
    log("info", "Audit IA : compréhension des variables et génération des "
                "règles de cohérence cliniques…")
    llm_out, llm_notes = run_llm1(profiling, df, protocol_text)
    if llm_out is None:
        log("warn", "Audit IA non exécuté : " + "; ".join(llm_notes))
        return None

    id_col = profiling["structure"]["id_column"]
    ids = df[id_col] if id_col else df.index.to_series()
    rules = [r.model_dump() for r in llm_out.coherence_rules]
    log("info", f"Vérification de {len(rules)} règle(s) de cohérence sur toute la base…")
    violations = execute_rules(rules, df, ids)
    scoring_inputs["rule_violations"] = violations
    ai_audit: dict[str, Any] = {
        "study": llm_out.study.model_dump() if llm_out.study else None,
        "dictionary": [e.model_dump() for e in llm_out.dictionary],
        "rules": rules,
        "violations": violations,
        "derived_variables": [d.model_dump() for d in llm_out.derived_variables],
        "derived_analysis_variables": [d.model_dump() for d in llm_out.derived_analysis_variables],
        "notes": llm_notes,
    }
    n_viol = violations["total_violations"]
    log("warn" if n_viol else "success",
        f"Règles exécutées : {violations['rules_tested']} testées, "
        f"{n_viol} violation(s) dont {violations['n_major']} règle(s) majeure(s) touchée(s)")

    # Le critère principal identifié par l'IA alimente la complétude (domaine 2).
    ep = llm_out.study.primary_endpoint if llm_out.study else None
    if ep and ep.candidate_columns:
        cand = next((c for c in profiling["columns"] if c["name"] in ep.candidate_columns), None)
        if cand:
            scoring_inputs["primary_endpoint_missing_pct"] = cand["pct_missing"]

    # --- M5 : jugement méthodologique (classification, verdict, rédaction FR) ---
    log("info", "Audit IA : classification des anomalies, faisabilité et "
                "verdict d'exploitabilité…")
    llm2_out, llm2_notes = run_llm2(profiling, ai_audit)
    if llm2_out is None:
        log("warn", "Jugement IA (LLM-2) non produit : " + "; ".join(llm2_notes))
        return ai_audit

    scoring_inputs.update(llm2_out.scoring_inputs.model_dump(exclude_none=True))
    ai_audit["assessment"] = {
        "findings": [f.model_dump() for f in llm2_out.findings],
        "client_decisions": [d.model_dump() for d in llm2_out.client_decisions],
        "cleaning_plan": [c.model_dump() for c in llm2_out.cleaning_plan],
        "exploitability_verdict": llm2_out.exploitability_verdict.model_dump()
        if llm2_out.exploitability_verdict else None,
        "executive_summary_fr": llm2_out.executive_summary_fr,
        "report_sections_fr": llm2_out.report_sections_fr.model_dump(),
        "pii_assessment": [p.model_dump() for p in llm2_out.pii_assessment],
        "notes": llm2_notes,
    }
    # Filet de cohérence verdict ↔ score : un verdict « non exploitable » (4) ou
    # « absence de données » (5) ne peut pas coexister avec un score élevé.
    verdict = llm2_out.exploitability_verdict
    if verdict is not None:
        scoring_inputs["global_verdict_level"] = verdict.level
    log("success", f"Jugement IA : {len(llm2_out.findings)} anomalie(s) classée(s)"
                   + (f", verdict « {verdict.label} »" if verdict else ""))
    return ai_audit


def run_audit(path: str | Path, original_name: str,
              protocol_text: str | None = None) -> dict[str, Any]:
    """Exécute l'audit complet et retourne un dict (résumé + profiling + score + events)."""
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

    scoring_inputs: dict[str, Any] = {}
    ai_audit = _run_ai_audit(profiling, df, protocol_text, scoring_inputs, log)

    # Backstop déterministe : sans protocole, le critère de jugement principal ne peut pas
    # être figé opérationnellement (variable/temps/contraste/méthode non préspécifiés) → 49.
    if not protocol_text:
        scoring_inputs["primary_endpoint_operationally_defined"] = False

    log("info", "Calcul du score de qualité /100 (grille officielle en 8 domaines)…")
    issues, notes = detect_issues(profiling)  # anomalies lisibles pour le front
    score_detail = compute_score(profiling, scoring_inputs or None)
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
            issues.append({"level": "critical" if w["severity"] in ("critical", "major") else "warn",
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
