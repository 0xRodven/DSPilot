"use client"

import { useState } from "react"
import type { Table } from "@tanstack/react-table"
import { Search, Copy, Download, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { generateWhatsAppRecap } from "@/lib/coaching/recap-generator"
import type { DriverComparison } from "./columns"

interface DataTableToolbarProps {
  table: Table<DriverComparison>
  week: number
}

export function DataTableToolbar({ table, week }: DataTableToolbarProps) {
  const [copied, setCopied] = useState(false)
  const isFiltered = table.getState().globalFilter !== ""
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const hasSelection = selectedRows.length > 0

  // Copy selected recaps
  const handleCopySelected = async () => {
    if (selectedRows.length === 0) return

    const messages = selectedRows
      .map((row) => generateWhatsAppRecap(row.original, week))
      .join("\n\n---\n\n")

    await navigator.clipboard.writeText(messages)
    setCopied(true)
    toast.success(`${selectedRows.length} recap(s) copie(s)`)
    setTimeout(() => setCopied(false), 2000)
  }

  // Export selected as CSV
  const handleExportCSV = () => {
    if (selectedRows.length === 0) return

    const headers = ["Nom", "Amazon ID", "Colis", "DWC %", "Trend", "Status"]
    const csvData = selectedRows.map((row) => {
      const d = row.original
      return [
        d.name,
        d.amazonId,
        d.current.deliveries,
        d.current.dwc,
        `${d.diff.dwc > 0 ? "+" : ""}${d.diff.dwc}`,
        d.status,
      ].join(",")
    })

    const csv = [headers.join(","), ...csvData].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `recaps-s${week}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${selectedRows.length} driver(s) exporte(s)`)
  }

  // Status filter
  const statusFilter = table.getColumn("status")?.getFilterValue() as
    | string[]
    | undefined

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un driver..."
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter?.[0] ?? "all"}
          onValueChange={(value) =>
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? undefined : [value])
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="watch">Watch</SelectItem>
            <SelectItem value="alert">Alert</SelectItem>
          </SelectContent>
        </Select>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetGlobalFilter()}
            className="h-8 px-2 lg:px-3"
          >
            Reinitialiser
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-2">
        {hasSelection && (
          <>
            <Button
              size="sm"
              onClick={handleCopySelected}
              className="h-8"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copie!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copier ({selectedRows.length})
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="h-8"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
