#!/bin/bash
# Daily report generation — deterministic wrapper
# Claude generates ONLY the AI summary (no tools), the script does everything else.

set -eo pipefail
cd /root/DSPilot

# Load env
set -a && source /root/.secrets/dspilot.env && set +a
export NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud

# Yesterday date (or first arg)
DATE=${1:-$(date -d yesterday +%Y-%m-%d)}
echo "[run-daily-report] Date: $DATE"
mkdir -p .artifacts/reports

# Step 1: Try to generate without AI first to verify data exists
echo "[run-daily-report] Testing data availability..."
npx tsx scripts/generate-daily-report.ts \
  --station-code FR-PSUA-DIF1 \
  --date "$DATE" \
  --output-dir /tmp/report-test 2>&1 | tail -3

if [ $? -ne 0 ]; then
  echo "[run-daily-report] No data for $DATE, skipping"
  exit 0
fi

# Step 2: Generate AI summary via Claude Sonnet (NO tools, text only)
echo "[run-daily-report] Generating AI summary..."

# Extract structured data from the test report log for AI context
REPORT_LOG=$(npx tsx scripts/generate-daily-report.ts \
  --station-code FR-PSUA-DIF1 \
  --date "$DATE" \
  --output-dir /tmp/report-ai-ctx 2>&1 || true)

claude --model claude-opus-4-6 \
  --allowedTools "" \
  --print \
  -p "Tu es un analyste DSP Amazon. Voici la sortie du script de rapport quotidien pour DIF1 le $DATE:

$REPORT_LOG

Ecris un resume analytique en HTML (2 paragraphes, balises p) pour ce rapport.
Regles:
- Chiffres exacts
- Pas de Fantastic/Great/Fair/Poor, que des pourcentages DWC
- Mentionne les alertes sous 85% DWC avec noms et chiffres
- Si probleme photo ou IADC, le mentionner

IMPORTANT: Reponds avec EXACTEMENT ce format JSON, une seule ligne:
{\"aiSummary\":\"<p>Premier paragraphe.</p><p>Deuxieme paragraphe.</p>\"}

Pas de backticks, pas de markdown, juste le JSON." \
  2>/dev/null | python3 -c "
import sys, json, re
text = sys.stdin.read()
# Find the JSON object containing aiSummary anywhere in the text
m = re.search(r'\{[^{}]*\"aiSummary\"[^{}]*\}', text, re.DOTALL)
if m:
    try:
        parsed = json.loads(m.group(0))
        print(json.dumps(parsed, ensure_ascii=False))
        sys.exit(0)
    except:
        pass
# Fallback: extract the value manually
m2 = re.search(r'\"aiSummary\"\s*:\s*\"(.*?)\"(?:\s*\})', text, re.DOTALL)
if m2:
    val = m2.group(1).replace('\n', ' ')
    print(json.dumps({'aiSummary': val}, ensure_ascii=False))
else:
    print('{\"aiSummary\":\"\"}')
" > .artifacts/reports/ai-daily.json 2>/dev/null || echo '{"aiSummary":""}' > .artifacts/reports/ai-daily.json

# Fallback if AI failed
if [ ! -s .artifacts/reports/ai-daily.json ]; then
  echo '{"aiSummary":""}' > .artifacts/reports/ai-daily.json
  echo "[run-daily-report] AI summary empty, continuing without"
else
  echo "[run-daily-report] AI summary: $(cat .artifacts/reports/ai-daily.json | head -c 100)..."
fi

# Step 3: Generate FINAL report with AI summary
echo "[run-daily-report] Generating final report..."
npx tsx scripts/generate-daily-report.ts \
  --station-code FR-PSUA-DIF1 \
  --date "$DATE" \
  --ai-file .artifacts/reports/ai-daily.json

echo "[run-daily-report] DONE"
