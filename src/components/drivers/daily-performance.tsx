"use client";

import { useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DriverDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DailyPerformanceProps {
  driver: DriverDetail;
  week: number;
}

// Days of the week in order (Monday first)
const weekDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function DailyPerformance({ driver, week }: DailyPerformanceProps) {
  const [isOpen, setIsOpen] = useState(true);

  const statusLabels = {
    excellent: "Excellent",
    "tres-bon": "Très bon",
    bon: "Bon",
    moyen: "Moyen",
    "non-travaille": "Non travaillé",
  };

  // Build full week with all 7 days
  const fullWeekPerformance = weekDays.map((dayName) => {
    const existingDay = driver.dailyPerformance.find((d) => d.day === dayName);
    if (existingDay) {
      return existingDay;
    }
    // Return empty day for days without data
    return {
      day: dayName,
      date: "",
      dwcPercent: null,
      iadcPercent: null,
      deliveries: null,
      errors: null,
      status: "non-travaille" as const,
    };
  });

  const statusColors = {
    excellent: "text-emerald-400",
    "tres-bon": "text-emerald-400",
    bon: "text-blue-400",
    moyen: "text-amber-400",
    "non-travaille": "text-muted-foreground",
  };

  const statusBgColors = {
    excellent: "bg-emerald-500/20",
    "tres-bon": "bg-emerald-500/20",
    bon: "bg-blue-500/20",
    moyen: "bg-amber-500/20",
    "non-travaille": "bg-muted",
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border bg-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between pb-2 transition-colors hover:bg-muted/20">
            <div>
              <CardTitle className="font-semibold text-card-foreground text-lg">Performance par jour</CardTitle>
              <p className="text-muted-foreground text-sm">Semaine {week}</p>
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
                  {fullWeekPerformance.map((day) => (
                    <TableRow key={day.day} className="border-border">
                      <TableCell>
                        <div>
                          <div className="font-medium text-card-foreground">{day.day}</div>
                          {day.date && <div className="text-muted-foreground text-xs">{day.date}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-card-foreground tabular-nums">
                        {day.dwcPercent !== null ? `${day.dwcPercent}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground tabular-nums">
                        {day.iadcPercent !== null ? `${day.iadcPercent}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground tabular-nums">
                        {day.deliveries !== null ? day.deliveries : "-"}
                      </TableCell>
                      <TableCell className="text-right text-card-foreground tabular-nums">
                        {day.errors !== null ? day.errors : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs",
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
  );
}
