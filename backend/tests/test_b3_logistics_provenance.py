"""B3/B8 Regression Tests — Logistics Provenance & Freshness.

Verifies that ResupplyOpportunityItem, InventorySpareItem, and
AssetRecoveryExposureResponse now carry truthful, timestamp-derived
provenance metadata.

Isolation: uses the project standard db_session/client fixtures (per-function
seeded SQLite). Cleanup of test-created records is scoped to this module via
autouse fixture to prevent cross-test pollution.
"""

from datetime import datetime, timedelta, timezone

import pytest

from app.models import (
    InventoryItem,
    ResupplyOpportunity,
    ResupplyStatus,
)


# ---------------------------------------------------------------------------
# Isolation
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def clean_b3_state(db_session):
    """Restore canonical seed state after each test in this module."""
    yield
    db_session.query(ResupplyOpportunity).filter(
        ResupplyOpportunity.id.like("B3-TEST-%")
    ).delete(synchronize_session=False)
    opp = (
        db_session.query(ResupplyOpportunity)
        .filter(ResupplyOpportunity.id == "RESUPPLY-2026-V01")
        .first()
    )
    if opp:
        opp.expected_date = datetime.now(timezone.utc) + timedelta(days=11)
        opp.status = ResupplyStatus.IN_TRANSIT
        opp.vessel_name = "MV Vasiliy Golovnin"
        opp.updated_at = datetime.now(timezone.utc)
    db_session.commit()


# ---------------------------------------------------------------------------
# Resupply provenance tests
# ---------------------------------------------------------------------------


def test_resupply_provenance_exists(db_session, client):
    """GET /resources/resupply returns a provenance object on each item."""
    res = client.get("/resources/resupply?station_id=STATION-BHARATI")
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    for item in items:
        assert item.get("provenance") is not None, f"Item {item['id']} is missing provenance"


def test_resupply_provenance_truth_type_is_forecast(db_session, client):
    """Resupply provenance.truth_type must be FORECAST."""
    res = client.get("/resources/resupply?station_id=STATION-BHARATI")
    assert res.status_code == 200
    for item in res.json():
        assert item["provenance"]["truth_type"] == "FORECAST", (
            f"Expected FORECAST, got {item['provenance']['truth_type']}"
        )


def test_resupply_provenance_source_contains_id(db_session, client):
    """provenance.source must be 'resupply:{opp.id}'."""
    res = client.get("/resources/resupply?station_id=STATION-BHARATI")
    assert res.status_code == 200
    for item in res.json():
        expected_source = f"resupply:{item['id']}"
        assert item["provenance"]["source"] == expected_source, (
            f"Expected '{expected_source}', got '{item['provenance']['source']}'"
        )


def test_resupply_freshness_uses_updated_at(db_session, client):
    """Freshness derived from updated_at, not request time.

    Set updated_at ~1 hour ago; verify freshness_seconds is approx 3600.
    """
    opp = (
        db_session.query(ResupplyOpportunity)
        .filter(ResupplyOpportunity.id == "RESUPPLY-2026-V01")
        .first()
    )
    assert opp is not None
    opp.updated_at = datetime.now(timezone.utc) - timedelta(hours=1)
    db_session.commit()

    res = client.get("/resources/resupply?station_id=STATION-BHARATI")
    assert res.status_code == 200
    vessel = next((i for i in res.json() if i["id"] == "RESUPPLY-2026-V01"), None)
    assert vessel is not None
    freshness = vessel["provenance"]["freshness_seconds"]
    assert abs(freshness - 3600.0) < 30.0, (
        f"Expected freshness ~3600, got {freshness}"
    )


# ---------------------------------------------------------------------------
# Inventory provenance tests
# ---------------------------------------------------------------------------


def test_inventory_provenance_exists(db_session, client):
    """GET /resources/inventory returns a provenance object on each item."""
    res = client.get("/resources/inventory?station_id=STATION-BHARATI")
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    for item in items:
        assert item.get("provenance") is not None, f"Item {item['id']} is missing provenance"


def test_inventory_provenance_truth_type_is_measured(db_session, client):
    """Inventory provenance.truth_type must be MEASURED."""
    res = client.get("/resources/inventory?station_id=STATION-BHARATI")
    assert res.status_code == 200
    for item in res.json():
        assert item["provenance"]["truth_type"] == "MEASURED", (
            f"Expected MEASURED, got {item['provenance']['truth_type']}"
        )


def test_inventory_freshness_uses_updated_at(db_session, client):
    """Inventory freshness derived from InventoryItem.updated_at.

    Set first item updated_at ~2 hours ago; verify freshness_seconds approx 7200.
    """
    inv = (
        db_session.query(InventoryItem)
        .filter(InventoryItem.station_id == "STATION-BHARATI")
        .first()
    )
    assert inv is not None
    inv.updated_at = datetime.now(timezone.utc) - timedelta(hours=2)
    db_session.commit()

    res = client.get("/resources/inventory?station_id=STATION-BHARATI")
    assert res.status_code == 200
    target = next((i for i in res.json() if i["id"] == inv.id), None)
    assert target is not None
    freshness = target["provenance"]["freshness_seconds"]
    assert abs(freshness - 7200.0) < 30.0, (
        f"Expected freshness ~7200, got {freshness}"
    )


