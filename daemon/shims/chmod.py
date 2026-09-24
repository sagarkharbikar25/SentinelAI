#!/usr/bin/env python3
"""SentinelAI Shell Shim: chmod."""
import os
import subprocess
import sys
from pathlib import Path
from rm import query_daemon


def main() -> None:
    args = sys.argv[1:]
    targets = [arg for arg in args if not arg.startswith('-')]
    if len(targets) < 2:
        subprocess.run(['chmod', *args], check=False)
        return

    target = targets[-1]
    decision = query_daemon(target, 'chmod ' + ' '.join(args))
    if decision.get('decision') == 'BLOCK':
        sys.stderr.write(f"[SentinelAI Shield] BLOCKED: Permission change on '{target}' was blocked.\n")
        sys.exit(1)
    subprocess.run(['chmod', *args], check=False)


if __name__ == '__main__':
    main()
