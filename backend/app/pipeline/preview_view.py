"""Aperçu gratuit, tel que l'étudiant le lit : verdict, constats en mots simples, contrôles.

Tout est déterministe (calculé par le code sur le profiling, sans IA). Chaque constat dit
ce qui se passe, pourquoi c'est grave pour la thèse, et en donne une preuve chiffrée ; la
liste ligne par ligne des cases à vérifier reste dans l'audit complet (« verrouillée »).

Règles :
- jamais de nom ni de numéro de dossier (la page gratuite est servie par identifiant
  d'audit) : seulement des nombres, des noms de colonnes et des valeurs non identifiantes
  (999, une année) ;
- un même problème n'est compté qu'une fois (un code 999 n'est pas aussi une « valeur
  extrême ») ;
- le test gratuit ne juge pas ce qu'il ne peut pas voir : les contrôles réservés à l'audit
  complet sont listés à part, sans note.
"""

from __future__ import annotations

from typing import Any

from .report_client_xlsx import DOMAIN_PLAIN
from .summary import copies_view, key_counts

ROUGE, ORANGE, GRIS = "rouge", "orange", "gris"

# Ce que l'audit complet vérifie dans les domaines que le code seul ne peut pas juger.
RESERVED_EXAMPLES = {
    4: "un décès daté avant l'entrée, un score qui ne correspond pas à ses items",
    5: "chaque variable du protocole bien présente dans votre tableau",
    6: "votre critère principal défini, codé et calculable",
    7: "un dictionnaire qui explique chaque colonne et chaque code",
    8: "le bon test statistique pour chaque objectif, avec assez de patients",
}


def _s(n: int, word: str, plural: str | None = None) -> str:
    return f"{n} {word if n == 1 else (plural or word + 's')}"


def _pct(n: int, total: int) -> int:
    return round(100 * n / total) if total else 0


def _fmt(x: Any) -> str:
    if isinstance(x, float):
        return (f"{x:.0f}" if x.is_integer() else f"{x:.1f}").replace(".", ",")
    return str(x)


def _finding(key: str, light: str, title: str, why: str, proof: str = "",
             count: int = 0, unit: str = "case") -> dict[str, Any]:
    """`count` : cases ou lignes à vérifier dans les dossiers ; leur liste précise (ligne,
    colonne) n'est donnée que dans l'audit complet."""
    return {"key": key, "light": light, "title": title, "why": why, "proof": proof,
            "count": count, "unit": unit}


def _identity_findings(p: dict[str, Any], n_rows: int) -> list[dict[str, Any]]:
    s = p["structure"]
    dups = s.get("duplicates") or {}
    out: list[dict[str, Any]] = []
    if not s.get("id_column"):
        out.append(_finding(
            "no_id", ROUGE, "Aucun numéro qui identifie chaque patient",
            "Sans numéro unique, impossible de savoir si un patient a été saisi deux fois, "
            "ni de retrouver son dossier pour vérifier une valeur."))
    # Numéros répétés sur des lignes différentes. Les répétitions sur des lignes
    # identiques sont des doublons stricts, comptés plus bas (une seule fois).
    conflicts = int((dups.get("id_conflicts") or {}).get("n_ids", 0))
    if conflicts:
        extra = max(int(dups.get("duplicate_ids", 0))
                    - int(dups.get("same_id_identical_rows", 0)), conflicts)
        plural = conflicts > 1
        out.append(_finding(
            "duplicate_ids", ROUGE,
            f"{_s(conflicts, 'numéro')} de dossier porté{'s' if plural else ''} par des "
            "patients différents",
            "Même numéro, mais l'âge, les dates ou les résultats ne concordent pas : sans "
            "doute deux patients mélangés. Vos pourcentages sont faux tant que ce n'est pas "
            "démêlé.",
            f"{_s(extra + conflicts, 'ligne')} concernée{'s' if extra + conflicts > 1 else ''}.",
            count=extra + conflicts, unit="ligne"))
    exact = int(dups.get("exact_rows", 0))
    if exact:
        out.append(_finding(
            "exact_rows", ROUGE if _pct(exact, n_rows) > 5 else ORANGE,
            f"{_s(exact, 'ligne')} saisie{'s' if exact > 1 else ''} deux fois à l'identique",
            "Ces patients pèsent double dans tous vos résultats.",
            f"{_pct(exact, n_rows)} % de votre tableau.", count=exact, unit="ligne"))
    copies = int(dups.get("n_suspect_copy_rows", 0))
    if copies:
        view = copies_view(p) or {}
        block = (view.get("blocks") or [{}])[0]
        similar = block.get("min_similarity") or view.get("max_similarity")
        ordinary = view.get("median_similarity")
        if similar and ordinary is not None:
            proof = (f"Une ligne et sa copie ont {round(similar * 100)} % de cases "
                     f"identiques ; deux patients pris au hasard, {round(ordinary * 100)} %.")
        elif view.get("identical_pairs"):
            proof = "Elles ne diffèrent que par le numéro du patient."
        else:
            proof = "Elles sont presque identiques à d'autres lignes du tableau."
        out.append(_finding(
            "copies", ROUGE,
            f"{_s(copies, 'ligne')} qui ressemble{'nt' if copies > 1 else ''} à des copies",
            "Des lignes presque identiques à d'autres, avec un autre numéro. Si ce sont des "
            "copies, votre thèse compte moins de patients que vous ne le pensez.",
            proof, count=copies, unit="ligne"))
    for sec in (dups.get("secondary_id_duplicates") or [])[:1]:
        n = int(sec["n_duplicated"])
        out.append(_finding(
            "secondary_ids", ORANGE,
            f"Un même numéro répété dans « {sec['column']} »",
            "Le même patient a peut-être été inclus deux fois, sous deux numéros "
            "d'inclusion différents.",
            f"{_s(n, 'ligne')} reprend{'nent' if n > 1 else ''} un numéro déjà présent.",
            count=n, unit="ligne"))
    same = dups.get("same_profile_different_ids") or {}
    if same.get("n_groups"):
        keys = ", ".join(f"« {k} »" for k in (same.get("key_columns") or [])[:3])
        n = int(same.get("n_rows") or 0)
        out.append(_finding(
            "same_profile", ORANGE,
            f"{_s(int(same['n_groups']), 'groupe')} de patients qui se ressemblent beaucoup",
            "Des numéros différents, mais les mêmes informations de base : le même patient "
            "saisi deux fois ?",
            f"Mêmes {keys}." if keys else "", count=n, unit="ligne"))
    return out


