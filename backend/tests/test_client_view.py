"""Bilan client v3 de Hamza : numéros de ligne, jeu des différences, missions, masquage
des numéros de dossier. Déterministe, sans API."""

import pandas as pd

from app.pipeline.client_view import fill_checklist_lines, lines_label, twin_example
from app.pipeline.llm2 import ChecklistItem, Llm2Output, sync_missions
from app.pipeline.profile import profile
from app.pipeline.student_text import redact_output, tidy_output

N = 12


def _base() -> pd.DataFrame:
    """12 patients distincts ; les patients 9 à 11 recopient les patients 1 à 3."""
    df = pd.DataFrame({
        "Numéro d'inclusion": list(range(1, N + 1)),
        "Numéro de dossier": [f"{100 + i}/2026" for i in range(N)],
        "age": [30.0 + 3 * i for i in range(N)],
        "sexe": ["H", "F", "H", "H", "F", "F", "H", "F", "H", "F", "H", "F"],
        "mecanisme": ["AVP", "Chute", "Rixe", "AVP", "Chute", "AVP",
                      "Rixe", "AVP", "Chute", "AVP", "Rixe", "Chute"],
        "gcs": [15.0, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
        "pas": [100.0 + 5 * i for i in range(N)],
        "admission": pd.date_range("2024-01-01", periods=N, freq="11D"),
    })
    cols = [c for c in df.columns if c != "Numéro d'inclusion"]
    df.loc[8:10, cols] = df.loc[0:2, cols].to_numpy()
    return df


def _profiling(df: pd.DataFrame, fmt: str = "xlsx") -> dict:
    return profile(df, {"file_name": f"t.{fmt}", "format": fmt})


def test_numeros_de_ligne_du_fichier():
    prof = _profiling(_base())
    assert lines_label([0], prof) == "ligne 2"           # ligne 1 = en-têtes
    assert lines_label([0, 1, 2, 8, 9, 10], prof) == "lignes 2 à 4 et 10 à 12"
    assert lines_label([3, 8], prof) == "lignes 5 et 10"
    assert lines_label([3], _profiling(_base(), "sav")) == "cas n° 4"


def test_lignes_ajoutees_a_la_liste_de_verification():
    df = _base()
    items = [ChecklistItem(patients="1 et 9", check="Même patient ?", row_ids=["1", "9"]),
             ChecklistItem(patients="99", check="?", row_ids=["99"])]
    fill_checklist_lines(items, df, _profiling(df))
    assert items[0].lignes == "lignes 2 et 10"
    assert items[1].lignes == ""                          # identifiant inconnu : rien d'inventé


def test_jeu_des_differences_sans_donnee_identifiante():
    df = _base()
    twin = twin_example(df, _profiling(df))
    assert twin is not None
    assert twin["columns"][0] == "Numéro d'inclusion"
    assert "Numéro de dossier" not in twin["columns"] and "admission" not in twin["columns"]
    labels = [r["label"] for r in twin["rows"]]
    assert labels == ["Ligne 2 (inclusion n° 1)", "Ligne 10 (inclusion n° 9)"]
    assert twin["rows"][0]["values"][1:] == twin["rows"][1]["values"][1:]
    assert twin["answer"].startswith("Seul le numéro d'inclusion change")
    assert not any("/2026" in v for r in twin["rows"] for v in r["values"])


def test_pas_de_jeu_sans_lignes_recopiees():
    df = _base().drop(index=[8, 9, 10]).reset_index(drop=True)
    assert twin_example(df, _profiling(df)) is None


def _mission(feu: str, title: str) -> dict:
    return {"feu": feu, "title": title, "vu": "Vu.", "pourquoi": "Parce que.",
            "a_faire": ["Ouvrir le dossier."], "refs": ["4 ↔ 34"]}


def test_missions_rouges_d_abord_et_points_bloquants_derives():
    out = Llm2Output.model_validate({"missions": [
        _mission("orange", "Neuf points à confirmer"), _mission("rouge", "Des doublons ?"),
        _mission("ROUGE", "Qu'appelle-t-on un succès ?"), *[_mission("orange", f"M{i}")
                                                        for i in range(4)]]})
    tidy_output(out)
    sync_missions(out)
    assert len(out.missions) == 5
    assert [m.feu for m in out.missions[:3]] == ["rouge", "rouge", "orange"]
    assert [b.title for b in out.blocking_points] == ["Des doublons ?",
                                                      "Qu'appelle-t-on un succès ?"]
    assert out.blocking_points[0].todo == "Ouvrir le dossier."


def test_anciens_audits_sans_missions_inchanges():
    out = Llm2Output.model_validate({"blocking_points": [{"title": "Ancien"}]})
    sync_missions(out)
    assert [b.title for b in out.blocking_points] == ["Ancien"]


def test_numero_de_dossier_masque_meme_hors_colonne_identifiante():
    out = Llm2Output.model_validate({"missions": [
        {"feu": "rouge", "title": "Même dossier", "vu": "L'inclusion 27 porte le 220/2026.",
         "a_faire": ["Vérifier le 12/2026 et le 204/2026"]}]})
    redact_output(out, set())
    assert out.missions[0].vu == "L'inclusion 27 porte le [masqué]."
    assert out.missions[0].a_faire == ["Vérifier le 12/2026 et le [masqué]"]  # mois/année intact


def test_decisions_a_choix_avec_consequences():
    out = Llm2Output.model_validate({"client_decisions": [{
        "question_fr": "Garder les patients hors critères ?",
        "choices": [{"label": "Les garder", "consequence": "Écarts signalés dans les limites."},
                    {"label": "Les exclure", "consequence": "Ils apparaîtront dans le flux."}]}]})
    tidy_output(out)
    assert [c.label for c in out.client_decisions[0].choices] == ["Les garder", "Les exclure"]


def test_numeros_de_dossier_masques_a_la_lecture_des_anciens_audits():
    from app.pipeline.student_text import mask_dossier_numbers
    old = {"client_decisions": [{"question_fr": "Même numéro de dossier 220/2026 ?",
                                 "options": ["oui"]}], "score": 59}
    assert mask_dossier_numbers(old) == {
        "client_decisions": [{"question_fr": "Même numéro de dossier [masqué] ?",
                              "options": ["oui"]}], "score": 59}
