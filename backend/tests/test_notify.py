"""Mails de notification à l'équipe quand un formulaire du site est rempli."""

import json
import urllib.error

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.services import notify


class _Response:
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


@pytest.fixture()
def outbox(monkeypatch):
    """Active les notifications et capture les requêtes au lieu de les envoyer."""
    sent: list[dict] = []

    def fake_urlopen(request, timeout):
        sent.append({"headers": dict(request.header_items()),
                     "body": json.loads(request.data.decode("utf-8"))})
        return _Response()

    monkeypatch.setattr(settings, "resend_api_key", "re_test")
    monkeypatch.setattr(settings, "notify_emails", "a@exemple.fr, b@exemple.fr")
    monkeypatch.setattr(notify.urllib.request, "urlopen", fake_urlopen)
    return sent


def test_formulaire_de_contact_envoie_un_mail_avec_les_donnees(outbox):
    r = TestClient(app).post("/leads", json={
        "source": "contact", "name": "Sana", "email": "sana@exemple.tn",
        "phone": "+216 20 000 000", "subject": "Thèse en cardiologie",
        "message": "Offres : Analyses + résultats\nBase de 120 patients <urgent>"})
    assert r.status_code == 201
    assert len(outbox) == 1
    mail = outbox[0]["body"]
    assert mail["to"] == ["a@exemple.fr", "b@exemple.fr"]
    assert mail["subject"] == "Nouvelle demande · Formulaire de contact · Sana"
    assert "Téléphone : +216 20 000 000" in mail["text"]
    assert "Base de 120 patients <urgent>" in mail["text"]
    assert "&lt;urgent&gt;" in mail["html"] and "<urgent>" not in mail["html"]
    assert f"/admin/leads/{r.json()['id']}" in mail["text"]
    assert outbox[0]["headers"]["Authorization"] == "Bearer re_test"


def test_sans_cle_aucun_mail(monkeypatch):
    calls: list[object] = []
    monkeypatch.setattr(notify.urllib.request, "urlopen", lambda *a, **k: calls.append(a))
    monkeypatch.setattr(settings, "notify_emails", "a@exemple.fr")
    r = TestClient(app).post("/leads", json={"email": "x@exemple.tn"})
    assert r.status_code == 201 and calls == []


def test_echec_d_envoi_ne_casse_pas_le_formulaire(monkeypatch, outbox):
    def boom(request, timeout):
        raise urllib.error.URLError("hors ligne")

    monkeypatch.setattr(notify.urllib.request, "urlopen", boom)
    r = TestClient(app).post("/leads", json={"email": "y@exemple.tn"})
    assert r.status_code == 201


def test_message_de_test_gratuit_sans_donnees_patients():
    from app.models import Audit

    audit = Audit(id="aud_x", file_name="these.sav", file_size=1, stored_path="",
                  score=62.5, row_count=51, column_count=130)
    m = notify.test_message(audit)
    assert m.subject == "Nouveau test gratuit · these.sav"
    assert ("Patients", "51") in m.rows and ("Score de l'aperçu", "62.5/100") in m.rows
    assert m.link.endswith("/admin/audits")
