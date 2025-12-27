import { create } from "zustand"
import { persist } from "zustand/middleware"
import { startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from "date-fns"

type PeriodMode = "day" | "week" | "range"

interface DateRange {
  from: Date
  to: Date
}

interface Station {
  id: string
  name: string
  code: string
}

interface DashboardState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Global filters
  selectedStation: Station
  setSelectedStation: (station: Station) => void

  // Period selection
  periodMode: PeriodMode
  setPeriodMode: (mode: PeriodMode) => void

  selectedDate: Date
  setSelectedDate: (date: Date) => void

  dateRange: DateRange | null
  setDateRange: (range: DateRange | null) => void

  // Computed getters
  getEffectiveDateRange: () => DateRange

  // Navigation helpers
  navigatePeriod: (direction: "prev" | "next") => void
}

// Default empty station (will be replaced when stations load)
const defaultStation: Station = { id: "", name: "", code: "" }

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Global filters
      selectedStation: defaultStation,
      setSelectedStation: (station) => set({ selectedStation: station }),

      // Period selection
      periodMode: "week",
      setPeriodMode: (mode) => set({ periodMode: mode }),

      // Default to week 49, 2025 (December 1st) to show imported data
      selectedDate: new Date(2025, 11, 1), // December 1, 2025 = Week 49
      setSelectedDate: (date) => set({ selectedDate: date }),

      dateRange: null,
      setDateRange: (range) => set({ dateRange: range }),

      // Get effective date range based on period mode
      getEffectiveDateRange: () => {
        const { periodMode, selectedDate, dateRange } = get()

        if (periodMode === "range" && dateRange) {
          return dateRange
        }

        if (periodMode === "day") {
          return {
            from: selectedDate,
            to: selectedDate,
          }
        }

        // Week mode (default)
        return {
          from: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          to: endOfWeek(selectedDate, { weekStartsOn: 1 }),
        }
      },

      navigatePeriod: (direction) => {
        const { periodMode, selectedDate, dateRange } = get()

        if (periodMode === "range" && dateRange) {
          // For range mode, shift by the range duration
          const duration = dateRange.to.getTime() - dateRange.from.getTime()
          const days = Math.ceil(duration / (24 * 60 * 60 * 1000)) + 1
          const newFrom = direction === "next"
            ? addDays(dateRange.from, days)
            : subDays(dateRange.from, days)
          const newTo = direction === "next"
            ? addDays(dateRange.to, days)
            : subDays(dateRange.to, days)
          set({ dateRange: { from: newFrom, to: newTo } })
        } else if (periodMode === "week") {
          const newDate = direction === "next"
            ? addWeeks(selectedDate, 1)
            : subWeeks(selectedDate, 1)
          set({ selectedDate: newDate })
        } else {
          // Day mode
          const newDate = direction === "next"
            ? addDays(selectedDate, 1)
            : subDays(selectedDate, 1)
          set({ selectedDate: newDate })
        }
      },
    }),
    {
      name: "dspilot-dashboard",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        selectedStation: state.selectedStation,
        periodMode: state.periodMode,
      }),
    },
  ),

)

// Export types for use in components
export type { PeriodMode, DateRange, Station }
