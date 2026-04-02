---
name: dashboard-queries
description: Time-filtered query patterns for DSPilot dashboard. Covers day/week/range modes, aggregation helpers, and KPI computation. Use when building or modifying dashboard queries.
allowed-tools: Read, Write, Edit
---

# DSPilot Dashboard Query Patterns Reference

Source: `/convex/lib/timeQuery.ts`

## timeQueryArgs Validator

Spread into any query's `args` to accept time-filtered parameters:

```ts
import { timeQueryArgs } from "./lib/timeQuery";

export const getKPIs = query({
  args: {
    ...timeQueryArgs,
    // additional args...
  },
  handler: async (ctx, args) => { /* ... */ },
});
```

The validator defines:

| Field | Type | Required | Used By |
|---|---|---|---|
| `stationId` | `v.optional(v.id("stations"))` | Optional | All modes |
| `mode` | `v.union("day", "week", "range")` | Required | Dispatch |
| `date` | `v.optional(v.string())` | Mode: day | Day queries |
| `year` | `v.optional(v.number())` | Mode: week | Week queries |
| `week` | `v.optional(v.number())` | Mode: week | Week queries |
| `startDate` | `v.optional(v.string())` | Mode: range | Range queries |
| `endDate` | `v.optional(v.string())` | Mode: range | Range queries |
| `granularity` | `v.optional(v.union("day", "week"))` | Mode: range | Range aggregation (default: "week") |

## getTimeFilteredData() Factory Pattern

Dispatches to the correct handler based on `mode`. Validates required fields and throws if missing.

```ts
import { getTimeFilteredData, timeQueryArgs } from "./lib/timeQuery";

export const getKPIs = query({
  args: timeQueryArgs,
  handler: async (ctx, args) => {
    return getTimeFilteredData(ctx, args, {
      day: async (ctx, date) => {
        // date: string "YYYY-MM-DD"
        // Query driverDailyStats by_station_date
        const stats = await ctx.db
          .query("driverDailyStats")
          .withIndex("by_station_date", q =>
            q.eq("stationId", args.stationId).eq("date", date)
          )
          .collect();
        return computeFromDailyStats(stats);
      },

      week: async (ctx, year, week) => {
        // year: number, week: number
        // Query stationWeeklyStats by_station_week
        const stats = await ctx.db
          .query("stationWeeklyStats")
          .withIndex("by_station_week", q =>
            q.eq("stationId", args.stationId)
             .eq("year", year)
             .eq("week", week)
          )
          .first();
        return stats ?? emptyKPIs();
      },

      range: async (ctx, startDate, endDate, granularity) => {
        // startDate/endDate: string "YYYY-MM-DD"
        // granularity: "day" | "week" (default: "week")
        const weeks = getWeeksInRange(startDate, endDate);
        const weeklyStats = await Promise.all(
          weeks.map(({ year, week }) =>
            ctx.db.query("stationWeeklyStats")
              .withIndex("by_station_week", q =>
                q.eq("stationId", args.stationId)
                 .eq("year", year).eq("week", week)
              )
              .first()
          )
        );
        return aggregateWeeklyStats(weeklyStats);
      },
    });
  },
});
```

**Validation rules:**
- Mode `"day"` requires `date` (throws `"date is required for mode 'day'"`)
- Mode `"week"` requires `year` AND `week` (throws `"year and week are required for mode 'week'"`)
- Mode `"range"` requires `startDate` AND `endDate` (throws `"startDate and endDate are required for mode 'range'"`)
- If `granularity` is not provided for range mode, defaults to `"week"`

## Date Helpers

### getWeekDateRange(year, week)

Returns the Sunday (start) and Saturday (end) dates for an Amazon week.

```ts
const { start, end } = getWeekDateRange(2025, 49);
// start: "2025-11-30" (Sunday)
// end: "2025-12-06" (Saturday)
```

**IMPORTANT: Amazon Week Format**
- Amazon weeks run **Sunday through Saturday** (NOT ISO Monday through Sunday)
- `getWeekDateRange()` computes based on Amazon's convention
- Week 1 starts on the Sunday of the week containing January 1st

### getWeeksInRange(startDate, endDate)

Returns an array of `{ year, week }` for all weeks overlapping the date range:

```ts
const weeks = getWeeksInRange("2025-11-01", "2025-11-30");
// [{ year: 2025, week: 44 }, { year: 2025, week: 45 }, ...]
```

### getDaysInRange(startDate, endDate)

Returns an array of date strings for every day in the range:

```ts
const days = getDaysInRange("2025-12-01", "2025-12-03");
// ["2025-12-01", "2025-12-02", "2025-12-03"]
```

## Aggregation Helpers

### aggregateWeeklyStats(stats)

Aggregates multiple weeks of `WeeklyStats` into a single `AggregatedKPIs` object. Uses **volume-weighted averages** for DWC%/IADC% (weighted by `totalDrivers`).

