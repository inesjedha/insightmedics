"""P4 — accès client via lien privé (/r/{token}) : gating paiement + expiration."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.db import Base, engine, SessionLocal
from app.main import app
from app.models import Audit, utcnow_iso

client = TestClient(app)


def _mk(token: str, *, paid: bool, status: str, expires_at: str | None) -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    db.query(Audit).filter(Audit.id == f"audit_{token}").delete()
    db.commit()
    db.add(Audit(
        id=f"audit_{token}", file_name="these.sav", file_size=1, stored_path="/x",
        started_at=utcnow_iso(), status=status, token=token, paid=paid,
        expires_at=expires_at, score=61.0, row_count=10, column_count=3,
        missing_pct=1.0, duplicates_pct=0.0, issues=[], needs_human_review=False,
        score_detail={"score_final": 61}, ai_audit={"assessment": {"findings": []}},
    ))
    db.commit()
    db.close()


def test_lien_valide_paye():
    _mk("tokvalide", paid=True, status="done",
        expires_at=(datetime.now(timezone.utc) + timedelta(days=10)).isoformat())
    r = client.get("/r/tokvalide")
    assert r.status_code == 200
    assert r.json()["paid"] is True
    assert client.get("/r/tokvalide/score").status_code == 200
    assert client.get("/r/tokvalide/assessment").status_code == 200


def test_lien_inexistant():
    assert client.get("/r/nexistepas").status_code == 404


def test_lien_non_paye_refuse():
    _mk("tokapercu", paid=False, status="preview", expires_at=None)
    assert client.get("/r/tokapercu").status_code == 404


def test_lien_expire():
    _mk("tokexpire", paid=True, status="done",
        expires_at=(datetime.now(timezone.utc) - timedelta(days=1)).isoformat())
    assert client.get("/r/tokexpire").status_code == 410
