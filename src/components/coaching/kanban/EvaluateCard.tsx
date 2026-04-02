"use client";

import type { Id } from "@convex/_generated/dataModel";
import { AlertTriangle, Ban, BookOpen, ClipboardCheck, MessageSquare, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionType = "discussion" | "warning" | "training" | "suspension";

interface EvaluateCardData {
  id: Id<"coachingActions">;
  driverId: Id<"drivers">;
  driverName: string;
  actionType: ActionType;
  dwcAtAction: number;
  currentDwc: number;
  dwcDelta: number;
  reason: string;
  followUpDate?: string;
  daysOverdue: number;
  createdAt: string;
}

interface EvaluateCardProps {
  data: EvaluateCardData;
  onEvaluate: (actionId: Id<"coachingActions">) => void;
}

const actionConfig: Record<ActionType, { icon: typeof MessageSquare; label: string; color: string }> = {
  discussion: { icon: MessageSquare, label: "Discussion", color: "text-blue-400" },
  warning: { icon: AlertTriangle, label: "Avertissement", color: "text-amber-400" },
  training: { icon: BookOpen, label: "Formation", color: "text-emerald-400" },
  suspension: { icon: Ban, label: "Suspension", color: "text-red-400" },
};

export function EvaluateCard({ data, onEvaluate }: EvaluateCardProps) {
  const config = actionConfig[data.actionType];
  const Icon = config.icon;

  const TrendIcon = data.dwcDelta >= 0 ? TrendingUp : TrendingDown;
  const deltaColor = data.dwcDelta >= 0 ? "text-emerald-400" : "text-red-400";
  const deltaSign = data.dwcDelta >= 0 ? "+" : "";

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-card-foreground">{data.driverName}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
            <span className={cn("font-medium text-xs", config.color)}>{config.label}</span>
          </div>
        </div>
        {data.daysOverdue > 0 && (
          <Badge variant="destructive" className="flex-shrink-0 text-xs">
            +{data.daysOverdue}j
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{data.dwcAtAction}%</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium text-card-foreground text-sm">{data.currentDwc}%</span>
        </div>
        <div className={cn("flex items-center gap-1", deltaColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="font-medium text-xs">
            {deltaSign}
            {data.dwcDelta}%
          </span>
        </div>
      </div>

      <Button size="sm" className="mt-3 w-full" onClick={() => onEvaluate(data.id)}>
        <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
        Évaluer
      </Button>
    </div>
  );
}
