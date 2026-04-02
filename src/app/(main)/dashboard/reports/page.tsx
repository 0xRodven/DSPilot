"use client";

import { useCallback, useState } from "react";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, ExternalLink, FileText, Info, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/lib/filters";
import { useDashboardStore } from "@/lib/store";

type ReportType = "daily" | "weekly";
type FilterTab = "all" | ReportType;

export default function ReportsPage() {
  const { selectedStation } = useDashboardStore();
  const { year, weekNum, displayLabel } = useFilters();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  // Filtered by current week from global filter
  const reports = useQuery(
    api.reporting.listReports,
    station
      ? {
          stationId: station._id,
          reportType: activeTab === "all" ? undefined : activeTab,
          year,
          week: weekNum,
        }
      : "skip",
  );

  // Also get all reports (no week filter) to show total count
  const allReports = useQuery(api.reporting.listReports, station ? { stationId: station._id, limit: 100 } : "skip");

  const handleOpenReport = useCallback((htmlContent: string, title: string) => {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, "_blank");
    if (newWindow) {
      newWindow.document.title = title;
    }
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  }, []);

  const handlePrintReport = useCallback((htmlContent: string, title: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.title = title;
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }, []);

  // Loading
  if (!station || reports === undefined) {
    return (
      <main className="fade-in min-h-[calc(100vh-3.5rem)] animate-in duration-300 md:min-h-[calc(100vh-4rem)]">
        <div className="p-4 md:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-xl md:text-2xl">Rapports</h1>
              <p className="text-muted-foreground text-sm">Chargement...</p>
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </main>
    );
  }

  const totalCount = allReports?.length ?? 0;
  const weekCount = reports.length;

  return (
    <main className="fade-in min-h-[calc(100vh-3.5rem)] animate-in duration-300 md:min-h-[calc(100vh-4rem)]">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-xl md:text-2xl">Rapports</h1>
              <p className="text-muted-foreground text-sm">
                {displayLabel} — {weekCount} rapport{weekCount !== 1 ? "s" : ""} cette semaine
                <span className="text-muted-foreground/60"> · {totalCount} au total</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setGenerateModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Générer un rapport
          </Button>
        </div>

        {/* Type filter tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as FilterTab);
          }}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="weekly">Hebdomadaires</TabsTrigger>
            <TabsTrigger value="daily">Quotidiens</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium text-lg text-muted-foreground">Aucun rapport pour cette semaine</p>
            <p className="mt-1 text-muted-foreground/70 text-sm">
              Les rapports sont générés automatiquement après chaque import.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead className="w-[140px]">Période</TableHead>
                  <TableHead className="w-[160px]">Créé le</TableHead>
                  <TableHead className="w-[80px] text-center">Confiance</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const isWeekly = report.reportType === "weekly";
                  return (
                    <TableRow key={report._id}>
                      <TableCell>
                        <Badge
                          variant={isWeekly ? "default" : "secondary"}
                          className={
                            isWeekly
                              ? "bg-blue-500/90 hover:bg-blue-500"
                              : "bg-emerald-500/90 text-white hover:bg-emerald-500"
                          }
                        >
                          {isWeekly ? "Hebdo" : "Quotidien"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {report.periodLabel}
                        {report.year && report.week && (
                          <span className="ml-1 text-muted-foreground/60">S{report.week}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(report.createdAt), "d MMM yyyy, HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.confidenceScore >= 0.8 ? (
                          <Badge variant="outline" className="text-emerald-600 text-xs">
                            {Math.round(report.confidenceScore * 100)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {Math.round(report.confidenceScore * 100)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Ouvrir"
                            onClick={() => {
                              handleOpenReport(report.htmlContent, report.title);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Imprimer / PDF"
                            onClick={() => {
                              handlePrintReport(report.htmlContent, report.title);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      <GenerateReportModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        stationCode={selectedStation.code}
        year={year}
        week={weekNum}
      />
    </main>
  );
}

// ── Generate Report Modal ──

function GenerateReportModal({
  open,
  onOpenChange,
  stationCode,
  year,
  week,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stationCode: string;
  year: number;
  week: number;
}) {
  const [selectedType, setSelectedType] = useState<ReportType>("weekly");

  const command = `npx tsx scripts/generate-report.ts --station-code ${stationCode} --year ${year} --week ${week}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Générer un rapport</DialogTitle>
          <DialogDescription>
            Choisissez le type de rapport à générer pour la semaine {week} ({year}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedType("weekly");
              }}
              className={`rounded-lg border p-4 text-left transition-all ${
                selectedType === "weekly"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="mb-1 font-semibold text-sm">Hebdomadaire</div>
              <p className="text-muted-foreground text-xs">
                Rapport complet station avec tendances, classement et recommandations.
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType("daily");
              }}
              className={`rounded-lg border p-4 text-left transition-all ${
                selectedType === "daily"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="mb-1 font-semibold text-sm">Quotidien</div>
              <p className="text-muted-foreground text-xs">KPIs du jour, alertes, absents et progression semaine.</p>
            </button>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-muted-foreground text-xs">
              <p className="mb-1">
                Les rapports sont générés automatiquement par les agents Claude (hebdo dimanche 22h, quotidien 7h).
              </p>
              <p>Pour forcer la génération manuellement, exécutez sur le serveur :</p>
            </div>
          </div>

          {/* Command */}
          <div className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{command}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
