"use client";

import type { Id } from "@convex/_generated/dataModel";
import { AlertTriangle, MapPin, Package, Plus, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDwcBadgeClass } from "@/lib/utils/performance-color";

interface DetectCardData {
  id: string;
  driverId: Id<"drivers">;
  driverName: string;
  dwcPercent: number;
  iadcPercent: number;
  tier: "fantastic" | "great" | "fair" | "poor";
  trendPercent: number;
  deliveries: number;
  errorsCount: number;
}

interface DetectCardProps {
  data: DetectCardData;
  onPlanCoaching: (driverId: Id<"drivers">, driverName: string, dwcPercent: number) => void;
}

export function DetectCard({ data, onPlanCoaching }: DetectCardProps) {
  const TrendIcon = data.trendPercent >= 0 ? TrendingUp : TrendingDown;
  const trendColor = data.trendPercent >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-card-foreground">{data.driverName}</p>
          <Badge className={cn("mt-1 text-xs tabular-nums", getDwcBadgeClass(data.dwcPercent))}>
            {data.dwcPercent}%
          </Badge>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-bold text-card-foreground text-lg tabular-nums">{data.dwcPercent}%</p>
          <p className="text-muted-foreground text-xs">DWC</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Package className="h-3 w-3" />
          <span className="tabular-nums">{data.deliveries}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="tabular-nums">{data.iadcPercent}%</span>
        </div>
        <div className="flex items-center gap-1 text-red-400">
          <AlertTriangle className="h-3 w-3" />
          <span className="tabular-nums">{data.errorsCount}</span>
        </div>
      </div>

      {/* Trend */}
      <div className="mt-2 flex justify-end">
        <div className={cn("flex items-center gap-1", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="font-medium text-xs tabular-nums">
            {data.trendPercent > 0 ? "+" : ""}
            {data.trendPercent}%
          </span>
        </div>
      </div>

      <Button
        size="sm"
        className="mt-3 w-full"
        onClick={() => onPlanCoaching(data.driverId, data.driverName, data.dwcPercent)}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Coaching
      </Button>
    </div>
  );
}
