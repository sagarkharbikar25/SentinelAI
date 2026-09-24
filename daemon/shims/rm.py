#!/usr/bin/env python3
"""
SentinelAI Shell Shim: rm
Intercepts file deletion requests, queries the SentinelAI security daemon,
and either executes or blocks the deletion.
"""
import os
import shutil
import sys
from pathlib import Path
from typing import List

try:
    import urllib.request
    import json
except ImportError:
    pass

DAEMON_URL = os.getenv("SENTINEL_DAEMON_URL", "http://127.0.0.1:8765/daemon/intercept")
AGENT_ID = os.getenv("SENTINEL_AGENT_ID", "claude-code")
SESSION_ID = os.getenv("SENTINEL_SESSION_ID", None)


def query_daemon(target_path: str, raw_command: str) -> dict:
    """Sends action interception request to the local SentinelAI daemon."""
    payload = {
        "agent_id": AGENT_ID,
        "agent_type": "SHELL",
        "session_id": SESSION_ID,
        "action_type": "FILE_DELETE",
        "operation": "DELETE",
        "target_path": str(Path(target_path).expanduser().resolve()),
        "command": raw_command,
    }

    req = urllib.request.Request(
        DAEMON_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=35) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        # Fail-open with warning if daemon is temporarily offline
        sys.stderr.write(f"\033[33m[SentinelAI Warning] Daemon unreachable ({e}). Proceeding...\033[0m\n")
        return {"decision": "ALLOW", "reason_code": "DAEMON_OFFLINE"}


def execute_native_rm(args: List[str]):
    """Executes the native deletion on the target operating system."""
    # 1. On Unix/Linux/macOS, delegate to /bin/rm if available
    if os.name != "nt" and os.path.exists("/bin/rm"):
        os.execv("/bin/rm", ["/bin/rm"] + args)

    # 2. Cross-platform / Windows fallback
    is_recursive = any(a in ["-r", "-R", "-rf", "-fr", "--recursive"] for a in args)
    targets = [a for a in args if not a.startswith("-")]

    for target in targets:
        p = Path(target).expanduser().resolve()
        if not p.exists():
            continue
        try:
            if p.is_dir():
                if is_recursive:
                    shutil.rmtree(p)
                else:
                    os.rmdir(p)
            else:
                p.unlink()
        except Exception as err:
            sys.stderr.write(f"rm: cannot remove '{target}': {err}\n")
            sys.exit(1)


def main():
    args = sys.argv[1:]
    if not args:
        execute_native_rm(args)
        return

    raw_command = "rm " + " ".join(args)
    targets = [a for a in args if not a.startswith("-")]

    # Check each target with SentinelAI Daemon
    for target in targets:
        decision = query_daemon(target, raw_command)
        outcome = decision.get("decision", "BLOCK")

        if outcome == "BLOCK":
            reason = decision.get("reason_code", "DENIED")
            explanation = decision.get("explanation", "Blocked by SentinelAI.")
            sys.stderr.write(
                f"\n\033[31m[SentinelAI Shield] BLOCKED: Deletion of '{target}' was blocked!\033[0m\n"
                f"\033[31m  Reason: {reason}\033[0m\n"
                f"\033[31m  Details: {explanation}\033[0m\n\n"
            )
            sys.exit(1)

    # If all passed checks, perform real deletion
    execute_native_rm(args)


if __name__ == "__main__":
    main()
