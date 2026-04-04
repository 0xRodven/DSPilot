#!/bin/bash
# Weekly report generation — deterministic wrapper
# 1. Query Convex for structured data → JSON dump
# 2. Claude Opus analyzes the JSON data → AI summary + recommendations
# 3. generate-report.ts builds the HTML with AI content

set -o pipefail
cd /root/DSPilot

# Load env
set -a && source /root/.secrets/dspilot.env && set +a
export NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud

# Week/year args (default: current week)
YEAR=${1:-$(date +%Y)}
WEEK=${2:-$(date +%V)}
WEEK=$((10#$WEEK))
echo "[run-weekly-report] Year: $YEAR, Week: $WEEK"
mkdir -p .artifacts/reports

# Step 1: Extract structured data as JSON for Claude context
echo "[run-weekly-report] Extracting structured data..."

npx tsx -e "
const { ConvexHttpClient } = require('convex/browser');
const { api } = require('./convex/_generated/api');
const fs = require('fs');

async function main() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  const dk = process.env.CONVEX_DEPLOY_KEY;
  if (dk) client.setAdminAuth(dk);

  const data = await client.query(api.reporting.getReportData, {
    stationCode: 'FR-PSUA-DIF1', year: ${YEAR}, week: ${WEEK}
  });
  if (!data) { console.error('No data'); process.exit(1); }

  // Build structured context for Claude
  const context = {
    station: data.stationCode,
    week: ${WEEK},
    year: ${YEAR},
    kpis: data.kpis,
    dwcDistribution: data.dwcDistribution,
    drivers: data.drivers.map(d => ({
      name: d.name,
      dwc: d.dwcPercent,
      iadc: d.iadcPercent,
      deliveries: d.totalDeliveries || d.daysWorked,
      trend: d.dwcTrend,
      rank: d.rank
    })),
    totalDrivers: data.drivers.length,
    weeklyHistory: data.weeklyHistory
  };
  fs.writeFileSync('.artifacts/reports/data-context.json', JSON.stringify(context, null, 2));
  console.log('Data extracted: ' + data.drivers.length + ' drivers');
}
main();
" 2>&1

if [ ! -f .artifacts/reports/data-context.json ]; then
  echo "[run-weekly-report] No data for S$WEEK/$YEAR, skipping"
  exit 0
fi

echo "[run-weekly-report] Data OK"
DATA_CONTEXT=$(cat .artifacts/reports/data-context.json)

# Step 2: Claude Opus analyzes the FULL structured data
echo "[run-weekly-report] Generating AI analysis..."

claude --model claude-opus-4-6 \
  --print \
  --allowedTools "" \
  --tools "" \
  -p "Tu es un analyste expert DSP Amazon pour la station DIF1. Analyse ces données de performance de la semaine S$WEEK/$YEAR et genere un rapport.

DONNEES COMPLETES (JSON):
$DATA_CONTEXT

INSTRUCTIONS:
- Cite des NOMS de livreurs specifiques et leurs chiffres exacts
- Identifie les livreurs sous 90% DWC par nom avec leur score exact
- Compare avec la semaine precedente (trend) si disponible
- Analyse la distribution DWC (combien >=95%, 90-95%, 85-90%, <85%)
- Propose des actions CONCRETES par livreur (pas generiques)
- N'utilise JAMAIS les termes Fantastic/Great/Fair/Poor, que des pourcentages

GENERE CE JSON EXACTEMENT (une seule ligne, pas de backticks, pas de markdown):
{\"aiSummary\":\"<p>Paragraphe 1: vue d ensemble avec chiffres cles (DWC moyen, nb livreurs, colis, evolution vs semaine precedente).</p><p>Paragraphe 2: analyse des points forts et faibles avec noms de livreurs specifiques.</p><p>Paragraphe 3: objectif semaine prochaine.</p>\",\"aiRecommendations\":\"<ul><li>Action 1 concrete avec nom du livreur</li><li>Action 2</li><li>Action 3</li><li>Action 4</li></ul>\",\"driverRecommendations\":[{\"driverName\":\"Nom Exact\",\"recommendation\":\"Action specifique basee sur ses chiffres\",\"priority\":\"high\"}]}" \
  2>/dev/null > .artifacts/reports/ai-raw.txt || true

# Step 3: Parse Claude output → clean JSON
python3 << 'PYEOF'
import json

text = open(".artifacts/reports/ai-raw.txt").read()
fallback = {"aiSummary": "", "aiRecommendations": "", "driverRecommendations": []}

idx = text.find('"aiSummary"')
if idx < 0:
    open(".artifacts/reports/ai-weekly.json", "w").write(json.dumps(fallback, ensure_ascii=False))
    raise SystemExit(0)

brace_start = text.rfind("{", 0, idx)
if brace_start < 0:
    open(".artifacts/reports/ai-weekly.json", "w").write(json.dumps(fallback, ensure_ascii=False))
    raise SystemExit(0)

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

# Verify
if [ ! -s .artifacts/reports/ai-weekly.json ]; then
  echo '{"aiSummary":"","aiRecommendations":"","driverRecommendations":[]}' > .artifacts/reports/ai-weekly.json
  echo "[run-weekly-report] AI analysis empty, continuing without"
else
  echo "[run-weekly-report] AI analysis: $(cat .artifacts/reports/ai-weekly.json | head -c 120)..."
fi

# Step 4: Generate FINAL report with AI content
echo "[run-weekly-report] Generating final report..."
npx tsx scripts/generate-report.ts \
  --station-code FR-PSUA-DIF1 \
  --year "$YEAR" --week "$WEEK" \
  --ai-file .artifacts/reports/ai-weekly.json

echo "[run-weekly-report] DONE"
