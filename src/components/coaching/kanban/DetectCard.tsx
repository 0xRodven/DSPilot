"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Plus, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTierBgColor } from "@/lib/utils/tier"
import type { Id } from "../../../../convex/_generated/dataModel"

interface DetectCardData {
  id: string
  driverId: Id<"drivers">
  driverName: string
  dwcPercent: number
  tier: "fantastic" | "great" | "fair" | "poor"
  trendPercent: number
  deliveries: number
}

interface DetectCardProps {
  data: DetectCardData
  onPlanCoaching: (driverId: Id<"drivers">, driverName: string, dwcPercent: number) => void
}

export function DetectCard({ data, onPlanCoaching }: DetectCardProps) {
  const TrendIcon = data.trendPercent >= 0 ? TrendingUp : TrendingDown
  const trendColor = data.trendPercent >= 0 ? "text-emerald-400" : "text-red-400"

  return (
    <div className="rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-card-foreground truncate">{data.driverName}</p>
          <Badge className={cn("mt-1 text-xs", getTierBgColor(data.tier))}>
            {data.tier.charAt(0).toUpperCase() + data.tier.slice(1)}
          </Badge>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-card-foreground">{data.dwcPercent}%</p>
          <p className="text-xs text-muted-foreground">DWC</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          <span>{data.deliveries}</span>
        </div>
        <div className={cn("flex items-center gap-1", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {data.trendPercent > 0 ? "+" : ""}
            {data.trendPercent}%
          </span>
        </div>
      </div>

      <Button
        size="sm"
        className="mt-3 w-full"
        onClick={() => onPlanCoaching(data.driverId, data.driverName, data.dwcPercent)}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Coaching
      </Button>
    </div>
  )
}
