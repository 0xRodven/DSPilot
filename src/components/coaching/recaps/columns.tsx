"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowUpDown, CheckCircle, MessageSquare, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type DriverComparison = {
  id: string;
  name: string;
  amazonId: string;
  current: {
    deliveries: number;
    dwc: number;
    iadc: number;
  };
  previous: {
    deliveries: number;
    dwc: number;
    iadc: number;
  };
  diff: {
    deliveries: number;
    dwc: number;
    iadc: number;
  };
  status: "ok" | "watch" | "alert";
};

export const createColumns = (onGenerateRecap: (driver: DriverComparison) => void): ColumnDef<DriverComparison>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Nom",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{row.getValue("name")}</p>
        <p className="text-muted-foreground text-xs">{row.original.amazonId}</p>
      </div>
    ),
  },
  {
    accessorKey: "current.deliveries",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Colis
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const deliveries = row.original.current.deliveries;
      const diff = row.original.diff.deliveries;
      return (
        <div className="text-right tabular-nums">
          <span className="font-medium">{deliveries}</span>
          <span className={cn("ml-2 text-xs", diff >= 0 ? "text-emerald-500" : "text-red-500")}>
            ({diff > 0 ? "+" : ""}
            {diff})
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "current.dwc",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          DWC
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-right font-medium tabular-nums">{row.original.current.dwc}%</div>,
  },
  {
    accessorKey: "diff.dwc",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Trend
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const diff = row.original.diff.dwc;
      return (
        <div
          className={cn(
            "flex items-center justify-end gap-1 tabular-nums",
            diff >= 0 ? "text-emerald-500" : "text-red-500",
          )}
        >
          {diff >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span className="font-medium text-sm">
            {diff > 0 ? "+" : ""}
            {diff}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex justify-center">
          {status === "ok" && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="mr-1 h-3 w-3" />
              OK
            </Badge>
          )}
          {status === "watch" && (
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Watch
            </Badge>
          )}
          {status === "alert" && (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Alert
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <Button size="sm" variant="ghost" onClick={() => onGenerateRecap(row.original)}>
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
