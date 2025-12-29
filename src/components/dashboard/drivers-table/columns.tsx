"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, User, Eye, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getTierColor, getTierBgColor } from "@/lib/utils/tier"
import { cn } from "@/lib/utils"

export interface DashboardDriver {
  id: string
  name: string
  amazonId: string
  dwcPercent: number
  iadcPercent: number
  daysActive: number
  tier: "fantastic" | "great" | "fair" | "poor"
}

const tierLabels = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
}

interface ColumnsProps {
  onViewDriver: (driverId: string) => void
  onPlanCoaching: (driverId: string) => void
}

export const createColumns = ({
  onViewDriver,
  onPlanCoaching,
}: ColumnsProps): ColumnDef<DashboardDriver>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 -ml-2"
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
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.getValue("amazonId")}</span>
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
      const tier = row.original.tier
      return (
        <div className={cn("text-right font-semibold tabular-nums", getTierColor(tier))}>
          {row.getValue("dwcPercent")}%
        </div>
      )
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
      <div className="text-right font-medium text-card-foreground tabular-nums">
        {row.getValue("iadcPercent")}%
      </div>
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
      <div className="text-center text-card-foreground tabular-nums">
        {row.getValue("daysActive")}
      </div>
    ),
  },
  {
    accessorKey: "tier",
    header: "Tier",
    cell: ({ row }) => {
      const tier = row.getValue("tier") as DashboardDriver["tier"]
      return (
        <div className="text-center">
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
              getTierBgColor(tier)
            )}
          >
            {tierLabels[tier]}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value === "all" || row.getValue(id) === value
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
              e.stopPropagation()
              onViewDriver(row.original.id)
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Voir détail
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onPlanCoaching(row.original.id)
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Planifier coaching
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
