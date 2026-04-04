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
  --allowedTools "" \
  --print \
  -p "Tu es un analyste DSP Amazon. Voici la sortie du script de rapport hebdo pour DIF1, S$WEEK/$YEAR:

$REPORT_LOG

Genere un JSON avec 3 champs:
1. aiSummary: resume HTML (2-3 paragraphes <p>) — chiffres exacts, pas de Fantastic/Great, que des % DWC
2. aiRecommendations: HTML (liste <ul><li>) — 3-5 actions concretes pour la semaine prochaine
3. driverRecommendations: array de {driverName, recommendation, priority} pour les livreurs sous 90% DWC

IMPORTANT: Reponds avec EXACTEMENT du JSON valide, une seule ligne, pas de backticks:
{\"aiSummary\":\"...\",\"aiRecommendations\":\"...\",\"driverRecommendations\":[...]}" \
  2>/dev/null | python3 -c "
import sys, json, re
text = sys.stdin.read()
# Find JSON objects containing aiSummary — take the first valid one
for m in re.finditer(r'\{', text):
    start = m.start()
    depth = 0
    for i in range(start, len(text)):
        if text[i] == '{': depth += 1
        elif text[i] == '}': depth -= 1
        if depth == 0:
            try:
                parsed = json.loads(text[start:i+1])
                if 'aiSummary' in parsed and parsed['aiSummary']:
                    print(json.dumps(parsed, ensure_ascii=False))
                    sys.exit(0)
            except: pass
            break
print(json.dumps({'aiSummary':'','aiRecommendations':'','driverRecommendations':[]}, ensure_ascii=False))
" > .artifacts/reports/ai-weekly.json 2>/dev/null || echo '{"aiSummary":"","aiRecommendations":"","driverRecommendations":[]}' > .artifacts/reports/ai-weekly.json

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
