"""Backend Insight Medics — API REST + pipeline d'audit.

Démarrage local :  uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, apply_light_migrations, engine
from .routers import audits, leads

Base.metadata.create_all(bind=engine)
apply_light_migrations()

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
