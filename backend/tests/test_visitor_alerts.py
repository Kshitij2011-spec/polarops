"""Tests for anonymous, privacy-minimal visitor session alerts."""

import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient
import httpx

from app.core.config import settings
from app.main import app
from app.schemas.visitor import VisitorSessionResponse
from app.services.mailgun_service import (
    format_duration,
    format_ist_timestamp,
    generate_email_text,
    send_visitor_alert_email,
)
from app.services.visitor_session_service import visitor_session_manager

client = TestClient(app)

VALID_SESSION_ID = "anon-sess-uuid-1234-5678-abcdef"


@pytest.fixture(autouse=True)
def reset_session_state():
    """Ensure in-memory manager state is clean for each test."""
    visitor_session_manager.reset_state_for_tests()
    yield
    visitor_session_manager.reset_state_for_tests()


# 1. start creates session
def test_start_creates_session():
    """POST /visitor/event with start creates an anonymous in-memory session."""
    res = client.post(
        "/visitor/event",
        json={
            "session_id": VALID_SESSION_ID,
            "route": "/",
            "event_type": "start",
        },
    )
    assert res.status_code == 200
    assert res.json() == {"ok": True}

    with visitor_session_manager._lock:
        session = visitor_session_manager._sessions.get(VALID_SESSION_ID)
        assert session is not None
        assert session.session_id == VALID_SESSION_ID
        assert session.page_count == 1
        assert session.last_route == "/"
        assert session.email_sent is False
        assert session.route_sequence == ["/"]


# 2. heartbeat updates last_active
def test_heartbeat_updates_last_active():
    """POST /visitor/event with heartbeat updates last_active timestamp."""
    visitor_session_manager.record_event(VALID_SESSION_ID, "/", "start")

    with visitor_session_manager._lock:
        initial_active = visitor_session_manager._sessions[VALID_SESSION_ID].last_active
        # Artificially set initial time slightly in past
        visitor_session_manager._sessions[VALID_SESSION_ID].last_active = initial_active - timedelta(seconds=10)
        past_active = visitor_session_manager._sessions[VALID_SESSION_ID].last_active

    res = client.post(
        "/visitor/event",
        json={
            "session_id": VALID_SESSION_ID,
            "route": "/",
            "event_type": "heartbeat",
        },
    )
    assert res.status_code == 200
    with visitor_session_manager._lock:
        updated_active = visitor_session_manager._sessions[VALID_SESSION_ID].last_active
        assert updated_active > past_active


# 3. route event updates page count and last route
def test_route_event_updates_page_count_and_last_route():
    """Navigating to a different route increments page_count and updates last_route."""
    client.post(
        "/visitor/event",
        json={"session_id": VALID_SESSION_ID, "route": "/", "event_type": "start"},
    )
    client.post(
        "/visitor/event",
        json={"session_id": VALID_SESSION_ID, "route": "/assets/G-02", "event_type": "route"},
    )

    with visitor_session_manager._lock:
        session = visitor_session_manager._sessions[VALID_SESSION_ID]
        assert session.page_count == 2
        assert session.last_route == "/assets/G-02"
        assert session.route_sequence == ["/", "/assets/G-02"]


# 4. duplicate same route does not create erroneous duplicate page count
def test_duplicate_same_route_does_not_create_duplicate_page_count():
    """Navigating to the same route repeatedly does not increment page_count."""
    client.post(
        "/visitor/event",
        json={"session_id": VALID_SESSION_ID, "route": "/scenarios", "event_type": "start"},
    )
    # Send route event with exact same route
    client.post(
        "/visitor/event",
        json={"session_id": VALID_SESSION_ID, "route": "/scenarios", "event_type": "route"},
    )

    with visitor_session_manager._lock:
        session = visitor_session_manager._sessions[VALID_SESSION_ID]
        assert session.page_count == 1
        assert session.last_route == "/scenarios"


