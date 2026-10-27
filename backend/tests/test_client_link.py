"""P4 — accès client via lien privé (/r/{token}) : gating paiement + expiration."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models import Audit, utcnow_iso

client = TestClient(app)


def _mk(token: str, *, paid: bool, status: str, expires_at: str | None) -> None:
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
        expires_at=(datetime.now(UTC) + timedelta(days=10)).isoformat())
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
        expires_at=(datetime.now(UTC) - timedelta(days=1)).isoformat())
    assert client.get("/r/tokexpire").status_code == 410


def test_client_ne_recoit_que_le_classeur():
    """Décision du 27/10/2026 : la base nettoyée est remise avec l'analyse statistique,
    pas avec l'audit ; le rapport Word reste interne."""
    _mk("toklivrables", paid=True, status="done",
        expires_at=(datetime.now(UTC) + timedelta(days=10)).isoformat())
    for kind in ("base_analyse.csv", "base_analyse.sav", "report.docx"):
        assert client.get(f"/r/toklivrables/{kind}").status_code == 404, kind


def test_resultat_expose_patients_et_lignes_en_double():
    _mk("tokchiffres", paid=True, status="done",
        expires_at=(datetime.now(UTC) + timedelta(days=10)).isoformat())
    db = SessionLocal()
    audit = db.get(Audit, "audit_tokchiffres")
    audit.profiling = {"structure": {"n_rows": 51, "template_rows": {"n": 1},
                                     "duplicates": {"exact_rows": 0, "n_suspect_copy_rows": 14}}}
    db.commit()
    db.close()
    body = client.get("/r/tokchiffres").json()
    assert body["patientCount"] == 50 and body["duplicatedRows"] == 14
