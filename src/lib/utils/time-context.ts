// src/lib/utils/time-context.ts
// Helpers pour manipuler les TimeContext

import {
  format,
  addDays,
  addWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  getWeek,
  getYear,
  setWeek,
  setYear,
  isSameDay,
  differenceInDays,
  eachWeekOfInterval,
} from "date-fns"
import { fr } from "date-fns/locale"
import type {
  TimeContext,
  TimeQueryParams,
  SerializedTimeContext,
  TimePreset,
} from "@/lib/types/filters"

// ============================================================================
// CONVERSION → QUERY PARAMS
// ============================================================================

/**
 * Convertit un TimeContext en TimeQueryParams pour les queries Convex
 */
export function timeContextToQueryParams(time: TimeContext): TimeQueryParams {
  switch (time.type) {
    case "day":
      return {
        mode: "day",
        date: format(time.date, "yyyy-MM-dd"),
      }

    case "week":
      return {
        mode: "week",
        year: time.year,
        week: time.week,
      }

    case "range":
      return {
        mode: "range",
        startDate: format(time.from, "yyyy-MM-dd"),
        endDate: format(time.to, "yyyy-MM-dd"),
        granularity: time.granularity,
      }

    case "relative": {
      // Convertir en range concret basé sur maintenant
      const anchor = new Date()
      let from: Date
      const to: Date = anchor

      switch (time.unit) {
        case "days":
          from = time.offset < 0 ? addDays(anchor, time.offset) : anchor
          break
        case "weeks":
          from = time.offset < 0 ? addWeeks(anchor, time.offset) : anchor
          break
        case "months":
          from = time.offset < 0 ? addMonths(anchor, time.offset) : anchor
          break
      }

      return {
        mode: "range",
        startDate: format(from, "yyyy-MM-dd"),
        endDate: format(to, "yyyy-MM-dd"),
        granularity: time.unit === "days" ? "day" : "week",
      }
    }
  }
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Formate un TimeContext pour l'affichage
 */
export function formatTimeContext(
  time: TimeContext,
  options: { short?: boolean } = {}
): string {
  const { short = false } = options

  switch (time.type) {
    case "day":
      return short
        ? format(time.date, "d MMM", { locale: fr })
        : format(time.date, "EEEE d MMMM yyyy", { locale: fr })

    case "week":
      return short ? `S${time.week}` : `Semaine ${time.week} • ${time.year}`

    case "range": {
      const fromStr = format(time.from, "d MMM", { locale: fr })
      const toStr = format(time.to, "d MMM yyyy", { locale: fr })
      return `${fromStr} → ${toStr}`
    }

    case "relative": {
      const absOffset = Math.abs(time.offset)
      const unitLabel =
        time.unit === "days"
          ? absOffset === 1
            ? "jour"
            : "jours"
          : time.unit === "weeks"
            ? absOffset === 1
              ? "semaine"
              : "semaines"
            : absOffset === 1
              ? "mois"
              : "mois"
      return short
        ? `${absOffset}${time.unit[0].toUpperCase()}`
        : `${absOffset} dernières ${unitLabel}`
    }
  }
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Navigue vers la période précédente ou suivante
 */
export function navigateTimeContext(
  time: TimeContext,
  direction: "prev" | "next"
): TimeContext {
  const delta = direction === "next" ? 1 : -1

  switch (time.type) {
    case "day":
      return {
        type: "day",
        date: addDays(time.date, delta),
      }

    case "week": {
      const baseDate = getDateFromWeek(time.year, time.week)
      const newDate = addWeeks(baseDate, delta)
      const weekOptions = { weekStartsOn: 1 as const, firstWeekContainsDate: 4 as const }
      return {
        type: "week",
        year: getYear(newDate),
        week: getWeek(newDate, weekOptions),
      }
    }

    case "range": {
      const rangeDays = differenceInDays(time.to, time.from) + 1
      return {
        type: "range",
        from: addDays(time.from, delta * rangeDays),
        to: addDays(time.to, delta * rangeDays),
        granularity: time.granularity,
      }
    }

    case "relative":
      // Les périodes relatives ne naviguent pas, elles sont toujours "maintenant"
      return time
  }
}

/**
 * Vérifie si on peut naviguer (les périodes relatives ne naviguent pas)
 */
export function canNavigate(time: TimeContext): boolean {
  return time.type !== "relative"
}

/**
 * Vérifie si la période correspond à "aujourd'hui" ou "cette semaine"
 */
export function isCurrentPeriod(time: TimeContext): boolean {
  const now = new Date()

  switch (time.type) {
    case "day":
      return isSameDay(time.date, now)

    case "week":
      return (
        time.year === getYear(now) &&
        time.week === getWeek(now, { weekStartsOn: 1 })
      )

    case "range":
    case "relative":
      return false
  }
}

/**
 * Retourne le TimeContext pour "aujourd'hui" ou "cette semaine" selon le type actuel
 */
export function getCurrentPeriod(
  currentType: TimeContext["type"]
): TimeContext {
  const now = new Date()

  switch (currentType) {
    case "day":
      return { type: "day", date: now }

    case "week":
    case "range":
    case "relative":
      return {
        type: "week",
        year: getYear(now),
        week: getWeek(now, { weekStartsOn: 1 }),
      }
  }
}

// ============================================================================
// SERIALIZATION (pour localStorage)
// ============================================================================

export function serializeTimeContext(time: TimeContext): SerializedTimeContext {
  switch (time.type) {
    case "day":
      return {
        type: "day",
        date: time.date.toISOString(),
      }

    case "week":
      return {
        type: "week",
        year: time.year,
        week: time.week,
      }

    case "range":
      return {
        type: "range",
        from: time.from.toISOString(),
        to: time.to.toISOString(),
        granularity: time.granularity,
      }

    case "relative":
      return {
        type: "relative",
        anchor: time.anchor,
        offset: time.offset,
        unit: time.unit,
      }
  }
}

export function deserializeTimeContext(
  serialized: SerializedTimeContext
): TimeContext {
  switch (serialized.type) {
    case "day":
      return {
        type: "day",
        date: new Date(serialized.date!),
      }

    case "week":
      return {
        type: "week",
        year: serialized.year!,
        week: serialized.week!,
      }

    case "range":
      return {
        type: "range",
        from: new Date(serialized.from!),
        to: new Date(serialized.to!),
        granularity: serialized.granularity!,
      }

    case "relative":
      return {
        type: "relative",
        anchor: serialized.anchor!,
        offset: serialized.offset!,
        unit: serialized.unit!,
      }
  }
}

// ============================================================================
// WEEK HELPERS
// ============================================================================

/**
 * Retourne la date du lundi d'une semaine donnée
 */
export function getDateFromWeek(year: number, week: number): Date {
  // Create a date in January of the target year to avoid year boundary issues
  const jan4 = new Date(year, 0, 4) // Jan 4 is always in week 1 (ISO standard)
  const weekOptions = { weekStartsOn: 1 as const, firstWeekContainsDate: 4 as const }
  return startOfWeek(setWeek(jan4, week, weekOptions), weekOptions)
}

/**
 * Retourne la liste des semaines (year, week) dans une plage de dates
 */
export function getWeeksInRange(
  startDate: string | Date,
  endDate: string | Date
): Array<{ year: number; week: number }> {
  const start =
    typeof startDate === "string" ? new Date(startDate) : startDate
  const end = typeof endDate === "string" ? new Date(endDate) : endDate

  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })

  return weeks.map((date) => ({
    year: getYear(date),
    week: getWeek(date, { weekStartsOn: 1 }),
  }))
}