# 5. complete calculates approximate duration
def test_complete_calculates_approximate_duration():
    """Completion calculates duration correctly and uses 'approximately' format."""
    now = datetime.now(timezone.utc)
    started = now - timedelta(seconds=75)  # 1m 15s

    visitor_session_manager.record_event(VALID_SESSION_ID, "/", "start")
    with visitor_session_manager._lock:
        visitor_session_manager._sessions[VALID_SESSION_ID].started_at = started
        visitor_session_manager._sessions[VALID_SESSION_ID].page_count = 3
        visitor_session_manager._sessions[VALID_SESSION_ID].last_route = "/resilience"

    payload = visitor_session_manager.complete_session(VALID_SESSION_ID, "/resilience")
    assert payload is not None
    assert payload["duration_seconds"] >= 74.0
    assert payload["page_count"] == 3
    assert payload["first_page"] == "/"
    assert payload["last_page"] == "/resilience"

    duration_text = format_duration(payload["duration_seconds"])
    assert "approximately" in duration_text
    assert "1m 15s" in duration_text

    email_body = generate_email_text(
        payload["duration_seconds"],
        payload["page_count"],
        payload["first_page"],
        payload["last_page"],
        payload["started_at"],
    )
    assert "PolarOps visitor detected" in email_body
    assert "Session duration: approximately" in email_body
    assert "No visitor identity information was collected." in email_body


# 6. repeated complete sends at most one email
def test_repeated_complete_sends_at_most_one_email():
    """Subsequent completion calls on the same session return None to prevent duplicate dispatch."""
    visitor_session_manager.record_event(VALID_SESSION_ID, "/", "start")
    with visitor_session_manager._lock:
        visitor_session_manager._sessions[VALID_SESSION_ID].started_at = (
            datetime.now(timezone.utc) - timedelta(seconds=30)
        )
        visitor_session_manager._sessions[VALID_SESSION_ID].page_count = 2

    # First complete returns eligible payload
    first_payload = visitor_session_manager.complete_session(VALID_SESSION_ID, "/resilience")
    assert first_payload is not None

    # Second complete returns None
    second_payload = visitor_session_manager.complete_session(VALID_SESSION_ID, "/resilience")
    assert second_payload is None


# 7. global cooldown suppresses second session
def test_global_cooldown_suppresses_second_session():
    """After dispatching an email, other sessions within cooldown window are suppressed."""
    sess1 = "anon-sess-uuid-first-111111111111"
    sess2 = "anon-sess-uuid-second-22222222222"

    visitor_session_manager.record_event(sess1, "/", "start")
    with visitor_session_manager._lock:
        visitor_session_manager._sessions[sess1].started_at = (
            datetime.now(timezone.utc) - timedelta(seconds=60)
        )
        visitor_session_manager._sessions[sess1].page_count = 3

    visitor_session_manager.record_event(sess2, "/", "start")
    with visitor_session_manager._lock:
        visitor_session_manager._sessions[sess2].started_at = (
            datetime.now(timezone.utc) - timedelta(seconds=60)
        )
        visitor_session_manager._sessions[sess2].page_count = 3

    # Complete session 1 -> triggers email reservation
    payload1 = visitor_session_manager.complete_session(sess1)
    assert payload1 is not None

    # Immediate complete of session 2 -> suppressed by cooldown
    payload2 = visitor_session_manager.complete_session(sess2)
    assert payload2 is None


# 8. short one-page session is suppressed
def test_short_one_page_session_is_suppressed():
    """Sessions with duration < 3s and page_count <= 1 are suppressed as immediate bounces."""
    visitor_session_manager.record_event(VALID_SESSION_ID, "/", "start")
    # Immediate complete (duration < 3s, page_count == 1)
    payload = visitor_session_manager.complete_session(VALID_SESSION_ID)
    assert payload is None


