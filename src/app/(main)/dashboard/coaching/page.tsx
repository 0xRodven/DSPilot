"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { useDashboardStore } from "@/lib/store"
import { useFilters } from "@/lib/filters"
import { GraduationCap, Calendar, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CoachingKPIs } from "@/components/coaching/coaching-kpis"
import { CoachingKanban } from "@/components/coaching/kanban"
import { CoachingEffectiveness } from "@/components/coaching/coaching-effectiveness"
import { NewActionModal } from "@/components/coaching/new-action-modal"
import { EvaluateActionModal } from "@/components/coaching/evaluate-action-modal"
import type { CoachingSuggestion, CoachingActionFull } from "@/lib/types"

export default function CoachingPage() {
  const { selectedStation } = useDashboardStore()
  const { year, weekNum } = useFilters()

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip"
  )

  // Get coaching stats from Convex
  const stats = useQuery(
    api.coaching.getCoachingStats,
    station ? { stationId: station._id } : "skip"
  )

  // Modals state
  const [newActionOpen, setNewActionOpen] = useState(false)
  const [evaluateOpen, setEvaluateOpen] = useState(false)
  const [prefillSuggestion, setPrefillSuggestion] = useState<CoachingSuggestion | null>(null)
  const [actionToEvaluate, setActionToEvaluate] = useState<CoachingActionFull | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Get all actions for finding the one to evaluate
  const actions = useQuery(
    api.coaching.listCoachingActions,
    station ? { stationId: station._id } : "skip"
  )

  // Handlers
  const handlePlanCoaching = (driverId: Id<"drivers">, driverName: string, dwcPercent: number) => {
    setPrefillSuggestion({
      id: `kanban-${driverId}`,
      driverId,
      driverName,
      driverTier: dwcPercent >= 90 ? "fair" : "poor",
      driverDwc: dwcPercent,
      priority: dwcPercent < 90 ? "high" : "new_poor",
      reason: `Performance sous le seuil: ${dwcPercent}% DWC`,
      mainError: "DWC",
      mainErrorCount: 0,
      hasActiveAction: false,
    })
    setNewActionOpen(true)
  }

  const handleEvaluateAction = (actionId: Id<"coachingActions">) => {
    // Find the action in our list
    const action = actions?.find((a) => a.id === actionId)
    if (action) {
      setActionToEvaluate(action)
      setEvaluateOpen(true)
    }
  }

  const handleNewAction = () => {
    setPrefillSuggestion(null)
    setNewActionOpen(true)
  }

  // Loading state
  if (!station || stats === undefined || stats === null) {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Coaching</h1>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        {/* Page Title */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Coaching</h1>
              <p className="text-sm text-muted-foreground">
                {stats.total} actions • {stats.thisMonth} améliorés ce mois
              </p>
            </div>
          </div>
          <Button onClick={handleNewAction}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle action
          </Button>
        </div>

        {/* Zone 1: KPIs */}
        <div className="mb-6">
          <CoachingKPIs stats={stats} onFilterChange={setStatusFilter} activeFilter={statusFilter} />
        </div>

        {/* Zone 2: Kanban Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Vue tâches</h2>
          <Link
            href="/dashboard/coaching/calendar"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            <Calendar className="mr-1.5 h-4 w-4" />
            Calendrier
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Zone 3: Kanban Board */}
        <div className="mb-6">
          <CoachingKanban
            stationId={station._id}
            year={year}
            week={weekNum}
            onPlanCoaching={handlePlanCoaching}
            onEvaluateAction={handleEvaluateAction}
          />
        </div>

        {/* Zone 4: Effectiveness */}
        <CoachingEffectiveness stationId={station._id} />

        {/* Modals */}
        <NewActionModal
          open={newActionOpen}
          onOpenChange={setNewActionOpen}
          prefillSuggestion={prefillSuggestion}
          stationId={station._id}
        />
        <EvaluateActionModal
          open={evaluateOpen}
          onOpenChange={setEvaluateOpen}
          action={actionToEvaluate}
        />
      </div>
    </main>
  )
}
