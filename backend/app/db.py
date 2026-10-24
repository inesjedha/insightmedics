"""Accès base de données : moteur SQLAlchemy, sessions, initialisation du schéma."""

from collections.abc import Iterator
from typing import cast

from sqlalchemy import CursorResult, Update, create_engine, inspect, text
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
        "purged_at": "VARCHAR",
        "job_id": "VARCHAR",
        "job_started_at": "VARCHAR",
    },
}


def init_db() -> None:
    """Crée les tables manquantes puis ajoute les colonnes manquantes. Idempotent."""
    from . import models  # noqa: F401 — enregistre les modèles auprès de Base.metadata

    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, columns in _ADDED_COLUMNS.items():
            existing = {c["name"] for c in inspector.get_columns(table)}
            for column, column_type in columns.items():
                # On vérifie avant d'ajouter : sur Postgres, un ALTER en échec annulerait
                # tous les suivants de la transaction.
                if column not in existing:
                    # IF NOT EXISTS (Postgres) : deux instances qui démarrent ensemble
                    # ne se gênent pas. SQLite ne le supporte pas, mais n'a qu'une instance.
                    guard = "IF NOT EXISTS " if engine.dialect.name == "postgresql" else ""
                    conn.execute(text(
                        f"ALTER TABLE {table} ADD COLUMN {guard}{column} {column_type}"))


def execute_update(db: Session, statement: Update) -> int:
    """Exécute un UPDATE et retourne le nombre de lignes modifiées (sans commit).

    Base des écritures conditionnelles atomiques (« UPDATE … WHERE état attendu ») :
    0 ligne modifiée signifie que l'état a changé entre-temps, ailleurs.
    """
    return cast(CursorResult, db.execute(statement)).rowcount


def get_db() -> Iterator[Session]:
    """Dépendance FastAPI : une session par requête, toujours refermée."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
