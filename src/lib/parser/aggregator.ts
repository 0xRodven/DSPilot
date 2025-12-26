// Agrégation des stats par transporter

import {
  DWC_TYPES,
  DWC_BREAKDOWN_GROUPS,
  IADC_COMPLIANT_PREFIX,
  IADC_NON_COMPLIANT_PREFIX,
  IADC_BREAKDOWN_KEYWORDS,
} from "./constants"
import type {
  RawCsvRow,
  ExtractedCsv,
  AggregatedDriverStats,
  DwcBreakdown,
  IadcBreakdown,
  emptyDwcBreakdown,
  emptyIadcBreakdown,
} from "./types"

/**
 * Agrège les stats par transporter pour un CSV
 * @param csv CSV avec ses rows parsées
 * @returns Stats agrégées par transporter
 */
export function aggregateStats(csv: ExtractedCsv): AggregatedDriverStats[] {
  // Grouper par transporter ID
  const byTransporter = new Map<string, RawCsvRow[]>()

  for (const row of csv.rows) {
    const existing = byTransporter.get(row.transporterId) || []
    existing.push(row)
    byTransporter.set(row.transporterId, existing)
  }

  // Agréger chaque transporter
  const results: AggregatedDriverStats[] = []

  for (const [transporterId, rows] of byTransporter) {
    results.push(aggregateTransporter(transporterId, rows, csv))
  }

  return results
}

/**
 * Agrège les stats pour un transporter
 */
function aggregateTransporter(
  transporterId: string,
  rows: RawCsvRow[],
  csv: ExtractedCsv
): AggregatedDriverStats {
  // Initialiser les volumes DWC
  let dwcCompliant = 0
  let dwcMisses = 0
  let failedAttempts = 0

  // Initialiser les volumes IADC
  let iadcCompliant = 0
  let iadcNonCompliant = 0

  // Initialiser les breakdowns
  const dwcBreakdown: DwcBreakdown = {
    contactMiss: 0,
    photoDefect: 0,
    noPhoto: 0,
    otpMiss: 0,
    other: 0,
  }

  const iadcBreakdown: IadcBreakdown = {
    mailbox: 0,
    unattended: 0,
    safePlace: 0,
    attended: 0,
    other: 0,
  }

  for (const row of rows) {
    const { type, group, total } = row

    // DWC: agrégation par Type
    if (type === DWC_TYPES.COMPLIANT) {
      dwcCompliant += total
    } else if (type === DWC_TYPES.DELIVERY_MISSES) {
      dwcMisses += total

      // Breakdown par Group
      if (group === DWC_BREAKDOWN_GROUPS.CONTACT_MISS) {
        dwcBreakdown.contactMiss += total
      } else if (group === DWC_BREAKDOWN_GROUPS.PHOTO_DEFECT) {
        dwcBreakdown.photoDefect += total
      } else if (group === DWC_BREAKDOWN_GROUPS.NO_PHOTO) {
        dwcBreakdown.noPhoto += total
      } else if (group === DWC_BREAKDOWN_GROUPS.OTP_MISS) {
        dwcBreakdown.otpMiss += total
      } else {
        dwcBreakdown.other += total
      }
    } else if (type === DWC_TYPES.FAILED_ATTEMPTS) {
      failedAttempts += total
    } else if (type === DWC_TYPES.IADC) {
      // IADC: agrégation par préfixe du Group
      if (group.startsWith(IADC_COMPLIANT_PREFIX)) {
        iadcCompliant += total
      } else if (group.startsWith(IADC_NON_COMPLIANT_PREFIX)) {
        iadcNonCompliant += total

        // Breakdown IADC par catégorie
        if (group.includes(IADC_BREAKDOWN_KEYWORDS.MAILBOX)) {
          iadcBreakdown.mailbox += total
        } else if (group.includes(IADC_BREAKDOWN_KEYWORDS.UNATTENDED)) {
          iadcBreakdown.unattended += total
        } else if (group.includes(IADC_BREAKDOWN_KEYWORDS.SAFE_PLACE)) {
          iadcBreakdown.safePlace += total
        } else if (group.includes(IADC_BREAKDOWN_KEYWORDS.ATTENDED)) {
          iadcBreakdown.attended += total
        } else {
          iadcBreakdown.other += total
        }
      }
    }
  }

  return {
    transporterId,
    periodType: csv.periodType,
    periodKey: csv.periodKey,
    year: csv.year,
    week: csv.week,
    date: csv.date,
    dwcCompliant,
    dwcMisses,
    failedAttempts,
    iadcCompliant,
    iadcNonCompliant,
    dwcBreakdown,
    iadcBreakdown,
  }
}
