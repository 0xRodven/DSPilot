// Parser Amazon DWC/IADC - Orchestrateur principal

import { extractCsvsFromHtml } from "./html-extractor"
import { parseCsvRows } from "./csv-parser"
import { aggregateStats } from "./aggregator"
import type { ParsedReport, AggregatedDriverStats } from "./types"

/**
 * Parse un fichier HTML Amazon DWC/IADC
 * @param file Fichier HTML uploadé
 * @returns Report parsé avec stats daily et weekly
 */
export async function parseHtmlFile(file: File): Promise<ParsedReport> {
  const startTime = performance.now()
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Lire le contenu HTML
  const htmlContent = await file.text()

  // 2. Extraire les CSVs base64
  const extraction = extractCsvsFromHtml(htmlContent)

  if (extraction.csvs.length === 0) {
    throw new Error("Aucun CSV trouvé dans le fichier HTML. Vérifiez que c'est un report Amazon DWC/IADC valide.")
  }

  errors.push(...extraction.errors)
  warnings.push(...extraction.warnings)

  // 3. Parser chaque CSV
  for (const csv of extraction.csvs) {
    const parseResult = parseCsvRows(csv)
    csv.rows = parseResult.rows
    errors.push(...parseResult.errors)
    warnings.push(...parseResult.warnings)
  }

  // 4. Agréger les stats par transporter
  const dailyStats: AggregatedDriverStats[] = []
  const weeklyStats: AggregatedDriverStats[] = []
  const transporterIds = new Set<string>()

  for (const csv of extraction.csvs) {
    const aggregated = aggregateStats(csv)

    for (const stat of aggregated) {
      transporterIds.add(stat.transporterId)

      if (csv.periodType === "daily") {
        dailyStats.push(stat)
      } else {
        weeklyStats.push(stat)
      }
    }
  }

  const endTime = performance.now()
  const parseTimeMs = Math.round(endTime - startTime)

  // Log performance
  console.log(`[Parser] Parsed ${file.name} in ${parseTimeMs}ms`)
  console.log(`[Parser] - ${extraction.csvs.length} CSVs (${extraction.csvs.filter(c => c.periodType === "daily").length} daily, ${extraction.csvs.filter(c => c.periodType === "weekly").length} weekly)`)
  console.log(`[Parser] - ${transporterIds.size} transporters`)
  console.log(`[Parser] - ${dailyStats.length} daily stats, ${weeklyStats.length} weekly stats`)

  return {
    filename: file.name,
    stationCode: extraction.stationCode || "UNKNOWN",
    reportWeek: extraction.reportWeek || "UNKNOWN",
    year: extraction.year || new Date().getFullYear(),
    week: extraction.week || 1,
    dailyStats,
    weeklyStats,
    transporterIds: Array.from(transporterIds),
    errors,
    warnings,
  }
}

/**
 * Calcule le DWC% pour un driver
 */
export function calculateDwcPercent(stat: AggregatedDriverStats): number {
  const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts
  if (total === 0) return 0
  return (stat.dwcCompliant / total) * 100
}

/**
 * Calcule le IADC% pour un driver
 */
export function calculateIadcPercent(stat: AggregatedDriverStats): number {
  const total = stat.iadcCompliant + stat.iadcNonCompliant
  if (total === 0) return 0
  return (stat.iadcCompliant / total) * 100
}

/**
 * Calcule les moyennes fleet (pondérées)
 */
export function calculateFleetAverages(stats: AggregatedDriverStats[]): {
  dwcPercent: number
  iadcPercent: number
  totalDeliveries: number
  driverCount: number
} {
  let dwcCompliantSum = 0
  let dwcTotalSum = 0
  let iadcCompliantSum = 0
  let iadcTotalSum = 0

  for (const stat of stats) {
    dwcCompliantSum += stat.dwcCompliant
    dwcTotalSum += stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts
    iadcCompliantSum += stat.iadcCompliant
    iadcTotalSum += stat.iadcCompliant + stat.iadcNonCompliant
  }

  return {
    dwcPercent: dwcTotalSum > 0 ? (dwcCompliantSum / dwcTotalSum) * 100 : 0,
    iadcPercent: iadcTotalSum > 0 ? (iadcCompliantSum / iadcTotalSum) * 100 : 0,
    totalDeliveries: dwcTotalSum,
    driverCount: stats.length,
  }
}

// Re-export types
export type { ParsedReport, AggregatedDriverStats, RawCsvRow, DwcBreakdown, IadcBreakdown } from "./types"
