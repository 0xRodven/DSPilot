"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber } from "@/lib/calculations";
import type { ErrorSubcategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DrillDownProps {
  subcategories: ErrorSubcategory[];
  selectedSubcategory: string;
  onSubcategoryChange: (name: string) => void;
}

export function DrillDown({ subcategories, selectedSubcategory, onSubcategoryChange }: DrillDownProps) {
  const selected = subcategories.find((s) => s.name === selectedSubcategory) || subcategories[0];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-medium text-base">Drill-Down par sous-catégorie</CardTitle>
        <Select value={selectedSubcategory} onValueChange={onSubcategoryChange}>
          <SelectTrigger className="mt-2 w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map((sub) => (
              <SelectItem key={sub.name} value={sub.name}>
                {sub.name} ({formatNumber(sub.count)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-3">
          <p className="font-bold text-lg">{formatNumber(selected.count)} erreurs</p>
          <p className="text-muted-foreground text-sm">{selected.percentage}% du total</p>
          <div className="mt-1 flex items-center gap-1">
            {selected.trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-red-400" />
            ) : selected.trend < 0 ? (
              <TrendingDown className="h-3 w-3 text-emerald-400" />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-xs",
                selected.trend > 0 ? "text-red-400" : selected.trend < 0 ? "text-emerald-400" : "text-muted-foreground",
              )}
            >
              {selected.trend > 0 ? "+" : ""}
              {selected.trend} vs S49 (
              {selected.trend !== 0
                ? `${selected.trend > 0 ? "+" : ""}${((selected.trend / (selected.count - selected.trend)) * 100).toFixed(1)}%`
                : "="}
              )
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selected.locations && selected.locations.length > 0 ? (
          <div className="space-y-4">
            <p className="font-medium text-muted-foreground text-sm">Par localisation de livraison :</p>
            {selected.locations.map((location) => {
              const maxCount = Math.max(...selected.locations?.map((l) => l.count));
              const widthPercent = (location.count / maxCount) * 100;

              return (
                <div key={location.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{location.name}</span>
                    <span className="text-muted-foreground text-sm">{formatNumber(location.count)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-muted">
                    <div className="h-full rounded bg-primary transition-all" style={{ width: `${widthPercent}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">{location.percentage}%</span>
                    <span
                      className={cn(
                        "text-xs",
                        location.trend > 0
                          ? "text-red-400"
                          : location.trend < 0
                            ? "text-emerald-400"
                            : "text-muted-foreground",
                      )}
                    >
                      {location.trend > 0 ? "↑ +" : location.trend < 0 ? "↓ " : "= "}
                      {location.trend} vs S49
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Pas de données de localisation disponibles pour cette catégorie.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
