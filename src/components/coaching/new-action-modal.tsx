"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, MessageSquare, AlertTriangle, BookOpen, Ban, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CoachingSuggestion } from "@/lib/types"
import { getTierBgColor } from "@/lib/utils/tier"
import type { CoachingActionType } from "@/lib/utils/status"
import { withToast } from "@/lib/utils/mutation"
import type { Id } from "../../../convex/_generated/dataModel"

interface NewActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefillSuggestion?: CoachingSuggestion | null
  stationId: Id<"stations">
}

const actionTypes: { type: CoachingActionType; label: string; icon: typeof MessageSquare }[] = [
  { type: "discussion", label: "Discussion", icon: MessageSquare },
  { type: "warning", label: "Avertissement", icon: AlertTriangle },
  { type: "training", label: "Formation", icon: BookOpen },
  { type: "suspension", label: "Suspension", icon: Ban },
]

const reasonSuggestions = [
  "DWC sous 85% - 3 semaines consécutives",
  "Contact Miss répétitifs",
  "Tendance négative sur 4 semaines",
  "Photo Defect fréquents",
  "Nouveau passage en tier Poor",
]

const followUpOptions = [
  { value: "1w", label: "Dans 1 semaine" },
  { value: "2w", label: "Dans 2 semaines" },
  { value: "1m", label: "Dans 1 mois" },
  { value: "custom", label: "Date personnalisée" },
]

