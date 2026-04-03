# DNR Investigations + Table Harmonization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add DNR investigation tracking with scraping, Convex storage, a dedicated `/dashboard/dnr` page, driver integration, and harmonize all tables site-wide.

**Architecture:** New Python scraper for Amazon delivery concessions page → JSON artifacts → Convex `dnrInvestigations` table via ingestion mutation. New Next.js page with KPIs, sparkline, filterable table, and sheet detail with Leaflet map. DNR counts injected into existing driver tables. All tables harmonized with consistent alignment/hover/padding rules.

**Tech Stack:** Python (nodriver + BeautifulSoup), Convex (schema + queries + mutations), Next.js 16 + React 19, shadcn/ui + TanStack Table, recharts, react-leaflet, nuqs URL filters.

**Spec:** `docs/superpowers/specs/2026-04-03-dnr-investigations-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `convex/dnr.ts` | Mutations (ingest, upsert) + queries (getInvestigations, getKpis, getTrend, getDriverDnrCount) |
| `src/app/(main)/dashboard/dnr/page.tsx` | DNR page — KPIs, sparkline, table, filters |
| `src/components/dnr/dnr-table/columns.tsx` | TanStack column definitions for DNR table |
| `src/components/dnr/dnr-table/data-table.tsx` | DNR DataTable wrapper (search, status filter, pagination) |
| `src/components/dnr/dnr-detail-sheet.tsx` | Sheet with delivery detail + Leaflet map |
| `src/components/dnr/dnr-kpis.tsx` | 3 KPI cards (investigations, prevention rate, top offender) |
| `src/components/dnr/dnr-sparkline.tsx` | 8-week mini trend chart |
| `src/components/dnr/dnr-mini-table.tsx` | Mini table for driver detail page (3 rows max) |
| `scraper/amazon_concessions_sync.py` | Scrape delivery concessions page + detail popups |
| `scripts/ingest-concessions.ts` | CLI to read JSON artifacts and call Convex mutation |

### Modified Files
| File | Change |
|------|--------|
| `convex/schema.ts:567` | Add `dnrInvestigations` table definition |
| `src/navigation/sidebar/sidebar-items.ts:76` | Add DNR nav item between Erreurs and Import |
| `src/components/dashboard/drivers-table/columns.tsx` | Add DNR column + harmonize alignment |
| `src/components/drivers/drivers-table/columns.tsx` | Add DNR column + harmonize alignment |
| `src/components/drivers/daily-performance.tsx` | Add DNR column + harmonize alignment |
| `src/app/(main)/dashboard/drivers/[id]/page.tsx` | Add DNR KPI card + mini table section |
| `src/app/(main)/dashboard/reports/page.tsx` | Harmonize table alignment |
| `src/components/coaching/recaps/data-table.tsx` | Harmonize table alignment |
| `src/components/settings/subscription-settings.tsx` | Harmonize table alignment |
| `src/lib/filters/parsers.ts` | Add `driver` filter param for DNR page |
| `package.json` | Add `leaflet`, `react-leaflet`, `@types/leaflet` |

---

## Task 1: Convex Schema — Add `dnrInvestigations` Table

**Files:**
- Modify: `convex/schema.ts:567` (after last table, before closing `})`)

- [ ] **Step 1: Add the table definition**

Add after the `whatsappMessages` table (line ~567) in `convex/schema.ts`:

```typescript
  // DNR Investigations — delivery concession tracking
  dnrInvestigations: defineTable({
    organizationId: v.string(),
    stationId: v.id("stations"),
    trackingId: v.string(),
    driverId: v.optional(v.id("drivers")),
    transporterId: v.string(),
    driverName: v.string(),
    year: v.number(),
    week: v.number(),
    deliveryDatetime: v.string(),
    concessionDatetime: v.string(),
    scanType: v.string(),
    address: v.object({
      street: v.string(),
      building: v.optional(v.string()),
      floor: v.optional(v.string()),
      postalCode: v.string(),
      city: v.string(),
    }),
    gpsPlanned: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    gpsActual: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    gpsDistanceMeters: v.optional(v.number()),
    customerNotes: v.optional(v.string()),
    status: v.union(
      v.literal("ongoing"),
      v.literal("resolved"),
      v.literal("confirmed_dnr")
    ),
  })
    .index("by_org", ["organizationId"])
    .index("by_station_week", ["stationId", "year", "week"])
    .index("by_tracking", ["trackingId"])
    .index("by_driver", ["driverId", "year", "week"])
    .index("by_station_driver", ["stationId", "driverId"]),
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: No errors (Convex codegen will update `_generated/` on next `npx convex dev`)

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add dnrInvestigations table to Convex schema"
```

---

## Task 2: Convex Queries & Mutations — `convex/dnr.ts`

**Files:**
- Create: `convex/dnr.ts`

**Reference:** Check `convex/stats.ts` and `convex/reporting.ts` for existing query patterns (org isolation via `getStationForOrg` helper, `v.object()` args validation).

- [ ] **Step 1: Create `convex/dnr.ts` with ingest mutation**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Ingestion ---

export const ingestConcessions = mutation({
  args: {
    organizationId: v.string(),
    stationCode: v.string(),
    investigations: v.array(
      v.object({
        trackingId: v.string(),
        transporterId: v.string(),
        driverName: v.string(),
        year: v.number(),
        week: v.number(),
        deliveryDatetime: v.string(),
        concessionDatetime: v.string(),
        scanType: v.string(),
        address: v.object({
          street: v.string(),
          building: v.optional(v.string()),
          floor: v.optional(v.string()),
          postalCode: v.string(),
          city: v.string(),
        }),
        gpsPlanned: v.optional(v.object({ lat: v.number(), lng: v.number() })),
        gpsActual: v.optional(v.object({ lat: v.number(), lng: v.number() })),
        gpsDistanceMeters: v.optional(v.number()),
        customerNotes: v.optional(v.string()),
        status: v.union(
          v.literal("ongoing"),
          v.literal("resolved"),
          v.literal("confirmed_dnr")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Resolve station
    const station = await ctx.db
      .query("stations")
      .filter((q) => q.eq(q.field("stationCode"), args.stationCode))
      .first();
    if (!station) {
      throw new Error(`Station not found: ${args.stationCode}`);
    }

    let upserted = 0;
    for (const inv of args.investigations) {
      // Resolve driver via transporterId
      const driver = await ctx.db
        .query("drivers")
        .filter((q) =>
          q.and(
            q.eq(q.field("stationId"), station._id),
            q.eq(q.field("amazonId"), inv.transporterId)
          )
        )
        .first();

      // Check existing by trackingId
      const existing = await ctx.db
        .query("dnrInvestigations")
        .withIndex("by_tracking", (q) => q.eq("trackingId", inv.trackingId))
        .first();

      const doc = {
        organizationId: args.organizationId,
        stationId: station._id,
        trackingId: inv.trackingId,
        driverId: driver?._id,
        transporterId: inv.transporterId,
        driverName: inv.driverName,
        year: inv.year,
        week: inv.week,
        deliveryDatetime: inv.deliveryDatetime,
        concessionDatetime: inv.concessionDatetime,
        scanType: inv.scanType,
        address: inv.address,
        gpsPlanned: inv.gpsPlanned,
        gpsActual: inv.gpsActual,
        gpsDistanceMeters: inv.gpsDistanceMeters,
        customerNotes: inv.customerNotes,
        status: inv.status,
      };

      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("dnrInvestigations", doc);
      }
      upserted++;
    }

    return { upserted, stationId: station._id };
  },
});
```

