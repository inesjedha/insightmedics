"""Orchestrateur du pipeline d'audit (jalons M1+M2 ; M3-M6 à venir)."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .ingest import ingest
from .profile import profile
from .score import score_and_issues
from .score_engine import compute_score


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_audit(path: str | Path, original_name: str) -> dict[str, Any]:
    """Exécute l'audit et retourne un dict complet (résumé + profiling + events)."""
    events: list[dict] = []

    def log(level: str, message: str) -> None:
        events.append({"ts": _now(), "level": level, "message": message})

    started_at = _now()
    log("info", f"Fichier reçu : {original_name}")

    df, meta = ingest(path, original_name)
    log("info", f"Parsing OK — {len(df)} lignes × {len(df.columns)} colonnes "
                f"(format {meta['format']})")

    log("info", "Profilage des variables, manquants, doublons, dates…")
    profiling = profile(df, meta)

    log("info", "Calcul du score de qualité /100 (grille officielle en 8 domaines)…")
    _, issues, notes = score_and_issues(profiling)  # issues lisibles pour le front
    score_detail = compute_score(profiling)          # grille de Hamza (M3)
    score = score_detail["score_final"]
    if score_detail["plafonds_appliques"]:
        for c in score_detail["plafonds_appliques"]:
            issues.insert(0, {"level": "critical",
                              "label": f"Plafond appliqué ({c['plafond']}/100) : {c['defaut']}"})
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
        "events": events,
        "internal_notes": notes,
    }
