"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/calculations"
import { LayoutGrid, BarChart3, PieChart } from "lucide-react"
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { ErrorCategoryData } from "@/lib/types"

type ChartType = "treemap" | "bars" | "donut"

interface BreakdownChartProps {
  category: ErrorCategoryData
  onSubcategoryClick: (name: string) => void
}

const COLORS = {
  dwc: ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2"],
  iadc: ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],
  "false-scans": ["#f59e0b", "#fbbf24", "#fcd34d"],
}

export function BreakdownChart({ category, onSubcategoryClick }: BreakdownChartProps) {
  const [chartType, setChartType] = useState<ChartType>("treemap")

  const data = category.subcategories.map((sub) => ({
    name: sub.name,
    value: sub.count,
    percentage: sub.percentage,
  }))

  const colors = COLORS[category.id]

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">
            Répartition des erreurs {category.id === "dwc" ? "DWC" : category.id === "iadc" ? "IADC" : "False Scans"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{formatNumber(category.total)} erreurs • Semaine 50</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2", chartType === "treemap" && "bg-muted")}
            onClick={() => setChartType("treemap")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2", chartType === "bars" && "bg-muted")}
            onClick={() => setChartType("bars")}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2", chartType === "donut" && "bg-muted")}
            onClick={() => setChartType("donut")}
          >
            <PieChart className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chartType === "treemap" && (
          <div
            className="grid auto-rows-fr gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}
          >
            {data.map((item, index) => {
              const size = Math.max(80, Math.min(180, 80 + item.percentage * 2))
              return (
                <button
                  key={item.name}
                  onClick={() => onSubcategoryClick(item.name)}
                  className="flex flex-col items-center justify-center rounded-lg p-4 text-center transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: colors[index],
                    minHeight: size,
                    gridColumn: item.percentage > 30 ? "span 2" : "span 1",
                    gridRow: item.percentage > 30 ? "span 2" : "span 1",
                  }}
                >
                  <span className="text-sm font-medium text-white">{item.name}</span>
                  <span className="text-2xl font-bold text-white">{item.percentage}%</span>
                  <span className="text-sm text-white/80">{formatNumber(item.value)}</span>
                </button>
              )
            })}
          </div>
        )}

        {chartType === "bars" && (
          <div className="space-y-4">
            {data.map((item, index) => (
              <button key={item.name} onClick={() => onSubcategoryClick(item.name)} className="w-full text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{formatNumber(item.value)}</span>
                </div>
                <div className="h-6 w-full overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: colors[index],
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{item.percentage}%</span>
              </button>
            ))}
          </div>
        )}

        {chartType === "donut" && (
          <div className="flex items-center gap-8">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(_, index) => onSubcategoryClick(data[index].name)}
                    style={{ cursor: "pointer" }}
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{formatNumber(category.total)}</span>
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {data.map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => onSubcategoryClick(item.name)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                >
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                  <span className="flex-1 text-sm">{item.name}</span>
                  <span className="text-sm font-medium">{formatNumber(item.value)}</span>
                  <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
