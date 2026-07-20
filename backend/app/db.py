"""Session SQLAlchemy."""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def apply_light_migrations() -> None:
    """Ajoute les colonnes manquantes sur une base existante (dev/SQLite).

    create_all ne modifie jamais une table existante ; ce helper couvre les
    ajouts de colonnes simples sans outil de migration complet (Alembic viendra
    avec la prod Postgres si besoin).
    """
    from sqlalchemy import text

    wanted = {"audits": {"score_detail": "JSON", "ai_audit": "JSON"}}
    with engine.begin() as conn:
        for table, columns in wanted.items():
            for col, coltype in columns.items():
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {coltype}"))
                except Exception:  # noqa: BLE001 — colonne déjà présente
                    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