# 9. expired sessions are cleaned up/finalized
def test_expired_sessions_are_cleaned_up_finalized():
    """Inactive sessions past SESSION_TIMEOUT_MINUTES are opportunistically finalized."""
    past_time = datetime.now(timezone.utc) - timedelta(minutes=settings.SESSION_TIMEOUT_MINUTES + 1)
    visitor_session_manager.record_event(VALID_SESSION_ID, "/", "start")

    with visitor_session_manager._lock:
        sess = visitor_session_manager._sessions[VALID_SESSION_ID]
        sess.started_at = past_time - timedelta(seconds=60)
        sess.last_active = past_time
        sess.page_count = 3

    # Run cleanup
    payloads = visitor_session_manager.cleanup_and_finalize_expired()
    assert len(payloads) == 1
    assert payloads[0]["page_count"] == 3
    assert payloads[0]["first_page"] == "/"

    with visitor_session_manager._lock:
        assert visitor_session_manager._sessions[VALID_SESSION_ID].email_sent is True


# 10. Mailgun 200 response succeeds
@pytest.mark.asyncio
async def test_mailgun_200_response_succeeds(monkeypatch):
    """Mock HTTP 200 from Mailgun returns True."""
    monkeypatch.setattr(settings, "MAILGUN_API_KEY", "key-test123456789")
    monkeypatch.setattr(settings, "MAILGUN_DOMAIN", "sandbox-test.mailgun.org")
    monkeypatch.setattr(settings, "MAILGUN_RECIPIENT_EMAIL", "recipient@example.com")

    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        success = await send_visitor_alert_email(
            duration_seconds=120.0,
            page_count=4,
            first_page="/",
            last_page="/resilience",
            started_at=datetime.now(timezone.utc),
        )
        assert success is True
        mock_post.assert_called_once()
        # Verify auth used basic auth ("api", key)
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["auth"] == ("api", "key-test123456789")


# 11. Mailgun 4xx does not crash endpoint
@pytest.mark.asyncio
async def test_mailgun_4xx_does_not_crash_endpoint(monkeypatch):
    """Mailgun 4xx returns False gracefully without raising."""
    monkeypatch.setattr(settings, "MAILGUN_API_KEY", "key-test123456789")
    monkeypatch.setattr(settings, "MAILGUN_DOMAIN", "sandbox-test.mailgun.org")
    monkeypatch.setattr(settings, "MAILGUN_RECIPIENT_EMAIL", "recipient@example.com")

    mock_resp = MagicMock()
    mock_resp.status_code = 401

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        success = await send_visitor_alert_email(
            duration_seconds=120.0,
            page_count=4,
            first_page="/",
            last_page="/resilience",
            started_at=datetime.now(timezone.utc),
        )
        assert success is False


# 12. Mailgun 5xx does not crash endpoint
@pytest.mark.asyncio
async def test_mailgun_5xx_does_not_crash_endpoint(monkeypatch):
    """Mailgun 5xx returns False gracefully without raising."""
    monkeypatch.setattr(settings, "MAILGUN_API_KEY", "key-test123456789")
    monkeypatch.setattr(settings, "MAILGUN_DOMAIN", "sandbox-test.mailgun.org")
    monkeypatch.setattr(settings, "MAILGUN_RECIPIENT_EMAIL", "recipient@example.com")

    mock_resp = MagicMock()
    mock_resp.status_code = 500

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        success = await send_visitor_alert_email(
            duration_seconds=120.0,
            page_count=4,
            first_page="/",
            last_page="/resilience",
            started_at=datetime.now(timezone.utc),
        )
        assert success is False


