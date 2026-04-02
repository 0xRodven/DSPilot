"use client";

import { useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Loader2,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ParsedImportData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getDwcBadgeClass } from "@/lib/utils/performance-color";

export type ImportStep = "uploading" | "parsing" | "preview" | "success" | "error";

interface ParsingStep {
  id: string;
  label: string;
  status: "done" | "in-progress" | "pending" | "error" | "warning";
  detail?: string;
}

interface ImportStateProps {
  step: ImportStep;
  progress?: number;
  filename?: string;
  parsingSteps?: ParsingStep[];
  parsedData?: ParsedImportData;
  errorMessage?: string;
  errorDetails?: string;
  successStats?: {
    driversImported: number;
    dailyRecords: number;
    weeklyRecords: number;
    newDrivers: number;
  };
  onCancel: () => void;
  onConfirm: () => void;
  onReset: () => void;
  onViewDashboard: () => void;
}

export function ImportState({
  step,
  progress = 0,
  filename,
  parsingSteps = [],
  parsedData,
  errorMessage,
  errorDetails,
  successStats,
  onCancel,
  onConfirm,
  onReset,
  onViewDashboard,
}: ImportStateProps) {
  const [showDrivers, setShowDrivers] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  if (step === "uploading") {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{filename}</p>
              <p className="text-muted-foreground text-xs">{((progress / 100) * 2.4).toFixed(1)} MB</p>
            </div>
          </div>
          <Progress value={progress} className="mb-2 h-2" />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Upload en cours...</span>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "parsing") {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <p className="font-medium text-sm">{filename}</p>
          </div>
          <Progress value={progress} className="mb-4 h-2" />
          <div className="mb-4 space-y-2">
            {parsingSteps.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                {s.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {s.status === "in-progress" && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
                {s.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
                {s.status === "error" && <XCircle className="h-4 w-4 text-red-400" />}
                {s.status === "warning" && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                <span
                  className={cn(
                    s.status === "pending" && "text-muted-foreground",
                    s.status === "in-progress" && "text-blue-400",
                  )}
                >
                  {s.label}
                </span>
                {s.detail && <span className="text-muted-foreground text-xs">({s.detail})</span>}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "preview" && parsedData) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-medium text-base">
              <FileText className="h-4 w-4" />
              {parsedData.filename}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="mr-1 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Rapport */}
          <div className="space-y-2 rounded-lg bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Station:</span>{" "}
                <span className="font-medium">
                  {parsedData.stationCode} ({parsedData.stationName})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Période:</span>{" "}
                <span className="font-medium">
                  Semaine {parsedData.week}, {parsedData.year}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Dates:</span>{" "}
                <span className="font-medium">{parsedData.weekDates}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-lg">{parsedData.driversCount}</p>
              <p className="text-muted-foreground text-xs">Drivers</p>
              <Badge variant="outline" className="mt-1 border-0 bg-emerald-500/20 text-emerald-400 text-xs">
                Complet
              </Badge>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <Calendar className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-lg">{parsedData.dailyRecordsCount}</p>
              <p className="text-muted-foreground text-xs">Daily records</p>
              <Badge variant="outline" className="mt-1 border-0 bg-emerald-500/20 text-emerald-400 text-xs">
                Complet
              </Badge>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <BarChart3 className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-lg">{parsedData.weeklyRecordsCount}</p>
              <p className="text-muted-foreground text-xs">Weekly records</p>
              <Badge variant="outline" className="mt-1 border-0 bg-emerald-500/20 text-emerald-400 text-xs">
                Complet
              </Badge>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <TrendingUp className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-lg">{parsedData.trendsData}</p>
              <p className="text-muted-foreground text-xs">Jours trends</p>
              <Badge variant="outline" className="mt-1 border-0 bg-emerald-500/20 text-emerald-400 text-xs">
                Trouvé
              </Badge>
            </div>
          </div>

          {/* Scores Station */}
          <div className="space-y-3 rounded-lg bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">DWC Station:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{parsedData.dwcScore}%</span>
                <Badge className="border-0 bg-blue-500/20 text-blue-400">Great</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">IADC Station:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{parsedData.iadcScore}%</span>
                <Badge className="border-0 bg-amber-500/20 text-amber-400">Fair</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between border-border/50 border-t pt-2">
              <span className="text-sm">Distribution DWC%:</span>
              <div className="flex items-center gap-2 text-sm tabular-nums">
                <span className="text-emerald-500" title=">=95%">
                  {parsedData.tierDistribution.fantastic}
                </span>
                <span className="text-blue-500" title="90-95%">
                  {parsedData.tierDistribution.great}
                </span>
                <span className="text-amber-500" title="85-90%">
                  {parsedData.tierDistribution.fair}
                </span>
                <span className="text-red-500" title="<85%">
                  {parsedData.tierDistribution.poor}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">&gt;=90% DWC:</span>
              <span className="font-medium tabular-nums">
                {(
                  ((parsedData.tierDistribution.fantastic + parsedData.tierDistribution.great) /
                    parsedData.driversCount) *
                  100
                ).toFixed(1)}
                % ({parsedData.tierDistribution.fantastic + parsedData.tierDistribution.great}/{parsedData.driversCount}
                )
              </span>
            </div>
          </div>

          {/* Avertissements */}
          <div className="space-y-2">
            {parsedData.existingWeek && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="text-amber-200/80 text-sm">
                  <p className="font-medium">Cette semaine existe déjà dans la base de données.</p>
                  <p className="text-xs">L&apos;import écrasera les données existantes.</p>
                </div>
              </div>
            )}
            {parsedData.newDrivers > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <p className="text-blue-200/80 text-sm">
                  {parsedData.newDrivers} driver{parsedData.newDrivers > 1 ? "s" : ""} n&apos;existai
                  {parsedData.newDrivers > 1 ? "ent" : "t"} pas et ser
                  {parsedData.newDrivers > 1 ? "ont" : "a"} créé{parsedData.newDrivers > 1 ? "s" : ""} automatiquement.
                </p>
              </div>
            )}
          </div>

          {/* Preview Données */}
          <Collapsible open={showDrivers} onOpenChange={setShowDrivers}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>Voir les {parsedData.driversCount} drivers</span>
                {showDrivers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Driver</TableHead>
                      <TableHead className="text-xs">Amazon ID</TableHead>
                      <TableHead className="text-right text-xs">DWC %</TableHead>
                      <TableHead className="text-right text-xs">IADC %</TableHead>
                      <TableHead className="text-center text-xs">Tier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.drivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            {driver.isNew && <Sparkles className="h-3 w-3 text-blue-400" />}
                            {driver.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-xs">{driver.amazonId}</TableCell>
                        <TableCell className="text-right text-sm">{driver.dwcPercent.toFixed(1)}%</TableCell>
                        <TableCell className="text-right text-sm">{driver.iadcPercent.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-xs tabular-nums", getDwcBadgeClass(driver.dwcPercent))}>
                            {driver.dwcPercent.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 text-center text-muted-foreground text-xs">
                Showing {Math.min(5, parsedData.driversCount)} of {parsedData.driversCount} drivers
              </p>
            </CollapsibleContent>
          </Collapsible>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-border/50 border-t pt-4">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmer l&apos;import
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "success" && successStats) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mb-1 font-semibold text-lg">Import terminé avec succès !</h3>
          </div>

          <div className="mb-6 space-y-2 rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{filename}</span>
            </div>
            <div className="space-y-1 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{successStats.driversImported} drivers importés</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{successStats.dailyRecords} records daily créés</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{successStats.weeklyRecords} records weekly créés</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Stats station calculées</span>
              </div>
              {successStats.newDrivers > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span>{successStats.newDrivers} nouveaux drivers créés</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={onViewDashboard}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Voir le Dashboard
            </Button>
            <Button onClick={onReset}>
              <Upload className="mr-2 h-4 w-4" />
              Importer un autre fichier
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "error") {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="mb-1 font-semibold text-lg text-red-400">Erreur lors de l&apos;import</h3>
          </div>

          <div className="mb-6 space-y-3 rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{filename}</span>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="font-medium text-red-400 text-sm">{errorMessage}</p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Le fichier ne contient pas les tableaux de données attendus. Assurez-vous d&apos;exporter le rapport
                  complet depuis Amazon Delivery Excellence avec tous les onglets visibles.
                </p>
              </div>
            </div>

            {errorDetails && (
              <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                    <span>Détails technique</span>
                    {showErrorDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-2 overflow-x-auto rounded bg-muted/50 p-2 text-xs">{errorDetails}</pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Voir la documentation
            </Button>
            <Button onClick={onReset}>
              <Upload className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