- [ ] **Step 2: Add `getInvestigations` query**

Append to `convex/dnr.ts`:

```typescript
export const getInvestigations = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
    driverId: v.optional(v.id("drivers")),
    status: v.optional(
      v.union(
        v.literal("ongoing"),
        v.literal("resolved"),
        v.literal("confirmed_dnr")
      )
    ),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.driverId) {
      results = await ctx.db
        .query("dnrInvestigations")
        .withIndex("by_driver", (q) =>
          q
            .eq("driverId", args.driverId!)
            .eq("year", args.year)
            .eq("week", args.week)
        )
        .collect();
    } else {
      results = await ctx.db
        .query("dnrInvestigations")
        .withIndex("by_station_week", (q) =>
          q
            .eq("stationId", args.stationId)
            .eq("year", args.year)
            .eq("week", args.week)
        )
        .collect();
    }

    if (args.status) {
      results = results.filter((r) => r.status === args.status);
    }

    // Sort by concessionDatetime desc
    results.sort(
      (a, b) =>
        new Date(b.concessionDatetime).getTime() -
        new Date(a.concessionDatetime).getTime()
    );

    return results;
  },
});
```

- [ ] **Step 3: Add `getDriverDnrCount` query**

Append to `convex/dnr.ts`:

```typescript
export const getDriverDnrCount = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    const investigations = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_week", (q) =>
        q
          .eq("stationId", args.stationId)
          .eq("year", args.year)
          .eq("week", args.week)
      )
      .collect();

    // Group by driverId → count
    const counts: Record<string, number> = {};
    for (const inv of investigations) {
      const key = inv.driverId ?? inv.transporterId;
      counts[key] = (counts[key] || 0) + 1;
    }

    return counts;
  },
});
```

