// Types pour le parser Amazon DWC/IADC

/** Row brute du CSV Amazon */
export interface RawCsvRow {
  transporterId: string
  type: string
  group: string
  shipmentReason: string
  total: number
}

/** CSV extrait avec métadonnées de période */
export interface ExtractedCsv {
  periodType: "daily" | "weekly"
  periodKey: string // "2025-12-09" ou "2025-50"
  year: number
  week: number
  date?: string // Seulement pour daily
  csvContent: string
  rows: RawCsvRow[]
}

/** Breakdown DWC (Delivery Misses par catégorie) */
export interface DwcBreakdown {
  contactMiss: number
  photoDefect: number
  noPhoto: number
  otpMiss: number
  other: number
}

/** Breakdown IADC (Non-Compliant par catégorie) */
export interface IadcBreakdown {
  mailbox: number
  unattended: number
  safePlace: number
  attended: number
  other: number
}

/** Stats agrégées pour un transporter sur une période */
export interface AggregatedDriverStats {
  transporterId: string
  periodType: "daily" | "weekly"
  periodKey: string
  year: number
  week: number
  date?: string

  // Volumes DWC (pas de %, on stocke les composants)
  dwcCompliant: number
  dwcMisses: number
  failedAttempts: number

  // Volumes IADC
  iadcCompliant: number
  iadcNonCompliant: number

  // Breakdowns optionnels
  dwcBreakdown?: DwcBreakdown
  iadcBreakdown?: IadcBreakdown
}

/** Résultat du parsing d'un fichier HTML */
export interface ParsedReport {
  filename: string
  stationCode: string
  reportWeek: string // "2025-49"
  year: number
  week: number

  dailyStats: AggregatedDriverStats[]
  weeklyStats: AggregatedDriverStats[]

  // IDs uniques trouvés
  transporterIds: string[]

  // Validation
  errors: string[]
  warnings: string[]
}

/** Résultat de l'extraction HTML */
export interface ExtractionResult {
  stationCode: string
  reportWeek: string
  year: number
  week: number
  csvs: ExtractedCsv[]
  errors: string[]
  warnings: string[]
}

/** Empty breakdowns pour initialisation */
export const emptyDwcBreakdown: DwcBreakdown = {
  contactMiss: 0,
  photoDefect: 0,
  noPhoto: 0,
  otpMiss: 0,
  other: 0,
}

export const emptyIadcBreakdown: IadcBreakdown = {
  mailbox: 0,
  unattended: 0,
  safePlace: 0,
  attended: 0,
  other: 0,
}
