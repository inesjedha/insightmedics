"""Tests du pipeline d'audit : une mini-base aux défauts connus doit les déclencher tous."""

import io
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.pipeline.ingest import IngestError, ingest
from app.pipeline.runner import run_audit


@pytest.fixture()
def dirty_csv(tmp_path: Path) -> Path:
    """Base volontairement sale : doublon strict, doublon d'ID, code 999,
    colonne vide, colonne constante, valeur extrême, PII téléphone."""
    df = pd.DataFrame({
        "matricule": ["P1", "P2", "P3", "P3", "P4", "P4"],
        "age": [34, 45, 999, 999, 51, 51],
        "poids": [70, 82, 65, 65, 400, 400],       # 400 kg = outlier
        "centre": ["Tunis"] * 6,                    # constante
        "commentaire": [None] * 6,                  # vide
        "tel_patient": ["+21620304050"] * 6,        # PII
        "crp": [12.0, None, 8.0, 8.0, None, None],  # manquants
    })
    # P4 dupliqué strictement, P3 dupliqué aussi
    p = tmp_path / "dirty.csv"
    df.to_csv(p, index=False)
    return p


def test_run_audit_detecte_les_defauts(dirty_csv: Path):
    r = run_audit(dirty_csv, "dirty.csv")
    p = r["profiling"]
    s = p["structure"]

    assert r["row_count"] == 6 and r["column_count"] == 7
    assert s["id_column"] == "matricule"
    assert s["duplicates"]["exact_rows"] >= 2          # lignes dupliquées
    assert s["duplicates"]["duplicate_ids"] >= 1       # ID en double
    assert "commentaire" in s["empty_columns"]
    assert "centre" in s["constant_columns"]

    age = next(c for c in p["columns"] if c["name"] == "age")
    assert 999 in age["suspected_missing_codes"]

    assert any(c["column"] == "tel_patient" for c in p["pii_candidates"])
    assert 0 <= r["score"] <= 100
    assert any(i["level"] == "critical" for i in r["issues"])


def test_ingest_refuse_les_formats_inconnus(tmp_path: Path):
    bad = tmp_path / "donnees.txt"
    bad.write_text("bonjour")
    with pytest.raises(IngestError):
        ingest(bad)


def test_api_upload_et_lecture(dirty_csv: Path):
    client = TestClient(app)
    with open(dirty_csv, "rb") as f:
        resp = client.post("/audit/upload", files={"file": ("dirty.csv", f, "text/csv")})
    assert resp.status_code == 200
    body = resp.json()
    assert body["rowCount"] == 6
    assert body["needsHumanReview"] is True            # anomalies critiques présentes

    audit_id = body["id"]
    assert client.get(f"/audit/{audit_id}").status_code == 200
    events = client.get(f"/audit/{audit_id}/events").json()
    assert any("Parsing OK" in e["message"] for e in events)


def test_api_refuse_mauvais_format():
    client = TestClient(app)
    resp = client.post("/audit/upload",
                       files={"file": ("x.txt", io.BytesIO(b"abc"), "text/plain")})
    assert resp.status_code == 415
