"use client";

import type { Id } from "@convex/_generated/dataModel";
import { ArrowUpRight, CheckCircle, TrendingDown, TrendingUp, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { actionConfig } from "./WaitingCard";

type ActionType = "discussion" | "warning" | "training" | "suspension";
// Include all possible status values from Convex, even though we only display done ones
type ActionStatus = "pending" | "improved" | "no_effect" | "escalated";
type DoneStatus = "improved" | "no_effect" | "escalated";

interface DoneCardData {
  id: Id<"coachingActions">;
  driverId: Id<"drivers">;
  driverName: string;
  actionType: ActionType;
  status: ActionStatus;
  dwcAtAction: number;
  dwcAfterAction?: number;
  dwcDelta: number;
  reason: string;
  evaluatedAt?: string;
}

interface DoneCardProps {
  data: DoneCardData;
}

const statusConfig: Record<
  DoneStatus,
  { icon: typeof CheckCircle; label: string; color: string; borderColor: string }
> = {
  improved: { icon: CheckCircle, label: "Ameliore", color: "text-emerald-400", borderColor: "border-emerald-500/30" },
  no_effect: { icon: XCircle, label: "Sans effet", color: "text-amber-400", borderColor: "border-amber-500/30" },
  escalated: { icon: ArrowUpRight, label: "Escalade", color: "text-red-400", borderColor: "border-red-500/30" },
};

export function DoneCard({ data }: DoneCardProps) {
  const actionCfg = actionConfig[data.actionType];
  // Cast to DoneStatus since we know backend filters to only done statuses
  const statusCfg = statusConfig[data.status as DoneStatus] ?? statusConfig.improved;
  const ActionIcon = actionCfg.icon;
  const StatusIcon = statusCfg.icon;

  const TrendIcon = data.dwcDelta >= 0 ? TrendingUp : TrendingDown;
  const deltaColor = data.dwcDelta >= 0 ? "text-emerald-400" : "text-red-400";
  const deltaSign = data.dwcDelta >= 0 ? "+" : "";

  return (
    <div className={cn("rounded-lg border bg-card p-3", statusCfg.borderColor)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-card-foreground">{data.driverName}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <ActionIcon className={cn("h-3.5 w-3.5", actionCfg.color)} />
            <span className={cn("font-medium text-xs", actionCfg.color)}>{actionCfg.label}</span>
          </div>
        </div>
        <Badge variant="outline" className={cn("flex-shrink-0 gap-1 text-xs", statusCfg.color)}>
          <StatusIcon className="h-3 w-3" />
          {statusCfg.label}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{data.dwcAtAction}%</span>
          <span className="text-muted-foreground">-&gt;</span>
          <span className="font-medium text-card-foreground text-sm">{data.dwcAfterAction ?? "-"}%</span>
        </div>
        <div className={cn("flex items-center gap-1", deltaColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="font-medium text-xs">
            {deltaSign}
            {data.dwcDelta}%
          </span>
        </div>
      </div>
    </div>
  );
}
