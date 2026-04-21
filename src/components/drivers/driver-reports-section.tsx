"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Calendar, Download, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface DriverReportsSectionProps {
  driverId: Id<"drivers">;
}

export function DriverReportsSection({ driverId }: DriverReportsSectionProps) {
  const reports = useQuery(api.reporting.listReportsForDriver, { driverId, limit: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(800);

  const currentId = reports && reports.length > 0 ? (selectedId ?? reports[0].id) : null;
  const current = reports?.find((r) => r.id === currentId);

  useEffect(() => {
    // Reset scroll when switching reports
    if (iframeRef.current) iframeRef.current.contentWindow?.scrollTo(0, 0);
  }, []);

  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      const height = doc.documentElement.scrollHeight || doc.body.scrollHeight;
      setIframeHeight(Math.max(height + 20, 600));
    }
  };

  const handleOpenInNewTab = () => {
    if (!current) return;
    const blob = new Blob([current.htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

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

  if (reports.length === 0 || !current) {
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
        <div className="flex items-center gap-2">
          <Select value={currentId ?? undefined} onValueChange={setSelectedId}>
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
          <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
            <Download className="mr-1 h-4 w-4" />
            Ouvrir
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
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

        <div className="overflow-hidden rounded-lg border bg-white">
          <iframe
            ref={iframeRef}
            key={current.id}
            srcDoc={current.htmlContent}
            onLoad={handleIframeLoad}
            title={`Rapport ${current.driverName} S${current.week}/${current.year}`}
            className="w-full border-0"
            style={{ height: `${iframeHeight}px` }}
            sandbox="allow-same-origin"
          />
        </div>
      </CardContent>
    </Card>
  );
}
