#!/bin/bash
# Daily report generation — deterministic wrapper
# 1. Query Convex for structured data (drivers + DNR) → JSON dump
# 2. Claude Opus analyzes the JSON → AI summary
# 3. generate-daily-report.ts builds the HTML with AI content
#
# Exit codes:
#   0 — report generated and stored in Convex
#   1 — no data in Convex for the requested date (expected on Sundays / before DWC publication)
#   2 — unexpected error during AI or report generation

set -o pipefail
cd /root/DSPilot

# Load env
set -a && source /root/.secrets/dspilot.env && set +a
export NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud

# Yesterday date (or first arg)
DATE=${1:-$(date -d yesterday +%Y-%m-%d)}
echo "[run-daily-report] Date: $DATE"
mkdir -p .artifacts/reports

# Wipe any stale context from a previous run so our no-data check isn't
# fooled by a leftover file. Bug #1 was: the old code just checked for
# "does daily-context.json exist?" which was ALWAYS true because a prior
# run left the file there, masking the "no data" condition.
rm -f .artifacts/reports/daily-context.json
rm -f .artifacts/reports/ai-daily.json
rm -f .artifacts/reports/ai-daily-raw.txt

# Step 1: Extract structured data as JSON for Claude context
echo "[run-daily-report] Extracting structured data..."

if ! npx tsx -e "
const { ConvexHttpClient } = require('convex/browser');
const { api } = require('./convex/_generated/api');
const fs = require('fs');

async function main() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  const dk = process.env.CONVEX_DEPLOY_KEY;
  if (dk) client.setAdminAuth(dk);

  const data = await client.query(api.reporting.getDailyReportData, {
    stationCode: 'FR-PSUA-DIF1', date: '${DATE}'
  });
  if (!data) { console.error('No data for ${DATE}'); process.exit(1); }

  const context = {
    station: data.stationCode,
    date: '${DATE}',
    kpis: data.kpis,
    dnr: data.dnr || { newConcessions: 0, investigationsActive: 0, topDrivers: [] },
    drivers: data.drivers.map(d => ({
      name: d.name,
      dwc: d.dwcPercent,
      deliveries: d.totalDeliveries,
      dnrCount: d.dnrCount || 0,
      photoDefects: d.photoDefects || 0,
      isAlert: d.isAlert
    })),
    alerts: data.drivers.filter(d => d.isAlert).map(d => ({
      name: d.name,
      dwc: d.dwcPercent,
      deliveries: d.totalDeliveries
    })),
    totalDrivers: data.drivers.length,
    absentDrivers: data.absentDrivers
  };
  fs.writeFileSync('.artifacts/reports/daily-context.json', JSON.stringify(context, null, 2));
  console.log('Data extracted: ' + data.drivers.length + ' drivers, ' + (data.dnr?.newConcessions || 0) + ' DNR');
}
main();
" 2>&1; then
  echo "[run-daily-report] FAILED: no data in Convex for $DATE (Amazon report not yet published, or ingestion failed earlier in the pipeline)"
  exit 1
fi

# Safety net — should not happen given the tsx exit code check above,
# but defensive programming: confirm the file actually exists and is
# non-empty before we feed it to Claude.
if [ ! -s .artifacts/reports/daily-context.json ]; then
  echo "[run-daily-report] FAILED: daily-context.json missing or empty after tsx run"
  exit 2
fi

echo "[run-daily-report] Data OK"
DATA_CONTEXT=$(cat .artifacts/reports/daily-context.json)

# Step 2: Claude Opus analyzes the FULL structured data
echo "[run-daily-report] Generating AI summary..."

claude --model claude-opus-4-6 \
  --print \
  --allowedTools "" \
  --tools "" \
  -p "Tu es un analyste DSP Amazon pour la station DIF1. Analyse ces données du $DATE.

DONNEES COMPLETES (JSON):
$DATA_CONTEXT

INSTRUCTIONS:
- Resume la journee en 2 paragraphes HTML (<p>)
- Cite les chiffres exacts: DWC moyen, nombre de livreurs, colis livres
- Si des livreurs sont sous 85% DWC, cite-les par nom avec leur score
- Analyse les DNR du jour: nombre de concessions, livreurs les plus concernes
- Si il y a des investigations, mentionne-les comme alerte prioritaire
- Mentionne les problemes photo si photoDefects > 0
- N'utilise JAMAIS Fantastic/Great/Fair/Poor, que des pourcentages

GENERE CE JSON EXACTEMENT (une seule ligne, pas de backticks):
{\"aiSummary\":\"<p>Paragraphe 1: KPIs et vue d ensemble.</p><p>Paragraphe 2: alertes, DNR et actions.</p>\"}" \
  2>/dev/null > .artifacts/reports/ai-daily-raw.txt || true

# Step 3: Parse Claude output → clean JSON
python3 << 'PYEOF'
import json

text = open(".artifacts/reports/ai-daily-raw.txt").read()
fallback = {"aiSummary": ""}

idx = text.find('"aiSummary"')
if idx < 0:
    open(".artifacts/reports/ai-daily.json", "w").write(json.dumps(fallback, ensure_ascii=False))
    raise SystemExit(0)

brace_start = text.rfind("{", 0, idx)
if brace_start < 0:
    open(".artifacts/reports/ai-daily.json", "w").write(json.dumps(fallback, ensure_ascii=False))
    raise SystemExit(0)

candidate = text[brace_start:]
for end in range(len(candidate), idx - brace_start, -1):
    chunk = candidate[:end]
    if chunk.count("{") != chunk.count("}"):
        continue
    try:
        parsed = json.loads(chunk)
        if parsed.get("aiSummary"):
            open(".artifacts/reports/ai-daily.json", "w").write(json.dumps(parsed, ensure_ascii=False))
            raise SystemExit(0)
    except json.JSONDecodeError:
        continue

open(".artifacts/reports/ai-daily.json", "w").write(json.dumps(fallback, ensure_ascii=False))
PYEOF

# Verify
if [ ! -s .artifacts/reports/ai-daily.json ]; then
  echo '{"aiSummary":""}' > .artifacts/reports/ai-daily.json
  echo "[run-daily-report] AI summary empty, continuing without"
else
  echo "[run-daily-report] AI summary: $(cat .artifacts/reports/ai-daily.json | head -c 120)..."
fi

# Step 4: Generate FINAL report with AI summary
# generate-daily-report.ts calls process.exit(1) when the query returns
# no data. We run it directly (no || true) so its exit code propagates
# and the unified pipeline can tell whether a report was really stored.
echo "[run-daily-report] Generating final report..."
if ! npx tsx scripts/generate-daily-report.ts \
  --station-code FR-PSUA-DIF1 \
  --date "$DATE" \
  --ai-file .artifacts/reports/ai-daily.json; then
  echo "[run-daily-report] FAILED: generate-daily-report.ts returned non-zero"
  exit 2
fi

# Confirm the HTML was actually written to disk. generate-daily-report.ts
# writes to .artifacts/reports/daily-${date}-${station}.html — verify
# it exists and is non-empty before declaring success.
REPORT_HTML=".artifacts/reports/daily-${DATE}-fr-psua-dif1.html"
if [ ! -s "$REPORT_HTML" ]; then
  echo "[run-daily-report] FAILED: expected HTML file missing: $REPORT_HTML"
  exit 2
fi

echo "[run-daily-report] SUCCESS: report generated for $DATE"
echo "[run-daily-report] DONE"
