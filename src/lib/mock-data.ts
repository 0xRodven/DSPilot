// Mock data - DEPRECATED
// This file is kept for backwards compatibility.
// All types and utilities have been moved to:
// - @/lib/types.ts
// - @/lib/utils/tier.ts
// - @/lib/utils/status.ts

// Re-export types
export type {
  Driver,
  DriverDetail,
  DailyPerformance,
  ErrorType,
  ErrorBreakdown,
  ErrorCategory,
  ErrorSubcategory,
  ErrorLocation,
  ErrorCategoryData,
  DriverWithErrors,
  ErrorTrendData,
  WeeklyData,
  CoachingAction,
  CoachingActionFull,
  CoachingSuggestion,
  CoachingEffectiveness,
  ImportRecord,
  ParsedImportData,
  WeekCoverage,
} from "./types"

// Re-export tier utilities
export {
  getTier,
  getTierColor,
  getTierBgColor,
  getTierBorderColor,
  type Tier,
} from "./utils/tier"

// Re-export status utilities
export {
  getCoachingStatusColor,
  getCoachingStatusLabel,
  getActionTypeIcon,
  getActionTypeLabel,
  getActionTypeColor,
  getImportStatusColor,
  getImportStatusLabel,
  type CoachingStatus,
  type CoachingActionType,
  type ImportStatus,
} from "./utils/status"

// Empty data arrays - components should use Convex queries instead
export const mockDrivers: import("./types").Driver[] = []
export const mockErrors: import("./types").ErrorType[] = []
export const mockWeeklyData: import("./types").WeeklyData[] = []
export const mockCoachingActions: import("./types").CoachingActionFull[] = []
export const mockCoachingSuggestions: import("./types").CoachingSuggestion[] = []
export const mockImportHistory: import("./types").ImportRecord[] = []

// Empty helper functions - components should use Convex queries instead
export const getKPIs = () => ({
  avgDwc: "0.0",
  avgIadc: "0.0",
  dwcTrend: 0,
  iadcTrend: 0,
  totalDrivers: 0,
  activeDrivers: 0,
  alerts: 0,
  tierDistribution: { fantastic: 0, great: 0, fair: 0, poor: 0 },
  highPerformers: "0",
})

export const getDriverById = (_id: string): import("./types").DriverDetail | null => null

export const getTierStats = () => ({
  fantastic: { count: 0, percentage: "0", trend: 0 },
  great: { count: 0, percentage: "0", trend: 0 },
  fair: { count: 0, percentage: "0", trend: 0 },
  poor: { count: 0, percentage: "0", trend: 0 },
  total: 0,
  active: 0,
})

export const getErrorsData = (): import("./types").ErrorCategoryData[] => []

export const getTopDriversWithErrors = (): import("./types").DriverWithErrors[] => []

export const getErrorTrendData = (): import("./types").ErrorTrendData[] => []

export const getCoachingStats = () => ({
  pending: { count: 0, overdueCount: 0 },
  improved: { count: 0, avgImprovement: 0 },
  noEffect: { count: 0 },
  escalated: { count: 0 },
  total: 0,
  thisMonth: 0,
})

export const getCoachingEffectiveness = (period: "3M" | "6M" | "1Y"): import("./types").CoachingEffectiveness => ({
  period,
  successRate: 0,
  successCount: 0,
  totalEvaluated: 0,
  avgImprovement: 0,
  avgDaysToEffect: 0,
  byType: [],
})

export const getImportHistory = (_stationId: string): import("./types").ImportRecord[] => []

export const getWeekCoverage = (_stationId: string, _year: number): import("./types").WeekCoverage[] => []

export const getMockParsedData = (): import("./types").ParsedImportData => ({
  filename: "",
  stationCode: "",
  stationName: "",
  year: 0,
  week: 0,
  weekDates: "",
  driversCount: 0,
  dailyRecordsCount: 0,
  weeklyRecordsCount: 0,
  trendsData: 0,
  dwcScore: 0,
  iadcScore: 0,
  tierDistribution: { fantastic: 0, great: 0, fair: 0, poor: 0 },
  newDrivers: 0,
  existingWeek: false,
  drivers: [],
})
