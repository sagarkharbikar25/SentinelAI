#!/usr/bin/env python3
"""SentinelAI Shell Shim: cp."""
import os
import shutil
import sys
from pathlib import Path
from typing import List
from rm import query_daemon


def execute_native_cp(args: List[str]) -> None:
    targets = [arg for arg in args if not arg.startswith('-')]
    if len(targets) < 2:
        return
    destination = Path(targets[-1]).expanduser()
    sources = [Path(target).expanduser() for target in targets[:-1]]
    for source in sources:
        target = destination / source.name if destination.is_dir() else destination
        if source.is_dir():
            shutil.copytree(source, target, dirs_exist_ok=True)
        else:
            shutil.copy2(source, target)


def main() -> None:
    args = sys.argv[1:]
    targets = [arg for arg in args if not arg.startswith('-')]
    if len(targets) < 2:
        execute_native_cp(args)
        return

    destination = targets[-1]
    decision = query_daemon(destination, 'cp ' + ' '.join(args))
    if decision.get('decision') == 'BLOCK':
        sys.stderr.write(f"[SentinelAI Shield] BLOCKED: Copy to '{destination}' was blocked.\n")
        sys.exit(1)
    execute_native_cp(args)


if __name__ == '__main__':
    main()
