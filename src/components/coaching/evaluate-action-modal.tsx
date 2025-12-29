"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  AlertTriangle,
  BookOpen,
  Ban,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format, addDays } from "date-fns"
import type { CoachingActionFull } from "@/lib/types"
import { getActionTypeLabel } from "@/lib/utils/status"

interface EvaluateActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: CoachingActionFull | null
}

const actionIcons = {
  discussion: MessageSquare,
  warning: AlertTriangle,
  training: BookOpen,
  suspension: Ban,
}

const actionColors = {
  discussion: "text-blue-400",
  warning: "text-amber-400",
  training: "text-emerald-400",
  suspension: "text-red-400",
}

export function EvaluateActionModal({ open, onOpenChange, action }: EvaluateActionModalProps) {
  const [result, setResult] = useState<"improved" | "no_effect">("improved")
  const [notes, setNotes] = useState("")
  const [nextActionType, setNextActionType] = useState<"discussion" | "warning" | "training" | "suspension">("discussion")
  const [followUpDays, setFollowUpDays] = useState("14")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mutations
  const evaluateAction = useMutation(api.coaching.evaluateCoachingAction)
  const createAction = useMutation(api.coaching.createCoachingAction)

  // Get pipeline suggestion for escalation
  const pipelineSuggestion = useQuery(
    api.coaching.getCoachingPipelineSuggestion,
    action ? { driverId: action.driverId as any } : "skip"
  )

  // Reset form when modal opens
  useEffect(() => {
    if (open && action) {
      setResult("improved")
      setNotes("")
      setFollowUpDays("14")
      // Pre-fill with suggested next action
      if (pipelineSuggestion) {
        setNextActionType(pipelineSuggestion.suggestedAction)
      }
    }
  }, [open, action, pipelineSuggestion])

  // Pre-fill next action from pipeline suggestion
  useEffect(() => {
    if (pipelineSuggestion && result === "no_effect") {
      setNextActionType(pipelineSuggestion.suggestedAction)
    }
  }, [pipelineSuggestion, result])

  if (!action) return null

  const currentDwc = action.driverDwc
  const improvement = currentDwc - action.dwcAtAction
  const TrendIcon = improvement >= 0 ? TrendingUp : TrendingDown
  const Icon = actionIcons[action.actionType]

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // 1. Evaluate current action
      await evaluateAction({
        actionId: action.id as any,
        result: result,
        dwcAfterAction: currentDwc,
        evaluationNotes: notes || undefined,
      })

      // 2. If no effect, create escalation action
      if (result === "no_effect") {
        const followUpDate = format(addDays(new Date(), parseInt(followUpDays)), "yyyy-MM-dd")

        await createAction({
          stationId: action.stationId as any,
          driverId: action.driverId as any,
          actionType: nextActionType,
          reason: `Escalade: ${action.reason}`,
          dwcAtAction: currentDwc,
          followUpDate,
          createdBy: "system",
        })

        toast.success(`Action évaluée et escalade créée (${getActionTypeLabel(nextActionType)})`)
      } else {
        toast.success("Action évaluée avec succès")
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error evaluating action:", error)
      toast.error("Erreur lors de l'évaluation")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", actionColors[action.actionType])} />
            Évaluer l'action
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action Summary */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{action.driverName}</p>
                <p className="text-sm text-muted-foreground">
                  {getActionTypeLabel(action.actionType)} • {action.createdAt.split("T")[0]}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{action.reason}</p>
          </div>

          {/* DWC Evolution */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="mb-4 text-sm font-medium text-foreground">Évolution DWC</h4>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Début</p>
                <p className="text-2xl font-bold text-foreground">{action.dwcAtAction}%</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Actuel</p>
                <p className="text-2xl font-bold text-foreground">{currentDwc}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Delta</p>
                <p className={cn("text-2xl font-bold flex items-center gap-1", improvement >= 0 ? "text-emerald-500" : "text-red-500")}>
                  <TrendIcon className="h-5 w-5" />
                  {improvement > 0 ? "+" : ""}{improvement.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Result Selection */}
          <div className="space-y-3">
            <Label>Résultat de l'action</Label>
            <RadioGroup value={result} onValueChange={(v) => setResult(v as typeof result)} className="space-y-2">
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                  result === "improved" ? "border-emerald-500 bg-emerald-500/10" : "border-border"
                )}
                onClick={() => setResult("improved")}
              >
                <RadioGroupItem value="improved" id="improved" />
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <Label htmlFor="improved" className="cursor-pointer font-medium">Amélioré</Label>
                  <p className="text-sm text-muted-foreground">Le driver a progressé</p>
                </div>
              </div>

              <div
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                  result === "no_effect" ? "border-amber-500 bg-amber-500/10" : "border-border"
                )}
                onClick={() => setResult("no_effect")}
              >
                <RadioGroupItem value="no_effect" id="no_effect" />
                <XCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <Label htmlFor="no_effect" className="cursor-pointer font-medium">Sans effet</Label>
                  <p className="text-sm text-muted-foreground">Pas d'amélioration → Escalade</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Escalation Options (shown only when no_effect) */}
          {result === "no_effect" && (
            <div className="space-y-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <h4 className="font-medium text-foreground">Escalade automatique</h4>

              {pipelineSuggestion && (
                <p className="text-sm text-muted-foreground">
                  Suggestion: {pipelineSuggestion.reason}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prochaine action</Label>
                  <Select value={nextActionType} onValueChange={(v) => setNextActionType(v as typeof nextActionType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discussion">Discussion</SelectItem>
                      <SelectItem value="training">Formation</SelectItem>
                      <SelectItem value="warning">Avertissement</SelectItem>
                      <SelectItem value="suspension">Suspension</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Suivi dans (jours)</Label>
                  <Select value={followUpDays} onValueChange={setFollowUpDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 jours</SelectItem>
                      <SelectItem value="14">14 jours</SelectItem>
                      <SelectItem value="21">21 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes d'évaluation (optionnel)</Label>
            <Textarea
              placeholder="Commentaires sur l'évaluation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {result === "no_effect" ? "Évaluer et escalader" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
