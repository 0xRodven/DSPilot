// src/lib/filters/normalization.ts
// Conversion URL state → API params normalisés

import { endOfWeek, format } from "date-fns"
import { getDateFromWeek } from "@/lib/utils/time-context"
import type { NormalizedTimeFilter, URLFilterState } from "./types"
import type { FilterValues } from "./parsers"

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalise les filtres URL en format API uniforme
 */
export function normalizeTimeFilter(
  period: FilterValues["period"],
  week: FilterValues["week"],
  date: FilterValues["date"],
  range: FilterValues["range"]
): NormalizedTimeFilter {
  switch (period) {
    case "day": {
      return {
        start: date,
        end: date,
        granularity: "day",
        dateStr: date,
        // Pas de year/week en mode jour
      }
    }

    case "week": {
      const weekStart = getDateFromWeek(week.year, week.week)
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      return {
        start: format(weekStart, "yyyy-MM-dd"),
        end: format(weekEnd, "yyyy-MM-dd"),
        granularity: "week",
        year: week.year,
        week: week.week,
      }
    }

    case "range": {
      if (!range) {
        // Fallback vers semaine courante si pas de range
        const weekStart = getDateFromWeek(week.year, week.week)
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        return {
          start: format(weekStart, "yyyy-MM-dd"),
          end: format(weekEnd, "yyyy-MM-dd"),
          granularity: "week",
          year: week.year,
          week: week.week,
        }
      }
      return {
        start: format(range.start, "yyyy-MM-dd"),
        end: format(range.end, "yyyy-MM-dd"),
        granularity: "range",
      }
    }

    default: {
      // Fallback vers semaine
      const weekStart = getDateFromWeek(week.year, week.week)
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      return {
        start: format(weekStart, "yyyy-MM-dd"),
        end: format(weekEnd, "yyyy-MM-dd"),
        granularity: "week",
        year: week.year,
        week: week.week,
      }
    }
  }
}

// ============================================================================
// DISPLAY FORMATTING
// ============================================================================

/**
 * Formate le temps pour affichage dans le Period Picker
 */
export function formatTimeDisplay(
  period: FilterValues["period"],
  week: FilterValues["week"],
  date: FilterValues["date"],
  range: FilterValues["range"],
  options: { short?: boolean } = {}
): string {
  const { short = false } = options

  switch (period) {
    case "day": {
      const d = new Date(date)
      return short
        ? format(d, "d MMM")
        : format(d, "EEEE d MMMM yyyy")
    }

    case "week": {
      return short
        ? `S${week.week}`
        : `Semaine ${week.week} \u2022 ${week.year}`
    }

    case "range": {
      if (!range) return "Sélectionner une période"
      const fromStr = format(range.start, "d MMM")
      const toStr = format(range.end, "d MMM yyyy")
      return `${fromStr} → ${toStr}`
    }

    default:
      return `Semaine ${week.week} \u2022 ${week.year}`
  }
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

import { addDays, addWeeks, getWeek, getWeekYear, getYear } from "date-fns"

/**
 * Calcule la nouvelle période après navigation
 */
export function navigateTime(
  direction: "prev" | "next",
  period: FilterValues["period"],
  week: FilterValues["week"],
  date: FilterValues["date"],
  range: FilterValues["range"]
): Partial<FilterValues> {
  const delta = direction === "next" ? 1 : -1

  switch (period) {
    case "day": {
      const currentDate = new Date(date)
      const newDate = addDays(currentDate, delta)
      return {
        date: format(newDate, "yyyy-MM-dd"),
      }
    }

    case "week": {
      const weekStart = getDateFromWeek(week.year, week.week)
      const newDate = addWeeks(weekStart, delta)
      const weekOptions = { weekStartsOn: 1 as const, firstWeekContainsDate: 4 as const }
      return {
        week: {
          year: getWeekYear(newDate, weekOptions),
          week: getWeek(newDate, weekOptions),
        },
      }
    }

    case "range": {
      if (!range) return {}
      const days = Math.round(
        (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
      return {
        range: {
          start: addDays(range.start, delta * days),
          end: addDays(range.end, delta * days),
        },
      }
    }

    default:
      return {}
  }
}

/**
 * Retourne les valeurs pour "Aujourd'hui" selon le mode
 */
export function getTodayValues(
  period: FilterValues["period"]
): Partial<FilterValues> {
  const now = new Date()
  const weekOptions = { weekStartsOn: 1 as const, firstWeekContainsDate: 4 as const }

  switch (period) {
    case "day":
      return {
        date: format(now, "yyyy-MM-dd"),
      }

    case "week":
    case "range":
    default:
      return {
        week: {
          year: getYear(now),
          week: getWeek(now, weekOptions),
        },
      }
  }
}

/**
 * Vérifie si la période actuelle est "aujourd'hui" ou "cette semaine"
 */
export function isCurrentPeriod(
  period: FilterValues["period"],
  week: FilterValues["week"],
  date: FilterValues["date"]
): boolean {
  const now = new Date()
  const weekOptions = { weekStartsOn: 1 as const, firstWeekContainsDate: 4 as const }

  switch (period) {
    case "day":
      return date === format(now, "yyyy-MM-dd")

    case "week":
      return (
        week.year === getYear(now) &&
        week.week === getWeek(now, weekOptions)
      )

    case "range":
      return false

    default:
      return false
  }
}