# 13. Mailgun timeout does not crash endpoint
@pytest.mark.asyncio
async def test_mailgun_timeout_does_not_crash_endpoint(monkeypatch):
    """Mailgun timeout is caught and logged, returning False."""
    monkeypatch.setattr(settings, "MAILGUN_API_KEY", "key-test123456789")
    monkeypatch.setattr(settings, "MAILGUN_DOMAIN", "sandbox-test.mailgun.org")
    monkeypatch.setattr(settings, "MAILGUN_RECIPIENT_EMAIL", "recipient@example.com")

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("timeout")):
        success = await send_visitor_alert_email(
            duration_seconds=120.0,
            page_count=4,
            first_page="/",
            last_page="/resilience",
            started_at=datetime.now(timezone.utc),
        )
        assert success is False


# 14. missing configuration fails safely
@pytest.mark.asyncio
async def test_missing_configuration_fails_safely(monkeypatch):
    """When Mailgun credentials are empty, sending fails safely without HTTP call."""
    monkeypatch.setattr(settings, "MAILGUN_API_KEY", "")
    monkeypatch.setattr(settings, "MAILGUN_RECIPIENT_EMAIL", "")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        success = await send_visitor_alert_email(
            duration_seconds=60.0,
            page_count=2,
            first_page="/",
            last_page="/",
            started_at=datetime.now(timezone.utc),
        )
        assert success is False
        mock_post.assert_not_called()


# 15. API responses never contain the API key
def test_api_responses_never_contain_the_api_key(monkeypatch):
    """Verify responses from visitor endpoints never leak secret credentials."""
    secret = "secret-super-key-XYZ987654321"
    monkeypatch.setattr(settings, "MAILGUN_API_KEY", secret)

    res1 = client.post(
        "/visitor/event",
        json={"session_id": VALID_SESSION_ID, "route": "/", "event_type": "start"},
    )
    assert secret not in res1.text
    for val in res1.headers.values():
        assert secret not in val

    res2 = client.post(
        "/visitor/complete",
        json={"session_id": VALID_SESSION_ID, "route": "/"},
    )
    assert secret not in res2.text
    for val in res2.headers.values():
        assert secret not in val


# 16. invalid session payload rejected
def test_invalid_session_payload_rejected():
    """Payloads with short session_id or missing fields are rejected with 422."""
    res = client.post(
        "/visitor/event",
        json={"session_id": "too-short", "route": "/", "event_type": "start"},
    )
    assert res.status_code == 422


# 17. invalid event_type rejected
def test_invalid_event_type_rejected():
    """Payloads with disallowed event_type are rejected with 422."""
    res = client.post(
        "/visitor/event",
        json={
            "session_id": VALID_SESSION_ID,
            "route": "/",
            "event_type": "unauthorized_action",
        },
    )
    assert res.status_code == 422


# 18. privacy test confirms no IP/user-agent fields are accepted/stored
def test_privacy_confirms_no_ip_or_user_agent_accepted_or_stored():
    """Strict schema validation rejects any attempt to pass IP, user_agent, or PII."""
    # Attempt to inject IP or User-Agent into event request
    res = client.post(
        "/visitor/event",
        json={
            "session_id": VALID_SESSION_ID,
            "route": "/",
            "event_type": "start",
            "ip": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "email": "visitor@example.com",
        },
    )
    # Must be 422 Unprocessable Entity because extra='forbid'
    assert res.status_code == 422

    # Attempt to inject into complete request
    res_complete = client.post(
        "/visitor/complete",
        json={
            "session_id": VALID_SESSION_ID,
            "route": "/",
            "ip": "192.168.1.1",
        },
    )
    assert res_complete.status_code == 422

    # Verify VisitorSession dataclass attributes do not have any tracking fields
    visitor_session_manager.record_event(VALID_SESSION_ID, "/", "start")
    with visitor_session_manager._lock:
        session = visitor_session_manager._sessions[VALID_SESSION_ID]
        stored_fields = dir(session)
        assert "ip" not in stored_fields
        assert "user_agent" not in stored_fields
        assert "location" not in stored_fields
        assert "geo" not in stored_fields
        assert "name" not in stored_fields
        assert "email" not in stored_fields
