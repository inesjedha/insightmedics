"""Backend Insight Medics — API REST + pipeline d'audit.

Démarrage local :  uvicorn app.main:app --reload --port 8000
"""

import sys

if sys.version_info < (3, 10):
    raise RuntimeError(
        f"Python 3.10+ requis (vous utilisez {sys.version_info.major}.{sys.version_info.minor}). "
        "Sur macOS : brew install python@3.12, puis recréez le venv avec python3.12 -m venv .venv"
    )


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, engine
from .routers import audits, leads

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Insight Medics API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router)
app.include_router(audits.router)


@app.get("/health")
def health():
    return {"status": "ok"}
