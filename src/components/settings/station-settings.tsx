"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Lock, Info } from "lucide-react"

export function StationSettings() {
  const [stationName, setStationName] = useState("Paris Denfert")
  const [timezone, setTimezone] = useState("Europe/Paris")
  const [thresholds, setThresholds] = useState({
    fantastic: 95,
    great: 90,
    fair: 85,
  })
  const [highPerformersTarget, setHighPerformersTarget] = useState(75)

  const handleThresholdChange = (tier: "fantastic" | "great" | "fair", value: number) => {
    setThresholds((prev) => ({ ...prev, [tier]: value }))
  }

  const resetThresholds = () => {
    setThresholds({ fantastic: 95, great: 90, fair: 85 })
  }

  // Mock data for current status
  const currentHighPerformers = 40
  const totalDrivers = 64
  const currentPercentage = ((currentHighPerformers / totalDrivers) * 100).toFixed(1)
  const driversNeeded = Math.ceil((highPerformersTarget / 100) * totalDrivers) - currentHighPerformers

  return (
    <div className="space-y-6">
      {/* Station Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de la station</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stationCode">Code Station</Label>
              <div className="relative">
                <Input id="stationCode" value="DIF1" disabled className="pr-10 bg-muted" />
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stationName">Nom Station</Label>
              <Input id="stationName" value={stationName} onChange={(e) => setStationName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone" className="w-full md:w-[350px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                <SelectItem value="Europe/Berlin">Europe/Berlin (CET)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button>Enregistrer</Button>
          </div>
        </CardContent>
      </Card>

      {/* DWC Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Seuils DWC pour les tiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Fantastic */}
            <div className="rounded-lg border border-tier-fantastic/30 bg-tier-fantastic/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-tier-fantastic" />
                <span className="font-medium text-tier-fantastic">Fantastic</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">≥</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholds.fantastic}
                  onChange={(e) => handleThresholdChange("fantastic", Number(e.target.value))}
                  className="w-20 text-center"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            {/* Great */}
            <div className="rounded-lg border border-tier-great/30 bg-tier-great/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-tier-great" />
                <span className="font-medium text-tier-great">Great</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">≥</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholds.great}
                  onChange={(e) => handleThresholdChange("great", Number(e.target.value))}
                  className="w-20 text-center"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            {/* Fair */}
            <div className="rounded-lg border border-tier-fair/30 bg-tier-fair/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-tier-fair" />
                <span className="font-medium text-tier-fair">Fair</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">≥</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholds.fair}
                  onChange={(e) => handleThresholdChange("fair", Number(e.target.value))}
                  className="w-20 text-center"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            {/* Poor */}
            <div className="rounded-lg border border-tier-poor/30 bg-tier-poor/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-tier-poor" />
                <span className="font-medium text-tier-poor">Poor</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {"<"} {thresholds.fair}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            <span>Valeurs par défaut Amazon. Modifiez si votre région est différente.</span>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={resetThresholds}>
              Réinitialiser défauts
            </Button>
            <Button>Enregistrer</Button>
          </div>
        </CardContent>
      </Card>

      {/* High Performers Target */}
      <Card>
        <CardHeader>
          <CardTitle>Objectif High Performers</CardTitle>
          <CardDescription>Pourcentage cible de drivers en Fantastic ou Great</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={0}
              max={100}
              value={highPerformersTarget}
              onChange={(e) => setHighPerformersTarget(Number(e.target.value))}
              className="w-20 text-center"
            />
            <span className="text-muted-foreground">%</span>
          </div>

          <div className="space-y-2">
            <Slider
              value={[highPerformersTarget]}
              onValueChange={([value]) => setHighPerformersTarget(value)}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{highPerformersTarget}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Statut actuel: </span>
            <span className="font-medium">{currentPercentage}%</span>
            <span className="text-muted-foreground">
              {" "}
              ({currentHighPerformers}/{totalDrivers} drivers)
            </span>
            {driversNeeded > 0 && <span className="text-muted-foreground"> — Il manque {driversNeeded} drivers</span>}
          </div>

          <div className="flex justify-end">
            <Button>Enregistrer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
