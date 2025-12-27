"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  MessageSquare,
  AlertTriangle,
  BookOpen,
  Ban,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CoachingActionType, CoachingStatus } from "@/lib/utils/status"

interface CoachingActionData {
  id: string
  actionType: CoachingActionType
  status: CoachingStatus
  reason: string
  dwcAtAction: number
  dwcAfterAction?: number
  followUpDate?: string
  notes?: string
  createdAt: number
}

interface CoachingActionDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: CoachingActionData | null
  driverName: string
}

const actionTypeConfig: Record<
  CoachingActionType,
  { label: string; icon: typeof MessageSquare; color: string }
> = {
  discussion: {
    label: "Discussion",
    icon: MessageSquare,
    color: "text-blue-400",
  },
  warning: {
    label: "Avertissement",
    icon: AlertTriangle,
    color: "text-amber-400",
  },
  training: {
    label: "Formation",
    icon: BookOpen,
    color: "text-emerald-400",
  },
  suspension: {
    label: "Suspension",
    icon: Ban,
    color: "text-red-400",
  },
}

const statusConfig: Record<CoachingStatus, { label: string; className: string }> = {
  pending: {
    label: "En cours",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  improved: {
    label: "Amélioré",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  no_effect: {
    label: "Sans effet",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  escalated: {
    label: "Escaladé",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
}

export function CoachingActionDetailModal({
  open,
  onOpenChange,
  action,
  driverName,
}: CoachingActionDetailModalProps) {
  if (!action) return null

  const impact =
    action.dwcAfterAction !== undefined
      ? action.dwcAfterAction - action.dwcAtAction
      : null

  const typeConfig = actionTypeConfig[action.actionType]
  const TypeIcon = typeConfig.icon
  const statusCfg = statusConfig[action.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
            {typeConfig.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Driver & Date */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-card-foreground">{driverName}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(action.createdAt), "d MMMM yyyy", { locale: fr })}
              </p>
            </div>
            <Badge variant="outline" className={statusCfg.className}>
              {statusCfg.label}
            </Badge>
          </div>

          {/* Raison */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Raison</p>
            <p className="text-card-foreground">{action.reason}</p>
          </div>

          {/* Impact */}
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Impact sur les performances
              </p>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Avant</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {action.dwcAtAction.toFixed(1)}%
                  </p>
                </div>

                {impact !== null ? (
                  <>
                    <div className="flex items-center">
                      {impact > 0 ? (
                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                      ) : impact < 0 ? (
                        <TrendingDown className="h-6 w-6 text-red-400" />
                      ) : (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Après</p>
                      <p className="text-2xl font-bold text-card-foreground">
                        {action.dwcAfterAction?.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Évolution</p>
                      <p
                        className={cn(
                          "text-xl font-bold",
                          impact > 0
                            ? "text-emerald-400"
                            : impact < 0
                              ? "text-red-400"
                              : "text-muted-foreground"
                        )}
                      >
                        {impact > 0 ? "+" : ""}
                        {impact.toFixed(1)}%
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-6 w-6 mx-auto mb-1" />
                    <p className="text-sm">En attente d&apos;évaluation</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suivi prévu */}
          {action.followUpDate && (
            <div className="flex items-center gap-2 text-sm text-card-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Suivi prévu le </span>
              <span className="font-medium">
                {format(new Date(action.followUpDate), "d MMMM yyyy", { locale: fr })}
              </span>
            </div>
          )}

          {/* Notes */}
          {action.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-card-foreground">{action.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Link href="/dashboard/coaching/calendar">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Voir calendrier
            </Button>
          </Link>
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
