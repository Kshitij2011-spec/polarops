"""Cross-domain resources, fuel runway, warehouse inventory, and resupply logistics API router."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.resource import (
    AssetRecoveryExposureResponse,
    EnergyModelResponse,
    FuelStatusResponse,
    InventorySpareItem,
    ResupplyOpportunityItem,
)
from app.services.energy_service import calculate_energy_balance
from app.services.resource_service import (
    get_asset_recovery_exposure,
    get_station_fuel_status,
    list_station_inventory,
    list_station_resupply,
)

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.get("/fuel", response_model=FuelStatusResponse)
def get_fuel_status(
    station_id: str = Query(default="STATION-BHARATI", description="Station ID"),
    db: Session = Depends(get_db),
) -> FuelStatusResponse:
    """Retrieve station fuel stock, hourly burn rate, and calculated operational runway."""
    fuel = get_station_fuel_status(db, station_id=station_id)
    if not fuel:
        raise HTTPException(
            status_code=404,
            detail=f"Fuel stock records not found for station '{station_id}'.",
        )
    return fuel


@router.get("/inventory", response_model=list[InventorySpareItem])
def get_inventory_items(
    station_id: str = Query(default="STATION-BHARATI", description="Station ID"),
    db: Session = Depends(get_db),
) -> list[InventorySpareItem]:
    """Retrieve list of critical equipment spare parts in warehouse inventory."""
    return list_station_inventory(db, station_id=station_id)


@router.get("/resupply", response_model=list[ResupplyOpportunityItem])
def get_resupply_opportunities(
    station_id: str = Query(default="STATION-BHARATI", description="Station ID"),
    db: Session = Depends(get_db),
) -> list[ResupplyOpportunityItem]:
    """Retrieve scheduled inbound resupply expedition vessels and aviation flights."""
    return list_station_resupply(db, station_id=station_id)


@router.get("/energy", response_model=EnergyModelResponse)
def get_energy_balance(
    station_id: str = Query(default="STATION-BHARATI", description="Station ID"),
    ambient_temp_override: Optional[float] = Query(
        default=None,
        description="Optional outside temperature override in °C for cold-snap modeling",
    ),
    db: Session = Depends(get_db),
) -> EnergyModelResponse:
    """Retrieve deterministic station energy balance, thermal demand, and generator capacity model."""
    return calculate_energy_balance(
        db,
        station_id=station_id,
        ambient_temp_override=ambient_temp_override,
    )


@router.get("/recovery/{asset_id}", response_model=AssetRecoveryExposureResponse)
def get_recovery_exposure(
    asset_id: str,
    db: Session = Depends(get_db),
) -> AssetRecoveryExposureResponse:
    """Retrieve deterministic recovery chain and exposure level for an asset."""
    exposure = get_asset_recovery_exposure(db, asset_id=asset_id)
    if not exposure:
        raise HTTPException(
            status_code=404,
            detail=f"Asset with ID '{asset_id}' was not found.",
        )
    return exposure
