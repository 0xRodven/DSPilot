"use client";

import { useRouter } from "next/navigation";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/calculations";
import { useFilters } from "@/lib/filters";
import { useDashboardStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TopErrors() {
  const router = useRouter();
  const { selectedStation } = useDashboardStore();
  const { year, weekNum, displayLabel } = useFilters();

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  // Get error breakdown from Convex
  const errorBreakdown = useQuery(
    api.stats.getErrorBreakdown,
    station ? { stationId: station._id, year, week: weekNum } : "skip",
  );

  const periodLabel = displayLabel;

  // Loading state
  if (!station || errorBreakdown === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-1 h-3 w-32" />
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="mt-1.5 h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Transform error breakdown into top errors list
  const allErrors: { id: string; name: string; count: number; trend: number | null }[] = [];

  if (errorBreakdown) {
    // DWC errors
    const dwcCategory = errorBreakdown.find((cat) => cat.id === "dwc");
    if (dwcCategory) {
      dwcCategory.subcategories.forEach((sub) => {
        if (sub.count > 0) {
          allErrors.push({
            id: `dwc-${sub.name}`,
            name: sub.name,
            count: sub.count,
            trend: sub.trend ?? null,
          });
        }
      });
    }

    // IADC errors
    const iadcCategory = errorBreakdown.find((cat) => cat.id === "iadc");
    if (iadcCategory) {
      iadcCategory.subcategories.forEach((sub) => {
        if (sub.count > 0) {
          allErrors.push({
            id: `iadc-${sub.name}`,
            name: sub.name,
            count: sub.count,
            trend: sub.trend ?? null,
          });
        }
      });
    }

    // Failed attempts
    const falseScans = errorBreakdown.find((cat) => cat.id === "false-scans");
    if (falseScans && falseScans.total > 0) {
      allErrors.push({
        id: "false-scans",
        name: "MS - Tentatives échouées",
        count: falseScans.total,
        trend: falseScans.trend ?? null,
      });
    }
  }

  // Sort by count and take top 5
  const topErrors = allErrors.sort((a, b) => b.count - a.count).slice(0, 5);

  const totalErrors = allErrors.reduce((sum, error) => sum + error.count, 0);
  const maxCount = topErrors.length > 0 ? topErrors[0].count : 0;

  // No data state
  if (topErrors.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-semibold text-base text-card-foreground">Top 5 Erreurs</CardTitle>
          <p className="text-muted-foreground text-xs">{periodLabel} • 0 total</p>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="py-8 text-center text-muted-foreground text-sm">Aucune erreur pour cette période</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-semibold text-base text-card-foreground">Top 5 Erreurs</CardTitle>
        <p className="text-muted-foreground text-xs">
          {periodLabel} • {formatNumber(totalErrors)} total
        </p>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-4">
          {topErrors.map((error, index) => {
            const percentage = maxCount > 0 ? Math.round((error.count / maxCount) * 100) : 0;
            return (
              <div key={error.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground text-xs">#{index + 1}</span>
                    <span className="font-medium text-card-foreground text-sm">{error.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {error.trend !== null && error.trend !== 0 && (
                      <span
                        className={cn(
                          "flex items-center gap-0.5 font-medium text-xs",
                          error.trend > 0 ? "text-red-500" : "text-emerald-500",
                        )}
                      >
                        {error.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {error.trend > 0 ? "+" : ""}
                        {error.trend}
                      </span>
                    )}
                    <span className="font-semibold text-card-foreground text-sm tabular-nums">
                      {formatNumber(error.count)}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500/80 to-red-400/60"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-muted-foreground text-xs tabular-nums">
                    {totalErrors > 0 ? Math.round((error.count / totalErrors) * 100) : 0}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          className="mt-4 w-full text-primary hover:text-primary"
          onClick={() => router.push("/dashboard/errors")}
        >
          Voir analyse →
        </Button>
      </CardContent>
    </Card>
  );
}
