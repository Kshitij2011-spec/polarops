"""PolarOps Backend — FastAPI Application Entry Point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.assets import router as assets_router
from app.api.events import router as events_router
from app.api.explainability import router as explainability_router
from app.api.health import router as health_router
from app.api.incidents import router as incidents_router
from app.api.intelligence import router as intelligence_router
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
    try:
        with engine.connect() as conn:
            cursor = conn.exec_driver_sql("PRAGMA table_info(event_logs)")
            cols = [row[1] for row in cursor.fetchall()]
            if "event_type" not in cols:
                conn.exec_driver_sql("ALTER TABLE event_logs ADD COLUMN event_type VARCHAR(64) DEFAULT 'TELEMETRY_CHANGE'")
            if "entity_type" not in cols:
                conn.exec_driver_sql("ALTER TABLE event_logs ADD COLUMN entity_type VARCHAR(64)")
            if "entity_id" not in cols:
                conn.exec_driver_sql("ALTER TABLE event_logs ADD COLUMN entity_id VARCHAR(64)")
            if "title" not in cols:
                conn.exec_driver_sql("ALTER TABLE event_logs ADD COLUMN title VARCHAR(256)")
            if "summary" not in cols:
                conn.exec_driver_sql("ALTER TABLE event_logs ADD COLUMN summary VARCHAR(512)")
            if "truth_type" not in cols:
                conn.exec_driver_sql("ALTER TABLE event_logs ADD COLUMN truth_type VARCHAR(32) DEFAULT 'MEASURED'")
            if "metadata_json" not in cols:
                conn.exec_driver_sql("ALTER TABLE event_logs ADD COLUMN metadata_json TEXT")
            conn.commit()
    except Exception:
        pass
    # Seed database if unpopulated
    db = SessionLocal()
    try:
        from app.models import Station
        if not db.query(Station).first():
            seed_database(db)
        from app.core.seed import ensure_maitri_canonical_state
        ensure_maitri_canonical_state(db)
        from app.models.entities import EventLog
        from app.services.event_service import reset_operational_events
        if not db.query(EventLog).first():
            reset_operational_events(db, "STATION-BHARATI")
            reset_operational_events(db, "STATION-MAITRI")
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
app.include_router(events_router)
app.include_router(explainability_router)
app.include_router(intelligence_router)
