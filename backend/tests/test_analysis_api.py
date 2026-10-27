"""Chaîne Analyses + résultats de bout en bout par l'API admin, sans IA (plan écrit à la
main, texte non rédigé) : commande, base corrigée, contre-audit, plan, calculs,
livrables, livraison sur le lien privé."""

import io
from datetime import UTC, datetime, timedelta

import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models import Audit, utcnow_iso

client = TestClient(app)
RNG = np.random.default_rng(3)


def _audit(token: str) -> str:
    db = SessionLocal()
    audit_id = f"audit_{token}"
    db.query(Audit).filter(Audit.id == audit_id).delete()
    db.add(Audit(id=audit_id, file_name="these.xlsx", file_size=1, stored_path="/x",
                 started_at=utcnow_iso(), status="done", token=token, paid=True,
                 expires_at=(datetime.now(UTC) + timedelta(days=2)).isoformat(),
                 score=61.0, row_count=40, column_count=4, missing_pct=0.0,
                 duplicates_pct=0.0, issues=[], needs_human_review=False,
                 score_detail={"score_final": 61},
                 profiling={"structure": {"n_rows": 40}, "columns": []},
                 ai_audit={"assessment": {"checklist": [
                     {"patients": "3", "row_ids": ["3"], "colonne": "Volume", "valeur": "9999",
                      "check": "Valeur exacte ?"}]}}))
    db.commit()
    db.close()
    return audit_id


def _csv() -> bytes:
    df = pd.DataFrame({"Numéro": range(1, 41),
                       "Groupe": ["A", "B"] * 20,
                       "Volume": RNG.normal(600, 80, 40).round(),
                       "Succès": RNG.choice(["OUI", "NON"], 40, p=[0.7, 0.3])})
    return df.to_csv(index=False).encode()


PLAN = {"title": "Test", "derived": [
            {"name": "succes", "kind": "recode", "type": "categorical", "source": "Succès",
             "mapping": {"OUI": "Oui", "NON": "Non"}}],
        "groups": {"variable": "Groupe"},
        "analyses": [
            {"kind": "proportion", "id": "p", "title": "Succès", "variable": "succes",
             "event": "Oui", "event_label": "Succès"},
            {"kind": "compare", "id": "c", "title": "Volume selon le groupe",
             "variables": [{"name": "Volume", "label": "Volume (mL)", "type": "quantitative"}]}],
        "primary": "p"}


def test_chaine_complete_sans_ia(admin_headers):
    audit_id = _audit("tokanalyse")
    h = admin_headers
    assert client.post(f"/audit/{audit_id}/analysis").status_code == 401  # admin seulement
    a = client.post(f"/audit/{audit_id}/analysis", headers=h).json()
    assert a["status"] == "awaiting_base" and a["auditToken"] == "tokanalyse"
    again = client.post(f"/audit/{audit_id}/analysis", headers=h).json()
    assert again["id"] == a["id"]                                  # idempotent
    aid = a["id"]

    # Avant la base : ni plan ni calcul
    assert client.post(f"/analyses/{aid}/plan/generate", headers=h).status_code == 409
    r = client.post(f"/analyses/{aid}/base", headers=h,
                    files={"file": ("corrigee.csv", io.BytesIO(_csv()), "text/csv")})
    assert r.status_code == 200 and r.json()["fileName"] == "corrigee.csv"
    client.put(f"/analyses/{aid}/instructions", headers=h,
               json={"text": "Succès = OUI dans la colonne Succès (validé par le directeur)."})

    # Plan IA : sans clé, contre-audit fait et plan à écrire à la main
    r = client.post(f"/analyses/{aid}/plan/generate", headers=h)
    assert r.status_code == 202
    a = client.get(f"/analyses/{aid}", headers=h).json()
    assert a["status"] == "awaiting_base" and "à la main" in a["error"]
    assert a["recheck"]["checked_values"][0]["statut"] == "modifiée"   # 9999 corrigé

    bad = client.put(f"/analyses/{aid}/plan", headers=h, json={**PLAN, "primary": "zz"})
    assert bad.status_code == 409 and "absente" in bad.json()["detail"]
    a = client.put(f"/analyses/{aid}/plan", headers=h, json=PLAN).json()
    assert a["status"] == "plan_ready"

    # Livraison impossible avant relecture ; calculs (texte non rédigé sans IA)
    assert client.post(f"/analyses/{aid}/deliver", headers=h).status_code == 409
    assert client.post(f"/analyses/{aid}/compute", headers=h).status_code == 202
    a = client.get(f"/analyses/{aid}", headers=h).json()
    assert a["status"] == "review" and a["results"][0]["id"] == "p"
    assert a["flow"][-1]["n"] == 40
    for kind in ("resultats.docx", "resultats.xlsx"):
        f = client.get(f"/analyses/{aid}/{kind}", headers=h)
        assert f.status_code == 200 and len(f.content) > 1000, kind

    # Le client ne voit rien avant la livraison, puis ses deux fichiers
    assert client.get("/r/tokanalyse/analysis").status_code == 404
    assert client.get("/r/tokanalyse/analysis/resultats.docx").status_code == 404
    a = client.post(f"/analyses/{aid}/deliver", headers=h).json()
    assert a["status"] == "delivered"
    body = client.get("/r/tokanalyse/analysis").json()
    assert body["files"] == ["resultats.docx", "resultats.xlsx"]
    assert client.get("/r/tokanalyse/analysis/resultats.xlsx").status_code == 200
    assert client.get("/r/tokanalyse/analysis/autre.txt").status_code == 404
    listing = client.get("/analyses", headers=h).json()
    assert any(x["id"] == aid and x["auditFileName"] == "these.xlsx" for x in listing)


def test_commande_refusee_sur_un_apercu(admin_headers):
    db = SessionLocal()
    db.query(Audit).filter(Audit.id == "audit_tokapercu2").delete()
    db.add(Audit(id="audit_tokapercu2", file_name="b.xlsx", file_size=1, stored_path="/x",
                 started_at=utcnow_iso(), status="preview", token=None, paid=False))
    db.commit()
    db.close()
    r = client.post("/audit/audit_tokapercu2/analysis", headers=admin_headers)
    assert r.status_code == 409
