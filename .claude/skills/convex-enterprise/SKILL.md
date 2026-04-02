---
name: convex-enterprise
description: Write Convex mutations/queries with station-based isolation and proper permission checks. Use when implementing any data modification, creating new tables, or writing queries for DSPilot.
allowed-tools: Read, Write, Edit, Bash
---

# Convex Enterprise Patterns for DSPilot

## When to Use
- Creating/updating Convex mutations or queries
- Adding new tables to schema.ts
- Implementing data access with permission checks
- Working with the multi-tenant station model

## Multi-Tenancy Model: 1 Org = 1 Station

**Architecture**: Data tables use `stationId`, NOT `organizationId`. The `stations` table links to Clerk org via `station.organizationId`.

```
Clerk Org (org_37Y...) → stations.organizationId → stationId on all data tables
```

**Permission flow**: JWT has `org_id` → find station with matching `organizationId` → use `stationId` for data queries.

## Permission API — `convex/lib/permissions.ts`

### Getting User Context
```typescript
import { getUserContext } from "./lib/permissions"

const { userId, orgId, orgRole } = await getUserContext(ctx)
// orgRole: "org:admin" | "org:member" (Clerk Free Plan only)
```

### For Queries (return empty if no access)
```typescript
import { checkStationAccess } from "./lib/permissions"

export const myQuery = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, { stationId }) => {
    const hasAccess = await checkStationAccess(ctx, stationId)
    if (!hasAccess) return []  // ← silent fail, return empty
    return await ctx.db.query("myTable")
      .withIndex("by_station", q => q.eq("stationId", stationId))
      .collect()
  },
})
```

### For Mutations (throw if no access)
```typescript
import { requireWriteAccess } from "./lib/permissions"

export const myMutation = mutation({
  args: { stationId: v.id("stations"), data: v.string() },
  handler: async (ctx, { stationId, data }) => {
    await requireWriteAccess(ctx, stationId)  // ← throws if unauthorized
    return await ctx.db.insert("myTable", { stationId, data, createdAt: Date.now() })
  },
})
```

### Available Functions
| Function | Returns | Use in |
|----------|---------|--------|
| `getUserContext(ctx)` | `{ userId, orgId, orgRole }` | Both |
| `checkStationAccess(ctx, stationId)` | `boolean` | Queries |
| `canAccessStation(ctx, stationId)` | `boolean` | Both |
| `requireStationAccess(ctx, stationId)` | `void` (throws) | Mutations |
| `requireWriteAccess(ctx, stationId)` | `void` (throws) | Mutations |
| `requireOwner(ctx)` | `void` (throws) | Admin-only mutations |
| `canWrite(ctx)` | `boolean` | Both |
| `canInvite(ctx)` | `boolean` | Both |
| `isOwner(ctx)` | `boolean` | Both |
| `getAccessibleStations(ctx)` | `Station[]` | Queries |

## Validators
```typescript
import { v } from "convex/values"

args: {
  name: v.string(),
  count: v.number(),
  isActive: v.boolean(),
  tags: v.array(v.string()),
  metadata: v.optional(v.object({ key: v.string() })),
  stationId: v.id("stations"),
  driverId: v.optional(v.id("drivers")),
}
```

## Table Pattern (new tables)

```typescript
// In convex/schema.ts
myNewTable: defineTable({
  stationId: v.id("stations"),      // ← ALWAYS stationId, NOT organizationId
  // ... domain fields
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_station", ["stationId"])
  .index("by_station_week", ["stationId", "year", "week"]),  // if week-based
```

## Query Pattern with Loading/Empty States (frontend)

```tsx
const data = useQuery(
  api.myModule.myQuery,
  selectedStation ? { stationId: selectedStation._id } : "skip"
)
if (data === undefined) return <Skeleton />
if (!data || data.length === 0) return <EmptyState />
return <DataDisplay data={data} />
```

## Conditional Query Pattern ("skip")

```tsx
// Pass "skip" when args aren't ready yet — Convex won't execute the query
const stats = useQuery(
  api.stats.getWeeklyStats,
  station && year && week
    ? { stationId: station._id, year, week }
    : "skip"
)
```

## Scheduler Pattern (post-mutation async work)

```typescript
// Trigger async work after a mutation
await ctx.scheduler.runAfter(0, internal.alerts.generateAlertsInternal, {
  stationId,
  year,
  week,
})
```

## Existing Data Tables (use stationId)
stations, stationAccess, drivers, driverDailyStats, driverWeeklyStats, stationWeeklyStats, stationDeliveryStats, driverAssociateStats, driverRosterSnapshots, coachingActions, imports, automationRuns, sourceArtifacts, decisionScores, reportDeliveries, stationAutomationConfigs, whatsappSettings, alerts, whatsappMessages

## DO NOT
- Add `organizationId` to data tables (use `stationId` — station links to org)
- Use `logAuditEvent()` or `checkPermission()` — these functions DO NOT EXIST
- Reference `./lib/audit` or `./lib/rbac` — these modules DO NOT EXIST
- Use `any` types — always use strict validators
- Forget the "skip" pattern in React for conditional queries
- Modify `convex/_generated/` — it's auto-generated
- Assume custom Clerk roles — Free Plan only has `org:admin` and `org:member`
