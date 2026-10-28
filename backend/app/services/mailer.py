"""Envoi de mails transactionnels via l'API HTTP de Brevo (entreprise française, données UE).

Couche « transport » : elle ne sait pas QUOI envoyer, seulement COMMENT. Les contenus
(notifications à l'équipe, et demain mails aux étudiants) vivent dans d'autres modules et
appellent `send_email`. Changer de fournisseur ne touche que ce fichier.

On passe par l'API HTTP plutôt que par SMTP : les ports SMTP sortants sont souvent fermés
chez les hébergeurs, et une requête HTTPS se teste et se journalise plus simplement.

Sans `BREVO_API_KEY`, rien n'est envoyé (dev, tests).
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request

from ..config import settings

logger = logging.getLogger(__name__)

BREVO_URL = "https://api.brevo.com/v3/smtp/email"
TIMEOUT_SECONDS = 10


def configured() -> bool:
    return bool(settings.brevo_api_key)


def send_email(to: list[str], subject: str, text: str, html: str,
               reply_to: str | None = None, tag: str = "") -> bool:
    """Envoie un mail. Ne lève jamais : renvoie False et journalise en cas d'échec.

    `tag` sert au tri dans le tableau de bord Brevo (ex. « notification-equipe ») et
    dans nos journaux, qui ne contiennent jamais l'objet ni les destinataires (données
    personnelles).
    """
    if not configured() or not to:
        return False
    payload: dict[str, object] = {
        "sender": {"name": settings.mail_from_name, "email": settings.mail_from_email},
        "to": [{"email": address} for address in to],
        "subject": subject[:200],
        "textContent": text,
        "htmlContent": html,
    }
    if reply_to:
        payload["replyTo"] = {"email": reply_to}
    if tag:
        payload["tags"] = [tag]
    request = urllib.request.Request(
        BREVO_URL, data=json.dumps(payload).encode("utf-8"), method="POST",
        headers={"api-key": settings.brevo_api_key, "accept": "application/json",
                 "content-type": "application/json", "user-agent": "insightmedics-backend"})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            ok = 200 <= response.status < 300
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300]
        logger.warning("Mail %s non envoyé (HTTP %s) : %s", tag or "-", exc.code, detail)
        return False
    except Exception:  # un mail raté ne doit jamais casser la requête qui l'a déclenché
        logger.warning("Mail %s non envoyé (réseau)", tag or "-", exc_info=True)
        return False
    if ok:
        logger.info("Mail %s envoyé", tag or "-")
    return ok
