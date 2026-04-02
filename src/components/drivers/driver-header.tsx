"use client"

import { useState } from "react"
import { useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { DriverDetail } from "@/lib/types"
import type { Id } from "@convex/_generated/dataModel"
import { getDwcTextClass, getDwcBadgeClass } from "@/lib/utils/performance-color"
import { User, Calendar, Package, Zap, GraduationCap, FileDown, MessageCircle, Phone, Pencil, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PhoneEditModal } from "./phone-edit-modal"

interface DriverHeaderProps {
  driver: DriverDetail
  driverId: Id<"drivers">
  stationId: Id<"stations">
  year: number
  week: number
  onPlanCoaching?: () => void
}

export function DriverHeader({ driver, driverId, stationId, year, week, onPlanCoaching }: DriverHeaderProps) {
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const sendManualRecap = useAction(api.whatsapp.sendManualRecap)


  const handleExportPDF = () => {
    toast.info("Export PDF", {
      description: "Fonctionnalité en cours de développement",
    })
  }

  const handleSendReport = async () => {
    if (!driver.phoneNumber) {
      setShowPhoneModal(true)
      toast.info("Numéro requis", {
        description: "Ajoutez d'abord un numéro WhatsApp pour ce conducteur",
      })
      return
    }
    if (!driver.whatsappOptIn) {
      toast.warning("Opt-in requis", {
        description: "Le conducteur doit accepter de recevoir les messages WhatsApp",
      })
      return
    }

    setIsSending(true)
    try {
      await sendManualRecap({
        driverId,
        stationId,
        year,
        week,
      })
      toast.success("Récapitulatif envoyé", {
        description: `Le récap S${week} a été envoyé à ${driver.name}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'envoi"
      toast.error("Échec de l'envoi", {
        description: message,
      })
    } finally {
      setIsSending(false)
    }
  }

  // Format phone number for display
  const formatPhone = (phone: string): string => {
    if (!phone || phone.length < 4) return phone
    const cleaned = phone.replace(/\s/g, "")
    if (cleaned.startsWith("+33") && cleaned.length === 12) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`
    }
    return phone
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Avatar and Info */}
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-card-foreground">{driver.name}</h2>
              <p className="font-mono text-sm text-muted-foreground">{driver.amazonId}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Actif depuis {driver.activeSince}
                </span>
                {/* Phone number display */}
                <button
                  onClick={() => setShowPhoneModal(true)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-0.5 hover:bg-muted transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {driver.phoneNumber ? (
                    <>
                      <span className="font-mono text-xs">{formatPhone(driver.phoneNumber)}</span>
                      {driver.whatsappOptIn && (
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      <Pencil className="h-3 w-3 opacity-50" />
                    </>
                  ) : (
                    <span className="text-xs opacity-70">Ajouter téléphone</span>
                  )}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {driver.daysActive} jours cette semaine
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  {driver.deliveries} livraisons
                </span>
                {driver.streak > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Zap className="h-4 w-4" />
                    Streak: {driver.streak} semaines ≥{driver.dwcPercent >= 95 ? "95" : "90"}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Big Badge - uses DWC% gradient colors */}
          <div
            className={cn(
              "flex flex-col items-center rounded-xl border-2 px-6 py-4",
              getDwcBadgeClass(driver.dwcPercent).replace("bg-", "border-").replace("/10", "/50"),
              getDwcBadgeClass(driver.dwcPercent).split(" ")[0],
            )}
          >
            <span className={cn("text-sm font-medium tabular-nums", getDwcTextClass(driver.dwcPercent))}>
              DWC
            </span>
            <span className={cn("text-3xl font-bold tabular-nums", getDwcTextClass(driver.dwcPercent))}>
              {driver.dwcPercent}%
            </span>
            <span className="mt-1 text-sm text-muted-foreground">
              {driver.rank !== null ? `Rang #${driver.rank} / ${driver.totalDrivers}` : "Non classé"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" className="bg-transparent" onClick={onPlanCoaching}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Planifier Coaching
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
          <Button
            variant="outline"
            className={cn(
              "bg-transparent",
              driver.phoneNumber && driver.whatsappOptIn && !isSending && "border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
            )}
            onClick={handleSendReport}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <MessageCircle className="mr-2 h-4 w-4" />
                Envoyer rapport WhatsApp
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Phone Edit Modal */}
      <PhoneEditModal
        open={showPhoneModal}
        onOpenChange={setShowPhoneModal}
        driverId={driverId}
        driverName={driver.name}
        currentPhone={driver.phoneNumber}
        currentOptIn={driver.whatsappOptIn}
      />
    </Card>
  )
}
