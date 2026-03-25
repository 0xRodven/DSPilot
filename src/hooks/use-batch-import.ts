"use client"

import { useState, useCallback, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { parseHtmlFile, calculateFleetAverages } from "@/lib/parser"
import { getTier } from "@/lib/utils/tier"
import type { ParsedReport } from "@/lib/parser/types"
import type {
  ImportQueueItem,
  BatchImportState,
  BatchImportPhase,
  BatchImportSummary,
  BatchValidationResult,
  UseBatchImportOptions,
  SingleImportResult,
} from "@/lib/types/import"

const BATCH_SIZE = 50

const initialState: BatchImportState = {
  items: [],
  currentIndex: -1,
  phase: "idle",
  totalProgress: 0,
  validationWarnings: [],
  stationCode: undefined,
}

export function useBatchImport(options: UseBatchImportOptions) {
  const { stationId, userId, onProgress, onComplete, onError } = options

  const [state, setState] = useState<BatchImportState>(initialState)
  const cancelledRef = useRef(false)
  const startTimeRef = useRef<number>(0)
  // Ref to always have latest items for async operations
  const itemsRef = useRef<ImportQueueItem[]>([])

  // Convex mutations
  const bulkUpsertDrivers = useMutation(api.drivers.bulkUpsertDrivers)
  const bulkUpsertDailyStats = useMutation(api.stats.bulkUpsertDailyStats)
  const bulkUpsertWeeklyStats = useMutation(api.stats.bulkUpsertWeeklyStats)
  const updateStationWeeklyStats = useMutation(api.stats.updateStationWeeklyStats)
  const createImport = useMutation(api.imports.createImport)
  const startProcessing = useMutation(api.imports.startProcessing)
  const completeImport = useMutation(api.imports.completeImport)

  // Update state helper
  const updateState = useCallback((updates: Partial<BatchImportState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates }
      onProgress?.(newState)
      return newState
    })
  }, [onProgress])

  // Update single item in queue
  const updateItem = useCallback((id: string, updates: Partial<ImportQueueItem>) => {
    setState(prev => {
      const items = prev.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
      // Keep ref in sync
      itemsRef.current = items
      const newState = { ...prev, items }
      onProgress?.(newState)
      return newState
    })
  }, [onProgress])

  /**
   * Ajouter des fichiers à la queue
   */
  const addFiles = useCallback((files: File[]) => {
    const newItems: ImportQueueItem[] = files.map((file, index) => ({
      id: `import-${Date.now()}-${index}`,
      file,
      status: "pending",
      progress: 0,
    }))

    setState(prev => {
      const updatedItems = [...prev.items, ...newItems]
      itemsRef.current = updatedItems
      return {
        ...prev,
        items: updatedItems,
        phase: "collecting",
      }
    })
  }, [])

  /**
   * Retirer un fichier de la queue
   */
  const removeFile = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }))
  }, [])

  /**
   * Parser tous les fichiers (parallèle)
   */
  const startParsing = useCallback(async () => {
    cancelledRef.current = false
    updateState({ phase: "parsing", totalProgress: 0 })

    // Use ref to get latest items (avoids stale closure)
    const items = itemsRef.current.filter(item => item.status === "pending")
    const total = items.length

    if (total === 0) {
      console.warn("[BatchImport] No pending items to parse")
      return
    }

    // Parse all files in parallel
    const results = await Promise.all(
      items.map(async (item, index) => {
        if (cancelledRef.current) return item

        updateItem(item.id, { status: "parsing", progress: 0 })

        try {
          const report = await parseHtmlFile(item.file)
          updateItem(item.id, {
            status: "parsed",
            parsedReport: report,
            progress: 100,
          })

          // Update total progress
          const percent = Math.round(((index + 1) / total) * 100)
          updateState({ totalProgress: percent })

          return { ...item, status: "parsed" as const, parsedReport: report }
        } catch (err) {
          const error = err instanceof Error ? err.message : "Erreur de parsing"
          updateItem(item.id, { status: "failed", error, progress: 0 })
          return { ...item, status: "failed" as const, error }
        }
      })
    )

    if (cancelledRef.current) return

    // Validation phase
    updateState({ phase: "validating" })
    const validation = validateBatch(results)

    // Update items with validation results
    setState(prev => {
      const updatedItems = prev.items.map(item => {
        const result = results.find(r => r.id === item.id)
        if (!result || result.status === "failed") return item

        // Check if this item was marked as skipped
        if (validation.valid.find(v => v.id === item.id)) {
          return { ...item, status: "ready" as const, parsedReport: result.parsedReport }
        }
        return { ...item, status: "skipped" as const }
      })

      // Update ref too
      itemsRef.current = updatedItems

      return {
        ...prev,
        items: updatedItems,
        phase: "ready",
        validationWarnings: validation.warnings,
        stationCode: validation.stationCode || undefined,
        totalProgress: 100,
      }
    })
  }, [updateState, updateItem])

  /**
   * Valider le batch (station cohérente, pas de doublons)
   */
  function validateBatch(items: ImportQueueItem[]): BatchValidationResult {
    const warnings: string[] = []
    const weekMap = new Map<string, ImportQueueItem>()
    let stationCode: string | null = null
    const duplicateWeeks: string[] = []

    const parsedItems = items.filter(
      item => item.status === "parsed" && item.parsedReport
    )

    for (const item of parsedItems) {
      const report = item.parsedReport!

      // Check station consistency
      if (!stationCode) {
        stationCode = report.stationCode
      } else if (report.stationCode !== stationCode) {
        warnings.push(
          `${item.file.name}: Station différente (${report.stationCode} vs ${stationCode})`
        )
        item.status = "skipped"
        continue
      }

      // Check for duplicate weeks
      const weekKey = `${report.year}-${report.week}`
      if (weekMap.has(weekKey)) {
        const existing = weekMap.get(weekKey)!
        warnings.push(
          `Semaine ${weekKey} en double: ${item.file.name} et ${existing.file.name}. Le premier sera utilisé.`
        )
        duplicateWeeks.push(weekKey)
        item.status = "skipped"
        continue
      }

      weekMap.set(weekKey, item)
      item.status = "ready"
    }

    return {
      valid: parsedItems.filter(item => item.status === "ready"),
      warnings,
      stationCode,
      duplicateWeeks,
    }
  }

  /**
   * Uploader un seul report vers Convex
   */
  async function uploadSingleReport(
    report: ParsedReport,
    onFileProgress: (percent: number, message: string) => void
  ): Promise<SingleImportResult> {
    onFileProgress(5, "Création de l'import...")

    // 1. Create import record
    const importId = await createImport({
      stationId,
      filename: report.filename,
      year: report.year,
      week: report.week,
      importedBy: userId,
    })

    await startProcessing({ importId })

    // 2. Upsert drivers
    onFileProgress(15, "Import des drivers...")
    const weekKey = `${report.year}-${report.week}`
    const driverMap = await bulkUpsertDrivers({
      stationId,
      amazonIds: report.transporterIds,
      weekKey,
    })

    // 3. Upsert daily stats
    onFileProgress(25, "Stats daily...")
    const dailyStatsWithIds = report.dailyStats.map(stat => ({
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
    }))

    for (let i = 0; i < dailyStatsWithIds.length; i += BATCH_SIZE) {
      if (cancelledRef.current) throw new Error("Annulé")
      const batch = dailyStatsWithIds.slice(i, i + BATCH_SIZE)
      await bulkUpsertDailyStats({ stats: batch })
      const percent = 25 + Math.round((i / dailyStatsWithIds.length) * 25)
      onFileProgress(percent, `Stats daily: ${Math.min(i + BATCH_SIZE, dailyStatsWithIds.length)}/${dailyStatsWithIds.length}`)
    }

    // 4. Calculate days worked
    const daysWorkedByDriver = new Map<string, Set<string>>()
    for (const stat of report.dailyStats) {
      const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts
      if (total > 0 && stat.date) {
        const dates = daysWorkedByDriver.get(stat.transporterId) || new Set<string>()
        dates.add(stat.date)
        daysWorkedByDriver.set(stat.transporterId, dates)
      }
    }
    const daysWorkedCount = new Map<string, number>()
    for (const [transporterId, dates] of daysWorkedByDriver) {
      daysWorkedCount.set(transporterId, dates.size)
    }

    // 5. Upsert weekly stats
    onFileProgress(55, "Stats weekly...")
    const weeklyStatsWithIds = report.weeklyStats.map(stat => ({
      driverId: driverMap[stat.transporterId],
      stationId,
      year: stat.year,
      week: stat.week,
      dwcCompliant: stat.dwcCompliant,
      dwcMisses: stat.dwcMisses,
      failedAttempts: stat.failedAttempts,
      iadcCompliant: stat.iadcCompliant,
      iadcNonCompliant: stat.iadcNonCompliant,
      daysWorked: daysWorkedCount.get(stat.transporterId) || 0,
      dwcBreakdown: stat.dwcBreakdown,
      iadcBreakdown: stat.iadcBreakdown
        ? {
            mailbox: stat.iadcBreakdown.mailbox,
            unattended: stat.iadcBreakdown.unattended,
            safePlace: stat.iadcBreakdown.safePlace,
            other: stat.iadcBreakdown.other,
          }
        : undefined,
    }))

    for (let i = 0; i < weeklyStatsWithIds.length; i += BATCH_SIZE) {
      if (cancelledRef.current) throw new Error("Annulé")
      const batch = weeklyStatsWithIds.slice(i, i + BATCH_SIZE)
      await bulkUpsertWeeklyStats({ stats: batch })
      const percent = 55 + Math.round((i / weeklyStatsWithIds.length) * 25)
      onFileProgress(percent, `Stats weekly: ${Math.min(i + BATCH_SIZE, weeklyStatsWithIds.length)}/${weeklyStatsWithIds.length}`)
    }

    // 6. Update station stats
    onFileProgress(85, "Stats station...")
    await updateStationWeeklyStats({
      stationId,
      year: report.year,
      week: report.week,
    })

    // 7. Calculate final scores
    const fleetAverages = calculateFleetAverages(report.weeklyStats)
    const tierDistribution = { fantastic: 0, great: 0, fair: 0, poor: 0 }
    for (const stat of report.weeklyStats) {
      const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts
      if (total > 0) {
        const dwcPercent = (stat.dwcCompliant / total) * 100
        tierDistribution[getTier(dwcPercent)]++
      }
    }

    // 8. Complete import
    await completeImport({
      importId,
      driversImported: report.transporterIds.length,
      dailyRecordsCount: dailyStatsWithIds.length,
      weeklyRecordsCount: weeklyStatsWithIds.length,
      newDriversCount: 0,
      dwcScore: fleetAverages.dwcPercent,
      iadcScore: fleetAverages.iadcPercent,
      tierDistribution,
      warnings: report.warnings.length > 0 ? report.warnings : undefined,
    })

    onFileProgress(100, "Terminé")

    return {
      importId,
      driversImported: report.transporterIds.length,
      dailyRecordsCount: dailyStatsWithIds.length,
      weeklyRecordsCount: weeklyStatsWithIds.length,
      year: report.year,
      week: report.week,
    }
  }

  /**
   * Lancer l'import séquentiel de tous les fichiers prêts
   */
  const startImport = useCallback(async () => {
    cancelledRef.current = false
    startTimeRef.current = Date.now()
    updateState({ phase: "processing", currentIndex: 0, totalProgress: 0 })

    // Use ref to get latest items
    const readyItems = itemsRef.current.filter(item => item.status === "ready")
    const total = readyItems.length

    if (total === 0) {
      console.warn("[BatchImport] No ready items to import")
      return
    }

    for (let i = 0; i < readyItems.length; i++) {
      if (cancelledRef.current) break

      const item = readyItems[i]
      updateState({ currentIndex: i })
      updateItem(item.id, { status: "uploading", progress: 0 })

      try {
        const result = await uploadSingleReport(
          item.parsedReport!,
          (percent, message) => {
            updateItem(item.id, { progress: percent })
            // Update total progress
            const totalPercent = Math.round(((i + percent / 100) / total) * 100)
            updateState({ totalProgress: totalPercent })
          }
        )

        updateItem(item.id, { status: "success", result, progress: 100 })
      } catch (err) {
        const error = err instanceof Error ? err.message : "Erreur d'upload"
        updateItem(item.id, { status: "failed", error, progress: 0 })
        // Continue with next file
      }
    }

    // Build summary using ref for latest items
    const summary = buildSummary(itemsRef.current, startTimeRef.current)
    updateState({ phase: "complete", totalProgress: 100 })
    onComplete?.(summary)
  }, [updateState, updateItem, onComplete])

  /**
   * Construire le résumé final
   */
  function buildSummary(items: ImportQueueItem[], startTime: number): BatchImportSummary {
    const successful = items.filter(i => i.status === "success")
    const failed = items.filter(i => i.status === "failed")
    const skipped = items.filter(i => i.status === "skipped")

    return {
      total: items.length,
      successful: successful.length,
      failed: failed.length,
      skipped: skipped.length,
      totalDrivers: successful.reduce((sum, i) => sum + (i.result?.driversImported || 0), 0),
      totalDailyRecords: successful.reduce((sum, i) => sum + (i.result?.dailyRecordsCount || 0), 0),
      totalWeeklyRecords: successful.reduce((sum, i) => sum + (i.result?.weeklyRecordsCount || 0), 0),
      weeksImported: successful
        .map(i => i.result ? { year: i.result.year, week: i.result.week } : null)
        .filter((w): w is { year: number; week: number } => w !== null)
        .sort((a, b) => a.year - b.year || a.week - b.week),
      failedFiles: failed.map(i => ({
        filename: i.file.name,
        error: i.error || "Erreur inconnue",
      })),
      durationMs: Date.now() - startTime,
    }
  }

  /**
   * Annuler l'import en cours
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true
    updateState({ phase: "idle" })
  }, [updateState])

  /**
   * Reset complet
   */
  const reset = useCallback(() => {
    cancelledRef.current = true
    itemsRef.current = []
    setState(initialState)
  }, [])

  // Computed values
  const readyCount = state.items.filter(i => i.status === "ready").length
  const canStart = state.phase === "ready" && readyCount > 0
  const isProcessing = state.phase === "parsing" || state.phase === "processing"

  return {
    state,
    addFiles,
    removeFile,
    startParsing,
    startImport,
    cancel,
    reset,
    canStart,
    isProcessing,
    readyCount,
  }
}
