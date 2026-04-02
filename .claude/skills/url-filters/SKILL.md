---
name: url-filters
description: nuqs-based URL filtering system for DSPilot. Handles time periods (day/week/range), station selection, and filter persistence. Use when working with dashboard filtering or navigation.
allowed-tools: Read, Write, Edit
---

# DSPilot URL Filtering System Reference

Sources:
- `/src/lib/filters/hooks.ts` - Main hooks
- `/src/lib/filters/parsers.ts` - nuqs parsers and serialization
- `/src/lib/filters/types.ts` - TypeScript types
- `/src/lib/filters/normalization.ts` - URL state to API normalization
- `/src/lib/store.ts` - Zustand store (legacy + sidebar state)

## Architecture

The filtering system is **URL-first** using [nuqs](https://nuqs.47ng.com/) (Next.js URL query state). All time/filter state lives in the URL, making views shareable and bookmarkable. The Zustand store (`useDashboardStore`) handles non-URL state (sidebar collapsed, station selection persistence via localStorage).

## 3 Period Modes

| Mode | URL Param | Format | Example |
|---|---|---|---|
| `week` | `?period=week&week=2025-W49` | `YYYY-WNN` | `?period=week&week=2025-W49` |
| `day` | `?period=day&date=2025-12-09` | `YYYY-MM-DD` | `?period=day&date=2025-12-09` |
| `range` | `?period=range&range=2025-01-01_2025-01-31` | `YYYY-MM-DD_YYYY-MM-DD` | `?period=range&range=2025-01-01_2025-01-31` |

Default: `period=week` with the current ISO week.

## URL Parameters (filterParsers)

| Param | Parser | Default | Description |
|---|---|---|---|
| `period` | `parseAsString` | `"week"` | Period mode: day/week/range |
| `week` | `parseAsString` | Current week (`"2025-W49"`) | Week selection |
| `date` | `parseAsString` | Today (`"2025-12-09"`) | Day selection |
| `range` | `parseAsString` | `null` (optional) | Range as `start_end` |
| `station` | `parseAsString` | `""` | Station filter |
| `tier` | `parseAsString` | `"all"` | Tier filter: all/fantastic/great/fair/poor |
| `errorType` | `parseAsString` | `"all"` | Error type filter |
| `search` | `parseAsString` | `""` | Text search |

## Types

```ts
type PeriodMode = "day" | "week" | "range";
type WeekValue = { year: number; week: number };
type RangeValue = { start: Date; end: Date };
type TierFilter = "all" | "fantastic" | "great" | "fair" | "poor";

interface NormalizedTimeFilter {
  start: string;      // ISO date "YYYY-MM-DD"
  end: string;        // ISO date "YYYY-MM-DD"
  granularity: "day" | "week" | "range";
  year?: number;      // For week mode compat
  week?: number;      // For week mode compat
  dateStr?: string;   // For day mode compat
}
```

## useFilters() Hook API

The main hook. Returns everything needed for time-filtered views.

### Returned Values

```ts
const {
  // === Typed parsed values ===
  period,          // PeriodMode ("day" | "week" | "range")
  week,            // WeekValue { year, week }
  date,            // string "YYYY-MM-DD"
  range,           // RangeValue | null
  station,         // string (station filter)
  tier,            // TierFilter
  errorType,       // string
  search,          // string

  // === Setters ===
  setFilters,      // (updates: Partial<FilterValues>) => void (batch update)
  setPeriod,       // (period: PeriodMode) => void
  setWeek,         // (week: WeekValue) => void
  setDate,         // (date: string) => void
  setRange,        // (range: RangeValue | null) => void
  setStation,      // (station: string) => void
  setTier,         // (tier: TierFilter) => void
  setErrorType,    // (errorType: string) => void
  setSearch,       // (search: string) => void

  // === Normalized time for Convex API ===
  normalizedTime,  // NormalizedTimeFilter

  // === Legacy compat (flat year/week/date) ===
  year,            // number (from normalizedTime or week.year)
  weekNum,         // number (from normalizedTime or week.week)
  dateStr,         // string (from normalizedTime or date)
  mode,            // "day" | "week" (simplified -- range maps to "week")

  // === UI helpers ===
  displayLabel,    // string ("Semaine 49 . 2025", "Lundi 9 dec 2025", etc.)
  navigate,        // (direction: "prev" | "next") => void
  goToToday,       // () => void
  isCurrent,       // boolean (is this the current period?)
  canNavigate,     // boolean (always true)
} = useFilters();
```

## Connecting Filters to Convex Queries

Pattern for passing useFilters() output to Convex queries using `timeQueryArgs`:

```tsx
import { useFilters } from "@/lib/filters";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

function Dashboard({ stationId }) {
  const { mode, year, weekNum, dateStr } = useFilters();

  const data = useQuery(api.dashboard.getKPIs, {
    stationId,
    mode,           // "day" | "week"
    year,           // number
    week: weekNum,  // number
    date: dateStr,  // string "YYYY-MM-DD"
  });
}
```

For range mode, pass `startDate` / `endDate` from `normalizedTime`:

```tsx
const { mode, year, weekNum, dateStr, normalizedTime } = useFilters();

const data = useQuery(api.dashboard.getKPIs, {
  stationId,
  mode: normalizedTime.granularity === "range" ? "range" : mode,
  year,
  week: weekNum,
  date: dateStr,
  startDate: normalizedTime.start,
  endDate: normalizedTime.end,
});
```

## useBuildFilteredHref() for Navigation

Returns a function to build URLs that preserve current time filters. Used by sidebar navigation links.

```tsx
import { useBuildFilteredHref } from "@/lib/filters";

function Sidebar() {
  const buildHref = useBuildFilteredHref();

  return (
    <nav>
      <Link href={buildHref("/dashboard")}>Dashboard</Link>
      <Link href={buildHref("/drivers")}>Drivers</Link>
      <Link href={buildHref("/coaching")}>Coaching</Link>
    </nav>
  );
}
```

Generated URL example: `/dashboard?period=week&week=2025-W49`

There is also `useFilteredHref(pathname)` which takes a single pathname and returns the href directly (no callback).

## Other Hooks

### useStationFilter()

Minimal hook for pages that only need station filtering (no time):

```tsx
const { station, setStation } = useStationFilter();
```

### useTimeParams() (deprecated)

Legacy compatibility hook. Returns old-style `{ time, year, week, dateStr, mode, queryParams }`. Use `useFilters()` instead.

## Zustand Store (useDashboardStore)

The store at `/src/lib/store.ts` handles:

- **Sidebar state:** `sidebarCollapsed`, `toggleSidebar()`, `setSidebarCollapsed()`
- **Station selection persistence:** `selectedStation` (persisted to localStorage)
- **Time state:** `time` (TimeContext) -- this is the store's internal representation, synchronized with URL via `useFilters()`
- **Navigation:** `navigateTime()`, `goToToday()`, `navigatePeriod()`
- **Computed:** `getQueryParams()`, `getDisplayLabel()`, `getEffectiveDateRange()`

The store persists `sidebarCollapsed`, `selectedStation`, and `time` to localStorage under the key `"dspilot-dashboard"`.

**Important:** `useFilters()` (URL-based) is the source of truth for time state. The store re-exports `useFilters` and `useTimeParams` from `@/lib/filters` for convenience. The store's own time state exists for legacy compat and non-URL contexts.

## Serialization Helpers

| Function | Input | Output | Example |
|---|---|---|---|
| `serializeWeek(value)` | `WeekValue` | `string` | `{ year: 2025, week: 49 }` -> `"2025-W49"` |
| `parseWeekString(str)` | `string` | `WeekValue \| null` | `"2025-W49"` -> `{ year: 2025, week: 49 }` |
| `serializeRange(value)` | `RangeValue` | `string` | `{ start, end }` -> `"2025-01-01_2025-01-31"` |
| `parseRangeString(str)` | `string` | `RangeValue \| null` | `"2025-01-01_2025-01-31"` -> `{ start, end }` |

## DO NOT

- **Do NOT use `useDashboardStore()` for time state in new code.** Use `useFilters()` -- it is the URL-first source of truth. The store exists for sidebar state and legacy compatibility.
- **Do NOT manually construct URL query strings.** Use `useBuildFilteredHref()` or `useFilteredHref()` to preserve current filters during navigation.
- **Do NOT add new URL params to `filterParsers` without a default value** (except truly optional params like `range`). Missing defaults cause hydration mismatches in Next.js.
- **Do NOT read `window.location` directly.** nuqs handles all URL state. Reading the URL directly will be out of sync during transitions.
- **Do NOT forget `shallow: false`** when calling `useQueryStates`. The main `useFilters()` hook already sets this. Without it, page data will not refetch on filter changes.
- **Do NOT store Convex `Id<"stations">` in the URL.** The `station` param stores a station code or empty string, not a Convex document ID.
- **Do NOT mix ISO week numbering with Amazon week numbering** in the same context. The URL uses ISO weeks (date-fns `getISOWeek`). The Convex backend uses Amazon weeks (Sunday-Saturday). Conversion happens at the query boundary.
- **Do NOT create new Zustand slices for filter state.** All filter state goes through nuqs URL params via `filterParsers`.
