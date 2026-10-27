"""Plan d'analyse proposé par l'IA (prompt app/prompts/analysis_plan.md), vérifié par le
code avant d'être montré à Dr Hamza : colonnes connues, expressions valides, analyse
principale présente. Un plan incohérent est renvoyé au modèle avec ses erreurs."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from ..pipeline.llm_client import call_and_validate, client_content
from .plan import AnalysisPlan, plan_problems
from .prepare import dry_run, first_data_line

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "analysis_plan.md"
MAX_LEVELS = 15


def describe_columns(df: pd.DataFrame, profiling: dict[str, Any]) -> list[dict[str, Any]]:
    """Ce que l'IA voit de la base : jamais les lignes, seulement chaque colonne (type,
    effectifs, réponses possibles ou résumé chiffré). Les colonnes identifiantes ne
    montrent aucune valeur."""
    pii = {p.get("column") for p in profiling.get("pii_candidates") or []}
    guesses = {c.get("name"): c.get("stat_type_guess") for c in profiling.get("columns") or []}
    codes = {c.get("name"): c.get("suspected_missing_codes")
             for c in profiling.get("columns") or [] if c.get("suspected_missing_codes")}
    out: list[dict[str, Any]] = []
    for col in df.columns:
        s = df[col]
        entry: dict[str, Any] = {"name": str(col), "type": guesses.get(str(col)),
                                 "n": int(s.notna().sum()), "missing": int(s.isna().sum())}
        if codes.get(str(col)):
            entry["codes_suspects"] = codes[str(col)]
        if col in pii:
            entry["identifying"] = True
        else:
            counts = s.dropna().astype(str).str.strip().value_counts()
            if 0 < len(counts) <= MAX_LEVELS:
                entry["values"] = {str(k): int(v) for k, v in counts.items()}
            else:
                num = pd.to_numeric(s, errors="coerce").dropna()
                if len(num) >= max(3, 0.5 * s.notna().sum()):
                    entry["numeric"] = {"min": float(num.min()), "median": float(num.median()),
                                        "max": float(num.max()), "n_numeric": len(num)}
                entry["examples"] = counts.index[:5].tolist()
        out.append(entry)
    return out


_FINDING_KEYS = ("anomaly_class", "severity", "column", "affected_columns", "rows_fr",
                 "observed", "rule_violated", "title_fr", "explanation_fr",
                 "proposed_correction", "requires_source_verification")
_CHECK_KEYS = ("lignes", "patients", "colonne", "valeur", "check")


def build_message(df: pd.DataFrame, profiling: dict[str, Any], audit_ai: dict[str, Any] | None,
                  protocol: str | None, instructions: str, recheck: dict[str, Any] | None,
                  corrected_by_student: bool = False) -> str:
    assessment = (audit_ai or {}).get("assessment") or {}
    payload = {
        "base_source": ("base corrigée par l'étudiant" if corrected_by_student else
                        "base de l'audit, telle que l'étudiant l'a envoyée : à nettoyer"),
        "anomalies_de_l_audit": [{k: f.get(k) for k in _FINDING_KEYS if f.get(k)}
                                 for f in assessment.get("findings") or []],
        "liste_de_verification": [{k: c.get(k) for k in _CHECK_KEYS if c.get(k)}
                                  for c in assessment.get("checklist") or []],
        "nettoyage_propose_par_l_audit": [
            {k: op.get(k) for k in ("operation", "column", "params", "rationale_fr")}
            for op in assessment.get("cleaning_plan") or []],
        "etude_reconstruite_par_l_audit": (audit_ai or {}).get("study"),
        "questions_de_l_audit": [
            {"question": d.get("question_fr"), "priorite": d.get("priority")}
            for d in assessment.get("client_decisions") or []],
        "missions_de_l_audit": [m.get("title") for m in assessment.get("missions") or []],
        "carte_des_analyses_de_l_audit": assessment.get("analysis_map"),
        "contre_audit": recheck,
        "colonnes": describe_columns(df, profiling),
    }
    parts = [
        "## CONSIGNES DE L'ÉQUIPE (réponses du directeur, définitions validées, demandes)\n"
        + (instructions.strip() or "Aucune consigne particulière."),
        "## FAITS (calculés par le code)\n" + json.dumps(payload, ensure_ascii=False,
                                                       default=str)[:150000],
    ]
    if protocol:
        parts.append("## PROTOCOLE\n" + client_content(protocol[:60000]))
    return "\n\n".join(parts)


def run_plan_llm(df: pd.DataFrame, profiling: dict[str, Any], audit_ai: dict[str, Any] | None,
                 protocol: str | None, instructions: str,
                 recheck: dict[str, Any] | None,
                 corrected_by_student: bool = False) -> tuple[AnalysisPlan | None, list[str]]:
    system = PROMPT_PATH.read_text(encoding="utf-8")
    user = build_message(df, profiling, audit_ai, protocol, instructions, recheck,
                         corrected_by_student)
    columns = [str(c) for c in df.columns]

    def _post(plan: AnalysisPlan) -> tuple[AnalysisPlan, list[str]]:
        problems = (plan_problems(plan, columns)
                    or dry_run(df, plan, first_data_line(profiling)))
        if problems:
            raise ValueError("plan incohérent : " + " ; ".join(problems[:10]))
        return plan, [f"{len(plan.corrections)} correction(s), {len(plan.analyses)} "
                      f"analyse(s), {len(plan.derived)} colonne(s) calculée(s), "
                      f"{len(plan.to_check)} point(s) à vérifier au dossier"]

    plan, notes = call_and_validate(system, user, AnalysisPlan, post=_post)
    return plan, ["Plan IA : " + n for n in notes]