/**
 * Retourne le numéro de la semaine courante
 */
export function getCurrentWeek(): number {
  return getWeek(new Date(), { weekStartsOn: 1 })
}

/**
 * Retourne l'année courante
 */
export function getCurrentYear(): number {
  return getYear(new Date())
}

// ============================================================================
// PRESETS
// ============================================================================

export function getTimePresets(): TimePreset[] {
  const now = new Date()

  return [
    // Relatifs
    {
      label: "4 dernières semaines",
      shortLabel: "4S",
      value: { type: "relative", anchor: "now", offset: -4, unit: "weeks" },
    },
    {
      label: "8 dernières semaines",
      shortLabel: "8S",
      value: { type: "relative", anchor: "now", offset: -8, unit: "weeks" },
    },
    {
      label: "12 dernières semaines",
      shortLabel: "12S",
      value: { type: "relative", anchor: "now", offset: -12, unit: "weeks" },
    },
    {
      label: "3 derniers mois",
      shortLabel: "3M",
      value: { type: "relative", anchor: "now", offset: -3, unit: "months" },
    },

    // Périodes fixes
    {
      label: "Ce mois",
      value: {
        type: "range",
        from: startOfMonth(now),
        to: endOfMonth(now),
        granularity: "day",
      },
    },
    {
      label: "Mois dernier",
      value: {
        type: "range",
        from: startOfMonth(subMonths(now, 1)),
        to: endOfMonth(subMonths(now, 1)),
        granularity: "day",
      },
    },
    {
      label: "Ce trimestre",
      value: {
        type: "range",
        from: startOfQuarter(now),
        to: endOfQuarter(now),
        granularity: "week",
      },
    },
    {
      label: "Cette année",
      value: {
        type: "range",
        from: startOfYear(now),
        to: now,
        granularity: "week",
      },
    },
  ]
}

// ============================================================================
// COMPARISON
// ============================================================================

/**
 * Compare deux TimeContext pour l'égalité
 */
export function areTimeContextsEqual(a: TimeContext, b: TimeContext): boolean {
  if (a.type !== b.type) return false

  switch (a.type) {
    case "day":
      return isSameDay(a.date, (b as typeof a).date)

    case "week":
      return (
        a.year === (b as typeof a).year && a.week === (b as typeof a).week
      )

    case "range":
      return (
        isSameDay(a.from, (b as typeof a).from) &&
        isSameDay(a.to, (b as typeof a).to) &&
        a.granularity === (b as typeof a).granularity
      )

    case "relative":
      return (
        a.anchor === (b as typeof a).anchor &&
        a.offset === (b as typeof a).offset &&
        a.unit === (b as typeof a).unit
      )
  }
}
