"""Mails de notification à l'équipe : un formulaire du site vient d'être rempli.

Filet de sécurité pour ne rien manquer si personne n'ouvre l'admin : chaque demande
(contact, déblocage d'audit) et chaque test gratuit envoie un court mail avec les données
saisies. Ce module ne fait que le contenu ; l'envoi passe par `mailer` (Brevo). Il ne
bloque jamais le formulaire : il tourne en tâche de fond, et un échec est seulement
journalisé.

Sans `BREVO_API_KEY` ou sans destinataire (`NOTIFY_EMAILS`), rien n'est envoyé (dev, tests).
"""

from __future__ import annotations

import html
from dataclasses import dataclass

from ..config import settings
from ..models import Audit, Lead
from . import mailer

SOURCE_LABEL = {"contact": "Formulaire de contact", "audit": "Demande d'audit complet (50 DT)"}


@dataclass
class Message:
    subject: str
    rows: list[tuple[str, str]]      # (libellé, valeur), dans l'ordre d'affichage
    link_label: str
    link: str
    reply_to: str | None = None      # « Répondre » écrit directement à l'étudiant


def enabled() -> bool:
    return mailer.configured() and bool(settings.notify_email_list)


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
        ("Nous a connus par", lead.referral or ""),
        ("Score de l'audit", f"{lead.audit_score:g}/100" if lead.audit_score is not None else ""),
        ("Note", lead.notes or ""),
    ]
    return Message(
        subject=f"Nouvelle demande · {kind} · {who}",
        rows=[(k, v) for k, v in rows if v],
        link_label="Ouvrir la demande dans l'admin",
        link=f"{settings.site_url}/admin/leads/{lead.id}",
        reply_to=lead.email or None,
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
    """Envoie la notification à l'équipe (jamais d'exception, voir `mailer.send_email`)."""
    if not enabled():
        return False
    return mailer.send_email(settings.notify_email_list, m.subject, render_text(m),
                             render_html(m), reply_to=m.reply_to, tag="notification-equipe")
