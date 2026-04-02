"use client";

import { useEffect, useMemo, useState } from "react";

import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { addMonths, addWeeks, format, getWeek, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  Ban,
  BookOpen,
  CalendarIcon,
  Check,
  Copy,
  Lightbulb,
  MessageSquare,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type ActionType, generateCoachingMessage } from "@/lib/coaching/coaching-message-generator";
import type { CoachingSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { withToast } from "@/lib/utils/mutation";
import { getDwcBadgeClass } from "@/lib/utils/performance-color";
import type { CoachingActionType } from "@/lib/utils/status";

interface NewActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillSuggestion?: CoachingSuggestion | null;
  stationId: Id<"stations">;
}

const actionTypes: { type: CoachingActionType; label: string; icon: typeof MessageSquare }[] = [
  { type: "discussion", label: "Discussion", icon: MessageSquare },
  { type: "warning", label: "Avertissement", icon: AlertTriangle },
  { type: "training", label: "Formation", icon: BookOpen },
  { type: "suspension", label: "Suspension", icon: Ban },
];

const reasonSuggestions = [
  "DWC sous 88% - 3 semaines consécutives",
  "Contact Miss répétitifs",
  "Tendance négative sur 4 semaines",
  "Photo Defect fréquents",
  "Nouveau passage en tier Poor",
];

