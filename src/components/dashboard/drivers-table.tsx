"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getTierColor, getTierBgColor } from "@/lib/utils/tier"
import { Search, Download, MoreHorizontal, ChevronUp, ChevronDown, User, Eye, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { getWeek } from "date-fns"

type SortField = "name" | "dwcPercent" | "iadcPercent" | "daysActive"
type SortOrder = "asc" | "desc"
type TierFilter = "all" | "fantastic" | "great" | "fair" | "poor"

const tierLabels = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
}

const ITEMS_PER_PAGE = 10

export function DriversTable() {
  const { selectedStation, selectedDate } = useDashboardStore()
  const week = getWeek(selectedDate, { weekStartsOn: 1 })
  const year = selectedDate.getFullYear()

  const [search, setSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<TierFilter>("all")
  const [sortField, setSortField] = useState<SortField>("dwcPercent")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get drivers from Convex
  const drivers = useQuery(
    api.stats.getDashboardDrivers,
    station ? { stationId: station._id, year, week } : "skip"
  )

  const filteredDrivers = useMemo(() => {
    if (!drivers) return []
    let result = [...drivers]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (d) => d.name.toLowerCase().includes(searchLower) || d.amazonId.toLowerCase().includes(searchLower),
      )
    }

    // Tier filter
    if (tierFilter !== "all") {
      result = result.filter((d) => d.tier === tierFilter)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "dwcPercent":
          comparison = a.dwcPercent - b.dwcPercent
          break
        case "iadcPercent":
          comparison = a.iadcPercent - b.iadcPercent
          break
        case "daysActive":
          comparison = a.daysActive - b.daysActive
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [drivers, search, tierFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE)
  const paginatedDrivers = filteredDrivers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  // Loading state
  if (!station || drivers === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40 mt-1" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[160px]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-border">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            {/* Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-border last:border-0">
                <Skeleton className="h-4 w-8" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!drivers || drivers.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-card-foreground">Tous les Drivers</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucun driver pour la semaine {week}</p>
          <p className="text-sm text-muted-foreground mt-1">Importez un rapport pour voir les drivers</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-card-foreground">Tous les Drivers</CardTitle>
            <p className="text-sm text-muted-foreground">{filteredDrivers.length} drivers • Semaine {week}</p>
          </div>

          <Button variant="outline" size="sm" className="w-fit bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un driver..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={tierFilter}
            onValueChange={(value: TierFilter) => {
              setTierFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="all">Tous les tiers</SelectItem>
              <SelectItem value="fantastic">Fantastic</SelectItem>
              <SelectItem value="great">Great</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split("-") as [SortField, SortOrder]
              setSortField(field)
              setSortOrder(order)
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tri" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="dwcPercent-desc">DWC % ↓</SelectItem>
              <SelectItem value="dwcPercent-asc">DWC % ↑</SelectItem>
              <SelectItem value="iadcPercent-desc">IADC % ↓</SelectItem>
              <SelectItem value="iadcPercent-asc">IADC % ↑</SelectItem>
              <SelectItem value="name-asc">Nom A-Z</SelectItem>
              <SelectItem value="name-desc">Nom Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12 text-muted-foreground">#</TableHead>
                <TableHead
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Driver
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground">Amazon ID</TableHead>
                <TableHead
                  className="cursor-pointer text-right text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("dwcPercent")}
                >
                  <div className="flex items-center justify-end">
                    DWC %
                    <SortIcon field="dwcPercent" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("iadcPercent")}
                >
                  <div className="flex items-center justify-end">
                    IADC %
                    <SortIcon field="iadcPercent" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("daysActive")}
                >
                  <div className="flex items-center justify-center">
                    Jours
                    <SortIcon field="daysActive" />
                  </div>
                </TableHead>
                <TableHead className="text-center text-muted-foreground">Tier</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDrivers.map((driver, index) => (
                <TableRow key={driver.id} className="cursor-pointer border-border transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium text-muted-foreground">
                    {(page - 1) * ITEMS_PER_PAGE + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-card-foreground">{driver.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{driver.amazonId}</TableCell>
                  <TableCell className={cn("text-right font-semibold", getTierColor(driver.tier))}>
                    {driver.dwcPercent}%
                  </TableCell>
                  <TableCell className="text-right font-medium text-card-foreground">{driver.iadcPercent}%</TableCell>
                  <TableCell className="text-center text-card-foreground">{driver.daysActive}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
                        getTierBgColor(driver.tier),
                      )}
                    >
                      {tierLabels[driver.tier]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détail
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Planifier coaching
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Affichage {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filteredDrivers.length)} sur{" "}
              {filteredDrivers.length} drivers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
