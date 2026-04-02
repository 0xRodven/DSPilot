"use client";

import type React from "react";
import { useCallback, useState } from "react";

import { AlertCircle, Check, FileSpreadsheet, Loader2, Upload, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type DriverNameMapping, parseDriverNamesCsvFile } from "@/lib/parser/driver-names-csv";
import { cn } from "@/lib/utils";

interface CsvDropzoneProps {
  onMappingsChange: (mappings: DriverNameMapping[]) => void;
  mappings: DriverNameMapping[];
  disabled?: boolean;
  onImport?: () => Promise<void>;
  isImporting?: boolean;
  importSuccess?: boolean;
}

type DropzoneState = "idle" | "drag-over" | "loading" | "success" | "error";

export function CsvDropzone({
  onMappingsChange,
  mappings,
  disabled,
  onImport,
  isImporting,
  importSuccess,
}: CsvDropzoneProps) {
  const [state, setState] = useState<DropzoneState>(mappings.length > 0 ? "success" : "idle");
  const [filename, setFilename] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);

  const processFile = async (file: File) => {
    setState("loading");
    setFilename(file.name);
    setErrorMessage("");
    setWarnings([]);

    try {
      const result = await parseDriverNamesCsvFile(file);

      if (result.mappings.length === 0) {
        setState("error");
        setErrorMessage("Aucun mapping trouvé dans le fichier");
        onMappingsChange([]);
        return;
      }

      setWarnings(result.errors);
      onMappingsChange(result.mappings);
      setState("success");
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Erreur de lecture du fichier");
      onMappingsChange([]);
    }
  };

  const validateFile = (file: File): boolean => {
    const validExtensions = [".csv"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validExtensions.includes(extension)) {
      setState("error");
      setErrorMessage(`Format non supporté: ${file.name}. Seuls les fichiers .csv sont acceptés.`);
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
    setState("drag-over");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState("idle");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        processFile(file);
      }
    },
    [processFile, validateFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        processFile(file);
      }
      // Reset input
      e.target.value = "";
    },
    [processFile, validateFile],
  );

  const handleReset = () => {
    setState("idle");
    setFilename("");
    setErrorMessage("");
    setWarnings([]);
    onMappingsChange([]);
  };

  // Success state
  if (state === "success" && mappings.length > 0) {
    return (
      <div
        className={cn(
          "rounded-lg border p-4",
          importSuccess ? "border-emerald-500/50 bg-emerald-500/10" : "border-emerald-500/30 bg-emerald-500/5",
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-emerald-400">{importSuccess ? "Noms importés !" : "Fichier chargé"}</p>
              <p className="text-muted-foreground text-sm">{filename}</p>
              <div className="mt-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">
                  {mappings.length} noms de livreurs {importSuccess ? "mis à jour" : "détectés"}
                </span>
              </div>
              {warnings.length > 0 && (
                <div className="mt-2 text-amber-400 text-xs">
                  <AlertCircle className="mr-1 inline h-3 w-3" />
                  {warnings.length} avertissement{warnings.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onImport && !importSuccess && (
              <Button size="sm" onClick={onImport} disabled={isImporting || disabled}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Import...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer ({mappings.length})
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
              disabled={isImporting}
            >
              <X className="h-4 w-4" />
            </Button>
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
            <div className="rounded-lg bg-red-500/20 p-2">
              <X className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="font-medium text-red-400">Erreur</p>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <div>
            <p className="font-medium text-blue-400">Analyse en cours...</p>
            <p className="text-muted-foreground text-sm">{filename}</p>
          </div>
        </div>
      </div>
    );
  }

  // Idle / drag-over state
  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed p-4 transition-all duration-200",
        state === "idle" && "border-muted-foreground/25 bg-muted/5 hover:border-muted-foreground/50",
        state === "drag-over" && "border-blue-500 bg-blue-500/5",
        disabled && "pointer-events-none opacity-50",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-muted p-2">
          <FileSpreadsheet
            className={cn("h-5 w-5", state === "drag-over" ? "text-blue-400" : "text-muted-foreground")}
          />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">
            {state === "drag-over" ? "Déposez le fichier" : "Fichier des noms (optionnel)"}
          </p>
          <p className="text-muted-foreground text-xs">CSV Amazon pour associer les noms aux codes livreurs</p>
        </div>
        <label>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} disabled={disabled} />
          <Button variant="outline" size="sm" asChild disabled={disabled}>
            <span className="cursor-pointer">Parcourir</span>
          </Button>
        </label>
      </div>
    </div>
  );
}
