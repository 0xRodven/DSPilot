"use client";

import { HelpCircle, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/calculations";
import type { ErrorCategoryData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getErrorDescription, hasErrorDescription } from "@/lib/utils/error-descriptions";

interface ErrorKPIsProps {
  category: ErrorCategoryData;
}

export function ErrorKPIs({ category }: ErrorKPIsProps) {
  const totalCard = {
    label: category.id === "dwc" ? "Total Misses" : category.id === "iadc" ? "Total IADC" : "Total Scans Frauduleux",
    value: category.total,
    trend: category.trend,
    trendPercent: category.trendPercent,
  };

  // Toujours prendre 3 sous-catégories pour avoir 4 cartes au total
  const subcategoryCards = category.subcategories.slice(0, 3).map((sub) => ({
    label: sub.name,
    value: sub.count,
    percentage: sub.percentage,
    trend: sub.trend,
  }));

  const cards = [totalCard, ...subcategoryCards];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card, index) => {
          const isNegativeTrend = card.trend > 0;
          const isImprovement =
            category.id === "dwc" || category.id === "false-scans" ? card.trend < 0 : card.trend < 0;
          const hasTooltip = hasErrorDescription(card.label);

          return (
            <Card
              key={card.label}
              className={cn(
                "border-border bg-card transition-colors hover:border-primary/50",
                index === 0 && "border-l-4 border-l-primary",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5">
                  <p className="text-muted-foreground text-sm">{card.label}</p>
                  {hasTooltip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{getErrorDescription(card.label)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-bold text-2xl">{formatNumber(card.value)}</span>
                  {"percentage" in card && <span className="text-muted-foreground text-sm">{card.percentage}%</span>}
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
          );
        })}
      </div>
    </TooltipProvider>
  );
}
