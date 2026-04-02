// Types
export type Tier = "fantastic" | "great" | "fair" | "poor";

export interface DwcBreakdown {
  contactMiss: number;
  photoDefect: number;
  noPhoto: number;
  otpMiss: number;
  other: number;
}

export interface IadcBreakdown {
  mailbox: number;
  unattended: number;
  safePlace: number;
  other: number;
}

export interface TierDistribution {
  fantastic: number;
  great: number;
  fair: number;
  poor: number;
}

// ============================================
// CALCULS DWC / IADC
// ============================================

/**
 * Calcule le DWC% depuis les volumes
 * DWC = Compliant / (Compliant + Misses + FailedAttempts)
 */
export const calculateDwcPercent = (compliant: number, misses: number, failedAttempts: number): number => {
  const total = compliant + misses + failedAttempts;
  if (total === 0) return 0;
  return (compliant / total) * 100;
};

/**
 * Calcule le IADC% depuis les volumes
 * IADC = Compliant / (Compliant + NonCompliant)
 */
export const calculateIadcPercent = (compliant: number, nonCompliant: number): number => {
  const total = compliant + nonCompliant;
  if (total === 0) return 0;
  return (compliant / total) * 100;
};

/**
 * Calcule le dénominateur total DWC (nombre de livraisons)
 */
export const getDwcTotal = (compliant: number, misses: number, failedAttempts: number): number => {
  return compliant + misses + failedAttempts;
};

/**
 * Calcule le dénominateur total IADC
 */
export const getIadcTotal = (compliant: number, nonCompliant: number): number => {
  return compliant + nonCompliant;
};

// ============================================
// TIERS (DEPRECATED - Use DWC% ranges for display)
// ============================================

/**
 * Détermine le tier depuis le DWC%
 * - Fantastic: >= 95%
 * - Great: >= 90%
 * - Fair: >= 88%
 * - Poor: < 88%
 *
 * @deprecated For display, use getDwcTextClass/getDwcBadgeClass from @/lib/utils/performance-color
 * This function is kept for backward compatibility with backend tierDistribution field.
 */
export const getTier = (dwcPercent: number): Tier => {
  if (dwcPercent >= 95) return "fantastic";
  if (dwcPercent >= 90) return "great";
  if (dwcPercent >= 88) return "fair";
  return "poor";
};

/**
 * Seuils des tiers
 * @deprecated Use DWC% range thresholds (95, 90, 85, 80) instead for display
 */
export const TIER_THRESHOLDS = {
  fantastic: 95,
  great: 90,
  fair: 88,
  poor: 0,
} as const;

/**
 * Labels des tiers en français
 * @deprecated For display, show DWC% directly using getDwcBadgeClass from @/lib/utils/performance-color
 */
export const TIER_LABELS: Record<Tier, string> = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
};

// ============================================
// MOYENNES PONDÉRÉES
// ============================================

interface WeightedItem {
  numerator: number;
  denominator: number;
}

/**
 * Calcule une moyenne pondérée correcte
 * IMPORTANT: Ne jamais faire AVG des pourcentages!
 * Toujours: SUM(numérateurs) / SUM(dénominateurs)
 */
export const calculateWeightedAverage = (items: WeightedItem[]): number => {
  const totalNum = items.reduce((sum, item) => sum + item.numerator, 0);
  const totalDen = items.reduce((sum, item) => sum + item.denominator, 0);
  if (totalDen === 0) return 0;
  return (totalNum / totalDen) * 100;
};

/**
 * Calcule le DWC% moyen d'une liste de drivers (pondéré par volume)
 */
export const calculateFleetDwcPercent = (
  drivers: Array<{
    dwcCompliant: number;
    dwcMisses: number;
    failedAttempts: number;
  }>,
): number => {
  const items = drivers.map((d) => ({
    numerator: d.dwcCompliant,
    denominator: d.dwcCompliant + d.dwcMisses + d.failedAttempts,
  }));
  return calculateWeightedAverage(items);
};

/**
 * Calcule le IADC% moyen d'une liste de drivers (pondéré par volume)
 */
