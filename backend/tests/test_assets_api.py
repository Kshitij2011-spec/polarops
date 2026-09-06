"""Integration tests for /assets, /assets/{id}, and /assets/{id}/dependencies endpoints."""


def test_list_assets(client):
    """GET /assets returns list of station equipment."""
    response = client.get("/assets?station_id=STATION-BHARATI")
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) >= 5

    codes = [a["code"] for a in assets]
    assert "G-02" in codes
    assert "G-01" in codes
    assert "B-01" in codes


def test_get_asset_detail_g02(client):
    """GET /assets/G-02 returns metrics, warning thresholds, and provenance."""
    response = client.get("/assets/G-02")
    assert response.status_code == 200
    data = response.json()

    assert data["asset_id"] == "G-02"
    assert data["code"] == "G-02"
    assert data["status"] == "WARNING"
    assert data["health_score"] == 62

    # Check metrics
    metrics = {m["key"]: m for m in data["metrics"]}
    assert "bearing_vibration_mm_s" in metrics
    vib = metrics["bearing_vibration_mm_s"]
    assert vib["value"] == 4.8
    assert vib["status"] == "WARNING"
    assert vib["warning_threshold"] == 4.0

    # Provenance
    assert "provenance" in data
    assert data["provenance"]["truth_type"] == "MEASURED"
    assert data["provenance"]["quality"] == "GOOD"


def test_get_asset_dependencies_g02(client):
    """GET /assets/G-02/dependencies returns downstream impacted services and zones."""
    response = client.get("/assets/G-02/dependencies")
    assert response.status_code == 200
    data = response.json()

    assert data["asset_id"] == "G-02"
    assert "downstream_impact" in data
    impact = data["downstream_impact"]

    # Affected services
    service_codes = [s["code"] for s in impact["affected_services"]]
    assert "HABITAT_HEATING_Z2" in service_codes

    # Affected zones
    assert "ZONE-HABITAT-2" in impact["affected_zones"]


def test_get_nonexistent_asset(client):
    """GET /assets/NONEXISTENT returns 404."""
    response = client.get("/assets/NONEXISTENT")
    assert response.status_code == 404
