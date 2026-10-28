"""Configuration du backend Insight Medics."""

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings

# Profondeur de raisonnement de Claude (seul réglage de la réflexion sur Opus 5.5).
Effort = Literal["low", "medium", "high", "xhigh", "max"]


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
    llm_effort: Effort = "xhigh"
    # Relecture « mots simples » des textes de l'étudiant : une réécriture, pas un jugement,
    # d'où un effort plus bas (moins cher, plus rapide).
    llm_plain_effort: Effort = "medium"
    # Plafond de sortie par appel : couvre la réflexion ET la réponse JSON. On prend le
    # maximum d'Opus 5.5 (128k) : à l'effort xhigh, 64k ne suffisaient pas pour une base de
    # 71 variables (dictionnaire tronqué, audit du 27/10/2026). Seuls les jetons réellement
    # produits sont facturés : le plafond ne coûte rien tant qu'il n'est pas atteint.
    llm_max_tokens: int = 128000
    # Délai d'inactivité max entre deux lectures du flux (secondes) ; nombre de relances
    # automatiques du SDK pour les erreurs passagères avant le début de la réponse.
    llm_timeout_seconds: float = 1200
    llm_max_retries: int = 4
    # Clé d'accès admin (CRM, déblocage d'audits). Vide = endpoints admin verrouillés.
    admin_api_key: str = ""
    # Mails transactionnels via l'API Brevo (services/mailer.py) ; sans clé, aucun envoi.
    brevo_api_key: str = ""
    # Expéditeur : une adresse du domaine authentifié chez Brevo (SPF + DKIM).
    mail_from_email: str = "notifications@insightmedics.fr"
    mail_from_name: str = "Insight Medics"
    # Notifications à l'équipe à chaque formulaire rempli (services/notify.py) :
    # destinataires séparés par des virgules ; vide = aucune notification.
    notify_emails: str = ""
    # Accusé de réception envoyé à l'étudiant après un formulaire (services/student_mail.py).
    student_emails: bool = True
    # Adresse de l'équipe : « Répondre » dans les mails aux étudiants écrit ici.
    team_reply_to: str = "helpinsightmedics@gmail.com"
    # WhatsApp de l'équipe (format international, sans +), bouton des mails aux étudiants.
    whatsapp_number: str = "21696389570"
    # Prévenir aussi à chaque test gratuit (en plus des demandes de contact et d'audit).
    notify_on_test: bool = True
    # Adresse publique du site, pour les liens vers l'admin dans les mails.
    site_url: str = "https://insightmedics.fr"
    # Thèses : logiciel déclaré dans la partie « Analyse statistique » du M&M. Vide = aucun
    # logiciel nommé (la phrase devient une mention [À CONFIRMER] pour l'équipe). Les calculs
    # sont faits par notre moteur (réglages identiques à SPSS) : ne déclarer SPSS que si les
    # tests sont réellement refaits sous SPSS.
    thesis_software: str = ""

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
    def notify_email_list(self) -> list[str]:
        return [e.strip() for e in self.notify_emails.split(",") if e.strip()]

    @property
    def ai_enabled(self) -> bool:
        return bool(self.anthropic_api_key)

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
