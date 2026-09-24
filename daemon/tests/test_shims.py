import sys
from pathlib import Path

import pytest

SHIMS_DIR = Path(__file__).parents[1] / "shims"
sys.path.insert(0, str(SHIMS_DIR))

import chmod  # noqa: E402
import cp  # noqa: E402
import git_clean  # noqa: E402


@pytest.mark.parametrize(
    ("module", "args"),
    [
        (cp, ["cp.py", "source.txt", "target.txt"]),
        (chmod, ["chmod.py", "600", "secret.txt"]),
        (git_clean, ["git-clean.py", "-fd"]),
    ],
)
def test_shim_blocks_before_native_operation(monkeypatch, module, args):
    monkeypatch.setattr(module, "query_daemon", lambda *request: {"decision": "BLOCK"})
    monkeypatch.setattr(module.sys, "argv", args)
    native_called = False

    def native(*native_args):
        nonlocal native_called
        native_called = True

    if hasattr(module, "execute_native_cp"):
        monkeypatch.setattr(module, "execute_native_cp", native)
    else:
        monkeypatch.setattr(module.subprocess, "run", native)

    with pytest.raises(SystemExit) as error:
        module.main()

    assert error.value.code == 1
    assert native_called is False


def test_cp_delegates_after_allow(monkeypatch):
    monkeypatch.setattr(cp, "query_daemon", lambda *request: {"decision": "ALLOW"})
    monkeypatch.setattr(cp.sys, "argv", ["cp.py", "source.txt", "target.txt"])
    calls = []
    monkeypatch.setattr(cp, "execute_native_cp", lambda args: calls.append(args))

    cp.main()

    assert calls == [["source.txt", "target.txt"]]
