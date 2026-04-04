#!/bin/bash
# Unified DNR & Investigations pipeline
# Scrapes concessions (full detail: GPS, address, scan type) + investigations (S3 report)
# Then ingests both into Convex.
#
# Usage:
#   ./scripts/run-concessions-pipeline.sh              # current week
#   ./scripts/run-concessions-pipeline.sh 14 2026      # specific week
#   ./scripts/run-concessions-pipeline.sh 12 2026 14   # range S12→S14

set -eo pipefail
cd /root/DSPilot

# ── Config ────────────────────────────────────────────────────────────────────
set -a && source /root/.secrets/dspilot.env && set +a
export NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud
export CONVEX_DEPLOY_KEY=$(grep "^CONVEX_DEPLOY_KEY=" /root/.secrets/dspilot.env | cut -d= -f2-)

COMPANY_ID="55c476fc-c3d4-4577-9910-586110f01405"
STATION_FILTER="DIF1"
STATION_CODE="FR-PSUA-DIF1"
ORG_ID="org_37Yb7MlFJHFs5h7K28zFYoZ4fUY"

# ── Args ──────────────────────────────────────────────────────────────────────
if [ -n "$3" ]; then
  # Range mode: run-concessions-pipeline.sh <start_week> <year> <end_week>
  START_WEEK=$1
  YEAR=$2
  END_WEEK=$3
elif [ -n "$1" ]; then
  # Single week mode
  START_WEEK=$1
  YEAR=${2:-$(date +%Y)}
  END_WEEK=$START_WEEK
else
  # Default: current week
  START_WEEK=$(date +%V | sed 's/^0//')
  YEAR=$(date +%Y)
  END_WEEK=$START_WEEK
fi

echo "======================================================"
echo " DSPilot — DNR & Investigations Pipeline"
echo " Weeks: S${START_WEEK}→S${END_WEEK} / ${YEAR}"
echo " Station: ${STATION_CODE}"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"

TOTAL_CONCESSIONS=0
TOTAL_INVESTIGATIONS=0

for WEEK in $(seq $START_WEEK $END_WEEK); do
  echo ""
  echo "── S${WEEK}/${YEAR} ─────────────────────────────────────────"

  # ── Step 1: Concessions (FULL detail — no --table-only) ──────────────────
  echo "[1/3] Scraping concessions S${WEEK} (full detail: GPS, address, scan)..."
  CONC_OUTPUT=$(python3 scraper/amazon_concessions_sync.py \
    --company-id "$COMPANY_ID" \
    --station-filter "$STATION_FILTER" \
    --target-week "$WEEK" \
    --target-year "$YEAR" \
    --invoke-ingest \
    --station-code "$STATION_CODE" \
    --organization-id "$ORG_ID" 2>&1) || true

  CONC_COUNT=$(echo "$CONC_OUTPUT" | grep -oP '\d+ total concession' | grep -oP '^\d+' || echo "0")
  CONC_DETAIL=$(echo "$CONC_OUTPUT" | grep -oP '\d+ with detail' | grep -oP '^\d+' || echo "0")
  echo "  → ${CONC_COUNT} concessions (${CONC_DETAIL} with detail)"
  TOTAL_CONCESSIONS=$((TOTAL_CONCESSIONS + CONC_COUNT))

  # Check for errors
  if echo "$CONC_OUTPUT" | grep -q "Error"; then
    echo "  ⚠ Errors detected:"
    echo "$CONC_OUTPUT" | grep "Error" | head -3 | sed 's/^/    /'
  fi

  # ── Step 2: Investigations (S3 HTML report) ──────────────────────────────
  echo "[2/3] Scraping investigations S${WEEK} (S3 report)..."
  INV_OUTPUT=$(python3 scraper/amazon_investigations_sync.py \
    --company-id "$COMPANY_ID" \
    --station-filter "$STATION_FILTER" \
    --target-week "$WEEK" \
    --target-year "$YEAR" \
    --invoke-ingest \
    --station-code "$STATION_CODE" \
    --organization-id "$ORG_ID" 2>&1) || true

  INV_COUNT=$(echo "$INV_OUTPUT" | grep -oP 'Parsed \d+ investigation' | grep -oP '\d+' || echo "0")
  echo "  → ${INV_COUNT} investigation(s)"
  TOTAL_INVESTIGATIONS=$((TOTAL_INVESTIGATIONS + INV_COUNT))

  if echo "$INV_OUTPUT" | grep -q "No investigations report found"; then
    echo "  (no S3 report available for this week)"
  fi

  echo "[3/3] S${WEEK} complete ✓"
done

echo ""
echo "======================================================"
echo " Pipeline complete"
echo " Concessions: ${TOTAL_CONCESSIONS}"
echo " Investigations: ${TOTAL_INVESTIGATIONS}"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
