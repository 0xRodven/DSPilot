"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { describeDriver } from "@/lib/utils/driver-display";

export type DnrStatus = "ongoing" | "resolved" | "confirmed_dnr" | "under_investigation" | "investigation_closed";
export type EntryType = "concession" | "investigation";

export interface DnrRow {
  _id: string;
  trackingId: string;
  driverId?: string;
  transporterId: string;
  driverName: string;
  deliveryDatetime: string;
  concessionDatetime: string;
  scanType: string;
  address: {
    street: string;
    building?: string;
    floor?: string;
    postalCode: string;
    city: string;
  };
  gpsPlanned?: { lat: number; lng: number };
  gpsActual?: { lat: number; lng: number };
  gpsDistanceMeters?: number;
  customerNotes?: string;
  entryType?: EntryType;
  investigationReason?: string;
  investigationDate?: string;
  investigationVerdict?: string;
  status: DnrStatus;
}

function formatDelay(delivery: string, concession: string): string {
  if (!delivery || !concession || delivery === concession) return "—";
  const d = new Date(delivery);
  const c = new Date(concession);
  const diff = differenceInHours(c, d);
  if (diff <= 0) return "—";
  const days = differenceInDays(c, d);
  const hours = diff % 24;
  if (days > 0) return `${days}j ${hours}h`;
  return `${hours}h`;
}

function delayColor(delivery: string, concession: string): string {
  if (!delivery || !concession || delivery === concession) return "text-muted-foreground";
  const hours = differenceInHours(new Date(concession), new Date(delivery));
  if (hours <= 0) return "text-muted-foreground";
  if (hours > 72) return "text-red-400";
  if (hours > 24) return "text-amber-400";
  return "text-emerald-400";
}

function distanceColor(meters?: number): string {
  if (meters == null) return "text-muted-foreground";
  if (meters > 50) return "text-red-400";
  if (meters > 20) return "text-amber-400";
  return "text-emerald-400";
}

const statusStyles: Record<DnrStatus, string> = {
  ongoing: "bg-amber-500/20 text-amber-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
  confirmed_dnr: "bg-red-500/20 text-red-400",
  under_investigation: "bg-violet-500/20 text-violet-400",
  investigation_closed: "bg-blue-500/20 text-blue-400",
};

const statusLabels: Record<DnrStatus, string> = {
  ongoing: "En cours",
  resolved: "Résolu",
  confirmed_dnr: "DNR confirmé",
  under_investigation: "Enquête",
  investigation_closed: "Classé",
};

const entryTypeStyles: Record<string, string> = {
  concession: "bg-blue-500/20 text-blue-400",
  investigation: "bg-violet-500/20 text-violet-400",
};

const entryTypeLabels: Record<string, string> = {
  concession: "DNR",
  investigation: "INV",
};

const scanLabels: Record<string, string> = {
  DELIVERED_TO_HOUSEHOLD_MEMBER: "Remis tiers",
  DELIVERED_TO_MAIL_SLOT: "Boite aux lettres",
  DELIVERED_TO_CUSTOMER: "Main propre",
  DELIVERED_TO_NEIGHBOUR: "Voisin",
  DELIVERED_TO_SAFE_PLACE: "Lieu sûr",
  DELIVERED_TO_RECEPTIONIST: "Réception/Gardien",
  DELIVERED_TO_CONCIERGE: "Concierge",
};

export const columns: ColumnDef<DnrRow>[] = [
  {
    id: "entryType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.entryType ?? "concession";
      return (
        <Badge variant="outline" className={cn("font-semibold text-xs", entryTypeStyles[type])}>
          {entryTypeLabels[type]}
        </Badge>
      );
    },
    filterFn: (row, _id, value) => {
      if (value === "all") return true;
      return (row.original.entryType ?? "concession") === value;
    },
  },
  {
    accessorKey: "driverName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 h-8 px-2"
      >
        Livreur
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const { label, isWalker } = describeDriver(row.original.driverName, row.original.transporterId);
      return (
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-card-foreground">{label}</span>
          {isWalker && (
            <Badge
              variant="outline"
              className="border-sky-500/40 bg-sky-500/15 px-1.5 py-0 font-medium text-[10px] text-sky-300"
            >
              walker
            </Badge>
          )}
        </div>
      );
    },
    sortingFn: (a, b) => {
      const la = describeDriver(a.original.driverName, a.original.transporterId).label;
      const lb = describeDriver(b.original.driverName, b.original.transporterId).label;
      return la.localeCompare(lb);
    },
  },
  {
    accessorKey: "trackingId",
    header: "Tracking",
    cell: ({ row }) => (
      <span className="max-w-[100px] truncate font-mono text-xs" title={row.original.trackingId}>
        {row.original.trackingId}
      </span>
    ),
  },
  {
    accessorKey: "concessionDatetime",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-mr-2 h-8 px-2"
        >
          Date concession
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right text-sm tabular-nums">
        {format(new Date(row.original.concessionDatetime), "dd/MM HH:mm", { locale: fr })}
      </div>
    ),
  },
  {
    id: "delay",
    header: () => <div className="text-right">Délai</div>,
    cell: ({ row }) => (
      <div
        className={cn(
          "text-right font-medium tabular-nums",
          delayColor(row.original.deliveryDatetime, row.original.concessionDatetime),
        )}
      >
        {formatDelay(row.original.deliveryDatetime, row.original.concessionDatetime)}
      </div>
    ),
    sortingFn: (a, b) => {
      const aH = differenceInHours(new Date(a.original.concessionDatetime), new Date(a.original.deliveryDatetime));
      const bH = differenceInHours(new Date(b.original.concessionDatetime), new Date(b.original.deliveryDatetime));
      return aH - bH;
    },
  },
  {
    accessorKey: "scanType",
    header: "Mode",
    cell: ({ row }) => {
      const label =
        scanLabels[row.original.scanType] ?? row.original.scanType.replace("DELIVERED_TO_", "").replace(/_/g, " ");
      return (
        <Badge variant="outline" className="max-w-[100px] truncate text-xs" title={label}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "gpsDistanceMeters",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-mr-2 h-8 px-2"
        >
          Distance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className={cn("text-right font-medium tabular-nums", distanceColor(row.original.gpsDistanceMeters))}>
        {row.original.gpsDistanceMeters != null ? `${Math.round(row.original.gpsDistanceMeters)}m` : "—"}
      </div>
    ),
  },
  {
    id: "city",
    header: "CP",
    cell: ({ row }) => {
      // User decision (2026-04-08): keep only the postal code — much cleaner
      // than the noisy raw city string Amazon ships.
      const pc = row.original.address.postalCode?.slice(0, 5) ?? "";
      return <span className="text-muted-foreground text-sm tabular-nums">{pc || "—"}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant="outline" className={cn("text-xs", statusStyles[status])}>
          {statusLabels[status]}
        </Badge>
      );
    },
    filterFn: (row, _id, value) => {
      if (value === "all") return true;
      return row.original.status === value;
    },
  },
];
