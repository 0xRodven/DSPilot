"use client";

import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, Clock, Database, Users, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BatchImportSummary } from "@/lib/types/import";

interface BatchImportSummaryProps {
  summary: BatchImportSummary;
  onViewDashboard: () => void;
  onReset: () => void;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function BatchImportSummaryCard({ summary, onViewDashboard, onReset }: BatchImportSummaryProps) {
  const {
    total,
    successful,
    failed,
    skipped,
    totalDrivers,
    totalDailyRecords,
    totalWeeklyRecords,
    weeksImported,
    failedFiles,
    durationMs,
  } = summary;

  const hasErrors = failed > 0;
  const _hasWarnings = skipped > 0;
  const isFullSuccess = successful === total;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isFullSuccess ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Import terminé avec succès
            </>
          ) : hasErrors ? (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Import terminé avec des erreurs
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Import terminé
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-muted-foreground text-xs">Succès</span>
            </div>
            <p className="font-bold text-2xl text-emerald-400">{successful}</p>
            <p className="text-muted-foreground text-xs">sur {total} fichiers</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-muted-foreground text-xs">Drivers</span>
            </div>
            <p className="font-bold text-2xl">{totalDrivers}</p>
            <p className="text-muted-foreground text-xs">importés</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-400" />
              <span className="text-muted-foreground text-xs">Records</span>
            </div>
            <p className="font-bold text-2xl">{totalDailyRecords + totalWeeklyRecords}</p>
            <p className="text-muted-foreground text-xs">daily + weekly</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">Durée</span>
            </div>
            <p className="font-bold text-2xl">{formatDuration(durationMs)}</p>
            <p className="text-muted-foreground text-xs">temps total</p>
          </div>
        </div>

        {/* Weeks imported */}
        {weeksImported.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Semaines importées</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {weeksImported.map(({ year, week }, idx) => (
                <span key={idx} className="rounded-full bg-blue-500/20 px-2 py-1 font-medium text-blue-400 text-xs">
                  S{week} {year}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skipped files warning */}
        {skipped > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="mb-1 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-amber-400 text-sm">{skipped} fichiers ignorés</span>
            </div>
            <p className="text-muted-foreground text-xs">
              Ces fichiers ont été ignorés car ils contenaient des doublons ou provenaient d'une station différente.
            </p>
          </div>
        )}

        {/* Failed files */}
        {failed > 0 && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <div className="mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="font-medium text-red-400 text-sm">{failed} fichiers en erreur</span>
            </div>
            <ul className="space-y-1">
              {failedFiles.map((file, idx) => (
                <li key={idx} className="text-muted-foreground text-xs">
                  <span className="font-medium">{file.filename}:</span> {file.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onViewDashboard} className="flex-1">
            Voir le Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onReset}>
            Nouvel import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
