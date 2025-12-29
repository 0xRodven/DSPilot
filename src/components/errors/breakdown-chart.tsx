"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/calculations"
import { getErrorDescription, hasErrorDescription } from "@/lib/utils/error-descriptions"
import { HelpCircle } from "lucide-react"
import type { ErrorCategoryData } from "@/lib/types"

interface BreakdownChartProps {
  category: ErrorCategoryData
}

const COLORS = {
  dwc: ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2"],
  iadc: ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],
  "false-scans": ["#f59e0b", "#fbbf24", "#fcd34d"],
}

export function BreakdownChart({ category }: BreakdownChartProps) {
  const data = category.subcategories.map((sub) => ({
    name: sub.name,
    value: sub.count,
    percentage: sub.percentage,
  }))

  const colors = COLORS[category.id]
  const categoryLabel = category.id === "dwc" ? "DWC" : category.id === "iadc" ? "IADC" : "False Scans"

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">
              Répartition {categoryLabel}
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  {getErrorDescription(categoryLabel)}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">{formatNumber(category.total)} erreurs</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    {item.name}
                    {hasErrorDescription(item.name) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">{getErrorDescription(item.name)}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(item.value)} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-5 w-full overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: colors[index],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
