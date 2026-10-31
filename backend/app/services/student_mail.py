"""Mails aux étudiants : accusé de réception après un formulaire du site.

Trois variantes, mêmes promesses que le site (48 h ouvrées, puis les étapes) :
- demande de contact : « on vous rappelle pour cadrer le travail » ;
- demande d'audit complet : « on vous rappelle pour le paiement, puis l'audit, puis le lien » ;
- inscription au webinaire : la date, puis le lien de connexion, les questions, le replay.

Mise en page de mail, pas de page web : les messageries (Gmail, Outlook, l'app Mail)
ignorent le CSS moderne. D'où une table de 560 px, des styles écrits sur chaque balise
(« inline »), des polices système, et aucune image (souvent bloquées par défaut) : le logo
est un mot-symbole en texte. Une version texte brut accompagne toujours la version HTML.

L'envoi passe par `mailer` (Brevo) ; « Répondre » écrit à l'adresse de l'équipe.
"""

from __future__ import annotations

import html
from dataclasses import dataclass, field

from ..config import settings
from ..models import Audit, Lead
from . import mailer

BRAND = "#1F3FD1"
INK = "#111827"
MUTED = "#4B5563"
SOFT = "#6B7280"
LINE = "#E5E7EB"
PAGE = "#F3F5FB"
ACCENT = "#EEF1FD"
SERIF = "Georgia,'Times New Roman',serif"
SANS = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"


@dataclass
class StudentMail:
    # Textes en typographie française : espace insécable (\u00a0) avant « : » et « ? » et
    # dans « 48 h », pour qu'aucun signe ne se retrouve seul en début de ligne sur mobile.
    to: str
    subject: str
    preheader: str                    # aperçu affiché sous l'objet dans la boîte de réception
    kicker: str
    title: str
    intro: str
    steps: list[str]
    recap: list[tuple[str, str]] = field(default_factory=list)
    link: tuple[str, str] | None = None   # (libellé, adresse) : lien discret sous le récapitulatif


def _first_name(name: str | None) -> str:
    return (name or "").strip().split(" ")[0][:40]


def _hello(name: str | None) -> str:
    first = _first_name(name)
    return f"Bonjour {first}," if first else "Bonjour,"


def contact_mail(lead: Lead) -> StudentMail:
    first = _first_name(lead.name)
    return StudentMail(
        to=lead.email,
        subject="Nous avons bien reçu votre demande",
        preheader="Nous vous rappelons sous 48 h ouvrées pour cadrer votre travail.",
        kicker="Demande bien reçue",
        title=f"Merci {first}, c'est bien noté." if first else "Merci, c'est bien noté.",
        intro=(f"{_hello(lead.name)} votre demande nous est bien parvenue. Un membre de l'équipe "
               "la lit, puis vous rappelle pour en parler avec vous."),
        steps=[
            "Nous vous rappelons <b>sous 48 h ouvrées</b>, au numéro que vous avez indiqué.",
            "Nous cadrons ensemble le travail : ce qu'il faut faire, le délai et le prix.",
            "Nous commençons seulement une fois que tout vous convient.",
        ],
        recap=[("Votre sujet", lead.subject or "")],
    )


def audit_mail(lead: Lead, audit: Audit | None) -> StudentMail:
    first = _first_name(lead.name)
    return StudentMail(
        to=lead.email,
        subject="Votre demande d'audit complet est bien reçue",
        preheader="Nous vous rappelons sous 48 h ouvrées pour lancer votre audit complet.",
        kicker="Audit complet · 50 DT",
        title=(f"Merci {first}, votre demande est bien reçue." if first
               else "Merci, votre demande est bien reçue."),
        intro=(f"{_hello(lead.name)} vous avez demandé l'audit complet de votre base. "
               "Voici comment la suite se passe."),
        steps=[
            "Nous vous rappelons <b>sous 48 h ouvrées</b> pour régler les 50 DT.",
            "Dès le paiement reçu, nous lançons l'audit complet de votre base.",
            "Vous recevez un lien privé vers vos résultats et vos livrables.",
        ],
        recap=[("Votre fichier", audit.file_name if audit else "")],
    )


