#!/usr/bin/env python3
"""Étalonnage Insight Medics contre le livrable manuel de Hamza (4 bases).

Fait tourner l'audit COMPLET (IA activée) sur les 4 bases de référence et affiche
un tableau comparatif : notre score / verdict / confiance / nb d'anomalies face aux
valeurs de Hamza. À lancer depuis backend/ avec le venv actif et la clé API dans .env.

Usage :
    cd backend
    source .venv/bin/activate
    python scripts/calibrate_hamza.py                       # dossier par défaut
    python scripts/calibrate_hamza.py "/chemin/Dossier LLM ines"
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.pipeline.docs_extract import extract_text
from app.pipeline.runner import run_audit

DEFAULT_DOSSIER = Path.home() / "Downloads" / "Dossier LLM ines"

# (nom, base brute, protocole optionnel, valeurs de référence Hamza)
# Hamza : score brut, score officiel (après plafond), verdict court, nb d'anomalies.
BASES = [
    {
        "nom": "Amine",
        "base": "Base amine/Base recue/these Amine51.sav",
        "protocole": "Base amine/Base recue/protocole de recherche (1).docx",
        "hamza": {"brut": 51, "officiel": 49, "verdict": "partiellement exploitable",
                  "anomalies": 59, "confiance": "modéré"},
    },
    {
        "nom": "Eya",
        "base": "Base Eya/Base reçue /Formulaire Eya (réponses).xlsx",
        "protocole": "Base Eya/Base reçue /protocole these (1).docx",
        "hamza": {"brut": 64, "officiel": 49, "verdict": "utilisable (critères secondaires)",
                  "anomalies": 16, "confiance": "élevée"},
    },
    {
        "nom": "Houssem",
        "base": "Base Houssem/Base recue/base houssem (1).sav",
        "protocole": None,  # seulement une image de titre, pas de protocole texte
        "hamza": {"brut": 58, "officiel": 49, "verdict": "descriptives/comparatives",
                  "anomalies": 142, "confiance": "—"},
    },
    {
        "nom": "Syrine",
        "base": "Base syrine/Base recue/rechutepancreas (3).sav",
        "protocole": "Base syrine/Base recue/FINAL PANCREAS THESE (1).docx",
        "hamza": {"brut": 73, "officiel": 73, "verdict": "acceptable après nettoyage",
                  "anomalies": 25, "confiance": "—"},
    },
]


def main() -> None:
    # Args : un chemin (dossier) et/ou un nom de base pour n'en tester qu'une seule.
    known = {b["nom"].lower() for b in BASES}
    dossier, only = DEFAULT_DOSSIER, None
    for arg in sys.argv[1:]:
        if arg.lower() in known:
            only = arg.lower()
        elif arg.strip():
            dossier = Path(arg)
    if not dossier.exists():
        print(f"Dossier introuvable : {dossier}\n"
              f"Passe le chemin en argument : python scripts/calibrate_hamza.py \"/chemin\"")
        sys.exit(1)

    from app.config import settings
    print(f"Fournisseur IA : {settings.resolved_provider or 'AUCUN'} / "
          f"{settings.resolved_model or '—'}")
    if not settings.resolved_provider:
        print("⚠️  Aucune clé API configurée dans .env — l'audit IA sera sauté "
              "(domaines 5/6/8 en 'inévaluable').")
    print()

    rows = []
    for b in BASES:
        if only and b["nom"].lower() != only:
            continue
        base_path = dossier / b["base"]
        if not base_path.exists():
            print(f"[{b['nom']}] fichier absent : {base_path}")
            continue
        protocol_text = None
        if b["protocole"] and (dossier / b["protocole"]).exists():
            try:
                protocol_text = extract_text(dossier / b["protocole"])
            except Exception as exc:  # noqa: BLE001
                print(f"[{b['nom']}] protocole illisible ({exc}) — audit sans protocole")

        print(f"[{b['nom']}] audit en cours…", flush=True)
        t0 = time.time()
        try:
            r = run_audit(str(base_path), base_path.name, protocol_text)
        except Exception as exc:  # noqa: BLE001
            print(f"[{b['nom']}] ÉCHEC : {exc}")
            continue
        sd = r["score_detail"]
        assess = (r.get("ai_audit") or {}).get("assessment") or {}
        verdict = (assess.get("exploitability_verdict") or {}).get("label", "—")
        n_findings = len(assess.get("findings", []))
        rows.append({
            "nom": b["nom"],
            "nous_brut": sd["score_brut"],
            "nous_off": sd["score_final"],
            "nous_conf": sd["confiance"]["niveau"],
            "nous_verdict": verdict,
            "nous_anom": n_findings,
            "plafond": "; ".join(c["defaut"][:40] for c in sd["plafonds_appliques"]) or "—",
            **b["hamza"],
        })
        print(f"[{b['nom']}] terminé en {time.time() - t0:.0f}s — "
              f"score {sd['score_final']}/100\n", flush=True)

    if not rows:
        print("Aucun audit abouti.")
        return

    print("=" * 92)
    print("TABLEAU COMPARATIF — Insight Medics vs Hamza")
    print("=" * 92)
    h = f"{'Base':<9}{'NOUS off':>9}{'HAMZA off':>10}{'écart':>7}   " \
        f"{'NOUS brut':>10}{'HAMZA brut':>11}   {'anom N/H':>9}   {'confiance':>10}"
    print(h)
    print("-" * 92)
    for r in rows:
        ecart = r["nous_off"] - r["officiel"]
        print(f"{r['nom']:<9}{r['nous_off']:>9}{r['officiel']:>10}{ecart:>+7.1f}   "
              f"{r['nous_brut']:>10}{r['brut']:>11}   "
              f"{str(r['nous_anom']) + '/' + str(r['anomalies']):>9}   "
              f"{r['nous_conf']:>10}")
    print("-" * 92)
    print("\nDÉTAIL DES VERDICTS")
    for r in rows:
        print(f"  {r['nom']:<9} nous : « {r['nous_verdict']} »")
        print(f"  {'':<9} Hamza: « {r['verdict']} »")
        if r["plafond"] != "—":
            print(f"  {'':<9} plafond appliqué : {r['plafond']}")
    print("\nCible : écart |off| ≤ 5 points et mêmes verdicts que Hamza.")


if __name__ == "__main__":
    main()
