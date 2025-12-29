"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, User } from "lucide-react"
import type { DashboardDriver } from "./columns"

interface DataTableProps {
  columns: ColumnDef<DashboardDriver>[]
  data: DashboardDriver[]
  periodLabel: string
  onRowClick: (driverId: string) => void
}

export function DataTable({ columns, data, periodLabel, onRowClick }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "dwcPercent", desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const name = row.original.name.toLowerCase()
      const amazonId = row.original.amazonId.toLowerCase()
      const filter = filterValue.toLowerCase()
      return name.includes(filter) || amazonId.includes(filter)
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const tierFilter = (table.getColumn("tier")?.getFilterValue() as string) ?? "all"

  // No data state
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">Aucun driver pour {periodLabel}</p>
        <p className="text-sm text-muted-foreground mt-1">Importez un rapport pour voir les drivers</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un driver..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={tierFilter}
          onValueChange={(value) => {
            table.getColumn("tier")?.setFilterValue(value === "all" ? undefined : value)
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground">
            <SelectItem value="all">Tous les tiers</SelectItem>
            <SelectItem value="fantastic">Fantastic</SelectItem>
            <SelectItem value="great">Great</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="poor">Poor</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="bg-transparent">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                <TableHead className="w-12 text-muted-foreground">#</TableHead>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
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
        <p className="text-sm text-muted-foreground">
          Affichage{" "}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          sur {table.getFilteredRowModel().rows.length} drivers
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
              const pageIndex = table.getState().pagination.pageIndex
              const pageCount = table.getPageCount()
              let pageNum: number

              if (pageCount <= 5) {
                pageNum = i
              } else if (pageIndex <= 2) {
                pageNum = i
              } else if (pageIndex >= pageCount - 3) {
                pageNum = pageCount - 5 + i
              } else {
                pageNum = pageIndex - 2 + i
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
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  )
}
