"""Tests P3 — authentification admin + déblocage d'audit.

Vérifie que le CRM et le déblocage sont protégés par la clé admin, que la création de
lead reste publique, et que le déblocage lance l'audit complet (statut done + payé).
"""

import secrets
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
    payload = {"id": f"lead_{secrets.token_hex(4)}", "createdAt": "2026-01-01T00:00:00",
               "email": "thesard@example.com"}
    assert client.post("/leads", json=payload).status_code == 200  # pas de clé requise


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
    r = client.post(f"/audit/{aid}/unlock", headers=HEADERS)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "done" and body["paid"] is True and body["isPreview"] is False


def test_liste_audits_admin(small_csv: Path):
    client = TestClient(app)
    with open(small_csv, "rb") as f:
        client.post("/audit/upload", files={"file": ("base.csv", f, "text/csv")})
    assert client.get("/audit").status_code == 401
    r = client.get("/audit", headers=HEADERS)
    assert r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) >= 1
