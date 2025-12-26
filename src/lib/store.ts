import { create } from "zustand"
import { persist } from "zustand/middleware"

type Granularity = "day" | "week"

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

  granularity: Granularity
  setGranularity: (granularity: Granularity) => void

  selectedDate: Date
  setSelectedDate: (date: Date) => void

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

      granularity: "week",
      setGranularity: (granularity) => set({ granularity }),

      // Default to week 49, 2025 (December 1st) to show imported data
      selectedDate: new Date(2025, 11, 1), // December 1, 2025 = Week 49
      setSelectedDate: (date) => set({ selectedDate: date }),

      navigatePeriod: (direction) => {
        const { granularity, selectedDate } = get()
        const newDate = new Date(selectedDate)

        if (granularity === "week") {
          newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
        } else {
          newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
        }

        set({ selectedDate: newDate })
      },
    }),
    {
      name: "dspilot-dashboard",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        selectedStation: state.selectedStation,
        granularity: state.granularity,
      }),
    },
  ),
)
