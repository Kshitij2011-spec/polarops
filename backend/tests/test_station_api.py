"""Integration tests for /station/overview endpoint."""


def test_station_overview_bharati(client):
    """GET /station/overview returns structured situation awareness payload."""
    response = client.get("/station/overview?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()

    assert data["station_id"] == "STATION-BHARATI"
    assert data["name"] == "Bharati Research Station"
    assert data["environment_mode"] == "WINTER"
    assert "overall_health_score" in data
    assert data["active_incidents_count"] >= 1

    # Weather
    weather = data["ambient_weather"]
    assert "temperature_celsius" in weather
    assert "wind_speed_knots" in weather
    assert "provenance" in weather
    assert weather["provenance"]["truth_type"] == "MEASURED"
    assert weather["provenance"]["source"] == "SYNTHETIC_SIMULATION"

    # Subsystem summary
    subsystems = data["subsystem_summary"]
    subsystem_codes = [s["code"] for s in subsystems]
    assert "POWER_GEN" in subsystem_codes
    assert "THERMAL_LOOP" in subsystem_codes
    assert "LIFE_SUPPORT" in subsystem_codes
    assert "SAT_COMMS" in subsystem_codes


def test_station_overview_not_found(client):
    """GET /station/overview with unknown station returns 404."""
    response = client.get("/station/overview?station_id=UNKNOWN-STATION")
    assert response.status_code == 404
