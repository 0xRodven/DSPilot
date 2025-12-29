"use client"

// src/lib/filters/hooks.ts
// Hooks React pour le système de filtrage URL-first

import { useQueryStates, useQueryState, parseAsString } from "nuqs"
import { useCallback, useMemo } from "react"
import { getISOWeek, getISOWeekYear } from "date-fns"
import {
  filterParsers,
  parseWeekString,
  serializeWeek,
  parseRangeString,
  serializeRange,
  type FilterValues,
  type PeriodMode,
  type WeekValue,
  type RangeValue,
  type TierFilter,
} from "./parsers"
import {
  normalizeTimeFilter,
  formatTimeDisplay,
  navigateTime,
  getTodayValues,
  isCurrentPeriod,
} from "./normalization"
import type { NormalizedTimeFilter, NavigationDirection } from "./types"

// ============================================================================
// MAIN HOOK: useFilters
// ============================================================================

/**
 * Hook principal pour accéder aux filtres URL
 * Remplace l'ancien useTimeParams() + useDashboardStore()
 */
export function useFilters() {
  const [rawFilters, setRawFilters] = useQueryStates(filterParsers, {
    shallow: false,
  })

  // Parse raw string values to typed values
  const period = rawFilters.period as PeriodMode
  // Fallback to CURRENT week (not week 1!) if parsing fails
  const parsedWeek = parseWeekString(rawFilters.week)
  const week = parsedWeek ?? {
    year: getISOWeekYear(new Date()),
    week: getISOWeek(new Date()),
  }
  const date = rawFilters.date
  const range = rawFilters.range ? parseRangeString(rawFilters.range) : null
  const station = rawFilters.station
  const tier = rawFilters.tier as TierFilter
  const errorType = rawFilters.errorType
  const search = rawFilters.search

  // Temps normalisé pour l'API
  const normalizedTime = useMemo<NormalizedTimeFilter>(() => {
    return normalizeTimeFilter(period, week, date, range)
  }, [period, week, date, range])

  // Label d'affichage
  const displayLabel = useMemo(() => {
    return formatTimeDisplay(period, week, date, range)
  }, [period, week, date, range])

  // Navigation ← →
  const navigate = useCallback(
    (direction: NavigationDirection) => {
      const updates = navigateTime(direction, period, week, date, range)
      // Convert typed values back to strings for setRawFilters
      const rawUpdates: Record<string, string | null> = {}
      if (updates.period !== undefined) rawUpdates.period = updates.period
      if (updates.week !== undefined) rawUpdates.week = serializeWeek(updates.week)
      if (updates.date !== undefined) rawUpdates.date = updates.date
      if (updates.range !== undefined) rawUpdates.range = updates.range ? serializeRange(updates.range) : null
      setRawFilters(rawUpdates)
    },
    [period, week, date, range, setRawFilters]
  )

  // Retour à aujourd'hui
  const goToToday = useCallback(() => {
    const updates = getTodayValues(period)
    const rawUpdates: Record<string, string | null> = {}
    if (updates.period !== undefined) rawUpdates.period = updates.period
    if (updates.week !== undefined) rawUpdates.week = serializeWeek(updates.week)
    if (updates.date !== undefined) rawUpdates.date = updates.date
    setRawFilters(rawUpdates)
  }, [period, setRawFilters])

  // Est-ce la période courante?
  const isCurrent = useMemo(() => {
    return isCurrentPeriod(period, week, date)
  }, [period, week, date])

  // Peut naviguer? (tous les modes peuvent naviguer)
  const canNavigate = true

  // Helper to set filters with proper serialization
  const setFilters = useCallback(
    (updates: Partial<{
      period: PeriodMode
      week: WeekValue
      date: string
      range: RangeValue | null
      station: string
      tier: TierFilter
      errorType: string
      search: string
    }>) => {
      const rawUpdates: Record<string, string | null> = {}
      if (updates.period !== undefined) rawUpdates.period = updates.period
      if (updates.week !== undefined) rawUpdates.week = serializeWeek(updates.week)
      if (updates.date !== undefined) rawUpdates.date = updates.date
      if (updates.range !== undefined) rawUpdates.range = updates.range ? serializeRange(updates.range) : null
      if (updates.station !== undefined) rawUpdates.station = updates.station
      if (updates.tier !== undefined) rawUpdates.tier = updates.tier
      if (updates.errorType !== undefined) rawUpdates.errorType = updates.errorType
      if (updates.search !== undefined) rawUpdates.search = updates.search
      setRawFilters(rawUpdates)
    },
    [setRawFilters]
  )

  // Setters individuels
  const setPeriod = useCallback(
    (newPeriod: PeriodMode) => setFilters({ period: newPeriod }),
    [setFilters]
  )

  const setWeek = useCallback(
    (newWeek: WeekValue) => setFilters({ week: newWeek }),
    [setFilters]
  )

  const setDate = useCallback(
    (newDate: string) => setFilters({ date: newDate }),
    [setFilters]
  )

  const setRange = useCallback(
    (newRange: RangeValue | null) => setFilters({ range: newRange }),
    [setFilters]
  )

  const setStation = useCallback(
    (newStation: string) => setFilters({ station: newStation }),
    [setFilters]
  )

  const setTier = useCallback(
    (newTier: TierFilter) => setFilters({ tier: newTier }),
    [setFilters]
  )

  const setErrorType = useCallback(
    (newErrorType: string) => setFilters({ errorType: newErrorType }),
    [setFilters]
  )

  const setSearch = useCallback(
    (newSearch: string) => setFilters({ search: newSearch }),
    [setFilters]
  )

  return {
    // === Typed values ===
    period,
    week,
    date,
    range,
    station,
    tier,
    errorType,
    search,

    // === Setters ===
    setFilters,
    setPeriod,
    setWeek,
    setDate,
    setRange,
    setStation,
    setTier,
    setErrorType,
    setSearch,

    // === Temps normalisé pour API ===
    normalizedTime,

    // === Legacy compat (year, week number, dateStr) ===
    year: normalizedTime.year ?? week.year,
    weekNum: normalizedTime.week ?? week.week,
    dateStr: normalizedTime.dateStr ?? date,
    mode: period === "day" ? ("day" as const) : ("week" as const),

    // === UI helpers ===
    displayLabel,
    navigate,
    goToToday,
    isCurrent,
    canNavigate,
  }
}

