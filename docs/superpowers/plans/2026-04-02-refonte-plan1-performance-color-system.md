# Plan 1: Performance Color System — Tier Removal Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the invented tier system (Fantastic/Great/Fair/Poor) with a continuous gradient color system based on DWC%, making the foundation for all subsequent dashboard/report changes.

**Architecture:** Create `performance-color.ts` as a drop-in replacement for `tier.ts`. It provides a continuous color gradient function instead of categorical tier functions. All 42 files that reference tiers will be migrated incrementally — backend first (Convex), then frontend components. The `Tier` type is replaced by raw `number` (DWC%) everywhere. The `tierDistribution` schema field gets a parallel `dwcDistribution` field for the transition.

**Tech Stack:** TypeScript, Convex, React, Tailwind CSS

**Scope:** This plan covers ONLY the color/tier system swap. Dashboard layout changes, new KPIs, alerts refonte, and PDF reports are separate plans.

---

### Task 1: Create performance-color.ts (gradient system)

**Files:**
- Create: `src/lib/utils/performance-color.ts`

- [ ] **Step 1: Create the performance color module**

```typescript
// src/lib/utils/performance-color.ts
//
// Continuous gradient color system for DWC%.
// Replaces the categorical tier system (Fantastic/Great/Fair/Poor).
// No invented tiers — just a smooth color gradient from red to green.

type ColorStop = { pct: number; hex: string; tw: string }

// Color stops for DWC% gradient (from worst to best)
const DWC_COLOR_STOPS: ColorStop[] = [
  { pct: 80,  hex: "#ef4444", tw: "text-red-500" },
  { pct: 85,  hex: "#f97316", tw: "text-orange-500" },
  { pct: 88,  hex: "#f59e0b", tw: "text-amber-500" },
  { pct: 90,  hex: "#60a5fa", tw: "text-blue-400" },
  { pct: 92,  hex: "#3b82f6", tw: "text-blue-500" },
  { pct: 95,  hex: "#10b981", tw: "text-emerald-500" },
  { pct: 97,  hex: "#059669", tw: "text-emerald-600" },
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]
  const [rA, gA, bA] = parse(hexA)
  const [rB, gB, bB] = parse(hexB)
  const r = Math.round(lerp(rA, rB, t))
  const g = Math.round(lerp(gA, gB, t))
  const b = Math.round(lerp(bA, bB, t))
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

/**
 * Returns an interpolated hex color for any DWC percentage.
 * Smooth gradient: red (≤80%) → orange → amber → blue → green (≥97%)
 */
export function getDwcColor(dwcPercent: number): string {
  if (dwcPercent <= DWC_COLOR_STOPS[0].pct) return DWC_COLOR_STOPS[0].hex
  if (dwcPercent >= DWC_COLOR_STOPS[DWC_COLOR_STOPS.length - 1].pct) {
    return DWC_COLOR_STOPS[DWC_COLOR_STOPS.length - 1].hex
  }
  for (let i = 0; i < DWC_COLOR_STOPS.length - 1; i++) {
    const lo = DWC_COLOR_STOPS[i]
    const hi = DWC_COLOR_STOPS[i + 1]
    if (dwcPercent >= lo.pct && dwcPercent <= hi.pct) {
      const t = (dwcPercent - lo.pct) / (hi.pct - lo.pct)
      return lerpHex(lo.hex, hi.hex, t)
    }
  }
  return DWC_COLOR_STOPS[DWC_COLOR_STOPS.length - 1].hex
}

/**
 * Returns the nearest Tailwind text class for a DWC percentage.
 * Use this in components where inline styles aren't practical.
 */
export function getDwcTextClass(dwcPercent: number): string {
  if (dwcPercent >= 95) return "text-emerald-500"
  if (dwcPercent >= 92) return "text-blue-500"
  if (dwcPercent >= 90) return "text-blue-400"
  if (dwcPercent >= 88) return "text-amber-500"
  if (dwcPercent >= 85) return "text-orange-500"
  return "text-red-500"
}

/**
 * Returns a Tailwind background class for a DWC percentage badge.
 */
export function getDwcBadgeClass(dwcPercent: number): string {
  if (dwcPercent >= 95) return "bg-emerald-500/10 text-emerald-600"
  if (dwcPercent >= 92) return "bg-blue-500/10 text-blue-600"
  if (dwcPercent >= 90) return "bg-blue-400/10 text-blue-500"
  if (dwcPercent >= 88) return "bg-amber-500/10 text-amber-600"
  if (dwcPercent >= 85) return "bg-orange-500/10 text-orange-600"
  return "bg-red-500/10 text-red-600"
}

/**
 * Returns the nearest Tailwind border class for a DWC percentage.
 */
export function getDwcBorderClass(dwcPercent: number): string {
  if (dwcPercent >= 95) return "border-l-emerald-500"
  if (dwcPercent >= 92) return "border-l-blue-500"
  if (dwcPercent >= 90) return "border-l-blue-400"
  if (dwcPercent >= 88) return "border-l-amber-500"
  if (dwcPercent >= 85) return "border-l-orange-500"
  return "border-l-red-500"
}

/**
 * Computes the distribution of drivers across DWC% ranges.
 * Returns counts per 5% bucket — no invented tier labels.
 */
export interface DwcDistribution {
  above95: number   // ≥ 95%
  pct90to95: number // 90–94.9%
  pct85to90: number // 85–89.9%
  pct80to85: number // 80–84.9%
  below80: number   // < 80%
}

export function computeDwcDistribution(
  drivers: { dwcPercent: number }[]
): DwcDistribution {
  const dist: DwcDistribution = {
    above95: 0,
    pct90to95: 0,
    pct85to90: 0,
    pct80to85: 0,
    below80: 0,
  }
  for (const d of drivers) {
    if (d.dwcPercent >= 95) dist.above95++
    else if (d.dwcPercent >= 90) dist.pct90to95++
    else if (d.dwcPercent >= 85) dist.pct85to90++
    else if (d.dwcPercent >= 80) dist.pct80to85++
    else dist.below80++
  }
  return dist
}

/** Color stops data — exposed for charts that need the raw gradient definition */
export const DWC_GRADIENT_STOPS = DWC_COLOR_STOPS
```