- [ ] **Step 4: Add `getKpis` query**

Append to `convex/dnr.ts`:

```typescript
export const getKpis = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Current week
    const current = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_week", (q) =>
        q
          .eq("stationId", args.stationId)
          .eq("year", args.year)
          .eq("week", args.week)
      )
      .collect();

    // Previous week
    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;
    const previous = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_week", (q) =>
        q
          .eq("stationId", args.stationId)
          .eq("year", prevYear)
          .eq("week", prevWeek)
      )
      .collect();

    // Prevention rate = (total - confirmed_dnr) / total
    const confirmedDnr = current.filter(
      (i) => i.status === "confirmed_dnr"
    ).length;
    const preventionRate =
      current.length > 0
        ? ((current.length - confirmedDnr) / current.length) * 100
        : 0;

    // Top offender over last 4 weeks — collect weeks
    const weeks: Array<{ year: number; week: number }> = [];
    let w = args.week;
    let y = args.year;
    for (let i = 0; i < 4; i++) {
      weeks.push({ year: y, week: w });
      w--;
      if (w === 0) {
        w = 52;
        y--;
      }
    }

    const allRecent: Array<{ driverId?: string; driverName: string }> = [];
    for (const wk of weeks) {
      const wkData = await ctx.db
        .query("dnrInvestigations")
        .withIndex("by_station_week", (q) =>
          q
            .eq("stationId", args.stationId)
            .eq("year", wk.year)
            .eq("week", wk.week)
        )
        .collect();
      allRecent.push(
        ...wkData.map((d) => ({
          driverId: d.driverId ? String(d.driverId) : undefined,
          driverName: d.driverName,
        }))
      );
    }

    // Count by driver name
    const driverCounts: Record<string, { name: string; count: number }> = {};
    for (const r of allRecent) {
      const key = r.driverName;
      if (!driverCounts[key]) {
        driverCounts[key] = { name: key, count: 0 };
      }
      driverCounts[key].count++;
    }

    const topOffender = Object.values(driverCounts).sort(
      (a, b) => b.count - a.count
    )[0] ?? null;

    return {
      investigationsCount: current.length,
      investigationsDelta: current.length - previous.length,
      preventionRate: Math.round(preventionRate),
      topOffender,
    };
  },
});
```

- [ ] **Step 5: Add `getTrend` query**

Append to `convex/dnr.ts`:

```typescript
export const getTrend = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    const trend: Array<{
      year: number;
      week: number;
      investigations: number;
      confirmedDnr: number;
    }> = [];

    let w = args.week;
    let y = args.year;

    for (let i = 0; i < 8; i++) {
      const weekData = await ctx.db
        .query("dnrInvestigations")
        .withIndex("by_station_week", (q) =>
          q.eq("stationId", args.stationId).eq("year", y).eq("week", w)
        )
        .collect();

      trend.unshift({
        year: y,
        week: w,
        investigations: weekData.length,
        confirmedDnr: weekData.filter((d) => d.status === "confirmed_dnr")
          .length,
      });

      w--;
      if (w === 0) {
        w = 52;
        y--;
      }
    }

    return trend;
  },
});
```

- [ ] **Step 6: Add `getDriverRecentDnr` query (for driver detail mini table)**

Append to `convex/dnr.ts`:

```typescript
export const getDriverRecentDnr = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_driver")
      .filter((q) => q.eq(q.field("driverId"), args.driverId))
      .collect();

    // Sort by concessionDatetime desc, take 3 most recent
    results.sort(
      (a, b) =>
        new Date(b.concessionDatetime).getTime() -
        new Date(a.concessionDatetime).getTime()
    );

    return results.slice(0, 3);
  },
});
```

