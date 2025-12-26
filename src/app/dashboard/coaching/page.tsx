"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { getWeek } from "date-fns"
import { GraduationCap } from "lucide-react"
import { CoachingKPIs } from "@/components/coaching/coaching-kpis"
import { CoachingToolbar } from "@/components/coaching/coaching-toolbar"
import { ActionCard } from "@/components/coaching/action-card"
import { CoachingSuggestions } from "@/components/coaching/coaching-suggestions"
import { CoachingEffectiveness } from "@/components/coaching/coaching-effectiveness"
import { NewActionModal } from "@/components/coaching/new-action-modal"
import { EvaluateActionModal } from "@/components/coaching/evaluate-action-modal"
import type { CoachingActionFull, CoachingSuggestion } from "@/lib/types"

export default function CoachingPage() {
  const { selectedStation, selectedDate } = useDashboardStore()
  const week = getWeek(selectedDate, { weekStartsOn: 1 })
  const year = selectedDate.getFullYear()

  // Get station from Convex
  const station = useQuery(api.stations.getStationByCode, { code: selectedStation.code })

  // Get coaching data from Convex
  const stats = useQuery(
    api.coaching.getCoachingStats,
    station ? { stationId: station._id } : "skip"
  )

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Get coaching actions from Convex with filters
  const actions = useQuery(
    api.coaching.listCoachingActions,
    station
      ? {
          stationId: station._id,
          status: statusFilter || undefined,
          actionType: typeFilter !== "all" ? typeFilter : undefined,
          search: searchQuery || undefined,
        }
      : "skip"
  )

  // Get suggestions for drivers needing coaching
  const suggestions = useQuery(
    api.coaching.getCoachingSuggestions,
    station ? { stationId: station._id, year, week } : "skip"
  )

  // Modals
  const [newActionOpen, setNewActionOpen] = useState(false)
  const [evaluateOpen, setEvaluateOpen] = useState(false)
  const [actionToEvaluate, setActionToEvaluate] = useState<CoachingActionFull | null>(null)
  const [prefillSuggestion, setPrefillSuggestion] = useState<CoachingSuggestion | null>(null)

  // Filter actions is now handled by the query
  const filteredActions = actions || []

  const handleEvaluate = (action: CoachingActionFull) => {
    setActionToEvaluate(action)
    setEvaluateOpen(true)
  }

  const handlePlanCoaching = (suggestion: CoachingSuggestion) => {
    setPrefillSuggestion(suggestion)
    setNewActionOpen(true)
  }

  const handleNewAction = () => {
    setPrefillSuggestion(null)
    setNewActionOpen(true)
  }

  // Loading state
  if (!station || stats === undefined) {
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
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Coaching</h1>
              <p className="text-sm text-muted-foreground">
                {stats.total} actions • {stats.thisMonth} améliorés ce mois
              </p>
            </div>
          </div>
        </div>

        {/* Zone 1: KPIs */}
        <div className="mb-6">
          <CoachingKPIs stats={stats} onFilterChange={setStatusFilter} activeFilter={statusFilter} />
        </div>

        {/* Zone 2: Toolbar + Tabs */}
        <div className="mb-6">
          <CoachingToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            periodFilter={periodFilter}
            onPeriodFilterChange={setPeriodFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onNewAction={handleNewAction}
            stats={stats}
          />
        </div>

        {/* Zone 3: Two Columns */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: Actions List */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{filteredActions.length} actions • Triées par date décroissante</p>
            {filteredActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
                <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aucune action de coaching</p>
                <p className="text-sm text-muted-foreground mt-1">Créez votre première action</p>
              </div>
            ) : (
              filteredActions.map((action) => (
                <ActionCard key={action.id} action={action} onEvaluate={handleEvaluate} />
              ))
            )}
          </div>

          {/* Right: Suggestions */}
          <div>
            <CoachingSuggestions suggestions={suggestions || []} onPlanCoaching={handlePlanCoaching} />
          </div>
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
        <EvaluateActionModal open={evaluateOpen} onOpenChange={setEvaluateOpen} action={actionToEvaluate} />
      </div>
    </main>
  )
}
