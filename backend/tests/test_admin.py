"""Tests P3 — authentification admin + déblocage d'audit.

Vérifie que le CRM et le déblocage sont protégés par la clé admin, que la création de
lead reste publique, et que le déblocage lance l'audit complet (statut done + payé).
"""

from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

ADMIN = "cle-admin-de-test"
HEADERS = {"X-Admin-Key": ADMIN}


@pytest.fixture(autouse=True)
def _set_admin_key():
    old = settings.admin_api_key
    settings.admin_api_key = ADMIN
    yield
    settings.admin_api_key = old


@pytest.fixture()
def small_csv(tmp_path: Path) -> Path:
    p = tmp_path / "base.csv"
    pd.DataFrame({"matricule": ["P1", "P2", "P3"], "age": [30, 40, 50]}).to_csv(p, index=False)
    return p


def test_lecture_leads_exige_la_cle_admin():
    client = TestClient(app)
    assert client.get("/leads").status_code == 401
    assert client.get("/leads", headers={"X-Admin-Key": "mauvaise"}).status_code == 401
    assert client.get("/leads", headers=HEADERS).status_code == 200


def test_creation_lead_reste_publique():
    client = TestClient(app)
    r = client.post("/leads", json={"email": "thesard@example.com"})  # pas de clé requise
    assert r.status_code == 201
    body = r.json()
    assert body["id"].startswith("lead_") and body["status"] == "new"


def test_creation_lead_ignore_les_champs_reserves_au_serveur():
    """Un formulaire public ne peut pas fixer statut, priorité ni notes CRM."""
    client = TestClient(app)
    r = client.post("/leads", json={"email": "x@example.com", "status": "won",
                                    "priority": "high", "notes": "VIP"})
    body = r.json()
    assert body["status"] == "new" and body["priority"] == "normal" and body["notes"] is None


def test_lead_d_audit_herite_score_et_priorite_de_l_audit(small_csv: Path):
    client = TestClient(app)
    with open(small_csv, "rb") as f:
        audit = client.post("/audit/upload", files={"file": ("base.csv", f, "text/csv")}).json()
    lead = client.post("/leads", json={"email": "x@example.com", "source": "audit",
                                       "auditId": audit["id"]}).json()
    assert lead["auditScore"] == audit["score"]
    assert lead["priority"] == ("high" if audit["needsHumanReview"] else "normal")


def test_profiling_est_protege(small_csv: Path):
    client = TestClient(app)
    with open(small_csv, "rb") as f:
        aid = client.post("/audit/upload", files={"file": ("base.csv", f, "text/csv")}).json()["id"]
    assert client.get(f"/audit/{aid}/profiling").status_code == 401
    assert client.get(f"/audit/{aid}/profiling", headers=HEADERS).status_code == 200


def test_unlock_lance_l_audit_complet(small_csv: Path):
    client = TestClient(app)
    with open(small_csv, "rb") as f:
        up = client.post("/audit/upload", files={"file": ("base.csv", f, "text/csv")}).json()
    aid = up["id"]
    assert up["status"] == "preview" and up["paid"] is False

    assert client.post(f"/audit/{aid}/unlock").status_code == 401  # protégé

    # Réponse immédiate : l'audit IA part en tâche de fond.
    r = client.post(f"/audit/{aid}/unlock", headers=HEADERS)
    assert r.status_code == 202 and r.json()["status"] == "processing"

    # (TestClient exécute la tâche de fond avant de rendre la main.)
    done = _admin_audit(client, aid)
    assert done["status"] == "done" and done["paid"] is True and done["isPreview"] is False

    # Second appel : déjà terminé → 200, aucun nouvel audit IA.
    again = client.post(f"/audit/{aid}/unlock", headers=HEADERS)
    assert again.status_code == 200 and again.json()["status"] == "done"


def _admin_audit(client: TestClient, audit_id: str) -> dict:
    listed = client.get("/audit", headers=HEADERS).json()
    return next(a for a in listed if a["id"] == audit_id)


def test_unlock_en_echec_est_visible_et_relancable(small_csv: Path, monkeypatch):
    from app.services import audits as service

    def boom(*_args, **_kwargs):
        raise RuntimeError("quota IA dépassé")

    client = TestClient(app)
    with open(small_csv, "rb") as f:
        aid = client.post("/audit/upload", files={"file": ("base.csv", f, "text/csv")}).json()["id"]
    monkeypatch.setattr(service, "run_audit", boom)
    client.post(f"/audit/{aid}/unlock", headers=HEADERS)
    failed = _admin_audit(client, aid)
    assert failed["status"] == "failed" and "quota" in failed["error"]

    monkeypatch.undo()  # l'IA refonctionne : on relance
    assert client.post(f"/audit/{aid}/unlock", headers=HEADERS).status_code == 202
    assert _admin_audit(client, aid)["status"] == "done"


def test_audit_interrompu_par_un_redemarrage_est_remis_en_apercu(small_csv: Path):
    from app.db import SessionLocal
    from app.models import Audit
    from app.services.audits import recover_interrupted

    client = TestClient(app)
    with open(small_csv, "rb") as f:
        aid = client.post("/audit/upload", files={"file": ("base.csv", f, "text/csv")}).json()["id"]
    with SessionLocal() as db:
        db.get(Audit, aid).status = "processing"
        db.commit()
        assert recover_interrupted(db) >= 1
        assert db.get(Audit, aid).status == "preview"


def test_liste_audits_admin(small_csv: Path):
    client = TestClient(app)
    with open(small_csv, "rb") as f:
        client.post("/audit/upload", files={"file": ("base.csv", f, "text/csv")})
    assert client.get("/audit").status_code == 401
    r = client.get("/audit", headers=HEADERS)
    assert r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) >= 1
