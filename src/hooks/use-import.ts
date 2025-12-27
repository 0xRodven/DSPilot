"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { parseHtmlFile, calculateFleetAverages, type ParsedReport } from "@/lib/parser";

export type ImportPhase =
  | "idle"
  | "parsing"
  | "preview"
  | "uploading"
  | "success"
  | "error";

export interface ImportProgress {
  phase: ImportPhase;
  message: string;
  percent: number;
}

export interface ImportResult {
  importId: Id<"imports">;
  driversImported: number;
  newDriversCount: number;
  dailyRecordsCount: number;
  weeklyRecordsCount: number;
  dwcScore: number;
  iadcScore: number;
  tierDistribution: {
    fantastic: number;
    great: number;
    fair: number;
    poor: number;
  };
  warnings: string[];
}

interface UseImportOptions {
  stationId: Id<"stations">;
  userId: string;
  onSuccess?: (result: ImportResult) => void;
  onError?: (error: Error) => void;
}

export function useImport(options: UseImportOptions) {
  const { stationId, userId, onSuccess, onError } = options;

  const [progress, setProgress] = useState<ImportProgress>({
    phase: "idle",
    message: "",
    percent: 0,
  });
  const [parsedReport, setParsedReport] = useState<ParsedReport | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Convex mutations
  const bulkUpsertDrivers = useMutation(api.drivers.bulkUpsertDrivers);
  const bulkUpsertDailyStats = useMutation(api.stats.bulkUpsertDailyStats);
  const bulkUpsertWeeklyStats = useMutation(api.stats.bulkUpsertWeeklyStats);
  const updateStationWeeklyStats = useMutation(api.stats.updateStationWeeklyStats);
  const createImport = useMutation(api.imports.createImport);
  const startProcessing = useMutation(api.imports.startProcessing);
  const completeImport = useMutation(api.imports.completeImport);
  const failImport = useMutation(api.imports.failImport);

  /**
   * Phase 1: Parse le fichier HTML (côté client, ~1s)
   */
  const processFile = useCallback(async (file: File): Promise<ParsedReport> => {
    setError(null);
    setProgress({
      phase: "parsing",
      message: "Lecture du fichier...",
      percent: 10,
    });

    try {
      const report = await parseHtmlFile(file);

      setProgress({
        phase: "preview",
        message: `${report.transporterIds.length} drivers trouvés`,
        percent: 100,
      });

      setParsedReport(report);
      return report;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setProgress({
        phase: "error",
        message: error.message,
        percent: 0,
      });
      onError?.(error);
      throw error;
    }
  }, [onError]);

  /**
   * Phase 2: Upload vers Convex (batches)
   */
  const confirmImport = useCallback(async (report: ParsedReport): Promise<ImportResult> => {
    setProgress({
      phase: "uploading",
      message: "Création de l'import...",
      percent: 5,
    });

    try {
      // 1. Créer l'import record
      const importId = await createImport({
        stationId,
        filename: report.filename,
        year: report.year,
        week: report.week,
        importedBy: userId,
      });

      await startProcessing({ importId });

      // 2. Upsert drivers
      setProgress({
        phase: "uploading",
        message: "Import des drivers...",
        percent: 15,
      });

      const weekKey = `${report.year}-${report.week}`;
      const driverMap = await bulkUpsertDrivers({
        stationId,
        amazonIds: report.transporterIds,
        weekKey,
      });

      // Compter les nouveaux drivers (ceux qui n'existaient pas avant)
      // Pour l'instant on ne peut pas le savoir facilement, on met 0
      const newDriversCount = 0;

      // 3. Upsert daily stats (en batches de 50)
      setProgress({
        phase: "uploading",
        message: "Import des stats daily...",
        percent: 30,
      });

      const dailyStatsWithIds = report.dailyStats.map((stat) => ({
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

      // Batch daily stats
      const BATCH_SIZE = 50;
      for (let i = 0; i < dailyStatsWithIds.length; i += BATCH_SIZE) {
        const batch = dailyStatsWithIds.slice(i, i + BATCH_SIZE);
        await bulkUpsertDailyStats({ stats: batch });

        const percent = 30 + Math.round((i / dailyStatsWithIds.length) * 30);
        setProgress({
          phase: "uploading",
          message: `Stats daily: ${Math.min(i + BATCH_SIZE, dailyStatsWithIds.length)}/${dailyStatsWithIds.length}`,
          percent,
        });
      }

      // 4. Upsert weekly stats
      setProgress({
        phase: "uploading",
        message: "Import des stats weekly...",
        percent: 70,
      });

      // Calculate days worked per driver from daily stats
      const daysWorkedByDriver = new Map<string, number>();
      for (const stat of report.dailyStats) {
        const hasActivity = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts > 0;
        if (hasActivity) {
          const current = daysWorkedByDriver.get(stat.transporterId) || 0;
          daysWorkedByDriver.set(stat.transporterId, current + 1);
        }
      }

      const weeklyStatsWithIds = report.weeklyStats.map((stat) => ({
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

        const percent = 70 + Math.round((i / weeklyStatsWithIds.length) * 15);
        setProgress({
          phase: "uploading",
          message: `Stats weekly: ${Math.min(i + BATCH_SIZE, weeklyStatsWithIds.length)}/${weeklyStatsWithIds.length}`,
          percent,
        });
      }

      // 5. Mettre à jour les stats station
      setProgress({
        phase: "uploading",
        message: "Calcul des stats station...",
        percent: 90,
      });

      await updateStationWeeklyStats({
        stationId,
        year: report.year,
        week: report.week,
      });

      // 6. Calculer les scores finaux
      const fleetAverages = calculateFleetAverages(report.weeklyStats);

      // Calculer tier distribution
      const tierDistribution = {
        fantastic: 0,
        great: 0,
        fair: 0,
        poor: 0,
      };

      for (const stat of report.weeklyStats) {
        const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        if (total > 0) {
          const dwcPercent = (stat.dwcCompliant / total) * 100;
          if (dwcPercent >= 98.5) tierDistribution.fantastic++;
          else if (dwcPercent >= 96) tierDistribution.great++;
          else if (dwcPercent >= 90) tierDistribution.fair++;
          else tierDistribution.poor++;
        }
      }

      // 7. Marquer l'import comme complété
      await completeImport({
        importId,
        driversImported: report.transporterIds.length,
        dailyRecordsCount: dailyStatsWithIds.length,
        weeklyRecordsCount: weeklyStatsWithIds.length,
        newDriversCount,
        dwcScore: fleetAverages.dwcPercent,
        iadcScore: fleetAverages.iadcPercent,
        tierDistribution,
        warnings: report.warnings.length > 0 ? report.warnings : undefined,
      });

      setProgress({
        phase: "success",
        message: "Import terminé !",
        percent: 100,
      });

      const result: ImportResult = {
        importId,
        driversImported: report.transporterIds.length,
        newDriversCount,
        dailyRecordsCount: dailyStatsWithIds.length,
        weeklyRecordsCount: weeklyStatsWithIds.length,
        dwcScore: fleetAverages.dwcPercent,
        iadcScore: fleetAverages.iadcPercent,
        tierDistribution,
        warnings: report.warnings,
      };

      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setProgress({
        phase: "error",
        message: error.message,
        percent: 0,
      });
      onError?.(error);
      throw error;
    }
  }, [
    stationId,
    userId,
    createImport,
    startProcessing,
    bulkUpsertDrivers,
    bulkUpsertDailyStats,
    bulkUpsertWeeklyStats,
    updateStationWeeklyStats,
    completeImport,
    onSuccess,
    onError,
  ]);

  /**
   * Reset le state
   */
  const reset = useCallback(() => {
    setParsedReport(null);
    setError(null);
    setProgress({
      phase: "idle",
      message: "",
      percent: 0,
    });
  }, []);

  return {
    progress,
    parsedReport,
    error,
    processFile,
    confirmImport,
    reset,
    isIdle: progress.phase === "idle",
    isParsing: progress.phase === "parsing",
    isPreview: progress.phase === "preview",
    isUploading: progress.phase === "uploading",
    isSuccess: progress.phase === "success",
    isError: progress.phase === "error",
  };
}
