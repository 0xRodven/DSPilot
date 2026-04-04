"use client";

import { DriversTable } from "@/components/dashboard/drivers-table";

import { KPICards } from "@/components/dashboard/kpi-cards";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { TierDistribution } from "@/components/dashboard/tier-distribution";
import { TopDrivers } from "@/components/dashboard/top-drivers";
import { TopErrors } from "@/components/dashboard/top-errors";
import { useFilters } from "@/lib/filters";

export default function DashboardPage() {
  const { displayLabel } = useFilters();

  const subtitle = displayLabel;

  return (
    <main className="fade-in min-h-[calc(100vh-3.5rem)] animate-in duration-300 md:min-h-[calc(100vh-4rem)]">
      <div className="p-4 md:p-6">
        {/* Page title */}
        <div className="mb-4 flex items-center justify-between md:mb-6">
          <div>
            <h1 className="font-bold text-foreground text-xl md:text-2xl">Dashboard</h1>
            <p className="text-muted-foreground text-xs capitalize md:text-sm">{subtitle}</p>
          </div>
          {/* ExportButton removed — reports are auto-generated */}
        </div>

        {/* KPI Cards */}
        <KPICards />

        {/* Performance Chart */}
        <div className="mt-4 md:mt-6">
          <PerformanceChart />
        </div>

        {/* Three column section */}
        <div className="mt-4 grid gap-4 md:mt-6 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          <TierDistribution />
          <TopDrivers />
          <TopErrors />
        </div>

        {/* Drivers Table */}
        <div className="mt-4 md:mt-6">
          <DriversTable />
        </div>
      </div>
    </main>
  );
}