- [ ] **Step 7: Verify types**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add convex/dnr.ts
git commit -m "feat: add DNR queries and ingest mutation"
```

---

## Task 3: Table Harmonization — All Existing Tables

**Files:**
- Modify: `src/components/dashboard/drivers-table/columns.tsx`
- Modify: `src/components/drivers/drivers-table/columns.tsx`
- Modify: `src/components/drivers/daily-performance.tsx`
- Modify: `src/app/(main)/dashboard/reports/page.tsx`
- Modify: `src/components/coaching/recaps/data-table.tsx`
- Modify: `src/components/settings/subscription-settings.tsx`

**Rules to apply everywhere:**

| Content Type | Header Class | Cell Class |
|-------------|-------------|------------|
| Text (name, description) | `text-left` | `text-left` |
| Numbers (%, count) | `text-right` | `text-right tabular-nums` |
| IDs (Amazon ID, Tracking) | `text-right` | `text-right font-mono text-xs` |
| Actions | `text-right` | `text-right` |
| All headers | `text-muted-foreground text-sm font-medium` | — |
| All cells | — | `p-2 px-3` |
| Clickable rows | — | `hover:bg-muted/50 cursor-pointer transition-colors` |

- [ ] **Step 1: Harmonize dashboard drivers table columns**

Read `src/components/dashboard/drivers-table/columns.tsx` and apply alignment rules. Key changes:
- Amazon ID column: change header and cell to `text-right font-mono text-xs`
- DWC% column: ensure header is `text-right`
- IADC% column: ensure header is `text-right`
- Total Deliveries: `text-right tabular-nums`
- Days Active: `text-right tabular-nums`
- All headers: ensure `text-muted-foreground text-sm font-medium`

- [ ] **Step 2: Harmonize drivers list table columns**

Read `src/components/drivers/drivers-table/columns.tsx` and apply same rules:
- Amazon ID (inside name cell or separate): `text-right font-mono text-xs`
- All numeric columns: `text-right tabular-nums`
- Headers: `text-muted-foreground text-sm font-medium`

- [ ] **Step 3: Harmonize daily performance table**

Read `src/components/drivers/daily-performance.tsx` and update:
- DWC%, IADC%, Livraisons, Erreurs headers: `text-right`
- Cell values: `text-right tabular-nums`
- Jour column: `text-left`
- Statut column: `text-left`

- [ ] **Step 4: Harmonize reports table**

Read `src/app/(main)/dashboard/reports/page.tsx` and update:
- Période, Créé le: `text-right` (dates)
- Confiance: keep center
- Actions: `text-right`
- All headers: `text-muted-foreground text-sm font-medium`

- [ ] **Step 5: Harmonize coaching recaps table**

Read `src/components/coaching/recaps/data-table.tsx` (and its columns file) and update:
- Colis, DWC, Trend: `text-right tabular-nums`
- Headers: `text-muted-foreground text-sm font-medium`

- [ ] **Step 6: Harmonize settings invoices table**

Read `src/components/settings/subscription-settings.tsx` and update:
- Montant: `text-right tabular-nums`
- Date: `text-right`
- Headers: `text-muted-foreground text-sm font-medium`

- [ ] **Step 7: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/components/dashboard/drivers-table/columns.tsx \
        src/components/drivers/drivers-table/columns.tsx \
        src/components/drivers/daily-performance.tsx \
        src/app/(main)/dashboard/reports/page.tsx \
        src/components/coaching/recaps/ \
        src/components/settings/subscription-settings.tsx
git commit -m "fix: harmonize table alignment across all pages"
```

---

## Task 4: Install Dependencies + URL Filter

**Files:**
- Modify: `package.json`
- Modify: `src/lib/filters/parsers.ts`

- [ ] **Step 1: Install leaflet and react-leaflet**

```bash
npm install leaflet react-leaflet @types/leaflet
```

- [ ] **Step 2: Add `driver` filter param to nuqs parsers**

Read `src/lib/filters/parsers.ts` and add a `driver` param to the `searchParams` object (around line 86-100):

```typescript
driver: parseAsString.withDefault(""),
```

- [ ] **Step 3: Verify types**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/filters/parsers.ts
git commit -m "chore: add leaflet deps + driver URL filter param"
```

---

## Task 5: Sidebar Navigation — Add DNR Item

**Files:**
- Modify: `src/navigation/sidebar/sidebar-items.ts:76`

- [ ] **Step 1: Add DNR nav item**

Read `src/navigation/sidebar/sidebar-items.ts`. In the first group ("Principal"), add the DNR item after "Erreurs" (after the errors entry, before "Import"):

```typescript
{
  title: "DNR",
  url: "/dashboard/dnr",
  icon: PackageX,
},
```

Add the `PackageX` import from `lucide-react` at the top of the file.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/navigation/sidebar/sidebar-items.ts
git commit -m "feat: add DNR item to sidebar navigation"
```

---

## Task 6: DNR KPIs Component

**Files:**
- Create: `src/components/dnr/dnr-kpis.tsx`

**Reference:** Look at existing KPI card patterns in `src/app/(main)/dashboard/page.tsx` (the dashboard KPI cards) for consistent styling.

- [ ] **Step 1: Create KPI component**

