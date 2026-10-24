"""Backend Insight Medics — API REST + pipeline d'audit.

Démarrage local :  uvicorn app.main:app --reload --port 8000
"""

import asyncio
import contextlib
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import SessionLocal, init_db
from .routers import audits, client, leads
from .services.audits import recover_interrupted
from .services.retention import purge_expired

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("insightmedics")


def _purge_once() -> None:
    with SessionLocal() as db:
        purge_expired(db)


async def _purge_periodically(interval_hours: float) -> None:
    """Purge au démarrage puis toutes les `interval_hours` heures, sans jamais s'arrêter
    sur une erreur (elle est journalisée, la boucle continue)."""
    while True:
        try:
            await asyncio.to_thread(_purge_once)
        except Exception:
            logger.exception("Échec de la purge automatique")
        await asyncio.sleep(interval_hours * 3600)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Démarrage du serveur : schéma, reprise des audits interrompus, purge planifiée."""
    init_db()
    with SessionLocal() as db:
        recover_interrupted(db)
    purge_task = None
    if settings.purge_interval_hours > 0:
        purge_task = asyncio.create_task(_purge_periodically(settings.purge_interval_hours))
    yield
    if purge_task is not None:
        purge_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await purge_task


app = FastAPI(title="Insight Medics API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Filet de sécurité : toute exception non gérée est tracée côté serveur et renvoie
    une réponse JSON cohérente, sans divulguer le détail interne au client."""
    logger.exception("Erreur non gérée sur %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Erreur interne du serveur"})


app.include_router(leads.router)
app.include_router(audits.router)
app.include_router(client.router)


@app.get("/health", tags=["ops"])
def health() -> dict[str, str]:
    return {"status": "ok"}
