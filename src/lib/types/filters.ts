// src/lib/types/filters.ts
// Types pour le système de filtrage unifié DSPilot

import type { Id } from "@convex/_generated/dataModel"

// ============================================================================
// TIME CONTEXT - Le cœur du système
// ============================================================================

/**
 * TimeContext représente une période temporelle de manière type-safe.
 * Un seul objet remplace les 3 variables précédentes (periodMode, selectedDate, dateRange)
 */
export type TimeContext =
  | DayTimeContext
  | WeekTimeContext
  | RangeTimeContext
  | RelativeTimeContext

export interface DayTimeContext {
  type: "day"
  date: Date
}

export interface WeekTimeContext {
  type: "week"
  year: number
  week: number
}

export interface RangeTimeContext {
  type: "range"
  from: Date
  to: Date
  granularity: "day" | "week"
}

export interface RelativeTimeContext {
  type: "relative"
  anchor: "now" | "selected"
  offset: number // négatif = passé, positif = futur
  unit: "days" | "weeks" | "months"
}

// ============================================================================
// QUERY PARAMS - Params normalisés pour Convex
// ============================================================================

/**
 * TimeQueryParams est la forme sérialisée envoyée aux queries Convex.
 * Convex ne peut pas recevoir de Date objects, donc on convertit en strings.
 */
export interface TimeQueryParams {
  mode: "day" | "week" | "range"
  // Mode day
  date?: string // Format: "YYYY-MM-DD"
  // Mode week
  year?: number
  week?: number
  // Mode range
  startDate?: string // Format: "YYYY-MM-DD"
  endDate?: string // Format: "YYYY-MM-DD"
  granularity?: "day" | "week"
}

// ============================================================================
// STATION
// ============================================================================

export interface Station {
  id: string
  name: string
  code: string
}

export type StationFilter = "all" | Id<"stations">

// ============================================================================
// FILTER SECTION CONTEXT
// ============================================================================

export interface FilterSectionContextValue {
  time: TimeContext
  setTime: (time: TimeContext) => void
  resetToGlobal: () => void
  isOverridden: boolean
  queryParams: TimeQueryParams
}

// ============================================================================
// LEGACY TYPES (pour compatibilité)
// ============================================================================

export type PeriodMode = "day" | "week" | "range"

export interface DateRange {
  from: Date
  to: Date
}

// ============================================================================
// STORE STATE
// ============================================================================

export interface FiltersState {
  // === Sidebar ===
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // === Global Context ===
  selectedStation: Station
  time: TimeContext

  // === Actions ===
  setSelectedStation: (station: Station) => void
  setTime: (time: TimeContext) => void

  // === Navigation ===
  navigateTime: (direction: "prev" | "next") => void
  goToToday: () => void

  // === Computed ===
  getQueryParams: () => TimeQueryParams
  getDisplayLabel: () => string

  // === Legacy Compatibility (computed from time) ===
  // Ces propriétés sont calculées depuis `time` pour la compatibilité
  selectedDate: Date
  periodMode: PeriodMode
  dateRange: DateRange | null
  setSelectedDate: (date: Date) => void
  setPeriodMode: (mode: PeriodMode) => void
  setDateRange: (range: DateRange | null) => void
  navigatePeriod: (direction: "prev" | "next") => void
  getEffectiveDateRange: () => DateRange
}

// ============================================================================
// SERIALIZATION (pour localStorage)
// ============================================================================

export interface SerializedTimeContext {
  type: TimeContext["type"]
  // DayTimeContext
  date?: string
  // WeekTimeContext
  year?: number
  week?: number
  // RangeTimeContext
  from?: string
  to?: string
  granularity?: "day" | "week"
  // RelativeTimeContext
  anchor?: "now" | "selected"
  offset?: number
  unit?: "days" | "weeks" | "months"
}

// ============================================================================
// COMPONENT PROPS HELPERS
// ============================================================================

/**
 * Props communes pour les composants qui consomment le filtre temporel
 */
export interface TimeFilteredComponentProps extends TimeQueryParams {
  stationId?: Id<"stations">
}

/**
 * Props pour les graphiques avec mode centered/trailing
 */
export interface ChartTimeProps {
  mode: "centered" | "trailing"
  weeksCount: 4 | 8 | 12
}

// ============================================================================
// PRESETS
// ============================================================================

export interface TimePreset {
  label: string
  shortLabel?: string
  value: TimeContext
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isDayContext(ctx: TimeContext): ctx is DayTimeContext {
  return ctx.type === "day"
}

export function isWeekContext(ctx: TimeContext): ctx is WeekTimeContext {
  return ctx.type === "week"
}

export function isRangeContext(ctx: TimeContext): ctx is RangeTimeContext {
  return ctx.type === "range"
}

export function isRelativeContext(ctx: TimeContext): ctx is RelativeTimeContext {
  return ctx.type === "relative"
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateTimeContext(ctx: unknown): ctx is TimeContext {
  if (!ctx || typeof ctx !== "object") return false
  const obj = ctx as Record<string, unknown>

  switch (obj.type) {
    case "day":
      return obj.date instanceof Date
    case "week":
      return typeof obj.year === "number" && typeof obj.week === "number"
    case "range":
      return (
        obj.from instanceof Date &&
        obj.to instanceof Date &&
        (obj.granularity === "day" || obj.granularity === "week")
      )
    case "relative":
      return (
        (obj.anchor === "now" || obj.anchor === "selected") &&
        typeof obj.offset === "number" &&
        (obj.unit === "days" || obj.unit === "weeks" || obj.unit === "months")
      )
    default:
      return false
  }
}
