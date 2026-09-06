"""Tests for database seeding determinism and idempotency."""

from app.core.seed import seed_database
from app.models import Asset, Measurement, Station


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
    assert asset_count_1 == asset_count_2 == 6
    assert meas_count_1 == meas_count_2 == (25 * 4)  # 25 hourly measurements for 4 sensors