def _code_label(code: str) -> str:
    """« na » → « NA » ; les codes numériques restent tels quels."""
    return code.upper() if code.isalpha() else code


def _value_findings(p: dict[str, Any]) -> tuple[list[dict[str, Any]], set[str]]:
    """Codes de cases vides, dates impossibles, chiffres en texte. Renvoie aussi les
    colonnes déjà signalées, pour ne pas les recompter en « valeurs extrêmes »."""
    out: list[dict[str, Any]] = []
    flagged: set[str] = set()
    coded = [c for c in p["columns"] if c.get("suspected_missing_codes")]
    if coded:
        def n_codes(c: dict[str, Any]) -> int:
            return int((c.get("missing_code_impact") or {}).get("n", 0))

        first = max(coded, key=n_codes)
        impact = first.get("missing_code_impact") or {}
        by_code = impact.get("by_code") or {}
        # Le code montré est celui qui revient le plus : son nombre est celui affiché.
        code, n_code = (max(by_code.items(), key=lambda kv: kv[1]) if by_code
                        else (_fmt(first["suspected_missing_codes"][0]), 0))
        label = _code_label(str(code))
        proof = f"Dans « {first['name']} », la valeur « {label} »"
        proof += f" revient {n_code} fois." if n_code else " apparaît parmi les réponses."
        continuous = first.get("stat_type_guess") in ("continuous", "discrete")
        if continuous and impact.get("mean_with") is not None \
                and impact.get("mean_without") is not None:
            proof += (" Comptée comme un vrai chiffre, elle fait passer la moyenne de "
                      f"{_fmt(impact['mean_without'])} à {_fmt(impact['mean_with'])}.")
        others = len(coded) - 1
        if others:
            proof += f" Même chose dans {_s(others, 'autre colonne', 'autres colonnes')}."
        shown = label if label.isalnum() else ""
        out.append(_finding(
            "missing_codes", ROUGE,
            (f"Un code comme « {shown} » utilisé à la place d'une case vide" if shown
             else "Un code utilisé à la place d'une case vide"),
            "Le logiciel de statistiques le prend pour une vraie valeur : moyennes, "
            "pourcentages et tests sont faussés sans que rien ne vous alerte.",
            proof, count=sum(n_codes(c) for c in coded)))
        flagged |= {c["name"] for c in coded}

    bad_dates = [d for d in p.get("dates_audit") or [] if d["n_future"] or d["n_before_1900"]]
    if bad_dates:
        n = sum(d["n_future"] + d["n_before_1900"] for d in bad_dates)
        d0 = max(bad_dates, key=lambda d: d["n_future"] + d["n_before_1900"])
        parts = []
        if d0["n_future"]:
            latest = (d0.get("latest_future") or "")[:4]
            parts.append(f"{_s(d0['n_future'], 'date')} dans le futur"
                         + (f" (jusqu'en {latest})" if latest else ""))
        if d0["n_before_1900"]:
            parts.append(f"{_s(d0['n_before_1900'], 'date')} avant 1900")
        proof = f"« {d0['column']} » : {', '.join(parts)}."
        if len(bad_dates) > 1:
            proof += f" Et {_s(len(bad_dates) - 1, 'autre colonne', 'autres colonnes')} de dates."
        out.append(_finding(
            "dates", ORANGE, f"{_s(n, 'date')} impossible{'s' if n > 1 else ''}",
            "Une faute de frappe sur l'année fausse les durées de séjour, les délais et le "
            "suivi.", proof, count=n))

    as_text = [c["name"] for c in p["columns"] if "numeric_stored_as_text" in c["flags"]]
    if as_text:
        out.append(_finding(
            "text_numbers", ORANGE,
            f"Des chiffres enregistrés comme du texte ({_s(len(as_text), 'colonne')})",
            "Le logiciel ne peut pas en calculer la moyenne ni les comparer.",
            "Colonnes : " + ", ".join(f"« {n} »" for n in as_text[:3])
            + (" …" if len(as_text) > 3 else "") + "."))
        flagged |= set(as_text)
    return out, flagged


