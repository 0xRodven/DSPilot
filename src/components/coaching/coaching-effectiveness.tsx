"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, TrendingUp, Clock, Lightbulb, MessageSquare, AlertTriangle, BookOpen, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CoachingActionType } from "@/lib/utils/status"
import type { Id } from "@convex/_generated/dataModel"

const periodOptions = ["3M", "6M", "1Y"] as const

const typeIcons: Record<CoachingActionType, typeof MessageSquare> = {
  discussion: MessageSquare,
  warning: AlertTriangle,
  training: BookOpen,
  suspension: Ban,
}

const typeLabels: Record<CoachingActionType, string> = {
  discussion: "Discussion",
  warning: "Avertissement",
  training: "Formation",
  suspension: "Suspension",
}

interface CoachingEffectivenessProps {
  stationId: Id<"stations">
}

export function CoachingEffectiveness({ stationId }: CoachingEffectivenessProps) {
  const [period, setPeriod] = useState<"3M" | "6M" | "1Y">("3M")
  const effectiveness = useQuery(api.coaching.getCoachingEffectiveness, { stationId, period })

  // Loading state
  if (effectiveness === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Efficacité du Coaching</CardTitle>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle empty data
  if (!effectiveness || effectiveness.byType.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Efficacité du Coaching</CardTitle>
          <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Importez des données pour voir les statistiques de coaching</p>
        </CardContent>
      </Card>
    )
  }

  const bestType = effectiveness.byType.reduce((best, current) =>
    current.successRate > best.successRate ? current : best,
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">Efficacité du Coaching</CardTitle>
          <p className="text-sm text-muted-foreground">
            Impact des actions sur les {period === "3M" ? "3" : period === "6M" ? "6" : "12"} derniers mois
          </p>
        </div>
        <div className="flex gap-1">
          {periodOptions.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "ghost"}
              className={cn(
                period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
            <CheckCircle className="mx-auto h-6 w-6 text-emerald-400" />
            <p className="mt-2 text-3xl font-bold text-foreground">{effectiveness.successRate}%</p>
            <p className="text-sm text-muted-foreground">Taux de succès</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {effectiveness.successCount}/{effectiveness.totalEvaluated} améliorés
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-blue-400" />
            <p className="mt-2 text-3xl font-bold text-foreground">+{effectiveness.avgImprovement.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Amélioration moyenne</p>
            <p className="mt-1 text-xs text-muted-foreground/70">DWC post-action</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
            <Clock className="mx-auto h-6 w-6 text-amber-400" />
            <p className="mt-2 text-3xl font-bold text-foreground">{effectiveness.avgDaysToEffect}</p>
            <p className="text-sm text-muted-foreground">Jours moyens</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Pour constater amélioration</p>
          </div>
        </div>

        {/* Effectiveness by Type */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <h4 className="mb-4 text-sm font-medium text-foreground/80">Efficacité par type d'action</h4>
          <div className="space-y-4">
            {effectiveness.byType.map((item) => {
              const Icon = typeIcons[item.type]
              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{typeLabels[item.type]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {item.successCount}/{item.total}
                      </span>
                      <span className="text-sm font-medium text-foreground">{item.successRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          item.successRate >= 70
                            ? "bg-emerald-500"
                            : item.successRate >= 50
                              ? "bg-amber-500"
                              : "bg-red-500",
                        )}
                        style={{ width: `${item.successRate}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Δ +{item.avgImprovement.toFixed(1)}% moyenne</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Insight */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-blue-400">Insight:</span> Les{" "}
            <span className="font-medium text-foreground">{typeLabels[bestType.type]}s</span> ont le meilleur taux de succès
            ({bestType.successRate}%) avec une amélioration moyenne de +{bestType.avgImprovement.toFixed(1)}%.
            Privilégier ce type d'action.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
