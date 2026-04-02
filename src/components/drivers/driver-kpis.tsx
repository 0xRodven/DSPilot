"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { DriverDetail } from "@/lib/types"
import { getDwcTextClass, getDwcBadgeClass } from "@/lib/utils/performance-color"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DriverKpisProps {
  driver: DriverDetail
  comparisonLabel?: string
}

export function DriverKpis({ driver, comparisonLabel = "vs S49" }: DriverKpisProps) {
  const kpis = [
    {
      label: "DWC",
      value: `${driver.dwcPercent}%`,
      dwcPercent: driver.dwcPercent,
      showBadge: true,
      trend: driver.trend,
      trendLabel: comparisonLabel,
    },
    {
      label: "IADC",
      value: `${driver.iadcPercent}%`,
      dwcPercent: driver.iadcPercent, // Reuse for IADC (different scale but same gradient idea)
      showBadge: true,
      trend: driver.iadcTrend ?? 0,
      trendLabel: comparisonLabel,
    },
    {
      label: "Livraisons",
      value: driver.deliveries.toString(),
      dwcPercent: null,
      showBadge: false,
      trend: driver.deliveriesTrend ?? 0,
      trendLabel: comparisonLabel,
    },
    {
      label: "Erreurs",
      value: driver.errors.toString(),
      dwcPercent: null,
      showBadge: false,
      trend: driver.errorsTrend ?? 0,
      trendLabel: comparisonLabel,
      invertColors: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">{kpi.label}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  kpi.dwcPercent !== null ? getDwcTextClass(kpi.dwcPercent) : "text-card-foreground"
                )}
              >
                {kpi.value}
              </span>
              {kpi.showBadge && kpi.dwcPercent !== null && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", getDwcBadgeClass(kpi.dwcPercent))}>
                  {kpi.dwcPercent.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              {kpi.trend !== 0 && (
                <>
                  {(kpi.invertColors ? kpi.trend < 0 : kpi.trend > 0) ? (
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  <span
                    className={cn(
                      (kpi.invertColors ? kpi.trend < 0 : kpi.trend > 0) ? "text-emerald-400" : "text-red-400",
                    )}
                  >
                    {kpi.trend > 0 ? "+" : ""}
                    {kpi.trend} {kpi.trendLabel}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
