"use client"

import { useState } from "react"
import { FileDown, Loader2, ChevronDown, Building2, Users } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"
import {
  WeeklyRecapDocument,
  type WeeklyRecapData,
  type PDFDriver,
} from "@/lib/pdf/weekly-recap-document"

export function ExportButton() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { selectedStation } = useDashboardStore()
  const { year, weekNum } = useFilters()

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip"
  )

  // Get KPIs
  const kpis = useQuery(
    api.stats.getDashboardKPIs,
    station ? { stationId: station._id, year, week: weekNum } : "skip"
  )

  // Get drivers
  const drivers = useQuery(
    api.stats.getDashboardDrivers,
    station ? { stationId: station._id, year, week: weekNum } : "skip"
  )

  /**
   * Export PDF
   * @param blurNames - If true, driver names will be blurred (LIVREURS version)
   */
  const handleExport = async (blurNames: boolean = false) => {
    if (!station || !kpis || !drivers) {
      toast.error("Données non disponibles")
      return
    }

    setIsGenerating(true)

    try {
      const versionLabel = blurNames ? "LIVREURS" : "DSP"
      console.log(`Starting PDF generation (${versionLabel}) for:`, station.code, "Week", weekNum)

      // Sort drivers by DWC descending
      const sortedDrivers = [...drivers].sort(
        (a, b) => b.dwcPercent - a.dwcPercent
      )

      // Get top 5 and bottom 5
      const topDrivers: PDFDriver[] = sortedDrivers.slice(0, 5).map((d, i) => ({
        rank: i + 1,
        name: d.name,
        amazonId: d.amazonId,
        dwcPercent: d.dwcPercent,
        iadcPercent: d.iadcPercent,
        tier: d.tier,
        daysWorked: d.daysActive,
      }))

      const bottomDrivers: PDFDriver[] = sortedDrivers
        .filter((d) => d.tier === "poor" || d.tier === "fair")
        .slice(-5)
        .reverse()
        .map((d, i) => ({
          rank: sortedDrivers.length - 4 + i,
          name: d.name,
          amazonId: d.amazonId,
          dwcPercent: d.dwcPercent,
          iadcPercent: d.iadcPercent,
          tier: d.tier,
          daysWorked: d.daysActive,
        }))

      // Build PDF data
      const data: WeeklyRecapData = {
        stationName: station.name,
        stationCode: station.code,
        week: weekNum,
        year,
        generatedAt: new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        kpis: {
          avgDwc: kpis.avgDwc,
          avgIadc: kpis.avgIadc,
          totalDrivers: kpis.totalDrivers,
          activeDrivers: kpis.activeDrivers,
          dwcChange: kpis.dwcTrend,
          iadcChange: kpis.iadcTrend,
        },
        tierDistribution: kpis.tierDistribution,
        topDrivers,
        bottomDrivers,
      }

      // Generate PDF blob with blurNames option
      console.log("Generating PDF blob...")
      const pdfDoc = pdf(<WeeklyRecapDocument data={data} blurDriverNames={blurNames} />)
      const blob = await pdfDoc.toBlob()
      console.log("PDF blob generated, size:", blob.size)

      if (blob.size === 0) {
        throw new Error("PDF blob is empty")
      }

      // Create download link with version in filename
      const url = URL.createObjectURL(blob)
      const filename = `DSPilot_Recap_${versionLabel}_S${weekNum}_${year}_${station.code}.pdf`
      console.log("Creating download for:", filename)

      // Try download with <a> element
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()

      // Cleanup after a delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)

      toast.success(`PDF ${versionLabel} téléchargé`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Erreur lors de la génération du PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  const isDisabled = !station || !kpis || !drivers || isGenerating

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDisabled}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Export PDF
              <ChevronDown className="h-3 w-3 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport(false)} className="gap-2">
          <Building2 className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">RECAP DSP</span>
            <span className="text-muted-foreground text-xs">Noms complets</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(true)} className="gap-2">
          <Users className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">RECAP LIVREURS</span>
            <span className="text-muted-foreground text-xs">Noms anonymisés</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
