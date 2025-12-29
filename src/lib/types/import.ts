// Types pour l'import batch de fichiers HTML

import type { ParsedReport } from "@/lib/parser/types"
import type { Id } from "../../../convex/_generated/dataModel"

/** Statut d'un item dans la queue d'import */
export type ImportQueueStatus =
  | "pending"      // En attente de traitement
  | "parsing"      // Parsing du HTML en cours
  | "parsed"       // Parsing terminé avec succès
  | "validating"   // Validation en cours
  | "ready"        // Prêt à être uploadé
  | "uploading"    // Upload vers Convex en cours
  | "success"      // Terminé avec succès
  | "failed"       // Échec
  | "skipped"      // Ignoré (doublon, station différente)

/** Item individuel dans la queue d'import */
export interface ImportQueueItem {
  id: string                          // ID unique pour tracking
  file: File                          // Fichier original
  status: ImportQueueStatus           // Statut actuel
  parsedReport?: ParsedReport         // Résultat du parsing
  error?: string                      // Message d'erreur si échec
  progress: number                    // 0-100 pour le fichier en cours
  result?: SingleImportResult         // Résultat après upload réussi
}

/** Résultat d'un import individuel réussi */
export interface SingleImportResult {
  importId: Id<"imports">
  driversImported: number
  dailyRecordsCount: number
  weeklyRecordsCount: number
  year: number
  week: number
}

/** Phase globale du batch import */
export type BatchImportPhase =
  | "idle"         // Rien en cours
  | "collecting"   // Fichiers déposés, construction de la queue
  | "parsing"      // Parsing de tous les fichiers
  | "validating"   // Pré-validation
  | "ready"        // Prêt pour confirmation utilisateur
  | "processing"   // Upload séquentiel en cours
  | "complete"     // Tout terminé
  | "error"        // Erreur fatale

/** État global du batch import */
export interface BatchImportState {
  items: ImportQueueItem[]
  currentIndex: number                // Index du fichier en cours de traitement
  phase: BatchImportPhase
  totalProgress: number               // 0-100 progression globale
  validationWarnings: string[]        // Warnings de la phase validation
  stationCode?: string                // Station détectée (doit être cohérente)
}

/** Résumé final du batch import */
export interface BatchImportSummary {
  total: number                       // Nombre total de fichiers
  successful: number                  // Fichiers importés avec succès
  failed: number                      // Fichiers en échec
  skipped: number                     // Fichiers ignorés
  totalDrivers: number                // Total drivers importés
  totalDailyRecords: number           // Total records daily
  totalWeeklyRecords: number          // Total records weekly
  weeksImported: Array<{              // Semaines importées
    year: number
    week: number
  }>
  failedFiles: Array<{                // Détail des échecs
    filename: string
    error: string
  }>
  durationMs: number                  // Durée totale en ms
}

/** Options pour le hook useBatchImport */
export interface UseBatchImportOptions {
  stationId: Id<"stations">
  userId: string
  onProgress?: (state: BatchImportState) => void
  onComplete?: (summary: BatchImportSummary) => void
  onError?: (error: Error) => void
}

/** Résultat de la validation d'un batch */
export interface BatchValidationResult {
  valid: ImportQueueItem[]
  warnings: string[]
  stationCode: string | null
  duplicateWeeks: string[]
}
