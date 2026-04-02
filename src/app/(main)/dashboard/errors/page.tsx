"use client";

import { useState } from "react";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { AlertTriangle } from "lucide-react";

import { BreakdownChart } from "@/components/errors/breakdown-chart";
import { ErrorKPIs } from "@/components/errors/error-kpis";
import { ErrorTabs } from "@/components/errors/error-tabs";
import { ErrorTrendChart } from "@/components/errors/error-trend-chart";
import { TopDriversErrors } from "@/components/errors/top-drivers-errors";
import { useFilters } from "@/lib/filters";
import { useDashboardStore } from "@/lib/store";
import type { ErrorCategory } from "@/lib/types";

export default function ErrorsPage() {
  const { selectedStation } = useDashboardStore();
  const { year, weekNum } = useFilters();

  const [activeTab, setActiveTab] = useState<ErrorCategory>("dwc");
  const [errorTypeFilter, setErrorTypeFilter] = useState("all");

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  // Get error data from Convex
  const errorsData = useQuery(
    api.stats.getErrorBreakdown,
    station ? { stationId: station._id, year, week: weekNum } : "skip",
  );
  const topDrivers = useQuery(
    api.stats.getTopDriversErrors,
    station ? { stationId: station._id, year, week: weekNum, limit: 10, errorTypeFilter } : "skip",
  );
  const trendData = useQuery(api.stats.getErrorTrends, station ? { stationId: station._id, weeksCount: 8 } : "skip");

  // Loading state
  if (!station || errorsData === undefined || topDrivers === undefined || trendData === undefined) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="space-y-6 p-6">
          <div>
            <h1 className="font-bold text-2xl text-foreground">Analyse des Erreurs</h1>
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="h-12 rounded-lg bg-muted" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-muted" />
              ))}
            </div>
            <div className="h-64 rounded-lg bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  const activeCategory = errorsData.find((c) => c.id === activeTab) || errorsData[0];

  const handleTabChange = (tab: ErrorCategory) => {
    setActiveTab(tab);
  };

  // No data state
  if (!activeCategory || errorsData.length === 0) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="space-y-6 p-6">
          <div>
            <h1 className="font-bold text-2xl text-foreground">Analyse des Erreurs</h1>
            <p className="text-muted-foreground text-sm">Semaine {weekNum}</p>
          </div>
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-border border-dashed">
            <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucune donnée d'erreur pour la semaine {weekNum}</p>
            <p className="mt-1 text-muted-foreground text-sm">Importez des données pour voir l'analyse</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="space-y-6 p-6">
        {/* Page Title */}
        <div>
          <h1 className="font-bold text-2xl text-foreground">Analyse des Erreurs</h1>
          <p className="text-muted-foreground text-sm">
            Semaine {weekNum} • {year}
          </p>
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
  );
}
