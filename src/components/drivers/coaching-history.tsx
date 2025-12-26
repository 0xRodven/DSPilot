"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { DriverDetail } from "@/lib/types"
import { Calendar, MessageSquare, BookOpen, RefreshCw, CheckCircle2, TrendingUp, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface CoachingHistoryProps {
  driver: DriverDetail
}

export function CoachingHistory({ driver }: CoachingHistoryProps) {
  const typeIcons = {
    discussion: MessageSquare,
    formation: BookOpen,
    suivi: RefreshCw,
  }

  const typeLabels = {
    discussion: "Discussion",
    formation: "Formation",
    suivi: "Suivi",
  }

  const resultLabels = {
    ameliore: "Amélioré",
    complete: "Complété",
    "en-cours": "En cours",
  }

  const resultColors = {
    ameliore: "text-emerald-400",
    complete: "text-blue-400",
    "en-cours": "text-amber-400",
  }

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-card-foreground">Historique Coaching</CardTitle>
        <p className="text-sm text-muted-foreground">{driver.coachingHistory.length} actions passées</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {driver.coachingHistory.map((action) => {
          const Icon = typeIcons[action.type]
          return (
            <div key={action.id} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="h-3 w-3" />
                <span>
                  {action.week} • {action.date}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-card-foreground">{typeLabels[action.type]}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{action.subject}</p>

              {action.impactPercent && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2 py-1 mb-2">
                  <span className="text-xs text-muted-foreground">Avant → Après</span>
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">+{action.impactPercent}%</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={cn("h-4 w-4", resultColors[action.result])} />
                <span className={cn("text-sm font-medium", resultColors[action.result])}>
                  {resultLabels[action.result]}
                </span>
              </div>
            </div>
          )
        })}

        <Button variant="outline" className="w-full mt-2 bg-transparent">
          <Plus className="mr-2 h-4 w-4" />
          Planifier un coaching
        </Button>
      </CardContent>
    </Card>
  )
}