export function NewActionModal({ open, onOpenChange, prefillSuggestion, stationId }: NewActionModalProps) {
  const { user } = useUser();
  const [driverSearch, setDriverSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Id<"drivers"> | null>(null);
  const [selectedDriverInfo, setSelectedDriverInfo] = useState<{
    name: string;
    dwcPercent: number;
    tier: string;
  } | null>(null);
  const [selectedType, setSelectedType] = useState<CoachingActionType>("discussion");
  const [reason, setReason] = useState("");
  const [targetCategory, setTargetCategory] = useState("");
  const [targetSubcategory, setTargetSubcategory] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date>(addWeeks(new Date(), 2));
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Get existing follow-up dates for the calendar
  const currentMonth = useMemo(() => followUpDate.getMonth() + 1, [followUpDate]);
  const currentYear = useMemo(() => followUpDate.getFullYear(), [followUpDate]);

  const followUpDates = useQuery(
    api.coaching.getFollowUpDatesForMonth,
    stationId ? { stationId, year: currentYear, month: currentMonth } : "skip",
  );

  // Get dates with follow-ups for highlighting in calendar
  const datesWithFollowUps = useMemo(() => {
    if (!followUpDates) return [];
    return followUpDates.map((f) => new Date(f.date));
  }, [followUpDates]);

  // Get drivers from Convex
  const now = new Date();
  const drivers = useQuery(api.stats.getDashboardDrivers, {
    stationId,
    year: getYear(now),
    week: getWeek(now, { weekStartsOn: 1 }),
  });

  const createAction = useMutation(api.coaching.createCoachingAction);

  // Get pipeline suggestion for selected driver
  const pipelineSuggestion = useQuery(
    api.coaching.getCoachingPipelineSuggestion,
    selectedDriver ? { driverId: selectedDriver } : "skip",
  );

  // Reset form when suggestion changes
  useEffect(() => {
    if (prefillSuggestion) {
      setSelectedDriver(prefillSuggestion.driverId as Id<"drivers">);
      setSelectedDriverInfo({
        name: prefillSuggestion.driverName,
        dwcPercent: prefillSuggestion.driverDwc,
        tier: prefillSuggestion.driverTier,
      });
      setReason(prefillSuggestion.reason);
      setTargetCategory(prefillSuggestion.mainError);
    }
  }, [prefillSuggestion]);

  const filteredDrivers = (drivers || []).filter(
    (d) =>
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.amazonId.toLowerCase().includes(driverSearch.toLowerCase()),
  );

  const suggestedDrivers = (drivers || []).filter((d) => d.tier === "poor" || d.tier === "fair").slice(0, 2);

  const handleSubmit = async () => {
    if (!selectedDriver || !reason) return;

    setIsSubmitting(true);

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
        createdBy: user?.id || "unknown",
      }),
      {
        loading: "Création de l'action...",
        success: "Action de coaching créée",
        error: "Erreur lors de la création de l'action",
      },
    );

    if (result) {
      // Generate WhatsApp message
      const message = generateCoachingMessage({
        driverName: selectedDriverInfo?.name || "",
        actionType: selectedType as ActionType,
        dwcPercent: selectedDriverInfo?.dwcPercent || 0,
        reason,
        followUpDate: followUpDate.toISOString(),
        targetCategory: targetCategory || undefined,
      });
      setGeneratedMessage(message);
      setShowSuccess(true);
    }
    setIsSubmitting(false);
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    toast.success("Message copie dans le presse-papier");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAnother = () => {
    // Reset form for new action
    setShowSuccess(false);
    setGeneratedMessage("");
    setCopied(false);
    setSelectedDriver(null);
    setSelectedDriverInfo(null);
    setReason("");
    setTargetCategory("");
    setTargetSubcategory("");
    setNotes("");
    setFollowUpDate(addWeeks(new Date(), 2));
  };

  const handleCloseAfterSuccess = () => {
    setShowSuccess(false);
    setGeneratedMessage("");
    setCopied(false);
    setSelectedDriver(null);
    setSelectedDriverInfo(null);
    setReason("");
    setTargetCategory("");
    setTargetSubcategory("");
    setNotes("");
    setFollowUpDate(addWeeks(new Date(), 2));
    onOpenChange(false);
  };

  // Handle preset selection
  const handlePreset = (preset: "1w" | "2w" | "1m") => {
    const now = new Date();
    switch (preset) {
      case "1w":
        setFollowUpDate(addWeeks(now, 1));
        break;
      case "2w":
        setFollowUpDate(addWeeks(now, 2));
        break;
      case "1m":
        setFollowUpDate(addMonths(now, 1));
        break;
    }
    setShowCalendar(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-white sm:max-w-2xl">
        {showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-5 w-5 text-emerald-400" />
                </div>
                Action creee avec succes
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="flex items-center gap-2 text-white">
                  <span className="font-medium">{selectedDriverInfo?.name}</span>
                  <Badge className={cn("text-xs tabular-nums", getDwcBadgeClass(selectedDriverInfo?.dwcPercent ?? 0))}>
                    {selectedDriverInfo?.dwcPercent}% DWC
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {actionTypes.find((a) => a.type === selectedType)?.label} - {reason}
                </p>
              </div>

              {/* WhatsApp Message Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <MessageSquare className="h-4 w-4" />
                  Message WhatsApp
                </div>
                <div className="whitespace-pre-wrap rounded-lg border border-zinc-700 bg-zinc-800 p-4 font-mono text-sm text-zinc-300">
                  {generatedMessage}
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleCreateAnother}
                className="border-zinc-700 text-zinc-400 hover:text-white"
              >
                Creer une autre action
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyMessage}
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copie !
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copier le message
                  </>
                )}
              </Button>
              <Button onClick={handleCloseAfterSuccess} className="bg-blue-600 hover:bg-blue-700">
                Fermer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Planifier une action de coaching</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Driver Selection */}
              <div className="space-y-3">
                <Label>Driver *</Label>
                <div className="relative">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-zinc-500" />
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
                            setSelectedDriver(driver.id as Id<"drivers">);
                            setSelectedDriverInfo({
                              name: driver.name,
                              dwcPercent: driver.dwcPercent,
                              tier: driver.tier,
                            });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white">{driver.name}</span>
                            <Badge className={cn("text-xs tabular-nums", getDwcBadgeClass(driver.dwcPercent))}>
                              {driver.dwcPercent}% DWC
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
                          setSelectedDriver(driver.id as Id<"drivers">);
                          setSelectedDriverInfo({
                            name: driver.name,
                            dwcPercent: driver.dwcPercent,
                            tier: driver.tier,
                          });
                          setDriverSearch("");
                        }}
                      >
                        <span className="text-white">{driver.name}</span>
                        <Badge className={cn("text-xs tabular-nums", getDwcBadgeClass(driver.dwcPercent))}>
                          {driver.dwcPercent}% DWC
                        </Badge>
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
                        <Badge className={cn("text-xs tabular-nums", getDwcBadgeClass(selectedDriverInfo.dwcPercent))}>
                          {selectedDriverInfo.dwcPercent}% DWC
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-zinc-400 hover:text-white"
                        onClick={() => {
                          setSelectedDriver(null);
                          setSelectedDriverInfo(null);
                        }}
                      >
                        Changer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Pipeline Suggestion Banner */}
                {selectedDriver && pipelineSuggestion && (
                  <div
                    className={cn(
                      "rounded-lg border p-4",
                      pipelineSuggestion.history.warningCount >= 3
                        ? "border-red-500/30 bg-red-500/10"
                        : "border-amber-500/30 bg-amber-500/10",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">
                          Suggestion: {actionTypes.find((a) => a.type === pipelineSuggestion.suggestedAction)?.label}
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">{pipelineSuggestion.reason}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                          <span>
                            {pipelineSuggestion.history.discussionCount} discussion
                            {pipelineSuggestion.history.discussionCount > 1 ? "s" : ""}
                          </span>
                          <span>
                            {pipelineSuggestion.history.trainingCount} formation
                            {pipelineSuggestion.history.trainingCount > 1 ? "s" : ""}
                          </span>
                          <span
                            className={cn(pipelineSuggestion.history.warningCount >= 3 && "font-medium text-red-400")}
                          >
                            {pipelineSuggestion.history.warningCount}/3 avertissement
                            {pipelineSuggestion.history.warningCount > 1 ? "s" : ""}
                          </span>
                        </div>

                        {pipelineSuggestion.history.warningCount >= 3 && (
                          <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>3 avertissements atteints - Suspension recommandée</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => setSelectedType(pipelineSuggestion.suggestedAction)}
                      >
                        Appliquer
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
                      <span className={cn("text-sm", selectedType === type ? "text-white" : "text-zinc-400")}>
                        {label}
                      </span>
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
              <div className="space-y-3">
                <Label>Date de suivi</Label>

                {/* Presets */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "border-zinc-700 bg-zinc-800",
                      format(followUpDate, "yyyy-MM-dd") === format(addWeeks(new Date(), 1), "yyyy-MM-dd") &&
                        "border-blue-500 bg-blue-500/10",
                    )}
                    onClick={() => handlePreset("1w")}
                  >
                    1 semaine
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "border-zinc-700 bg-zinc-800",
                      format(followUpDate, "yyyy-MM-dd") === format(addWeeks(new Date(), 2), "yyyy-MM-dd") &&
                        "border-blue-500 bg-blue-500/10",
                    )}
                    onClick={() => handlePreset("2w")}
                  >
                    2 semaines
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "border-zinc-700 bg-zinc-800",
                      format(followUpDate, "yyyy-MM-dd") === format(addMonths(new Date(), 1), "yyyy-MM-dd") &&
                        "border-blue-500 bg-blue-500/10",
                    )}
                    onClick={() => handlePreset("1m")}
                  >
                    1 mois
                  </Button>
                </div>

                {/* Selected date display */}
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-left transition-colors hover:bg-zinc-700"
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-zinc-400" />
                    <span>{format(followUpDate, "EEEE d MMMM yyyy", { locale: fr })}</span>
                  </div>
                  <span className="text-sm text-zinc-400">Modifier</span>
                </button>

                {/* Mini Calendar */}
                {showCalendar && (
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                    <Calendar
                      mode="single"
                      selected={followUpDate}
                      onSelect={(date) => {
                        if (date) {
                          setFollowUpDate(date);
                          setShowCalendar(false);
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      modifiers={{
                        hasFollowUp: datesWithFollowUps,
                      }}
                      modifiersClassNames={{
                        hasFollowUp:
                          "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-orange-400",
                      }}
                      className="rounded-md bg-transparent text-white [&_*]:text-inherit"
                    />
                    {datesWithFollowUps.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 border-zinc-700 border-t pt-2 text-xs text-zinc-400">
                        <div className="h-2 w-2 rounded-full bg-orange-400" />
                        <span>Autres suivis planifiés</span>
                      </div>
                    )}
                  </div>
                )}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
