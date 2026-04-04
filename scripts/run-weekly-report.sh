#!/bin/bash
# Weekly report generation — deterministic wrapper
# Claude generates ONLY the AI summary + recommendations (no tools),
# the script does everything else.

set -eo pipefail
cd /root/DSPilot

# Load env
set -a && source /root/.secrets/dspilot.env && set +a
export NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud

# Week/year args (default: current week)
YEAR=${1:-$(date +%Y)}
WEEK=${2:-$(date +%V)}
# Remove leading zero from WEEK for arithmetic
WEEK=$((10#$WEEK))
echo "[run-weekly-report] Year: $YEAR, Week: $WEEK"
mkdir -p .artifacts/reports

# Step 1: Verify data exists
echo "[run-weekly-report] Testing data availability..."
TEST_OUTPUT=$(npx tsx scripts/generate-report.ts \
  --station-code FR-PSUA-DIF1 \
  --year "$YEAR" --week "$WEEK" \
  --output-dir /tmp/report-weekly-test \
  --skip-telegram 2>&1 || true)

if echo "$TEST_OUTPUT" | grep -q "no data found"; then
  echo "[run-weekly-report] No data for S$WEEK/$YEAR, skipping"
  exit 0
fi

echo "[run-weekly-report] Data OK"

# Step 2: Generate AI content via Claude Opus (NO tools, text only)
echo "[run-weekly-report] Generating AI analysis..."

REPORT_LOG=$(npx tsx scripts/generate-report.ts \
  --station-code FR-PSUA-DIF1 \
  --year "$YEAR" --week "$WEEK" \
  --output-dir /tmp/report-weekly-ctx \
  --skip-telegram 2>&1 || true)

claude --model claude-opus-4-6 \
  --print \
  --bare \
  --allowedTools "" \
  -p "Tu es un analyste DSP Amazon. Voici la sortie du script de rapport hebdo pour DIF1, S$WEEK/$YEAR:

$REPORT_LOG

Genere un JSON avec 3 champs:
1. aiSummary: resume HTML (2-3 paragraphes <p>) — chiffres exacts, pas de Fantastic/Great, que des % DWC
2. aiRecommendations: HTML (liste <ul><li>) — 3-5 actions concretes pour la semaine prochaine
3. driverRecommendations: array de {driverName, recommendation, priority} pour les livreurs sous 90% DWC

IMPORTANT: Reponds avec EXACTEMENT du JSON valide, une seule ligne, pas de backticks:
{\"aiSummary\":\"...\",\"aiRecommendations\":\"...\",\"driverRecommendations\":[...]}" \
  2>/dev/null > .artifacts/reports/ai-raw.txt || true

# Parse Claude output → clean JSON
python3 << 'PYEOF'
import json, re

text = open(".artifacts/reports/ai-raw.txt").read()
fallback = {"aiSummary": "", "aiRecommendations": "", "driverRecommendations": []}

# Strategy: find the substring starting with {"aiSummary" and try parsing from there
idx = text.find('"aiSummary"')
if idx < 0:
    open(".artifacts/reports/ai-weekly.json", "w").write(json.dumps(fallback, ensure_ascii=False))
    raise SystemExit(0)

# Walk back to find the opening brace
brace_start = text.rfind("{", 0, idx)
if brace_start < 0:
    open(".artifacts/reports/ai-weekly.json", "w").write(json.dumps(fallback, ensure_ascii=False))
    raise SystemExit(0)

# Try parsing from brace_start, extending end progressively
candidate = text[brace_start:]
for end in range(len(candidate), idx - brace_start, -1):
    chunk = candidate[:end]
    if chunk.count("{") != chunk.count("}"):
        continue
    try:
        parsed = json.loads(chunk)
        if parsed.get("aiSummary"):
            open(".artifacts/reports/ai-weekly.json", "w").write(json.dumps(parsed, ensure_ascii=False))
            raise SystemExit(0)
    except json.JSONDecodeError:
        continue

open(".artifacts/reports/ai-weekly.json", "w").write(json.dumps(fallback, ensure_ascii=False))
PYEOF

# Verify AI file
if [ ! -s .artifacts/reports/ai-weekly.json ]; then
  echo '{"aiSummary":"","aiRecommendations":"","driverRecommendations":[]}' > .artifacts/reports/ai-weekly.json
  echo "[run-weekly-report] AI analysis empty, continuing without"
else
  echo "[run-weekly-report] AI analysis: $(cat .artifacts/reports/ai-weekly.json | head -c 120)..."
fi

# Step 3: Generate FINAL report with AI content
echo "[run-weekly-report] Generating final report..."
npx tsx scripts/generate-report.ts \
  --station-code FR-PSUA-DIF1 \
  --year "$YEAR" --week "$WEEK" \
  --ai-file .artifacts/reports/ai-weekly.json

echo "[run-weekly-report] DONE"
