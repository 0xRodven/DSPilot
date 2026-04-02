"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Calendar, Eye, MoreHorizontal, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getDwcBadgeClass, getDwcTextClass } from "@/lib/utils/performance-color";

export interface DashboardDriver {
  id: string;
  name: string;
  amazonId: string;
  dwcPercent: number;
  iadcPercent: number;
  totalDeliveries: number;
  daysActive: number;
  tier: "fantastic" | "great" | "fair" | "poor";
}

interface ColumnsProps {
  onViewDriver: (driverId: string) => void;
  onPlanCoaching: (driverId: string) => void;
}

export const createColumns = ({ onViewDriver, onPlanCoaching }: ColumnsProps): ColumnDef<DashboardDriver>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 h-8 px-2"
      >
        Driver
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="font-medium text-card-foreground">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "amazonId",
    header: "Amazon ID",
    cell: ({ row }) => <span className="font-mono text-muted-foreground text-xs">{row.getValue("amazonId")}</span>,
  },
  {
    accessorKey: "dwcPercent",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          DWC %
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const dwcPercent = row.original.dwcPercent;
      return (
        <div className={cn("text-right font-semibold tabular-nums", getDwcTextClass(dwcPercent))}>
          {row.getValue("dwcPercent")}%
        </div>
      );
    },
  },
  {
    accessorKey: "iadcPercent",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          IADC %
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium text-card-foreground tabular-nums">{row.getValue("iadcPercent")}%</div>
    ),
  },
  {
    accessorKey: "totalDeliveries",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Colis
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium text-card-foreground tabular-nums">{row.getValue("totalDeliveries")}</div>
    ),
  },
  {
    accessorKey: "daysActive",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Jours
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center text-card-foreground tabular-nums">{row.getValue("daysActive")}</div>
    ),
  },
  {
    accessorKey: "dwcPercent",
    id: "dwcBadge",
    header: "DWC",
    cell: ({ row }) => {
      const dwcPercent = row.original.dwcPercent;
      return (
        <div className="text-center">
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full px-2 py-0.5 font-medium text-xs tabular-nums",
              getDwcBadgeClass(dwcPercent),
            )}
          >
            {dwcPercent.toFixed(1)}%
          </span>
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      if (value === "all") return true;
      const dwc = row.original.dwcPercent;
      // Filter by DWC% ranges instead of tiers
      switch (value) {
        case "above95":
          return dwc >= 95;
        case "pct90to95":
          return dwc >= 90 && dwc < 95;
        case "pct85to90":
          return dwc >= 85 && dwc < 90;
        case "pct80to85":
          return dwc >= 80 && dwc < 85;
        case "below80":
          return dwc < 80;
        // Legacy tier filters for backward compat
        case "fantastic":
          return dwc >= 95;
        case "great":
          return dwc >= 90 && dwc < 95;
        case "fair":
          return dwc >= 88 && dwc < 90;
        case "poor":
          return dwc < 88;
        default:
          return true;
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onViewDriver(row.original.id);
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Voir détail
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onPlanCoaching(row.original.id);
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Planifier coaching
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
