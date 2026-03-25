"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { FileText, MoreHorizontal, Search, Eye, RefreshCw, Trash2, Download, AlertTriangle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { getImportStatusColor, getImportStatusLabel } from "@/lib/utils/status"
import { useDashboardStore } from "@/lib/store"
import { withToast } from "@/lib/utils/mutation"
import { toast } from "sonner"

// Type for Convex import records
interface ConvexImport {
  _id: string
  filename: string
  year: number
  week: number
  status: "pending" | "processing" | "success" | "partial" | "failed"
  driversImported: number
  dailyRecordsCount?: number
  weeklyRecordsCount: number
  dwcScore?: number
  iadcScore?: number
  errors?: string[]
  warnings?: string[]
  createdAt: number
  completedAt?: number
}

interface ImportHistoryProps {
  imports: ConvexImport[]
  stationCode: string
}

export function ImportHistory({ imports, stationCode }: ImportHistoryProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("3m")

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [importToDelete, setImportToDelete] = useState<ConvexImport | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Re-import file input ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importToReplace, setImportToReplace] = useState<ConvexImport | null>(null)

  // Hooks
  const router = useRouter()
  const { setSelectedDate } = useDashboardStore()
  const deleteImport = useMutation(api.imports.deleteImport)

  // Filter out pending/processing for display, only show completed
  const completedImports = imports.filter(
    (imp) => imp.status === "success" || imp.status === "partial" || imp.status === "failed"
  )

  const filteredImports = completedImports.filter((imp) => {
    const matchesSearch =
      imp.filename.toLowerCase().includes(search.toLowerCase()) ||
      `S${imp.week}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || imp.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Map status for display (processing/pending -> failed for getImportStatusColor)
  const getDisplayStatus = (status: ConvexImport["status"]): "success" | "partial" | "failed" => {
    if (status === "success") return "success"
    if (status === "partial") return "partial"
    return "failed"
  }

  // Handler: View data - Navigate to dashboard with selected week
  const handleViewData = (imp: ConvexImport) => {
    // Calculate the date for the start of the week
    // ISO week starts on Monday, so we calculate the date from year and week
    const jan4 = new Date(imp.year, 0, 4) // Jan 4 is always in week 1
    const dayOfWeek = jan4.getDay() || 7 // Convert Sunday (0) to 7
    const week1Start = new Date(jan4)
    week1Start.setDate(jan4.getDate() - dayOfWeek + 1) // Monday of week 1

    const targetDate = new Date(week1Start)
    targetDate.setDate(week1Start.getDate() + (imp.week - 1) * 7)

    setSelectedDate(targetDate)
    router.push("/dashboard")
  }

  // Handler: Re-import - Open file selector
  const handleReImport = (imp: ConvexImport) => {
    setImportToReplace(imp)
    fileInputRef.current?.click()
  }

  // Handler: File selected for re-import
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !importToReplace) return

    // Navigate to import page with the file
    // Store the file info in sessionStorage and navigate to import
    sessionStorage.setItem("reimportWeek", JSON.stringify({
      year: importToReplace.year,
      week: importToReplace.week,
      filename: file.name,
    }))

    toast.info(`Fichier sélectionné: ${file.name}. Allez à la page d'import pour continuer.`)

    router.push("/dashboard/import")

    // Reset
    setImportToReplace(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handler: Download CSV
  const handleDownload = async (imp: ConvexImport) => {
    try {
      // We need to fetch data via API since we can't use useQuery dynamically
      // Instead, we'll generate CSV from the import data we already have
      // For full data, we would need to create an API endpoint

      const csvRows = [
        ["Filename", "Year", "Week", "Status", "Drivers", "Daily Records", "Weekly Records", "DWC Score", "IADC Score", "Imported At"],
        [
          imp.filename,
          imp.year.toString(),
          imp.week.toString(),
          imp.status,
          imp.driversImported.toString(),
          (imp.dailyRecordsCount ?? 0).toString(),
          imp.weeklyRecordsCount.toString(),
          (imp.dwcScore ?? 0).toFixed(1),
          (imp.iadcScore ?? 0).toFixed(1),
          formatDate(imp.completedAt ?? imp.createdAt),
        ],
      ]

      if (imp.warnings && imp.warnings.length > 0) {
        csvRows.push([])
        csvRows.push(["Warnings"])
        imp.warnings.forEach((w) => csvRows.push([w]))
      }

      if (imp.errors && imp.errors.length > 0) {
        csvRows.push([])
        csvRows.push(["Errors"])
        imp.errors.forEach((e) => csvRows.push([e]))
      }

      const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `import_S${imp.week}_${imp.year}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Fichier exporté: import_S${imp.week}_${imp.year}.csv`)
    } catch {
      toast.error("Impossible de télécharger le fichier")
    }
  }

  // Handler: Open delete confirmation
  const handleDeleteClick = (imp: ConvexImport) => {
    setImportToDelete(imp)
    setDeleteDialogOpen(true)
  }

  // Handler: Confirm delete
  const handleConfirmDelete = async () => {
    if (!importToDelete) return

    setIsDeleting(true)
    const result = await withToast(
      deleteImport({
        importId: importToDelete._id as Id<"imports">,
      }),
      {
        loading: "Suppression en cours...",
        success: "Import supprimé avec succès",
        error: "Impossible de supprimer l'import",
      }
    )

    if (result) {
      setDeleteDialogOpen(false)
      setImportToDelete(null)
    }
    setIsDeleting(false)
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Historique des imports</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Station {stationCode} • {imports.length} imports
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            Tout voir
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="partial">Partiel</SelectItem>
              <SelectItem value="failed">Échec</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 mois</SelectItem>
              <SelectItem value="3m">3 mois</SelectItem>
              <SelectItem value="6m">6 mois</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Import List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredImports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun import trouvé</p>
              <p className="text-xs">Importez votre premier rapport pour commencer</p>
            </div>
          ) : (
            filteredImports.map((imp) => (
              <div key={imp._id} className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{imp.filename}</span>
                  </div>
                  <Badge className={cn("text-xs", getImportStatusColor(getDisplayStatus(imp.status)))}>
                    {getImportStatusLabel(getDisplayStatus(imp.status))}
                  </Badge>
                </div>

                {imp.status !== "failed" ? (
                  <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Semaine {imp.week}, {imp.year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {imp.driversImported} drivers •{" "}
                      {imp.dailyRecordsCount ? `${imp.dailyRecordsCount} daily records` : "Daily data missing"} •{" "}
                      {imp.weeklyRecordsCount} weekly records
                    </p>
                    {imp.dwcScore !== undefined && imp.iadcScore !== undefined && (
                      <div className="flex items-center gap-3 text-sm">
                        <span>
                          DWC: {imp.dwcScore.toFixed(1)}%{" "}
                          <span
                            className={cn(
                              imp.dwcScore >= 95
                                ? "text-emerald-400"
                                : imp.dwcScore >= 90
                                  ? "text-blue-400"
                                  : imp.dwcScore >= 88
                                    ? "text-amber-400"
                                    : "text-red-400",
                            )}
                          >
                            ●
                          </span>
                        </span>
                        <span>
                          IADC: {imp.iadcScore.toFixed(1)}%{" "}
                          <span
                            className={cn(
                              imp.iadcScore >= 80
                                ? "text-emerald-400"
                                : imp.iadcScore >= 70
                                  ? "text-blue-400"
                                  : imp.iadcScore >= 60
                                    ? "text-amber-400"
                                    : "text-red-400",
                            )}
                          >
                            ●
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <span>❌ {imp.errors?.[0] ?? "Erreur inconnue"}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Importé le {formatDate(imp.completedAt ?? imp.createdAt)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {imp.status !== "failed" && (
                        <DropdownMenuItem onClick={() => handleViewData(imp)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir données
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleReImport(imp)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Ré-importer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(imp)}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger fichier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400 focus:text-red-400"
                        onClick={() => handleDeleteClick(imp)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer import
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Hidden file input for re-import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm"
          className="hidden"
          onChange={handleFileSelected}
        />
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Supprimer l'import ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Vous êtes sur le point de supprimer l'import{" "}
                <span className="font-medium text-foreground">
                  Semaine {importToDelete?.week}, {importToDelete?.year}
                </span>
                .
              </p>
              <p className="text-red-400">
                Cette action supprimera également toutes les données associées :
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                <li>Statistiques journalières des drivers</li>
                <li>Statistiques hebdomadaires des drivers</li>
                <li>Statistiques de la station pour cette semaine</li>
              </ul>
              <p className="font-medium text-red-400 mt-2">
                Cette action est irréversible.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
