// src/lib/store.ts
// Store Zustand unifié pour DSPilot avec nouveau système de filtrage

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getWeek, getYear, startOfWeek, endOfWeek } from "date-fns"
import type {
  TimeContext,
  TimeQueryParams,
  Station,
  FiltersState,
  SerializedTimeContext,
  PeriodMode,
  DateRange,
} from "@/lib/types/filters"
import {
  timeContextToQueryParams,
  formatTimeContext,
  navigateTimeContext,
  getCurrentPeriod,
  serializeTimeContext,
  deserializeTimeContext,
  getDateFromWeek,
} from "@/lib/utils/time-context"

// ============================================================================
// DEFAULTS
// ============================================================================

const defaultStation: Station = { id: "", name: "", code: "" }

// Default to week 49, 2025 (December 1st) to show imported data
const defaultTime: TimeContext = {
  type: "week",
  year: 2025,
  week: 49,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function timeToSelectedDate(time: TimeContext): Date {
  switch (time.type) {
    case "day":
      return time.date
    case "week":
      return getDateFromWeek(time.year, time.week)
    case "range":
      return time.from
    case "relative":
      return new Date()
  }
}

function timeToPeriodMode(time: TimeContext): PeriodMode {
  if (time.type === "day") return "day"
  if (time.type === "week") return "week"
  return "range" // range et relative -> range
}

function timeToDateRange(time: TimeContext): DateRange | null {
  if (time.type === "range") {
    return { from: time.from, to: time.to }
  }
  return null
}

function getEffectiveDateRangeFromTime(time: TimeContext): DateRange {
  switch (time.type) {
    case "day":
      return { from: time.date, to: time.date }
    case "week": {
      const date = getDateFromWeek(time.year, time.week)
      return {
        from: startOfWeek(date, { weekStartsOn: 1 }),
        to: endOfWeek(date, { weekStartsOn: 1 }),
      }
    }
    case "range":
      return { from: time.from, to: time.to }
    case "relative": {
      // Pour relative, on retourne la plage actuelle
      const now = new Date()
      return { from: now, to: now }
    }
  }
}

// ============================================================================
// STORE
// ============================================================================

export const useDashboardStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      // === Sidebar ===
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // === Global Context ===
      selectedStation: defaultStation,
      time: defaultTime,

      // === Actions ===
      setSelectedStation: (station) => set({ selectedStation: station }),
      setTime: (time) => set({ time }),

      // === Navigation ===
      navigateTime: (direction) => {
        const { time } = get()
        set({ time: navigateTimeContext(time, direction) })
      },

      goToToday: () => {
        const { time } = get()
        set({ time: getCurrentPeriod(time.type) })
      },

      // === Computed ===
      getQueryParams: () => {
        const { time } = get()
        return timeContextToQueryParams(time)
      },

      getDisplayLabel: () => {
        const { time } = get()
        return formatTimeContext(time)
      },

      // === Legacy Compatibility (computed getters) ===
      get selectedDate() {
        return timeToSelectedDate(get().time)
      },

      get periodMode() {
        return timeToPeriodMode(get().time)
      },

      get dateRange() {
        return timeToDateRange(get().time)
      },

      setSelectedDate: (date: Date) => {
        const { time } = get()
        if (time.type === "day") {
          set({ time: { type: "day", date } })
        } else if (time.type === "week") {
          set({
            time: {
              type: "week",
              year: getYear(date),
              week: getWeek(date, { weekStartsOn: 1 }),
            },
          })
        }
      },

      setPeriodMode: (mode: PeriodMode) => {
        const now = new Date()
        switch (mode) {
          case "day":
            set({ time: { type: "day", date: now } })
            break
          case "week":
            set({
              time: {
                type: "week",
                year: getYear(now),
                week: getWeek(now, { weekStartsOn: 1 }),
              },
            })
            break
          case "range":
            set({
              time: {
                type: "range",
                from: startOfWeek(now, { weekStartsOn: 1 }),
                to: endOfWeek(now, { weekStartsOn: 1 }),
                granularity: "week",
              },
            })
            break
        }
      },

      setDateRange: (range: DateRange | null) => {
        if (range) {
          set({
            time: {
              type: "range",
              from: range.from,
              to: range.to,
              granularity: "week",
            },
          })
        }
      },

      navigatePeriod: (direction: "prev" | "next") => {
        const { time } = get()
        set({ time: navigateTimeContext(time, direction) })
      },

      getEffectiveDateRange: () => {
        return getEffectiveDateRangeFromTime(get().time)
      },
    }),
    {
      name: "dspilot-dashboard",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        selectedStation: state.selectedStation,
        // Serialize time for localStorage
        time: serializeTimeContext(state.time),
      }),
      // Custom storage to handle Date serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const parsed = JSON.parse(str)
          // Deserialize time if present
          if (parsed?.state?.time) {
            parsed.state.time = deserializeTimeContext(
              parsed.state.time as SerializedTimeContext
            )
          }
          return parsed
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        },
      },
    }
  )
)

// ============================================================================
// EXPORTS
// ============================================================================

// Types exportés pour compatibilité
export type { Station, TimeContext, TimeQueryParams, PeriodMode, DateRange }

// Re-export nuqs-based hooks as the new source of truth
export { useFilters, useTimeParams } from "@/lib/filters"

// Helper pour savoir si on est en mode jour
export function useIsDayMode() {
  const time = useDashboardStore((s) => s.time)
  return time.type === "day"
}

// Helper pour obtenir l'effectiveMode (pour compatibilité)
export function useEffectiveMode(): "day" | "week" {
  const time = useDashboardStore((s) => s.time)
  return time.type === "day" ? "day" : "week"
}
