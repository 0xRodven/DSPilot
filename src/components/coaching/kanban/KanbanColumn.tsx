"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface KanbanColumnProps {
  title: string
  count: number
  icon: LucideIcon
  iconColor: string
  children: React.ReactNode
  className?: string
}

export function KanbanColumn({
  title,
  count,
  icon: Icon,
  iconColor,
  children,
  className,
}: KanbanColumnProps) {
  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Icon className={cn("h-4 w-4", iconColor)} />
        <h3 className="font-semibold text-card-foreground">{title}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
