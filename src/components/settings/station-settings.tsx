"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Lock, Loader2, Save, Building2, Calendar } from "lucide-react"
import { useDashboardStore } from "@/lib/store"
import { withToast } from "@/lib/utils/mutation"

export function StationSettings() {
  const { selectedStation, setSelectedStation } = useDashboardStore()

  // Get station from Convex
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip"
  )

  // Form state
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update form when station loads
  useEffect(() => {
    if (station) {
      setName(station.name)
      setCode(station.code)
    }
  }, [station])

  // Mutation
  const updateStation = useMutation(api.stations.updateStation)

  const handleSave = async () => {
    if (!station) return

    setIsSaving(true)
    const updated = await withToast(
      updateStation({
        stationId: station._id as Id<"stations">,
        name: name !== station.name ? name : undefined,
        code: code !== station.code ? code : undefined,
      }),
      {
        loading: "Enregistrement...",
        success: "Station mise à jour",
        error: (err) => err.message || "Erreur lors de la mise à jour",
      }
    )

    if (updated) {
      setSelectedStation({
        id: updated._id,
        name: updated.name,
        code: updated.code,
      })
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  const handleCancel = () => {
    if (station) {
      setName(station.name)
      setCode(station.code)
    }
    setIsEditing(false)
  }

  const hasChanges = station && (name !== station.name || code !== station.code)

  // Loading state
  if (station === undefined) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
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
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucune station sélectionnée</h3>
          <p className="text-muted-foreground">
            Importez des données pour créer votre première station.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Station Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de la station
          </CardTitle>
          <CardDescription>
            Modifiez les informations de base de votre station
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stationCode">Code Station</Label>
              <Input
                id="stationCode"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setIsEditing(true)
                }}
                placeholder="Ex: DIF1"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Code unique de la station (ex: DIF1, DLY2)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stationName">Nom Station</Label>
              <Input
                id="stationName"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setIsEditing(true)
                }}
                placeholder="Ex: Paris Denfert"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Read-only info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                Plan
              </Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                <span className="text-sm font-medium capitalize">{station.plan}</span>
                {station.plan === "free" && (
                  <span className="text-xs text-muted-foreground">(Limité)</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Créée le
              </Label>
              <div className="p-2 rounded-md bg-muted text-sm">
                {new Date(station.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            {isEditing && (
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Annuler
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
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

      {/* Station ID (for debugging/support) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">ID Station</Label>
            <code className="block p-2 rounded bg-muted text-xs font-mono break-all">
              {station._id}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
