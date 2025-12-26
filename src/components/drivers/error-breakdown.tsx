"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { DriverDetail } from "@/lib/mock-data"
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react"

interface ErrorBreakdownProps {
  driver: DriverDetail
}

export function ErrorBreakdown({ driver }: ErrorBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Contact Miss"])

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]))
  }

  const { dwcMisses, iadcNonCompliant } = driver.errorBreakdown

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-card-foreground">Breakdown Erreurs</CardTitle>
        <p className="text-sm text-muted-foreground">Semaine 50 • {dwcMisses.total} erreurs DWC</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* DWC Misses */}
        <div>
          <div className="text-sm font-medium text-card-foreground mb-2">DWC Misses ({dwcMisses.total})</div>
          <div className="space-y-1">
            {dwcMisses.categories.map((cat) => {
              const isExpanded = expandedCategories.includes(cat.name)
              const percentage = ((cat.count / dwcMisses.total) * 100).toFixed(1)
              return (
                <div key={cat.name}>
                  <button
                    onClick={() => toggleCategory(cat.name)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted/30 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="h-2 w-2 rounded-full bg-red-400 shrink-0"></span>
                    <span className="text-sm text-card-foreground flex-1">
                      {cat.name} ({cat.count})
                    </span>
                    <span className="text-xs text-muted-foreground">{percentage}%</span>
                  </button>
                  {isExpanded && cat.subcategories.length > 0 && (
                    <div className="ml-8 mt-1 space-y-1">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.name} className="flex items-center gap-2 px-2 py-1">
                          <span className="text-sm text-muted-foreground">{sub.name}</span>
                          <span className="text-sm text-card-foreground font-medium">{sub.count}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-red-400/60 rounded-full"
                              style={{ width: `${(sub.count / dwcMisses.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* IADC Non-Compliant */}
        <div className="border-t border-border pt-4">
          <div className="text-sm font-medium text-card-foreground mb-2">
            IADC Non-Compliant ({iadcNonCompliant.total})
          </div>
          <div className="space-y-2">
            {iadcNonCompliant.categories.map((cat) => {
              const percentage = ((cat.count / iadcNonCompliant.total) * 100).toFixed(1)
              return (
                <div key={cat.name} className="flex items-center gap-2 px-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0"></span>
                  <span className="text-sm text-muted-foreground flex-1">
                    {cat.name} ({cat.count})
                  </span>
                  <span className="text-xs text-muted-foreground">{percentage}%</span>
                </div>
              )
            })}
          </div>
        </div>

        <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground hover:text-card-foreground">
          Voir détail erreurs
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
