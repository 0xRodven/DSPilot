---
name: query-convex-prod
description: Use when you need to read DSPilot production data (drivers, DNR, stats, reports). The env already has CONVEX_DEPLOY_KEY — no need to hunt for it.
---

# Query Convex Prod Data

**Environment (already set in your process env — do NOT fetch from .env files):**
- CONVEX_DEPLOY_KEY : prod deploy key (prefix `prod:sincere-rhinoceros-718|...`)
- DSPilot workspace : `/root/DSPilot`
- Station DIF1 stationId : `m5793emg00bwkq7n082dyrp4kd841cak`
- Station DIF1 code : `FR-PSUA-DIF1`

## Standard pattern

```bash
cd /root/DSPilot
npx convex run <module>:<function> '{"arg1":"value"}'
```

This uses CONVEX_DEPLOY_KEY from env. NO need to source .env files, NO need to chain exports. Just `cd /root/DSPilot && npx convex run ...`.

## Useful queries (read-only, bypass auth)

### Raw data dump (any table)
```bash
cd /root/DSPilot && npx convex data dnrInvestigations --limit 500
cd /root/DSPilot && npx convex data drivers --limit 500
cd /root/DSPilot && npx convex data stationWeeklyStats --limit 200
cd /root/DSPilot && npx convex data stationDeliveryStats --limit 200
cd /root/DSPilot && npx convex data driverDailyStats --limit 500
cd /root/DSPilot && npx convex data driverWeeklyStats --limit 500
```

### Driver lookup by name
```bash
cd /root/DSPilot && npx convex data drivers --limit 1000 | grep -i "kitenge"
```

## Gotcha — Auth-gated queries

Most public queries call `checkStationAccess(ctx, args.stationId)` which returns false for CLI (no authenticated user). Those queries return empty/null. To read real data:
- `npx convex data <tableName>` — raw dump, bypasses auth
- Or grep the raw dump output for a specific driver/week

## DO NOT

- Don't write standalone .ts scripts with `import { api } from '../convex/_generated/api'` — ES modules resolution is fragile in /tmp.
- Don't `source /root/.secrets/dspilot.env` — env is already loaded via systemd EnvironmentFile.
- Don't hunt the deploy key with grep — it's already in your env. Check with `echo ${#CONVEX_DEPLOY_KEY}` (should be ~84).

## Mutations — rare, always ask first

For anything that modifies prod data (upserts, deletes), ASK VIA TELEGRAM REPLY before running. Never modify prod data without explicit user confirmation in the current conversation.