def webinar_mail(lead: Lead) -> StudentMail:
    """Confirmation d'inscription : titre, date et page du webinaire viennent des réglages
    (`WEBINAR_*`), pour changer d'édition sans toucher au code."""
    first = _first_name(lead.name)
    title, when = settings.webinar_title, settings.webinar_when
    return StudentMail(
        to=lead.email,
        subject="Votre inscription au webinaire est confirmée",
        preheader=f"Rendez-vous le {when}. Le lien de connexion vous arrive par e-mail.",
        kicker="Webinaire gratuit · en ligne",
        title=(f"Merci {first}, votre inscription est confirmée." if first
               else "Merci, votre inscription est confirmée."),
        intro=(f"{_hello(lead.name)} vous êtes bien inscrit(e) au webinaire « {title} », "
               f"le {when}, en ligne et gratuit."),
        steps=[
            "Le lien de connexion vous arrive par e-mail <b>la veille et une heure avant</b> "
            "le début.",
            "Préparez vos questions, et votre base si vous voulez que nous parlions de votre cas.",
            "Le replay et les diapositives vous sont envoyés <b>le lendemain</b>.",
        ],
        recap=[("Webinaire", title), ("Date", when[:1].upper() + when[1:])],
        link=("Revoir le programme", settings.webinar_url),
    )


def mail_for_lead(lead: Lead, audit: Audit | None = None) -> StudentMail | None:
    if not lead.email:
        return None
    if lead.source == "audit":
        return audit_mail(lead, audit)
    if lead.source == "webinaire":
        return webinar_mail(lead)
    return contact_mail(lead)


def send(m: StudentMail) -> bool:
    """Envoie l'accusé de réception (jamais d'exception, voir `mailer.send_email`)."""
    return mailer.send_email([m.to], m.subject, render_text(m), render_html(m),
                             reply_to=settings.team_reply_to, tag="accuse-reception")


def enabled() -> bool:
    return mailer.configured() and settings.student_emails


# ---------------------------------------------------------------- rendu

def _e(text: str) -> str:
    return html.escape(text)


def _wa_link() -> str:
    return f"https://wa.me/{settings.whatsapp_number}"


def render_text(m: StudentMail) -> str:
    def plain(s: str) -> str:
        return s.replace("<b>", "").replace("</b>", "")

    steps = "\n".join(f"{i}. {plain(s)}" for i, s in enumerate(m.steps, 1))
    recap = "\n".join(f"{k} : {v}" for k, v in m.recap if v)
    link = f"{m.link[0]} : {m.link[1]}" if m.link else ""
    return (f"{m.title}\n\n{m.intro}\n\nLa suite\n{steps}\n\n"
            + (f"{recap}\n\n" if recap else "")
            + (f"{link}\n\n" if link else "")
            + f"Une question d'ici là ? Répondez à ce mail ou écrivez-nous sur WhatsApp : "
              f"{_wa_link()}\n\nÀ très vite,\nL'équipe Insight Medics\n{settings.site_url}\n")


def _row(content: str, style: str, padding: str = "0 40px") -> str:
    """Une ligne du gabarit : les marges vivent sur la cellule, seul réglage fiable partout."""
    return f'<tr><td style="padding:{padding};{style}">{content}</td></tr>'


def _font(size: int, family: str = SANS, color: str = INK, weight: int = 400,
          line: float = 1.6) -> str:
    return f"font:{weight} {size}px/{line} {family};color:{color}"


def _steps(steps: list[str]) -> str:
    rows = "".join(
        f'<tr><td valign="top" style="padding:0 0 14px 0;width:36px">'
        f'<div style="width:26px;height:26px;border-radius:13px;background:{ACCENT};'
        f'{_font(13, color=BRAND, weight=600, line=2)};text-align:center">{i}</div></td>'
        f'<td valign="top" style="padding:3px 0 14px 0;{_font(15, line=1.55)}">{s}</td></tr>'
        for i, s in enumerate(steps, 1))
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows}</table>'