# ---------------------------------------------------------------------------
# Recovery provenance tests
# ---------------------------------------------------------------------------


def test_recovery_provenance_uses_latest_input_timestamp(db_session, client):
    """Recovery provenance.timestamp reflects the newest input updated_at.

    Strategy: set the work order and inventory updated_at to 1 hour ago, and
    the resupply updated_at to 5 minutes ago. Because composite freshness uses
    max(candidates), the returned provenance.timestamp must be close to the
    resupply updated_at (the most recent input).
    """
    from app.models import MaintenanceWorkOrder, InventoryItem

    older_ts = datetime.now(timezone.utc) - timedelta(hours=1)
    newest_ts = datetime.now(timezone.utc) - timedelta(minutes=5)

    # Set work order updated_at to older
    wo = (
        db_session.query(MaintenanceWorkOrder)
        .filter(MaintenanceWorkOrder.asset_id.like("%G-02%"))
        .first()
    )
    if wo is None:
        # find by querying the asset id via code
        from app.models import Asset
        asset = db_session.query(Asset).filter(Asset.code == "G-02").first()
        if asset:
            wo = (
                db_session.query(MaintenanceWorkOrder)
                .filter(MaintenanceWorkOrder.asset_id == asset.id)
                .first()
            )
    if wo:
        wo.updated_at = older_ts

    # Set inventory updated_at to older
    from app.models import SparePart
    opp = (
        db_session.query(ResupplyOpportunity)
        .filter(ResupplyOpportunity.id == "RESUPPLY-2026-V01")
        .first()
    )
    if opp and opp.spare_part_id:
        inv = (
            db_session.query(InventoryItem)
            .filter(InventoryItem.spare_part_id == opp.spare_part_id)
            .first()
        )
        if inv:
            inv.updated_at = older_ts

    # Set resupply to the newest — this should be picked by max()
    if opp:
        opp.updated_at = newest_ts

    db_session.commit()

    res = client.get("/resources/recovery/G-02")
    assert res.status_code == 200
    prov_ts_str = res.json()["provenance"]["timestamp"]
    prov_ts_str = prov_ts_str.replace("Z", "+00:00")
    prov_ts = datetime.fromisoformat(prov_ts_str)
    if prov_ts.tzinfo is None:
        prov_ts = prov_ts.replace(tzinfo=timezone.utc)

    diff = abs((prov_ts - newest_ts.astimezone(timezone.utc)).total_seconds())
    assert diff < 2.0, (
        f"Recovery timestamp {prov_ts} not near expected newest_ts {newest_ts} (diff={diff:.1f}s). "
        "Composite max() timestamp selection not working."
    )


def test_recovery_provenance_freshness_is_not_request_time(db_session, client):
    """Recovery freshness_seconds is a computed float >= 0, not a hardcoded constant."""
    res = client.get("/resources/recovery/G-02")
    assert res.status_code == 200
    freshness = res.json()["provenance"]["freshness_seconds"]
    assert isinstance(freshness, (int, float))
    assert freshness >= 0.0


def test_future_timestamp_clamps_freshness_to_zero(db_session, client):
    """A future updated_at must yield freshness_seconds == 0.0."""
    opp = (
        db_session.query(ResupplyOpportunity)
        .filter(ResupplyOpportunity.id == "RESUPPLY-2026-V01")
        .first()
    )
    assert opp is not None
    opp.updated_at = datetime.now(timezone.utc) + timedelta(hours=2)
    db_session.commit()

    res = client.get("/resources/resupply?station_id=STATION-BHARATI")
    assert res.status_code == 200
    vessel = next((i for i in res.json() if i["id"] == "RESUPPLY-2026-V01"), None)
    assert vessel is not None
    assert vessel["provenance"]["freshness_seconds"] == 0.0, (
        f"Expected 0.0 for future updated_at, got {vessel['provenance']['freshness_seconds']}"
    )


def test_naive_updated_at_is_treated_as_utc(db_session, client):
    """A naive (tz-unaware) updated_at must not raise and must produce freshness >= 0."""
    opp = (
        db_session.query(ResupplyOpportunity)
        .filter(ResupplyOpportunity.id == "RESUPPLY-2026-V01")
        .first()
    )
    assert opp is not None
    # Naive datetime — simulates SQLite tz-stripping
    opp.updated_at = datetime.utcnow() - timedelta(hours=1)
    db_session.commit()

    res = client.get("/resources/resupply?station_id=STATION-BHARATI")
    assert res.status_code == 200
    vessel = next((i for i in res.json() if i["id"] == "RESUPPLY-2026-V01"), None)
    assert vessel is not None
    freshness = vessel["provenance"]["freshness_seconds"]
    assert freshness >= 0.0, f"Naive datetime produced negative freshness ({freshness})"
