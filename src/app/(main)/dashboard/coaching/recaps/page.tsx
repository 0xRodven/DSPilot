"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"
import { startOfWeek, endOfWeek, format } from "date-fns"
import { fr } from "date-fns/locale"
import { getDateFromWeek } from "@/lib/utils/time-context"
import { MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/coaching/recaps/data-table"
import { createColumns, type DriverComparison } from "@/components/coaching/recaps/columns"
import { RecapModal } from "@/components/coaching/recaps/RecapModal"

export default function RecapsPage() {
  const { selectedStation } = useDashboardStore()
  const { year, weekNum } = useFilters()

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get weekly comparison data
  const comparisons = useQuery(
    api.stats.getWeeklyComparison,
    station ? { stationId: station._id, year, week: weekNum } : "skip"
  )

  // State
  const [selectedDriver, setSelectedDriver] = useState<DriverComparison | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Week date range - compute from year/week
  const selectedDate = getDateFromWeek(year, weekNum)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekRange = `${format(weekStart, "d", { locale: fr })} - ${format(weekEnd, "d MMM", { locale: fr })}`

  // Handle generate single
  const handleGenerateRecap = (driver: DriverComparison) => {
    setSelectedDriver(driver)
    setModalOpen(true)
  }

  // Create columns with callback
  const columns = useMemo(
    () => createColumns(handleGenerateRecap),
    []
  )

  // Loading state
  if (!station || comparisons === undefined) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Recapitulatifs</h1>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recapitulatifs Hebdomadaires</h1>
              <p className="text-sm text-muted-foreground">
                Semaine {weekNum} ({weekRange})
              </p>
            </div>
          </div>
        </div>

        {/* Data Table with Checkboxes */}
        <Card>
          <CardContent className="p-4">
            <DataTable columns={columns} data={comparisons || []} week={weekNum} />
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <RecapModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        driver={selectedDriver}
        week={weekNum}
      />
    </main>
  )
}
