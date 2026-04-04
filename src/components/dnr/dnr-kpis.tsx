"use client";

import { useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { HelpCircle, PackageX, ShieldCheck, TrendingDown, TrendingUp, Users } from "lucide-react";

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
              <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">
                {kpis.investigationsCount}
              </CardTitle>
              <CardAction>
                {kpis.investigationsDelta !== 0 ? (
                  <Badge variant="outline" className={deltaColor}>
                    {kpis.investigationsDelta > 0 ? <TrendingUp className="mr-1" /> : <TrendingDown className="mr-1" />}
                    {kpis.investigationsDelta > 0 ? "+" : ""}
                    {kpis.investigationsDelta}
                  </Badge>
                ) : (
                  <PackageX className="h-5 w-5 text-muted-foreground" />
                )}
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="text-muted-foreground">vs semaine préc.</div>
            </CardFooter>
          </Card>

          {showDnrList && dnrList && dnrList.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[320px] overflow-y-auto rounded-xl border border-white/20 bg-background/80 p-4 shadow-2xl backdrop-blur-xl">
              <p className="mb-3 font-medium text-sm">{dnrList.length} DNR — S{week}</p>
              <div className="space-y-2">
                {dnrList.map((inv) => (
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

        {/* Prevention Rate */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>Prevention Rate</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">% de DNR résolus sans confirmation — plus c'est haut, mieux c'est</p>
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

        {/* Top récidivistes */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              <span>Top récidivistes</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Livreurs avec le plus de DNR cette semaine</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <CardTitle className="text-lg">
              {kpis.topOffenders && kpis.topOffenders.length > 0
                ? kpis.topOffenders[0].name.split(" ").slice(-1)[0]
                : "—"}
            </CardTitle>
            <CardAction>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            {kpis.topOffenders && kpis.topOffenders.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {kpis.topOffenders.slice(0, 3).map((d) => (
                  <span key={d.name} className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-0.5 font-medium text-red-400 text-xs tabular-nums">
                    {d.name.split(" ").slice(-1)[0]} ({d.count})
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Aucun</div>
            )}
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
}
