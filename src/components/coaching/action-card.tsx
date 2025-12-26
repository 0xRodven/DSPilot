"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  AlertTriangle,
  BookOpen,
  Ban,
  Calendar,
  Target,
  BarChart3,
  Eye,
  Pencil,
  ClipboardCheck,
  Mail,
  TrendingUp,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CoachingActionFull } from "@/lib/types"
import { getTierBgColor } from "@/lib/utils/tier"
import {
  getCoachingStatusColor,
  getCoachingStatusLabel,
  getActionTypeColor,
  getActionTypeLabel,
} from "@/lib/utils/status"
import Link from "next/link"

interface ActionCardProps {
  action: CoachingActionFull
  onEvaluate: (action: CoachingActionFull) => void
}

const ActionTypeIcon = ({ type }: { type: CoachingActionFull["actionType"] }) => {
  const icons = {
    discussion: MessageSquare,
    warning: AlertTriangle,
    training: BookOpen,
    suspension: Ban,
  }
  const Icon = icons[type]
  return <Icon className="h-4 w-4" />
}

export function ActionCard({ action, onEvaluate }: ActionCardProps) {
  const initials = action.driverName
    .split(" ")
    .map((n) => n[0])
    .join("")

  const hasResult = action.status === "improved" || action.status === "no_effect"
  const isEscalated = action.status === "escalated"
  const isPending = action.status === "pending"
  const improvement = hasResult && action.dwcAfterAction ? action.dwcAfterAction - action.dwcAtAction : 0

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4">
        {/* Header: Driver Info + Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-zinc-700">
              <AvatarFallback className="bg-zinc-800 text-white">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{action.driverName}</span>
                <Badge className={cn("text-xs", getCoachingStatusColor(action.status))}>
                  {getCoachingStatusLabel(action.status)}
                </Badge>
              </div>
              <p className="text-sm text-zinc-500">{action.driverAmazonId}</p>
              <Badge className={cn("mt-1 text-xs", getTierBgColor(action.driverTier))}>
                {action.driverTier.charAt(0).toUpperCase() + action.driverTier.slice(1)} ({action.driverDwc}% DWC)
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Details */}
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-lg p-1.5", getActionTypeColor(action.actionType))}>
                <ActionTypeIcon type={action.actionType} />
              </span>
              <span className="font-medium text-white">{getActionTypeLabel(action.actionType)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-zinc-500">
              <Calendar className="h-4 w-4" />
              {action.createdAt}
            </div>
          </div>
          <p className="mt-2 text-sm text-zinc-400">Raison: {action.reason}</p>
          {action.targetCategory && (
            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
              <Target className="h-4 w-4 text-blue-400" />
              Cible: {action.targetCategory}
              {action.targetSubcategory && ` → ${action.targetSubcategory}`}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
            <BarChart3 className="h-4 w-4 text-zinc-500" />
            DWC au moment de l'action: {action.dwcAtAction}%
          </div>
        </div>

        {/* Result Section (for evaluated actions) */}
        {hasResult && (
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Résultat</span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
              <div className="text-center">
                <p className="text-xs text-zinc-500">Avant</p>
                <p className="text-lg font-bold text-white">{action.dwcAtAction}%</p>
              </div>
              <TrendingUp className={cn("h-5 w-5", improvement > 0 ? "text-emerald-400" : "text-red-400")} />
              <div className="text-center">
                <p className="text-xs text-zinc-500">Après</p>
                <p className="text-lg font-bold text-white">{action.dwcAfterAction}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500">Évolution</p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    improvement > 0 ? "text-emerald-400" : improvement < 0 ? "text-red-400" : "text-zinc-400",
                  )}
                >
                  {improvement > 0 ? "+" : ""}
                  {improvement.toFixed(1)}%
                </p>
              </div>
            </div>
            {action.evaluationNotes && <p className="mt-2 text-sm italic text-zinc-400">"{action.evaluationNotes}"</p>}
          </div>
        )}

        {/* Escalation Section */}
        {isEscalated && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Transmis au Manager le {action.escalationDate}
            </div>
            {action.escalationNote && <p className="mt-2 text-sm text-zinc-400">"{action.escalationNote}"</p>}
          </div>
        )}

        {/* Waiting Info (for pending) */}
        {isPending && action.waitingDays > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
            <Clock className={cn("h-4 w-4", action.waitingDays > 7 ? "text-amber-400" : "text-zinc-500")} />
            <span className={action.waitingDays > 7 ? "text-amber-400" : ""}>
              En attente depuis {action.waitingDays} jours
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {isPending && (
            <Button
              size="sm"
              variant="outline"
              className="border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
              onClick={() => onEvaluate(action)}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Évaluer
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
            asChild
          >
            <Link href={`/dashboard/drivers/${action.driverId}`}>
              <Eye className="mr-2 h-4 w-4" />
              Voir driver
            </Link>
          </Button>
          {isPending && (
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
          {isEscalated && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contacter RH
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
