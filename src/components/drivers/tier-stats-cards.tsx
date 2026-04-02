"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface DwcRangeStat {
  count: number
  percentage: string
  trend: number
}

interface DwcRangeStats {
  above95: DwcRangeStat
  pct90to95: DwcRangeStat
  pct85to90: DwcRangeStat
  pct80to85: DwcRangeStat
  below80: DwcRangeStat
  total: number
  active: number
}

// Backward compatibility: convert tier stats to DWC range stats
interface LegacyTierStats {
  fantastic: DwcRangeStat
  great: DwcRangeStat
  fair: DwcRangeStat
  poor: DwcRangeStat
  total: number
  active: number
}

type StatsInput = DwcRangeStats | LegacyTierStats

interface DwcRangeStatsCardsProps {
  stats: StatsInput
  selectedTier: string
  onTierSelect: (tier: string) => void
  comparisonLabel?: string
}

const dwcRangeConfig = {
  above95: {
    label: ">=95%",
    color: "text-emerald-500",
    borderColor: "border-l-emerald-500",
    bgHover: "hover:bg-emerald-500/10",
    bgSelected: "bg-emerald-500/10",
  },
  pct90to95: {
    label: "90-95%",
    color: "text-blue-500",
    borderColor: "border-l-blue-500",
    bgHover: "hover:bg-blue-500/10",
    bgSelected: "bg-blue-500/10",
  },
  pct85to90: {
    label: "85-90%",
    color: "text-amber-500",
    borderColor: "border-l-amber-500",
    bgHover: "hover:bg-amber-500/10",
    bgSelected: "bg-amber-500/10",
  },
  pct80to85: {
    label: "80-85%",
    color: "text-orange-500",
    borderColor: "border-l-orange-500",
    bgHover: "hover:bg-orange-500/10",
    bgSelected: "bg-orange-500/10",
  },
  below80: {
    label: "<80%",
    color: "text-red-500",
    borderColor: "border-l-red-500",
    bgHover: "hover:bg-red-500/10",
    bgSelected: "bg-red-500/10",
  },
}

// Helper to check if stats are legacy tier stats
function isLegacyTierStats(stats: StatsInput): stats is LegacyTierStats {
  return "fantastic" in stats
}

// Convert legacy tier stats to DWC range stats
function convertToRangeStats(stats: StatsInput): DwcRangeStats {
  if (!isLegacyTierStats(stats)) {
    return stats
  }

  // Map tier stats to range stats (best approximation)
  return {
    above95: stats.fantastic,
    pct90to95: stats.great,
    pct85to90: { count: Math.floor(stats.fair.count / 2), percentage: "0", trend: stats.fair.trend },
    pct80to85: { count: Math.ceil(stats.fair.count / 2), percentage: "0", trend: stats.fair.trend },
    below80: stats.poor,
    total: stats.total,
    active: stats.active,
  }
}

export function TierStatsCards({ stats, selectedTier, onTierSelect, comparisonLabel = "vs S49" }: DwcRangeStatsCardsProps) {
  const rangeStats = convertToRangeStats(stats)

  const ranges = [
    { key: "above95", ...dwcRangeConfig.above95, ...rangeStats.above95 },
    { key: "pct90to95", ...dwcRangeConfig.pct90to95, ...rangeStats.pct90to95 },
    { key: "pct85to90", ...dwcRangeConfig.pct85to90, ...rangeStats.pct85to90 },
    { key: "pct80to85", ...dwcRangeConfig.pct80to85, ...rangeStats.pct80to85 },
    { key: "below80", ...dwcRangeConfig.below80, ...rangeStats.below80 },
  ]

  // Map legacy tier filter keys to new range keys for backward compatibility
  const normalizeFilterKey = (key: string) => {
    switch (key) {
      case "fantastic": return "above95"
      case "great": return "pct90to95"
      case "fair": return "pct85to90"
      case "poor": return "below80"
      default: return key
    }
  }

  const normalizedSelectedTier = normalizeFilterKey(selectedTier)

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {ranges.map((range) => {
        const isSelected = normalizedSelectedTier === range.key
        return (
          <Card
            key={range.key}
            className={cn(
              "cursor-pointer border-l-4 border-border bg-card transition-all",
              range.borderColor,
              range.bgHover,
              isSelected && range.bgSelected,
            )}
            onClick={() => onTierSelect(isSelected ? "all" : range.key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", range.color)}>{range.label}</span>
                {range.trend !== 0 && (
                  <span
                    className={cn("flex items-center text-xs", range.trend > 0 ? "text-emerald-400" : "text-red-400")}
                  >
                    {range.trend > 0 ? (
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                    )}
                    {range.trend > 0 ? "+" : ""}
                    {range.trend} {comparisonLabel}
                  </span>
                )}
                {range.trend === 0 && (
                  <span className="flex items-center text-xs text-muted-foreground">
                    <Minus className="mr-0.5 h-3 w-3" />
                    {comparisonLabel}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-card-foreground">{range.count}</span>
                <span className="ml-2 text-sm text-muted-foreground">drivers</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{range.percentage}%</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
