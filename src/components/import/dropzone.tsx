"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileText, X, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DropzoneProps {
  onFileSelect: (file: File) => void
  onUrlImport: (url: string) => void
  disabled?: boolean
}

type DropzoneState = "idle" | "drag-over" | "invalid"

export function Dropzone({ onFileSelect, onUrlImport, disabled }: DropzoneProps) {
  const [state, setState] = useState<DropzoneState>("idle")
  const [invalidFile, setInvalidFile] = useState<string | null>(null)
  const [urlValue, setUrlValue] = useState("")

  const validateFile = (file: File): boolean => {
    const validExtensions = [".html", ".htm"]
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
    const isValidExtension = validExtensions.includes(extension)
    const isValidSize = file.size <= 10 * 1024 * 1024 // 10 MB

    if (!isValidExtension) {
      setState("invalid")
      setInvalidFile(file.name)
      return false
    }

    if (!isValidSize) {
      setState("invalid")
      setInvalidFile(`${file.name} (trop volumineux)`)
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
        setState("idle")
        onFileSelect(file)
      }
    },
    [onFileSelect],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && validateFile(file)) {
        onFileSelect(file)
      }
    },
    [onFileSelect],
  )

  const handleUrlImport = () => {
    if (urlValue.trim()) {
      onUrlImport(urlValue.trim())
      setUrlValue("")
    }
  }

  const resetState = () => {
    setState("idle")
    setInvalidFile(null)
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 transition-all duration-200 min-h-[300px] flex flex-col items-center justify-center",
          state === "idle" && "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/5",
          state === "drag-over" && "border-blue-500 bg-blue-500/5 animate-pulse",
          state === "invalid" && "border-red-500 bg-red-500/5",
          disabled && "opacity-50 pointer-events-none",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {state === "invalid" ? (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-lg font-medium text-red-400 mb-2">Format non supporté</p>
            <p className="text-sm text-muted-foreground mb-2">Seuls les fichiers .html sont acceptés</p>
            <p className="text-sm text-muted-foreground mb-4">Fichier reçu: {invalidFile}</p>
            <Button variant="outline" size="sm" onClick={resetState}>
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              {state === "drag-over" ? (
                <FileText className="h-6 w-6 text-blue-400" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-lg font-medium mb-2">
              {state === "drag-over" ? "Déposez le fichier ici" : "Glissez votre fichier HTML ici"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">ou</p>
            <label>
              <input
                type="file"
                accept=".html,.htm"
                className="hidden"
                onChange={handleFileInput}
                disabled={disabled}
              />
              <Button variant="outline" asChild>
                <span className="cursor-pointer">Parcourir les fichiers</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-4">.html uniquement • Max 10 MB</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Ou importer depuis une URL:</p>
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
            <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" onClick={handleUrlImport} disabled={disabled || !urlValue.trim()}>
            Importer depuis URL
          </Button>
        </div>
      </div>
    </div>
  )
}
