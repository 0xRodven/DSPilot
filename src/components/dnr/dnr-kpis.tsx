"use client";

import { useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { PackageX, Search, TrendingDown, TrendingUp, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DnrKpisProps {
  stationId: Id<"stations">;
  year: number;
  week: number;
}

export function DnrKpis({ stationId, year, week }: DnrKpisProps) {
  const kpis = useQuery(api.dnr.getKpis, { stationId, year, week });
  const investigations = useQuery(api.dnr.getInvestigations, { stationId, year, week });
  const [showInvestigations, setShowInvestigations] = useState(false);

  if (kpis === undefined) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
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
      {/* DNR Count */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">DNR</p>
            <PackageX className="h-4 w-4 text-muted-foreground" />
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

      {/* Investigations — with hover modal */}
      <fieldset
        className="relative m-0 border-0 p-0"
        onMouseEnter={() => setShowInvestigations(true)}
        onMouseLeave={() => setShowInvestigations(false)}
      >
        <Card className="cursor-pointer transition-colors hover:border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Investigations</p>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-bold text-2xl">{kpis.investigationsCount}</span>
              <span className="text-muted-foreground text-xs">cette semaine</span>
            </div>
          </CardContent>
        </Card>

        {/* Glassmorphism hover modal */}
        {showInvestigations && investigations && investigations.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[320px] overflow-y-auto rounded-xl border border-white/20 bg-background/80 p-4 shadow-2xl backdrop-blur-xl">
            <p className="mb-3 font-medium text-sm">
              {investigations.length} investigation(s) — S{week}
            </p>
            <div className="space-y-2">
              {investigations.map((inv) => (
                <div
                  key={inv._id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{inv.driverName}</span>
                    <span className="ml-2 font-mono text-muted-foreground text-xs">{inv.trackingId}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {inv.concessionDatetime.split(" ")[0]?.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      {/* Top récidivistes — semaine courante */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Top récidivistes</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 space-y-1">
            {kpis.topOffenders && kpis.topOffenders.length > 0 ? (
              kpis.topOffenders.slice(0, 3).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className={i === 0 ? "font-bold" : "text-muted-foreground"}>
                    {d.name.split(" ").slice(-1)[0]}
                  </span>
                  <span className="font-medium text-red-400 tabular-nums">{d.count}</span>
                </div>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">Aucun</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
