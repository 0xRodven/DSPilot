"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"
import { ErrorTabs } from "@/components/errors/error-tabs"
import { ErrorKPIs } from "@/components/errors/error-kpis"
import { BreakdownChart } from "@/components/errors/breakdown-chart"
import { TopDriversErrors } from "@/components/errors/top-drivers-errors"
import { ErrorTrendChart } from "@/components/errors/error-trend-chart"
import { AlertTriangle } from "lucide-react"
import type { ErrorCategory } from "@/lib/types"

export default function ErrorsPage() {
  const { selectedStation } = useDashboardStore()
  const { year, weekNum } = useFilters()

  const [activeTab, setActiveTab] = useState<ErrorCategory>("dwc")
  const [errorTypeFilter, setErrorTypeFilter] = useState("all")

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get error data from Convex
  const errorsData = useQuery(
    api.stats.getErrorBreakdown,
    station ? { stationId: station._id, year, week: weekNum } : "skip"
  )
  const topDrivers = useQuery(
    api.stats.getTopDriversErrors,
    station ? { stationId: station._id, year, week: weekNum, limit: 10, errorTypeFilter } : "skip"
  )
  const trendData = useQuery(
    api.stats.getErrorTrends,
    station ? { stationId: station._id, weeksCount: 8 } : "skip"
  )

  // Loading state
  if (!station || errorsData === undefined || topDrivers === undefined || trendData === undefined) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analyse des Erreurs</h1>
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded-lg" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </main>
    )
  }

  const activeCategory = errorsData.find((c) => c.id === activeTab) || errorsData[0]

  const handleTabChange = (tab: ErrorCategory) => {
    setActiveTab(tab)
  }

  // No data state
  if (!activeCategory || errorsData.length === 0) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analyse des Erreurs</h1>
            <p className="text-sm text-muted-foreground">Semaine {weekNum}</p>
          </div>
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aucune donnée d'erreur pour la semaine {weekNum}</p>
            <p className="text-sm text-muted-foreground mt-1">Importez des données pour voir l'analyse</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="space-y-6 p-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analyse des Erreurs</h1>
          <p className="text-sm text-muted-foreground">Semaine {weekNum} • {year}</p>
        </div>

        {/* Zone 1: Tabs */}
        <ErrorTabs categories={errorsData} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Zone 2: KPIs */}
        <ErrorKPIs category={activeCategory} />

        {/* Zone 3: Charts - Two Columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BreakdownChart category={activeCategory} />
          <TopDriversErrors
            drivers={topDrivers}
            totalErrors={activeCategory.total}
            errorTypeFilter={errorTypeFilter}
            onFilterChange={setErrorTypeFilter}
          />
        </div>

        {/* Zone 4: Trend Chart */}
        <ErrorTrendChart data={trendData} />
      </div>
    </main>
  )
}
