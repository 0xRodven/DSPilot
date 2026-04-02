"use client";

import { useState } from "react";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Download, Users } from "lucide-react";
import { toast } from "sonner";

import { DriversListTable } from "@/components/drivers/drivers-table";
import { TierStatsCards } from "@/components/drivers/tier-stats-cards";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/lib/filters";
import { useDashboardStore } from "@/lib/store";
import { downloadCSV, formatDriversForCSV } from "@/lib/utils/csv";

export default function DriversPage() {
  const { selectedStation } = useDashboardStore();
  const { period, year, weekNum, date, displayLabel } = useFilters();

  // For range mode, we'll fall back to week for now (could add range queries later)
  const effectiveMode = period === "range" ? "week" : period;

  const [selectedTier, setSelectedTier] = useState("all");

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  // Get KPIs - choose query based on period mode
  const kpisWeekly = useQuery(
    api.stats.getDashboardKPIs,
    station && effectiveMode === "week" ? { stationId: station._id, year, week: weekNum } : "skip",
  );
  const kpisDaily = useQuery(
    api.stats.getDashboardKPIsDaily,
    station && effectiveMode === "day" ? { stationId: station._id, date } : "skip",
  );
  const kpis = effectiveMode === "week" ? kpisWeekly : kpisDaily;

  // Get drivers list - choose query based on period mode
  const driversWeekly = useQuery(
    api.stats.getDashboardDrivers,
    station && effectiveMode === "week" ? { stationId: station._id, year, week: weekNum } : "skip",
  );
  const driversDaily = useQuery(
    api.stats.getDashboardDriversDaily,
    station && effectiveMode === "day" ? { stationId: station._id, date } : "skip",
  );
  const drivers = effectiveMode === "week" ? driversWeekly : driversDaily;

  // Calculate comparison label based on period mode
  const getComparisonLabel = () => {
    if (period === "week") {
      const prevWeek = weekNum === 1 ? 52 : weekNum - 1;
      return `vs S${prevWeek}`;
    }
    if (period === "day") {
      return "vs veille";
    }
    return "vs période préc.";
  };
  const comparisonLabel = getComparisonLabel();

  // Use displayLabel from useFilters
  const periodLabel = displayLabel;

  // Loading state
  if (!station || kpis === undefined || drivers === undefined) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="font-bold text-2xl text-foreground">Drivers</h1>
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-lg bg-muted" />
              ))}
            </div>
            <div className="h-96 rounded-lg bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  // No data state
  if (!kpis || !drivers || drivers.length === 0) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="font-bold text-2xl text-foreground">Drivers</h1>
            <p className="text-muted-foreground text-sm capitalize">{periodLabel}</p>
          </div>
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-border border-dashed">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucun driver pour {periodLabel.toLowerCase()}</p>
            <p className="mt-1 text-muted-foreground text-sm">Importez un rapport pour voir les drivers</p>
          </div>
        </div>
      </main>
    );
  }

  // Build tier stats from KPIs
  const tierStats = {
    fantastic: {
      count: kpis.tierDistribution.fantastic,
      percentage:
        kpis.totalDrivers > 0 ? ((kpis.tierDistribution.fantastic / kpis.totalDrivers) * 100).toFixed(0) : "0",
      trend: 0,
    },
    great: {
      count: kpis.tierDistribution.great,
      percentage: kpis.totalDrivers > 0 ? ((kpis.tierDistribution.great / kpis.totalDrivers) * 100).toFixed(0) : "0",
      trend: 0,
    },
    fair: {
      count: kpis.tierDistribution.fair,
      percentage: kpis.totalDrivers > 0 ? ((kpis.tierDistribution.fair / kpis.totalDrivers) * 100).toFixed(0) : "0",
      trend: 0,
    },
    poor: {
      count: kpis.tierDistribution.poor,
      percentage: kpis.totalDrivers > 0 ? ((kpis.tierDistribution.poor / kpis.totalDrivers) * 100).toFixed(0) : "0",
      trend: 0,
    },
    total: kpis.totalDrivers,
    active: kpis.activeDrivers,
  };

  return (
    <main className="fade-in min-h-[calc(100vh-3.5rem)] animate-in duration-300 md:min-h-[calc(100vh-4rem)]">
      <div className="p-4 md:p-6">
        {/* Page Title */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-6">
          <div>
            <h1 className="font-bold text-foreground text-xl md:text-2xl">Drivers</h1>
            <p className="text-muted-foreground text-xs capitalize md:text-sm">
              {periodLabel} • {tierStats.total} drivers • {tierStats.active} actifs
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              const csvData = formatDriversForCSV(
                drivers.map((d) => ({
                  name: d.name,
                  amazonId: d.amazonId,
                  dwcPercent: d.dwcPercent,
                  iadcPercent: d.iadcPercent,
                  tier: d.tier,
                  daysActive: d.daysActive,
                })),
                selectedStation.code,
                weekNum,
                year,
              );
              downloadCSV(csvData, `drivers-${selectedStation.code}-S${weekNum}-${year}`);
              toast.success("Export CSV téléchargé");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        {/* Tier Stats Cards */}
        <div className="mb-4 md:mb-6">
          <TierStatsCards
            stats={tierStats}
            selectedTier={selectedTier}
            onTierSelect={setSelectedTier}
            comparisonLabel={comparisonLabel}
          />
        </div>

        {/* Drivers Table */}
        <DriversListTable
          drivers={drivers}
          stats={tierStats}
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          periodMode={effectiveMode}
        />
      </div>
    </main>
  );
}
