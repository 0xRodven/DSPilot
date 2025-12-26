"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type DriverDetail, getTierColor } from "@/lib/mock-data"
import { User, Calendar, Package, Zap, GraduationCap, FileDown, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface DriverHeaderProps {
  driver: DriverDetail
}

export function DriverHeader({ driver }: DriverHeaderProps) {
  const tierLabels = {
    fantastic: "Fantastic",
    great: "Great",
    fair: "Fair",
    poor: "Poor",
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
                    Streak: {driver.streak} semaines {tierLabels[driver.tier]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Big Badge */}
          <div
            className={cn(
              "flex flex-col items-center rounded-xl border-2 px-6 py-4",
              driver.tier === "fantastic" && "border-emerald-500/50 bg-emerald-500/10",
              driver.tier === "great" && "border-blue-500/50 bg-blue-500/10",
              driver.tier === "fair" && "border-amber-500/50 bg-amber-500/10",
              driver.tier === "poor" && "border-red-500/50 bg-red-500/10",
            )}
          >
            <span className={cn("text-sm font-medium", getTierColor(driver.tier))}>{tierLabels[driver.tier]}</span>
            <span className={cn("text-3xl font-bold", getTierColor(driver.tier))}>{driver.dwcPercent}%</span>
            <span className="mt-1 text-sm text-muted-foreground">
              Rang #{driver.rank} / {driver.totalDrivers}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" className="bg-transparent">
            <GraduationCap className="mr-2 h-4 w-4" />
            Planifier Coaching
          </Button>
          <Button variant="outline" className="bg-transparent">
            <FileDown className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
          <Button variant="outline" className="bg-transparent">
            <Mail className="mr-2 h-4 w-4" />
            Envoyer rapport au driver
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
