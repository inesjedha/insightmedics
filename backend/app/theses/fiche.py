"""Fiche de mission d'une thèse : ce qui est propre à la thèse (titre, faculté, objectifs,
critère principal…), remplie par l'étudiant sur son lien privé ou par l'équipe dans
l'admin.

Le schéma est celui de Dr Hamza (`hamza/Fiche_mission_these.json`) : mêmes clés que ses
prompts (`these.titre`, `critere_principal`…), servi tel quel au front qui en construit
le formulaire. Quand Hamza ajoute un champ, il suffit de remplacer le JSON.

« je ne sais pas » est accepté pour tout champ non obligatoire : le champ devient « non
documenté », n'est jamais deviné et produit une mention [À CONFIRMER : …].
"""

from __future__ import annotations

import json
from functools import cache
from pathlib import Path
from typing import Any

SCHEMA_PATH = Path(__file__).parent / "hamza" / "Fiche_mission_these.json"
UNKNOWN = "je ne sais pas"

# Champs que l'étudiant remplit sur son lien privé ; les autres (`qui` = « Insight
# Medics ») sont réservés à l'équipe.
STUDENT = "doctorant"


class FicheError(ValueError):
    """Fiche invalide : la liste des problèmes est dans `problems`."""

    def __init__(self, problems: list[str]):
        super().__init__("; ".join(problems))
        self.problems = problems


@cache
def schema() -> dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def fields() -> dict[str, dict[str, Any]]:
    return schema()["champs"]


def student_editable(key: str) -> bool:
    """L'étudiant peut remplir le champ (« doctorant », « doctorant propose… »)."""
    return fields()[key].get("qui", "").startswith(STUDENT)


# Garde-fous de taille : la fiche part dans le prompt de l'IA (coût, injection).
MAX_TEXT = 2000
MAX_ITEMS = 40


def validated_by_team(current: dict[str, Any] | None, update: dict[str, Any]) -> list[str]:
    """Champs « doctorant propose, Insight Medics valide » déjà remplis : l'étudiant ne
    les remplace plus (l'équipe a pu les corriger). Renvoie leurs libellés."""
    out = []
    for key, value in update.items():
        spec = fields().get(key, {})
        who = spec.get("qui", "")
        before = (current or {}).get(key)
        if who.startswith(STUDENT) and who != STUDENT and before not in (None, "", [], UNKNOWN) \
                and value != before:
            out.append(spec.get("libelle", key))
    return out


def _too_big(value: Any) -> bool:
    if isinstance(value, str):
        return len(value) > MAX_TEXT
    if isinstance(value, list):
        return len(value) > MAX_ITEMS or any(_too_big(v) for v in value)
    if isinstance(value, dict):
        return len(value) > MAX_ITEMS or any(_too_big(v) for v in value.values())
    return False


def defaults() -> dict[str, Any]:
    return {k: f["defaut"] for k, f in fields().items() if "defaut" in f}


def _check(key: str, spec: dict[str, Any], value: Any) -> str | None:
    """Problème de la valeur, ou None. Les types sont ceux du JSON de Hamza."""
    kind = spec.get("type")
    label = spec.get("libelle", key)
    if value in (None, "", []):
        return None
    if value == UNKNOWN:
        return f"« {label} » est obligatoire" if spec.get("obligatoire") else None
    if _too_big(value):
        return f"« {label} » : trop long ({MAX_TEXT} caractères, {MAX_ITEMS} éléments au plus)"
    if kind in ("texte", "choix_plus_texte"):
        return None if isinstance(value, str) else f"« {label} » : texte attendu"
    if kind == "choix":
        allowed = spec.get("valeurs") or []
        return None if value in allowed else f"« {label} » : valeur inconnue « {value} »"
    if kind == "choix_multiple":
        allowed = spec.get("valeurs") or []
        if not isinstance(value, list) or any(v not in allowed for v in value):
            return f"« {label} » : choisir parmi {', '.join(allowed)}"
        return None
    if kind == "entier":
        return None if isinstance(value, int) and not isinstance(value, bool) and value >= 0 \
            else f"« {label} » : nombre entier attendu"
    if kind == "booléen":
        return None if isinstance(value, bool) else f"« {label} » : oui ou non attendu"
    if kind in ("liste", "liste_fichiers"):
        ok = isinstance(value, list) and all(isinstance(v, str) for v in value)
        return None if ok else f"« {label} » : liste de textes attendue"
    if kind == "objet":
        subs = spec.get("sous_champs") or []
        ok = isinstance(value, dict) and all(k in subs and isinstance(v, str)
                                             for k, v in value.items())
        return None if ok else f"« {label} » : champs attendus {', '.join(subs)}"
    if kind == "liste_objets":
        subs = spec.get("sous_champs") or []
        ok = isinstance(value, list) and all(
            isinstance(v, dict) and all(k in subs and isinstance(x, str) for k, x in v.items())
            for v in value)
        return None if ok else f"« {label} » : liste de {', '.join(subs)} attendue"
    return None


