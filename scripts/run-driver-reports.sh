#!/bin/bash
# Individual driver report generation — batch
# For each driver: Claude generates personalized AI analysis, then HTML report is built.
#
# Usage:
#   ./scripts/run-driver-reports.sh 2026 14       # specific week
#   ./scripts/run-driver-reports.sh                # current week

set -o pipefail
cd /root/DSPilot

# Load env
set -a && source /root/.secrets/dspilot.env && set +a
export NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud

YEAR=${1:-$(date +%Y)}
WEEK=${2:-$(date +%V)}
WEEK=$((10#$WEEK))
echo "[driver-reports] Year: $YEAR, Week: $WEEK"

OUTPUT_DIR=".artifacts/reports/drivers/s${WEEK}-${YEAR}"
export AI_DIR="$OUTPUT_DIR/ai"
mkdir -p "$AI_DIR"

# Step 1: Extract all driver data as JSON context
echo "[driver-reports] Extracting driver data..."

npx tsx -e "
const { ConvexHttpClient } = require('convex/browser');
const { api } = require('./convex/_generated/api');
const fs = require('fs');

async function main() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  const dk = process.env.CONVEX_DEPLOY_KEY;
  if (dk) client.setAdminAuth(dk);

  const data = await client.query(api.reporting.getDriverReportData, {
    stationCode: 'FR-PSUA-DIF1', year: ${YEAR}, week: ${WEEK}
  });
  if (!data) { console.error('No data'); process.exit(1); }

  // Save each driver's context for Claude AI
  for (const d of data.drivers) {
    const ctx = {
      name: d.driverName,
      rank: d.rank,
      totalDrivers: data.totalDrivers,
      dwc: d.dwcPercent,
      iadc: d.iadcPercent,
      dwcChange: d.dwcChange,
      deliveries: d.totalDeliveries,
      daysWorked: d.daysWorked,
      history: d.history,
      dailyPerformance: d.dailyPerformance || [],
      errorBreakdown: d.errorBreakdown || {},
      dnrCount: d.dnrCount || 0,
      dnrEntries: (d.dnrEntries || []).map(e => ({ tracking: e.trackingId, date: e.date, scan: e.scanType })),
      investigationCount: d.investigationCount || 0
    };
    fs.writeFileSync('${AI_DIR}/' + d.driverId + '.context.json', JSON.stringify(ctx, null, 2));
  }
  console.log('Extracted ' + data.drivers.length + ' drivers');
  // Save driver IDs list
  fs.writeFileSync('${AI_DIR}/driver-ids.json', JSON.stringify(data.drivers.map(d => ({ id: d.driverId, name: d.driverName }))));
}
main();
" 2>&1

if [ ! -f "$AI_DIR/driver-ids.json" ]; then
  echo "[driver-reports] No data, exiting"
  exit 0
fi

DRIVER_COUNT=$(python3 -c "import json; print(len(json.load(open('$AI_DIR/driver-ids.json'))))")
echo "[driver-reports] $DRIVER_COUNT drivers found"

# Step 2: Generate AI analysis per driver (batch — all at once in one Claude call)
echo "[driver-reports] Generating AI analysis for all drivers..."

# Build combined context (all drivers in one prompt to save API calls)
COMBINED=$(python3 -c "
import json, os
drivers = json.load(open('$AI_DIR/driver-ids.json'))
all_ctx = []
for d in drivers:
    ctx_file = '$AI_DIR/' + d['id'] + '.context.json'
    if os.path.exists(ctx_file):
        ctx = json.load(open(ctx_file))
        all_ctx.append(ctx)
print(json.dumps(all_ctx[:60], ensure_ascii=False))  # Max 60 drivers
")

claude --model claude-opus-4-6 \
  --print \
  --allowedTools "" \
  --tools "" \
  -p "Tu es un coach DSP Amazon. Voici les donnees de $DRIVER_COUNT livreurs pour la semaine S$WEEK/$YEAR.

DONNEES LIVREURS:
$COMBINED

Pour CHAQUE livreur, genere une analyse personnalisee en 2-3 phrases.
- Cite ses chiffres exacts (DWC%, evolution, colis, DNR)
- Si DNR > 0, mentionne-le comme point d attention
- Si DWC < 90%, propose une action concrete
- Si DWC > 95%, felicite
- Compare avec la semaine precedente si trend disponible

GENERE CE JSON (pas de backticks, pas de markdown):
{\"analyses\":[{\"name\":\"Nom Exact du Livreur\",\"aiSummary\":\"<p>Analyse personnalisee en HTML.</p>\"}]}" \
  2>/dev/null > "$AI_DIR/ai-raw.txt" || true

# Parse Claude output
python3 << 'PYEOF'
import json, os

text = open(os.environ.get("AI_DIR", "") + "/ai-raw.txt").read()
fallback = {"analyses": []}

idx = text.find('"analyses"')
if idx < 0:
    open(os.environ.get("AI_DIR", "") + "/ai-parsed.json", "w").write(json.dumps(fallback))
    raise SystemExit(0)

brace_start = text.rfind("{", 0, idx)
if brace_start < 0:
    open(os.environ.get("AI_DIR", "") + "/ai-parsed.json", "w").write(json.dumps(fallback))
    raise SystemExit(0)

candidate = text[brace_start:]
for end in range(len(candidate), idx - brace_start, -1):
    chunk = candidate[:end]
    if chunk.count("{") != chunk.count("}") or chunk.count("[") != chunk.count("]"):
        continue
    try:
        parsed = json.loads(chunk)
        if parsed.get("analyses"):
            open(os.environ.get("AI_DIR", "") + "/ai-parsed.json", "w").write(json.dumps(parsed, ensure_ascii=False))
            print(f"Parsed {len(parsed['analyses'])} analyses")
            raise SystemExit(0)
    except json.JSONDecodeError:
        continue

open(os.environ.get("AI_DIR", "") + "/ai-parsed.json", "w").write(json.dumps(fallback))
print("No analyses parsed")
PYEOF

# Map AI analyses to individual driver files
python3 << 'PYEOF2'
import json, os

ai_dir = os.environ.get("AI_DIR", "")
parsed = json.load(open(f"{ai_dir}/ai-parsed.json"))
drivers = json.load(open(f"{ai_dir}/driver-ids.json"))

# Build name→analysis map
analysis_map = {}
for a in parsed.get("analyses", []):
    name = a.get("name", "").strip()
    if name:
        analysis_map[name.lower()] = a.get("aiSummary", "")

matched = 0
for d in drivers:
    name_lower = d["name"].lower()
    ai = analysis_map.get(name_lower, "")
    if not ai:
        # Try partial match
        for key, val in analysis_map.items():
            if key in name_lower or name_lower in key:
                ai = val
                break
    if ai:
        matched += 1
    json.dump({"aiSummary": ai}, open(f"{ai_dir}/{d['id']}.json", "w"), ensure_ascii=False)

print(f"Matched {matched}/{len(drivers)} drivers with AI analysis")
PYEOF2

# Step 3: Generate HTML reports
echo "[driver-reports] Generating HTML reports..."
AI_DIR="$AI_DIR" npx tsx scripts/generate-driver-report.ts \
  --station-code FR-PSUA-DIF1 \
  --year "$YEAR" --week "$WEEK" \
  --output-dir "$OUTPUT_DIR" \
  --ai-dir "$AI_DIR" 2>&1

echo "[driver-reports] DONE — Reports in $OUTPUT_DIR"
