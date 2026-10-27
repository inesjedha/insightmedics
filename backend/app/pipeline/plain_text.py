"""Relecture « mots simples » des textes que l'étudiant lit (retour de Hamza, 27/10/2026).

Les étudiants en médecine ne connaissent pas la statistique : chaque texte de la page
d'audit doit se lire sans dictionnaire. LLM-2 juge et rédige ; une passe dédiée, plus
courte et moins chère (effort `LLM_PLAIN_EFFORT`), réécrit ensuite ces seuls textes avec
un vocabulaire de tous les jours. Le code contrôle la réécriture :
- mêmes clés, aucun texte ajouté ou retiré ;
- aucun chiffre nouveau (un chiffre inventé fausserait l'audit) ;
- aucun mot de la liste `JARGON` (hors noms de colonnes cités entre guillemets) ;
- pas de texte nettement plus long.
Une réponse refusée est redemandée avec le motif ; après la dernière tentative, chaque
texte qui passe les contrôles est gardé, les autres restent dans leur version d'origine.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from pydantic import RootModel

from .llm2 import Llm2Output, sync_missions
from .llm_client import call_and_validate
from .student_text import tidy_output

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "plain_text.md"

# (motif, remplacement conseillé) : mots qu'un étudiant sans formation statistique ne
# comprend pas. Le remplacement est rappelé au modèle quand il en laisse passer un.
JARGON: list[tuple[str, str]] = [
    (r"\bvariables?\b", "colonne"),
    (r"\beffectifs?\b", "nombre de patients"),
    (r"\bmodalités?\b", "réponse possible"),
    (r"\bdoublons?\b", "patient saisi deux fois"),
    (r"\b(?:données|valeurs?)\s+manquantes?\b|\btaux\s+de\s+manquants\b", "cases vides"),
    (r"\bcodes?\s+de\s+valeurs?\s+manquantes?\b", "999 écrit à la place d'une case vide"),
    (r"\baberran\w*|\bvaleurs?\s+extrêmes?\b|\boutliers?\b", "valeur très différente des autres"),
    (r"\bimput(?:er|ation|ations|é|ée|és|ées)\b", "(ne pas en parler)"),
    (r"\brecod\w*|\bcodage\b", "noter autrement, regrouper les réponses"),
    (r"\b(?:variables?|colonnes?)\s+dérivées?\b", "colonne calculée"),
    (r"\bcomposites?\b", "qui combine plusieurs éléments"),
    (r"\bopérationn\w*", "défini précisément"),
    (r"\bexploitab\w*", "utilisable"),
    (r"\b(?:standardis|normalis)\w*", "écrire de la même façon partout"),
    (r"\bcatégoriel\w*|\bqualitatives?\b|\bquantitatives?\b|\bvariables?\s+continues?\b",
     "réponse en mots ou en nombre"),
    (r"\bbinaires?\b|\bdichotom\w*", "à deux réponses (oui ou non)"),
    (r"\bsignificati\w*|\bp\s*[<>=≤≥]\s*0|\bvaleur\s+de\s+p\b|\bp-value", "(ne pas en parler)"),
    (r"\b(?:chi|khi)[- ]?(?:2|²|deux)\b|\b(?:student|fisher|mann[- ]whitney|wilcoxon|kruskal|"
     r"mcnemar|shapiro|anova|kaplan|cox|spearman|pearson)\b|\btests?\s+statistiques?\b",
     "comparaison, calcul"),
    (r"\brégressions?\b|\bajustement\w*|\bajusté(?:e|s|es)?\s+sur\b|\b(?:multi|uni|bi)vari\w*",
     "comparaison, calcul"),
    (r"\bcorrélations?\b", "lien entre deux mesures"),
    (r"\bintervalles?\s+de\s+confiance\b|\bIC\s*(?:à\s*)?95\b|\bécart[- ]types?\b|\bquartiles?\b"
     r"|\bnormalité\b|\bdistributions?\b", "(ne pas en parler)"),
    (r"\bmédianes?\b", "la valeur du milieu"),
    (r"\bbiais\b", "erreur qui fausse les résultats"),
    (r"\bfacteurs?\s+de\s+confusion\b", "autre explication possible"),
    (r"\bpuissance\s+statistique\b", "nombre de patients suffisant"),
    (r"\bunités?\s+statistiques?\b", "ce qu'on compte : un patient, un séjour"),
    (r"\bcensur\w*", "décrire le fait : « suivi arrêté avant J28 »"),
    (r"\banonymis\w*|\bPII\b|\bdonnées\s+identifiantes\b",
     "retirer les noms, initiales et numéros de dossier"),
    (r"\bligne[- ]modèle\b", "la fiche vierge restée dans le tableau"),
    (r"\bdictionnaire\b", "la liste des colonnes et de ce qu'elles veulent dire"),
    (r"\bprofiling\b|\bdataset\b|\bjeu\s+de\s+données\b|\bmissing\b", "votre tableau"),
    (r"\bpseudo[- ]?réplication\b", "un même patient compté plusieurs fois"),
]
_JARGON_RE = [(re.compile(p, re.I), hint) for p, hint in JARGON]
# Noms de colonnes et valeurs citées : jamais réécrits ni contrôlés.
_QUOTED_RE = re.compile(r"«[^»]*»|\"[^\"]*\"|“[^”]*”")


def jargon_hits(text: str) -> list[tuple[str, str]]:
    """Mots de jargon du texte, hors passages entre guillemets : [(mot trouvé, conseil)]."""
    bare = _QUOTED_RE.sub(" ", text or "")
    hits: list[tuple[str, str]] = []
    for pattern, hint in _JARGON_RE:
        hits.extend((m.group(0), hint) for m in pattern.finditer(bare))
    return hits


_THOUSANDS_RE = re.compile(r"(?<=\d)[   ](?=\d{3}(?!\d))")
_NUMBER_RE = re.compile(r"\d+(?:[.,]\d+)?")
# Les petits nombres s'écrivent aussi en lettres (« deux » ↔ « 2 ») : toujours admis.
_SMALL = {str(i) for i in range(11)}


def numbers(text: str) -> set[str]:
    """Nombres d'un texte, normalisés (« 2 183 » → 2183, « 9,1 » → 9.1)."""
    flat = _THOUSANDS_RE.sub("", text or "")
    return {n.replace(",", ".") for n in _NUMBER_RE.findall(flat)}


