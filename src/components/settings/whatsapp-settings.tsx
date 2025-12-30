"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageCircle,
  Loader2,
  Save,
  Clock,
  Calendar,
  Globe,
  Users,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react"
import { useDashboardStore } from "@/lib/store"
import { withToast } from "@/lib/utils/mutation"

const DAYS = [
  { value: "0", label: "Dimanche" },
  { value: "1", label: "Lundi" },
  { value: "2", label: "Mardi" },
  { value: "3", label: "Mercredi" },
  { value: "4", label: "Jeudi" },
  { value: "5", label: "Vendredi" },
  { value: "6", label: "Samedi" },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${i.toString().padStart(2, "0")}:00`,
}))

const TIMEZONES = [
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/London", label: "Londres (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
]

export function WhatsappSettings() {
  const { selectedStation } = useDashboardStore()
  const { user } = useUser()

  // Get station from Convex
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip"
  )

  // Get WhatsApp settings
  const settings = useQuery(
    api.whatsapp.getWhatsappSettings,
    station ? { stationId: station._id } : "skip"
  )

  // Get eligible drivers count
  const eligibleDrivers = useQuery(
    api.whatsapp.getEligibleDrivers,
    station ? { stationId: station._id } : "skip"
  )

  // Form state
  const [enabled, setEnabled] = useState(false)
  const [sendDay, setSendDay] = useState("1")
  const [sendHour, setSendHour] = useState("8")
  const [timezone, setTimezone] = useState("Europe/Paris")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled)
      setSendDay(String(settings.sendDay))
      setSendHour(String(settings.sendHour))
      setTimezone(settings.timezone)
    }
  }, [settings])

  // Mutation
  const updateSettings = useMutation(api.whatsapp.updateWhatsappSettings)

  const handleSave = async () => {
    if (!station || !user) return

    setIsSaving(true)
    await withToast(
      updateSettings({
        stationId: station._id,
        enabled,
        sendDay: parseInt(sendDay),
        sendHour: parseInt(sendHour),
        timezone,
        userId: user.id,
      }),
      {
        loading: "Enregistrement...",
        success: "Paramètres WhatsApp mis à jour",
        error: (err) => err.message || "Erreur lors de la mise à jour",
      }
    )
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleCancel = () => {
    if (settings) {
      setEnabled(settings.enabled)
      setSendDay(String(settings.sendDay))
      setSendHour(String(settings.sendHour))
      setTimezone(settings.timezone)
    }
    setIsEditing(false)
  }

  const hasChanges =
    settings &&
    (enabled !== settings.enabled ||
      sendDay !== String(settings.sendDay) ||
      sendHour !== String(settings.sendHour) ||
      timezone !== settings.timezone)

  // Loading state
  if (settings === undefined || station === undefined) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // No station selected
  if (!station) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucune station sélectionnée</h3>
          <p className="text-muted-foreground">
            Sélectionnez une station pour configurer les envois WhatsApp.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-500" />
            Récapitulatifs WhatsApp
          </CardTitle>
          <CardDescription>
            Configurez l&apos;envoi automatique des récapitulatifs hebdomadaires aux conducteurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-enabled" className="text-base font-medium">
                Activer les envois WhatsApp
              </Label>
              <p className="text-sm text-muted-foreground">
                Envoyer automatiquement les récaps hebdomadaires aux conducteurs
              </p>
            </div>
            <Switch
              id="whatsapp-enabled"
              checked={enabled}
              onCheckedChange={(value) => {
                setEnabled(value)
                setIsEditing(true)
              }}
            />
          </div>

          {/* Schedule Settings */}
          {enabled && (
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Planification
              </h4>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Day */}
                <div className="space-y-2">
                  <Label htmlFor="send-day" className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Jour d&apos;envoi
                  </Label>
                  <Select
                    value={sendDay}
                    onValueChange={(value) => {
                      setSendDay(value)
                      setIsEditing(true)
                    }}
                  >
                    <SelectTrigger id="send-day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hour */}
                <div className="space-y-2">
                  <Label htmlFor="send-hour" className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Heure d&apos;envoi
                  </Label>
                  <Select
                    value={sendHour}
                    onValueChange={(value) => {
                      setSendHour(value)
                      setIsEditing(true)
                    }}
                  >
                    <SelectTrigger id="send-hour">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => (
                        <SelectItem key={hour.value} value={hour.value}>
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    Fuseau horaire
                  </Label>
                  <Select
                    value={timezone}
                    onValueChange={(value) => {
                      setTimezone(value)
                      setIsEditing(true)
                    }}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Les récapitulatifs seront envoyés chaque{" "}
                <strong>{DAYS.find((d) => d.value === sendDay)?.label}</strong> à{" "}
                <strong>{HOURS.find((h) => h.value === sendHour)?.label}</strong> (
                {TIMEZONES.find((t) => t.value === timezone)?.label}).
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            {isEditing && (
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Annuler
              </Button>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Conducteurs éligibles
          </CardTitle>
          <CardDescription>
            Conducteurs avec numéro de téléphone et opt-in activé
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eligibleDrivers === undefined ? (
            <Skeleton className="h-16 w-full" />
          ) : eligibleDrivers.length > 0 ? (
            <Alert className="border-emerald-500/50 bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertTitle className="text-emerald-500">
                {eligibleDrivers.length} conducteur{eligibleDrivers.length > 1 ? "s" : ""} éligible
                {eligibleDrivers.length > 1 ? "s" : ""}
              </AlertTitle>
              <AlertDescription>
                Ces conducteurs recevront le récapitulatif hebdomadaire.
                <ul className="mt-2 space-y-1">
                  {eligibleDrivers.slice(0, 5).map((driver: typeof eligibleDrivers[number]) => (
                    <li key={driver._id} className="text-sm">
                      {driver.name} - {driver.phoneNumber}
                    </li>
                  ))}
                  {eligibleDrivers.length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      ... et {eligibleDrivers.length - 5} autres
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucun conducteur éligible</AlertTitle>
              <AlertDescription>
                Aucun conducteur n&apos;a de numéro de téléphone avec opt-in activé. Ajoutez les
                numéros depuis les pages individuelles des conducteurs.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            Configuration Twilio requise
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Pour activer l&apos;envoi WhatsApp, vous devez configurer les variables d&apos;environnement
            Twilio dans Convex :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <code className="bg-muted px-1 py-0.5 rounded">TWILIO_ACCOUNT_SID</code>
            </li>
            <li>
              <code className="bg-muted px-1 py-0.5 rounded">TWILIO_AUTH_TOKEN</code>
            </li>
            <li>
              <code className="bg-muted px-1 py-0.5 rounded">TWILIO_WHATSAPP_NUMBER</code>
            </li>
          </ul>
          <p className="pt-2">
            Consultez la{" "}
            <a
              href="https://www.twilio.com/docs/whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              documentation Twilio WhatsApp
            </a>{" "}
            pour plus d&apos;informations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
