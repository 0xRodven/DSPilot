"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  status: "ongoing" | "resolved" | "confirmed_dnr";
}

function formatDelay(delivery: string, concession: string): string {
  const d = new Date(delivery);
  const c = new Date(concession);
  const days = differenceInDays(c, d);
  const hours = differenceInHours(c, d) % 24;
  if (days > 0) return `${days}j ${hours}h`;
  return `${hours}h`;
}

function delayColor(delivery: string, concession: string): string {
  const hours = differenceInHours(new Date(concession), new Date(delivery));
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

const statusStyles = {
  ongoing: "bg-amber-500/20 text-amber-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
  confirmed_dnr: "bg-red-500/20 text-red-400",
} as const;

const statusLabels = {
  ongoing: "En cours",
  resolved: "Résolu",
  confirmed_dnr: "DNR",
} as const;

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
    cell: ({ row }) => <span className="font-medium text-card-foreground">{row.original.driverName}</span>,
  },
  {
    accessorKey: "trackingId",
    header: "Tracking",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.trackingId}</span>,
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
    header: "Mode de livraison",
    cell: ({ row }) => {
      const label =
        scanLabels[row.original.scanType] ?? row.original.scanType.replace("DELIVERED_TO_", "").replace(/_/g, " ");
      return (
        <Badge variant="outline" className="whitespace-nowrap text-xs">
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
    header: "Ville",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.address.postalCode} {row.original.address.city}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant="outline" className={cn("text-xs", statusStyles[row.original.status])}>
        {statusLabels[row.original.status]}
      </Badge>
    ),
    filterFn: (row, _id, value) => {
      if (value === "all") return true;
      return row.original.status === value;
    },
  },
];
