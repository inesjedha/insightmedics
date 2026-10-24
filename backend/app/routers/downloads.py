"""Réponse HTTP de téléchargement d'un livrable, partagée par les routers admin et client."""

from fastapi import HTTPException, Response

from ..models import Audit
from ..services import audits as service
from ..services.audits import DeliverableKind


def deliverable_response(audit: Audit, kind: DeliverableKind) -> Response:
    try:
        d = service.build_deliverable(audit, kind)
    except service.DeliverableUnavailableError as exc:
        raise HTTPException(404, str(exc)) from exc
    return Response(content=d.content, media_type=d.media_type,
                    headers={"Content-Disposition": f'attachment; filename="{d.filename}"'})
