"""Configuration du backend Insight Medics."""

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # SQLite par défaut (dev) ; en prod, DATABASE_URL Postgres fournie par Railway.
    database_url: str = "sqlite:///./insightmedics.db"
    # Dossier de stockage des fichiers uploadés et des artefacts d'audit.
    storage_dir: Path = Path("./storage")
    # Origines autorisées (front local + prod), séparées par des virgules.
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    # Rétention des fichiers uploadés (jours) — purge à implémenter (tâche cron).
    file_retention_days: int = 30
    # Clé Anthropic (jalons M4/M5).
    anthropic_api_key: str = ""
    # Modèle utilisé pour les appels d'audit IA.
    llm_model: str = "claude-sonnet-5"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
settings.storage_dir.mkdir(parents=True, exist_ok=True)
