"use client"

// src/components/filters/filter-badge.tsx
// Badge visuel indiquant le filtre temporel actif

import { cn } from "@/lib/utils"
import { formatTimeContext } from "@/lib/utils/time-context"
import type { TimeContext } from "@/lib/types/filters"
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  type LucideIcon,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ============================================================================
// PROPS
// ============================================================================

interface FilterBadgeProps {
  time: TimeContext
  isOverridden?: boolean
  showIcon?: boolean
  showTooltip?: boolean
  size?: "sm" | "md"
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getTimeIcon(type: TimeContext["type"]): LucideIcon {
  switch (type) {
    case "day":
      return CalendarDays
    case "week":
      return Calendar
    case "range":
      return CalendarRange
    case "relative":
      return Clock
  }
}

function getTimeTypeLabel(type: TimeContext["type"]): string {
  switch (type) {
    case "day":
      return "Jour"
    case "week":
      return "Semaine"
    case "range":
      return "Période"
    case "relative":
      return "Période relative"
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilterBadge({
  time,
  isOverridden = false,
  showIcon = true,
  showTooltip = true,
  size = "sm",
  className,
}: FilterBadgeProps) {
  const Icon = getTimeIcon(time.type)
  const label = formatTimeContext(time, { short: size === "sm" })
  const fullLabel = formatTimeContext(time, { short: false })
  const typeLabel = getTimeTypeLabel(time.type)

  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
        // Size
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        // Style based on override state
        isOverridden
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      {/* Pulse indicator for override */}
      {isOverridden && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
        </span>
      )}

      {/* Icon */}
      {showIcon && (
        <Icon
          className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")}
        />
      )}

      {/* Label */}
      <span>{label}</span>
    </div>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <div className="font-medium">{typeLabel}</div>
            <div className="text-muted-foreground">{fullLabel}</div>
            {isOverridden && (
              <div className="text-amber-600 dark:text-amber-400 text-[10px] mt-1">
                Filtre local (surcharge le filtre global)
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// SCOPE INDICATOR
// ============================================================================

type FilterScope = "global" | "section" | "component"

interface FilterScopeIndicatorProps {
  scope: FilterScope
  className?: string
}

export function FilterScopeIndicator({
  scope,
  className,
}: FilterScopeIndicatorProps) {
  const config: Record<
    FilterScope,
    { icon: LucideIcon; label: string; className: string }
  > = {
    global: {
      icon: Calendar,
      label: "Filtre global (header)",
      className: "bg-blue-500/10 text-blue-600 border-blue-200",
    },
    section: {
      icon: CalendarRange,
      label: "Filtre de section",
      className: "bg-amber-500/10 text-amber-600 border-amber-200",
    },
    component: {
      icon: CalendarDays,
      label: "Filtre local",
      className: "bg-gray-500/10 text-gray-600 border-gray-200",
    },
  }

  const { icon: Icon, label, className: scopeClassName } = config[scope]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border",
              scopeClassName,
              className
            )}
          >
            <Icon className="w-3 h-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