```typescript
"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, User } from "lucide-react"

interface DnrKpisProps {
  stationId: Id<"stations">
  year: number
  week: number
}

export function DnrKpis({ stationId, year, week }: DnrKpisProps) {
  const kpis = useQuery(api.dnr.getKpis, { stationId, year, week })

  if (kpis === undefined) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  const deltaColor =
    kpis.investigationsDelta > 0
      ? "text-red-400"
      : kpis.investigationsDelta < 0
        ? "text-emerald-400"
        : "text-muted-foreground"

  const DeltaIcon =
    kpis.investigationsDelta > 0 ? TrendingUp : TrendingDown

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Investigations count */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Investigations</p>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{kpis.investigationsCount}</span>
            {kpis.investigationsDelta !== 0 && (
              <span className={`flex items-center text-xs ${deltaColor}`}>
                <DeltaIcon className="mr-0.5 h-3 w-3" />
                {Math.abs(kpis.investigationsDelta)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prevention rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Prevention Rate</p>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-bold ${kpis.preventionRate >= 75 ? "text-emerald-400" : kpis.preventionRate >= 50 ? "text-amber-400" : "text-red-400"}`}>
              {kpis.preventionRate}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Top offender */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Top recidiviste (4 sem.)</p>
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            {kpis.topOffender ? (
              <div>
                <span className="text-lg font-bold">{kpis.topOffender.name.split(" ").pop()}</span>
                <span className="ml-2 text-sm text-red-400">({kpis.topOffender.count})</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Aucun</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dnr/dnr-kpis.tsx
git commit -m "feat: add DNR KPI cards component"
```

---

## Task 7: DNR Sparkline Component

**Files:**
- Create: `src/components/dnr/dnr-sparkline.tsx`

**Reference:** Check `src/components/ui/chart.tsx` for ChartContainer usage and `src/components/dashboard/performance-chart.tsx` for recharts patterns.

- [ ] **Step 1: Create sparkline component**

```typescript
"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { Bar, ComposedChart, Line, ResponsiveContainer, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

interface DnrSparklineProps {
  stationId: Id<"stations">
  year: number
  week: number
}

const chartConfig = {
  investigations: {
    label: "Investigations",
    color: "hsl(var(--chart-1))",
  },
  confirmedDnr: {
    label: "DNR confirmés",
    color: "hsl(var(--destructive))",
  },
}

export function DnrSparkline({ stationId, year, week }: DnrSparklineProps) {
  const trend = useQuery(api.dnr.getTrend, { stationId, year, week })

  if (trend === undefined) {
    return <Skeleton className="h-[60px] w-full" />
  }

  const data = trend.map((t) => ({
    label: `S${t.week}`,
    investigations: t.investigations,
    confirmedDnr: t.confirmedDnr,
  }))

  return (
    <ChartContainer config={chartConfig} className="h-[60px] w-full">
      <ComposedChart data={data}>
        <XAxis dataKey="label" hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="confirmedDnr"
          fill="var(--color-confirmedDnr)"
          radius={[2, 2, 0, 0]}
          barSize={12}
        />
        <Line
          dataKey="investigations"
          stroke="var(--color-investigations)"
          strokeWidth={2}
          dot={false}
          type="monotone"
        />
      </ComposedChart>
    </ChartContainer>
  )
}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dnr/dnr-sparkline.tsx
git commit -m "feat: add DNR sparkline trend chart"
```

---

## Task 8: DNR Table — Columns + DataTable

**Files:**
- Create: `src/components/dnr/dnr-table/columns.tsx`
- Create: `src/components/dnr/dnr-table/data-table.tsx`

**Reference:** Follow the exact pattern from `src/components/drivers/drivers-table/columns.tsx` and `src/components/drivers/drivers-table/data-table.tsx` for TanStack table setup, sorting, filtering, and pagination.

- [ ] **Step 1: Create column definitions**

Read the existing drivers-table columns file for the exact pattern (ColumnDef imports, SortableHeader, etc.), then create `src/components/dnr/dnr-table/columns.tsx`:

Define columns for: #, Livreur, Amazon ID, Tracking, Date livraison, Date concession, Délai, Scan, Distance GPS, Ville, Statut.

Apply harmonized alignment rules:
- Text columns (Livreur, Scan, Ville, Statut): `text-left`
- Numeric columns (Délai, Distance GPS): `text-right tabular-nums`
- ID columns (Amazon ID, Tracking): `text-right font-mono text-xs`
- Date columns: `text-right`
- All headers: `text-muted-foreground text-sm font-medium`

Color rules:
- Délai: `text-red-400` if > 3 days, `text-amber-400` if > 1 day, `text-emerald-400` otherwise
- Distance GPS: `text-red-400` if > 50m, `text-amber-400` if > 20m, `text-emerald-400` otherwise
- Statut badges: ongoing = amber, resolved = emerald, confirmed_dnr = red

- [ ] **Step 2: Create DataTable wrapper**

Create `src/components/dnr/dnr-table/data-table.tsx` following the drivers-table data-table pattern:
- Search input (filter by livreur name or tracking ID)
- Status filter dropdown (All / Ongoing / Resolved / Confirmed DNR)
- Pagination (20 per page)
- Row click handler (opens the detail sheet — pass `onRowClick` prop)
- Sorted by date concession desc by default

- [ ] **Step 3: Verify types**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/dnr/dnr-table/
git commit -m "feat: add DNR table columns and data-table component"
```

---

## Task 9: DNR Detail Sheet

**Files:**
- Create: `src/components/dnr/dnr-detail-sheet.tsx`

- [ ] **Step 1: Create detail sheet component**

Use shadcn `Sheet` (SheetContent, SheetHeader, SheetTitle). Include:
- Header: Tracking ID + status badge
- Section "Livraison": driver name (link), delivery date → concession date, délai, scan type
- Section "Adresse": full address, customer notes in `bg-muted rounded-lg p-3`
- Section "Géolocalisation": lazy-loaded Leaflet map (~200px) with two markers (blue=planned, red=actual) + distance display
- Section "Actions": "Créer action coaching" button (links to coaching page with pre-filled context)

For the Leaflet map, use dynamic import:
```typescript
import dynamic from "next/dynamic"
const MapView = dynamic(() => import("./dnr-map"), { ssr: false })
```

- [ ] **Step 2: Create map sub-component**

Create `src/components/dnr/dnr-map.tsx`:
- Import `MapContainer`, `TileLayer`, `Marker`, `Polyline` from react-leaflet
- Import leaflet CSS in the component
- Two markers: blue (planned) + red (actual)
- Polyline connecting them
- Auto-fit bounds to show both markers
- Height: 200px, rounded-lg overflow-hidden

- [ ] **Step 3: Verify types**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/dnr/dnr-detail-sheet.tsx src/components/dnr/dnr-map.tsx
git commit -m "feat: add DNR detail sheet with Leaflet map"
```

---

## Task 10: DNR Page — `/dashboard/dnr`

**Files:**
- Create: `src/app/(main)/dashboard/dnr/page.tsx`

**Reference:** Follow the structure of `src/app/(main)/dashboard/errors/page.tsx` for how existing dashboard pages use the global filters (station, week) and compose KPIs + table.

- [ ] **Step 1: Create the page**

```typescript
"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useFilters } from "@/lib/filters/hooks"
import { DnrKpis } from "@/components/dnr/dnr-kpis"
import { DnrSparkline } from "@/components/dnr/dnr-sparkline"
import { DnrDataTable } from "@/components/dnr/dnr-table/data-table"
import { DnrDetailSheet } from "@/components/dnr/dnr-detail-sheet"
import { columns } from "@/components/dnr/dnr-table/columns"
import { Skeleton } from "@/components/ui/skeleton"
import { PackageX } from "lucide-react"
import { useState } from "react"
import type { Doc } from "@convex/_generated/dataModel"

export default function DnrPage() {
  const { station, normalizedTime, filters } = useFilters()
  const [selectedInvestigation, setSelectedInvestigation] =
    useState<Doc<"dnrInvestigations"> | null>(null)

  // Get driver filter from URL (if navigated from drivers page)
  const driverFilter = filters.driver || undefined

  const investigations = useQuery(
    api.dnr.getInvestigations,
    station
      ? {
          stationId: station._id,
          year: normalizedTime.year,
          week: normalizedTime.week,
          ...(driverFilter ? { driverId: driverFilter as any } : {}),
        }
      : "skip"
  )

  if (!station) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <PackageX className="h-6 w-6" />
          Investigations DNR
        </h1>
        <p className="text-sm text-muted-foreground">
          Suivi des réclamations "Did Not Receive"
        </p>
      </div>

      {/* KPIs */}
      <DnrKpis
        stationId={station._id}
        year={normalizedTime.year}
        week={normalizedTime.week}
      />

      {/* Sparkline */}
      <DnrSparkline
        stationId={station._id}
        year={normalizedTime.year}
        week={normalizedTime.week}
      />

      {/* Table */}
      {investigations === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : investigations.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <PackageX className="mb-2 h-8 w-8" />
          <p>Aucune investigation DNR cette semaine</p>
        </div>
      ) : (
        <DnrDataTable
          columns={columns}
          data={investigations}
          onRowClick={setSelectedInvestigation}
        />
      )}

      {/* Detail Sheet */}
      <DnrDetailSheet
        investigation={selectedInvestigation}
        open={selectedInvestigation !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedInvestigation(null)
        }}
      />
    </div>
  )
}
```

Note: The exact `useFilters()` return shape and `station` resolution pattern must match the existing pages — read the errors page to confirm the pattern before implementing.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/dashboard/dnr/
git commit -m "feat: add /dashboard/dnr page"
```

