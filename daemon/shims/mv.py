#!/usr/bin/env python3
"""
SentinelAI Shell Shim: mv
Intercepts file move/rename requests, queries the SentinelAI security daemon,
and either executes or blocks the move.
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


def query_daemon(source_path: str, dest_path: str, raw_command: str) -> dict:
    payload = {
        "agent_id": AGENT_ID,
        "agent_type": "SHELL",
        "session_id": SESSION_ID,
        "action_type": "FILE_MOVE",
        "operation": "WRITE",
        "target_path": str(Path(dest_path).expanduser().resolve()),
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
        sys.stderr.write(f"\033[33m[SentinelAI Warning] Daemon unreachable ({e}). Proceeding...\033[0m\n")
        return {"decision": "ALLOW", "reason_code": "DAEMON_OFFLINE"}


def execute_native_mv(args: List[str]):
    if os.name != "nt" and os.path.exists("/bin/mv"):
        os.execv("/bin/mv", ["/bin/mv"] + args)

    targets = [a for a in args if not a.startswith("-")]
    if len(targets) >= 2:
        src = targets[0]
        dst = targets[1]
        try:
            shutil.move(src, dst)
        except Exception as err:
            sys.stderr.write(f"mv: cannot move '{src}' to '{dst}': {err}\n")
            sys.exit(1)


def main():
    args = sys.argv[1:]
    targets = [a for a in args if not a.startswith("-")]

    if len(targets) >= 2:
        decision = query_daemon(targets[0], targets[1], "mv " + " ".join(args))
        if decision.get("decision") == "BLOCK":
            sys.stderr.write(
                f"\n\033[31m[SentinelAI Shield] BLOCKED: Move to '{targets[1]}' was blocked!\033[0m\n"
                f"\033[31m  Reason: {decision.get('reason_code')}\033[0m\n"
                f"\033[31m  Details: {decision.get('explanation')}\033[0m\n\n"
            )
            sys.exit(1)

    execute_native_mv(args)


if __name__ == "__main__":
    main()
