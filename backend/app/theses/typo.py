"""Typographie française des thèses (charte commune des quatre facultés, § 12.6 de Hamza).

Espace insécable avant « : ; ? ! % », dans « n = 30 », « p = 0,032 », « IC 95 % », entre
« Tableau »/« Figure » et leur numéro ; intervalles au tiret demi-cadratin « [2–36] » ;
apostrophe typographique. Appliquée par le rendu Word à tout le texte, pour que ni l'IA
ni le code n'aient à y penser.
"""

from __future__ import annotations

import re

NBSP = " "

_ROMAN = ((1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"),
          (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"))


def roman(n: int) -> str:
    """4 → « IV »."""
    if n <= 0:
        raise ValueError("un numéro romain est positif")
    out = []
    for value, letters in _ROMAN:
        while n >= value:
            out.append(letters)
            n -= value
    return "".join(out)


_BEFORE_PUNCT = re.compile(r"[ \u00a0\u202f]*([:;?!%])")
_EQUAL = re.compile(r"\b([npNr]|OR|ORa|HR|ASC)[  ]*([=<>≤≥])[  ]*(?=[\d−-])")
_IC = re.compile(r"\bIC[  ]*95[  ]*%")
_LABEL_NUM = re.compile(r"\b(Tableau|Figure|Tableaux|Figures|Table)[  ]+(?=[IVXLC\d])")
_INTERVAL = re.compile(r"\[(\s*[−-]?\d[\d,  ]*?)\s*[−–-]\s*([−-]?\d[\d,  ]*?)\s*\]")
_GUILLEMETS_OPEN = re.compile(r"«[  ]*")
_GUILLEMETS_CLOSE = re.compile(r"[  ]*»")
_SPACES = re.compile(r"[ ]{2,}")
_URL = re.compile(r"https?://\S+|doi:\S+", re.IGNORECASE)


def _punct(match: re.Match[str]) -> str:
    sign = match.group(1)
    start = match.start()
    text = match.string
    # Pas d'espace dans « 10:30 », « http: », ni avant un « % » collé dans un mot.
    if start > 0 and text[start - 1].isdigit() and sign == ":" and match.group(0) == ":":
        return sign
    if start == 0 or text[start - 1] in "\n([{":
        return sign
    return NBSP + sign


def fr_typo(text: str) -> str:
    """Applique la typographie française à un texte courant (idempotent)."""
    if not text:
        return text
    # Les URL et DOI ne sont pas touchés.
    protected: list[str] = []

    def keep(m: re.Match[str]) -> str:
        protected.append(m.group(0))
        return f"\x00{len(protected) - 1}\x00"

    t = _URL.sub(keep, text)
    t = t.replace("'", "’")
    t = _SPACES.sub(" ", t)
    t = _INTERVAL.sub(lambda m: f"[{m.group(1).strip()}–{m.group(2).strip()}]", t)
    t = _BEFORE_PUNCT.sub(_punct, t)
    t = _EQUAL.sub(lambda m: f"{m.group(1)}{NBSP}{m.group(2)}{NBSP}", t)
    t = _IC.sub(f"IC{NBSP}95{NBSP}%", t)
    t = _LABEL_NUM.sub(lambda m: m.group(1) + NBSP, t)
    t = _GUILLEMETS_OPEN.sub("«" + NBSP, t)
    t = _GUILLEMETS_CLOSE.sub(NBSP + "»", t)
    return re.sub(r"\x00(\d+)\x00", lambda m: protected[int(m.group(1))], t)


def en_typo(text: str) -> str:
    """Anglais : intervalles au tiret demi-cadratin et apostrophe typographique."""
    if not text:
        return text
    t = _SPACES.sub(" ", text.replace("'", "’"))
    return _INTERVAL.sub(lambda m: f"[{m.group(1).strip()}–{m.group(2).strip()}]", t)
