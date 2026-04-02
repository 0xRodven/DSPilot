"use client";

import { useState } from "react";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Building2, ChevronDown, FileDown, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFilters } from "@/lib/filters";
import { generateReportHtml, type ReportData, type ReportDriver } from "@/lib/pdf/report-template";
import { useDashboardStore } from "@/lib/store";
import { computeDwcDistribution } from "@/lib/utils/performance-color";

export function ExportButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { selectedStation } = useDashboardStore();
  const { year, weekNum } = useFilters();

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  // Get KPIs
  const kpis = useQuery(api.stats.getDashboardKPIs, station ? { stationId: station._id, year, week: weekNum } : "skip");

  // Get drivers
  const drivers = useQuery(
    api.stats.getDashboardDrivers,
    station ? { stationId: station._id, year, week: weekNum } : "skip",
  );

  /**
   * Export report as HTML (opens in new tab for print-to-PDF)
   * @param blurNames - If true, driver names will be blurred (LIVREURS version)
   */
  const handleExport = async (blurNames = false) => {
    if (!station || !kpis || !drivers) {
      toast.error("Donnees non disponibles");
      return;
    }

    setIsGenerating(true);

    try {
      const versionLabel = blurNames ? "LIVREURS" : "DSP";
      console.log(`Starting HTML report generation (${versionLabel}) for:`, station.code, "Week", weekNum);

      // Sort drivers by DWC descending
      const sortedDrivers = [...drivers].sort((a, b) => b.dwcPercent - a.dwcPercent);

      // Get top 5
      const topDrivers: ReportDriver[] = sortedDrivers.slice(0, 5).map((d, i) => ({
        rank: i + 1,
        name: d.name,
        dwcPercent: d.dwcPercent,
        iadcPercent: d.iadcPercent,
        daysWorked: d.daysActive,
      }));

      // Get bottom 5 (drivers below 85%)
      const bottomDrivers: ReportDriver[] = sortedDrivers
        .filter((d) => d.dwcPercent < 85)
        .slice(-5)
        .reverse()
        .map((d, i) => ({
          rank: sortedDrivers.findIndex((sd) => sd.amazonId === d.amazonId) + 1,
          name: d.name,
          dwcPercent: d.dwcPercent,
          iadcPercent: d.iadcPercent,
          daysWorked: d.daysActive,
        }));

      // Compute DWC distribution using the utility
      const dwcDistribution = computeDwcDistribution(drivers);

      // Build report data
      const data: ReportData = {
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
        dwcDistribution,
        topDrivers,
        bottomDrivers,
      };

      // Generate HTML
      console.log("Generating HTML report...");
      const html = generateReportHtml(data, { blurNames });

      // Create a Blob and open in new tab for print-to-PDF
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      // Open in new tab - user can Cmd+P / Ctrl+P to save as PDF
      const newWindow = window.open(url, "_blank");

      if (newWindow) {
        // Auto-revoke after window loads
        newWindow.onload = () => {
          // Give the user time to print, then revoke
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 60000); // 1 minute
        };
        toast.success(`Rapport ${versionLabel} ouvert - Utilisez Cmd+P pour sauvegarder en PDF`);
      } else {
        // Fallback: download as HTML file
        const link = document.createElement("a");
        link.href = url;
        link.download = `DSPilot_Rapport_${versionLabel}_S${weekNum}_${year}_${station.code}.html`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        toast.success(`Rapport ${versionLabel} telecharge (HTML)`);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erreur lors de la generation du rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = !station || !kpis || !drivers || isGenerating;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isDisabled} className="gap-2">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generation...
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
            <span className="text-muted-foreground text-xs">Noms anonymises</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
