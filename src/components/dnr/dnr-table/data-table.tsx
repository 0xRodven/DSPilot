"use client";

import { startTransition, useCallback, useMemo, useState } from "react";

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
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { DnrRow } from "./columns";

interface DnrDataTableProps {
  columns: ColumnDef<DnrRow>[];
  data: DnrRow[];
  onRowClick: (row: DnrRow) => void;
  selectedDay?: string | null;
}

export function DnrDataTable({ columns, data, onRowClick, selectedDay }: DnrDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "concessionDatetime", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Pre-filter by selected day from bar chart
  const dayFilteredData = useMemo(() => {
    if (!selectedDay) return data;
    return data.filter((row) => {
      const date = row.concessionDatetime?.split(" ")[0] ?? row.concessionDatetime?.split("T")[0];
      return date === selectedDay;
    });
  }, [data, selectedDay]);

  // Pre-filter by type
  const typeFilteredData = useMemo(() => {
    if (typeFilter === "all") return dayFilteredData;
    return dayFilteredData.filter((row) => (row.entryType ?? "concession") === typeFilter);
  }, [dayFilteredData, typeFilter]);

  const columnFilters = useMemo(
    () => (statusFilter !== "all" ? [{ id: "status", value: statusFilter }] : []),
    [statusFilter],
  );

  const globalFilterFn = useCallback((row: { original: DnrRow }, _columnId: string, filterValue: string) => {
    const search = filterValue.toLowerCase();
    return (
      row.original.driverName.toLowerCase().includes(search) ||
      row.original.trackingId.toLowerCase().includes(search) ||
      row.original.transporterId.toLowerCase().includes(search)
    );
  }, []);

  const table = useReactTable({
    data: typeFilteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updater) => startTransition(() => setSorting(updater)),
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher livreur, tracking..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => startTransition(() => setTypeFilter(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="concession">DNR</SelectItem>
            <SelectItem value="investigation">Investigations</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => startTransition(() => setStatusFilter(v))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="ongoing">En cours</SelectItem>
            <SelectItem value="resolved">Résolu</SelectItem>
            <SelectItem value="confirmed_dnr">DNR confirmé</SelectItem>
            <SelectItem value="under_investigation">Enquête</SelectItem>
            <SelectItem value="investigation_closed">Classé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[900px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium text-muted-foreground text-sm">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-2 px-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Aucun résultat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">{table.getFilteredRowModel().rows.length} entrée(s)</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Précédent
            </Button>
            <span className="text-muted-foreground text-sm">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
