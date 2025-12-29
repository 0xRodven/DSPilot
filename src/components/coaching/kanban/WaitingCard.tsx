"use client"

import { Badge } from "@/components/ui/badge"
import { MessageSquare, AlertTriangle, BookOpen, Ban, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Id } from "@convex/_generated/dataModel"

type ActionType = "discussion" | "warning" | "training" | "suspension"

interface WaitingCardData {
  id: Id<"coachingActions">
  driverId: Id<"drivers">
  driverName: string
  actionType: ActionType
  dwcAtAction: number
  reason: string
  followUpDate: string
  daysUntilFollowUp: number
  createdAt: string
}

interface WaitingCardProps {
  data: WaitingCardData
  onClick?: () => void
}

const actionConfig: Record<ActionType, { icon: typeof MessageSquare; label: string; color: string }> = {
  discussion: { icon: MessageSquare, label: "Discussion", color: "text-blue-400" },
  warning: { icon: AlertTriangle, label: "Avertissement", color: "text-amber-400" },
  training: { icon: BookOpen, label: "Formation", color: "text-emerald-400" },
  suspension: { icon: Ban, label: "Suspension", color: "text-red-400" },
}

export function WaitingCard({ data, onClick }: WaitingCardProps) {
  const config = actionConfig[data.actionType]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 transition-colors",
        onClick && "cursor-pointer hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-card-foreground truncate">{data.driverName}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
            <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium text-card-foreground">{data.dwcAtAction}%</p>
          <p className="text-xs text-muted-foreground">DWC init.</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-xs">
          Suivi dans{" "}
          <span className="font-medium text-card-foreground">
            {data.daysUntilFollowUp}j
          </span>
        </span>
      </div>

      {data.reason && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{data.reason}</p>
      )}
    </div>
  )
}
