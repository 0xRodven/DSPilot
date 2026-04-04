"use client";

import { useMemo, useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  PackageX,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DnrKpisProps {
  stationId: Id<"stations">;
  year: number;
  week: number;
}

export function DnrKpis({ stationId, year, week }: DnrKpisProps) {
  const kpis = useQuery(api.dnr.getKpis, { stationId, year, week });
  const dnrList = useQuery(api.dnr.getInvestigations, { stationId, year, week });
  const [showDnrList, setShowDnrList] = useState(false);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  // Group investigations by driver name
  const groupedDnr = useMemo(() => {
    if (!dnrList) return [];
    const map = new Map<string, { name: string; items: typeof dnrList }>();
    for (const inv of dnrList) {
      const existing = map.get(inv.driverName);
      if (existing) {
        existing.items.push(inv);
      } else {
        map.set(inv.driverName, { name: inv.driverName, items: [inv] });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [dnrList]);

  if (kpis === undefined) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
      </div>
    );
  }

  const deltaColor = kpis.investigationsDelta > 0 ? "text-red-500" : "text-emerald-500";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-2 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs md:grid-cols-3 dark:*:data-[slot=card]:bg-card">
        {/* DNR Count — with hover list */}
        <fieldset
          className="relative m-0 border-0 p-0"
          onMouseEnter={() => setShowDnrList(true)}
          onMouseLeave={() => setShowDnrList(false)}
        >
          <Card className="@container/card cursor-pointer transition-colors hover:border-primary/20">
            <CardHeader>
              <CardDescription className="flex items-center gap-1">
                <span>DNR</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">Réclamations colis non reçu cette semaine</p>
                  </TooltipContent>
                </Tooltip>
              </CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">{kpis.investigationsCount}</CardTitle>
              <CardAction>
                <PackageX className="h-5 w-5 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {kpis.investigationsDelta !== 0 && (
                  <span className={`inline-flex items-center font-medium ${deltaColor}`}>
                    {kpis.investigationsDelta > 0 ? (
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                    )}
                    {kpis.investigationsDelta > 0 ? "+" : ""}
                    {kpis.investigationsDelta}
                  </span>
                )}
                <span>vs semaine préc.</span>
              </div>
            </CardFooter>
          </Card>

          {showDnrList && dnrList && dnrList.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[400px] overflow-y-auto rounded-xl border border-white/20 bg-background/80 p-4 shadow-2xl backdrop-blur-xl">
              <p className="mb-3 font-medium text-sm">
                {dnrList.length} DNR — S{week}
              </p>
              <div className="space-y-1">
                {groupedDnr.map((group) => (
                  <div key={group.name}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/80"
                      onClick={() => setExpandedDriver(expandedDriver === group.name ? null : group.name)}
                    >
                      <div className="flex items-center gap-2">
                        {expandedDriver === group.name ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="font-medium">{group.name}</span>
                      </div>
                      <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 font-medium text-red-400 text-xs tabular-nums">
                        ×{group.items.length}
                      </span>
                    </button>
                    {expandedDriver === group.name && (
                      <div className="ml-7 space-y-1 py-1">
                        {group.items.map((inv) => (
                          <div key={inv._id} className="flex items-center justify-between rounded-md px-2 py-1 text-xs">
                            <span className="font-mono text-muted-foreground">{inv.trackingId}</span>
                            <span className="text-muted-foreground">
                              {inv.concessionDatetime.split(" ")[0]?.slice(5)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* Prevention Rate */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>Taux de résolution</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">% de DNR résolus (non confirmés comme perdus) — 100% = tous résolus</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle
              className={`@[250px]/card:text-3xl text-2xl tabular-nums ${kpis.preventionRate >= 75 ? "text-emerald-400" : kpis.preventionRate >= 50 ? "text-amber-400" : "text-red-400"}`}
            >
              {kpis.preventionRate}%
            </CardTitle>
            <CardAction>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">cette semaine</div>
          </CardFooter>
        </Card>

        {/* Formal Investigations */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>Investigations</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Enquêtes formelles Amazon — plus grave qu'un simple DNR</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle
              className={`@[250px]/card:text-3xl text-2xl tabular-nums ${(kpis.formalInvestigationsCount ?? 0) > 0 ? "text-violet-400" : "text-emerald-400"}`}
            >
              {kpis.formalInvestigationsCount ?? 0}
            </CardTitle>
            <CardAction>
              <AlertTriangle
                className={`h-5 w-5 ${(kpis.formalInvestigationsCount ?? 0) > 0 ? "text-violet-400" : "text-muted-foreground"}`}
              />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              {(kpis.formalInvestigationsCount ?? 0) === 0
                ? "Aucune cette semaine"
                : `${kpis.concessionsCount ?? 0} DNR + ${kpis.formalInvestigationsCount ?? 0} enquêtes`}
            </div>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
}
