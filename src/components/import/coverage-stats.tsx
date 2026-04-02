"use client";

import { AlertTriangle, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeekCoverage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CoverageStatsProps {
  stationCode: string;
  year: number;
  coverage: WeekCoverage[];
}

const getCoverageColor = (status: WeekCoverage["status"]) => {
  switch (status) {
    case "complete":
      return "bg-emerald-500";
    case "partial":
      return "bg-amber-500";
    case "failed":
      return "bg-red-500";
    case "missing":
      return "bg-muted-foreground/20";
  }
};

export function CoverageStats({ stationCode, year, coverage }: CoverageStatsProps) {
  // Get current quarter (Q4 = weeks 40-52)
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Define quarter ranges
  const quarterRanges: Record<number, { start: number; end: number; months: string[] }> = {
    1: { start: 1, end: 13, months: ["Jan", "Fév", "Mar"] },
    2: { start: 14, end: 26, months: ["Avr", "Mai", "Jun"] },
    3: { start: 27, end: 39, months: ["Jul", "Aoû", "Sep"] },
    4: { start: 40, end: 52, months: ["Oct", "Nov", "Déc"] },
  };

  const range = quarterRanges[currentQuarter];
  const quarterlyCoverage = coverage.filter((c) => c.week >= range.start && c.week <= range.end);

  const completed = quarterlyCoverage.filter((c) => c.status === "complete").length;
  const total = quarterlyCoverage.length;
  const percentage = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";
  const missing = quarterlyCoverage.filter((c) => c.status === "missing");
  const failed = quarterlyCoverage.filter((c) => c.status === "failed");

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="font-medium text-base">Couverture des données</CardTitle>
        <p className="text-muted-foreground text-xs">
          Station {stationCode} • {year}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">Q{currentQuarter}</p>
          {quarterlyCoverage.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-sm">Aucune donnée de couverture</div>
          ) : (
            <>
              {/* Split into 3 rows of ~4-5 weeks each */}
              {range.months.map((month, idx) => {
                const weeksPerMonth = Math.ceil(quarterlyCoverage.length / 3);
                const monthWeeks = quarterlyCoverage.slice(idx * weeksPerMonth, (idx + 1) * weeksPerMonth);
                return (
                  <div key={month} className="flex items-center gap-1">
                    <span className="w-8 text-muted-foreground text-xs">{month}</span>
                    <div className="flex flex-1 gap-1">
                      {monthWeeks.map((c) => (
                        <div
                          key={c.week}
                          className={cn(
                            "flex h-6 flex-1 items-center justify-center rounded font-medium text-xs",
                            getCoverageColor(c.status),
                            c.status === "missing" ? "text-muted-foreground" : "text-white",
                          )}
                          title={`S${c.week}`}
                        >
                          {c.week}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-emerald-500" />
            <span>Complet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-amber-500" />
            <span>Partiel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span>Échec</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-muted-foreground/20" />
            <span>Non importé</span>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="font-semibold text-lg">
              {completed}/{total}
            </p>
            <p className="text-muted-foreground text-xs">Semaines importées</p>
            <p className="text-muted-foreground text-xs">Q4 {year}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="font-semibold text-lg">{percentage}%</p>
            <p className="text-muted-foreground text-xs">Couverture</p>
            <p className="text-muted-foreground text-xs">Ce trimestre</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="font-semibold text-lg">
              {missing.length > 0 ? `S${missing.map((m) => m.week).join(", S")}` : "-"}
            </p>
            <p className="text-muted-foreground text-xs">À importer</p>
            <p className="text-muted-foreground text-xs">Semaines manquantes</p>
          </div>
        </div>

        {/* Alerts */}
        {failed.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="flex-1 text-amber-200/80 text-sm">
              Semaine {failed.map((f) => f.week).join(", ")} en échec.
            </span>
            <Button variant="ghost" size="sm" className="shrink-0 text-amber-400 text-xs">
              Ré-importer
            </Button>
          </div>
        )}
        {missing.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <Info className="h-4 w-4 shrink-0 text-blue-400" />
            <span className="text-blue-200/80 text-sm">
              Semaines {missing.map((m) => m.week).join(" et ")} pas encore disponibles.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
