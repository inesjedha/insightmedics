"""Chiffres clés d'un audit, tels que l'étudiant les lit (page de résultats et classeur).

Calculés à partir du profiling enregistré ; les audits antérieurs aux contrôles de copies
et de lignes modèles n'ont pas tous les champs, d'où les `.get`.
"""

from __future__ import annotations

from typing import Any


def key_counts(profiling: dict[str, Any] | None) -> dict[str, Any]:
    """Patients réels, lignes modèles, lignes recopiées ou dupliquées, manquants utiles."""
    s = (profiling or {}).get("structure") or {}
    dups = s.get("duplicates") or {}
    n_rows = int(s.get("n_rows") or 0)
    template = int((s.get("template_rows") or {}).get("n", 0))
    empty = int((s.get("empty_rows") or {}).get("n", 0))
    duplicated = int(dups.get("exact_rows", 0)) + int(dups.get("n_suspect_copy_rows", 0))
    patients = max(0, n_rows - template - empty)
    # Manquants dans les colonnes renseignées : les colonnes entièrement vides (en-têtes de
    # section, champs jamais saisis) gonfleraient le taux sans rien dire de la saisie.
    empty_cols = set(s.get("empty_columns") or [])
    useful = [c for c in (profiling or {}).get("columns") or [] if c.get("name") not in empty_cols]
    cells = n_rows * len(useful)
    missing_useful = round(100 * sum(c.get("n_missing", 0) for c in useful) / cells, 1) if cells else 0.0
    return {
        "rows": n_rows,
        "patients_min": max(0, patients - duplicated),
        "missing_useful_pct": missing_useful,
        "patients": patients,
        "template_rows": template,
        "empty_rows": empty,
        # lignes saisies deux fois : doublons stricts + recopiées sauf l'identifiant
        "duplicated_rows": duplicated,
    }


def copies_view(profiling: dict[str, Any] | None) -> dict[str, Any] | None:
    """Ce que la page montre des lignes recopiées : blocs (numéros d'inclusion si
    l'identifiant n'est pas lui-même une donnée identifiante, sinon numéros de ligne) et
    ressemblance, comparée à celle de deux patients ordinaires. Aucune valeur de cellule."""
    s = (profiling or {}).get("structure") or {}
    dups = s.get("duplicates") or {}
    near = dups.get("near_identical_rows") or {}
    blocks = dups.get("copied_blocks") or []
    n_identical = int((dups.get("identical_except_id") or {}).get("n_groups", 0))
    n_near = int(near.get("n_pairs", 0))
    if not (blocks or n_identical or n_near):
        return None
    pii = {p.get("column") for p in (profiling or {}).get("pii_candidates") or []}
    show_ids = s.get("id_column") not in pii
    similarities = [e.get("similarity") for e in near.get("examples") or [] if e.get("similarity")]
    return {
        "blocks": [{
            "length": b["length"],
            "source": b.get("source_ids") if show_ids and b.get("source_ids") else b["source_lines"],
            "copy": b.get("copy_ids") if show_ids and b.get("copy_ids") else b["copy_lines"],
            "by": "patient" if show_ids and b.get("source_ids") else "ligne",
            "min_similarity": b.get("min_similarity"),
        } for b in blocks[:3]],
        "identical_pairs": n_identical,
        "near_pairs": n_near,
        "max_similarity": max(similarities) if similarities else None,
        "median_similarity": near.get("median_similarity"),
    }
