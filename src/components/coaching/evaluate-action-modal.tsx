"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  MessageSquare,
  AlertTriangle,
  BookOpen,
  Ban,
  TrendingUp,
  CheckCircle,
  MinusCircle,
  XCircle,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { cn } from "@/lib/utils"
import { type CoachingActionFull, getActionTypeLabel } from "@/lib/mock-data"

interface EvaluateActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: CoachingActionFull | null
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

// Mock evolution data
const evolutionData = [
  { week: "S47", dwc: 82.1 },
  { week: "S48", dwc: 83.5 },
  { week: "S49", dwc: 84.2 },
  { week: "S50", dwc: 85.7 },
]

export function EvaluateActionModal({ open, onOpenChange, action }: EvaluateActionModalProps) {
  const [result, setResult] = useState<"improved" | "no_effect" | "escalate">("improved")
  const [notes, setNotes] = useState("")
  const [planFollowUp, setPlanFollowUp] = useState(false)

  if (!action) return null

  const currentDwc = 85.7 // Mock current DWC
  const improvement = currentDwc - action.dwcAtAction

  const handleSubmit = () => {
    // Handle form submission
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Évaluer l'action de coaching</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action Summary */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <ActionTypeIcon type={action.actionType} />
              <div>
                <p className="font-medium text-white">{action.driverName}</p>
                <p className="text-sm text-zinc-400">
                  {getActionTypeLabel(action.actionType)} du {action.createdAt}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-400">Raison: {action.reason}</p>
          </div>

          {/* Automatic Evolution */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <h4 className="mb-4 text-sm font-medium text-zinc-300">Évolution automatique</h4>

            {/* Before/After Comparison */}
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 px-6 py-4">
              <div className="text-center">
                <p className="text-xs text-zinc-500">DWC au moment de l'action</p>
                <p className="text-2xl font-bold text-white">{action.dwcAtAction}%</p>
              </div>
              <TrendingUp className={cn("h-6 w-6", improvement > 0 ? "text-emerald-400" : "text-red-400")} />
              <div className="text-center">
                <p className="text-xs text-zinc-500">DWC actuel (S50)</p>
                <p className="text-2xl font-bold text-white">{currentDwc}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500">Évolution</p>
                <p className={cn("text-2xl font-bold", improvement > 0 ? "text-emerald-400" : "text-red-400")}>
                  {improvement > 0 ? "+" : ""}
                  {improvement.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="mt-4 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 90]} tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="dwc"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Result Selection */}
          <div className="space-y-3">
            <Label>Résultat de l'action *</Label>
            <RadioGroup value={result} onValueChange={(v) => setResult(v as typeof result)} className="space-y-3">
              <div
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                  result === "improved" ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 bg-zinc-800/50",
                )}
                onClick={() => setResult("improved")}
              >
                <RadioGroupItem value="improved" id="improved" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <Label htmlFor="improved" className="cursor-pointer font-medium text-white">
                      Amélioré
                    </Label>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">Le driver a progressé de manière significative</p>
                </div>
              </div>

              <div
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                  result === "no_effect" ? "border-zinc-500 bg-zinc-500/10" : "border-zinc-700 bg-zinc-800/50",
                )}
                onClick={() => setResult("no_effect")}
              >
                <RadioGroupItem value="no_effect" id="no_effect" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MinusCircle className="h-4 w-4 text-zinc-400" />
                    <Label htmlFor="no_effect" className="cursor-pointer font-medium text-white">
                      Sans changement
                    </Label>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">Pas d'amélioration notable, à surveiller</p>
                </div>
              </div>

              <div
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                  result === "escalate" ? "border-red-500 bg-red-500/10" : "border-zinc-700 bg-zinc-800/50",
                )}
                onClick={() => setResult("escalate")}
              >
                <RadioGroupItem value="escalate" id="escalate" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <Label htmlFor="escalate" className="cursor-pointer font-medium text-white">
                      Escalader
                    </Label>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">Nécessite une intervention RH/Manager</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Evaluation Notes */}
          <div className="space-y-2">
            <Label>Notes d'évaluation</Label>
            <Textarea
              placeholder="Driver réceptif lors de la discussion. A bien compris les points d'amélioration..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24 border-zinc-700 bg-zinc-800"
            />
          </div>

          {/* Plan Follow Up */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="followup"
              checked={planFollowUp}
              onCheckedChange={(checked) => setPlanFollowUp(checked as boolean)}
            />
            <Label htmlFor="followup" className="cursor-pointer text-zinc-300">
              Planifier une action de suivi
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
