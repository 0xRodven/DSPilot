"use client";

import { useState } from "react";

import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DriverDetail } from "@/lib/types";

interface ErrorBreakdownProps {
  driver: DriverDetail;
}

export function ErrorBreakdown({ driver }: ErrorBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Contact Miss"]);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  };

  const { dwcMisses, iadcNonCompliant } = driver.errorBreakdown;

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-semibold text-card-foreground text-lg">Breakdown Erreurs</CardTitle>
        <p className="text-muted-foreground text-sm">Semaine 50 • {dwcMisses.total} erreurs DWC</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* DWC Misses */}
        <div>
          <div className="mb-2 font-medium text-card-foreground text-sm">DWC Misses ({dwcMisses.total})</div>
          <div className="space-y-1">
            {dwcMisses.categories.map((cat) => {
              const isExpanded = expandedCategories.includes(cat.name);
              const percentage = ((cat.count / dwcMisses.total) * 100).toFixed(1);
              return (
                <div key={cat.name}>
                  <button
                    onClick={() => toggleCategory(cat.name)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/30"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
                    <span className="flex-1 text-card-foreground text-sm">
                      {cat.name} ({cat.count})
                    </span>
                    <span className="text-muted-foreground text-xs">{percentage}%</span>
                  </button>
                  {isExpanded && cat.subcategories.length > 0 && (
                    <div className="mt-1 ml-8 space-y-1">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.name} className="flex items-center gap-2 px-2 py-1">
                          <span className="text-muted-foreground text-sm">{sub.name}</span>
                          <span className="font-medium text-card-foreground text-sm">{sub.count}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-red-400/60"
                              style={{ width: `${(sub.count / dwcMisses.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* IADC Non-Compliant */}
        <div className="border-border border-t pt-4">
          <div className="mb-2 font-medium text-card-foreground text-sm">
            IADC Non-Compliant ({iadcNonCompliant.total})
          </div>
          <div className="space-y-2">
            {iadcNonCompliant.categories.map((cat) => {
              const percentage = ((cat.count / iadcNonCompliant.total) * 100).toFixed(1);
              return (
                <div key={cat.name} className="flex items-center gap-2 px-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  <span className="flex-1 text-muted-foreground text-sm">
                    {cat.name} ({cat.count})
                  </span>
                  <span className="text-muted-foreground text-xs">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground hover:text-card-foreground">
          Voir détail erreurs
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
