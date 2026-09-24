#!/usr/bin/env python3
"""SentinelAI Shell Shim: git clean."""
import subprocess
import sys
from pathlib import Path
from rm import query_daemon


def main() -> None:
    args = sys.argv[1:]
    raw_command = 'git clean ' + ' '.join(args)
    decision = query_daemon(str(Path.cwd()), raw_command)
    if decision.get('decision') == 'BLOCK':
        sys.stderr.write('[SentinelAI Shield] BLOCKED: git clean was blocked.\n')
        sys.exit(1)
    subprocess.run(['git', 'clean', *args], check=False)


if __name__ == '__main__':
    main()
