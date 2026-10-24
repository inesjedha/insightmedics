"""Purge des audits expirés : fichiers supprimés, données patients effacées, résumé gardé."""

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import SessionLocal
from app.main import app
from app.models import Audit
from app.services.retention import purge_expired


@pytest.fixture()
def uploaded_audit_id(tmp_path: Path) -> str:
    p = tmp_path / "base.csv"
    pd.DataFrame({"matricule": ["P1", "P2", "P3"], "age": [30, 40, 50]}).to_csv(p, index=False)
    with open(p, "rb") as f:
        resp = TestClient(app).post("/audit/upload", files={"file": ("base.csv", f, "text/csv")})
    return resp.json()["id"]


def _in_days(days: int) -> datetime:
    return datetime.now(UTC) + timedelta(days=days)


def test_audit_non_expire_conserve(uploaded_audit_id: str):
    with SessionLocal() as db:
        purge_expired(db)
        audit = db.get(Audit, uploaded_audit_id)
        assert audit.purged_at is None and audit.profiling is not None
    assert (settings.storage_dir / uploaded_audit_id).exists()


def test_audit_expire_purge(uploaded_audit_id: str):
    with SessionLocal() as db:
        purge_expired(db, now=_in_days(settings.file_retention_days + 1))
        audit = db.get(Audit, uploaded_audit_id)
        assert audit.purged_at is not None
        assert audit.profiling is None and audit.ai_audit is None   # identifiants de lignes
        assert audit.score is not None and audit.file_name == "base.csv"  # résumé gardé
    assert not (settings.storage_dir / uploaded_audit_id).exists()


def test_purge_idempotente(uploaded_audit_id: str):
    later = _in_days(settings.file_retention_days + 1)
    with SessionLocal() as db:
        purge_expired(db, now=later)
        first = db.get(Audit, uploaded_audit_id).purged_at
        purge_expired(db, now=later)
        assert db.get(Audit, uploaded_audit_id).purged_at == first


def test_audit_purge_ne_peut_plus_etre_debloque(uploaded_audit_id: str, admin_headers):
    with SessionLocal() as db:
        purge_expired(db, now=_in_days(settings.file_retention_days + 1))
    client = TestClient(app)
    assert client.post(f"/audit/{uploaded_audit_id}/unlock", headers=admin_headers).status_code == 410
    listed = client.get("/audit", headers=admin_headers).json()
    assert next(a for a in listed if a["id"] == uploaded_audit_id)["purged"] is True


def test_dossier_orphelin_ancien_supprime():
    orphan = settings.storage_dir / "audit_orphelin"
    orphan.mkdir(parents=True, exist_ok=True)
    with SessionLocal() as db:
        report = purge_expired(db, now=_in_days(settings.file_retention_days + 1))
    assert report.orphan_dirs >= 1 and not orphan.exists()


def test_demarrage_et_arret_du_serveur():
    """Le lifespan (schéma, reprise, purge planifiée) démarre et s'arrête proprement."""
    with TestClient(app) as client:
        assert client.get("/health").status_code == 200
