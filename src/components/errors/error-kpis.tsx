"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/calculations"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { ErrorCategoryData } from "@/lib/mock-data"

interface ErrorKPIsProps {
  category: ErrorCategoryData
  onSubcategoryClick: (name: string) => void
}

export function ErrorKPIs({ category, onSubcategoryClick }: ErrorKPIsProps) {
  const totalCard = {
    label: category.id === "dwc" ? "Total Misses" : category.id === "iadc" ? "Total IADC" : "Total Scans Frauduleux",
    value: category.total,
    trend: category.trend,
    trendPercent: category.trendPercent,
  }

  const subcategoryCards = category.subcategories.slice(0, 3).map((sub) => ({
    label: sub.name,
    value: sub.count,
    percentage: sub.percentage,
    trend: sub.trend,
  }))

  const cards = [totalCard, ...subcategoryCards]

  return (
    <div className={cn("grid gap-4", category.id === "false-scans" ? "grid-cols-3" : "grid-cols-4")}>
      {cards.map((card, index) => {
        const isNegativeTrend = card.trend > 0
        const isImprovement = category.id === "dwc" || category.id === "false-scans" ? card.trend < 0 : card.trend < 0

        return (
          <Card
            key={card.label}
            className={cn(
              "cursor-pointer border-border bg-card transition-colors hover:border-primary/50",
              index === 0 && "border-l-4 border-l-primary",
            )}
            onClick={() => index > 0 && onSubcategoryClick(card.label)}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatNumber(card.value)}</span>
                {"percentage" in card && <span className="text-sm text-muted-foreground">{card.percentage}%</span>}
              </div>
              <div className="mt-2 flex items-center gap-1">
                {isNegativeTrend ? (
                  <TrendingUp className={cn("h-3 w-3", isImprovement ? "text-emerald-400" : "text-red-400")} />
                ) : (
                  <TrendingDown className={cn("h-3 w-3", isImprovement ? "text-emerald-400" : "text-red-400")} />
                )}
                <span className={cn("text-xs", isImprovement ? "text-emerald-400" : "text-red-400")}>
                  {card.trend > 0 ? "+" : ""}
                  {card.trend} vs S49
                </span>
                {"trendPercent" in card && (
                  <span className={cn("text-xs", isImprovement ? "text-emerald-400" : "text-red-400")}>
                    ({card.trendPercent > 0 ? "+" : ""}
                    {card.trendPercent}%)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
