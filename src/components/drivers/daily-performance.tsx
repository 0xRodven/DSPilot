"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { DriverDetail } from "@/lib/types"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyPerformanceProps {
  driver: DriverDetail
}

export function DailyPerformance({ driver }: DailyPerformanceProps) {
  const [isOpen, setIsOpen] = useState(true)

  const statusLabels = {
    excellent: "Excellent",
    "tres-bon": "Très bon",
    bon: "Bon",
    moyen: "Moyen",
    "non-travaille": "Non travaillé",
  }

  const statusColors = {
    excellent: "text-emerald-400",
    "tres-bon": "text-emerald-400",
    bon: "text-blue-400",
    moyen: "text-amber-400",
    "non-travaille": "text-muted-foreground",
  }

  const statusBgColors = {
    excellent: "bg-emerald-500/20",
    "tres-bon": "bg-emerald-500/20",
    bon: "bg-blue-500/20",
    moyen: "bg-amber-500/20",
    "non-travaille": "bg-muted",
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border bg-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer flex flex-row items-center justify-between pb-2 hover:bg-muted/20 transition-colors">
            <div>
              <CardTitle className="text-lg font-semibold text-card-foreground">Performance par jour</CardTitle>
              <p className="text-sm text-muted-foreground">Semaine 50</p>
            </div>
            <Button variant="ghost" size="sm">
              {isOpen ? (
                <>
                  Réduire <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Développer <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Jour</TableHead>
                    <TableHead className="text-right text-muted-foreground">DWC %</TableHead>
                    <TableHead className="text-right text-muted-foreground">IADC %</TableHead>
                    <TableHead className="text-right text-muted-foreground">Livraisons</TableHead>
                    <TableHead className="text-right text-muted-foreground">Erreurs</TableHead>
                    <TableHead className="text-muted-foreground">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driver.dailyPerformance.map((day) => (
                    <TableRow key={day.day} className="border-border">
                      <TableCell>
                        <div>
                          <div className="font-medium text-card-foreground">{day.day}</div>
                          <div className="text-xs text-muted-foreground">{day.date}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-card-foreground">
                        {day.dwcPercent !== null ? `${day.dwcPercent}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground">
                        {day.iadcPercent !== null ? `${day.iadcPercent}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground">
                        {day.deliveries !== null ? day.deliveries : "-"}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground">
                        {day.errors !== null ? day.errors : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusBgColors[day.status],
                            statusColors[day.status],
                          )}
                        >
                          {statusLabels[day.status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
