"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"
import { startOfWeek, endOfWeek, format } from "date-fns"
import { fr } from "date-fns/locale"
import { getDateFromWeek } from "@/lib/utils/time-context"
import { MessageSquare, Search, TrendingUp, TrendingDown, Copy, Check, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RecapModal } from "@/components/coaching/recaps/RecapModal"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { generateWhatsAppRecap } from "@/lib/coaching/recap-generator"

type DriverComparison = {
  id: string
  name: string
  amazonId: string
  current: {
    deliveries: number
    dwc: number
    iadc: number
  }
  previous: {
    deliveries: number
    dwc: number
    iadc: number
  }
  diff: {
    deliveries: number
    dwc: number
    iadc: number
  }
  status: "ok" | "watch" | "alert"
}

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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDriver, setSelectedDriver] = useState<DriverComparison | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  // Week date range - compute from year/week
  const selectedDate = getDateFromWeek(year, weekNum)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekRange = `${format(weekStart, "d", { locale: fr })} - ${format(weekEnd, "d MMM", { locale: fr })}`

  // Filter drivers by search
  const filteredDrivers = useMemo(() => {
    if (!comparisons) return []
    if (!searchQuery) return comparisons
    const query = searchQuery.toLowerCase()
    return comparisons.filter(
      (d) => d.name.toLowerCase().includes(query) || d.amazonId.toLowerCase().includes(query)
    )
  }, [comparisons, searchQuery])

  // Handle generate single
  const handleGenerateRecap = (driver: DriverComparison) => {
    setSelectedDriver(driver)
    setModalOpen(true)
  }

  // Handle copy all
  const handleCopyAll = async () => {
    if (!filteredDrivers) return

    const allMessages = filteredDrivers
      .map((d) => generateWhatsAppRecap(d, weekNum))
      .join("\n\n---\n\n")

    await navigator.clipboard.writeText(allMessages)
    setCopiedAll(true)
    toast.success(`${filteredDrivers.length} recaps copies`)
    setTimeout(() => setCopiedAll(false), 2000)
  }

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

        {/* Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleCopyAll} disabled={filteredDrivers.length === 0}>
                {copiedAll ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copie !
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copier tous ({filteredDrivers.length})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Colis</TableHead>
                  <TableHead className="text-right">DWC</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun driver trouve
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">{driver.amazonId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{driver.current.deliveries}</span>
                        <span className={cn("ml-2 text-xs", driver.diff.deliveries >= 0 ? "text-emerald-500" : "text-red-500")}>
                          ({driver.diff.deliveries > 0 ? "+" : ""}{driver.diff.deliveries})
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{driver.current.dwc}%</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cn("inline-flex items-center gap-1", driver.diff.dwc >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {driver.diff.dwc >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span className="text-sm font-medium">
                            {driver.diff.dwc > 0 ? "+" : ""}{driver.diff.dwc}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {driver.status === "ok" && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            OK
                          </Badge>
                        )}
                        {driver.status === "watch" && (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Watch
                          </Badge>
                        )}
                        {driver.status === "alert" && (
                          <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Alert
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleGenerateRecap(driver)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
