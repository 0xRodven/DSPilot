---
name: dspilot-query-stats
description: Query DSPilot KPIs station/driver/semaine depuis Convex prod. Use quand user demande "comment ça va", "stats de la semaine", "DWC d'un livreur", etc.
---

# dspilot-query-stats

Query rapide des KPIs DSPilot via Convex prod.

## Inputs attendus

- `stationCode` (default: `FR-PSUA-DIF1`)
- `year` (default: current year)
- `week` (default: current Amazon week — dim→sam)
- `driverId` (optionnel, pour stats perso)

## Pattern exécution

```bash
cd /root/DSPilot
source /root/.secrets/dspilot.env
# Sanitize CONVEX_DEPLOY_KEY si concaténée
case "$CONVEX_DEPLOY_KEY" in
  *DSPILOT_*) export CONVEX_DEPLOY_KEY="${CONVEX_DEPLOY_KEY%%DSPILOT_*}" ;;
esac
export NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud

npx tsx -e "
import { ConvexHttpClient } from 'convex/browser';
import { api } from './convex/_generated/api';
const c = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
c.setAdminAuth(process.env.CONVEX_DEPLOY_KEY);
const d = await c.query(api.reporting.getReportData, {
  stationCode: 'FR-PSUA-DIF1',
  year: YEAR, week: WEEK
});
if (!d) { console.log('NO_DATA'); process.exit(0); }
console.log(JSON.stringify({
  avgDwc: d.kpis.avgDwc,
  avgIadc: d.kpis.avgIadc,
  activeDrivers: d.kpis.activeDrivers,
  totalDrivers: d.drivers.length,
  dwcChange: d.kpis.dwcChange,
}));
"
```

## Output attendu (Telegram-friendly)

```
S17 / 2026 — DIF1
DWC: 89.6% (+2.1 vs S16)
IADC: 61%
18 livreurs actifs
```

## Règles

- JAMAIS de labels Fantastic/Great/Fair/Poor (inventés, pas Amazon)
- Format nombres avec 1 décimale max
- Si NO_DATA → "Pas encore de data pour S{week}"
