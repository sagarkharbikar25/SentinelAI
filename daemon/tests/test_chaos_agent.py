from pathlib import Path
import pytest

from lab.chaos_agent import ChaosAgent


def test_chaos_agent_lifecycle(tmp_path):
    target = tmp_path / "lab_folder"
    target.mkdir()

    # Create baseline files
    (target / "doc1.txt").write_text("critical document 1")
    (target / "doc2.txt").write_text("critical document 2")
    sub = target / "subdir"
    sub.mkdir()
    (sub / "nested.py").write_text("print('nested code')")

    agent = ChaosAgent(target_dir=target)
    manifest = agent.record_ground_truth()
    assert len(manifest) == 3
    assert "doc1.txt" in manifest
    assert "subdir/nested.py" in manifest

    # Test single file delete attack
    deleted_p = agent.attack_single_file_delete("doc1.txt")
    assert not deleted_p.exists()

    # Test overwrite attack
    overwritten_p = agent.attack_file_overwrite("doc2.txt", b"CORRUPTED_BYTES")
    assert overwritten_p.read_bytes() == b"CORRUPTED_BYTES"

    # Test directory wipe attack
    wiped_dir = agent.attack_directory_wipe("subdir")
    assert not wiped_dir.exists()

    # Test mass burst attack
    burst_files = agent.attack_mass_burst_delete("burst_test", count=5)
    assert len(burst_files) == 5

    # Simulate restoring original files into another folder and verify recovery rate
    restore_dir = tmp_path / "restored_folder"
    restore_dir.mkdir()
    (restore_dir / "doc1.txt").write_text("critical document 1")
    (restore_dir / "doc2.txt").write_text("critical document 2")
    # doc3 omitted to simulate partial recovery
    rate, recovered, missing = agent.verify_recovery_rate(restore_dir)
    assert round(rate, 1) == 66.7
    assert "doc1.txt" in recovered
    assert "doc2.txt" in recovered
    assert "subdir/nested.py" in missing
