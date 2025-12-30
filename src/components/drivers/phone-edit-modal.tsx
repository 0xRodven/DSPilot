"use client"

import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Phone, MessageCircle, AlertCircle, Check } from "lucide-react"
import { toast } from "sonner"
import type { Id } from "@convex/_generated/dataModel"

interface PhoneEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driverId: Id<"drivers">
  driverName: string
  currentPhone?: string | null
  currentOptIn?: boolean
}

// Regex pour validation E.164
const E164_REGEX = /^\+[1-9]\d{1,14}$/

export function PhoneEditModal({
  open,
  onOpenChange,
  driverId,
  driverName,
  currentPhone,
  currentOptIn,
}: PhoneEditModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(currentPhone || "")
  const [optIn, setOptIn] = useState(currentOptIn ?? false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updatePhone = useMutation(api.whatsapp.updateDriverPhone)
  const toggleOptIn = useMutation(api.whatsapp.toggleDriverWhatsappOptIn)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPhoneNumber(currentPhone || "")
      setOptIn(currentOptIn ?? false)
      setError(null)
    }
  }, [open, currentPhone, currentOptIn])

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Optionnel
    return E164_REGEX.test(phone)
  }

  const formatPhoneForDisplay = (phone: string): string => {
    // Formater pour affichage: +33 6 12 34 56 78
    if (!phone || phone.length < 4) return phone

    // Garder le + et le code pays, puis grouper par 2
    const cleaned = phone.replace(/\s/g, "")
    if (cleaned.startsWith("+33") && cleaned.length === 12) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`
    }
    return phone
  }

  const handlePhoneChange = (value: string) => {
    // Nettoyer et formater l'entrée
    let cleaned = value.replace(/[^\d+]/g, "")

    // Auto-ajouter le + au début
    if (cleaned && !cleaned.startsWith("+")) {
      cleaned = "+" + cleaned
    }

    setPhoneNumber(cleaned)
    setError(null)
  }

  const handleSubmit = async () => {
    // Validation
    if (phoneNumber && !validatePhone(phoneNumber)) {
      setError("Format invalide. Utilisez le format international (ex: +33612345678)")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Mettre à jour le numéro
      await updatePhone({
        driverId,
        phoneNumber: phoneNumber || null,
      })

      // Mettre à jour l'opt-in seulement si le numéro est présent
      if (phoneNumber) {
        await toggleOptIn({
          driverId,
          optIn,
        })
      }

      toast.success("Numéro de téléphone mis à jour", {
        description: optIn && phoneNumber
          ? "Le conducteur recevra les récapitulatifs WhatsApp"
          : "Le numéro a été enregistré",
      })

      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la mise à jour"
      setError(message)
      toast.error("Erreur", { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemovePhone = async () => {
    setIsSubmitting(true)
    try {
      await updatePhone({
        driverId,
        phoneNumber: null,
      })
      toast.success("Numéro supprimé")
      onOpenChange(false)
    } catch (err) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Numéro WhatsApp
          </DialogTitle>
          <DialogDescription>
            Configurer le numéro WhatsApp pour {driverName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Champ téléphone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                placeholder="+33612345678"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={error ? "border-red-500 pr-10" : ""}
              />
              {phoneNumber && validatePhone(phoneNumber) && (
                <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Format international requis (ex: +33612345678)
            </p>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Toggle opt-in */}
          {phoneNumber && validatePhone(phoneNumber) && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="whatsapp-optin" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  Récapitulatifs WhatsApp
                </Label>
                <p className="text-sm text-muted-foreground">
                  Envoyer les récaps hebdomadaires automatiquement
                </p>
              </div>
              <Switch
                id="whatsapp-optin"
                checked={optIn}
                onCheckedChange={setOptIn}
              />
            </div>
          )}

          {/* Info opt-in */}
          {optIn && phoneNumber && (
            <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
              Le conducteur recevra un récapitulatif de ses performances chaque semaine.
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {currentPhone && (
            <Button
              variant="ghost"
              onClick={handleRemovePhone}
              disabled={isSubmitting}
              className="text-red-500 hover:text-red-600"
            >
              Supprimer le numéro
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
