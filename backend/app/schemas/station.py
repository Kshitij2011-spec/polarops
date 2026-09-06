"""Station overview and environmental Pydantic schemas."""

from typing import Optional
from pydantic import BaseModel, Field

from app.models.enums import EnvironmentMode, StationStatus
from app.schemas.common import ProvenanceSchema


class AmbientWeatherSchema(BaseModel):
    """Current station weather observation."""

    temperature_celsius: float
    wind_speed_knots: float
    wind_chill_celsius: float
    conditions: str
    provenance: ProvenanceSchema


class SubsystemSummaryItem(BaseModel):
    """High-level operational health indicator for a station subsystem."""

    code: str
    name: str
    status: str
    health_score: int = Field(ge=0, le=100)


class CriticalEventItem(BaseModel):
    """Urgent operational anomaly or active incident requiring operator attention."""

    id: str
    title: str
    severity: str
    status: str
    asset_id: Optional[str] = None
    location: Optional[str] = None
    description: str


class StationOverviewResponse(BaseModel):
    """High-level situation awareness payload for Station Command Center."""

    station_id: str
    name: str
    status: StationStatus
    environment_mode: EnvironmentMode
    overall_health_score: int = Field(ge=0, le=100)
    active_incidents_count: int
    fuel_runway_days: Optional[float] = None
    fuel_quantity_liters: Optional[float] = None
    connectivity_status: str = "ONLINE"
    ambient_weather: AmbientWeatherSchema
    subsystem_summary: list[SubsystemSummaryItem]
    critical_events: list[CriticalEventItem] = []
