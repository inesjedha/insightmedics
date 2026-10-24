"""Mise à niveau du schéma au démarrage (base existante créée par une version antérieure)."""

from sqlalchemy import create_engine, inspect, text

import app.db as db_module


def test_init_db_ajoute_plusieurs_colonnes_manquantes(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'ancienne.db'}")
    with engine.begin() as conn:  # table « audits » d'une ancienne version, sans les ajouts
        conn.execute(text("CREATE TABLE audits (id VARCHAR PRIMARY KEY, file_name VARCHAR, "
                          "file_size INTEGER, stored_path VARCHAR, started_at VARCHAR, "
                          "finished_at VARCHAR, status VARCHAR, error TEXT, score FLOAT, "
                          "row_count INTEGER, column_count INTEGER, missing_pct FLOAT, "
                          "duplicates_pct FLOAT, issues JSON, needs_human_review BOOLEAN, "
                          "profiling JSON, events JSON, token VARCHAR)"))
    monkeypatch.setattr(db_module, "engine", engine)
    db_module.init_db()
    columns = {c["name"] for c in inspect(engine).get_columns("audits")}
    assert set(db_module._ADDED_COLUMNS["audits"]) <= columns
    db_module.init_db()  # idempotent


def test_url_postgres_avec_pilote_explicite(monkeypatch):
    from app.config import Settings

    for url in ("postgresql://u:p@h:5432/db", "postgres://u:p@h:5432/db"):
        assert Settings(database_url=url).sqlalchemy_url == "postgresql+psycopg://u:p@h:5432/db"
    assert Settings(database_url="sqlite:///x.db").sqlalchemy_url == "sqlite:///x.db"