export const calculateFleetIadcPercent = (
  drivers: Array<{
    iadcCompliant: number;
    iadcNonCompliant: number;
  }>,
): number => {
  const items = drivers.map((d) => ({
    numerator: d.iadcCompliant,
    denominator: d.iadcCompliant + d.iadcNonCompliant,
  }));
  return calculateWeightedAverage(items);
};

// ============================================
// TRENDS
// ============================================

/**
 * Calcule le trend (delta) entre deux périodes
 */
export const calculateTrend = (current: number, previous: number): number => {
  return current - previous;
};

/**
 * Calcule le trend en pourcentage
 */
export const calculateTrendPercent = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// ============================================
// TIER DISTRIBUTION
// ============================================

/**
 * Calcule la distribution des tiers depuis une liste de DWC%
 */
export const calculateTierDistribution = (dwcPercents: number[]): TierDistribution => {
  const distribution: TierDistribution = {
    fantastic: 0,
    great: 0,
    fair: 0,
    poor: 0,
  };

  for (const dwc of dwcPercents) {
    const tier = getTier(dwc);
    distribution[tier]++;
  }

  return distribution;
};

/**
 * Calcule le % de high performers (Fantastic + Great)
 */
export const calculateHighPerformersPercent = (tierDistribution: TierDistribution): number => {
  const total = tierDistribution.fantastic + tierDistribution.great + tierDistribution.fair + tierDistribution.poor;

  if (total === 0) return 0;

  return ((tierDistribution.fantastic + tierDistribution.great) / total) * 100;
};

// ============================================
// BREAKDOWNS AGGREGATION
// ============================================

/**
 * Agrège plusieurs breakdowns DWC
 */
export const aggregateDwcBreakdowns = (breakdowns: DwcBreakdown[]): DwcBreakdown => {
  return breakdowns.reduce(
    (acc, b) => ({
      contactMiss: acc.contactMiss + b.contactMiss,
      photoDefect: acc.photoDefect + b.photoDefect,
      noPhoto: acc.noPhoto + b.noPhoto,
      otpMiss: acc.otpMiss + b.otpMiss,
      other: acc.other + b.other,
    }),
    { contactMiss: 0, photoDefect: 0, noPhoto: 0, otpMiss: 0, other: 0 },
  );
};

/**
 * Agrège plusieurs breakdowns IADC
 */
export const aggregateIadcBreakdowns = (breakdowns: IadcBreakdown[]): IadcBreakdown => {
  return breakdowns.reduce(
    (acc, b) => ({
      mailbox: acc.mailbox + b.mailbox,
      unattended: acc.unattended + b.unattended,
      safePlace: acc.safePlace + b.safePlace,
      other: acc.other + b.other,
    }),
    { mailbox: 0, unattended: 0, safePlace: 0, other: 0 },
  );
};

// ============================================
// EMPTY/DEFAULT VALUES
// ============================================

export const emptyDwcBreakdown: DwcBreakdown = {
  contactMiss: 0,
  photoDefect: 0,
  noPhoto: 0,
  otpMiss: 0,
  other: 0,
};

export const emptyIadcBreakdown: IadcBreakdown = {
  mailbox: 0,
  unattended: 0,
  safePlace: 0,
  other: 0,
};

export const emptyTierDistribution: TierDistribution = {
  fantastic: 0,
  great: 0,
  fair: 0,
  poor: 0,
};

// ============================================
// FORMATTING
// ============================================

/**
 * Formate un pourcentage avec une décimale
 */
export const formatPercent = (value: number): string => {
  return value.toFixed(1);
};

/**
 * Formate un nombre avec séparateur de milliers
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("fr-FR").format(value);
};

/**
 * Formate une semaine ISO (ex: "S50" ou "2025-W50")
 */
export const formatWeek = (_year: number, week: number): string => {
  return `S${week.toString().padStart(2, "0")}`;
};

export const formatWeekFull = (year: number, week: number): string => {
  return `${year}-W${week.toString().padStart(2, "0")}`;
};
