import asyncio
import pytest
from httpx import ASGITransport, AsyncClient

from sentinel.api import routes
from sentinel.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_daemon_status(client: AsyncClient):
    response = await client.get("/daemon/status")
    assert response.status_code == 200
    data = response.json()
    assert data["running"] is True
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_session_lifecycle(client: AsyncClient):
    # 1. Start Session
    start_resp = await client.post(
        "/daemon/session/start",
        json={
            "agent_id": "claude-code",
            "task_description": "Fix bug in auth",
            "granted_paths": ["d:/GitHub/SentinelAI", "~/project"],
        },
    )
    assert start_resp.status_code == 200
    session_data = start_resp.json()
    session_id = session_data["session_id"]
    assert session_id is not None

    # Check status reflects active session
    status_resp = await client.get("/daemon/status")
    assert status_resp.json()["active_session_id"] == session_id

    # 2. End Session
    end_resp = await client.post("/daemon/session/end", json={"session_id": session_id})
    assert end_resp.status_code == 200

    status_resp_after = await client.get("/daemon/status")
    assert status_resp_after.json()["active_session_id"] is None


@pytest.mark.asyncio
async def test_intercept_policy_deny(client: AsyncClient):
    resp = await client.post(
        "/daemon/intercept",
        json={
            "agent_id": "claude-code",
            "agent_type": "SHELL",
            "action_type": "FILE_DELETE",
            "operation": "DELETE",
            "target_path": "~/.ssh/id_rsa",
            "command": "rm ~/.ssh/id_rsa",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "BLOCK"
    assert data["reason_code"] in ["MANIFEST_DENY", "POLICY_DENY"]


@pytest.mark.asyncio
async def test_intercept_and_user_response(client: AsyncClient):
    # Start an active session granting the test scope
    start_resp = await client.post(
        "/daemon/session/start",
        json={
            "agent_id": "claude-code",
            "task_description": "Interactive prompt test",
            "granted_paths": ["d:/**", "~/project/**"],
        },
    )
    assert start_resp.status_code == 200
    session_id = start_resp.json()["session_id"]

    try:
        intercept_task = asyncio.create_task(
            client.post(
                "/daemon/intercept",
                json={
                    "session_id": session_id,
                    "agent_id": "claude-code",
                    "agent_type": "SHELL",
                    "action_type": "FILE_DELETE",
                    "operation": "DELETE",
                    "target_path": "d:/test_scratch_untracked.txt",
                    "command": "rm test_scratch_untracked.txt",
                },
            )
        )

        # Wait for prompt to be registered in pending_events
        for _ in range(40):
            await asyncio.sleep(0.05)
            if routes.pending_events:
                break

        assert len(routes.pending_events) > 0
        action_id = list(routes.pending_events.keys())[0]

        # Submit user approval
        resp_approval = await client.post(
            "/daemon/user-response",
            json={"action_id": action_id, "user_choice": "ALLOW"},
        )
        assert resp_approval.status_code == 200
        assert resp_approval.json().get("ok") is True

        # Intercept should resolve immediately
        resp = await intercept_task
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "ALLOW"
    finally:
        await client.post("/daemon/session/end", json={"session_id": session_id})
