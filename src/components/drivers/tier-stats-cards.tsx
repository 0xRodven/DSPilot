"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TierStat {
  count: number
  percentage: string
  trend: number
}

interface TierStats {
  fantastic: TierStat
  great: TierStat
  fair: TierStat
  poor: TierStat
  total: number
  active: number
}

interface TierStatsCardsProps {
  stats: TierStats
  selectedTier: string
  onTierSelect: (tier: string) => void
  comparisonLabel?: string
}

const tierConfig = {
  fantastic: {
    label: "Fantastic",
    color: "text-emerald-400",
    borderColor: "border-l-emerald-500",
    bgHover: "hover:bg-emerald-500/10",
    bgSelected: "bg-emerald-500/10",
  },
  great: {
    label: "Great",
    color: "text-blue-400",
    borderColor: "border-l-blue-500",
    bgHover: "hover:bg-blue-500/10",
    bgSelected: "bg-blue-500/10",
  },
  fair: {
    label: "Fair",
    color: "text-amber-400",
    borderColor: "border-l-amber-500",
    bgHover: "hover:bg-amber-500/10",
    bgSelected: "bg-amber-500/10",
  },
  poor: {
    label: "Poor",
    color: "text-red-400",
    borderColor: "border-l-red-500",
    bgHover: "hover:bg-red-500/10",
    bgSelected: "bg-red-500/10",
  },
}

export function TierStatsCards({ stats, selectedTier, onTierSelect, comparisonLabel = "vs S49" }: TierStatsCardsProps) {

  const tiers = [
    { key: "fantastic", ...tierConfig.fantastic, ...stats.fantastic },
    { key: "great", ...tierConfig.great, ...stats.great },
    { key: "fair", ...tierConfig.fair, ...stats.fair },
    { key: "poor", ...tierConfig.poor, ...stats.poor },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiers.map((tier) => {
        const isSelected = selectedTier === tier.key
        return (
          <Card
            key={tier.key}
            className={cn(
              "cursor-pointer border-l-4 border-border bg-card transition-all",
              tier.borderColor,
              tier.bgHover,
              isSelected && tier.bgSelected,
            )}
            onClick={() => onTierSelect(isSelected ? "all" : tier.key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", tier.color)}>{tier.label}</span>
                {tier.trend !== 0 && (
                  <span
                    className={cn("flex items-center text-xs", tier.trend > 0 ? "text-emerald-400" : "text-red-400")}
                  >
                    {tier.trend > 0 ? (
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                    )}
                    {tier.trend > 0 ? "+" : ""}
                    {tier.trend} {comparisonLabel}
                  </span>
                )}
                {tier.trend === 0 && (
                  <span className="flex items-center text-xs text-muted-foreground">
                    <Minus className="mr-0.5 h-3 w-3" />
                    {comparisonLabel}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-card-foreground">{tier.count}</span>
                <span className="ml-2 text-sm text-muted-foreground">drivers</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{tier.percentage}%</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
