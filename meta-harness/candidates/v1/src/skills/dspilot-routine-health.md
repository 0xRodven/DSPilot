---
name: dspilot-routine-health
description: Check état des 3 routines Claude Cloud DSPilot (daily/weekly/drivers). Use quand user demande "routines ok ?", "le daily a tourné ?", etc.
---

# dspilot-routine-health

Vérifie l'état des 3 routines via timestamp `createdAt` du dernier rapport correspondant en Convex.

## 3 routines surveillées

| Routine | Cron | Trigger ID |
|---|---|---|
| Daily | `0 6 * * *` (06h UTC tous les jours) | `trig_015ATeJCN2RT9B6pMttWP95A` |
| Weekly | `30 11 * * 1` (lundi 11h30 UTC) | `trig_01DaH5sTHk45DLv6wGz6Ugui` |
| Drivers | `30 11 * * 1` (lundi 11h30 UTC) | `trig_01VVTXYEHhSqmMjThR41n8H5` |

## Pattern exécution

```bash
cd /root/DSPilot
source /root/.secrets/dspilot.env
case "$CONVEX_DEPLOY_KEY" in
  *DSPILOT_*) export CONVEX_DEPLOY_KEY="${CONVEX_DEPLOY_KEY%%DSPILOT_*}" ;;
esac

# Check latest reports (3 derniers)
npx convex data --prod reportDeliveries --limit 10 --format jsonl | \
  python3 -c "
import json, sys
from datetime import datetime, timezone, timedelta
now = datetime.now(timezone.utc)
latest = {'daily': None, 'weekly': None}
for l in sys.stdin:
    r = json.loads(l)
    t = r.get('reportType')
    if t in latest and (latest[t] is None or r['createdAt'] > latest[t]['createdAt']):
        latest[t] = r
for k, v in latest.items():
    if v:
        dt = datetime.fromtimestamp(v['createdAt']/1000, tz=timezone.utc)
        age = now - dt
        status = '✓' if age < timedelta(hours=25 if k == 'daily' else 168) else '⚠'
        print(f\"{status} {k}: {dt.strftime('%d/%m %H:%M')} ({int(age.total_seconds()/3600)}h ago)\")
    else:
        print(f\"✗ {k}: no data\")
"

# Check drivers count for latest week
npx convex data --prod driverReports --limit 200 --format jsonl | \
  python3 -c "
import json, sys
from collections import Counter
c = Counter()
for l in sys.stdin:
    try:
        r = json.loads(l)
        c[(r.get('year'), r.get('week'))] += 1
    except: pass
for (y,w), n in sorted(c.items(), reverse=True)[:2]:
    print(f\"Drivers S{w}/{y}: {n} rapports\")
"
```

## Output (Telegram-friendly)

```
✓ daily: 21/04 06:05 (4h ago)
✓ weekly: 21/04 11:32 (0h ago)
Drivers S17/2026: 18 rapports
Drivers S16/2026: 56 rapports
```

## Alerte si anomalie

- Daily > 26h ago → "⚠ Daily en retard"
- Weekly > 8 jours ago → "⚠ Weekly raté"
- Drivers < 10 cette semaine → "⚠ Drivers incomplet"