def _recap(recap: list[tuple[str, str]]) -> str:
    items = "".join(
        f'<p style="margin:0;{_font(12, color=SOFT, line=1.4)};text-transform:uppercase;'
        f'letter-spacing:.08em">{_e(k)}</p>'
        f'<p style="margin:4px 0 0 0;{_font(15, line=1.5)}">{_e(v)}</p>'
        for k, v in recap if v)
    if not items:
        return ""
    box = f'<div style="background:{PAGE};border-radius:10px;padding:16px 18px">{items}</div>'
    return _row(box, "", "8px 40px 0 40px")


def _link(link: tuple[str, str] | None) -> str:
    if link is None:
        return ""
    label, href = link
    anchor = (f'<a href="{html.escape(href, quote=True)}" style="color:{BRAND};'
              f'text-decoration:underline">{_e(label)}</a>')
    return _row(anchor, _font(15), "14px 40px 0 40px")


def _button(label: str, href: str) -> str:
    return (f'<a href="{html.escape(href, quote=True)}" style="display:inline-block;'
            f'background:{BRAND};color:#FFFFFF;text-decoration:none;'
            f'{_font(15, color="#FFFFFF", weight=600, line=1)};padding:14px 22px;'
            f'border-radius:8px">{_e(label)}</a>')


def render_html(m: StudentMail) -> str:
    """Gabarit du mail. Les étapes viennent de nos textes (gras voulu) ; tout ce que
    l'étudiant a saisi (prénom, sujet, nom de fichier) est échappé."""
    wordmark = (f'insight<i style="color:{BRAND}">medics</i>'
                f'<span style="color:{BRAND}">.</span>')
    kicker_style = (f"{_font(12, color=BRAND, weight=600, line=1.4)};"
                    "text-transform:uppercase;letter-spacing:.14em")
    signature = (f'À très vite,<br><span style="{_font(20, SERIF, line=1.4)}">'
                 "L'équipe Insight Medics</span>")
    site = html.escape(settings.site_url, quote=True)
    site_label = _e(settings.site_url.removeprefix("https://").removeprefix("www."))
    footer = (f'Insight Medics · Sousse, Tunisie · <a href="{site}" style="color:{SOFT}">'
              f"{site_label}</a><br>Vous recevez ce mail parce que vous avez rempli un "
              "formulaire sur notre site.")
    card = "".join([
        _row(wordmark, _font(22, SERIF, line=1), "28px 40px 0 40px"),
        _row(_e(m.kicker), kicker_style, "28px 40px 0 40px"),
        _row(_e(m.title), _font(30, SERIF, line=1.2), "8px 40px 0 40px"),
        _row(_e(m.intro), _font(15, color=MUTED), "16px 40px 0 40px"),
        _row("La suite", _font(15, weight=600, line=1.4), "28px 40px 6px 40px"),
        _row(_steps(m.steps), ""),
        _recap(m.recap),
        _link(m.link),
        _row("Une question d'ici là ? Répondez simplement à ce mail, ou écrivez-nous :",
             _font(15, color=MUTED), "28px 40px 0 40px"),
        _row(_button("Écrire sur WhatsApp", _wa_link()), "", "14px 40px 0 40px"),
        _row(signature, _font(15), "32px 40px 32px 40px"),
    ])
    table = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"'
    return (
        '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="color-scheme" content="light only">'
        '<meta name="supported-color-schemes" content="light">'
        f"<title>{_e(m.subject)}</title></head>"
        f'<body style="margin:0;padding:0;background:{PAGE}">'
        # Texte d'aperçu : affiché sous l'objet dans la boîte de réception, caché dans le mail.
        f'<div style="display:none;max-height:0;overflow:hidden;opacity:0">{_e(m.preheader)}</div>'
        f'{table} style="background:{PAGE}"><tr><td align="center" style="padding:32px 16px">'
        f'{table} style="max-width:560px;background:#FFFFFF;border-radius:14px;'
        f'border:1px solid {LINE}">{card}</table>'
        f'{table} style="max-width:560px">'
        f'{_row(footer, _font(12, color=SOFT) + ";text-align:center", "18px 40px 0 40px")}'
        "</table></td></tr></table></body></html>")
