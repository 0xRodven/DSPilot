---
name: tier-calculator
description: Calculate DWC/IADC tiers and apply consistent color coding. Use for any performance classification, tier-related UI work, or driver ranking features.
allowed-tools: Read, Write, Edit
---

# Tier Calculator Skill for DSPilot

## When to Use
- Implementing tier classification logic
- Applying tier colors to UI components
- Building driver rankings
- Creating performance badges
- Calculating trends and changes

## Reference Implementation
Location: `/src/lib/utils/tier.ts`

## Tier Thresholds

| Tier | DWC % | Description |
|------|-------|-------------|
| Fantastic | >= 98.5% | Performance excellente |
| Great | >= 96% | Tres bonne performance |
| Fair | >= 90% | Performance acceptable |
| Poor | < 90% | Performance a ameliorer |

## TypeScript Types

```typescript
export type Tier = "fantastic" | "great" | "fair" | "poor"

export const tierThresholds = {
  fantastic: 98.5,
  great: 96,
  fair: 90,
  poor: 0,
} as const

export const tierLabels: Record<Tier, string> = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
}

export const tierDescriptions: Record<Tier, string> = {
  fantastic: "DWC >= 98.5% - Performance excellente",
  great: "DWC >= 96% - Tres bonne performance",
  fair: "DWC >= 90% - Performance acceptable",
  poor: "DWC < 90% - Performance a ameliorer",
}
```

## Classification Function

```typescript
export const getTier = (dwcPercent: number): Tier => {
  if (dwcPercent >= 98.5) return "fantastic"
  if (dwcPercent >= 96) return "great"
  if (dwcPercent >= 90) return "fair"
  return "poor"
}
```

## Color Functions

### Text Colors
```typescript
export const getTierColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic": return "text-emerald-400"
    case "great": return "text-blue-400"
    case "fair": return "text-amber-400"
    case "poor": return "text-red-400"
  }
}
```

### Background Colors (with transparency)
```typescript
export const getTierBgColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic": return "bg-emerald-500/20 text-emerald-400"
    case "great": return "bg-blue-500/20 text-blue-400"
    case "fair": return "bg-amber-500/20 text-amber-400"
    case "poor": return "bg-red-500/20 text-red-400"
  }
}
```

### Border Colors
```typescript
export const getTierBorderColor = (tier: Tier) => {
  switch (tier) {
    case "fantastic": return "border-l-emerald-500"
    case "great": return "border-l-blue-500"
    case "fair": return "border-l-amber-500"
    case "poor": return "border-l-red-500"
  }
}
```

## Usage Patterns

### In Components
```tsx
import { getTier, getTierColor, getTierBgColor } from "@/lib/utils/tier"

function DriverCard({ dwcPercent }: { dwcPercent: number }) {
  const tier = getTier(dwcPercent)

  return (
    <Card className={cn("border-l-4", getTierBorderColor(tier))}>
      <Badge className={getTierBgColor(tier)}>
        {tierLabels[tier]}
      </Badge>
      <span className={getTierColor(tier)}>
        {dwcPercent.toFixed(1)}%
      </span>
    </Card>
  )
}
```

### In Tables
```tsx
<TableCell className={getTierColor(getTier(driver.dwcPercent))}>
  {driver.dwcPercent.toFixed(1)}%
</TableCell>
```

### In Charts
```typescript
const tierColors = {
  fantastic: "#34d399", // emerald-400
  great: "#60a5fa",     // blue-400
  fair: "#fbbf24",      // amber-400
  poor: "#f87171",      // red-400
}
```

## Trend Calculation

```typescript
export function calculateTrend(
  current: number,
  previous: number
): { direction: "up" | "down" | "stable"; change: number } {
  const change = current - previous
  const direction =
    change > 0.5 ? "up" :
    change < -0.5 ? "down" :
    "stable"

  return { direction, change: Math.abs(change) }
}
```

## Tier Distribution

```typescript
interface TierDistribution {
  fantastic: number
  great: number
  fair: number
  poor: number
}

export function calculateTierDistribution(
  stats: { dwcPercent: number }[]
): TierDistribution {
  return stats.reduce(
    (acc, stat) => {
      const tier = getTier(stat.dwcPercent)
      acc[tier]++
      return acc
    },
    { fantastic: 0, great: 0, fair: 0, poor: 0 }
  )
}
```

## Ranking Logic

```typescript
// Sort drivers by DWC descending
const ranked = drivers
  .map((d, index) => ({
    ...d,
    rank: index + 1,
    tier: getTier(d.dwcPercent),
  }))
  .sort((a, b) => b.dwcPercent - a.dwcPercent)
```

## DO NOT
- Use different thresholds than defined above
- Create new tier levels
- Change color mappings without approval
- Use hardcoded colors instead of functions
- Calculate tier from IADC (only DWC)
