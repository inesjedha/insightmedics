"""Mails de notification à l'équipe : un formulaire du site vient d'être rempli.

Filet de sécurité pour ne rien manquer si personne n'ouvre l'admin : chaque demande
(contact, déblocage d'audit) et chaque test gratuit envoie un court mail avec les données
saisies. L'envoi passe par l'API HTTP de Resend (les ports SMTP sont souvent fermés chez
les hébergeurs) et ne bloque jamais le formulaire : il tourne en tâche de fond, et un échec
est seulement journalisé.

Sans `RESEND_API_KEY` ou sans destinataire (`NOTIFY_EMAILS`), rien n'est envoyé (dev, tests).
"""

from __future__ import annotations

import html
import json
import logging
import urllib.error
import urllib.request
from dataclasses import dataclass

from ..config import settings
from ..models import Audit, Lead

logger = logging.getLogger(__name__)

RESEND_URL = "https://api.resend.com/emails"
TIMEOUT_SECONDS = 10

SOURCE_LABEL = {"contact": "Formulaire de contact", "audit": "Demande d'audit complet (50 DT)"}


@dataclass
class Message:
    subject: str
    rows: list[tuple[str, str]]      # (libellé, valeur), dans l'ordre d'affichage
    link_label: str
    link: str


def enabled() -> bool:
    return bool(settings.resend_api_key and settings.notify_email_list)


# ---------------------------------------------------------------- contenus

def lead_message(lead: Lead) -> Message:
    who = lead.name or lead.email
    kind = SOURCE_LABEL.get(lead.source, lead.source)
    urgent = " · prioritaire" if lead.priority == "high" else ""
    rows = [
        ("Type", kind + urgent),
        ("Nom", lead.name or "—"),
        ("Email", lead.email),
        ("Téléphone", lead.phone or "—"),
        ("Sujet", lead.subject or ""),
        ("Problème", lead.problem or ""),
        ("Objectif", lead.objective or ""),
        ("Message", lead.message or ""),
        ("Score de l'audit", f"{lead.audit_score:g}/100" if lead.audit_score is not None else ""),
        ("Note", lead.notes or ""),
    ]
    return Message(
        subject=f"Nouvelle demande · {kind} · {who}",
        rows=[(k, v) for k, v in rows if v],
        link_label="Ouvrir la demande dans l'admin",
        link=f"{settings.site_url}/admin/leads/{lead.id}",
    )


def test_message(audit: Audit) -> Message:
    rows = [
        ("Fichier", audit.file_name),
        ("Score de l'aperçu", f"{audit.score:g}/100" if audit.score is not None else "—"),
        ("Patients", str(audit.row_count) if audit.row_count is not None else "—"),
        ("Variables", str(audit.column_count) if audit.column_count is not None else "—"),
    ]
    return Message(
        subject=f"Nouveau test gratuit · {audit.file_name}",
        rows=rows,
        link_label="Voir les audits dans l'admin",
        link=f"{settings.site_url}/admin/audits",
    )


def render_text(m: Message) -> str:
    body = "\n".join(f"{k} : {v}" for k, v in m.rows)
    return f"{body}\n\n{m.link_label} : {m.link}\n\n— Insight Medics (mail automatique)"


def render_html(m: Message) -> str:
    def cell(value: str) -> str:
        return html.escape(value).replace("\n", "<br>")

    rows = "".join(
        f'<tr><td style="padding:6px 12px 6px 0;color:#4B5563;vertical-align:top;'
        f'white-space:nowrap">{cell(k)}</td>'
        f'<td style="padding:6px 0;color:#111827">{cell(v)}</td></tr>'
        for k, v in m.rows)
    return (
        '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;'
        'max-width:560px">'
        f'<p style="font-size:16px;font-weight:bold;margin:0 0 12px">{cell(m.subject)}</p>'
        f'<table style="border-collapse:collapse">{rows}</table>'
        f'<p style="margin:20px 0 0"><a href="{html.escape(m.link, quote=True)}" '
        f'style="color:#1F3FD1">{cell(m.link_label)}</a></p>'
        '<p style="color:#6B7280;font-size:12px;margin:24px 0 0">Insight Medics · mail '
        'automatique envoyé à chaque formulaire rempli sur le site.</p></div>')


# ---------------------------------------------------------------- envoi

def send(m: Message) -> bool:
    """Envoie le mail à l'équipe. Ne lève jamais : renvoie False et journalise en cas d'échec."""
    if not enabled():
        return False
    payload = {
        "from": settings.notify_from,
        "to": settings.notify_email_list,
        "subject": m.subject[:200],
        "text": render_text(m),
        "html": render_html(m),
    }
    request = urllib.request.Request(
        RESEND_URL, data=json.dumps(payload).encode("utf-8"), method="POST",
        headers={"Authorization": f"Bearer {settings.resend_api_key}",
                 "Content-Type": "application/json", "User-Agent": "insightmedics-backend"})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            ok = 200 <= response.status < 300
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300]
        logger.warning("Notification non envoyée (HTTP %s) : %s", exc.code, detail)
        return False
    except Exception:  # un mail raté ne doit jamais casser un formulaire
        logger.warning("Notification non envoyée (réseau)", exc_info=True)
        return False
    if ok:
        logger.info("Notification envoyée : %s", m.subject.split(" · ")[0])
    return ok


