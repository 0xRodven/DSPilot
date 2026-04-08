"use client";

import { useState } from "react";

import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { addMonths, format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { describeDriver } from "@/lib/utils/driver-display";

interface NewWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stationId: Id<"stations">;
  prefillDriverId?: Id<"drivers">;
}

const LEVELS = [
  { value: "first", label: "1er avertissement" },
  { value: "second", label: "2ème avertissement" },
  { value: "final", label: "Avertissement final" },
] as const;

export function NewWarningModal({ open, onOpenChange, stationId, prefillDriverId }: NewWarningModalProps) {
  const { user } = useUser();
  const [driverId, setDriverId] = useState<Id<"drivers"> | "">("");
  const [level, setLevel] = useState<"first" | "second" | "final">("first");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState(format(addMonths(new Date(), 6), "yyyy-MM-dd"));
  const [submitting, setSubmitting] = useState(false);

  // Resolve drivers for the station so we can pick one
  const drivers = useQuery(api.drivers.listDrivers, { stationId, activeOnly: true });
  const createWarning = useMutation(api.warnings.createWarning);

  const effectiveDriverId = (prefillDriverId ?? (driverId as Id<"drivers"> | "")) || "";

  const handleSubmit = async () => {
    if (!effectiveDriverId) {
      toast.error("Sélectionne un livreur");
      return;
    }
    if (!reason.trim()) {
      toast.error("Ajoute un motif");
      return;
    }
    setSubmitting(true);
    try {
      await createWarning({
        stationId,
        driverId: effectiveDriverId as Id<"drivers">,
        level,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        expiresAt: expiresAt || undefined,
        issuedBy: user?.id ?? "system",
      });
      toast.success("Avertissement créé");
      onOpenChange(false);
      // Reset form
      setReason("");
      setNotes("");
      setLevel("first");
      if (!prefillDriverId) setDriverId("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error("Création impossible", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel avertissement</DialogTitle>
          <DialogDescription>
            Créer un avertissement formel pour un livreur. Apparaîtra dans la page Avertissements et sur le profil
            livreur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!prefillDriverId && (
            <div className="space-y-2">
              <Label>Livreur</Label>
              <Select value={driverId as string} onValueChange={(v) => setDriverId(v as Id<"drivers">)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un livreur..." />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {drivers?.map((d) => {
                    const display = describeDriver(d.name, d.amazonId);
                    return (
                      <SelectItem key={d._id} value={d._id}>
                        {display.label} {display.isWalker ? "(walker)" : ""} — {d.amazonId}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Niveau</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as "first" | "second" | "final")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Motif</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : DWC sous 88 % depuis 4 semaines consécutives"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Détails, contexte, actions précédentes..."
              className="min-h-20"
            />
          </div>

          <div className="space-y-2">
            <Label>Date d&apos;expiration</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            <p className="text-muted-foreground text-xs">Par défaut : 6 mois après aujourd&apos;hui</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Création..." : "Créer l'avertissement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
