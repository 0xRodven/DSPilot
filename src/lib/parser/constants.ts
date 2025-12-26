// Constantes pour le parser Amazon DWC/IADC
// Vérifié sur fichier réel: FR PSUA DIF1 DWC/IADC Report 2025-49

// =============================================================================
// REGEX D'EXTRACTION
// =============================================================================

/** Extraction des CSV base64 depuis le HTML (download avant href) */
export const CSV_HREF_REGEX =
  /download="([^"]+)"\s+href="data:text\/csv;base64,([A-Za-z0-9+/=]+)"/g

/** Parsing du nom de fichier pour période daily */
export const DAILY_FILENAME_REGEX = /_Day:\s*(\d{4})-(\d{2})-(\d{2})\.csv$/

/** Parsing du nom de fichier pour période weekly */
export const WEEKLY_FILENAME_REGEX = /_Week:\s*(\d{4})-(\d{1,2})\.csv$/

/** Extraction du code station depuis le download attribute */
export const STATION_FROM_DOWNLOAD_REGEX = /^([A-Z0-9-]+)_DWC_IADC_/

/** Extraction semaine depuis le titre HTML */
export const TITLE_WEEK_REGEX = /Report\s+(\d{4})-(\d{1,2})/

// =============================================================================
// TYPES DWC (colonne "Type")
// =============================================================================

export const DWC_TYPES = {
  /** Livraisons conformes → dwcCompliant */
  COMPLIANT: "Compliant",

  /** Livraisons manquées avec risque DNR → dwcMisses */
  DELIVERY_MISSES: "Delivery Misses - DNR Risk",

  /** Tentatives échouées → failedAttempts */
  FAILED_ATTEMPTS: "Failed Attempts Misses",

  /** IADC uniquement (pas compté dans DWC) */
  IADC: "In-app Delivery Workflow (IADC)",
} as const

// =============================================================================
// BREAKDOWN DWC (colonne "Group" quand Type = DELIVERY_MISSES)
// =============================================================================

export const DWC_BREAKDOWN_GROUPS = {
  CONTACT_MISS: "Contact Miss",
  PHOTO_DEFECT: "Photo Defect",
  NO_PHOTO: "No Photo",
  OTP_MISS: "OTP Miss",
} as const

// =============================================================================
// IADC GROUPS (colonne "Group" quand Type = IADC)
// =============================================================================

/** Préfixe pour les livraisons IADC conformes */
export const IADC_COMPLIANT_PREFIX = "Compliant with"

/** Préfixe pour les livraisons IADC non-conformes */
export const IADC_NON_COMPLIANT_PREFIX = "Not Compliant with"

/** Catégories IADC pour breakdown */
export const IADC_BREAKDOWN_KEYWORDS = {
  MAILBOX: "Mailbox",
  UNATTENDED: "Unattended",
  SAFE_PLACE: "Safe Place",
  ATTENDED: "Attended",
} as const

// =============================================================================
// CSV COLUMNS (indices)
// =============================================================================

export const CSV_COLUMNS = {
  TRANSPORTER_ID: 0,
  TYPE: 1,
  GROUP: 2,
  SHIPMENT_REASON: 3,
  TOTAL: 4,
} as const
