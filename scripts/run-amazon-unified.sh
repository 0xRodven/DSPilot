#!/bin/bash
# =============================================================================
# DSPilot — Unified Amazon Data Pipeline
# =============================================================================
# Single daily run that captures ALL Amazon data sources and ingests into Convex.
# Replaces the separate amazon-daily + concessions-daily crons.
#
# Schedule: 6h30 Paris (4h30 UTC) — after Amazon publishes J-1 data (3h-6h UTC)
#
# Pipeline:
#   1. Session check + refresh
#   2. DWC-IADC Report + Daily Reports + Associate Overview (via live-cycle)
#   3. DNR Concessions (full detail: GPS, address, scan type)
#   4. DNR Investigations (S3 report)
#   5. Ingest ALL into Convex
#   6. Daily station report with AI
#
# Usage:
#   ./scripts/run-amazon-unified.sh              # auto (current week)
#   ./scripts/run-amazon-unified.sh --skip-report # data only, no report
# =============================================================================

set -o pipefail
cd /root/DSPilot

# ── Config ────────────────────────────────────────────────────────────────────
set -a && source /root/.secrets/dspilot.env && set +a
export NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud
export CONVEX_DEPLOY_KEY=$(grep "^CONVEX_DEPLOY_KEY=" /root/.secrets/dspilot.env | cut -d= -f2-)

COMPANY_ID="55c476fc-c3d4-4577-9910-586110f01405"
STATION_FILTER="DIF1"
STATION_CODE="FR-PSUA-DIF1"
ORG_ID="org_37Yb7MlFJHFs5h7K28zFYoZ4fUY"
LOG_DIR="/tmp/dspilot-unified-$(date +%Y%m%d)"
mkdir -p "$LOG_DIR"

SKIP_REPORT=0
[[ "${1:-}" == "--skip-report" ]] && SKIP_REPORT=1

YEAR=$(date +%Y)
WEEK=$(date +%V | sed 's/^0//')

STARTED=$(date '+%Y-%m-%d %H:%M:%S')
echo "======================================================"
echo " DSPilot — Unified Amazon Pipeline"
echo " Week: S${WEEK}/${YEAR}"
echo " Station: ${STATION_CODE}"
echo " Started: ${STARTED}"
echo "======================================================"

ERRORS=0
STEP=0
TOTAL_STEPS=5

step_ok() { echo "[$(date +%H:%M:%S)] ✓ Step $1/$TOTAL_STEPS: $2"; }
step_fail() { echo "[$(date +%H:%M:%S)] ✗ Step $1/$TOTAL_STEPS: $2 — FAILED"; ERRORS=$((ERRORS+1)); }

# ── Step 1: DWC-IADC + Daily Reports + Associate Overview ─────────────────
STEP=1
echo ""
echo "── Step $STEP/$TOTAL_STEPS: Amazon Live Cycle (DWC/IADC + Daily Reports) ──"

LIVE_LOG="$LOG_DIR/live-cycle.log"

# Use Claude Opus to orchestrate the scrape (same as old amazon-daily)
/usr/bin/claude --model claude-opus-4-6 \
  --print \
  --allowedTools Bash,Read,Write,Edit \
  -p "Tu es l agent DSPilot Amazon Scraper. Ta mission : recuperer les donnees Amazon DWC/IADC quotidiennes et les ingerer dans Convex.

REGLES :
- TOUJOURS utiliser les scripts existants, JAMAIS en creer de nouveaux
- Si une etape echoue, diagnostiquer et retenter (max 3 fois)
- Si exit code 42 : les cookies ont expire, STOP et log REAUTH_REQUIRED

ETAPES :

1. Setup env:
set -a && source /root/.secrets/dspilot.env && set +a

2. Verifier la session Amazon:
bash /root/.openclaw/workspace-dspilot/scripts/amazon-browser-preflight.sh
Si erreur, tenter un refresh:
python3 /root/DSPilot/scripts/with-dspilot-env.py /root/.claude/stealth-browser-mcp/venv/bin/python3 /root/.openclaw/workspace-dspilot/scripts/amazon-session-manager.py

