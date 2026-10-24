"""Configuration du backend Insight Medics."""

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # SQLite par défaut (dev) ; en prod, DATABASE_URL Postgres fournie par Railway.
    database_url: str = "sqlite:///./insightmedics.db"
    # Dossier de stockage des fichiers uploadés et des artefacts d'audit.
    storage_dir: Path = Path("./storage")
    # Origines autorisées (front local + prod), séparées par des virgules.
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    # Rétention (jours) : fichiers et détail d'un audit sont purgés N jours après l'aperçu,
    # ou N jours après la livraison de l'audit complet (le lien client expire au même moment).
    file_retention_days: int = 30
    # Maintenance périodique lancée par le serveur (purge + libération des audits IA
    # interrompus), en minutes ; 0 = désactivée.
    maintenance_interval_minutes: float = 10
    # Durée maximale d'un audit IA avant de le considérer interrompu (verrou à bail).
    unlock_lease_minutes: float = 60
    # IA : Claude (API Anthropic). Sans clé, l'audit IA est sauté (dev, tests).
    anthropic_api_key: str = ""
    llm_model: str = "claude-opus-5-5"
    # Profondeur de raisonnement : low | medium | high | xhigh | max (seul réglage de la
    # réflexion sur Opus 5.5, toujours active). Plus haut = plus fin, plus lent, plus cher.
    llm_effort: Literal["low", "medium", "high", "xhigh", "max"] = "xhigh"
    # Plafond de sortie par appel : couvre la réflexion ET la réponse JSON. La doc conseille
    # au moins 64k aux niveaux xhigh/max, sinon la réponse risque d'être tronquée.
    llm_max_tokens: int = 64000
    # Délai max d'un appel (secondes) ; le SDK retente seul les erreurs passagères.
    llm_timeout_seconds: float = 1200
    llm_max_retries: int = 4
    # Clé d'accès admin (CRM, déblocage d'audits). Vide = endpoints admin verrouillés.
    admin_api_key: str = ""

    @property
    def sqlalchemy_url(self) -> str:
        """URL de connexion avec le pilote Postgres explicite (psycopg 3).

        Railway fournit `postgresql://…` (parfois `postgres://…`) : sans pilote explicite,
        SQLAlchemy choisit le sien, et ce choix a changé entre deux versions mineures
        (psycopg2 → psycopg). On le fixe pour ne plus en dépendre.
        """
        for prefix in ("postgresql://", "postgres://"):
            if self.database_url.startswith(prefix):
                return "postgresql+psycopg://" + self.database_url[len(prefix):]
        return self.database_url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def ai_enabled(self) -> bool:
        return bool(self.anthropic_api_key)

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
