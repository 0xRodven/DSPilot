"use client";

import { useState } from "react";

import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Plus, ShieldAlert, ShieldX, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewWarningModal } from "@/components/warnings/new-warning-modal";
import { useDashboardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { describeDriver } from "@/lib/utils/driver-display";

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

const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  expired: "border-zinc-500/40 bg-zinc-500/15 text-zinc-400",
  cancelled: "border-zinc-500/40 bg-zinc-500/15 text-zinc-500",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  expired: "Expiré",
  cancelled: "Annulé",
};

export default function WarningsPage() {
  const { user } = useUser();
  const { selectedStation } = useDashboardStore();
  const [statusFilter, setStatusFilter] = useState<"active" | "expired" | "cancelled" | "all">("active");
  const [newOpen, setNewOpen] = useState(false);

  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  const stats = useQuery(api.warnings.getWarningsStats, station ? { stationId: station._id } : "skip");
  const warnings = useQuery(
    api.warnings.listWarnings,
    station ? { stationId: station._id, status: statusFilter } : "skip",
  );

  const cancelWarning = useMutation(api.warnings.cancelWarning);

  if (!station) {
    return (
      <main className="min-h-[calc(100vh-4rem)] p-6">
        <Skeleton className="mb-4 h-8 w-64" />
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[110px]" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </main>
    );
  }

  const handleCancel = async (warningId: Id<"warnings">) => {
    if (!confirm("Annuler cet avertissement ?")) return;
    try {
      await cancelWarning({ warningId, cancelledBy: user?.id ?? "system" });
      toast.success("Avertissement annulé");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error("Annulation impossible", { description: message });
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Avertissements</h1>
          <p className="text-muted-foreground">
            Suivi des avertissements formels — pipeline d&apos;escalation 1er → 2ème → Final → Suspension
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel avertissement
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total actifs</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{stats?.active ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              1er avertissement
            </CardDescription>
            <CardTitle className="text-3xl text-amber-400 tabular-nums">{stats?.first ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-orange-400" />
              2ème avertissement
            </CardDescription>
            <CardTitle className="text-3xl text-orange-400 tabular-nums">{stats?.second ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ShieldX className="h-3.5 w-3.5 text-red-400" />
              Avertissement final
            </CardDescription>
            <CardTitle className="text-3xl text-red-400 tabular-nums">{stats?.final ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter tabs + table */}
      <Card>
        <CardHeader>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <TabsList>
              <TabsTrigger value="active">Actifs</TabsTrigger>
              <TabsTrigger value="expired">Expirés</TabsTrigger>
              <TabsTrigger value="cancelled">Annulés</TabsTrigger>
              <TabsTrigger value="all">Tous</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {warnings === undefined ? (
            <div className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : warnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShieldAlert className="mb-3 h-10 w-10 opacity-40" />
              <p>Aucun avertissement {statusFilter !== "all" ? STATUS_LABELS[statusFilter].toLowerCase() : ""}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livreur</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Émis le</TableHead>
                  <TableHead>Expire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {warnings.map((w) => {
                  const display = describeDriver(w.driverName, w.driverAmazonId);
                  return (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{display.label}</span>
                          {display.isWalker && (
                            <Badge
                              variant="outline"
                              className="border-sky-500/40 bg-sky-500/15 px-1.5 py-0 font-medium text-[10px] text-sky-300"
                            >
                              walker
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono text-muted-foreground text-xs">{w.driverAmazonId}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", LEVEL_STYLES[w.level])}>
                          {LEVEL_LABELS[w.level]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate text-sm" title={w.reason}>
                          {w.reason}
                        </p>
                        {w.notes && (
                          <p className="truncate text-muted-foreground text-xs" title={w.notes}>
                            {w.notes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {format(new Date(w.issuedAt), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm tabular-nums">{w.expiresAt ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", STATUS_STYLES[w.status])}>
                          {STATUS_LABELS[w.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {w.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-400"
                            onClick={() => handleCancel(w.id as Id<"warnings">)}
                            aria-label="Annuler"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewWarningModal open={newOpen} onOpenChange={setNewOpen} stationId={station._id} />
    </main>
  );
}
