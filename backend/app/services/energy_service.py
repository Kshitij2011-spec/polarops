"""Domain service for deterministic, explainable Antarctic station energy and fuel runway modeling."""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.models import (
    Asset,
    AssetCategory,
    AssetStatus,
    EnergyResource,
    Station,
    WeatherObservation,
)
from app.schemas.resource import EnergyModelResponse


def calculate_energy_balance(
    db: Session,
    station_id: str = "STATION-BHARATI",
    ambient_temp_override: Optional[float] = None,
    asset_offline_ids: Optional[list[str]] = None,
) -> EnergyModelResponse:
    """Compute deterministic station energy balance, thermal demand, generator capacity, and fuel runway.

    Formulas & Assumptions ([OUR DESIGN] Synthetic prototype energy model):
    1. Thermal Demand: Q_th = Heat Loss Coefficient (5.2 kW/°C) * (Indoor Target 20°C - Ambient Temp).
    2. Electrical Load: Base load (180 kW) + Electric heating auxiliary (2.5 kW/°C below -20°C).
    3. Generator Dispatch: Sum of capacity of active generators (excluding any offline assets).
    4. Fuel Burn: Specific fuel consumption based on load factor:
       Burn Rate (L/h) = Base Idle Burn (25 L/h) + 0.265 L/kWh * Total Generated Load (kW).
    5. Runway: Remaining Fuel Liters / (Burn Rate L/h * 24 h/day).
    """
    offline_ids = asset_offline_ids or []

    # 1. Environment & Ambient Temperature
    weather = (
        db.query(WeatherObservation)
        .filter(WeatherObservation.station_id == station_id)
        .order_by(WeatherObservation.timestamp.desc())
        .first()
    )
    ambient_temp = ambient_temp_override
    if ambient_temp is None:
        ambient_temp = weather.temperature_celsius if weather else -28.5

    # 2. Thermal Demand (kW equivalent)
    indoor_target = 20.0
    delta_t = max(0.0, indoor_target - ambient_temp)
    # 5.2 kW per degree temperature difference for station habitat envelope
    thermal_demand_kw = round(5.2 * delta_t, 1)

    # 3. Electrical Load Calculation
    base_electrical_kw = 180.0
    cold_load_factor = 2.5 * max(0.0, -20.0 - ambient_temp)  # auxiliary heat tracing
    modeled_load_kw = round(base_electrical_kw + cold_load_factor, 1)

    # 4. Generator Fleet & Modeled Capacity
    generators = (
        db.query(Asset)
        .filter(
            Asset.station_id == station_id,
            Asset.category == AssetCategory.GENERATOR,
        )
        .all()
    )

    total_capacity = 0.0
    available_capacity = 0.0
    online_count = 0

    for gen in generators:
        # Rated capacity: 300 kW per genset in prototype fleet
        rated_kw = 300.0
        total_capacity += rated_kw
        is_offline = (gen.id in offline_ids) or (gen.code in offline_ids)
        if not is_offline:
            available_capacity += rated_kw
            online_count += 1

    # 5. Fuel Stock & Burn Rate
    diesel = (
        db.query(EnergyResource)
        .filter(
            EnergyResource.station_id == station_id,
            EnergyResource.resource_type == "DIESEL_LFO",
        )
        .first()
    )
    current_fuel = diesel.current_quantity if diesel else 142500.0

    # Fuel burn rate model: 25 L/h idle base + 0.265 L/kWh load dispatch
    actual_dispatched_load = min(modeled_load_kw, available_capacity) if available_capacity > 0 else 0.0
    burn_rate_lph = round(25.0 + (0.265 * actual_dispatched_load), 1)

    # 6. Projected Fuel Runway
    runway_days = round(current_fuel / (burn_rate_lph * 24.0), 1) if burn_rate_lph > 0 else 0.0

    weather_desc = f"Ambient {ambient_temp:.1f}°C"
    if ambient_temp <= -35.0:
        weather_desc += " · SEVERE COLD SNAP"
    elif ambient_temp <= -25.0:
        weather_desc += " · POLAR WINTER"
    else:
        weather_desc += " · MODERATE"

    assumptions = [
        "[OUR DESIGN] Synthetic prototype energy model with transparent linear dispatch rules.",
        "Thermal heat-loss coefficient = 5.2 kW/°C relative to +20°C indoor habitat comfort target.",
        "Generator specific fuel consumption rate = 25.0 L/h base + 0.265 L/kWh electrical load.",
        "Runway = remaining fuel / (hourly burn rate * 24 h).",
    ]

    return EnergyModelResponse(
        station_id=station_id,
        outside_temp_celsius=round(ambient_temp, 1),
        thermal_demand_kw=thermal_demand_kw,
        baseline_electrical_load_kw=180.0,
        projected_electrical_load_kw=modeled_load_kw,
        total_generation_capacity_kw=total_capacity,
        available_generation_capacity_kw=available_capacity,
        online_generators_count=online_count,
        fuel_burn_rate_lph=burn_rate_lph,
        remaining_fuel_liters=round(current_fuel, 1),
        projected_runway_days=runway_days,
        weather_context=weather_desc,
        assumptions=assumptions,
        truth_type="DERIVED",
    )
