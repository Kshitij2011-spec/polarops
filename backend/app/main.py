"""PolarOps Backend — FastAPI Application Entry Point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.assets import router as assets_router
from app.api.health import router as health_router
from app.api.incidents import router as incidents_router
from app.api.memory import router as memory_router
from app.api.resilience import router as resilience_router
from app.api.resources import router as resources_router
from app.api.scenarios import router as scenarios_router
from app.api.science import router as science_router
from app.api.station import router as station_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.seed import seed_database
import app.models  # noqa: F401 - ensure models are loaded


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context ensuring tables exist and initial deterministic seed is loaded."""
    # Ensure database schema tables exist
    Base.metadata.create_all(bind=engine)
    # Seed database if unpopulated
    db = SessionLocal()
    try:
        from app.models import Station
        if not db.query(Station).first():
            seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="PolarOps API",
    description="Antarctic Operational Digital Twin — Backend Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.effective_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers ---
app.include_router(health_router, tags=["Health"])
app.include_router(station_router)
app.include_router(assets_router)
app.include_router(resources_router)
app.include_router(scenarios_router)
app.include_router(resilience_router)
app.include_router(science_router)
app.include_router(incidents_router)
app.include_router(memory_router)