3. Lancer le scrape daily:
export DSPILOT_AMAZON_JOB_KIND=daily_auto
export DSPILOT_AMAZON_WEEKS=2  # rolling 2-week reimport (current + previous, fixes J-1/J-2 Amazon lag)
bash /root/.openclaw/workspace-dspilot/scripts/run-amazon-live-cycle.sh

4. Verifier le resultat:
- Checker les fichiers dans .artifacts/amazon-live/
- Si des HTML sont presents, le scrape a reussi

5. Si le scrape a reussi, verifier que l ingest Convex s est bien passe

Termine par : TASK_COMPLETE: scrape daily termine avec X semaines ingerees
Ou si bloque : TASK_BLOCKED: [raison]" \
  > "$LIVE_LOG" 2>&1

LIVE_EXIT=$?
if [ $LIVE_EXIT -eq 0 ] && grep -q "TASK_COMPLETE" "$LIVE_LOG"; then
  step_ok $STEP "Amazon Live Cycle"
  # Extract summary
  grep "TASK_COMPLETE" "$LIVE_LOG" | tail -1 | sed 's/^/  /'
else
  step_fail $STEP "Amazon Live Cycle"
  if grep -q "REAUTH_REQUIRED\|exit code 42" "$LIVE_LOG"; then
    echo "  ⚠ Session Amazon expiree — REAUTH_REQUIRED"
    echo "  → Aucune donnee scrapee. Pipeline interrompu."
    echo "======================================================"
    echo " FAILED: Session expired. Run: amazon-session-manager.py"
    echo "======================================================"
    exit 42
  fi
  grep -E "TASK_BLOCKED|Error|error" "$LIVE_LOG" | tail -3 | sed 's/^/  /'
fi

# ── Step 2: DNR Concessions (full detail) ──────────────────────────────────
STEP=2
echo ""
echo "── Step $STEP/$TOTAL_STEPS: DNR Concessions ──"

CONC_LOG="$LOG_DIR/concessions.log"

python3 scraper/amazon_concessions_sync.py \
  --company-id "$COMPANY_ID" \
  --station-filter "$STATION_FILTER" \
  --target-week "$WEEK" \
  --target-year "$YEAR" \
  --invoke-ingest \
  --station-code "$STATION_CODE" \
  --organization-id "$ORG_ID" \
  > "$CONC_LOG" 2>&1 || true

CONC_COUNT=$(grep -oP '\d+(?= total concession)' "$CONC_LOG" | tail -1)
CONC_DETAIL=$(grep -oP '\d+(?= with detail)' "$CONC_LOG" | tail -1)
CONC_COUNT=${CONC_COUNT:-0}
CONC_DETAIL=${CONC_DETAIL:-0}

if [ "$CONC_COUNT" -gt 0 ] 2>/dev/null || grep -q "upserted\|Batch" "$CONC_LOG"; then
  step_ok $STEP "DNR Concessions: ${CONC_COUNT} (${CONC_DETAIL} with detail)"
else
  # No concessions is OK (weekend, etc.)
  step_ok $STEP "DNR Concessions: 0 (none this week yet)"
fi

if grep -q "Error\|Traceback" "$CONC_LOG"; then
  echo "  ⚠ Errors:"
  grep -E "Error:|Traceback" "$CONC_LOG" | head -3 | sed 's/^/    /'
fi

# ── Step 3: DNR Investigations (S3 report) ─────────────────────────────────
STEP=3
echo ""
echo "── Step $STEP/$TOTAL_STEPS: DNR Investigations ──"

INV_LOG="$LOG_DIR/investigations.log"

python3 scraper/amazon_investigations_sync.py \
  --company-id "$COMPANY_ID" \
  --station-filter "$STATION_FILTER" \
  --target-week "$WEEK" \
  --target-year "$YEAR" \
  --invoke-ingest \
  --station-code "$STATION_CODE" \
  --organization-id "$ORG_ID" \
  > "$INV_LOG" 2>&1 || true

INV_COUNT=$(grep -oP 'Parsed \K\d+' "$INV_LOG" | tail -1)
INV_COUNT=${INV_COUNT:-0}

if grep -q "No investigations report found\|No DNR_Investigations" "$INV_LOG"; then
  step_ok $STEP "DNR Investigations: 0 (no S3 report available)"
