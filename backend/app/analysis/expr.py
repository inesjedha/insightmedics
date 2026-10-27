"""Interpréteur d'expressions du plan d'analyse : fermé, vectorisé, jamais `eval`.

Une expression est une chaîne au format Python restreint, évaluée colonne par colonne sur
la base (une Series pandas par nœud) :

- `col("Nom de colonne")` : une colonne de la base (ou une colonne calculée avant) ;
- nombres et textes : `90`, `"OUI"` ;
- `+ - * /`, comparaisons `== != < <= > >=` (aussi enchaînées : `0 <= col("x") <= 100`),
  `and`, `or`, `not` ;
- fonctions : `isnull(x)`, `notnull(x)`, `ifelse(cond, a, b)`, `abs(x)`, `log(x)`,
  `days_between(debut, fin)`, `isin(x, ["a", "b"])`, `lower(x)`.

Une valeur manquante reste manquante : `col("a") > 3` vaut NA là où `a` manque, et une
ligne n'est jamais exclue ou classée sur une valeur absente sans qu'on l'ait écrit.
"""

from __future__ import annotations

import ast
import operator
from collections.abc import Callable
from typing import Any

import numpy as np
import pandas as pd


class ExprError(ValueError):
    """Expression refusée (syntaxe, colonne inconnue, fonction non autorisée)."""


_ARITH: dict[type, Callable[[Any, Any], Any]] = {
    ast.Add: operator.add, ast.Sub: operator.sub,
    ast.Mult: operator.mul, ast.Div: operator.truediv,
}
_CMP: dict[type, Callable[[Any, Any], Any]] = {
    ast.Eq: operator.eq, ast.NotEq: operator.ne, ast.Lt: operator.lt,
    ast.LtE: operator.le, ast.Gt: operator.gt, ast.GtE: operator.ge,
}
MAX_EXPR_CHARS = 2000


def _num(s: Any) -> Any:
    return pd.to_numeric(s, errors="coerce") if isinstance(s, pd.Series) else s


def _as_bool(s: Any, index: pd.Index) -> pd.Series:
    """Booléen « nullable » : NA là où l'opérande manque."""
    if not isinstance(s, pd.Series):
        return pd.Series(bool(s), index=index, dtype="boolean")
    return s.astype("boolean")


def _compare(op: type, left: Any, right: Any, index: pd.Index) -> pd.Series:
    # Comparaison numérique si l'un des côtés est un nombre, textuelle sinon.
    if isinstance(left, (int, float)) or isinstance(right, (int, float)):
        left, right = _num(left), _num(right)
    elif isinstance(left, pd.Series) and isinstance(right, str):
        left = left.astype("string").str.strip()
    elif isinstance(right, pd.Series) and isinstance(left, str):
        right = right.astype("string").str.strip()
    out = _CMP[op](left, right)
    if not isinstance(out, pd.Series):
        return pd.Series(bool(out), index=index, dtype="boolean")
    out = out.astype("boolean")
    for side in (left, right):
        if isinstance(side, pd.Series):
            out[side.isna().to_numpy()] = pd.NA
    return out


def evaluate(expr: str, df: pd.DataFrame) -> Any:
    """Évalue `expr` sur `df` ; retourne une Series (ou une constante)."""
    if len(expr) > MAX_EXPR_CHARS:
        raise ExprError("expression trop longue")
    try:
        tree = ast.parse(expr.strip(), mode="eval")
    except SyntaxError as exc:
        raise ExprError(f"syntaxe invalide : {expr[:80]}") from exc
    index = df.index

    def walk(node: ast.AST) -> Any:
        if isinstance(node, ast.Expression):
            return walk(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float, str)) \
                and not isinstance(node.value, bool):
            return node.value
        if isinstance(node, ast.List):
            return [walk(e) for e in node.elts]
        if isinstance(node, ast.UnaryOp):
            if isinstance(node.op, ast.USub):
                return -_num(walk(node.operand))
            if isinstance(node.op, ast.Not):
                return ~_as_bool(walk(node.operand), index)
        if isinstance(node, ast.BinOp) and type(node.op) in _ARITH:
            return _ARITH[type(node.op)](_num(walk(node.left)), _num(walk(node.right)))
        if isinstance(node, ast.BoolOp):
            values = [_as_bool(walk(v), index) for v in node.values]
            out = values[0]
            for v in values[1:]:
                out = (out & v) if isinstance(node.op, ast.And) else (out | v)
            return out
        if isinstance(node, ast.Compare):
            left = walk(node.left)
            result: pd.Series | None = None
            for op, comparator in zip(node.ops, node.comparators, strict=True):
                if type(op) not in _CMP:
                    raise ExprError("comparaison non autorisée")
                right = walk(comparator)
                part = _compare(type(op), left, right, index)
                result = part if result is None else (result & part)
                left = right
            return result
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            return _call(node.func.id, [walk(a) for a in node.args], df)
        raise ExprError(f"élément non autorisé : {type(node).__name__}")

    return walk(tree)


def _call(name: str, args: list[Any], df: pd.DataFrame) -> Any:
    index = df.index
    if name == "col":
        if len(args) != 1 or not isinstance(args[0], str):
            raise ExprError('col() attend un nom de colonne entre guillemets')
        if args[0] not in df.columns:
            raise ExprError(f"colonne inconnue : {args[0]}")
        return df[args[0]]
    if name in ("isnull", "notnull"):
        s = args[0]
        mask = s.isna() if isinstance(s, pd.Series) else pd.Series(s is None, index=index)
        return (mask if name == "isnull" else ~mask).astype("boolean")
    if name == "ifelse":
        cond, a, b = args
        cond = _as_bool(cond, index)
        a = a if isinstance(a, pd.Series) else pd.Series(a, index=index)
        b = b if isinstance(b, pd.Series) else pd.Series(b, index=index)
        out = a.where(cond.fillna(False).astype(bool), b)
        out[cond.isna().to_numpy()] = np.nan
        return out
    if name == "abs":
        return _num(args[0]).abs()
    if name == "log":
        s = _num(args[0])
        return np.log(s.where(s > 0))
    if name == "days_between":
        start = pd.to_datetime(args[0], errors="coerce")
        end = pd.to_datetime(args[1], errors="coerce")
        return (end - start).dt.days.astype("Float64")
    if name == "isin":
        s, values = args
        if not isinstance(values, list):
            raise ExprError("isin() attend une liste")
        norm = {str(v).strip().lower() for v in values}
        out = s.astype("string").str.strip().str.lower().isin(norm).astype("boolean")
        out[s.isna().to_numpy()] = pd.NA
        return out
    if name == "lower":
        return args[0].astype("string").str.strip().str.lower()
    raise ExprError(f"fonction non autorisée : {name}")


def columns_used(expr: str) -> list[str]:
    """Colonnes citées par `col("…")` (pour vérifier un plan sans l'exécuter)."""
    try:
        tree = ast.parse(expr.strip(), mode="eval")
    except SyntaxError as exc:
        raise ExprError(f"syntaxe invalide : {expr[:80]}") from exc
    return [n.args[0].value for n in ast.walk(tree)
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "col"
            and n.args and isinstance(n.args[0], ast.Constant) and isinstance(n.args[0].value, str)]
