"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { DriverDetail } from "@/lib/types"
import { getIadcTier, getTierColor, getTierBgColor } from "@/lib/utils/tier"
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
      tier: driver.tier,
      showTier: true,
      trend: driver.trend,
      trendLabel: comparisonLabel,
    },
    {
      label: "IADC",
      value: `${driver.iadcPercent}%`,
      tier: getIadcTier(driver.iadcPercent),
      showTier: true,
      trend: driver.iadcTrend ?? 0,
      trendLabel: comparisonLabel,
    },
    {
      label: "Livraisons",
      value: driver.deliveries.toString(),
      tier: null,
      showTier: false,
      trend: driver.deliveriesTrend ?? 0,
      trendLabel: comparisonLabel,
    },
    {
      label: "Erreurs",
      value: driver.errors.toString(),
      tier: null,
      showTier: false,
      trend: driver.errorsTrend ?? 0,
      trendLabel: comparisonLabel,
      invertColors: true,
    },
  ]

  const tierLabels = {
    fantastic: "Fantastic",
    great: "Great",
    fair: "Fair",
    poor: "Poor",
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">{kpi.label}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={cn("text-2xl font-bold", kpi.tier ? getTierColor(kpi.tier as any) : "text-card-foreground")}
              >
                {kpi.value}
              </span>
              {kpi.showTier && kpi.tier && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", getTierBgColor(kpi.tier as any))}>
                  {tierLabels[kpi.tier as keyof typeof tierLabels]}
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
