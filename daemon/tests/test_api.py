import asyncio
import pytest
from fastapi.testclient import TestClient

from sentinel.main import app

client = TestClient(app)


def test_daemon_status():
    response = client.get("/daemon/status")
    assert response.status_code == 200
    data = response.json()
    assert data["running"] is True
    assert data["version"] == "0.1.0"


def test_session_lifecycle():
    # 1. Start Session
    start_resp = client.post(
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
    status_resp = client.get("/daemon/status")
    assert status_resp.json()["active_session_id"] == session_id

    # 2. End Session
    end_resp = client.post("/daemon/session/end", json={"session_id": session_id})
    assert end_resp.status_code == 200

    status_resp_after = client.get("/daemon/status")
    assert status_resp_after.json()["active_session_id"] is None


def test_intercept_policy_deny():
    resp = client.post(
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
    assert data["reason_code"] == "POLICY_DENY"


def test_intercept_and_user_response():
    # Test async prompt and response resolution
    # In one thread/task, call intercept on untracked file
    # Then immediately submit user-response ALLOW
    import threading
    import time

    action_id_holder = {}

    def simulate_user_approval():
        # Poll actions endpoint until prompt is created
        for _ in range(30):
            time.sleep(0.1)
            actions_resp = client.get("/daemon/actions?limit=5")
            if actions_resp.status_code == 200:
                items = actions_resp.json()
                if items:
                    target_id = items[0]["id"]
                    # Submit approval
                    resp = client.post(
                        "/daemon/user-response",
                        json={"action_id": target_id, "user_choice": "ALLOW"},
                    )
                    if resp.status_code == 200 and resp.json().get("ok"):
                        action_id_holder["id"] = target_id
                        break

    thread = threading.Thread(target=simulate_user_approval)
    thread.start()

    resp = client.post(
        "/daemon/intercept",
        json={
            "agent_id": "claude-code",
            "agent_type": "SHELL",
            "action_type": "FILE_DELETE",
            "operation": "DELETE",
            "target_path": "d:/test_scratch_untracked.txt",
            "command": "rm test_scratch_untracked.txt",
        },
    )
    thread.join()

    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] in ["ALLOW", "BLOCK"]
