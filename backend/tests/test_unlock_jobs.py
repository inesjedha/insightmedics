"""Audit IA en tâche de fond : jamais deux exécutions payantes, jamais bloqué à vie.

Scénarios issus de la relecture : double clic, deux instances du serveur côte à côte
pendant un déploiement, serveur arrêté en plein audit, base qui décroche à la fin.
"""

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import SessionLocal
from app.main import app
from app.models import Audit
from app.services import unlock_jobs
from app.services.retention import purge_expired


@pytest.fixture()
def audit_id(tmp_path: Path) -> str:
    p = tmp_path / "base.csv"
    pd.DataFrame({"matricule": ["P1", "P2", "P3"], "age": [30, 40, 50]}).to_csv(p, index=False)
    with open(p, "rb") as f:
        return TestClient(app).post(
            "/audit/upload", files={"file": ("base.csv", f, "text/csv")}).json()["id"]


@pytest.fixture()
def ai_calls(monkeypatch) -> list[str]:
    """Remplace l'audit IA par un faux qui compte ses appels (chaque appel = argent)."""
    calls: list[str] = []
    real = unlock_jobs.run_audit

    def counting(path, name, protocol):
        calls.append(name)
        return real(path, name, protocol)  # sans clé IA : pipeline déterministe seul

    monkeypatch.setattr(unlock_jobs, "run_audit", counting)
    return calls


def _claim(audit_id: str) -> str | None:
    with SessionLocal() as db:
        return unlock_jobs.claim(db, db.get(Audit, audit_id))


def _status(audit_id: str) -> Audit:
    with SessionLocal() as db:
        audit = db.get(Audit, audit_id)
        db.expunge(audit)
        return audit


def test_deux_reservations_simultanees_une_seule_gagne(audit_id: str):
    first, second = _claim(audit_id), _claim(audit_id)
    assert first is not None and second is None


def test_double_clic_un_seul_audit_ia(audit_id: str, ai_calls, admin_headers):
    client = TestClient(app)
    assert client.post(f"/audit/{audit_id}/unlock", headers=admin_headers).status_code == 202
    assert client.post(f"/audit/{audit_id}/unlock", headers=admin_headers).status_code == 200
    assert len(ai_calls) == 1 and _status(audit_id).status == "done"


def test_deploiement_le_bail_frais_n_est_pas_libere(audit_id: str):
    """Nouvelle instance qui démarre pendant qu'une autre fait l'audit : rien n'est volé."""
    _claim(audit_id)
    with SessionLocal() as db:
        assert unlock_jobs.release_stale_claims(db) == 0
    assert _status(audit_id).status == "processing"


def test_bail_expire_libere_puis_relancable(audit_id: str, ai_calls):
    job = _claim(audit_id)
    later = datetime.now(UTC) + timedelta(minutes=settings.unlock_lease_minutes + 1)
    with SessionLocal() as db:
        assert unlock_jobs.release_stale_claims(db, now=later) >= 1
    audit = _status(audit_id)
    assert audit.status == "preview" and "interrompu" in audit.error

    # L'ancienne tâche (dépossédée) se réveille : elle ne fait rien, ne coûte rien.
    unlock_jobs.run(audit_id, job)
    assert ai_calls == [] and _status(audit_id).status == "preview"

    # Relance : nouvelle réservation, audit terminé, message d'erreur effacé.
    unlock_jobs.run(audit_id, _claim(audit_id))
    audit = _status(audit_id)
    assert audit.status == "done" and audit.paid and audit.error is None and audit.job_id is None


def test_echec_ia_visible_et_relancable(audit_id: str, monkeypatch, admin_headers):
    def boom(*_args):
        raise RuntimeError("quota IA dépassé")

    monkeypatch.setattr(unlock_jobs, "run_audit", boom)
    client = TestClient(app)
    client.post(f"/audit/{audit_id}/unlock", headers=admin_headers)
    listed = {a["id"]: a for a in client.get("/audit", headers=admin_headers).json()}
    assert listed[audit_id]["status"] == "failed" and "quota" in listed[audit_id]["error"]

    monkeypatch.undo()
    assert client.post(f"/audit/{audit_id}/unlock", headers=admin_headers).status_code == 202
    assert _status(audit_id).status == "done"