- [ ] **Step 2: Verify the module compiles**

Run: `npx tsc --noEmit src/lib/utils/performance-color.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/performance-color.ts
git commit -m "feat: add performance-color.ts — continuous DWC gradient system (replaces tiers)"
```

---

### Task 2: Add dwcDistribution to Convex schema (parallel to tierDistribution)

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add dwcDistribution validator alongside tierDistribution**

In `convex/schema.ts`, add after the `tierDistributionValidator` (around line 20):

```typescript
const dwcDistributionValidator = v.object({
  above95: v.number(),
  pct90to95: v.number(),
  pct85to90: v.number(),
  pct80to85: v.number(),
  below80: v.number(),
});
```

- [ ] **Step 2: Add dwcDistribution field to stationWeeklyStats**

In the `stationWeeklyStats` table definition, add after `tierDistribution`:

```typescript
    dwcDistribution: v.optional(dwcDistributionValidator),
```

- [ ] **Step 3: Add dwcDistribution field to imports table**

In the `imports` table definition, add after `tierDistribution`:

```typescript
    dwcDistribution: v.optional(dwcDistributionValidator),
```

- [ ] **Step 4: Verify Convex schema compiles**

Run: `npx tsc --noEmit`
Expected: No errors (the new fields are optional so existing code still works)

- [ ] **Step 5: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add dwcDistribution to schema (parallel to tierDistribution for migration)"
```

---

### Task 3: Migrate Convex backend — stats.ts

**Files:**
- Modify: `convex/stats.ts`

This is the biggest backend file. The strategy: keep `tierDistribution` computation for backward compat, add `dwcDistribution` alongside it, and change the `tier` field on driver objects from a string to the raw `dwcPercent` number.

- [ ] **Step 1: Add dwcDistribution computation to getDashboardKPIs**

In `convex/stats.ts`, find the `getDashboardKPIs` handler where `tiers[getTier(dwcPercent)]++` is calculated (around line 229). Add immediately after:

```typescript
    // DWC distribution (no tiers — factual ranges)
    const dwcDist = { above95: 0, pct90to95: 0, pct85to90: 0, pct80to85: 0, below80: 0 };
```

Then inside the driver loop where `tiers[getTier(dwcPercent)]++` is, add:

```typescript
      if (dwcPercent >= 95) dwcDist.above95++;
      else if (dwcPercent >= 90) dwcDist.pct90to95++;
      else if (dwcPercent >= 85) dwcDist.pct85to90++;
      else if (dwcPercent >= 80) dwcDist.pct80to85++;
      else dwcDist.below80++;
```

And in the return object, add `dwcDistribution: dwcDist` alongside `tierDistribution`.

- [ ] **Step 2: Repeat for getDashboardKPIsRange**

Apply the same pattern to `getDashboardKPIsRange` (around line 1075).

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add convex/stats.ts
git commit -m "feat: add dwcDistribution to dashboard KPI queries (alongside tierDistribution)"
```

---

### Task 4: Migrate Convex backend — imports.ts, automation.ts

**Files:**
- Modify: `convex/imports.ts`
- Modify: `convex/automation.ts`

- [ ] **Step 1: Add dwcDistribution to imports.ts**

