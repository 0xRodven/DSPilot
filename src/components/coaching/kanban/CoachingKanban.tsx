"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { KanbanColumn } from "./KanbanColumn"
import { DetectCard } from "./DetectCard"
import { WaitingCard } from "./WaitingCard"
import { EvaluateCard } from "./EvaluateCard"
import { Search, Clock, ClipboardCheck, Target } from "lucide-react"

interface CoachingKanbanProps {
  stationId: Id<"stations">
  year: number
  week: number
  onPlanCoaching: (driverId: Id<"drivers">, driverName: string, dwcPercent: number) => void
  onEvaluateAction: (actionId: Id<"coachingActions">) => void
}

export function CoachingKanban({
  stationId,
  year,
  week,
  onPlanCoaching,
  onEvaluateAction,
}: CoachingKanbanProps) {
  const data = useQuery(api.coaching.getKanbanData, { stationId, year, week })

  if (data === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const isEmpty = data.detect.length === 0 && data.waiting.length === 0 && data.evaluate.length === 0

  if (isEmpty) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-card-foreground">Aucune tâche de coaching</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tous les drivers sont au-dessus du seuil de 95%
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
          {/* Column 1: Detect */}
          <KanbanColumn
            title="DÉTECTER"
            count={data.detect.length}
            icon={Search}
            iconColor="text-amber-400"
          >
            {data.detect.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Aucun driver à risque
              </div>
            ) : (
              data.detect.map((item) => (
                <DetectCard
                  key={item.id}
                  data={item}
                  onPlanCoaching={onPlanCoaching}
                />
              ))
            )}
          </KanbanColumn>

          {/* Column 2: Waiting */}
          <KanbanColumn
            title="ATTENTE"
            count={data.waiting.length}
            icon={Clock}
            iconColor="text-blue-400"
          >
            {data.waiting.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Aucune action en attente
              </div>
            ) : (
              data.waiting.map((item) => (
                <WaitingCard key={item.id} data={item} />
              ))
            )}
          </KanbanColumn>

          {/* Column 3: Evaluate */}
          <KanbanColumn
            title="ÉVALUER"
            count={data.evaluate.length}
            icon={ClipboardCheck}
            iconColor="text-emerald-400"
          >
            {data.evaluate.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Aucune action à évaluer
              </div>
            ) : (
              data.evaluate.map((item) => (
                <EvaluateCard
                  key={item.id}
                  data={item}
                  onEvaluate={onEvaluateAction}
                />
              ))
            )}
          </KanbanColumn>
        </div>
      </CardContent>
    </Card>
  )
}
