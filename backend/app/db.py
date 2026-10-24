"""Accès base de données : moteur SQLAlchemy, sessions, initialisation du schéma."""

import contextlib
from collections.abc import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


# Colonnes ajoutées après la création initiale des tables. `create_all` ne modifie jamais
# une table existante : on les ajoute à la main (sans outil de migration complet).
# À remplacer par Alembic dès que le schéma évolue plus souvent.
_ADDED_COLUMNS = {
    "audits": {
        "score_detail": "JSON",
        "ai_audit": "JSON",
        "token": "VARCHAR",
        "email": "VARCHAR",
        "paid": "BOOLEAN",
        "expires_at": "VARCHAR",
    },
}


def init_db() -> None:
    """Crée les tables manquantes puis ajoute les colonnes manquantes. Idempotent."""
    from . import models  # noqa: F401 — enregistre les modèles auprès de Base.metadata

    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        for table, columns in _ADDED_COLUMNS.items():
            for column, column_type in columns.items():
                # La colonne existe déjà : l'ALTER échoue, ce qui est attendu.
                with contextlib.suppress(Exception):
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {column_type}"))


def get_db() -> Iterator[Session]:
    """Dépendance FastAPI : une session par requête, toujours refermée."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
