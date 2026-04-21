"use client";

import { useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Calendar, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface DriverReportsSectionProps {
  driverId: Id<"drivers">;
}

export function DriverReportsSection({ driverId }: DriverReportsSectionProps) {
  const reports = useQuery(api.reporting.listReportsForDriver, { driverId, limit: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (reports === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Rapports hebdomadaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Rapports hebdomadaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucun rapport individuel stocké pour ce livreur. Les rapports sont générés chaque lundi à 13h30.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentId = selectedId ?? reports[0].id;
  const current = reports.find((r) => r.id === currentId) ?? reports[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Rapports hebdomadaires
          </CardTitle>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {reports.length} rapport{reports.length > 1 ? "s" : ""} disponible{reports.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <Select value={currentId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reports.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                S{r.week} / {r.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3 text-sm">
          <div>
            <span className="text-muted-foreground">DWC</span>
            <Badge variant="outline" className="ml-2 font-mono">
              {current.dwcPercent}%
            </Badge>
          </div>
          {current.rank != null && (
            <div>
              <span className="text-muted-foreground">Rang</span>
              <span className="ml-2 font-medium">#{current.rank}</span>
            </div>
          )}
          <div className="ml-auto text-xs text-muted-foreground">
            Généré le {new Date(current.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>

        <div
          className="driver-report-html overflow-auto rounded-lg border bg-white p-4 text-sm [&_*]:max-w-full"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML est généré par nos scripts de render, pas par user input
          dangerouslySetInnerHTML={{ __html: current.htmlContent }}
        />
      </CardContent>
    </Card>
  );
}