def _missing_findings(p: dict[str, Any], n_rows: int) -> list[dict[str, Any]]:
    s = p["structure"]
    m = p["missing_summary"]
    empty_cols = set(s.get("empty_columns") or [])
    pct = key_counts(p)["missing_useful_pct"]
    holes = sorted((c for c in p["columns"]
                    if c["name"] not in empty_cols and c["pct_missing"] >= 10),
                   key=lambda c: -c["pct_missing"])
    if pct < 5 and not holes:
        return []
    complete = m.get("complete_cases_useful", m.get("complete_cases"))
    if holes:
        top = holes[0]
        title = (f"« {top['name']} » vide chez {round(top['pct_missing'])} % des patients"
                 if len(holes) == 1 else
                 f"{len(holes)} colonnes souvent vides, dont « {top['name']} » "
                 f"({round(top['pct_missing'])} %)")
        proof = ""
    else:
        title = f"{_fmt(pct)} % de cases vides"
        proof = ""
    if complete is not None:
        # Lignes et non « patients » : le tableau peut contenir des copies ou des lignes
        # vides, et le chiffre des patients est donné plus haut.
        proof = (f"{complete} ligne{'s' if complete > 1 else ''} sur {n_rows} "
                 + ("ont toutes leurs cases remplies." if complete > 1
                    else "a toutes ses cases remplies."))
    return [_finding(
        "missing", ROUGE if pct > 25 else ORANGE, title,
        "Certaines cases sont vides normalement (pas de décès, examen non fait). D'autres "
        "se retrouvent dans le dossier : chacune retrouvée vous rend un patient dans vos "
        "calculs.",
        proof, count=sum(c["n_missing"] for c in holes))]


def _identifier_columns(p: dict[str, Any]) -> set[str]:
    s = p["structure"]
    dups = s.get("duplicates") or {}
    cols = {c["column"] for c in p.get("pii_candidates") or []}
    cols |= {d["column"] for d in dups.get("secondary_id_duplicates") or []}
    if s.get("id_column"):
        cols.add(s["id_column"])
    return cols


