"use client"

import { CheckCircle2, XCircle, AlertTriangle, Clock, Calendar, Users, Database, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BatchImportSummary } from "@/lib/types/import"

interface BatchImportSummaryProps {
  summary: BatchImportSummary
  onViewDashboard: () => void
  onReset: () => void
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
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
  } = summary

  const hasErrors = failed > 0
  const hasWarnings = skipped > 0
  const isFullSuccess = successful === total

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Succès</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{successful}</p>
            <p className="text-xs text-muted-foreground">sur {total} fichiers</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Drivers</span>
            </div>
            <p className="text-2xl font-bold">{totalDrivers}</p>
            <p className="text-xs text-muted-foreground">importés</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Records</span>
            </div>
            <p className="text-2xl font-bold">{totalDailyRecords + totalWeeklyRecords}</p>
            <p className="text-xs text-muted-foreground">daily + weekly</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Durée</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(durationMs)}</p>
            <p className="text-xs text-muted-foreground">temps total</p>
          </div>
        </div>

        {/* Weeks imported */}
        {weeksImported.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Semaines importées</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {weeksImported.map(({ year, week }, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium"
                >
                  S{week} {year}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skipped files warning */}
        {skipped > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">{skipped} fichiers ignorés</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ces fichiers ont été ignorés car ils contenaient des doublons ou provenaient d'une station différente.
            </p>
          </div>
        )}

        {/* Failed files */}
        {failed > 0 && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">{failed} fichiers en erreur</span>
            </div>
            <ul className="space-y-1">
              {failedFiles.map((file, idx) => (
                <li key={idx} className="text-xs text-muted-foreground">
                  <span className="font-medium">{file.filename}:</span> {file.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
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
  )
}
