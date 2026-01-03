"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, {
    code: selectedStation.code,
  })

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

  const handleExport = async () => {
    if (!station || !kpis || !drivers) {
      toast.error("Données non disponibles")
      return
    }

    setIsGenerating(true)

    try {
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

      // Generate PDF blob
      const blob = await pdf(<WeeklyRecapDocument data={data} />).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `DSPilot_Recap_S${weekNum}_${year}_${station.code}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("PDF généré avec succès")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Erreur lors de la génération du PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  const isDisabled = !station || !kpis || !drivers || isGenerating

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
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
        </>
      )}
    </Button>
  )
}
