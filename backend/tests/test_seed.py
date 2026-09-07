"""Tests for database seeding determinism and idempotency."""

from datetime import datetime, timezone
import pytest
from sqlalchemy.exc import IntegrityError

from app.core.seed import seed_database
from app.models import Asset, Incident, Measurement, OperationalAction, Station


def test_seed_database_idempotent(db_session):
    """Calling seed_database multiple times does not duplicate records."""
    station_count_1 = db_session.query(Station).count()
    asset_count_1 = db_session.query(Asset).count()
    meas_count_1 = db_session.query(Measurement).count()

    # Re-run seed
    seed_database(db_session)

    station_count_2 = db_session.query(Station).count()
    asset_count_2 = db_session.query(Asset).count()
    meas_count_2 = db_session.query(Measurement).count()

    assert station_count_1 == station_count_2 == 2
    assert asset_count_1 == asset_count_2 == 10  # 6 Bharati + 4 Maitri assets
    assert meas_count_1 == meas_count_2 == (25 * 4)  # 25 hourly measurements for 4 sensors


def test_seed_database_preserves_operational_actions_without_foreign_key_violation(db_session):
    """Regression test for Render PostgreSQL ForeignKeyViolation on startup / re-seeding.

    1. Seed an incident (INC-2026-04 created by baseline seed).
    2. Create an operational action referencing that incident.
    3. Re-execute seed_database (simulating Render container startup / deployment initialization).
    4. Confirm no ForeignKeyViolation occurs.
    5. Confirm the intended records remain intact (both parent incident and child action).
    6. Confirm foreign-key integrity remains actively enforced.
    """
    # 1. Verify seeded parent incident exists
    incident = db_session.query(Incident).filter(Incident.id == "INC-2026-04").first()
    assert incident is not None
    assert incident.id == "INC-2026-04"

    # 2. Create an operational action referencing INC-2026-04
    action = OperationalAction(
        id="ACT-REGRESSION-001",
        incident_id="INC-2026-04",
        action_code="EXPEDITE_VALVE_PURGE",
        description="Operator purged primary fuel bypass valve on manifold 3B.",
        executed_by="Station Lead Engineer",
        executed_at=datetime.now(timezone.utc),
        outcome_status="COMPLETED",
    )
    db_session.add(action)
    db_session.commit()

    # 3. Execute startup / seed behavior again (same path that crashed Render)
    seed_database(db_session)

    # 4. Confirm no ForeignKeyViolation occurred and records are preserved
    inc_after = db_session.query(Incident).filter(Incident.id == "INC-2026-04").first()
    assert inc_after is not None
    assert inc_after.id == "INC-2026-04"

    action_after = db_session.query(OperationalAction).filter(OperationalAction.id == "ACT-REGRESSION-001").first()
    assert action_after is not None
    assert action_after.incident_id == "INC-2026-04"
    assert action_after.action_code == "EXPEDITE_VALVE_PURGE"

    # 5. Confirm foreign-key integrity is actively enforced by database engine
    # (Attempting to insert an operational action pointing to a non-existent incident MUST fail)
    invalid_action = OperationalAction(
        id="ACT-INVALID-FK-TEST",
        incident_id="NON-EXISTENT-INCIDENT-999",
        action_code="INVALID_TEST",
        description="Should fail foreign key constraint",
        executed_by="Automated Test",
        executed_at=datetime.now(timezone.utc),
        outcome_status="FAILED",
    )
    db_session.add(invalid_action)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