def test_base_qui_decroche_a_la_fin_ne_bloque_pas_l_audit(audit_id: str, monkeypatch):
    """Erreur à l'écriture du résultat : l'audit passe en échec au lieu de rester en cours."""
    def broken(_result):
        raise ConnectionError("connexion Postgres perdue")

    monkeypatch.setattr(unlock_jobs, "result_values", broken)
    unlock_jobs.run(audit_id, _claim(audit_id))
    assert _status(audit_id).status == "failed"


def test_purge_ne_touche_pas_un_audit_en_cours(audit_id: str):
    _claim(audit_id)
    with SessionLocal() as db:
        purge_expired(db, now=datetime.now(UTC) + timedelta(days=settings.file_retention_days + 1))
    audit = _status(audit_id)
    assert audit.purged_at is None and Path(audit.stored_path).exists()


def test_audit_livre_purge_30_jours_apres_la_livraison(audit_id: str):
    unlock_jobs.run(audit_id, _claim(audit_id))
    delivered = datetime.now(UTC)
    with SessionLocal() as db:
        purge_expired(db, now=delivered + timedelta(days=settings.file_retention_days - 1))
        assert db.get(Audit, audit_id).purged_at is None      # lien encore valide
        purge_expired(db, now=delivered + timedelta(days=settings.file_retention_days + 1))
        assert db.get(Audit, audit_id).purged_at is not None


def test_apercu_en_echec_ne_peut_pas_etre_debloque(tmp_path: Path, admin_headers):
    bad = tmp_path / "vide.csv"
    bad.write_text("a,b\n")  # en-têtes sans lignes : aperçu impossible
    client = TestClient(app)
    with open(bad, "rb") as f:
        assert client.post("/audit/upload",
                           files={"file": ("vide.csv", f, "text/csv")}).status_code == 422
    failed = next(a for a in client.get("/audit", headers=admin_headers).json()
                  if a["fileName"] == "vide.csv")
    assert client.post(f"/audit/{failed['id']}/unlock", headers=admin_headers).status_code == 409


def test_battement_de_coeur_renouvelle_le_bail_pendant_un_audit_long(audit_id: str, monkeypatch):
    """Un audit IA lent garde son verrou : le bail est renouvelé pendant l'exécution."""
    import time

    monkeypatch.setattr(unlock_jobs, "HEARTBEAT_SECONDS", 0.05)
    seen: list[str] = []
    real = unlock_jobs.run_audit

    def slow(path, name, protocol):
        seen.append(_status(audit_id).job_started_at)
        time.sleep(0.4)
        seen.append(_status(audit_id).job_started_at)
        return real(path, name, protocol)

    monkeypatch.setattr(unlock_jobs, "run_audit", slow)
    unlock_jobs.run(audit_id, _claim(audit_id))
    assert seen[1] > seen[0]                       # bail renouvelé en cours de route
    assert _status(audit_id).status == "done"


def test_audit_paye_sans_jugement_ia_passe_en_echec(audit_id: str, monkeypatch):
    """IA configurée mais rien produit (refus, JSON invalide…) : pas d'audit incomplet livré."""
    from app.pipeline import runner

    monkeypatch.setattr(settings, "anthropic_api_key", "sk-ant-test")
    # Aucun appel réseau : LLM-1 simule un refus de Claude.
    monkeypatch.setattr(runner, "run_llm1", lambda *a: (None, ["LLM-1 : Échec : refus"]))
    unlock_jobs.run(audit_id, _claim(audit_id))
    audit = _status(audit_id)
    assert audit.status == "failed" and not audit.paid and "IA" in audit.error
