---
name: dspilot-driver-detail
description: Résumé complet d'un livreur (4 dernières semaines + DNR + coaching). Use quand user demande "dis-moi sur Amine", "le dossier de Dylan", etc.
---

# dspilot-driver-detail

Fetch complet d'un livreur pour un briefing Telegram.

## Pattern exécution

```bash
cd /root/DSPilot
source /root/.secrets/dspilot.env
case "$CONVEX_DEPLOY_KEY" in *DSPILOT_*) export CONVEX_DEPLOY_KEY="${CONVEX_DEPLOY_KEY%%DSPILOT_*}" ;; esac
export NEXT_PUBLIC_CONVEX_URL=https://sincere-rhinoceros-718.convex.cloud

# Recherche par nom partiel (accent-insensitive)
NAME_QUERY="amine"  # Input user

npx tsx -e "
import { ConvexHttpClient } from 'convex/browser';
import { api } from './convex/_generated/api';
const c = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
c.setAdminAuth(process.env.CONVEX_DEPLOY_KEY);

// Get current week data
const d = await c.query(api.reporting.getReportData, {
  stationCode: 'FR-PSUA-DIF1',
  year: 2026, week: 17
});

const driver = d.drivers.find(x =>
  x.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .includes('$NAME_QUERY'.toLowerCase())
);

if (!driver) { console.log('NOT_FOUND'); process.exit(0); }

// History 4 weeks
const hist = await c.query(api.drivers.getDriverWeeklyHistory, {
  driverId: driver.id, limit: 4
});

console.log(JSON.stringify({
  name: driver.name,
  dwc: driver.dwcPercent,
  iadc: driver.iadcPercent,
  rank: driver.rank,
  totalDrivers: d.drivers.length,
  daysWorked: driver.daysWorked,
  history: hist
}, null, 2));
"
```

## Output Telegram (compact)

```
Amine Si Ahmed — S17/2026
DWC: 73.7% (↓10 vs S16 83.3%)
Rang: 18/18
1 jour travaillé, 18 colis

Historique 4 semaines:
S14: 83.9% | S15: 83.3% | S17: 73.7% ↓

Erreurs: 3 Contact Miss + 2 Photo Defect
DNR: 0 cette semaine
Coaching: 0 action active
```

## Règles

- Accent-insensitive search
- Format compact, pas de verbosité
- Tendance visible (flèches)
- Si 2+ matches → demander "Tu parles de X ou Y ?"
