import pytest
from pathlib import Path
from sentinel.core.manifest_checker import ManifestChecker, ManifestCheckResult


@pytest.fixture
def sample_manifest():
    return {
        "agent": {"name": "Claude Code", "type": "MCP"},
        "permissions": {
            "allowed_paths": ["~/projects/my-app/**", "~/Desktop/work/**"],
            "denied_paths": ["~/.ssh/**", "~/.env*", "~/Documents/**"],
            "allowed_operations": ["READ", "WRITE", "DELETE"],
            "denied_operations": ["EXECUTE_OUTSIDE_PROJECT"],
        },
    }


def test_in_scope_path_and_op(sample_manifest):
    checker = ManifestChecker(sample_manifest)
    res = checker.check("~/projects/my-app/src/main.py", "READ")
    assert res == ManifestCheckResult.IN_SCOPE


def test_denied_path_is_out_of_scope(sample_manifest):
    checker = ManifestChecker(sample_manifest)
    res = checker.check("~/.ssh/id_rsa", "READ")
    assert res == ManifestCheckResult.OUT_OF_SCOPE


def test_unmentioned_path_is_out_of_scope(sample_manifest):
    checker = ManifestChecker(sample_manifest)
    res = checker.check("/etc/passwd", "READ")
    assert res == ManifestCheckResult.OUT_OF_SCOPE


def test_denied_operation(sample_manifest):
    checker = ManifestChecker(sample_manifest)
    res = checker.check("~/projects/my-app/run.sh", "EXECUTE_OUTSIDE_PROJECT")
    assert res == ManifestCheckResult.OUT_OF_SCOPE
