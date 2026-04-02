---
name: debug-playbook
description: Diagnostic playbook for common DSPilot issues — dashboard blank, build failures, auth errors, import problems. Use when debugging or when something is broken.
allowed-tools: Read, Write, Edit, Bash, Grep
---

# DSPilot Debug Playbook

## Dashboard Shows No Data

1. Check Network tab: is the Convex URL `sincere-rhinoceros-718.convex.cloud` (prod) or `pastel-snail-181.convex.cloud` (dev)?
2. Check `.env.local` or Vercel env vars: `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT`
3. Check station exists: query `stations` table for `FR-PSUA-DIF1`
4. Check station.organizationId matches Clerk org: `org_37Yb7MlFJHFs5h7K28zFYoZ4fUY`
5. Check Clerk JWT: `CLERK_JWT_ISSUER_DOMAIN=https://clerk.dspilot.fr` set in Convex prod env
6. Check data exists: query `driverWeeklyStats` for the selected week

## Build Fails

- **Function used before declaration**: Move function definition before usage (Next.js strict build catches this, `tsc` may not)
- **CSS class sorting**: Biome errors — pre-existing, not blocking for builds
- **Import type errors**: Use `import type { }` for type-only imports
- **Convex `_generated` type errors**: Run `npx convex dev` or `npx convex codegen` to regenerate

## Import Fails

- Check `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY` are set
- Check station exists by code: `resolveStationByCode` query
- Check for existing non-failed import for the same week (will mark old as failed)
- Check file format: must be Amazon DWC/IADC HTML report

## Auth / Permission Issues

- `checkStationAccess` returns false: station.organizationId doesn't match JWT org_id
- "Non authentifie" error: JWT not being sent — check ConvexProviderWithClerk setup
- CLERK_JWT_ISSUER_DOMAIN mismatch: must be `https://clerk.dspilot.fr` in Convex env

## Alerts Not Generated

- Check `completeImport` calls `ctx.scheduler.runAfter(0, internal.alerts.generateAlertsInternal, ...)`
- Check `stationAutomationConfigs` exists for the station
- Check automation run status in `automationRuns` table

## Stale / Wrong Data

- Performance chart showing weeks 46-1: likely dev Convex data leaking — verify Convex URL
- Old driver data: check which Convex deployment is targeted
- Missing weeks: check `imports` table for gaps in week coverage

## DO NOT

- Assume the problem without checking the deployment target first
- Delete data to "fix" issues — investigate root cause
- Modify prod data directly — always verify on dev first
