"use client"

import { useFilters } from "@/lib/filters"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { TierDistribution } from "@/components/dashboard/tier-distribution"
import { TopDrivers } from "@/components/dashboard/top-drivers"
import { TopErrors } from "@/components/dashboard/top-errors"
import { DriversTable } from "@/components/dashboard/drivers-table"
import { ExportButton } from "@/components/dashboard/export-button"

export default function DashboardPage() {
  const { displayLabel } = useFilters()

  const subtitle = displayLabel

  return (
    <main className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] animate-in fade-in duration-300">
      <div className="p-4 md:p-6">
        {/* Page title */}
        <div className="mb-4 md:mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs md:text-sm capitalize text-muted-foreground">{subtitle}</p>
          </div>
          <ExportButton />
        </div>

        {/* KPI Cards */}
        <KPICards />

        {/* Performance Chart */}
        <div className="mt-4 md:mt-6">
          <PerformanceChart />
        </div>

        {/* Three column section */}
        <div className="mt-4 md:mt-6 grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
  )
}
