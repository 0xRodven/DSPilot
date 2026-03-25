#!/usr/bin/env python3
"""Run a command with variables loaded from dspilot.env without shell-sourcing it."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def load_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key] = value
    return env


def main() -> int:
    if len(sys.argv) < 2:
        print(
            "Usage: with-dspilot-env.py <command> [args...]",
            file=sys.stderr,
        )
        return 1

    env_path = Path(os.environ.get("DSPILOT_SECRETS_FILE", "/root/.secrets/dspilot.env"))
    env = os.environ.copy()
    env.update(load_env_file(env_path))

    result = subprocess.run(sys.argv[1:], env=env)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