# ---------------------------------------------------------------- textes de la page

def _put(texts: dict[str, str], key: str, value: str | None) -> None:
    if value and value.strip():
        texts[key] = value


def student_texts(out: Llm2Output) -> dict[str, str]:
    """Textes lus par l'étudiant, à plat : {"missions.0.vu": "…"} (textes vides exclus)."""
    t: dict[str, str] = {}
    if out.headline:
        _put(t, "headline.title", out.headline.title)
        _put(t, "headline.subtitle", out.headline.subtitle)
    if out.exploitability_verdict:
        _put(t, "verdict.label", out.exploitability_verdict.label)
        _put(t, "verdict.justification_fr", out.exploitability_verdict.justification_fr)
    for i, m in enumerate(out.missions):
        for f in ("title", "vu", "pourquoi", "a_rouvrir", "termine_quand"):
            _put(t, f"missions.{i}.{f}", getattr(m, f))
        for j, a in enumerate(m.a_faire):
            _put(t, f"missions.{i}.a_faire.{j}", a)
    if not out.missions:  # audits sans missions : les points bloquants sont lus tels quels
        for i, b in enumerate(out.blocking_points):
            for f in ("title", "what", "why", "todo"):
                _put(t, f"blocking_points.{i}.{f}", getattr(b, f))
    for i, h in enumerate(out.highlights):
        _put(t, f"highlights.{i}.title", h.title)
        _put(t, f"highlights.{i}.detail", h.detail)
    for i, c in enumerate(out.checklist):
        _put(t, f"checklist.{i}.check", c.check)
    for i, s in enumerate(out.deja_en_ordre):
        _put(t, f"deja_en_ordre.{i}", s)
    for i, s in enumerate(out.nous_corrigeons):
        _put(t, f"nous_corrigeons.{i}", s)
    _put(t, "le_saviez_vous", out.le_saviez_vous)
    for i, e in enumerate(out.lexique):
        _put(t, f"lexique.{i}.mot", e.mot)
        _put(t, f"lexique.{i}.sens", e.sens)
    for k in ("realisable", "avec_reserves", "apres_decisions", "impossible"):
        for i, s in enumerate(getattr(out.analysis_map, k)):
            _put(t, f"analysis_map.{k}.{i}", s)
    for i, d in enumerate(out.client_decisions):
        for f in ("question_fr", "consequence_fr", "recommendation_fr"):
            _put(t, f"client_decisions.{i}.{f}", getattr(d, f))
        for j, o in enumerate(d.options):
            _put(t, f"client_decisions.{i}.options.{j}", o)
        for j, ch in enumerate(d.choices):
            _put(t, f"client_decisions.{i}.choices.{j}.label", ch.label)
            _put(t, f"client_decisions.{i}.choices.{j}.consequence", ch.consequence)
    for i, fd in enumerate(out.findings):
        for f in ("title_fr", "explanation_fr", "check_fr", "proposed_correction"):
            _put(t, f"findings.{i}.{f}", getattr(fd, f))
    return t


