"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { FileSpreadsheet, X, Check, Users, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { parseDriverNamesCsvFile, type DriverNameMapping } from "@/lib/parser/driver-names-csv"

interface CsvDropzoneProps {
  onMappingsChange: (mappings: DriverNameMapping[]) => void
  mappings: DriverNameMapping[]
  disabled?: boolean
}

type DropzoneState = "idle" | "drag-over" | "loading" | "success" | "error"

export function CsvDropzone({ onMappingsChange, mappings, disabled }: CsvDropzoneProps) {
  const [state, setState] = useState<DropzoneState>(mappings.length > 0 ? "success" : "idle")
  const [filename, setFilename] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [warnings, setWarnings] = useState<string[]>([])

  const processFile = async (file: File) => {
    setState("loading")
    setFilename(file.name)
    setErrorMessage("")
    setWarnings([])

    try {
      const result = await parseDriverNamesCsvFile(file)

      if (result.mappings.length === 0) {
        setState("error")
        setErrorMessage("Aucun mapping trouvé dans le fichier")
        onMappingsChange([])
        return
      }

      setWarnings(result.errors)
      onMappingsChange(result.mappings)
      setState("success")
    } catch (error) {
      setState("error")
      setErrorMessage(error instanceof Error ? error.message : "Erreur de lecture du fichier")
      onMappingsChange([])
    }
  }

  const validateFile = (file: File): boolean => {
    const validExtensions = [".csv"]
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

    if (!validExtensions.includes(extension)) {
      setState("error")
      setErrorMessage(`Format non supporté: ${file.name}. Seuls les fichiers .csv sont acceptés.`)
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      setState("error")
      setErrorMessage("Fichier trop volumineux (max 10 MB)")
      return false
    }

    return true
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState("drag-over")
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState("idle")
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const file = e.dataTransfer.files[0]
      if (file && validateFile(file)) {
        processFile(file)
      }
    },
    [onMappingsChange],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && validateFile(file)) {
        processFile(file)
      }
      // Reset input
      e.target.value = ""
    },
    [onMappingsChange],
  )

  const handleReset = () => {
    setState("idle")
    setFilename("")
    setErrorMessage("")
    setWarnings([])
    onMappingsChange([])
  }

  // Success state
  if (state === "success" && mappings.length > 0) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-emerald-400">Fichier chargé</p>
              <p className="text-sm text-muted-foreground">{filename}</p>
              <div className="flex items-center gap-2 mt-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {mappings.length} noms de livreurs détectés
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
    )
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
    )
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
    )
  }

  // Idle / drag-over state
  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed p-4 transition-all duration-200",
        state === "idle" && "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/5",
        state === "drag-over" && "border-blue-500 bg-blue-500/5",
        disabled && "opacity-50 pointer-events-none",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-muted">
          <FileSpreadsheet className={cn(
            "h-5 w-5",
            state === "drag-over" ? "text-blue-400" : "text-muted-foreground"
          )} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">
            {state === "drag-over" ? "Déposez le fichier" : "Fichier des noms (optionnel)"}
          </p>
          <p className="text-xs text-muted-foreground">
            CSV Amazon pour associer les noms aux codes livreurs
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
  )
}
