"use client";

import * as React from "react";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { DriversListDriver } from "./columns";

type StatusFilter = "all" | "active" | "inactive";

interface TierStat {
  count: number;
  percentage: string;
  trend: number;
}

interface TierStats {
  fantastic: TierStat;
  great: TierStat;
  fair: TierStat;
  poor: TierStat;
  total: number;
  active: number;
}

interface DataTableProps {
  columns: ColumnDef<DriversListDriver>[];
  data: DriversListDriver[];
  stats: TierStats;
  selectedTier: string;
  onTierChange: (tier: string) => void;
  periodMode: "week" | "day";
  onRowClick: (driverId: string) => void;
}

export function DataTable({
  columns,
  data,
  stats,
  selectedTier,
  onTierChange,
  periodMode,
  onRowClick,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "dwcPercent", desc: true }]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  // Apply filters
  const filteredData = React.useMemo(() => {
    let result = [...data];

    // DWC range filter
    if (selectedTier !== "all") {
      result = result.filter((d) => {
        const dwc = d.dwcPercent;
        switch (selectedTier) {
          case "above95":
            return dwc >= 95;
          case "pct90to95":
            return dwc >= 90 && dwc < 95;
          case "pct85to90":
            return dwc >= 85 && dwc < 90;
          case "below85":
            return dwc < 85;
          // Legacy tier keys (backward compat)
          case "fantastic":
            return dwc >= 95;
          case "great":
            return dwc >= 90 && dwc < 95;
          case "fair":
            return dwc >= 85 && dwc < 90;
          case "poor":
            return dwc < 85;
          default:
            return true;
        }
      });
    }

    // Status filter (only for week mode)
    if (periodMode === "week") {
      if (statusFilter === "active") {
        result = result.filter((d) => d.daysActive >= 5);
      } else if (statusFilter === "inactive") {
        result = result.filter((d) => d.daysActive < 5);
      }
    }

    // Global search filter
    if (globalFilter) {
      const searchLower = globalFilter.toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(searchLower) || d.amazonId.toLowerCase().includes(searchLower),
      );
    }

    return result;
  }, [data, selectedTier, statusFilter, globalFilter, periodMode]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const handleExport = () => {
    alert(`Export CSV des ${filteredData.length} drivers`);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher driver..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {periodMode === "week" && (
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* DWC Range Tabs */}
      <Tabs value={selectedTier} onValueChange={onTierChange}>
        <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:border-foreground/20 data-[state=active]:bg-muted"
          >
            Tous ({stats.total})
          </TabsTrigger>
          <TabsTrigger
            value="above95"
            className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:border-emerald-500/50 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
          >
            ≥95% ({stats.fantastic.count})
          </TabsTrigger>
          <TabsTrigger
            value="pct90to95"
            className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:border-blue-500/50 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
          >
            90-95% ({stats.great.count})
          </TabsTrigger>
          <TabsTrigger
            value="pct85to90"
            className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:border-amber-500/50 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
          >
            85-90% ({stats.fair.count})
          </TabsTrigger>
          <TabsTrigger
            value="below85"
            className="rounded-full border border-border bg-transparent px-4 py-1.5 data-[state=active]:border-red-500/50 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
          >
            &lt;85% ({stats.poor.count})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                <TableHead className="w-12 text-muted-foreground">#</TableHead>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-muted-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer border-border transition-colors hover:bg-muted/30"
                  onClick={() => onRowClick(row.original.id)}
                >
                  <TableCell className="font-medium text-muted-foreground tabular-nums">
                    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + index + 1}
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  Aucun driver trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Affichage {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getRowModel().rows.length > 0 ? filteredData.length : 0,
          )}{" "}
          sur {filteredData.length} drivers
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
              const pageIndex = table.getState().pagination.pageIndex;
              const pageCount = table.getPageCount();
              let pageNum: number;

              if (pageCount <= 5) {
                pageNum = i;
              } else if (pageIndex <= 2) {
                pageNum = i;
              } else if (pageIndex >= pageCount - 3) {
                pageNum = pageCount - 5 + i;
              } else {
                pageNum = pageIndex - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageIndex === pageNum ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