---

## Task 11: Integration — DNR Column in Driver Tables

**Files:**
- Modify: `src/components/dashboard/drivers-table/columns.tsx`
- Modify: `src/components/drivers/drivers-table/columns.tsx`
- Modify: `src/components/drivers/daily-performance.tsx`

These tables need to display a DNR count per driver. The `getDriverDnrCount` query returns a `Record<string, number>` for the whole station+week. The count should be passed as data to the table rows.

- [ ] **Step 1: Add dnrCount to dashboard drivers table**

Read the dashboard drivers table data-table component to understand how data flows. The `columns.tsx` defines the column, and the data-table fetches the data.

Add `dnrCount` to the row interface. Add a new column after IADC%:
- Header: `DNR` aligned right
- Cell: if > 0, red badge linking to `/dashboard/dnr?driver={driverId}`. If 0, `—` in muted.
- Use `useRouter` for navigation on click (or `<Link>` inside the cell)

The parent component that renders this table needs to merge the DNR counts into the driver data. Read the parent component to see where the data is assembled, then add the `useQuery(api.dnr.getDriverDnrCount, ...)` call there and merge counts into each driver row.

- [ ] **Step 2: Add dnrCount to drivers list table**

Same pattern as step 1. Read the drivers list page (`src/app/(main)/dashboard/drivers/page.tsx`) to see where data is assembled. Add the DNR count query and merge.

