---
name: tier-calculator
description: Calculate DWC/IADC tiers and apply consistent color coding. Use for any performance classification, tier-related UI work, or driver ranking features.
allowed-tools: Read, Write, Edit
---

# Tier Calculator Skill for DSPilot

## When to Use
- Implementing tier classification logic
- Applying tier colors to UI components
- Building driver rankings or performance badges
- Calculating trends and changes
- Working with IADC tier classification

## Reference Implementations
- Frontend: `src/lib/utils/tier.ts` (DWC + IADC + colors)
- Backend: `convex/lib/tier.ts` (DWC only, used in Convex functions)

## DWC Tier Thresholds

| Tier | DWC % | Description |
|------|-------|-------------|
| Fantastic | >= 95% | Performance excellente |
| Great | >= 90% | Très bonne performance |
| Fair | >= 88% | Performance acceptable |
| Poor | < 88% | Performance à améliorer |

## IADC Tier Thresholds

| Tier | IADC % | Description |
|------|--------|-------------|
| Fantastic | >= 70% | Performance excellente |
| Great | >= 60% | Très bonne performance |
| Fair | >= 50% | Performance acceptable |
| Poor | < 50% | Performance à améliorer |

## TypeScript Types & Constants

```typescript
export type Tier = "fantastic" | "great" | "fair" | "poor"

// DWC
export const tierThresholds = { fantastic: 95, great: 90, fair: 88, poor: 0 } as const
export const getTier = (dwcPercent: number): Tier => {
  if (dwcPercent >= 95) return "fantastic"
  if (dwcPercent >= 90) return "great"
  if (dwcPercent >= 88) return "fair"
  return "poor"
}

// IADC
export const iadcThresholds = { fantastic: 70, great: 60, fair: 50, poor: 0 } as const
export const getIadcTier = (iadcPercent: number): Tier => {
  if (iadcPercent >= 70) return "fantastic"
  if (iadcPercent >= 60) return "great"
  if (iadcPercent >= 50) return "fair"
  return "poor"
}

// Labels
export const tierLabels: Record<Tier, string> = { fantastic: "Fantastic", great: "Great", fair: "Fair", poor: "Poor" }
export const tierDescriptions: Record<Tier, string> = {
  fantastic: "DWC ≥ 95% — Performance excellente",
  great: "DWC ≥ 90% — Très bonne performance",
  fair: "DWC ≥ 88% — Performance acceptable",
  poor: "DWC < 88% — Performance à améliorer",
}
```

## Color Functions

```typescript
// Text colors
export const getTierColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic": return "text-emerald-400"
    case "great": return "text-blue-400"
    case "fair": return "text-amber-400"
    case "poor": return "text-red-400"
  }
}

// Badge backgrounds (with transparency)
export const getTierBgColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic": return "bg-emerald-500/20 text-emerald-400"
    case "great": return "bg-blue-500/20 text-blue-400"
    case "fair": return "bg-amber-500/20 text-amber-400"
    case "poor": return "bg-red-500/20 text-red-400"
  }
}

// Border colors (left border accent)
export const getTierBorderColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic": return "border-l-emerald-500"
    case "great": return "border-l-blue-500"
    case "fair": return "border-l-amber-500"
    case "poor": return "border-l-red-500"
  }
}
```

## Hex Colors (for charts, PDF)
```typescript
const tierHexColors = {
  fantastic: "#34d399", // emerald-400
  great: "#60a5fa",     // blue-400
  fair: "#fbbf24",      // amber-400
  poor: "#f87171",      // red-400
}
```

## Backend (Convex) — `convex/lib/tier.ts`

```typescript
import { getTier } from "./tier"

export const DWC_TIER_THRESHOLDS = { fantastic: 95, great: 90, fair: 88, poor: 0 } as const
export function getTier(dwcPercent: number): Tier {
  if (dwcPercent >= DWC_TIER_THRESHOLDS.fantastic) return "fantastic"
  if (dwcPercent >= DWC_TIER_THRESHOLDS.great) return "great"
  if (dwcPercent >= DWC_TIER_THRESHOLDS.fair) return "fair"
  return "poor"
}
```

## DWC/IADC Calculation Formulas

```typescript
// DWC% = compliant / (compliant + misses + failedAttempts) * 100
const dwcPercent = (dwcCompliant / (dwcCompliant + dwcMisses + failedAttempts)) * 100

// IADC% = compliant / (compliant + nonCompliant) * 100
const iadcPercent = (iadcCompliant / (iadcCompliant + iadcNonCompliant)) * 100

// Fleet average: sum volumes, NOT average of percentages
const fleetDwc = totalCompliant / (totalCompliant + totalMisses + totalFailed) * 100
```

## Usage Patterns

```tsx
import { getTier, getTierColor, getTierBgColor, getTierBorderColor } from "@/lib/utils/tier"

// Card with tier border accent
<Card className={cn("border-l-4", getTierBorderColor(getTier(dwcPercent)))}>
  <Badge className={getTierBgColor(getTier(dwcPercent))}>{tierLabels[tier]}</Badge>
  <span className={getTierColor(getTier(dwcPercent))}>{dwcPercent.toFixed(1)}%</span>
</Card>
```

## DO NOT
- Use thresholds other than 95/90/88 for DWC
- Use thresholds other than 70/60/50 for IADC
- Change color mappings without approval
- Use hardcoded hex colors instead of Tailwind functions in UI
- Average percentages instead of volume-weighted calculation
