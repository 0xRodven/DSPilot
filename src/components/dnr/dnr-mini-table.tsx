"use client";

import Link from "next/link";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DnrMiniTableProps {
  driverId: Id<"drivers">;
}

const statusColors: Record<string, string> = {
  ongoing: "bg-amber-500/20 text-amber-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
  confirmed_dnr: "bg-red-500/20 text-red-400",
  under_investigation: "bg-violet-500/20 text-violet-400",
  investigation_closed: "bg-blue-500/20 text-blue-400",
};

const statusLabels: Record<string, string> = {
  ongoing: "En cours",
  resolved: "Résolu",
  confirmed_dnr: "DNR",
  under_investigation: "Enquête",
  investigation_closed: "Classé",
};

export function DnrMiniTable({ driverId }: DnrMiniTableProps) {
  const investigations = useQuery(api.dnr.getDriverRecentDnr, { driverId });

  if (!investigations || investigations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Dernières investigations DNR</h3>
        <Link
          href={`/dashboard/dnr?driver=${driverId}`}
          className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
        >
          Voir tout <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-muted-foreground text-sm">Tracking</TableHead>
              <TableHead className="text-right font-medium text-muted-foreground text-sm">Date</TableHead>
              <TableHead className="font-medium text-muted-foreground text-sm">Scan</TableHead>
              <TableHead className="text-right font-medium text-muted-foreground text-sm">Distance</TableHead>
              <TableHead className="font-medium text-muted-foreground text-sm">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investigations.map((inv) => (
              <TableRow key={inv._id} className="hover:bg-transparent">
                <TableCell className="p-2 px-3 font-mono text-xs">{inv.trackingId}</TableCell>
                <TableCell className="p-2 px-3 text-right text-sm tabular-nums">
                  {format(new Date(inv.concessionDatetime), "dd/MM", { locale: fr })}
                </TableCell>
                <TableCell className="p-2 px-3 text-xs">
                  {inv.scanType.replace("DELIVERED_TO_", "").replace(/_/g, " ")}
                </TableCell>
                <TableCell
                  className={cn(
                    "p-2 px-3 text-right tabular-nums",
                    inv.gpsDistanceMeters != null && inv.gpsDistanceMeters > 50
                      ? "text-red-400"
                      : inv.gpsDistanceMeters != null && inv.gpsDistanceMeters > 20
                        ? "text-amber-400"
                        : "text-emerald-400",
                  )}
                >
                  {inv.gpsDistanceMeters != null ? `${Math.round(inv.gpsDistanceMeters)}m` : "—"}
                </TableCell>
                <TableCell className="p-2 px-3">
                  <Badge variant="outline" className={cn("text-xs", statusColors[inv.status])}>
                    {statusLabels[inv.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