else
  step_ok $STEP "DNR Investigations: ${INV_COUNT}"
fi

# ── Step 4: Also scrape PREVIOUS week concessions (catch late DNRs) ────────
STEP=4
echo ""
echo "── Step $STEP/$TOTAL_STEPS: Previous week late DNRs (S$((WEEK-1))) ──"

PREV_WEEK=$((WEEK - 1))
PREV_YEAR=$YEAR
if [ "$PREV_WEEK" -lt 1 ]; then
  PREV_WEEK=52
  PREV_YEAR=$((YEAR - 1))
fi

PREV_LOG="$LOG_DIR/concessions-prev.log"

python3 scraper/amazon_concessions_sync.py \
  --company-id "$COMPANY_ID" \
  --station-filter "$STATION_FILTER" \
  --target-week "$PREV_WEEK" \
  --target-year "$PREV_YEAR" \
  --invoke-ingest \
  --station-code "$STATION_CODE" \
  --organization-id "$ORG_ID" \
  > "$PREV_LOG" 2>&1 || true

PREV_COUNT=$(grep -oP '\d+(?= total concession)' "$PREV_LOG" | tail -1)
PREV_COUNT=${PREV_COUNT:-0}
step_ok $STEP "Previous week S${PREV_WEEK}: ${PREV_COUNT} concessions"

# ── Step 5: Daily Report with AI ───────────────────────────────────────────
# We trust the run-daily-report.sh exit code (fixed 2026-04-20):
#   0  — report generated + stored in Convex
#   1  — expected no-data (Amazon not yet published, e.g. Sunday runs)
#   2+ — unexpected failure
#
# The old detection (grep for "DONE") was broken — the wrapper printed
# DONE unconditionally, so Step 5 always looked green even when nothing
# was produced. See fix in run-daily-report.sh for the matching change.
STEP=5
echo ""
if [ "$SKIP_REPORT" -eq 1 ]; then
  echo "── Step $STEP/$TOTAL_STEPS: Daily Report — SKIPPED (--skip-report) ──"
else
  echo "── Step $STEP/$TOTAL_STEPS: Daily Station Report ──"
  REPORT_LOG="$LOG_DIR/daily-report.log"

  bash /root/DSPilot/scripts/run-daily-report.sh > "$REPORT_LOG" 2>&1
  REPORT_EXIT=$?

  # Defense in depth — verify the HTML file actually exists on disk so
  # we catch any wrapper that claims success without writing output.
  YESTERDAY=$(date -d yesterday +%Y-%m-%d)
  EXPECTED_HTML="/root/DSPilot/.artifacts/reports/daily-${YESTERDAY}-fr-psua-dif1.html"

  if [ $REPORT_EXIT -eq 0 ] && [ -s "$EXPECTED_HTML" ]; then
    step_ok $STEP "Daily Report generated ($(basename $EXPECTED_HTML))"
  elif [ $REPORT_EXIT -eq 1 ]; then
    # Expected no-data condition — warn, don't fail the pipeline.
    echo "[$(date +%H:%M:%S)] ⊘ Step $STEP/$TOTAL_STEPS: Daily Report skipped — no data for $YESTERDAY (Amazon not published yet)"
  else
    step_fail $STEP "Daily Report (exit=$REPORT_EXIT, html=$([ -s "$EXPECTED_HTML" ] && echo ok || echo missing))"
    grep -E "FAILED|Error|error|BLOCKED" "$REPORT_LOG" | tail -3 | sed 's/^/  /'
  fi
fi

# ── Summary ────────────────────────────────────────────────────────────────
FINISHED=$(date '+%Y-%m-%d %H:%M:%S')
echo ""
echo "======================================================"
echo " Pipeline complete"
echo " Started:  ${STARTED}"
echo " Finished: ${FINISHED}"
echo " Errors:   ${ERRORS}"
echo " DWC/IADC: via live-cycle (see $LOG_DIR/live-cycle.log)"
echo " Concessions: ${CONC_COUNT} (current) + ${PREV_COUNT} (prev week)"
echo " Investigations: ${INV_COUNT}"
echo " Logs: ${LOG_DIR}/"
echo "======================================================"

exit $ERRORS
