"use client";

import type React from "react";
import { useCallback, useState } from "react";

import { FileText, Link2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFilesSelect: (files: File[]) => void;
  onUrlImport: (url: string) => void;
  disabled?: boolean;
}

type DropzoneState = "idle" | "drag-over" | "invalid";

export function Dropzone({ onFilesSelect, onUrlImport, disabled }: DropzoneProps) {
  const [state, setState] = useState<DropzoneState>("idle");
  const [invalidFile, setInvalidFile] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");

  const validateFile = (file: File): boolean => {
    const validExtensions = [".html", ".htm"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    const isValidExtension = validExtensions.includes(extension);
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10 MB

    if (!isValidExtension) {
      setState("invalid");
      setInvalidFile(file.name);
      return false;
    }

    if (!isValidSize) {
      setState("invalid");
      setInvalidFile(`${file.name} (trop volumineux)`);
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

      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter((file) => validateFile(file));

      if (validFiles.length > 0) {
        setState("idle");
        onFilesSelect(validFiles);
      } else if (droppedFiles.length > 0) {
        // All files were invalid, state already set by validateFile
      }
    },
    [onFilesSelect, validateFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;

      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter((file) => validateFile(file));

      if (validFiles.length > 0) {
        onFilesSelect(validFiles);
      }

      // Reset input to allow selecting same files again
      e.target.value = "";
    },
    [onFilesSelect, validateFile],
  );

  const handleUrlImport = () => {
    if (urlValue.trim()) {
      onUrlImport(urlValue.trim());
      setUrlValue("");
    }
  };

  const resetState = () => {
    setState("idle");
    setInvalidFile(null);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200",
          state === "idle" && "border-muted-foreground/25 bg-muted/5 hover:border-muted-foreground/50",
          state === "drag-over" && "animate-pulse border-blue-500 bg-blue-500/5",
          state === "invalid" && "border-red-500 bg-red-500/5",
          disabled && "pointer-events-none opacity-50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {state === "invalid" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <X className="h-6 w-6 text-red-400" />
            </div>
            <p className="mb-2 font-medium text-lg text-red-400">Format non supporté</p>
            <p className="mb-2 text-muted-foreground text-sm">Seuls les fichiers .html sont acceptés</p>
            <p className="mb-4 text-muted-foreground text-sm">Fichier reçu: {invalidFile}</p>
            <Button variant="outline" size="sm" onClick={resetState}>
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {state === "drag-over" ? (
                <FileText className="h-6 w-6 text-blue-400" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="mb-2 font-medium text-lg">
              {state === "drag-over" ? "Déposez les fichiers ici" : "Glissez vos fichiers HTML ici"}
            </p>
            <p className="mb-4 text-muted-foreground text-sm">ou</p>
            <label>
              <input
                type="file"
                accept=".html,.htm"
                multiple
                className="hidden"
                onChange={handleFileInput}
                disabled={disabled}
              />
              <Button variant="outline" asChild>
                <span className="cursor-pointer">Parcourir les fichiers</span>
              </Button>
            </label>
            <p className="mt-4 text-muted-foreground text-xs">
              .html uniquement • Max 10 MB par fichier • Multi-sélection supportée
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">Ou importer depuis une URL:</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="url"
              placeholder="https://..."
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              disabled={disabled}
              className="pr-10"
            />
            <Link2 className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" onClick={handleUrlImport} disabled={disabled || !urlValue.trim()}>
            Importer depuis URL
          </Button>
        </div>
      </div>
    </div>
  );
}
