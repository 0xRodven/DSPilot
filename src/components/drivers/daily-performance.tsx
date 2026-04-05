"use client";

import { useState } from "react";

import Link from "next/link";

import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DriverDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getDwcTextClass } from "@/lib/utils/performance-color";

interface DailyPerformanceProps {
  driver: DriverDetail;
  week: number;
}

// Days of the week in order (Monday first)
const weekDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function DailyPerformance({ driver, week }: DailyPerformanceProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Build full week with all 7 days
  const fullWeekPerformance = weekDays.map((dayName) => {
    const existingDay = driver.dailyPerformance.find((d) => d.day === dayName);
    if (existingDay) {
      return existingDay;
    }
    return {
      day: dayName,
      date: "",
      dwcPercent: null,
      iadcPercent: null,
      deliveries: null,
      errors: null,
      concessions: 0,
      status: "non-travaille" as const,
    };
  });

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
                    <TableHead rowSpan={2} className="font-medium text-muted-foreground text-sm align-bottom">
                      Jour
                    </TableHead>
                    <TableHead rowSpan={2} className={cn(headerBase, "align-bottom")}>
                      Colis
                    </TableHead>
                    <TableHead rowSpan={2} className={cn(headerBase, "align-bottom")}>
                      Conc.
                    </TableHead>
                    <TableHead rowSpan={2} className={cn(headerBase, "align-bottom")}>
                      DWC %
                    </TableHead>
                    <TableHead
                      colSpan={5}
                      className="text-center font-medium text-muted-foreground text-xs border-border border-b-0 border-l"
                    >
                      Contact Miss
                    </TableHead>
                    <TableHead
                      colSpan={4}
                      className="text-center font-medium text-muted-foreground text-xs border-border border-b-0 border-l"
                    >
                      Photo Defect
                    </TableHead>
                    <TableHead rowSpan={2} className={cn(headerBase, "align-bottom border-border border-l")}>
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
                      <TableRow key={day.day} className="border-border transition-colors hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <div className="font-medium text-card-foreground">{day.day}</div>
                            {day.date && <div className="text-muted-foreground text-xs">{day.date}</div>}
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
                        <TableCell className={cn(cellBase, "text-card-foreground border-border border-l")}>
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
                    <TableCell className={cn(cellBase, "text-card-foreground font-semibold")}>
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
                    <TableCell className={cn(cellBase, "text-card-foreground border-border border-l")}>
                      {driver.iadcPercent}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            {/* Legend */}
            <div className="px-4 py-2 text-[11px] text-muted-foreground border-border border-t">
              BAL = Boite aux lettres · Rec = Receptionniste · LS = Safe Location · Door = Doorstep · HM = Household
              Member
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
