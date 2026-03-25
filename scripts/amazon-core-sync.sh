#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SECRETS_FILE="${DSPILOT_SECRETS_FILE:-/root/.secrets/dspilot.env}"

if [[ -f "$SECRETS_FILE" ]]; then
  # Parse KEY=VALUE lines literally instead of sourcing the file directly.
  # Some values contain shell metacharacters such as "|" and would otherwise break.
  eval "$(
    python3 - "$SECRETS_FILE" <<'PY'
import shlex
import sys
from pathlib import Path

for raw_line in Path(sys.argv[1]).read_text().splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    print(f"export {key}={shlex.quote(value)}")
PY
  )"
fi

STATION_CODE="${DSPILOT_STATION_CODE:-}"
EXPECTED_AMAZON_STATION_CODE="${DSPILOT_EXPECTED_AMAZON_STATION_CODE:-$STATION_CODE}"
WEEKS="${DSPILOT_AMAZON_WEEKS:-1}"
ARTIFACTS_ROOT="${DSPILOT_AMAZON_ARTIFACTS_ROOT:-$ROOT_DIR/.artifacts/amazon}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="$ARTIFACTS_ROOT/$TIMESTAMP"
LOCAL_HTML_PATH="${DSPILOT_AMAZON_HTML_PATH:-}"
INVOKE_INGEST="${DSPILOT_AMAZON_INVOKE_INGEST:-1}"
NO_DOWNLOAD="${DSPILOT_AMAZON_NO_DOWNLOAD:-0}"

mkdir -p "$RUN_DIR"

CMD=(python3 scraper/amazon_supplementary_sync.py --output-dir "$RUN_DIR" --weeks "$WEEKS")

if [[ -n "$LOCAL_HTML_PATH" ]]; then
  CMD+=(--html-path "$LOCAL_HTML_PATH")
fi

if [[ "$NO_DOWNLOAD" == "1" ]]; then
  CMD+=(--no-download)
fi

if [[ "$INVOKE_INGEST" == "1" ]]; then
  if [[ -z "$STATION_CODE" ]]; then
    echo "DSPILOT_STATION_CODE is required when DSPILOT_AMAZON_INVOKE_INGEST=1" >&2
    exit 1
  fi

  CMD+=(--invoke-ingest --station-code "$STATION_CODE")

  if [[ -n "$EXPECTED_AMAZON_STATION_CODE" ]]; then
    CMD+=(--expected-amazon-station-code "$EXPECTED_AMAZON_STATION_CODE")
  fi
fi

echo "[amazon-core-sync] run_dir=$RUN_DIR"
echo "[amazon-core-sync] command=${CMD[*]}"

cd "$ROOT_DIR"
"${CMD[@]}"
