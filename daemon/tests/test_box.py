from pathlib import Path
import pytest

from sentinel.box.box_manager import BoxManager
from sentinel.box.job_object import JobObjectController
from sentinel.box.network_proxy import NetworkAllowlistFilter
from sentinel.vault.storage import VaultStorage


@pytest.fixture
def box_setup(tmp_path):
    source_dir = tmp_path / "project_src"
    source_dir.mkdir()
    (source_dir / "main.py").write_text("print('hello world')", encoding="utf-8")
    (source_dir / "config.json").write_text('{"env": "prod"}', encoding="utf-8")

    ws_root = tmp_path / "workspaces"
    vault_dir = tmp_path / "vault"
    vault = VaultStorage(vault_dir=vault_dir)
    manager = BoxManager(base_dir=ws_root, vault=vault)

    return manager, source_dir, vault, tmp_path


def test_box_provision_and_diff(box_setup):
    manager, source_dir, _, _ = box_setup
    session_id = "sess-test-001"

    # 1. Provision Workspace
    ws, manifest = manager.provision_workspace(session_id, source_dir)
    assert ws.exists()
    assert (ws / "main.py").exists()
    assert "main.py" in manifest
    assert "config.json" in manifest

    # 2. Mutate workspace (agent actions)
    (ws / "new_feature.py").write_text("def feature(): pass", encoding="utf-8")
    (ws / "main.py").write_text("print('hello updated')", encoding="utf-8")
    (ws / "config.json").unlink()

    # 3. Compute Diff
    diff = manager.compute_diff(session_id, manifest)
    assert diff["has_changes"] is True
    assert "new_feature.py" in diff["added"]
    assert "config.json" in diff["deleted"]
    assert len(diff["modified"]) == 1
    assert diff["modified"][0]["path"] == "main.py"
    assert "diff" in diff["modified"][0]


def test_box_apply_changes_with_vault_backup(box_setup):
    manager, source_dir, vault, _ = box_setup
    session_id = "sess-test-002"

    ws, manifest = manager.provision_workspace(session_id, source_dir)

    # Modify main.py in workspace
    (ws / "main.py").write_text("print('version 2')", encoding="utf-8")

    # Apply changes to source_dir
    applied = manager.apply_changes(session_id, source_dir, approved_files=["main.py"])
    assert "main.py" in applied
    assert (source_dir / "main.py").read_text(encoding="utf-8") == "print('version 2')"

    # Verify original version was safely saved to vault
    original_blobs = list((vault.blobs_dir).glob("**/*.blob"))
    assert len(original_blobs) >= 1

    # Cleanup
    assert manager.discard_workspace(session_id) is True
    assert not ws.exists()


def test_network_allowlist_filter():
    net_filter = NetworkAllowlistFilter()

    # Allowed domains
    assert net_filter.is_allowed("api.anthropic.com") is True
    assert net_filter.is_allowed("https://registry.npmjs.org/express") is True
    assert net_filter.is_allowed("github.com") is True
    assert net_filter.is_allowed("http://localhost:8765") is True

    # Blocked raw IPs and unapproved domains
    assert net_filter.is_allowed("8.8.8.8") is False
    assert net_filter.is_allowed("192.168.1.100") is False
    assert net_filter.is_allowed("malicious-exfiltration-site.xyz") is False


def test_job_object_controller():
    controller = JobObjectController(memory_limit_mb=512, max_processes=10)
    assert controller.assign_process(12345) is True
    controller.close()
