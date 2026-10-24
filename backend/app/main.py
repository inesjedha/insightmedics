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
from .services.retention import purge_expired
from .services.unlock_jobs import release_stale_claims

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("insightmedics")


def _maintenance_once() -> None:
    """Libère les audits IA interrompus puis purge les audits expirés. Idempotent : sans
    danger si plusieurs instances du serveur la lancent en même temps."""
    with SessionLocal() as db:
        release_stale_claims(db)
        purge_expired(db)


async def _maintenance_loop(interval_minutes: float) -> None:
    """Au démarrage puis toutes les `interval_minutes` minutes ; une erreur est
    journalisée et n'arrête jamais la boucle."""
    while True:
        try:
            await asyncio.to_thread(_maintenance_once)
        except Exception:
            logger.exception("Échec de la maintenance périodique")
        await asyncio.sleep(interval_minutes * 60)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Démarrage du serveur : schéma de la base, puis maintenance périodique."""
    init_db()
    task = None
    if settings.maintenance_interval_minutes > 0:
        task = asyncio.create_task(_maintenance_loop(settings.maintenance_interval_minutes))
    yield
    if task is not None:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


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