export function NewActionModal({ open, onOpenChange, prefillSuggestion, stationId }: NewActionModalProps) {
  const [driverSearch, setDriverSearch] = useState("")
  const [selectedDriver, setSelectedDriver] = useState<Id<"drivers"> | null>(null)
  const [selectedDriverInfo, setSelectedDriverInfo] = useState<{ name: string; dwcPercent: number; tier: string } | null>(null)
  const [selectedType, setSelectedType] = useState<CoachingActionType>("discussion")
  const [reason, setReason] = useState("")
  const [targetCategory, setTargetCategory] = useState("")
  const [targetSubcategory, setTargetSubcategory] = useState("")
  const [notes, setNotes] = useState("")
  const [followUp, setFollowUp] = useState("2w")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get drivers from Convex
  const drivers = useQuery(api.stats.getDashboardDrivers, {
    stationId,
    year: new Date().getFullYear(),
    week: Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
  })

  const createAction = useMutation(api.coaching.createCoachingAction)

  // Reset form when suggestion changes
  useEffect(() => {
    if (prefillSuggestion) {
      setSelectedDriver(prefillSuggestion.driverId as Id<"drivers">)
      setSelectedDriverInfo({
        name: prefillSuggestion.driverName,
        dwcPercent: prefillSuggestion.driverDwc,
        tier: prefillSuggestion.driverTier,
      })
      setReason(prefillSuggestion.reason)
      setTargetCategory(prefillSuggestion.mainError)
    }
  }, [prefillSuggestion])

  const filteredDrivers = (drivers || []).filter(
    (d) =>
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.amazonId.toLowerCase().includes(driverSearch.toLowerCase()),
  )

  const suggestedDrivers = (drivers || []).filter((d) => d.tier === "poor" || d.tier === "fair").slice(0, 2)

  const handleSubmit = async () => {
    if (!selectedDriver || !reason) return

    setIsSubmitting(true)

    // Calculate follow up date
    const followUpDate = new Date()
    if (followUp === "1w") followUpDate.setDate(followUpDate.getDate() + 7)
    else if (followUp === "2w") followUpDate.setDate(followUpDate.getDate() + 14)
    else if (followUp === "1m") followUpDate.setMonth(followUpDate.getMonth() + 1)

    const result = await withToast(
      createAction({
        stationId,
        driverId: selectedDriver,
        actionType: selectedType,
        reason,
        targetCategory: targetCategory || undefined,
        targetSubcategory: targetSubcategory || undefined,
        notes: notes || undefined,
        dwcAtAction: selectedDriverInfo?.dwcPercent || 0,
        followUpDate: followUpDate.toISOString(),
        createdBy: "current-user", // TODO: Get from auth
      }),
      {
        loading: "Création de l'action...",
        success: "Action de coaching créée",
        error: "Erreur lors de la création de l'action",
      }
    )

    if (result) {
      // Reset and close
      setSelectedDriver(null)
      setSelectedDriverInfo(null)
      setReason("")
      setTargetCategory("")
      setTargetSubcategory("")
      setNotes("")
      onOpenChange(false)
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Planifier une action de coaching</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Driver Selection */}
          <div className="space-y-3">
            <Label>Driver *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Rechercher un driver..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="border-zinc-700 bg-zinc-800 pl-10"
              />
            </div>

            {/* Suggestions */}
            {!selectedDriver && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Lightbulb className="h-4 w-4" />
                  Suggestions:
                </div>
                <div className="space-y-2">
                  {suggestedDrivers.map((driver) => (
                    <button
                      key={driver.id}
                      className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-left transition-colors hover:bg-zinc-800"
                      onClick={() => {
                        setSelectedDriver(driver.id as Id<"drivers">)
                        setSelectedDriverInfo({ name: driver.name, dwcPercent: driver.dwcPercent, tier: driver.tier })
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white">{driver.name}</span>
                        <Badge className={cn("text-xs", getTierBgColor(driver.tier))}>
                          {driver.tier.charAt(0).toUpperCase() + driver.tier.slice(1)} ({driver.dwcPercent}%)
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {driverSearch && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                {filteredDrivers.map((driver) => (
                  <button
                    key={driver.id}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md p-2 text-left transition-colors hover:bg-zinc-700",
                      selectedDriver === driver.id && "bg-zinc-700",
                    )}
                    onClick={() => {
                      setSelectedDriver(driver.id as Id<"drivers">)
                      setSelectedDriverInfo({ name: driver.name, dwcPercent: driver.dwcPercent, tier: driver.tier })
                      setDriverSearch("")
                    }}
                  >
                    <span className="text-white">{driver.name}</span>
                    <Badge className={cn("text-xs", getTierBgColor(driver.tier))}>{driver.dwcPercent}% DWC</Badge>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Driver */}
            {selectedDriver && selectedDriverInfo && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{selectedDriverInfo.name}</span>
                    <Badge className={cn("text-xs", getTierBgColor(selectedDriverInfo.tier as "fantastic" | "great" | "fair" | "poor"))}>
                      {selectedDriverInfo.dwcPercent}% DWC
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-400 hover:text-white"
                    onClick={() => {
                      setSelectedDriver(null)
                      setSelectedDriverInfo(null)
                    }}
                  >
                    Changer
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Type */}
          <div className="space-y-3">
            <Label>Type d'action *</Label>
            <div className="grid grid-cols-4 gap-2">
              {actionTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                    selectedType === type
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700",
                  )}
                  onClick={() => setSelectedType(type)}
                >
                  <Icon className={cn("h-5 w-5", selectedType === type ? "text-blue-400" : "text-zinc-400")} />
                  <span className={cn("text-sm", selectedType === type ? "text-white" : "text-zinc-400")}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-3">
            <Label>Raison *</Label>
            <Input
              placeholder="Raison de l'action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border-zinc-700 bg-zinc-800"
            />
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-zinc-500">Suggestions:</span>
              {reasonSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                  onClick={() => setReason(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Target Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie d'erreur ciblée (optionnel)</Label>
              <Select value={targetCategory} onValueChange={setTargetCategory}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                  <SelectItem value="contact-miss">Contact Miss</SelectItem>
                  <SelectItem value="photo-defect">Photo Defect</SelectItem>
                  <SelectItem value="no-photo">No Photo</SelectItem>
                  <SelectItem value="otp-miss">OTP Miss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sous-catégorie (optionnel)</Label>
              <Select value={targetSubcategory} onValueChange={setTargetSubcategory}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="mailbox">Mailbox</SelectItem>
                  <SelectItem value="doorstep">Doorstep</SelectItem>
                  <SelectItem value="household">Household Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Points à aborder lors de la discussion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24 border-zinc-700 bg-zinc-800"
            />
          </div>

          {/* Follow Up Date */}
          <div className="space-y-2">
            <Label>Date de suivi</Label>
            <Select value={followUp} onValueChange={setFollowUp}>
              <SelectTrigger className="border-zinc-700 bg-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-900">
                {followUpOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!selectedDriver || !reason || isSubmitting}
          >
            {isSubmitting ? "Création..." : "Créer l'action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
