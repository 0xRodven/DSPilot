"use client";

import { useCallback, useState } from "react";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Calendar, Download, ExternalLink, FileText, Package, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/lib/filters";
import { useDashboardStore } from "@/lib/store";

type ReportType = "daily" | "weekly";

export default function ReportsPage() {
  const { selectedStation } = useDashboardStore();
  const { displayLabel } = useFilters();
  const [activeTab, setActiveTab] = useState<"all" | ReportType>("all");

  // Get station from Convex
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  // Get reports for this station
  const reports = useQuery(
    api.reporting.listReports,
    station
      ? {
          stationId: station._id,
          reportType: activeTab === "all" ? undefined : activeTab,
          limit: 50,
        }
      : "skip",
  );

  // Open HTML content in new tab
  const handleOpenReport = useCallback((htmlContent: string, title: string) => {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, "_blank");
    if (newWindow) {
      newWindow.document.title = title;
    }
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, []);

  // Print report
  const handlePrintReport = useCallback((htmlContent: string, title: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.title = title;
      printWindow.document.close();
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
      };
      // Fallback if onload doesn't fire
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }, []);

  // Loading state
  if (!station || reports === undefined) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] animate-in fade-in duration-300">
        <div className="p-4 md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground md:text-2xl">Rapports</h1>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-72" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Empty state
  if (!reports || reports.length === 0) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] animate-in fade-in duration-300">
        <div className="p-4 md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground md:text-2xl">Rapports</h1>
                <p className="text-sm text-muted-foreground">{displayLabel}</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | ReportType)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="weekly">Hebdomadaires</TabsTrigger>
              <TabsTrigger value="daily">Quotidiens</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-muted-foreground">Aucun rapport disponible</p>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Les rapports seront generes automatiquement apres chaque import.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    );
  }

  // Content state
  return (
    <main className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] animate-in fade-in duration-300">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground md:text-2xl">Rapports</h1>
              <p className="text-sm text-muted-foreground">{displayLabel}</p>
            </div>
          </div>
          <Button variant="outline" disabled>
            <FileText className="mr-2 h-4 w-4" />
            Generer
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | ReportType)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              Tous
              <Badge variant="secondary" className="ml-2">
                {reports.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="weekly">Hebdomadaires</TabsTrigger>
            <TabsTrigger value="daily">Quotidiens</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <ReportCard key={report._id} report={report} onOpen={handleOpenReport} onPrint={handlePrintReport} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

// Report Card Component
interface ReportCardProps {
  report: {
    _id: string;
    reportType: "daily" | "weekly";
    title: string;
    summary: string;
    periodLabel: string;
    year?: number;
    week?: number;
    htmlContent: string;
    confidenceScore: number;
    createdAt: number;
    deliveryStatus: string;
    pdfStatus: string;
  };
  onOpen: (htmlContent: string, title: string) => void;
  onPrint: (htmlContent: string, title: string) => void;
}

function ReportCard({ report, onOpen, onPrint }: ReportCardProps) {
  const isWeekly = report.reportType === "weekly";
  const createdDate = new Date(report.createdAt);

  // Extract some stats from summary if available (basic parsing)
  const summaryLines = report.summary.split("\n").filter(Boolean);

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant={isWeekly ? "default" : "secondary"}
            className={
              isWeekly ? "bg-blue-500/90 hover:bg-blue-500" : "bg-emerald-500/90 text-white hover:bg-emerald-500"
            }
          >
            {isWeekly ? "Hebdomadaire" : "Quotidien"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(createdDate, "d MMM yyyy, HH:mm", { locale: fr })}
          </span>
        </div>
        <CardTitle className="mt-2 text-base leading-tight">{report.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3" />
          {report.periodLabel}
          {report.year && report.week && (
            <span className="text-muted-foreground/70">
              (S{report.week} - {report.year})
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Summary preview */}
        <div className="flex-1 rounded-md bg-muted/50 p-3">
          <p className="line-clamp-3 text-xs text-muted-foreground">
            {summaryLines.slice(0, 2).join(" ") || "Aucun resume disponible."}
          </p>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          {report.confidenceScore >= 0.8 && (
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
              Confiance: {Math.round(report.confidenceScore * 100)}%
            </Badge>
          )}
          {report.deliveryStatus === "sent" && (
            <Badge variant="outline" className="text-xs text-emerald-600">
              Envoye
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onOpen(report.htmlContent, report.title)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPrint(report.htmlContent, report.title)}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
