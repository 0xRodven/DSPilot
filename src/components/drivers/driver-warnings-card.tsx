"use client";

import { useState } from "react";

import Link from "next/link";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, Plus, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NewWarningModal } from "@/components/warnings/new-warning-modal";
import { cn } from "@/lib/utils";

interface DriverWarningsCardProps {
  driverId: Id<"drivers">;
  stationId: Id<"stations">;
}

const LEVEL_LABELS: Record<string, string> = {
  first: "1er",
  second: "2ème",
  final: "Final",
};

const LEVEL_STYLES: Record<string, string> = {
  first: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  second: "border-orange-500/40 bg-orange-500/15 text-orange-400",
  final: "border-red-500/40 bg-red-500/15 text-red-400",
};

export function DriverWarningsCard({ driverId, stationId }: DriverWarningsCardProps) {
  const [open, setOpen] = useState(false);
  const warnings = useQuery(api.warnings.getActiveWarningsForDriver, { driverId });

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 font-semibold text-card-foreground text-base">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Avertissements actifs
            {warnings && (
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[11px]">
                {warnings.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="h-8 px-2">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {warnings === undefined ? (
            <Skeleton className="h-16 w-full" />
          ) : warnings.length === 0 ? (
            <p className="py-2 text-muted-foreground text-sm">Aucun avertissement actif</p>
          ) : (
            <div className="space-y-2">
              {warnings.slice(0, 3).map((w) => (
                <div
                  key={w.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={cn("text-[10px]", LEVEL_STYLES[w.level])}>
                        {LEVEL_LABELS[w.level]}
                      </Badge>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {format(new Date(w.issuedAt), "dd MMM", { locale: fr })}
                      </span>
                      {w.expiresAt && <span className="text-muted-foreground/70 text-xs">→ exp. {w.expiresAt}</span>}
                    </div>
                    <p className="mt-1 truncate text-sm text-card-foreground" title={w.reason}>
                      {w.reason}
                    </p>
                  </div>
                </div>
              ))}
              {warnings.length > 3 && (
                <Link
                  href={`/dashboard/warnings?driverId=${driverId}`}
                  className="flex items-center justify-end gap-1 text-muted-foreground text-xs hover:text-card-foreground"
                >
                  +{warnings.length - 3} autres
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <NewWarningModal open={open} onOpenChange={setOpen} stationId={stationId} prefillDriverId={driverId} />
    </>
  );
}
