"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { CheckSquare, ClipboardCheck, Clock, Search, Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { DetectCard } from "./DetectCard";
import { DoneCard } from "./DoneCard";
import { EvaluateCard } from "./EvaluateCard";
import { KanbanColumn } from "./KanbanColumn";
import { WaitingCard } from "./WaitingCard";

interface CoachingKanbanProps {
  stationId: Id<"stations">;
  year: number;
  week: number;
  onPlanCoaching: (driverId: Id<"drivers">, driverName: string, dwcPercent: number) => void;
  onEvaluateAction: (actionId: Id<"coachingActions">) => void;
}

export function CoachingKanban({ stationId, year, week, onPlanCoaching, onEvaluateAction }: CoachingKanbanProps) {
  const data = useQuery(api.coaching.getKanbanData, { stationId, year, week });

  if (data === undefined) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEmpty =
    data.detect.length === 0 && data.waiting.length === 0 && data.evaluate.length === 0 && data.done.length === 0;

  if (isEmpty) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Target className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium text-card-foreground text-lg">Aucune tâche de coaching</p>
          <p className="mt-1 text-muted-foreground text-sm">Tous les drivers sont au-dessus du seuil de 95%</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="grid h-[400px] grid-cols-1 gap-4 md:grid-cols-4">
          {/* Column 1: Detect */}
          <KanbanColumn title="DÉTECTER" count={data.detect.length} icon={Search} iconColor="text-amber-400">
            {data.detect.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Aucun driver à risque
              </div>
            ) : (
              data.detect.map((item) => <DetectCard key={item.id} data={item} onPlanCoaching={onPlanCoaching} />)
            )}
          </KanbanColumn>

          {/* Column 2: Waiting */}
          <KanbanColumn title="ATTENTE" count={data.waiting.length} icon={Clock} iconColor="text-blue-400">
            {data.waiting.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Aucune action en attente
              </div>
            ) : (
              data.waiting.map((item) => <WaitingCard key={item.id} data={item} />)
            )}
          </KanbanColumn>

          {/* Column 3: Evaluate */}
          <KanbanColumn title="EVALUER" count={data.evaluate.length} icon={ClipboardCheck} iconColor="text-emerald-400">
            {data.evaluate.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Aucune action a evaluer
              </div>
            ) : (
              data.evaluate.map((item) => <EvaluateCard key={item.id} data={item} onEvaluate={onEvaluateAction} />)
            )}
          </KanbanColumn>

          {/* Column 4: Done */}
          <KanbanColumn title="TERMINE" count={data.done.length} icon={CheckSquare} iconColor="text-violet-400">
            {data.done.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Aucune action terminee
              </div>
            ) : (
              data.done.map((item) => <DoneCard key={item.id} data={item} />)
            )}
          </KanbanColumn>
        </div>
      </CardContent>
    </Card>
  );
}