- [ ] **Step 3: Add DNR column to daily performance table**

Read `src/components/drivers/daily-performance.tsx`. This is a simpler table (not TanStack). Add a "DNR" column header and cell. For daily stats, the DNR count comes from `driverDailyStats.dnrCount` which already exists in the schema — just display it.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/drivers-table/ \
        src/components/drivers/drivers-table/ \
        src/components/drivers/daily-performance.tsx \
        src/app/(main)/dashboard/drivers/page.tsx \
        src/app/(main)/dashboard/page.tsx
git commit -m "feat: add DNR column to all driver tables"
```

---

## Task 12: Integration — Driver Detail Page

**Files:**
- Modify: `src/app/(main)/dashboard/drivers/[id]/page.tsx`
- Create: `src/components/dnr/dnr-mini-table.tsx`

- [ ] **Step 1: Create DNR mini table component**

Create `src/components/dnr/dnr-mini-table.tsx`:

```typescript
"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface DnrMiniTableProps {
  driverId: Id<"drivers">
}

const statusColors = {
  ongoing: "bg-amber-500/20 text-amber-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
  confirmed_dnr: "bg-red-500/20 text-red-400",
} as const

export function DnrMiniTable({ driverId }: DnrMiniTableProps) {
  const investigations = useQuery(api.dnr.getDriverRecentDnr, { driverId })

  if (!investigations || investigations.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Dernières investigations DNR</h3>
        <Link
          href={`/dashboard/dnr?driver=${driverId}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Voir tout <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground text-sm font-medium">Tracking</TableHead>
              <TableHead className="text-right text-muted-foreground text-sm font-medium">Date</TableHead>
              <TableHead className="text-muted-foreground text-sm font-medium">Scan</TableHead>
              <TableHead className="text-right text-muted-foreground text-sm font-medium">Distance</TableHead>
              <TableHead className="text-muted-foreground text-sm font-medium">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investigations.map((inv) => (
              <TableRow key={inv._id} className="hover:bg-transparent">
                <TableCell className="p-2 px-3 font-mono text-xs">{inv.trackingId}</TableCell>
                <TableCell className="p-2 px-3 text-right tabular-nums text-sm">
                  {format(new Date(inv.concessionDatetime), "dd/MM", { locale: fr })}
                </TableCell>
                <TableCell className="p-2 px-3 text-xs">{inv.scanType.replace("DELIVERED_TO_", "")}</TableCell>
                <TableCell className="p-2 px-3 text-right tabular-nums">
                  {inv.gpsDistanceMeters != null ? `${Math.round(inv.gpsDistanceMeters)}m` : "—"}
                </TableCell>
                <TableCell className="p-2 px-3">
                  <Badge variant="outline" className={statusColors[inv.status]}>
                    {inv.status === "confirmed_dnr" ? "DNR" : inv.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add DNR KPI card and mini table to driver detail page**

Read `src/app/(main)/dashboard/drivers/[id]/page.tsx`. Find where `DriverKpis` is rendered and the daily performance section.

Add the `DnrMiniTable` component after the daily performance table. Also check the `DriverKpis` component — if it's a separate component file, add a DNR count card there. If KPIs are inline, add a 5th card for DNR.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/dnr/dnr-mini-table.tsx \
        src/app/(main)/dashboard/drivers/\[id\]/page.tsx
git commit -m "feat: add DNR section to driver detail page"
```

---

## Task 13: Scraper — `amazon_concessions_sync.py`

**Files:**
- Create: `scraper/amazon_concessions_sync.py`

**Reference:** Follow the exact patterns from `scraper/amazon_supplementary_sync.py` for browser automation (nodriver, cookie loading, week picker, page navigation).

- [ ] **Step 1: Create the scraper**

Create `scraper/amazon_concessions_sync.py`:

1. Navigate to `https://logistics.amazon.fr/performance?pageId=dsp_delivery_concessions&tabId=delivery-concessions-weekly-tab&timeFrame=Weekly&to={week}`
2. Wait for table to load
3. Parse the main table — each row has: tracking ID + basic info
4. For each row, click the tracking ID link to open the detail popup/page
5. From the detail popup, extract:
   - Driver name + Transporter ID (from "Livreur" / "ID du transporteur" fields)
   - Delivery datetime + Concession datetime
   - Scan type ("Lieu de depot")
   - Full address (street, building, floor, postal code, city)
   - GPS planned + actual (lat, lng from "Emplacement planifie" / "Emplacement reel")
   - Distance ("Distance entre les emplacements reel et planifie")
   - Customer notes ("Notes du client")
6. Close detail, move to next row
7. Save JSON to `.artifacts/concessions/{week-slug}/concessions.json`

CLI args: `--weeks N`, `--target-week`, `--target-year`, `--output-dir`, `--invoke-ingest`, `--station-code`

The detail extraction must handle the key-value pair layout shown by the user:
```
Zone de service/DSP: DIF1 / PSUA
Livreur: Aboubacar Mamadou KAMARA
ID du transporteur: A3HCU65N5A41UK
...
```

Parse these as label-value pairs from the DOM.

- [ ] **Step 2: Test locally with saved HTML**

If possible, save a concessions page HTML from the VPS and test the parser locally. Otherwise, test on VPS.

- [ ] **Step 3: Commit**

```bash
git add scraper/amazon_concessions_sync.py
git commit -m "feat: add Amazon delivery concessions scraper"
```

---

## Task 14: Ingestion Script

**Files:**
- Create: `scripts/ingest-concessions.ts`

**Reference:** Follow the pattern from `scripts/generate-report.ts` for how existing scripts call Convex mutations from CLI (ConvexClient setup, env vars).

- [ ] **Step 1: Create ingestion CLI**

Create `scripts/ingest-concessions.ts`:
- Read JSON from `.artifacts/concessions/{week-slug}/concessions.json`
- Call `api.dnr.ingestConcessions` mutation with the parsed data
- CLI args: `--artifacts-dir`, `--station-code`, `--organization-id`
- Log results (upserted count)

- [ ] **Step 2: Add npm script**

Add to `package.json` scripts:
```json
"concessions:ingest": "tsx scripts/ingest-concessions.ts"
```

- [ ] **Step 3: Verify types**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add scripts/ingest-concessions.ts package.json
git commit -m "feat: add concessions ingestion CLI script"
```

---

## Task 15: VPS Cron Setup

**Files:** VPS only (no git changes)

- [ ] **Step 1: Deploy scraper to VPS**

```bash
scp scraper/amazon_concessions_sync.py openclaw:/root/DSPilot/scraper/
```

- [ ] **Step 2: Deploy Convex schema + mutations**

```bash
npx convex deploy
```

- [ ] **Step 3: Create systemd timer on VPS**

SSH to VPS and create `dspilot-concessions-daily` timer:
- Schedule: 6h15 Paris (after amazon-daily at 5h35)
- Command: Claude Opus orchestrates scrape + ingest (same pattern as other crons)

- [ ] **Step 4: Test the full pipeline**

Run scraper manually on VPS for current week, verify data appears in Convex, verify the DNR page shows it.

- [ ] **Step 5: Backfill historical data**

Run scraper with `--weeks 12` to backfill ~12 weeks of concessions data.

---

## Task 16: Final Verification

- [ ] **Step 1: Full type check + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 2: Visual check**

Open the app and verify:
- Sidebar shows "DNR" item
- `/dashboard/dnr` page loads with KPIs, sparkline, table
- Clicking a row opens the sheet with map
- Driver tables show DNR column
- Driver detail shows DNR KPI + mini table
- All tables have harmonized alignment (especially Amazon ID right-aligned)

- [ ] **Step 3: Deploy**

```bash
npx convex deploy
# Vercel auto-deploys on push
git push
```
