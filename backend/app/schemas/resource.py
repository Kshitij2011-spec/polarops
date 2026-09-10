"""Pydantic v2 schemas for Fuel, Inventory, Resupply, Energy, and Asset Recovery Exposure."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.enums import Criticality, ResupplyStatus
from app.schemas.common import ProvenanceSchema


class FuelStatusResponse(BaseModel):
    """Station fuel runway, consumption rate, and stock reserves."""

    station_id: str
    resource_type: str = "DIESEL_LFO"
    current_stock_liters: float
    max_capacity_liters: float
    burn_rate_liters_per_hour: float
    projected_runway_days: float
    winter_target_days: float = 90.0
    resupply_gap_days: float
    provenance: ProvenanceSchema


class InventorySpareItem(BaseModel):
    """Local warehouse inventory status for critical equipment spare parts."""

    id: str
    spare_part_id: str
    part_number: str
    name: str
    description: str
    criticality: Criticality
    quantity_available: int
    quantity_reserved: int
    reorder_threshold: int
    location: str
    status: str  # "AVAILABLE", "RESERVED", "CRITICAL_SHORTAGE"
    work_order_ids: list[str] = []
    provenance: Optional[ProvenanceSchema] = None


class ResupplyOpportunityItem(BaseModel):
    """Inbound expedition vessel carrying scheduled spare parts and fuel logistics."""

    id: str
    vessel_name: str
    expected_date: datetime
    eta_days: float
    spare_part_id: str
    spare_part_number: str
    spare_part_name: str
    quantity: int
    delay_days: int = 0
    status: ResupplyStatus
    provenance: Optional[ProvenanceSchema] = None


class AssetRecoveryExposureResponse(BaseModel):
    """Deterministic recovery chain and exposure assessment for an asset."""

    asset_id: str
    asset_name: str
    criticality: str
    active_work_order_id: Optional[str] = None
    work_order_title: Optional[str] = None
    work_order_status: Optional[str] = None
    required_spare_part_number: Optional[str] = None
    required_spare_part_name: Optional[str] = None
    quantity_required: int = 0
    quantity_available: int = 0
    quantity_reserved: int = 0
    resupply_vessel_name: Optional[str] = None
    resupply_eta_days: Optional[float] = None
    exposure_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    reasoning: str
    assumptions: list[str] = []
    provenance: ProvenanceSchema


class EnergyModelResponse(BaseModel):
    """Deterministic station energy balance, thermal load, and generator dispatch model."""

    station_id: str
    outside_temp_celsius: float
    thermal_demand_kw: float
    baseline_electrical_load_kw: float
    projected_electrical_load_kw: float
    total_generation_capacity_kw: float
    available_generation_capacity_kw: float
    online_generators_count: int
    fuel_burn_rate_lph: float
    remaining_fuel_liters: float
    projected_runway_days: float
    weather_context: str
    assumptions: list[str] = []
    truth_type: str = "DERIVED"
