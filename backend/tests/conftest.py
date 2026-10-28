"""Configuration commune des tests.

Les variables d'environnement sont fixées AVANT tout import de `app` : `app.config`
lit l'environnement une seule fois, à l'import. On garantit ainsi que les tests :
- n'écrivent jamais dans la base SQLite ni le dossier de stockage de développement ;
- n'appellent jamais une vraie API IA (payante), même si une clé est présente dans `.env`.
"""

import os
import tempfile
from pathlib import Path

_TMP = Path(tempfile.mkdtemp(prefix="insightmedics-tests-"))

# SQLite temporaire par défaut ; TEST_DATABASE_URL permet de viser une base Postgres
# jetable (comme en CI), pour tester le même moteur qu'en production.
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", f"sqlite:///{_TMP / 'test.db'}")
os.environ["STORAGE_DIR"] = str(_TMP / "storage")
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["ADMIN_API_KEY"] = ""
os.environ["BREVO_API_KEY"] = ""            # jamais de vrai mail depuis les tests

import pytest  # noqa: E402 — après la configuration de l'environnement

from app.db import init_db  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _database() -> None:
    """Crée le schéma une fois (le `TestClient` n'exécute le lifespan que dans un `with`)."""
    init_db()


@pytest.fixture()
def admin_headers():
    """Active une clé admin le temps du test et renvoie l'en-tête correspondant."""
    from app.config import settings

    old, settings.admin_api_key = settings.admin_api_key, "cle-admin-de-test"
    yield {"X-Admin-Key": settings.admin_api_key}
    settings.admin_api_key = old


@pytest.fixture(autouse=True)
def _no_real_claude_calls(monkeypatch):
    """Garde-fou : un test qui atteindrait la vraie API Claude (payante) échoue tout de
    suite. Les tests du client IA installent leur faux client par-dessus."""
    from app.pipeline import llm_client

    def forbidden():
        raise AssertionError("Appel réel à l'API Claude interdit pendant les tests")

    monkeypatch.setattr(llm_client, "_client", forbidden)
