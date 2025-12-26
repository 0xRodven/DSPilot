"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, TrendingUp, MinusCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CoachingStats {
  pending: { count: number; overdueCount: number }
  improved: { count: number; avgImprovement: number }
  noEffect: { count: number }
  escalated: { count: number }
  total: number
  thisMonth: number
}

interface CoachingKPIsProps {
  stats: CoachingStats
  onFilterChange: (status: string | null) => void
  activeFilter: string | null
}

export function CoachingKPIs({ stats, onFilterChange, activeFilter }: CoachingKPIsProps) {

  const kpis = [
    {
      id: "pending",
      label: "En attente",
      value: stats.pending.count,
      subLabel: "À évaluer",
      detail: stats.pending.overdueCount > 0 ? `${stats.pending.overdueCount} > 7 jours` : "Tous récents",
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      alertColor: stats.pending.overdueCount > 0 ? "text-amber-400" : "text-muted-foreground",
    },
    {
      id: "improved",
      label: "Améliorés",
      value: stats.improved.count,
      subLabel: "Ce mois",
      detail: `Δ +${stats.improved.avgImprovement.toFixed(1)}% moy.`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      alertColor: "text-emerald-400",
    },
    {
      id: "no_effect",
      label: "Sans effet",
      value: stats.noEffect.count,
      subLabel: "À revoir",
      detail: "Relancer ?",
      icon: MinusCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-border",
      alertColor: "text-muted-foreground",
    },
    {
      id: "escalated",
      label: "Escaladés",
      value: stats.escalated.count,
      subLabel: "RH/Manager",
      detail: "Action requise",
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      alertColor: "text-red-400",
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        const isActive = activeFilter === kpi.id

        return (
          <Card
            key={kpi.id}
            className={cn(
              "cursor-pointer border bg-card transition-all hover:bg-muted/50",
              isActive ? `${kpi.borderColor} border-2` : "border-border",
            )}
            onClick={() => onFilterChange(isActive ? null : kpi.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={cn("rounded-lg p-2", kpi.bgColor)}>
                  <Icon className={cn("h-5 w-5", kpi.color)} />
                </div>
                <span className={cn("text-xs", kpi.alertColor)}>{kpi.detail}</span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                <p className={cn("text-sm font-medium", kpi.color)}>{kpi.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.subLabel}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
