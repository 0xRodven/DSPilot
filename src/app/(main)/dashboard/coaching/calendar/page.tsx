"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { CalendarProvider } from "@/components/full-calendar/contexts/calendar-context"
import { DndProvider } from "@/components/full-calendar/contexts/dnd-context"
import { CalendarHeader } from "@/components/full-calendar/header/calendar-header"
import { CalendarBody } from "@/components/full-calendar/calendar-body"
import { Skeleton } from "@/components/ui/skeleton"
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { useState, useMemo } from "react"
import type { IEvent, IUser } from "@/components/full-calendar/interfaces"
import type { TEventColor } from "@/components/full-calendar/types"

// Map action types to calendar colors
const ACTION_TYPE_COLORS: Record<string, TEventColor> = {
  discussion: "blue",
  warning: "orange",
  training: "purple",
  suspension: "red",
}

// Action type labels
const ACTION_TYPE_LABELS: Record<string, string> = {
  discussion: "Discussion",
  warning: "Avertissement",
  training: "Formation",
  suspension: "Suspension",
}

export default function CoachingCalendarPage() {
  const { selectedStation } = useDashboardStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get station - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip"
  )

  // Calculate date range for fetching events (3 months: prev, current, next)
  const dateRange = useMemo(() => {
    const start = startOfMonth(subMonths(currentMonth, 1))
    const end = endOfMonth(addMonths(currentMonth, 1))
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    }
  }, [currentMonth])

  // Fetch calendar events
  const calendarEvents = useQuery(
    api.coaching.getCalendarEvents,
    station ? { stationId: station._id, ...dateRange } : "skip"
  )

  // Transform coaching actions to calendar events
  const events: IEvent[] = useMemo(() => {
    if (!calendarEvents) return []

    return calendarEvents
      .filter((action) => action.startDate && action.endDate)
      .map((action, index) => ({
        id: index + 1, // Calendar expects numeric IDs
        title: action.title,
        description: `${ACTION_TYPE_LABELS[action.actionType] || action.actionType}: ${action.description}`,
        startDate: action.startDate as string,
        endDate: action.endDate as string,
        color: ACTION_TYPE_COLORS[action.actionType] || "blue",
        user: {
          id: action.driverId as string,
          name: action.driverName,
          picturePath: null,
        },
      }))
  }, [calendarEvents])

  // Create virtual users from drivers with events
  const users: IUser[] = useMemo(() => {
    if (!calendarEvents) return []

    const uniqueDrivers = new Map<string, IUser>()
    for (const action of calendarEvents) {
      const driverId = action.driverId as string
      if (!uniqueDrivers.has(driverId)) {
        uniqueDrivers.set(driverId, {
          id: driverId,
          name: action.driverName,
          picturePath: null,
        })
      }
    }
    return Array.from(uniqueDrivers.values())
  }, [calendarEvents])

  if (!station) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (calendarEvents === undefined) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Calendrier Coaching</h1>
          <p className="text-muted-foreground">Suivi des actions de coaching planifiées</p>
        </div>
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Calendrier Coaching</h1>
        <p className="text-muted-foreground">
          {events.length} suivi{events.length !== 1 ? "s" : ""} planifié{events.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Discussion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Avertissement</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Formation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Suspension</span>
        </div>
      </div>

      {/* Calendar */}
      <CalendarProvider events={events} users={users} view="month">
        <DndProvider showConfirmation={false}>
          <div className="w-full border rounded-xl bg-card">
            <CalendarHeader />
            <CalendarBody />
          </div>
        </DndProvider>
      </CalendarProvider>
    </div>
  )
}
