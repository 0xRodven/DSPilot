"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DriverHeader } from "@/components/drivers/driver-header"
import { DriverKpis } from "@/components/drivers/driver-kpis"
import { DriverPerformanceChart } from "@/components/drivers/driver-performance-chart"
import { ErrorBreakdown } from "@/components/drivers/error-breakdown"
import { CoachingHistory } from "@/components/drivers/coaching-history"
import { DailyPerformance } from "@/components/drivers/daily-performance"
import { getDriverById } from "@/lib/mock-data"
import { useDashboardStore } from "@/lib/store"
import { getWeek } from "date-fns"
import { ChevronLeft } from "lucide-react"

interface DriverDetailPageProps {
  params: Promise<{ id: string }>
}

export default function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { id } = use(params)
  const driver = getDriverById(id)
  const { selectedDate, granularity } = useDashboardStore()

  // Calculate comparison label based on granularity
  const getComparisonLabel = () => {
    if (granularity === "week") {
      const week = getWeek(selectedDate, { weekStartsOn: 1 })
      const prevWeek = week === 1 ? 52 : week - 1
      return `vs S${prevWeek}`
    } else {
      return "vs veille"
    }
  }
  const comparisonLabel = getComparisonLabel()

  if (!driver) {
    notFound()
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard/drivers"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Drivers
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm text-card-foreground">{driver.name}</span>
        </div>

        {/* Driver Header */}
        <div className="mb-6">
          <DriverHeader driver={driver} />
        </div>

        {/* KPIs */}
        <div className="mb-6">
          <DriverKpis driver={driver} comparisonLabel={comparisonLabel} />
        </div>

        {/* Performance Chart */}
        <div className="mb-6">
          <DriverPerformanceChart driver={driver} />
        </div>

        {/* Two Columns: Error Breakdown + Coaching History */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <ErrorBreakdown driver={driver} />
          <CoachingHistory driver={driver} />
        </div>

        {/* Daily Performance */}
        <DailyPerformance driver={driver} />
      </div>
    </main>
  )
}
