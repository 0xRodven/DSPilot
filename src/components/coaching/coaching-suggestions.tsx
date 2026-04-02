"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, TrendingDown, RotateCcw, UserMinus, Plus, ChevronRight, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CoachingSuggestion } from "@/lib/types"
import { getDwcBadgeClass } from "@/lib/utils/performance-color"

interface CoachingSuggestionsProps {
  suggestions: CoachingSuggestion[]
  onPlanCoaching: (suggestion: CoachingSuggestion) => void
  className?: string
}

const priorityConfig = {
  high: {
    label: "HAUTE PRIORITÉ",
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  negative_trend: {
    label: "TENDANCE NÉGATIVE",
    icon: TrendingDown,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  relapse: {
    label: "RÉCIDIVE",
    icon: RotateCcw,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  new_poor: {
    label: "NOUVEAU POOR",
    icon: UserMinus,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
}

function SuggestionCard({
  suggestion,
  onPlanCoaching,
}: {
  suggestion: CoachingSuggestion
  onPlanCoaching: (suggestion: CoachingSuggestion) => void
}) {
  const config = priorityConfig[suggestion.priority]
  const Icon = config.icon

  return (
    <div className={cn("rounded-lg border p-3", config.borderColor, config.bgColor)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-white">{suggestion.driverName}</p>
          <Badge className={cn("mt-1 text-xs tabular-nums", getDwcBadgeClass(suggestion.driverDwc))}>
            {suggestion.driverDwc}% DWC
          </Badge>
        </div>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="mt-2 space-y-1 text-sm text-zinc-400">
        {suggestion.weeksUnderThreshold && (
          <p className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            {suggestion.weeksUnderThreshold} semaines {"<"} 88%
          </p>
        )}
        {suggestion.trendPercent && (
          <p className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            {suggestion.trendPercent}% sur 4 semaines
          </p>
        )}
        {suggestion.lastCoachingWeek && (
          <p className="flex items-center gap-1">
            <RotateCcw className="h-3 w-3" />
            Dernier coaching: {suggestion.lastCoachingWeek}
          </p>
        )}
        <p className="flex items-center gap-1">
          <Target className="h-3 w-3 text-blue-400" />
          {suggestion.mainError} ({suggestion.mainErrorCount} erreurs)
        </p>
      </div>
      <Button
        size="sm"
        className="mt-3 w-full bg-zinc-800 text-white hover:bg-zinc-700"
        onClick={() => onPlanCoaching(suggestion)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Planifier coaching
      </Button>
    </div>
  )
}

export function CoachingSuggestions({ suggestions, onPlanCoaching, className }: CoachingSuggestionsProps) {
  const groupedSuggestions = {
    high: suggestions.filter((s) => s.priority === "high" || s.priority === "new_poor"),
    negative_trend: suggestions.filter((s) => s.priority === "negative_trend"),
    relapse: suggestions.filter((s) => s.priority === "relapse"),
  }

  return (
    <Card className={cn("border-border bg-card flex flex-col overflow-hidden", className)}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
          <Target className="h-5 w-5 text-blue-400" />
          Suggestions de coaching
        </CardTitle>
        <p className="text-sm text-muted-foreground">Drivers à risque détectés automatiquement</p>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto">
        {/* High Priority */}
        {groupedSuggestions.high.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">HAUTE PRIORITÉ</span>
            </div>
            <div className="space-y-2">
              {groupedSuggestions.high.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} onPlanCoaching={onPlanCoaching} />
              ))}
            </div>
          </div>
        )}

        {/* Negative Trend */}
        {groupedSuggestions.negative_trend.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">TENDANCE NÉGATIVE</span>
            </div>
            <div className="space-y-2">
              {groupedSuggestions.negative_trend.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} onPlanCoaching={onPlanCoaching} />
              ))}
            </div>
          </div>
        )}

        {/* Relapse */}
        {groupedSuggestions.relapse.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">RÉCIDIVE</span>
            </div>
            <div className="space-y-2">
              {groupedSuggestions.relapse.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} onPlanCoaching={onPlanCoaching} />
              ))}
            </div>
          </div>
        )}

        <Button variant="ghost" className="w-full text-blue-400 hover:bg-zinc-800 hover:text-blue-300">
          Voir tous les drivers à risque
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
