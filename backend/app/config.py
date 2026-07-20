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
    # Fournisseur IA : "anthropic" ou "openai" ("" = auto selon la clé disponible).
    llm_provider: str = ""
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    # Modèle utilisé ("" = défaut du fournisseur).
    llm_model: str = ""

    @property
    def resolved_provider(self) -> str:
        if self.llm_provider:
            return self.llm_provider
        if self.anthropic_api_key:
            return "anthropic"
        if self.openai_api_key:
            return "openai"
        return ""

    @property
    def resolved_model(self) -> str:
        if self.llm_model:
            return self.llm_model
        return {"anthropic": "claude-sonnet-5", "openai": "gpt-4o"}.get(
            self.resolved_provider, "")

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
settings.storage_dir.mkdir(parents=True, exist_ok=True)
