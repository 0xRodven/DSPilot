"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DailyPerformance as DailyPerformanceData, DriverDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getDwcTextClass } from "@/lib/utils/performance-color";
import { getDateFromWeek } from "@/lib/utils/time-context";

interface DailyPerformanceProps {
  driver: DriverDetail;
  year: number;
  week: number;
}

// Days of the week in order (Sunday first — Amazon convention)
const weekDays = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

type FullWeekRow = DailyPerformanceData & { isoDate: string; displayDate: string };

function emptyDay(dayName: string, isoDate: string, displayDate: string): FullWeekRow {
  return {
    day: dayName,
    date: isoDate,
    isoDate,
    displayDate,
    dwcPercent: null,
    iadcPercent: null,
    deliveries: null,
    errors: null,
    concessions: 0,
    status: "non-travaille",
  };
}

export function DailyPerformance({ driver, year, week }: DailyPerformanceProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Build the canonical 7 dates for this Amazon week (Sunday → Saturday)
  // and merge with the driver's actual daily performance entries.
  const fullWeekPerformance: FullWeekRow[] = useMemo(() => {
    const weekStart = getDateFromWeek(year, week); // Sunday
    return weekDays.map((dayName, idx) => {
      const date = addDays(weekStart, idx);
      const isoDate = format(date, "yyyy-MM-dd");
      const displayDate = format(date, "d MMM", { locale: fr });
      const existing = driver.dailyPerformance.find((d) => d.date === isoDate);
      if (existing) {
        return { ...existing, day: dayName, isoDate, displayDate };
      }
      return emptyDay(dayName, isoDate, displayDate);
    });
  }, [driver.dailyPerformance, year, week]);

  // Calculate totals
  const totals = fullWeekPerformance.reduce(
    (acc, day) => {
      if (day.deliveries !== null) {
        acc.deliveries += day.deliveries;
        acc.errors += day.errors ?? 0;
        acc.concessions += day.concessions ?? 0;
        acc.contactMiss += day.contactMiss ?? 0;
        acc.contactMissMailSlot += day.contactMissDetail?.mailSlot ?? 0;
        acc.contactMissReceptionist += day.contactMissDetail?.receptionist ?? 0;
        acc.contactMissSafeLocation += day.contactMissDetail?.safeLocation ?? 0;
        acc.contactMissDoorstep += day.contactMissDetail?.doorstep ?? 0;
        acc.photoDefect += day.photoDefect ?? 0;
        acc.photoDefectHM += day.photoDefectDetail?.householdMember ?? 0;
        acc.photoDefectSL += day.photoDefectDetail?.safeLocation ?? 0;
        acc.photoDefectRec += day.photoDefectDetail?.receptionist ?? 0;
        acc.daysWorked++;
      }
      return acc;
    },
    {
      deliveries: 0,
      errors: 0,
      concessions: 0,
      contactMiss: 0,
      contactMissMailSlot: 0,
      contactMissReceptionist: 0,
      contactMissSafeLocation: 0,
      contactMissDoorstep: 0,
      photoDefect: 0,
      photoDefectHM: 0,
      photoDefectSL: 0,
      photoDefectRec: 0,
      daysWorked: 0,
    },
  );

  const cellBase = "text-right tabular-nums text-sm";
  const subCell = "text-right tabular-nums text-xs text-muted-foreground";
  const headerBase = "text-right font-medium text-muted-foreground text-xs whitespace-nowrap";
  const subHeader = "text-right font-normal text-muted-foreground/70 text-[11px] whitespace-nowrap";

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
                  Reduire <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Developper <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  {/* Top-level grouped headers */}
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead rowSpan={2} className="align-bottom font-medium text-muted-foreground text-sm">
                      Jour
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className={cn(headerBase, "align-bottom")}
                      title="Volume DWC du jour (Compliant + Miss + Failed). Le total Livraisons en haut de page vient directement d'Amazon Associate Overview."
                    >
                      Vol DWC
                    </TableHead>
                    <TableHead rowSpan={2} className={cn(headerBase, "align-bottom")}>
                      Conc.
                    </TableHead>
                    <TableHead rowSpan={2} className={cn(headerBase, "align-bottom")}>
                      DWC %
                    </TableHead>
                    <TableHead
                      colSpan={5}
                      className="border-border border-b-0 border-l text-center font-medium text-muted-foreground text-xs"
                    >
                      Contact Miss
                    </TableHead>
                    <TableHead
                      colSpan={4}
                      className="border-border border-b-0 border-l text-center font-medium text-muted-foreground text-xs"
                    >
                      Photo Defect
                    </TableHead>
                    <TableHead rowSpan={2} className={cn(headerBase, "border-border border-l align-bottom")}>
                      IADC %
                    </TableHead>
                    <TableHead rowSpan={2} className={cn(headerBase, "align-bottom")}>
                      DNR
                    </TableHead>
                  </TableRow>
                  {/* Sub-headers */}
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className={cn(subHeader, "border-border border-l")}>Tot</TableHead>
                    <TableHead className={subHeader}>BAL</TableHead>
                    <TableHead className={subHeader}>Rec</TableHead>
                    <TableHead className={subHeader}>LS</TableHead>
                    <TableHead className={subHeader}>Door</TableHead>
                    <TableHead className={cn(subHeader, "border-border border-l")}>Tot</TableHead>
                    <TableHead className={subHeader}>HM</TableHead>
                    <TableHead className={subHeader}>LS</TableHead>
                    <TableHead className={subHeader}>Rec</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fullWeekPerformance.map((day) => {
                    const worked = day.deliveries !== null;
                    return (
                      <TableRow key={day.isoDate} className="border-border transition-colors hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <div className="font-medium text-card-foreground">{day.day}</div>
                            <div className="text-muted-foreground text-xs">{day.displayDate}</div>
                          </div>
                        </TableCell>
                        <TableCell className={cn(cellBase, "text-card-foreground")}>
                          {worked ? day.deliveries : "—"}
                        </TableCell>
                        <TableCell className={cellBase}>
                          {worked ? (
                            (day.concessions ?? 0) > 0 ? (
                              <span className="font-semibold text-red-400">{day.concessions}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            cellBase,
                            "font-semibold",
                            worked && day.dwcPercent !== null
                              ? getDwcTextClass(day.dwcPercent)
                              : "text-muted-foreground",
                          )}
                        >
                          {worked && day.dwcPercent !== null ? `${day.dwcPercent}%` : "—"}
                        </TableCell>
                        {/* Contact Miss sub-columns */}
                        <TableCell
                          className={cn(
                            cellBase,
                            "border-border border-l",
                            worked && (day.contactMiss ?? 0) > 0
                              ? "font-semibold text-red-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {worked ? (day.contactMiss ?? 0) : "—"}
                        </TableCell>
                        <TableCell className={subCell}>
                          {worked ? (day.contactMissDetail?.mailSlot ?? 0) || "·" : "—"}
                        </TableCell>
                        <TableCell className={subCell}>
                          {worked ? (day.contactMissDetail?.receptionist ?? 0) || "·" : "—"}
                        </TableCell>
                        <TableCell className={subCell}>
                          {worked ? (day.contactMissDetail?.safeLocation ?? 0) || "·" : "—"}
                        </TableCell>
                        <TableCell className={subCell}>
                          {worked ? (day.contactMissDetail?.doorstep ?? 0) || "·" : "—"}
                        </TableCell>
                        {/* Photo Defect sub-columns */}
                        <TableCell
                          className={cn(
                            cellBase,
                            "border-border border-l",
                            worked && (day.photoDefect ?? 0) > 0
                              ? "font-semibold text-amber-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {worked ? (day.photoDefect ?? 0) : "—"}
                        </TableCell>
                        <TableCell className={subCell}>
                          {worked ? (day.photoDefectDetail?.householdMember ?? 0) || "·" : "—"}
                        </TableCell>
                        <TableCell className={subCell}>
                          {worked ? (day.photoDefectDetail?.safeLocation ?? 0) || "·" : "—"}
                        </TableCell>
                        <TableCell className={subCell}>
                          {worked ? (day.photoDefectDetail?.receptionist ?? 0) || "·" : "—"}
                        </TableCell>
                        {/* IADC */}
                        <TableCell className={cn(cellBase, "border-border border-l text-card-foreground")}>
                          {worked && day.iadcPercent !== null ? `${day.iadcPercent}%` : "—"}
                        </TableCell>
                        {/* DNR */}
                        <TableCell className="text-right">
                          {day.dnrCount && day.dnrCount > 0 ? (
                            <Link href={`/dashboard/dnr?driver=${driver.id}`} onClick={(e) => e.stopPropagation()}>
                              <Badge
                                variant="outline"
                                className="cursor-pointer bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              >
                                {day.dnrCount}
                              </Badge>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Totals row */}
                  <TableRow className="border-border border-t-2 bg-muted/10 font-semibold hover:bg-muted/20">
                    <TableCell className="text-card-foreground text-sm">Total</TableCell>
                    <TableCell className={cn(cellBase, "font-semibold text-card-foreground")}>
                      {totals.deliveries}
                    </TableCell>
                    <TableCell
                      className={cn(cellBase, totals.concessions > 0 ? "text-red-400" : "text-muted-foreground")}
                    >
                      {totals.concessions}
                    </TableCell>
                    <TableCell className={cn(cellBase, "font-semibold", getDwcTextClass(driver.dwcPercent))}>
                      {driver.dwcPercent}%
                    </TableCell>
                    <TableCell
                      className={cn(
                        cellBase,
                        "border-border border-l",
                        totals.contactMiss > 0 ? "text-red-400" : "text-muted-foreground",
                      )}
                    >
                      {totals.contactMiss}
                    </TableCell>
                    <TableCell className={subCell}>{totals.contactMissMailSlot || "·"}</TableCell>
                    <TableCell className={subCell}>{totals.contactMissReceptionist || "·"}</TableCell>
                    <TableCell className={subCell}>{totals.contactMissSafeLocation || "·"}</TableCell>
                    <TableCell className={subCell}>{totals.contactMissDoorstep || "·"}</TableCell>
                    <TableCell
                      className={cn(
                        cellBase,
                        "border-border border-l",
                        totals.photoDefect > 0 ? "text-amber-400" : "text-muted-foreground",
                      )}
                    >
                      {totals.photoDefect}
                    </TableCell>
                    <TableCell className={subCell}>{totals.photoDefectHM || "·"}</TableCell>
                    <TableCell className={subCell}>{totals.photoDefectSL || "·"}</TableCell>
                    <TableCell className={subCell}>{totals.photoDefectRec || "·"}</TableCell>
                    <TableCell className={cn(cellBase, "border-border border-l text-card-foreground")}>
                      {driver.iadcPercent}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            {/* Legend */}
            <div className="border-border border-t px-4 py-2 text-[11px] text-muted-foreground">
              BAL = Boite aux lettres · Rec = Receptionniste · LS = Safe Location · Door = Doorstep · HM = Household
              Member
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
