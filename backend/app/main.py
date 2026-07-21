"""Backend Insight Medics — API REST + pipeline d'audit.

Démarrage local :  uvicorn app.main:app --reload --port 8000
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import Base, apply_light_migrations, engine
from .routers import audits, leads

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("insightmedics")

Base.metadata.create_all(bind=engine)
apply_light_migrations()

app = FastAPI(title="Insight Medics API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
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


@app.get("/health")
def health():
    return {"status": "ok"}