**Input type:**
```ts
interface WeeklyStats {
  avgDwcPercent: number;
  avgIadcPercent: number;
  totalDrivers: number;
  tierDistribution: { fantastic: number; great: number; fair: number; poor: number };
}
```

**Output type:**
```ts
interface AggregatedKPIs {
  dwcPercent: number;       // Volume-weighted average
  iadcPercent: number;      // Volume-weighted average
  totalDrivers: number;     // Average across weeks
  tierDistribution: { fantastic: number; great: number; fair: number; poor: number };
  dwcDelta: number;         // Last week - first week
  iadcDelta: number;        // Last week - first week
  periodWeeks: number;      // Number of valid weeks
}
```

**Key behavior:**
- Filters out `null` entries (weeks with no data)
- DWC/IADC percentages are weighted by `totalDrivers` per week (NOT simple averages)
- `dwcDelta` / `iadcDelta` = last valid week's value minus first valid week's value (trend)
- `tierDistribution` is a simple average across weeks (rounded)
- Returns `emptyKPIs()` if no valid stats

### emptyKPIs()

Returns the zero-state default:

```ts
{
  dwcPercent: 0,
  iadcPercent: 0,
  totalDrivers: 0,
  tierDistribution: { fantastic: 0, great: 0, fair: 0, poor: 0 },
  dwcDelta: 0,
  iadcDelta: 0,
  periodWeeks: 0,
}
```

### computeDwcPercent(compliant, misses)

```ts
computeDwcPercent(950, 50) // => 95.0
computeDwcPercent(0, 0)    // => 0 (safe division)
```

Formula: `compliant / (compliant + misses) * 100`

### computeIadcPercent(compliant, nonCompliant)

```ts
computeIadcPercent(980, 20) // => 98.0
```

Formula: `compliant / (compliant + nonCompliant) * 100`

### computeDailyKPIs(stats)

Computes KPIs from an array of daily stats (each having `totalDeliveries`, `dwcCompliant`, `iadcCompliant`):

```ts
computeDailyKPIs([
  { totalDeliveries: 100, dwcCompliant: 95, iadcCompliant: 98 },
  { totalDeliveries: 120, dwcCompliant: 110, iadcCompliant: 115 },
])
// => { dwcPercent: 93.18, iadcPercent: 96.81, totalDeliveries: 220, activeDays: 2 }
```

### computePercentDelta(current, previous)

Simple subtraction: `current - previous`. Used for week-over-week deltas.

## Connecting useFilters() Output to Convex Query Args

From the frontend, map `useFilters()` output to `timeQueryArgs`:

```tsx
import { useFilters } from "@/lib/filters";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

function Dashboard({ stationId }) {
  const { mode, year, weekNum, dateStr, normalizedTime } = useFilters();

  // For day/week modes (most common)
  const kpis = useQuery(api.dashboard.getKPIs, {
    stationId,
    mode,              // "day" | "week"
    year,              // number
    week: weekNum,     // number
    date: dateStr,     // string
  });

  // For range mode support
  const rangeKpis = useQuery(api.dashboard.getKPIs, {
    stationId,
    mode: normalizedTime.granularity === "range" ? "range" : mode,
    year,
    week: weekNum,
    date: dateStr,
    startDate: normalizedTime.start,
    endDate: normalizedTime.end,
    granularity: normalizedTime.granularity === "range" ? "week" : undefined,
  });
}
```

## DO NOT

- **Do NOT average percentages across weeks.** Use volume-weighted averages. `aggregateWeeklyStats()` already does this correctly by weighting DWC%/IADC% by `totalDrivers`. A week with 50 drivers matters more than a week with 5 drivers.
- **Do NOT use ISO Monday-Sunday weeks for Amazon data.** Amazon weeks run Sunday through Saturday. The `getWeekDateRange()` function handles this. The `getStartOfWeek()` internal helper also adjusts for Sunday start.
- **Do NOT compute percentages from other percentages.** Always go back to raw volumes (`dwcCompliant`, `dwcMisses`, `iadcCompliant`, `iadcNonCompliant`) and use `computeDwcPercent()` / `computeIadcPercent()`.
- **Do NOT forget to handle the empty case.** Always use `emptyKPIs()` as the fallback when no data is found, rather than returning undefined or constructing ad-hoc zero objects.
- **Do NOT query daily stats for multi-week ranges.** Use `stationWeeklyStats` or `driverWeeklyStats` with `getWeeksInRange()` for range mode. Daily stats are only for single-day mode.
- **Do NOT pass `stationId` without validating access.** Every query handler should call `checkStationAccess(ctx, args.stationId)` before fetching data (see permissions-rbac skill).
- **Do NOT add external date libraries in Convex functions.** The `convex/lib/timeQuery.ts` file uses pure JS date helpers (no `date-fns` dependency) because Convex server functions cannot use external npm packages. Frontend code can use `date-fns`.
- **Do NOT forget `granularity` defaults to `"week"` in range mode.** If not specified, `getTimeFilteredData()` passes `"week"` to the range handler. Day-level granularity in range mode should be explicitly opted into.
