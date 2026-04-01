"use client";

import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";

import { SignedIn, SignedOut, SignInButton, useOrganization, useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { BatchImportProgress } from "@/components/import/batch-import-progress";
import { BatchImportSummaryCard } from "@/components/import/batch-import-summary";
import { CoverageStats } from "@/components/import/coverage-stats";
import { CsvDropzone } from "@/components/import/csv-dropzone";
import { Dropzone } from "@/components/import/dropzone";
import { FormatGuide } from "@/components/import/format-guide";
import { ImportHistory } from "@/components/import/import-history";
import { ImportState, type ImportStep } from "@/components/import/import-state";
import { useBatchImport } from "@/hooks/use-batch-import";
import {
  calculateDwcPercent,
  calculateFleetAverages,
  calculateIadcPercent,
  type ParsedReport,
  parseHtmlFile,
} from "@/lib/parser";
import type { DriverNameMapping } from "@/lib/parser/driver-names-csv";
import { useDashboardStore } from "@/lib/store";
import type { ParsedImportData } from "@/lib/types";
import type { BatchImportSummary } from "@/lib/types/import";
import { getTier } from "@/lib/utils/tier";

// Convert ParsedReport to ParsedImportData format for UI
function convertToParsedImportData(report: ParsedReport): ParsedImportData {
  const fleetAverages = calculateFleetAverages(report.weeklyStats);

  // Calculer la distribution par tier
  const tierDistribution = { fantastic: 0, great: 0, fair: 0, poor: 0 };
  const drivers: ParsedImportData["drivers"] = [];

  for (const stat of report.weeklyStats) {
    const dwcPercent = calculateDwcPercent(stat);
    const iadcPercent = calculateIadcPercent(stat);
    const tier = getTier(dwcPercent);

    tierDistribution[tier]++;

    drivers.push({
      id: stat.transporterId,
      name: stat.transporterId, // Will be replaced with real name later
      amazonId: stat.transporterId,
      dwcPercent,
      iadcPercent,
      tier,
      isNew: false, // We don't know yet if they're new
    });
  }

  // Sort by DWC% descending
  drivers.sort((a, b) => b.dwcPercent - a.dwcPercent);

  return {
    filename: report.filename,
    stationCode: report.stationCode,
    stationName: report.stationCode, // Will be enhanced later
    year: report.year,
    week: report.week,
    weekDates: `Semaine ${report.week}, ${report.year}`,
    driversCount: report.transporterIds.length,
    dailyRecordsCount: report.dailyStats.length,
    weeklyRecordsCount: report.weeklyStats.length,
    trendsData: Math.min(7, new Set(report.dailyStats.map((s) => s.date)).size),
    dwcScore: Math.round(fleetAverages.dwcPercent * 10) / 10,
    iadcScore: Math.round(fleetAverages.iadcPercent * 10) / 10,
    tierDistribution,
    newDrivers: 0, // Will be calculated after checking DB
    existingWeek: false, // Will be checked against DB
    drivers: drivers.slice(0, 10), // Show first 10 for preview
  };
}

export default function ImportPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization } = useOrganization();
  const { selectedStation } = useDashboardStore();

  const [importStep, setImportStep] = useState<ImportStep | null>(null);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState("");
  const [parsedReport, setParsedReport] = useState<ParsedReport | null>(null);
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [successStats, setSuccessStats] = useState<{
    driversImported: number;
    dailyRecords: number;
    weeklyRecords: number;
    newDrivers: number;
    namesUpdated?: number;
  } | null>(null);

  // CSV driver names mapping
  const [driverMappings, setDriverMappings] = useState<DriverNameMapping[]>([]);
  const [isImportingNames, setIsImportingNames] = useState(false);
  const [namesImportSuccess, setNamesImportSuccess] = useState(false);

  // Batch import mode
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchSummary, setBatchSummary] = useState<BatchImportSummary | null>(null);

  // Convex mutations
  const getOrCreateStationForOrg = useMutation(api.stations.getOrCreateStationForCurrentOrg);
  const bulkUpsertDrivers = useMutation(api.drivers.bulkUpsertDrivers);
  const bulkUpdateDriverNames = useMutation(api.drivers.bulkUpdateDriverNames);
  const bulkUpsertDailyStats = useMutation(api.stats.bulkUpsertDailyStats);
  const bulkUpsertWeeklyStats = useMutation(api.stats.bulkUpsertWeeklyStats);
  const updateStationWeeklyStats = useMutation(api.stats.updateStationWeeklyStats);
  const createImport = useMutation(api.imports.createImport);
  const startProcessing = useMutation(api.imports.startProcessing);
  const completeImport = useMutation(api.imports.completeImport);
  const _failImport = useMutation(api.imports.failImport);

  // Get station for current org (1 Org = 1 Station)
  const currentStation = useQuery(api.stations.getStationForCurrentOrg);

  // Batch import hook
  const batchImport = useBatchImport({
    stationId: currentStation?._id!,
    userId: user?.id || "",
    onComplete: (summary) => {
      setBatchSummary(summary);
      toast.success(`Import terminé: ${summary.successful}/${summary.total} fichiers`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Convex queries for real data (only when station exists)
  const importHistory = useQuery(api.imports.listImports, currentStation ? { stationId: currentStation._id } : "skip");
  const weekCoverage = useQuery(
    api.imports.getWeekCoverage,
    currentStation ? { stationId: currentStation._id, year: new Date().getFullYear() } : "skip",
  );

  const startParsing = useCallback(async (file: File) => {
    setImportStep("parsing");
    setProgress(0);

    try {
      // Parse the HTML file
      setProgress(20);
      const report = await parseHtmlFile(file);
      setProgress(60);

      // Convert to UI format
      const data = convertToParsedImportData(report);
      setProgress(100);

      setParsedReport(report);
      setParsedData(data);

      setTimeout(() => {
        setImportStep("preview");
      }, 300);
    } catch (err) {
      console.error("Parse error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Erreur de parsing");
      setErrorDetails(err instanceof Error ? err.stack || "" : String(err));
      setImportStep("error");
    }
  }, []);

  // Real file parsing - handles single file (legacy) or triggers batch mode
  const handleFilesSelect = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // If multiple files, switch to batch mode
      if (files.length > 1) {
        setIsBatchMode(true);
        setBatchSummary(null);
        batchImport.addFiles(files);
        // Start parsing immediately
        setTimeout(() => batchImport.startParsing(), 100);
        return;
      }

      // Single file: use existing flow
      const file = files[0];
      setIsBatchMode(false);
      setFilename(file.name);
      setImportStep("uploading");
      setProgress(0);
      setErrorMessage("");
      setErrorDetails("");

      // Simulate upload progress (file is already in memory)
      let uploadProgress = 0;
      const uploadInterval = setInterval(() => {
        uploadProgress += 20;
        setProgress(uploadProgress);
        if (uploadProgress >= 100) {
          clearInterval(uploadInterval);
          startParsing(file);
        }
      }, 100);
    },
    [batchImport, startParsing],
  );

  const handleUrlImport = useCallback((_url: string) => {
    // For now, just show an error - URL import would need server-side fetch
    setErrorMessage("L'import par URL n'est pas encore supporté");
    setImportStep("error");
  }, []);

  const handleCancel = useCallback(() => {
    setImportStep(null);
    setProgress(0);
    setFilename("");
    setParsedReport(null);
    setParsedData(null);
    setErrorMessage("");
    setErrorDetails("");
    setSuccessStats(null);
    setDriverMappings([]);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!parsedReport || !parsedData) {
      console.error("Missing parsed data:", { parsedReport: !!parsedReport, parsedData: !!parsedData });
      setErrorMessage("Données de parsing manquantes");
      setImportStep("error");
      return;
    }

    if (!isUserLoaded) {
      console.error("User not loaded yet");
      setErrorMessage("Chargement en cours... Veuillez réessayer.");
      setImportStep("error");
      return;
    }

    if (!user) {
      console.error("User not authenticated");
      setErrorMessage("Utilisateur non connecté. Veuillez vous reconnecter.");
      setImportStep("error");
      return;
    }

    setImportStep("parsing");
    setProgress(0);

    try {
      // 1. Récupérer ou créer la station de l'org (auto-création si besoin)
      setProgress(5);

      const station = await getOrCreateStationForOrg({ orgName: organization?.name });

      if (!station) {
        throw new Error("Impossible de créer la station pour cette organisation");
      }

      const stationId = station._id;

      // 2. Create import record
      setProgress(10);
      const importId = await createImport({
        stationId,
        filename: parsedReport.filename,
        year: parsedReport.year,
        week: parsedReport.week,
        importedBy: user.id,
      });

      await startProcessing({ importId });

      // 3. Upsert drivers
      setProgress(18);
      const weekKey = `${parsedReport.year}-${parsedReport.week}`;
      const driverMap = await bulkUpsertDrivers({
        stationId,
        amazonIds: parsedReport.transporterIds,
        weekKey,
      });

      // 3b. Update driver names if CSV was provided
      let namesUpdated = 0;
      if (driverMappings.length > 0) {
        setProgress(22);
        const nameResult = await bulkUpdateDriverNames({
          stationId,
          mappings: driverMappings,
        });
        namesUpdated = nameResult.updated;
      }

      // 4. Upsert daily stats (in batches)
      setProgress(30);
      const dailyStatsWithIds = parsedReport.dailyStats.map((stat) => ({
        driverId: driverMap[stat.transporterId],
        stationId,
        date: stat.date!,
        year: stat.year,
        week: stat.week,
        dwcCompliant: stat.dwcCompliant,
        dwcMisses: stat.dwcMisses,
        failedAttempts: stat.failedAttempts,
        iadcCompliant: stat.iadcCompliant,
        iadcNonCompliant: stat.iadcNonCompliant,
        dwcBreakdown: stat.dwcBreakdown,
        iadcBreakdown: stat.iadcBreakdown
          ? {
              mailbox: stat.iadcBreakdown.mailbox,
              unattended: stat.iadcBreakdown.unattended,
              safePlace: stat.iadcBreakdown.safePlace,
              other: stat.iadcBreakdown.other,
            }
          : undefined,
      }));

      const BATCH_SIZE = 50;
      for (let i = 0; i < dailyStatsWithIds.length; i += BATCH_SIZE) {
        const batch = dailyStatsWithIds.slice(i, i + BATCH_SIZE);
        await bulkUpsertDailyStats({ stats: batch });
        const pct = 30 + Math.round((i / dailyStatsWithIds.length) * 25);
        setProgress(pct);
      }

      // 5. Upsert weekly stats
      setProgress(60);

      // Calculate days worked per driver from daily stats
      const daysWorkedByDriver = new Map<string, number>();
      for (const stat of parsedReport.dailyStats) {
        const hasActivity = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts > 0;
        if (hasActivity) {
          const current = daysWorkedByDriver.get(stat.transporterId) || 0;
          daysWorkedByDriver.set(stat.transporterId, current + 1);
        }
      }

      const weeklyStatsWithIds = parsedReport.weeklyStats.map((stat) => ({
        driverId: driverMap[stat.transporterId],
        stationId,
        year: stat.year,
        week: stat.week,
        dwcCompliant: stat.dwcCompliant,
        dwcMisses: stat.dwcMisses,
        failedAttempts: stat.failedAttempts,
        iadcCompliant: stat.iadcCompliant,
        iadcNonCompliant: stat.iadcNonCompliant,
        daysWorked: daysWorkedByDriver.get(stat.transporterId) || 0,
        dwcBreakdown: stat.dwcBreakdown,
        iadcBreakdown: stat.iadcBreakdown
          ? {
              mailbox: stat.iadcBreakdown.mailbox,
              unattended: stat.iadcBreakdown.unattended,
              safePlace: stat.iadcBreakdown.safePlace,
              other: stat.iadcBreakdown.other,
            }
          : undefined,
      }));

      for (let i = 0; i < weeklyStatsWithIds.length; i += BATCH_SIZE) {
        const batch = weeklyStatsWithIds.slice(i, i + BATCH_SIZE);
        await bulkUpsertWeeklyStats({ stats: batch });
        const pct = 60 + Math.round((i / weeklyStatsWithIds.length) * 20);
        setProgress(pct);
      }

      // 6. Update station weekly stats
      setProgress(85);
      await updateStationWeeklyStats({
        stationId,
        year: parsedReport.year,
        week: parsedReport.week,
      });

      // 7. Complete import
      setProgress(95);
      const fleetAverages = calculateFleetAverages(parsedReport.weeklyStats);

      await completeImport({
        importId,
        driversImported: parsedReport.transporterIds.length,
        dailyRecordsCount: dailyStatsWithIds.length,
        weeklyRecordsCount: weeklyStatsWithIds.length,
        newDriversCount: 0, // TODO: calculate actual new drivers
        dwcScore: fleetAverages.dwcPercent,
        iadcScore: fleetAverages.iadcPercent,
        tierDistribution: parsedData.tierDistribution,
        warnings: parsedReport.warnings.length > 0 ? parsedReport.warnings : undefined,
      });

      setProgress(100);
      setSuccessStats({
        driversImported: parsedReport.transporterIds.length,
        dailyRecords: dailyStatsWithIds.length,
        weeklyRecords: weeklyStatsWithIds.length,
        newDrivers: 0,
        namesUpdated,
      });
      setImportStep("success");
    } catch (err) {
      console.error("[Import] ERROR:", err);
      setErrorMessage(err instanceof Error ? err.message : "Erreur d'import");
      setErrorDetails(err instanceof Error ? err.stack || "" : String(err));
      setImportStep("error");
    }
  }, [
    parsedReport,
    parsedData,
    user,
    isUserLoaded,
    driverMappings,
    organization,
    getOrCreateStationForOrg,
    createImport,
    startProcessing,
    bulkUpsertDrivers,
    bulkUpdateDriverNames,
    bulkUpsertDailyStats,
    bulkUpsertWeeklyStats,
    updateStationWeeklyStats,
    completeImport,
  ]);

  const handleReset = useCallback(() => {
    setImportStep(null);
    setProgress(0);
    setFilename("");
    setParsedReport(null);
    setParsedData(null);
    setErrorMessage("");
    setErrorDetails("");
    setSuccessStats(null);
    setDriverMappings([]);
    setNamesImportSuccess(false);
    // Reset batch mode
    setIsBatchMode(false);
    setBatchSummary(null);
    batchImport.reset();
  }, [batchImport]);

  // Batch import handlers
  const handleBatchConfirm = useCallback(() => {
    if (!currentStation) {
      toast.error("Station non disponible");
      return;
    }
    batchImport.startImport();
  }, [batchImport, currentStation]);

  const handleBatchCancel = useCallback(() => {
    batchImport.cancel();
    handleReset();
  }, [batchImport, handleReset]);

  // Standalone CSV import handler
  const handleImportNames = useCallback(async () => {
    if (!currentStation || driverMappings.length === 0) {
      toast.error("Station non disponible ou aucun mapping à importer");
      return;
    }

    setIsImportingNames(true);
    try {
      const result = await bulkUpdateDriverNames({
        stationId: currentStation._id,
        mappings: driverMappings,
      });
      setNamesImportSuccess(true);
      toast.success(`${result.updated} noms de livreurs importés`);
    } catch (error) {
      console.error("[Import] Error importing names:", error);
      toast.error("Erreur lors de l'import des noms");
    } finally {
      setIsImportingNames(false);
    }
  }, [currentStation, driverMappings, bulkUpdateDriverNames]);

  const handleViewDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const parsingSteps = [
    { id: "upload", label: "Fichier uploadé", status: "done" as const },
    {
      id: "metadata",
      label: "Metadata extraite",
      status: progress >= 20 ? ("done" as const) : ("pending" as const),
      detail:
        progress >= 20 && parsedReport
          ? `${parsedReport.stationCode} • Semaine ${parsedReport.week} • ${parsedReport.year}`
          : undefined,
    },
    {
      id: "weekly",
      label: "Weekly data",
      status: progress >= 40 ? ("done" as const) : progress >= 20 ? ("in-progress" as const) : ("pending" as const),
      detail: progress >= 40 && parsedReport ? `${parsedReport.transporterIds.length} drivers trouvés` : undefined,
    },
    {
      id: "daily",
      label: "Daily data",
      status: progress >= 60 ? ("done" as const) : progress >= 40 ? ("in-progress" as const) : ("pending" as const),
      detail:
        progress >= 60 && parsedReport
          ? `${parsedReport.dailyStats.length} records`
          : progress >= 40
            ? "Parsing en cours..."
            : undefined,
    },
    {
      id: "aggregation",
      label: "Agrégation",
      status: progress >= 80 ? ("done" as const) : progress >= 60 ? ("in-progress" as const) : ("pending" as const),
    },
    {
      id: "validation",
      label: "Validation des données",
      status: progress >= 100 ? ("done" as const) : progress >= 80 ? ("in-progress" as const) : ("pending" as const),
    },
  ];

  // Check if we're in test environment (Playwright sets this flag)
  const isTestEnvironment = typeof window !== "undefined" && window.localStorage.getItem("playwright-test") === "true";

  // Show loading state while Clerk loads (skip in test environment)
  if (!isUserLoaded && !isTestEnvironment) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <SignedOut>
        <div className="flex h-full items-center justify-center p-6">
          <div className="space-y-4 text-center">
            <h2 className="font-semibold text-xl">Connexion requise</h2>
            <p className="text-muted-foreground">Vous devez être connecté pour importer des fichiers.</p>
            <SignInButton mode="modal">
              <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
                Se connecter
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="space-y-6 p-6">
          {/* Page Title */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-xl">Import</h1>
              <p className="text-muted-foreground text-sm">Importez vos rapports Amazon DWC/IADC</p>
            </div>
          </div>

          {/* Zone 1: Upload + Guide */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              {!importStep && !isBatchMode ? (
                <>
                  <Dropzone onFilesSelect={handleFilesSelect} onUrlImport={handleUrlImport} />
                  <CsvDropzone
                    mappings={driverMappings}
                    onMappingsChange={setDriverMappings}
                    onImport={handleImportNames}
                    isImporting={isImportingNames}
                    importSuccess={namesImportSuccess}
                  />
                </>
              ) : isBatchMode ? (
                // Batch import mode
                batchSummary ? (
                  // Show summary when complete
                  <BatchImportSummaryCard
                    summary={batchSummary}
                    onViewDashboard={handleViewDashboard}
                    onReset={handleReset}
                  />
                ) : batchImport.state.phase === "ready" ? (
                  // Ready to import - show confirm button
                  <div className="space-y-4">
                    <BatchImportProgress state={batchImport.state} onCancel={handleBatchCancel} />
                    <div className="flex gap-3">
                      <button
                        onClick={handleBatchConfirm}
                        disabled={!batchImport.canStart}
                        className="flex-1 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        Confirmer l'import ({batchImport.readyCount} fichiers)
                      </button>
                      <button
                        onClick={handleBatchCancel}
                        className="rounded-lg border border-border px-4 py-3 text-muted-foreground hover:bg-muted"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  // In progress (parsing or processing)
                  <BatchImportProgress state={batchImport.state} onCancel={handleBatchCancel} />
                )
              ) : importStep ? (
                // Single file mode (legacy)
                <>
                  <ImportState
                    step={importStep}
                    progress={progress}
                    filename={filename}
                    parsingSteps={parsingSteps}
                    parsedData={parsedData || undefined}
                    errorMessage={errorMessage}
                    errorDetails={errorDetails}
                    successStats={successStats || undefined}
                    onCancel={handleCancel}
                    onConfirm={handleConfirm}
                    onReset={handleReset}
                    onViewDashboard={handleViewDashboard}
                  />
                  {importStep === "preview" && (
                    <CsvDropzone
                      mappings={driverMappings}
                      onMappingsChange={setDriverMappings}
                      onImport={handleImportNames}
                      isImporting={isImportingNames}
                      importSuccess={namesImportSuccess}
                    />
                  )}
                </>
              ) : null}
            </div>
            <div className="lg:col-span-2">
              <FormatGuide />
            </div>
          </div>

          {/* Zone 3: Import History */}
          <ImportHistory imports={importHistory ?? []} stationCode={selectedStation.code} />

          {/* Zone 4: Coverage Stats */}
          <CoverageStats
            stationCode={selectedStation.code}
            year={new Date().getFullYear()}
            coverage={weekCoverage ?? []}
          />
        </div>
      </SignedIn>
    </main>
  );
}
