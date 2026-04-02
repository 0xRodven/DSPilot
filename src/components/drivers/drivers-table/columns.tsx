"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  FileDown,
  GraduationCap,
  History,
  Minus,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getDwcBadgeClass, getDwcTextClass } from "@/lib/utils/performance-color";

export interface DriversListDriver {
  id: string;
  name: string;
  amazonId: string;
  dwcPercent: number;
  iadcPercent: number;
  daysActive: number;
  tier: "fantastic" | "great" | "fair" | "poor";
  trend: number | null;
}

interface ColumnsProps {
  onViewDriver: (driverId: string) => void;
  onPlanCoaching?: (driverId: string) => void;
  periodMode: "week" | "day";
}

export const createColumns = ({
  onViewDriver,
  onPlanCoaching,
  periodMode,
}: ColumnsProps): ColumnDef<DriversListDriver>[] => {
  const columns: ColumnDef<DriversListDriver>[] = [
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium text-card-foreground">{row.getValue("name")}</div>
            <div className="font-mono text-muted-foreground text-xs">{row.original.amazonId}</div>
          </div>
        </div>
      ),
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
      accessorKey: "trend",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Trend
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const trend = row.getValue("trend") as number | null;
        if (trend === null) {
          return <span className="block text-right text-muted-foreground text-sm">—</span>;
        }
        return (
          <span
            className={cn(
              "inline-flex w-full items-center justify-end font-medium text-sm tabular-nums",
              trend > 0 ? "text-emerald-400" : trend < 0 ? "text-red-400" : "text-muted-foreground",
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : trend < 0 ? (
              <TrendingDown className="mr-1 h-3 w-3" />
            ) : (
              <Minus className="mr-1 h-3 w-3" />
            )}
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)}
          </span>
        );
      },
      sortingFn: (a, b) => {
        const aTrend = a.original.trend ?? -Infinity;
        const bTrend = b.original.trend ?? -Infinity;
        return aTrend - bTrend;
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
  ];

  // Add daysActive column only for week mode
  if (periodMode === "week") {
    columns.push({
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
        <div className="text-center text-card-foreground tabular-nums">{row.getValue("daysActive")}/7</div>
      ),
    });
  }

  // Add DWC badge and actions columns
  columns.push(
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
                "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 font-medium text-xs tabular-nums",
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
        // Filter by DWC% ranges
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
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
            <DropdownMenuItem onClick={() => onViewDriver(row.original.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir détail
            </DropdownMenuItem>
            {onPlanCoaching && (
              <DropdownMenuItem onClick={() => onPlanCoaching(row.original.id)}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Planifier coaching
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <History className="mr-2 h-4 w-4" />
              Historique
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileDown className="mr-2 h-4 w-4" />
              Exporter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  );

  return columns;
};