In the import completion flow where `tierDistribution` is calculated, add the equivalent `dwcDistribution` computation using the same pattern as Task 3.

- [ ] **Step 2: Add dwcDistribution to automation.ts**

In the automation aggregation logic (around line 1068-1120), add `dwcDistribution` computation alongside `tierDistribution`.

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add convex/imports.ts convex/automation.ts
git commit -m "feat: add dwcDistribution to imports and automation pipelines"
```

---

### Task 5: Create migration-safe exports in tier.ts

**Files:**
- Modify: `src/lib/utils/tier.ts`

Rather than removing tier.ts immediately (which would break 42 files at once), we re-export from performance-color.ts so existing code keeps working while we migrate.

- [ ] **Step 1: Add deprecation re-exports**

Add at the bottom of `src/lib/utils/tier.ts`:

```typescript
// ============================================================
// MIGRATION: These re-exports allow gradual migration.
// Import from "@/lib/utils/performance-color" for new code.
// ============================================================
export {
  getDwcColor,
  getDwcTextClass,
  getDwcBadgeClass,
  getDwcBorderClass,
  computeDwcDistribution,
  type DwcDistribution,
} from "./performance-color"
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/tier.ts
git commit -m "refactor: add performance-color re-exports to tier.ts for gradual migration"
```

---

### Task 6: Migrate frontend — KPI cards (first visible component)

**Files:**
- Modify: `src/components/dashboard/kpi-cards.tsx`

- [ ] **Step 1: Replace tier imports with performance-color**

Change:
```typescript
import { getTier, getIadcTier, getTierBgColor } from "@/lib/utils/tier"
```
To:
```typescript
import { getDwcBadgeClass } from "@/lib/utils/performance-color"
```

- [ ] **Step 2: Replace tier badge logic**

Where it calculates `const dwcTier = getTier(kpis.avgDwc)` and uses `getTierBgColor(dwcTier)`, replace with:

```typescript
getDwcBadgeClass(kpis.avgDwc)
```

Same for IADC — use `getDwcBadgeClass(kpis.avgIadc)` (the color gradient works for any percentage).

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/kpi-cards.tsx
git commit -m "refactor: migrate KPI cards from tier badges to gradient colors"
```

---

### Task 7: Migrate frontend — drivers table columns

**Files:**
- Modify: `src/components/dashboard/drivers-table/columns.tsx`
- Modify: `src/components/drivers/drivers-table/columns.tsx`

- [ ] **Step 1: Replace tier imports in dashboard drivers table**

Change imports from `getTierColor, getTierBgColor` to `getDwcTextClass, getDwcBadgeClass` from performance-color.

Replace `getTierColor(tier)` with `getDwcTextClass(row.dwcPercent)`.

Remove the tier column — replace with a DWC% badge using `getDwcBadgeClass(row.dwcPercent)` that shows the raw percentage.

- [ ] **Step 2: Repeat for drivers page table**

Apply the same changes to `src/components/drivers/drivers-table/columns.tsx`.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/drivers-table/columns.tsx src/components/drivers/drivers-table/columns.tsx
git commit -m "refactor: migrate driver table columns from tier badges to DWC% gradient"
```

---

### Task 8: Migrate frontend — tier-distribution.tsx → dwc-distribution.tsx

**Files:**
- Modify: `src/components/dashboard/tier-distribution.tsx`

- [ ] **Step 1: Replace tier distribution chart with DWC% distribution**

Rewrite the component to show a horizontal bar chart with 5 segments (≥95%, 90-95%, 85-90%, 80-85%, <80%) using the gradient colors from performance-color.ts. Each segment shows the driver count. No tier labels.

Replace the pie chart with horizontal stacked bars. Use the `dwcDistribution` field from KPIs if available, falling back to `tierDistribution` mapped to the new format during transition.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/tier-distribution.tsx
git commit -m "refactor: replace tier distribution pie chart with DWC% range histogram"
```

---

### Task 9: Migrate frontend — coaching components

**Files:**
- Modify: `src/components/coaching/action-card.tsx`
- Modify: `src/components/coaching/kanban/DetectCard.tsx`
- Modify: `src/components/coaching/new-action-modal.tsx`
- Modify: `src/components/coaching/coaching-suggestions.tsx`

- [ ] **Step 1: Replace getTierBgColor with getDwcBadgeClass in all coaching components**

In each file, change:
```typescript
import { getTierBgColor } from "@/lib/utils/tier"
```
To:
```typescript
import { getDwcBadgeClass } from "@/lib/utils/performance-color"
```

