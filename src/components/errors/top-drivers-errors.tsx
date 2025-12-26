"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getTierBgColor } from "@/lib/mock-data"
import { ArrowRight, GraduationCap, User } from "lucide-react"
import type { DriverWithErrors } from "@/lib/mock-data"

interface TopDriversErrorsProps {
  drivers: DriverWithErrors[]
  totalErrors: number
  errorTypeFilter: string
  onFilterChange: (filter: string) => void
}

const metricOptions = [
  { value: "all", label: "Toutes erreurs" },
  { value: "dwc", label: "DWC Misses (tous)" },
  { value: "iadc", label: "IADC (tous)" },
  { value: "contact-miss", label: "Contact Miss" },
  { value: "photo-defect", label: "Photo Defect" },
  { value: "no-photo", label: "No Photo" },
  { value: "otp-miss", label: "OTP Miss" },
  { value: "dwc-other", label: "DWC Autre" },
  { value: "mailbox", label: "Mailbox" },
  { value: "unattended", label: "Unattended" },
  { value: "safe-place", label: "Safe Place" },
  { value: "iadc-other", label: "IADC Autre" },
  { value: "failed-attempts", label: "Tentatives échouées" },
]

const tierLabels = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
}

export function TopDriversErrors({ drivers, totalErrors, errorTypeFilter, onFilterChange }: TopDriversErrorsProps) {
  const top5TotalErrors = drivers.reduce((sum, d) => sum + d.totalErrors, 0)
  const top5Percentage = totalErrors > 0 ? ((top5TotalErrors / totalErrors) * 100).toFixed(1) : "0"
  const maxErrors = Math.max(...drivers.map((d) => d.totalErrors), 1)
  const selectedLabel = metricOptions.find((o) => o.value === errorTypeFilter)?.label || "erreurs"

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Top Drivers - Plus d'erreurs</CardTitle>
        <Select value={errorTypeFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="mt-2 w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metricOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-3 text-sm text-muted-foreground">
          Ces {drivers.length} drivers = <span className="font-medium text-foreground">{top5Percentage}%</span> des {selectedLabel.toLowerCase()}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {drivers.map((driver, index) => {
          const widthPercent = (driver.totalErrors / maxErrors) * 100

          return (
            <div key={driver.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-start gap-3">
                <span className="text-lg font-bold text-muted-foreground">{index + 1}.</span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-xs">
                    {driver.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{driver.name}</p>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded bg-muted">
                    <div className="h-full rounded bg-red-500 transition-all" style={{ width: `${widthPercent}%` }} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{driver.totalErrors} erreurs</span>
                    <span>• {driver.percentage}% du total</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge className={cn("text-xs", getTierBgColor(driver.tier))}>
                      {tierLabels[driver.tier]} ({driver.dwcPercent}% DWC)
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Principale : {driver.mainError} ({driver.mainErrorCount})
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent" asChild>
                      <Link href={`/dashboard/drivers/${driver.id}`}>
                        <User className="mr-1 h-3 w-3" />
                        Voir driver
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                      <GraduationCap className="mr-1 h-3 w-3" />
                      Coaching
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/dashboard/drivers">
            Voir tous les drivers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
