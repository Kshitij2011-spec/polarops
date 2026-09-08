from datetime import datetime, timedelta, timezone
import pytest
from app.models import ResupplyOpportunity, ResupplyStatus


@pytest.fixture(autouse=True)
def clean_resupply_state(db_session):
    yield
    # Clean up test-added opportunities
    db_session.query(ResupplyOpportunity).filter(
        ResupplyOpportunity.id.like("RESUPPLY-TEST%")
    ).delete(synchronize_session=False)
    # Restore canonical RESUPPLY-2026-V01
    opp = db_session.query(ResupplyOpportunity).filter(ResupplyOpportunity.id == "RESUPPLY-2026-V01").first()
    if opp:
        opp.expected_date = datetime.now(timezone.utc) + timedelta(days=11.0)
        opp.status = ResupplyStatus.IN_TRANSIT
        opp.vessel_name = "MV Vasiliy Golovnin"
    db_session.commit()


def _set_opp(db, opp_id, days, status):
    opp = db.query(ResupplyOpportunity).filter(ResupplyOpportunity.id == opp_id).first()
    assert opp is not None
    opp.expected_date = datetime.now(timezone.utc) + timedelta(days=days)
    opp.status = status
    db.commit()


def test_recovery_eta_computed_from_expected_date(db_session, client):
    """resupply_eta_days reflects expected_date, not the hardcoded 11.0."""
    _set_opp(db_session, "RESUPPLY-2026-V01", 5.0, ResupplyStatus.IN_TRANSIT)
    data = client.get("/resources/recovery/G-02").json()
    assert data["resupply_eta_days"] is not None
    assert isinstance(data["resupply_eta_days"], float)
    assert abs(data["resupply_eta_days"] - 5.0) < 0.2
    assert data["resupply_eta_days"] != 11.0


def test_resupply_listing_eta_computed_from_expected_date(db_session, client):
    """GET /resources/resupply returns eta_days derived from expected_date."""
    _set_opp(db_session, "RESUPPLY-2026-V01", 7.0, ResupplyStatus.SCHEDULED)
    res = client.get("/resources/resupply?station_id=STATION-BHARATI")
    assert res.status_code == 200
    vessel = next((i for i in res.json() if "Vasiliy" in i["vessel_name"]), None)
    assert vessel is not None
    assert abs(vessel["eta_days"] - 7.0) < 0.2
    assert vessel["eta_days"] != 11.0


def test_delivered_opportunity_excluded_from_recovery_eta(db_session, client):
    """DELIVERED opportunities are excluded; sole opp DELIVERED -> resupply_eta_days is None."""
    _set_opp(db_session, "RESUPPLY-2026-V01", 5.0, ResupplyStatus.DELIVERED)
    data = client.get("/resources/recovery/G-02").json()
    assert data["resupply_eta_days"] is None


def test_past_expected_date_clamps_to_zero(db_session, client):
    """Past expected_date must yield 0.0, not negative and not 11.0."""
    _set_opp(db_session, "RESUPPLY-2026-V01", -3.0, ResupplyStatus.IN_TRANSIT)
    data = client.get("/resources/recovery/G-02").json()
    assert data["resupply_eta_days"] == 0.0


def test_earliest_active_opportunity_selected(db_session, client):
    """Earliest non-delivered opportunity by expected_date is selected."""
    existing = db_session.query(ResupplyOpportunity).filter(
        ResupplyOpportunity.id == "RESUPPLY-2026-V01"
    ).first()
    spare_part_id = existing.spare_part_id
    existing.expected_date = datetime.now(timezone.utc) + timedelta(days=8)
    existing.vessel_name = "MV Vessel Alpha"
    existing.status = ResupplyStatus.SCHEDULED
    db_session.flush()
    opp_b = ResupplyOpportunity(
        id="RESUPPLY-TEST-EARLIEST-B",
        station_id="STATION-BHARATI",
        spare_part_id=spare_part_id,
        vessel_name="MV Vessel Beta",
        expected_date=datetime.now(timezone.utc) + timedelta(days=3),
        quantity=1,
        delay_days=0,
        status=ResupplyStatus.IN_TRANSIT,
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(opp_b)
    db_session.commit()
    data = client.get("/resources/recovery/G-02").json()
    assert data["resupply_eta_days"] is not None
    assert abs(data["resupply_eta_days"] - 3.0) < 0.2
    assert data["resupply_vessel_name"] == "MV Vessel Beta"
