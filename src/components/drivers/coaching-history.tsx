"use client";

import { BookOpen, Calendar, CheckCircle2, MessageSquare, Plus, RefreshCw, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DriverDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CoachingHistoryProps {
  driver: DriverDetail;
  onPlanCoaching?: () => void;
}

export function CoachingHistory({ driver, onPlanCoaching }: CoachingHistoryProps) {
  const typeIcons = {
    discussion: MessageSquare,
    formation: BookOpen,
    suivi: RefreshCw,
  };

  const typeLabels = {
    discussion: "Discussion",
    formation: "Formation",
    suivi: "Suivi",
  };

  const resultLabels = {
    ameliore: "Amélioré",
    complete: "Complété",
    "en-cours": "En cours",
  };

  const resultColors = {
    ameliore: "text-emerald-400",
    complete: "text-blue-400",
    "en-cours": "text-amber-400",
  };

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-semibold text-card-foreground text-lg">Historique Coaching</CardTitle>
        <p className="text-muted-foreground text-sm">{driver.coachingHistory.length} actions passées</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {driver.coachingHistory.map((action) => {
          const Icon = typeIcons[action.type];
          return (
            <div key={action.id} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                <span>
                  {action.week} • {action.date}
                </span>
              </div>
              <div className="mb-1 flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-card-foreground text-sm">{typeLabels[action.type]}</span>
              </div>
              <p className="mb-2 text-muted-foreground text-sm">{action.subject}</p>

              {action.impactPercent && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2 py-1">
                  <span className="text-muted-foreground text-xs">Avant → Après</span>
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="font-medium text-emerald-400 text-xs">+{action.impactPercent}%</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={cn("h-4 w-4", resultColors[action.result])} />
                <span className={cn("font-medium text-sm", resultColors[action.result])}>
                  {resultLabels[action.result]}
                </span>
              </div>
            </div>
          );
        })}

        <Button variant="outline" className="mt-2 w-full bg-transparent" onClick={onPlanCoaching}>
          <Plus className="mr-2 h-4 w-4" />
          Planifier un coaching
        </Button>
      </CardContent>
    </Card>
  );
}
