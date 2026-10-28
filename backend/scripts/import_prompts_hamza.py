"""Importe les règles de rédaction des prompts de Dr Hamza dans les prompts de la
plateforme (une fois par mise à jour de ses prompts).

Usage : python scripts/import_prompts_hamza.py "<dossier Prompts_theses>"

Pour chaque faculté, extrait de la version B du prompt 1 les parties utiles à la
rédaction de l'« Analyse statistique » et des Résultats (rôle, règles, décisions types,
formulations du M&M, plan et phrases des Résultats, rédaction, légendes, choix des
figures), et écrit `app/prompts/theses/resultats_<FAC>.md`. Les parties que le code fait
lui-même (calculs § 8, mise en page § 10.2 et § 12, contrôles § 14, livrables § 15) ne
sont pas reprises : les lui donner pousserait le modèle à recalculer ou à mettre en page.
Copie aussi les chartes JSON et la fiche de mission dans `app/theses/hamza/`.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "prompts" / "theses"
HAMZA = ROOT / "app" / "theses" / "hamza"
FACULTIES = {"FMS": "FMS_Sousse", "FMT": "FMT_Tunis", "FMM": "FMM_Monastir", "FMSf": "FMSf_Sfax"}
# Parties gardées : section entière (« 1 ») ou sous-parties (« 6.2 »).
KEEP_SECTIONS = {"1", "2", "4", "7", "9"}
KEEP_SUBSECTIONS = {"6.2", "6.3", "6.4", "6.5", "10.1", "10.3", "11.1", "11.2", "11.3"}


def _sections(version_b: str) -> list[tuple[str, str]]:
    """Découpe la version B en (numéro, texte) sur les titres « ### N. »."""
    parts = re.split(r"(?m)^(### .*)$", version_b)
    out: list[tuple[str, str]] = []
    for i in range(1, len(parts), 2):
        title, body = parts[i], parts[i + 1]
        m = re.match(r"### (\d+)\.", title)
        out.append((m.group(1) if m else title, title + body))
    return out


def _subsections(text: str, wanted: set[str]) -> str:
    """Garde les sous-parties « **6.2. …** » demandées d'une section."""
    chunks = re.split(r"(?m)^(?=\*\*\d+\.\d+\.)", text)
    head, kept = chunks[0].splitlines()[0], []
    for chunk in chunks[1:]:
        m = re.match(r"\*\*(\d+\.\d+)\.", chunk)
        if m and m.group(1) in wanted:
            kept.append(chunk.rstrip())
    return (head + "\n\n" + "\n\n".join(kept)) if kept else ""


def extract(prompt: str) -> str:
    b = prompt.split("## B. Version complète", 1)[1]
    pieces: list[str] = []
    for number, text in _sections(b):
        if number in KEEP_SECTIONS:
            pieces.append(text.strip())
        elif number.isdigit():
            sub = _subsections(text, KEEP_SUBSECTIONS)
            if sub:
                pieces.append(sub.strip())
        elif "Écarts connus" in number:
            pieces.append(text.strip())
    return "\n\n".join(pieces)


def main(src: Path) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for code, folder in FACULTIES.items():
        prompt = (src / folder / f"01_Prompt_Intro_MM_Resultats_{code}.md").read_text(encoding="utf-8")
        version = re.search(r"Version ([\d.]+ du [\d/]+)", prompt)
        body = extract(prompt)
        header = (f"# RÈGLES DE LA FACULTÉ ({code}) — reprises des prompts de Dr Hamza Ben Kheder, "
                  f"version {version.group(1) if version else '?'}\n\n"
                  "Les règles ci-dessous viennent du prompt écrit pour le poste de Dr Hamza. "
                  "Les RÈGLES DE LA PLATEFORME (plus haut) priment sur elles en cas de conflit : "
                  "calculs, mise en page, numéros, logiciel et format de sortie.\n\n")
        (OUT / f"resultats_{code}.md").write_text(header + body + "\n", encoding="utf-8")
        shutil.copy2(src / folder / f"04_Charte_{code}.json", HAMZA / f"04_Charte_{code}.json")
        print(f"{code} : {len(body) // 1024} Ko")
    shutil.copy2(src / "Fiche_mission_these.json", HAMZA / "Fiche_mission_these.json")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(Path(sys.argv[1]))
