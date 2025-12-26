"use client"

import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/calculations"
import { Package, Truck, AlertTriangle } from "lucide-react"
import type { ErrorCategory, ErrorCategoryData } from "@/lib/types"

interface ErrorTabsProps {
  categories: ErrorCategoryData[]
  activeTab: ErrorCategory
  onTabChange: (tab: ErrorCategory) => void
}

const tabIcons = {
  dwc: Package,
  iadc: Truck,
  "false-scans": AlertTriangle,
}

export function ErrorTabs({ categories, activeTab, onTabChange }: ErrorTabsProps) {
  return (
    <div className="flex gap-3">
      {categories.map((category) => {
        const Icon = tabIcons[category.id]
        const isActive = activeTab === category.id

        return (
          <button
            key={category.id}
            onClick={() => onTabChange(category.id)}
            className={cn(
              "flex flex-1 flex-col gap-1 rounded-lg border p-4 text-left transition-all",
              isActive
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50 hover:bg-card/80",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                {category.name}
              </span>
            </div>
            <span className={cn("text-2xl font-bold", isActive ? "text-foreground" : "text-foreground")}>
              {formatNumber(category.total)}
            </span>
            {isActive && <div className="mt-1 h-0.5 w-full rounded-full bg-primary" />}
          </button>
        )
      })}
    </div>
  )
}
