"""Chiffres clés d'un audit, tels que l'étudiant les lit (page de résultats et classeur).

Calculés à partir du profiling enregistré ; les audits antérieurs aux contrôles de copies
et de lignes modèles n'ont pas tous les champs, d'où les `.get`.
"""

from __future__ import annotations

from typing import Any


def key_counts(profiling: dict[str, Any] | None) -> dict[str, int]:
    """Patients réels, lignes modèles, lignes recopiées ou dupliquées."""
    s = (profiling or {}).get("structure") or {}
    dups = s.get("duplicates") or {}
    n_rows = int(s.get("n_rows") or 0)
    template = int((s.get("template_rows") or {}).get("n", 0))
    empty = int((s.get("empty_rows") or {}).get("n", 0))
    return {
        "rows": n_rows,
        "patients": max(0, n_rows - template - empty),
        "template_rows": template,
        "empty_rows": empty,
        # lignes saisies deux fois : doublons stricts + recopiées sauf l'identifiant
        "duplicated_rows": int(dups.get("exact_rows", 0)) + int(dups.get("n_suspect_copy_rows", 0)),
    }
