"use client";

import { AlertTriangle, HelpCircle, Package, Truck } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/calculations";
import type { ErrorCategory, ErrorCategoryData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getErrorDescription } from "@/lib/utils/error-descriptions";

interface ErrorTabsProps {
  categories: ErrorCategoryData[];
  activeTab: ErrorCategory;
  onTabChange: (tab: ErrorCategory) => void;
}

const tabIcons = {
  dwc: Package,
  iadc: Truck,
  "false-scans": AlertTriangle,
};

const categoryTooltipKeys: Record<ErrorCategory, string> = {
  dwc: "DWC",
  iadc: "IADC",
  "false-scans": "False Scans",
};

export function ErrorTabs({ categories, activeTab, onTabChange }: ErrorTabsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex gap-3">
        {categories.map((category) => {
          const Icon = tabIcons[category.id];
          const isActive = activeTab === category.id;
          const tooltipKey = categoryTooltipKeys[category.id];

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
                <span className={cn("font-medium text-sm", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {category.name}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{getErrorDescription(tooltipKey)}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={cn("font-bold text-2xl", isActive ? "text-foreground" : "text-foreground")}>
                {formatNumber(category.total)}
              </span>
              {isActive && <div className="mt-1 h-0.5 w-full rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
