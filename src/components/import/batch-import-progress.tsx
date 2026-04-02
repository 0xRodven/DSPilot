"use client";

import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BatchImportState, ImportQueueItem } from "@/lib/types/import";
import { cn } from "@/lib/utils";

interface BatchImportProgressProps {
  state: BatchImportState;
  onCancel: () => void;
}

function getStatusIcon(status: ImportQueueItem["status"]) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "skipped":
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case "parsing":
    case "uploading":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    case "ready":
    case "parsed":
      return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusLabel(status: ImportQueueItem["status"]) {
  switch (status) {
    case "pending":
      return "En attente";
    case "parsing":
      return "Parsing...";
    case "parsed":
      return "Parsé";
    case "validating":
      return "Validation...";
    case "ready":
      return "Prêt";
    case "uploading":
      return "Upload...";
    case "success":
      return "Succès";
    case "failed":
      return "Échec";
    case "skipped":
      return "Ignoré";
    default:
      return status;
  }
}

function getPhaseLabel(phase: BatchImportState["phase"]) {
  switch (phase) {
    case "idle":
      return "En attente";
    case "collecting":
      return "Fichiers sélectionnés";
    case "parsing":
      return "Parsing des fichiers...";
    case "validating":
      return "Validation...";
    case "ready":
      return "Prêt pour l'import";
    case "processing":
      return "Import en cours...";
    case "complete":
      return "Terminé";
    case "error":
      return "Erreur";
    default:
      return phase;
  }
}

export function BatchImportProgress({ state, onCancel }: BatchImportProgressProps) {
  const { items, phase, totalProgress, currentIndex, validationWarnings } = state;

  const successCount = items.filter((i) => i.status === "success").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const skippedCount = items.filter((i) => i.status === "skipped").length;
  const processingCount = items.filter((i) => i.status === "uploading" || i.status === "parsing").length;

  const currentItem = phase === "processing" && currentIndex >= 0 ? items.find((i) => i.status === "uploading") : null;

  const isProcessing = phase === "parsing" || phase === "processing";

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            {getPhaseLabel(phase)}
          </CardTitle>
          {isProcessing && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Annuler
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression globale</span>
            <span className="font-medium">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              {successCount} succès
            </span>
            {failedCount > 0 && (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-400" />
                {failedCount} échecs
              </span>
            )}
            {skippedCount > 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                {skippedCount} ignorés
              </span>
            )}
            {processingCount > 0 && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                {processingCount} en cours
              </span>
            )}
          </div>
        </div>

        {/* Current file progress (when processing) */}
        {currentItem && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="max-w-[200px] truncate font-medium">{currentItem.file.name}</span>
              <span className="text-muted-foreground">{currentItem.progress}%</span>
            </div>
            <Progress value={currentItem.progress} className="h-1.5" />
          </div>
        )}

        {/* Validation warnings */}
        {validationWarnings.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="mb-2 font-medium text-amber-400 text-sm">Avertissements</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              {validationWarnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Files list */}
        <div>
          <p className="mb-2 font-medium text-sm">Fichiers ({items.length})</p>
          <ScrollArea className="h-[200px]">
            <div className="space-y-1 pr-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg p-2 text-sm",
                    item.status === "uploading" && "border border-blue-500/30 bg-blue-500/10",
                    item.status === "success" && "bg-emerald-500/5",
                    item.status === "failed" && "bg-red-500/5",
                    item.status === "skipped" && "bg-amber-500/5",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="max-w-[180px] truncate">{item.file.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.status === "uploading" && <span className="text-blue-400 text-xs">{item.progress}%</span>}
                    <span
                      className={cn(
                        "text-xs",
                        item.status === "success" && "text-emerald-400",
                        item.status === "failed" && "text-red-400",
                        item.status === "skipped" && "text-amber-400",
                        !["success", "failed", "skipped"].includes(item.status) && "text-muted-foreground",
                      )}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Error details for failed items */}
        {failedCount > 0 && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="mb-2 font-medium text-red-400 text-sm">Détails des erreurs</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              {items
                .filter((i) => i.status === "failed")
                .map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                    <span>
                      <span className="font-medium">{item.file.name}:</span> {item.error}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
