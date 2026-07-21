"""Étape 4 — Moteur d'exécution des règles DSL (jalon M4).

Interpréteur sûr : AST JSON fermé, parseur arithmétique restreint (jamais eval).
Une règle ne s'évalue que sur les lignes où toutes ses colonnes sont renseignées ;
les lignes non testables sont comptées à part, jamais en violation.
"""

from __future__ import annotations

import ast
import itertools
import operator
from typing import Any

import numpy as np
import pandas as pd

_BIN_OPS = {ast.Add: operator.add, ast.Sub: operator.sub,
            ast.Mult: operator.mul, ast.Div: operator.truediv, ast.Pow: operator.pow}


def eval_formula(expr: str, df: pd.DataFrame) -> pd.Series:
    """Évalue une formule arithmétique restreinte (colonnes, nombres, + - * / **)."""
    tree = ast.parse(expr, mode="eval")

    def walk(node: ast.AST) -> Any:
        if isinstance(node, ast.Expression):
            return walk(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.Name):
            if node.id not in df.columns:
                raise ValueError(f"colonne inconnue : {node.id}")
            return pd.to_numeric(df[node.id], errors="coerce")
        if isinstance(node, ast.BinOp) and type(node.op) in _BIN_OPS:
            return _BIN_OPS[type(node.op)](walk(node.left), walk(node.right))
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            return -walk(node.operand)
        raise ValueError(f"expression non autorisée : {ast.dump(node)[:60]}")

    return walk(tree)


def _side(spec: dict, df: pd.DataFrame):
    if "col" in spec:
        s = df[spec["col"]]
        return pd.to_datetime(s, errors="coerce") if s.dtype == object and \
            pd.api.types.is_datetime64_any_dtype(pd.to_datetime(s, errors="coerce")) else s
    return spec["value"]


_CMP = {"gte": operator.ge, "lte": operator.le, "gt": operator.gt,
        "lt": operator.lt, "eq": operator.eq, "neq": operator.ne}


def _testable(node: dict, df: pd.DataFrame) -> pd.Series:
    """True là où toutes les colonnes impliquées sont renseignées."""
    mask = pd.Series(True, index=df.index)
    op = node["op"]
    if op in _CMP:
        for spec in (node["left"], node["right"]):
            if "col" in spec:
                mask &= df[spec["col"]].notna()
    elif op == "not_null":
        pass
    elif op == "in_set":
        mask &= df[node["left"]["col"]].notna()
    elif op == "implies":
        mask &= _testable(node["if"], df) & _testable(node["then"], df)
    elif op == "bounds":
        mask &= df[node["col"]].notna()
    elif op == "formula_match":
        mask &= df[node["target"]["col"]].notna()
        try:
            mask &= eval_formula(node["formula"], df).notna()
        except ValueError:
            mask &= False
    elif op == "chrono_order":
        for c in node["cols"]:
            mask &= df[c].notna()
    return mask


def _satisfied(node: dict, df: pd.DataFrame) -> pd.Series:
    """True là où la règle est respectée (sur les lignes testables)."""
    op = node["op"]
    if op in _CMP:
        left, right = _side(node["left"], df), _side(node["right"], df)
        # comparaison souple : numérique si possible, sinon chaîne
        if isinstance(left, pd.Series) and left.dtype == object:
            num = pd.to_numeric(left, errors="coerce")
            left = num if num.notna().any() else left.astype(str).str.strip()
        if isinstance(right, pd.Series) and right.dtype == object:
            num = pd.to_numeric(right, errors="coerce")
            right = num if num.notna().any() else right.astype(str).str.strip()
        with np.errstate(invalid="ignore"):
            return _CMP[op](left, right)
    if op == "not_null":
        return df[node["col"]].notna()
    if op == "in_set":
        vals = {str(v) for v in node["values"]}
        return df[node["left"]["col"]].astype(str).str.strip().isin(vals)
    if op == "implies":
        cond = _satisfied(node["if"], df)
        then = _satisfied(node["then"], df)
        return ~cond | then
    if op == "bounds":
        s = pd.to_numeric(df[node["col"]], errors="coerce")
        ok = pd.Series(True, index=df.index)
        if node.get("min") is not None:
            ok &= s >= node["min"]
        if node.get("max") is not None:
            ok &= s <= node["max"]
        return ok
    if op == "formula_match":
        target = pd.to_numeric(df[node["target"]["col"]], errors="coerce")
        computed = eval_formula(node["formula"], df)
        return (target - computed).abs() <= node.get("tolerance", 0.001)
    if op == "chrono_order":
        cols = [pd.to_datetime(df[c], errors="coerce") for c in node["cols"]]
        ok = pd.Series(True, index=df.index)
        for a, b in itertools.pairwise(cols):
            ok &= a <= b
        return ok
    raise ValueError(f"op inconnu : {op}")


def execute_rules(rules: list[dict], df: pd.DataFrame,
                  id_series: pd.Series) -> dict[str, Any]:
    """rules : liste de {id, description, severity, category, rule(DSL)}."""
    results = []
    failed_parse = 0
    for r in rules:
        try:
            testable = _testable(r["rule"], df)
            sat = _satisfied(r["rule"], df)
        except (ValueError, KeyError, TypeError):
            failed_parse += 1
            continue
        viol_mask = testable & ~sat.fillna(False)
        n_viol = int(viol_mask.sum())
        results.append({
            "rule_id": r["id"], "description": r["description"],
            "severity": r["severity"], "category": r["category"],
            "n_tested": int(testable.sum()), "n_violations": n_viol,
            "violation_rate": round(n_viol / max(int(testable.sum()), 1) * 100, 1),
            "row_ids": [str(v) for v in id_series[viol_mask].head(20).tolist()],
        })

    total_tests = sum(r["n_tested"] for r in results)
    total_viol = sum(r["n_violations"] for r in results)

    def _cat_rate(cat: str) -> float:
        tested = sum(r["n_tested"] for r in results if r["category"] == cat)
        viol = sum(r["n_violations"] for r in results if r["category"] == cat)
        return round(viol / max(tested, 1) * 100, 1)

    return {
        "rules_tested": len(results),
        "rules_failed_to_parse": failed_parse,
        "total_violations": total_viol,
        "violation_rate": round(total_viol / max(total_tests, 1) * 100, 1),
        "n_major": sum(1 for r in results
                       if r["severity"] in ("critical", "major") and r["n_violations"]),
        "synthetic_rate": _cat_rate("synthetic"),
        "totals_rate": _cat_rate("totals"),
        "results": results,
    }
