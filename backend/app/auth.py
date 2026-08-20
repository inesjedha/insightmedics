"""Authentification admin minimale par clé d'API (en-tête `X-Admin-Key`).

MVP : une seule clé partagée (`settings.admin_api_key`) protège le CRM et le déblocage
des audits. Tant qu'aucune clé n'est configurée, les endpoints admin sont verrouillés
(401). À remplacer par de vrais comptes utilisateurs quand le besoin apparaîtra.
"""

from __future__ import annotations

import secrets

from fastapi import Header, HTTPException

from .config import settings


def require_admin(x_admin_key: str = Header(default="")) -> None:
    """Dépendance FastAPI : refuse l'accès si la clé admin est absente ou incorrecte."""
    expected = settings.admin_api_key
    if not expected or not secrets.compare_digest(x_admin_key, expected):
        raise HTTPException(status_code=401, detail="Accès admin refusé")
