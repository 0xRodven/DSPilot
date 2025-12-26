"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getTierColor, getTierBgColor, tierLabels, tierDescriptions } from "@/lib/utils/tier"
import {
  Search,
  Download,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  User,
  Eye,
  GraduationCap,
  History,
  FileDown,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"

type SortField = "name" | "dwcPercent" | "trend" | "iadcPercent" | "daysActive" | "errors"
type SortOrder = "asc" | "desc"
type StatusFilter = "all" | "active" | "inactive"


const ITEMS_PER_PAGE = 20

interface TierStat {
  count: number
  percentage: string
  trend: number
}

interface TierStats {
  fantastic: TierStat
  great: TierStat
  fair: TierStat
  poor: TierStat
  total: number
  active: number
}

interface Driver {
  id: string
  name: string
  amazonId: string
  dwcPercent: number
  iadcPercent: number
  daysActive: number
  tier: "fantastic" | "great" | "fair" | "poor"
  trend: number
}

interface DriversListTableProps {
  drivers: Driver[]
  stats: TierStats
  selectedTier: string
  onTierChange: (tier: string) => void
}

export function DriversListTable({ drivers, stats, selectedTier, onTierChange }: DriversListTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [sortField, setSortField] = useState<SortField>("dwcPercent")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)

  const filteredDrivers = useMemo(() => {
    let result = [...drivers]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (d) => d.name.toLowerCase().includes(searchLower) || d.amazonId.toLowerCase().includes(searchLower),
      )
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((d) => d.daysActive >= 5)
    } else if (statusFilter === "inactive") {
      result = result.filter((d) => d.daysActive < 5)
    }

    // Tier filter
    if (selectedTier !== "all") {
      result = result.filter((d) => d.tier === selectedTier)
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
        case "trend":
          comparison = a.trend - b.trend
          break
        case "iadcPercent":
          comparison = a.iadcPercent - b.iadcPercent
          break
        case "daysActive":
          comparison = a.daysActive - b.daysActive
          break
        case "errors":
          // Mock error count based on inverse of DWC for demo
          comparison = 100 - a.dwcPercent - (100 - b.dwcPercent)
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [drivers, search, statusFilter, selectedTier, sortField, sortOrder])

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

  const getErrorCount = (driver: Driver) => {
    // Approximate error count based on tier (will be replaced with real data later)
    switch (driver.tier) {
      case "fantastic":
        return Math.floor((100 - driver.dwcPercent) * 2)
      case "great":
        return Math.floor((100 - driver.dwcPercent) * 2)
      case "fair":
        return Math.floor((100 - driver.dwcPercent) * 2)
      case "poor":
        return Math.floor((100 - driver.dwcPercent) * 2)
    }
  }

  const handleExport = () => {
    // CSV export logic would go here
    alert("Export CSV des " + filteredDrivers.length + " drivers")
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="border-b border-border p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher driver..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilter) => {
                  setStatusFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
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
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tri" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  <SelectItem value="dwcPercent-desc">DWC % ↓</SelectItem>
                  <SelectItem value="dwcPercent-asc">DWC % ↑</SelectItem>
                  <SelectItem value="iadcPercent-desc">IADC % ↓</SelectItem>
                  <SelectItem value="iadcPercent-asc">IADC % ↑</SelectItem>
                  <SelectItem value="errors-desc">Erreurs ↓</SelectItem>
                  <SelectItem value="name-asc">Nom A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Tier Tabs */}
          <Tabs
            value={selectedTier}
            onValueChange={(value) => {
              onTierChange(value)
              setPage(1)
            }}
            className="mt-4"
          >
            <TabsList className="h-auto flex-wrap bg-transparent p-0 gap-2">
              <TabsTrigger
                value="all"
                className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:bg-muted data-[state=active]:border-foreground/20"
              >
                Tous ({stats.total})
              </TabsTrigger>
              <TabsTrigger
                value="fantastic"
                className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/50"
              >
                Fantastic ({stats.fantastic.count})
              </TabsTrigger>
              <TabsTrigger
                value="great"
                className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/50"
              >
                Great ({stats.great.count})
              </TabsTrigger>
              <TabsTrigger
                value="fair"
                className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/50"
              >
                Fair ({stats.fair.count})
              </TabsTrigger>
              <TabsTrigger
                value="poor"
                className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 data-[state=active]:border-red-500/50"
              >
                Poor ({stats.poor.count})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Table */}
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
                  onClick={() => handleSort("trend")}
                >
                  <div className="flex items-center justify-end">
                    Trend
                    <SortIcon field="trend" />
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
                <TableHead
                  className="cursor-pointer text-center text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("errors")}
                >
                  <div className="flex items-center justify-center">
                    Err
                    <SortIcon field="errors" />
                  </div>
                </TableHead>
                <TableHead className="text-center text-muted-foreground">Tier</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDrivers.map((driver, index) => {
                const errorCount = getErrorCount(driver)
                return (
                  <TableRow
                    key={driver.id}
                    className="cursor-pointer border-border transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/dashboard/drivers/${driver.id}`)}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-card-foreground">{driver.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{driver.amazonId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold", getTierColor(driver.tier))}>
                      {driver.dwcPercent}%
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "inline-flex items-center text-sm font-medium",
                          driver.trend > 0
                            ? "text-emerald-400"
                            : driver.trend < 0
                              ? "text-red-400"
                              : "text-muted-foreground",
                        )}
                      >
                        {driver.trend > 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : driver.trend < 0 ? (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        ) : (
                          <Minus className="mr-1 h-3 w-3" />
                        )}
                        {driver.trend > 0 ? "+" : ""}
                        {driver.trend.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-card-foreground">{driver.iadcPercent}%</TableCell>
                    <TableCell className="text-center text-card-foreground">{driver.daysActive}/7</TableCell>
                    <TableCell className="text-center text-card-foreground">{errorCount}</TableCell>
                    <TableCell className="text-center">
                      <span
                        title={tierDescriptions[driver.tier]}
                        className={cn(
                          "inline-flex cursor-help items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          getTierBgColor(driver.tier),
                        )}
                      >
                        {tierLabels[driver.tier]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/drivers/${driver.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détail
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Planifier coaching
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="mr-2 h-4 w-4" />
                            Historique
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exporter
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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
      </CardContent>
    </Card>
  )
}
