"use client";

import { useState } from "react";

import { ChevronDown, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DriverDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ErrorBreakdownProps {
  driver: DriverDetail;
  week: number;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-muted-foreground text-xs">±0</span>;
  }
  // Negative delta = fewer errors = good (green)
  const isImprovement = delta < 0;
  const Icon = isImprovement ? TrendingDown : TrendingUp;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium text-xs",
        isImprovement ? "text-emerald-400" : "text-red-400",
      )}
    >
      <Icon className="h-3 w-3" />
      {delta > 0 ? "+" : ""}
      {delta}
    </span>
  );
}

export function ErrorBreakdown({ driver, week }: ErrorBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Contact Miss"]);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  };

  const { dwcMisses, iadcNonCompliant } = driver.errorBreakdown;
  const previousDwc = driver.errorBreakdownPrevious?.dwcMisses;
  const previousIadc = driver.errorBreakdownPrevious?.iadcNonCompliant;
  const dwcTotalDelta = previousDwc ? dwcMisses.total - previousDwc.total : 0;
  const iadcTotalDelta = previousIadc ? iadcNonCompliant.total - previousIadc.total : 0;

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-semibold text-card-foreground text-lg">Breakdown Erreurs</CardTitle>
        <p className="text-muted-foreground text-sm">
          Semaine {week} • {dwcMisses.total} erreurs DWC
          {previousDwc ? (
            <>
              {" "}
              <span className="ml-1">
                <DeltaBadge delta={dwcTotalDelta} />
              </span>
              <span className="ml-1 text-muted-foreground/70">vs S{week - 1}</span>
            </>
          ) : null}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* DWC Misses */}
        <div>
          <div className="mb-2 font-medium text-card-foreground text-sm">DWC Misses ({dwcMisses.total})</div>
          <div className="space-y-1">
            {dwcMisses.categories.map((cat) => {
              const isExpanded = expandedCategories.includes(cat.name);
              const percentage = dwcMisses.total > 0 ? ((cat.count / dwcMisses.total) * 100).toFixed(1) : "0";
              const prevCat = previousDwc?.categories.find((c) => c.name === cat.name);
              const catDelta = cat.count - (prevCat?.count ?? 0);
              const hasSubcategories = cat.subcategories.length > 0;
              return (
                <div key={cat.name}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/30"
                  >
                    {hasSubcategories ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
                    <span className="flex-1 text-card-foreground text-sm">
                      {cat.name} ({cat.count})
                    </span>
                    {previousDwc ? <DeltaBadge delta={catDelta} /> : null}
                    <span className="text-muted-foreground text-xs">{percentage}%</span>
                  </button>
                  {isExpanded && hasSubcategories && (
                    <div className="mt-1 ml-8 space-y-1">
                      {cat.subcategories.map((sub) => {
                        const prevSub = prevCat?.subcategories.find((s) => s.name === sub.name);
                        const subDelta = sub.count - (prevSub?.count ?? 0);
                        return (
                          <div key={sub.name} className="flex items-center gap-2 px-2 py-1">
                            <span className="flex-1 text-muted-foreground text-sm">{sub.name}</span>
                            <span className="font-medium text-card-foreground text-sm tabular-nums">{sub.count}</span>
                            {previousDwc ? <DeltaBadge delta={subDelta} /> : null}
                            <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-red-400/60"
                                style={{
                                  width: `${dwcMisses.total > 0 ? (sub.count / dwcMisses.total) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* IADC Non-Compliant */}
        <div className="border-border border-t pt-4">
          <div className="mb-2 flex items-center gap-2 font-medium text-card-foreground text-sm">
            <span>IADC Non-Compliant ({iadcNonCompliant.total})</span>
            {previousIadc ? <DeltaBadge delta={iadcTotalDelta} /> : null}
          </div>
          <div className="space-y-2">
            {iadcNonCompliant.categories.map((cat) => {
              const percentage =
                iadcNonCompliant.total > 0 ? ((cat.count / iadcNonCompliant.total) * 100).toFixed(1) : "0";
              const prevCat = previousIadc?.categories.find((c) => c.name === cat.name);
              const catDelta = cat.count - (prevCat?.count ?? 0);
              return (
                <div key={cat.name} className="flex items-center gap-2 px-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  <span className="flex-1 text-muted-foreground text-sm">
                    {cat.name} ({cat.count})
                  </span>
                  {previousIadc ? <DeltaBadge delta={catDelta} /> : null}
                  <span className="text-muted-foreground text-xs">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
