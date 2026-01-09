"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { FileSpreadsheet, X, Check, BarChart3, AlertCircle, Upload, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  parseDeliveryOverviewCsvFile,
  type DeliveryMetricData,
  type DetectedWeek,
} from "@/lib/parser/delivery-overview-csv";

interface StatsDropzoneProps {
  onImport: (metrics: DeliveryMetricData[]) => Promise<void>;
  disabled?: boolean;
}

type DropzoneState = "idle" | "drag-over" | "loading" | "preview" | "importing" | "success" | "error";

export function StatsDropzone({ onImport, disabled }: StatsDropzoneProps) {
  const [state, setState] = useState<DropzoneState>("idle");
  const [filename, setFilename] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parsedMetrics, setParsedMetrics] = useState<DeliveryMetricData[]>([]);
  const [detectedWeeks, setDetectedWeeks] = useState<DetectedWeek[]>([]);

  const processFile = async (file: File) => {
    setState("loading");
    setFilename(file.name);
    setErrorMessage("");
    setWarnings([]);

    try {
      const result = await parseDeliveryOverviewCsvFile(file);

      if (result.metrics.length === 0) {
        setState("error");
        setErrorMessage("Aucune métrique trouvée dans le fichier");
        return;
      }

      setWarnings(result.errors);
      setParsedMetrics(result.metrics);
      setDetectedWeeks(result.detectedWeeks);
      setState("preview");
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur de lecture du fichier"
      );
    }
  };

  const validateFile = (file: File): boolean => {
    const validExtensions = [".csv"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validExtensions.includes(extension)) {
      setState("error");
      setErrorMessage(
        `Format non supporté: ${file.name}. Seuls les fichiers .csv sont acceptés.`
      );
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setState("error");
      setErrorMessage("Fichier trop volumineux (max 10 MB)");
      return false;
    }

    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state !== "importing") {
      setState("drag-over");
    }
  }, [state]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state !== "importing") {
      setState("idle");
    }
  }, [state]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (state === "importing") return;

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        processFile(file);
      }
    },
    [state]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (state === "importing") return;

      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        processFile(file);
      }
      // Reset input
      e.target.value = "";
    },
    [state]
  );

  const handleReset = () => {
    setState("idle");
    setFilename("");
    setErrorMessage("");
    setWarnings([]);
    setParsedMetrics([]);
    setDetectedWeeks([]);
  };

  const handleConfirmImport = async () => {
    setState("importing");
    try {
      await onImport(parsedMetrics);
      setState("success");
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur lors de l'import"
      );
    }
  };

  // Get unique metrics count
  const uniqueMetrics = new Set(parsedMetrics.map((m) => m.metricName)).size;

  // Success state
  if (state === "success") {
    return (
      <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-emerald-400">Import réussi !</p>
              <p className="text-sm text-muted-foreground">{filename}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {detectedWeeks.length} semaine{detectedWeeks.length > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  {uniqueMetrics} métrique{uniqueMetrics > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            Nouveau fichier
          </Button>
        </div>
      </div>
    );
  }

  // Preview state (after parsing, before import)
  if (state === "preview" && parsedMetrics.length > 0) {
    return (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <FileSpreadsheet className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-blue-400">Fichier prêt à importer</p>
              <p className="text-sm text-muted-foreground">{filename}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {detectedWeeks.map((w) => w.label).join(", ")}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  {uniqueMetrics} métrique{uniqueMetrics > 1 ? "s" : ""}
                </span>
              </div>
              {warnings.length > 0 && (
                <div className="mt-2 text-xs text-amber-400">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  {warnings.length} avertissement{warnings.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleConfirmImport}
              disabled={disabled}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Importing state
  if (state === "importing") {
    return (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <div>
            <p className="font-medium text-blue-400">Import en cours...</p>
            <p className="text-sm text-muted-foreground">{filename}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <X className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="font-medium text-red-400">Erreur</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (state === "loading") {
    return (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
          <div>
            <p className="font-medium text-blue-400">Analyse en cours...</p>
            <p className="text-sm text-muted-foreground">{filename}</p>
          </div>
        </div>
      </div>
    );
  }

  // Idle / drag-over state
  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed p-6 transition-all duration-200",
        state === "idle" &&
          "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/5",
        state === "drag-over" && "border-blue-500 bg-blue-500/5",
        disabled && "opacity-50 pointer-events-none"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="p-3 rounded-lg bg-muted">
          <FileSpreadsheet
            className={cn(
              "h-8 w-8",
              state === "drag-over" ? "text-blue-400" : "text-muted-foreground"
            )}
          />
        </div>
        <div>
          <p className="font-medium">
            {state === "drag-over"
              ? "Déposez le fichier"
              : "Importer les statistiques"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Glissez-déposez votre fichier CSV "Delivery Overview" ou cliquez pour parcourir
          </p>
        </div>
        <label>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
            disabled={disabled}
          />
          <Button variant="outline" size="sm" asChild disabled={disabled}>
            <span className="cursor-pointer">Parcourir</span>
          </Button>
        </label>
      </div>
    </div>
  );
}