// ============================================================================
// STATION-ONLY HOOK
// ============================================================================

/**
 * Pour les pages qui n'utilisent pas le temps global (Coaching, Calendar)
 */
export function useStationFilter() {
  const [station, setStation] = useQueryState("station", parseAsString.withDefault(""))

  return {
    station,
    setStation,
  }
}

// ============================================================================
// LEGACY COMPAT HOOK
// ============================================================================

/**
 * Hook de compatibilité pour migration progressive
 * @deprecated Utiliser useFilters() directement
 */
export function useTimeParams() {
  const f = useFilters()

  return {
    time: {
      type: f.period === "day" ? "day" : "week",
      date: f.period === "day" ? new Date(f.date) : undefined,
      year: f.week.year,
      week: f.week.week,
    },
    year: f.year,
    week: f.weekNum,
    dateStr: f.dateStr,
    mode: f.mode,
    queryParams: {
      mode: f.mode,
      year: f.year,
      week: f.weekNum,
      date: f.dateStr,
    },
  }
}

// ============================================================================
// URL BUILDER HOOK (for preserving filters across navigation)
// ============================================================================

/**
 * Hook pour construire des URLs qui préservent les filtres temps actuels
 * Utilisé par le sidebar pour la navigation
 */
export function useFilteredHref(pathname: string): string {
  const { period, week, date, range } = useFilters()

  // Build query string with current time filters
  const params = new URLSearchParams()

  // Always include period
  params.set("period", period)

  // Include relevant time param based on period
  if (period === "week") {
    params.set("week", serializeWeek(week))
  } else if (period === "day") {
    params.set("date", date)
  } else if (period === "range" && range) {
    params.set("range", serializeRange(range))
  }

  return `${pathname}?${params.toString()}`
}

/**
 * Hook qui retourne une fonction pour construire des hrefs avec filtres
 */
export function useBuildFilteredHref() {
  const { period, week, date, range } = useFilters()

  return useCallback(
    (pathname: string): string => {
      const params = new URLSearchParams()
      params.set("period", period)

      if (period === "week") {
        params.set("week", serializeWeek(week))
      } else if (period === "day") {
        params.set("date", date)
      } else if (period === "range" && range) {
        params.set("range", serializeRange(range))
      }

      return `${pathname}?${params.toString()}`
    },
    [period, week, date, range]
  )
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type { FilterValues, PeriodMode, WeekValue, RangeValue, TierFilter } from "./parsers"
export type { NormalizedTimeFilter, NavigationDirection } from "./types"