def _other_findings(p: dict[str, Any], n_rows: int, flagged: set[str]) -> list[dict[str, Any]]:
    s = p["structure"]
    out: list[dict[str, Any]] = []
    pii = p.get("pii_candidates") or []
    if pii:
        cols = ", ".join(f"« {c['column']} »" for c in pii[:3])
        out.append(_finding(
            "pii", ROUGE, "Des données qui permettent de reconnaître un patient",
            "Noms, téléphones ou numéros de dossier ne doivent pas figurer dans la base de "
            "la thèse. Remplacez-les par un numéro d'inclusion, et gardez la correspondance "
            "à part pour retrouver les dossiers.", f"Colonnes : {cols}."))
    # Jamais de valeur d'une colonne d'identifiant (n° de dossier, téléphone) à l'écran.
    hidden = flagged | _identifier_columns(p)
    extremes = sorted((c for c in p["columns"]
                       if c["name"] not in hidden
                       and c.get("outliers_iqr", {}).get("n", 0) > 0.05 * n_rows),
                      key=lambda c: -c["outliers_iqr"]["n"])
    if extremes:
        n = sum(c["outliers_iqr"]["n"] for c in extremes)
        first = extremes[0]
        stats = first.get("numeric_stats") or {}
        proof = f"« {first['name']} » : {_s(first['outliers_iqr']['n'], 'valeur')} loin des autres"
        if stats.get("max") is not None and stats.get("median") is not None:
            proof += f" (jusqu'à {_fmt(stats['max'])}, pour une valeur habituelle de " \
                     f"{_fmt(stats['median'])})"
        out.append(_finding(
            "extremes", ORANGE, "Des valeurs très éloignées des autres",
            "Erreur de saisie ou vrai cas extrême ? Seul le dossier le dit, et la réponse "
            "change vos moyennes.", proof + ".", count=n, unit="valeur"))
    dead = list(s.get("empty_columns") or []) + list(s.get("constant_columns") or [])
    if dead:
        out.append(_finding(
            "dead_columns", GRIS,
            f"{_s(len(dead), 'colonne')} vide{'s' if len(dead) > 1 else ''} ou toujours "
            "identique" + ("s" if len(dead) > 1 else ""),
            "Elles n'apportent rien à l'analyse : vous pourrez les laisser de côté.",
            "Colonnes : " + ", ".join(f"« {c} »" for c in dead[:3])
            + (" …" if len(dead) > 3 else "") + "."))
    return out


def _verdict(findings: list[dict[str, Any]], score: int) -> dict[str, str]:
    reds = [f for f in findings if f["light"] == ROUGE]
    oranges = [f for f in findings if f["light"] == ORANGE]
    n = len(reds) + len(oranges)
    if reds:
        urgent = ("tous urgents" if len(reds) == n and n > 1
                  else f"dont {_s(len(reds), 'urgent')}")
        return {"light": ROUGE, "title": "Votre base n'est pas encore prête pour l'analyse.",
                "text": f"Nous avons trouvé {_s(n, 'problème')}, {urgent} à corriger avant "
                        "toute statistique. Bonne nouvelle : cela se corrige, et l'audit "
                        "complet vous dit où chercher."}
    if oranges or score < 70:
        text = (f"{_s(n, 'point')} à vérifier, rien de bloquant à première vue. "
                if n else "Rien de grave à première vue. Votre note reste moyenne car une partie "
                "des contrôles n'est faite que dans l'audit complet. ")
        return {"light": ORANGE, "title": "Votre base est presque prête.",
                "text": text + "L'audit complet vérifie si elle répond bien à votre "
                               "protocole."}
    return {"light": "vert", "title": "Votre base est en bon état.",
            "text": "Le test gratuit ne trouve rien de grave. L'audit complet vérifie ce "
                    "qu'il ne peut pas voir : votre protocole et votre critère principal."}


def _checks(score_detail: dict[str, Any]) -> dict[str, Any]:
    """Nombre de contrôles faits par le code, et contrôles réservés à l'audit complet.

    Pas de note par domaine dans l'aperçu : un domaine y mêle des points jugés par le code
    et des points réservés (comptés pour moitié en attendant), ce qui afficherait un
    « 11/11 » à côté d'un doublon signalé. Les constats portent le fond ; ici, on dit
    seulement ce qui a été vérifié et ce qui reste à vérifier."""
    reserved, n_done, n_reserved = [], 0, 0
    for d in score_detail.get("domaines") or []:
        crits = d.get("criteres") or []
        n_open = sum(1 for c in crits if c.get("inevaluable"))
        n_done += len(crits) - n_open
        n_reserved += n_open
        if d["domaine"] in RESERVED_EXAMPLES and n_open:
            reserved.append({"name": DOMAIN_PLAIN.get(d["domaine"], d["nom"]),
                             "example": RESERVED_EXAMPLES[d["domaine"]]})
    return {"reserved": reserved, "n_done": n_done, "n_reserved": n_reserved}


def preview_view(profiling: dict[str, Any], score_detail: dict[str, Any]) -> dict[str, Any]:
    n_rows = int(profiling["structure"]["n_rows"])
    values, flagged = _value_findings(profiling)
    findings = (_identity_findings(profiling, n_rows) + values
                + _missing_findings(profiling, n_rows)
                + _other_findings(profiling, n_rows, flagged))
    order = {ROUGE: 0, ORANGE: 1, GRIS: 2}
    findings.sort(key=lambda f: order[f["light"]])
    score = round(float(score_detail.get("score_final") or 0))
    return {
        "verdict": _verdict(findings, score),
        "score": score,
        "findings": findings,
        "to_check": sum(f["count"] for f in findings),
        "checks": _checks(score_detail),
    }
