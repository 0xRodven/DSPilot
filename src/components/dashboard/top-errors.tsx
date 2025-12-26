"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/calculations"
import { useDashboardStore } from "@/lib/store"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { getWeek } from "date-fns"

export function TopErrors() {
  const { selectedStation, selectedDate, granularity } = useDashboardStore()
  const week = getWeek(selectedDate, { weekStartsOn: 1 })
  const year = selectedDate.getFullYear()

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get error breakdown from Convex
  const errorBreakdown = useQuery(
    api.stats.getErrorBreakdown,
    station ? { stationId: station._id, year, week } : "skip"
  )

  const periodLabel = granularity === "week"
    ? `Semaine ${week}`
    : selectedDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })

  // Loading state
  if (!station || errorBreakdown === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-card-foreground">Top 5 Erreurs</CardTitle>
          <p className="text-xs text-muted-foreground">{periodLabel} • Chargement...</p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-4 bg-muted rounded w-12" />
                </div>
                <div className="mt-1.5 h-2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform error breakdown into top errors list
  const allErrors: { id: string; name: string; count: number }[] = []

  if (errorBreakdown) {
    // DWC errors
    const dwcCategory = errorBreakdown.find(cat => cat.id === "dwc")
    if (dwcCategory) {
      dwcCategory.subcategories.forEach(sub => {
        if (sub.count > 0) {
          allErrors.push({
            id: `dwc-${sub.name}`,
            name: sub.name,
            count: sub.count,
          })
        }
      })
    }

    // IADC errors
    const iadcCategory = errorBreakdown.find(cat => cat.id === "iadc")
    if (iadcCategory) {
      iadcCategory.subcategories.forEach(sub => {
        if (sub.count > 0) {
          allErrors.push({
            id: `iadc-${sub.name}`,
            name: sub.name,
            count: sub.count,
          })
        }
      })
    }

    // Failed attempts
    const falseScans = errorBreakdown.find(cat => cat.id === "false-scans")
    if (falseScans && falseScans.total > 0) {
      allErrors.push({
        id: "false-scans",
        name: "Tentatives échouées",
        count: falseScans.total,
      })
    }
  }

  // Sort by count and take top 5
  const topErrors = allErrors
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const totalErrors = allErrors.reduce((sum, error) => sum + error.count, 0)
  const maxCount = topErrors.length > 0 ? topErrors[0].count : 0

  // No data state
  if (topErrors.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-card-foreground">Top 5 Erreurs</CardTitle>
          <p className="text-xs text-muted-foreground">{periodLabel} • 0 total</p>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune erreur pour cette période
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-card-foreground">Top 5 Erreurs</CardTitle>
        <p className="text-xs text-muted-foreground">{periodLabel} • {formatNumber(totalErrors)} total</p>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-4">
          {topErrors.map((error, index) => {
            const percentage = maxCount > 0 ? Math.round((error.count / maxCount) * 100) : 0
            return (
              <div key={error.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm font-medium text-card-foreground">{error.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">{formatNumber(error.count)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500/80 to-red-400/60"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs text-muted-foreground">
                    {totalErrors > 0 ? Math.round((error.count / totalErrors) * 100) : 0}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <Button variant="ghost" className="mt-4 w-full text-primary hover:text-primary">
          Voir analyse →
        </Button>
      </CardContent>
    </Card>
  )
}
