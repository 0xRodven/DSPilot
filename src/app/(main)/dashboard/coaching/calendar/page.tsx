"use client";

import { useCallback, useMemo, useState } from "react";

import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";

import { CalendarBody } from "@/components/full-calendar/calendar-body";
import { CalendarProvider } from "@/components/full-calendar/contexts/calendar-context";
import { DndProvider } from "@/components/full-calendar/contexts/dnd-context";
import { CalendarHeader } from "@/components/full-calendar/header/calendar-header";
import type { IEvent, IUser } from "@/components/full-calendar/interfaces";
import type { TEventColor } from "@/components/full-calendar/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/lib/store";

// Map action types to calendar colors
const ACTION_TYPE_COLORS: Record<string, TEventColor> = {
  discussion: "blue",
  warning: "orange",
  training: "purple",
  suspension: "red",
};

// Action type labels
const ACTION_TYPE_LABELS: Record<string, string> = {
  discussion: "Discussion",
  warning: "Avertissement",
  training: "Formation",
  suspension: "Suspension",
};

export default function CoachingCalendarPage() {
  const { user } = useUser();
  const { selectedStation } = useDashboardStore();
  const [currentMonth, _setCurrentMonth] = useState(new Date());
  const deleteCoachingAction = useMutation(api.coaching.deleteCoachingAction);

  // Get station - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  // Calculate date range for fetching events (3 months: prev, current, next)
  const dateRange = useMemo(() => {
    const start = startOfMonth(subMonths(currentMonth, 1));
    const end = endOfMonth(addMonths(currentMonth, 1));
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  }, [currentMonth]);

  // Fetch calendar events
  const calendarEvents = useQuery(
    api.coaching.getCalendarEvents,
    station ? { stationId: station._id, ...dateRange } : "skip",
  );

  // Transform coaching actions to calendar events
  const events: IEvent[] = useMemo(() => {
    if (!calendarEvents) return [];

    return calendarEvents
      .filter((action) => action.startDate && action.endDate)
      .map((action, index) => ({
        id: index + 1, // Calendar expects numeric IDs
        // Carry the Convex action id so onEventDelete can soft-delete it
        externalId: action.id as string,
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
      }));
  }, [calendarEvents]);

  // Persist deletes to Convex (soft delete) so the action vanishes from
  // the calendar AND the planning view AND survives a reload.
  const handleEventDelete = useCallback(
    async (event: IEvent) => {
      if (!event.externalId) return;
      try {
        await deleteCoachingAction({
          actionId: event.externalId as Id<"coachingActions">,
          deletedBy: user?.id ?? undefined,
        });
        toast.success("Coaching supprimé");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de la suppression";
        toast.error("Suppression impossible", { description: message });
      }
    },
    [deleteCoachingAction, user?.id],
  );

  // Create virtual users from drivers with events
  const users: IUser[] = useMemo(() => {
    if (!calendarEvents) return [];

    const uniqueDrivers = new Map<string, IUser>();
    for (const action of calendarEvents) {
      const driverId = action.driverId as string;
      if (!uniqueDrivers.has(driverId)) {
        uniqueDrivers.set(driverId, {
          id: driverId,
          name: action.driverName,
          picturePath: null,
        });
      }
    }
    return Array.from(uniqueDrivers.values());
  }, [calendarEvents]);

  if (!station) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (calendarEvents === undefined) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <h1 className="font-bold text-2xl">Calendrier Coaching</h1>
          <p className="text-muted-foreground">Suivi des actions de coaching planifiées</p>
        </div>
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="font-bold text-2xl">Calendrier Coaching</h1>
        <p className="text-muted-foreground">
          {events.length} suivi{events.length !== 1 ? "s" : ""} planifié{events.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span>Discussion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          <span>Avertissement</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-purple-500" />
          <span>Formation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Suspension</span>
        </div>
      </div>

      {/* Calendar */}
      <CalendarProvider events={events} users={users} view="month" onEventDelete={handleEventDelete}>
        <DndProvider showConfirmation={false}>
          <div className="w-full rounded-xl border bg-card">
            <CalendarHeader />
            <CalendarBody />
          </div>
        </DndProvider>
      </CalendarProvider>
    </div>
  );
}
