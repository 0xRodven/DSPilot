"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { AlertTriangle, ShieldCheck, TrendingDown, TrendingUp, User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DnrKpisProps {
  stationId: Id<"stations">;
  year: number;
  week: number;
}

export function DnrKpis({ stationId, year, week }: DnrKpisProps) {
  const kpis = useQuery(api.dnr.getKpis, { stationId, year, week });

  if (kpis === undefined) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const deltaColor =
    kpis.investigationsDelta > 0
      ? "text-red-400"
      : kpis.investigationsDelta < 0
        ? "text-emerald-400"
        : "text-muted-foreground";

  const DeltaIcon = kpis.investigationsDelta > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Investigations</p>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-bold text-2xl">{kpis.investigationsCount}</span>
            {kpis.investigationsDelta !== 0 && (
              <span className={`flex items-center text-xs ${deltaColor}`}>
                <DeltaIcon className="mr-0.5 h-3 w-3" />
                {Math.abs(kpis.investigationsDelta)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Prevention Rate</p>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span
              className={`font-bold text-2xl ${kpis.preventionRate >= 75 ? "text-emerald-400" : kpis.preventionRate >= 50 ? "text-amber-400" : "text-red-400"}`}
            >
              {kpis.preventionRate}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Top recidiviste (4 sem.)</p>
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            {kpis.topOffender ? (
              <div>
                <span className="font-bold text-lg">{kpis.topOffender.name.split(" ").pop()}</span>
                <span className="ml-2 text-red-400 text-sm">({kpis.topOffender.count})</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Aucun</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