Replace `getTierBgColor(data.tier)` with `getDwcBadgeClass(data.dwcPercent)` — this requires the coaching data to include `dwcPercent` instead of (or alongside) `tier`.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/coaching/
git commit -m "refactor: migrate coaching components from tier badges to DWC% gradient"
```

---

### Task 10: Migrate remaining frontend files

**Files:**
- Modify: `src/components/drivers/tier-stats-cards.tsx`
- Modify: `src/components/drivers/driver-header.tsx`
- Modify: `src/components/drivers/driver-kpis.tsx`
- Modify: `src/components/dashboard/top-drivers.tsx`
- Modify: `src/components/errors/top-drivers-errors.tsx`
- Modify: `src/components/import/import-state.tsx`
- Modify: `src/app/(main)/dashboard/drivers/page.tsx`
- Modify: `src/app/(main)/dashboard/coaching/page.tsx`

- [ ] **Step 1: Replace all remaining tier imports with performance-color equivalents**

Each file follows the same pattern: replace `getTierColor`/`getTierBgColor`/`getTierBorderColor` with `getDwcTextClass`/`getDwcBadgeClass`/`getDwcBorderClass`.

For `tier-stats-cards.tsx`: refactor from 4 tier cards (Fantastic/Great/Fair/Poor) to 5 range cards (≥95%, 90-95%, 85-90%, 80-85%, <80%) with gradient colors.

For `driver-header.tsx` and `driver-kpis.tsx`: use `getDwcTextClass(driver.dwcPercent)` instead of `getTierColor(driver.tier)`.

- [ ] **Step 2: Verify full build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ src/app/
git commit -m "refactor: complete frontend migration from tiers to DWC% gradient colors"
```

---

### Task 11: Migrate hooks and types

**Files:**
- Modify: `src/hooks/use-import.ts`
- Modify: `src/hooks/use-batch-import.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/calculations.ts`
- Modify: `src/lib/filters/parsers.ts`

- [ ] **Step 1: Update import hooks to compute dwcDistribution instead of tierDistribution**

In both `use-import.ts` and `use-batch-import.ts`, replace:
```typescript
import { getTier } from "@/lib/utils/tier"
const tierDistribution = { fantastic: 0, great: 0, fair: 0, poor: 0 }
tierDistribution[getTier(dwcPercent)]++
```
With:
```typescript
import { computeDwcDistribution } from "@/lib/utils/performance-color"
```
And compute `dwcDistribution` from the array of driver DWC percentages at the end.

- [ ] **Step 2: Update types.ts**

In `src/lib/types.ts`, change the Driver interface:
```typescript
// Remove: tier: Tier
// Keep: dwcPercent already exists as a number
```

- [ ] **Step 3: Update filter parsers**

In `src/lib/filters/parsers.ts`, replace `TierFilter` with a DWC range filter:
```typescript
export type DwcRangeFilter = "all" | "above95" | "90to95" | "85to90" | "80to85" | "below80"
```

- [ ] **Step 4: Update calculations.ts**

Remove `getTier()`, `TIER_THRESHOLDS`, `TIER_LABELS`, `calculateTierDistribution()`, `calculateHighPerformersPercent()`, `emptyTierDistribution` from `calculations.ts`. Replace with imports from `performance-color.ts`.

- [ ] **Step 5: Verify full build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/hooks/ src/lib/
git commit -m "refactor: migrate hooks, types, and calculations from tiers to DWC% ranges"
```

---

### Task 12: Update PDF export

**Files:**
- Modify: `src/lib/pdf/weekly-recap-document.tsx`
- Modify: `src/components/dashboard/export-button.tsx`

- [ ] **Step 1: Remove tier references from PDF document**

In `weekly-recap-document.tsx`:
- Remove `PDFTierDistribution` interface
- Replace tier badge styles with inline `style={{ color: getDwcColor(driver.dwcPercent) }}`
- Replace "Tier Distribution" section with "DWC% Distribution" showing the 5 ranges
- Import `getDwcColor` from performance-color

- [ ] **Step 2: Update export button**

In `export-button.tsx`, replace `tierDistribution: kpis.tierDistribution` with `dwcDistribution: kpis.dwcDistribution`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdf/ src/components/dashboard/export-button.tsx
git commit -m "refactor: migrate PDF export from tier badges to DWC% gradient colors"
```

---

### Task 13: Final verification and cleanup

**Files:**
- All modified files

- [ ] **Step 1: Grep for remaining tier references**

Run: `grep -r "getTier\|getTierColor\|getTierBgColor\|getTierBorderColor\|getIadcTier" src/ --include="*.ts" --include="*.tsx" -l`

Expected: No results (or only `src/lib/utils/tier.ts` itself which still exports for backward compat)

- [ ] **Step 2: Full build verification**

Run: `npm run build`
Expected: Clean build, all routes compile

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "refactor: complete tier removal — DSPilot now uses continuous DWC% gradient (Plan 1 complete)"
```