def _set(out: Llm2Output, key: str, value: str) -> None:
    """Écrit `value` à l'emplacement désigné par `key` (inverse de `student_texts`)."""
    parts = key.split(".")
    head = parts[0]
    if head == "headline" and out.headline:
        setattr(out.headline, parts[1], value)
    elif head == "verdict" and out.exploitability_verdict:
        setattr(out.exploitability_verdict, parts[1], value)
    elif head in ("deja_en_ordre", "nous_corrigeons"):
        getattr(out, head)[int(parts[1])] = value
    elif head == "le_saviez_vous":
        out.le_saviez_vous = value
    elif head == "analysis_map":
        getattr(out.analysis_map, parts[1])[int(parts[2])] = value
    else:
        item: Any = getattr(out, head)[int(parts[1])]
        rest = parts[2:]
        if rest[0] in ("a_faire", "options"):
            getattr(item, rest[0])[int(rest[1])] = value
        elif rest[0] == "choices":
            setattr(item.choices[int(rest[1])], rest[2], value)
        else:
            setattr(item, rest[0], value)


def _group(key: str) -> str:
    """Bloc d'un texte (« missions.0 », « headline ») : un chiffre peut passer d'un champ
    à l'autre du même bloc lors de la réécriture."""
    parts = key.split(".")
    return ".".join(parts[:2]) if len(parts) > 1 and parts[1].isdigit() else parts[0]


def _groups_numbers(texts: dict[str, str]) -> dict[str, set[str]]:
    by_group: dict[str, set[str]] = {}
    for k, v in texts.items():
        by_group.setdefault(_group(k), set()).update(numbers(v))
    return by_group


def problems(key: str, before: str, after: Any, allowed: set[str]) -> list[str]:
    """Motifs de refus d'un texte réécrit (liste vide : accepté)."""
    if not isinstance(after, str) or not after.strip():
        return ["texte vide ou manquant"]
    if key.endswith(".mot"):
        return []
    found: list[str] = []
    new_numbers = numbers(after) - allowed - _SMALL
    if new_numbers:
        found.append("chiffres absents du texte d'origine : " + ", ".join(sorted(new_numbers)))
    hits = jargon_hits(after)
    if hits:
        found.append("mots à remplacer : " + "; ".join(
            f"« {w} » → {hint}" for w, hint in dict(hits).items()))
    n_before, n_after = len(before.split()), len(after.split())
    if n_after > max(n_before * 1.4, n_before + 8):
        found.append(f"texte trop long ({n_after} mots au lieu de {n_before})")
    return found


class _Rewrite(RootModel[dict[str, Any]]):
    pass


def run_plain_pass(out: Llm2Output) -> list[str]:
    """Réécrit en mots simples les textes de `out` destinés à l'étudiant (en place).
    Retourne des notes pour le journal. Sans clé API ou en cas d'échec, les textes
    d'origine sont conservés (l'audit n'échoue jamais à cause de cette passe)."""
    texts = student_texts(out)
    if not texts:
        return []
    allowed = _groups_numbers(texts)
    last: dict[str, Any] = {}

    def check(candidate: _Rewrite) -> tuple[_Rewrite, list[str]]:
        rewritten = candidate.root
        last.clear()
        last.update(rewritten)
        missing = [k for k in texts if k not in rewritten]
        errors = [f"{k} : {'; '.join(p)}" for k in texts if k in rewritten
                  for p in [problems(k, texts[k], rewritten[k], allowed[_group(k)])] if p]
        if missing or errors:
            msg = ""
            if missing:
                msg += f"clés absentes : {', '.join(missing[:15])}. "
            if errors:
                msg += "Textes à reprendre : " + " | ".join(errors[:25])
            raise ValueError(msg)
        return candidate, []

    user = ("## TEXTES À RELIRE (JSON)\n"
            + json.dumps(texts, ensure_ascii=False, indent=0))
    from ..config import settings  # import tardif : réglage lu à l'appel (tests)

    result, notes = call_and_validate(PROMPT_PATH.read_text(encoding="utf-8"), user,
                                      _Rewrite, post=check, attempts=2,
                                      effort=settings.llm_plain_effort)
    if result is not None:
        accepted = result.root
        kept = 0
    else:
        # Dernière réponse refusée : on garde chaque texte qui passe les contrôles.
        accepted = {k: v for k, v in last.items()
                    if k in texts and not problems(k, texts[k], v, allowed[_group(k)])}
        kept = len(texts) - len(accepted)
    for k, v in accepted.items():
        if k in texts and not k.endswith(".mot"):
            _set(out, k, v.strip())
    if out.missions:
        sync_missions(out)  # points bloquants recopiés des missions réécrites
    tidy_output(out)
    summary = f"{len(accepted) - sum(k.endswith('.mot') for k in accepted)} texte(s) réécrit(s)"
    if kept:
        summary += f", {kept} gardé(s) dans leur version d'origine"
    remaining = sum(bool(jargon_hits(v)) for k, v in student_texts(out).items()
                    if not k.endswith(".mot"))
    if remaining:
        summary += f", {remaining} texte(s) contenant encore un mot technique"
    return ["Relecture mots simples : " + n for n in [*notes, summary]]