def validate(data: dict[str, Any], *, student: bool = False) -> dict[str, Any]:
    """Fiche nettoyée (clés connues, valeurs vides retirées). Lève `FicheError`.
    `student=True` : seuls les champs de l'étudiant sont acceptés."""
    if not isinstance(data, dict):
        raise FicheError(["la fiche doit être un objet JSON"])
    specs = fields()
    problems: list[str] = []
    clean: dict[str, Any] = {}
    for key, value in data.items():
        if key not in specs:
            problems.append(f"champ inconnu « {key} »")
            continue
        if student and not student_editable(key):
            problems.append(f"« {specs[key].get('libelle', key)} » est rempli par l'équipe")
            continue
        if isinstance(value, str):
            value = value.strip()
        problem = _check(key, specs[key], value)
        if problem:
            problems.append(problem)
        elif value not in (None, "", []):
            clean[key] = value
    if problems:
        raise FicheError(problems)
    return clean


def merge(current: dict[str, Any] | None, update: dict[str, Any]) -> dict[str, Any]:
    """Mise à jour partielle : une valeur vide efface le champ."""
    out = dict(current or {})
    for key, value in update.items():
        if value in (None, "", []):
            out.pop(key, None)
        else:
            out[key] = value
    return out


def effective(fiche: dict[str, Any] | None) -> dict[str, Any]:
    """Fiche complétée par les valeurs par défaut du schéma."""
    return {**defaults(), **(fiche or {})}


def missing_for_launch(fiche: dict[str, Any] | None) -> list[str]:
    """Champs obligatoires encore vides (ou « je ne sais pas »)."""
    f = fiche or {}
    return [spec.get("libelle", key) for key, spec in fields().items()
            if spec.get("obligatoire") and f.get(key) in (None, "", [], UNKNOWN)]


def to_confirm(fiche: dict[str, Any] | None) -> list[str]:
    """Champs laissés à « je ne sais pas » : autant de mentions [À CONFIRMER : …]."""
    return [fields()[k].get("libelle", k) for k, v in (fiche or {}).items()
            if v == UNKNOWN and k in fields()]


def unsupported(fiche: dict[str, Any] | None) -> list[str]:
    """Ce que le workflow automatique ne sait pas encore faire (à traiter à la main)."""
    out = []
    lang = effective(fiche).get("these.langue")
    if lang == "ar":
        out.append("thèse en arabe : rédaction et mise en page à faire par l'équipe")
    elif lang == "en":
        # Tableaux du moteur à la française (virgule décimale) : pas encore convertis.
        out.append("thèse en anglais : format faculté pas encore automatisé (tableaux en "
                   "virgule décimale), à traiter au format simple ou par l'équipe")
    return out


def faculty(fiche: dict[str, Any] | None) -> str | None:
    value = (fiche or {}).get("these.faculte")
    return value if isinstance(value, str) and value else None


def language(fiche: dict[str, Any] | None) -> str:
    value = effective(fiche).get("these.langue", "fr")
    return value if value in ("fr", "en") else "fr"
