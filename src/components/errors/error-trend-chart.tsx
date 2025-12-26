"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { AlertCircle, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { ErrorTrendData } from "@/lib/types"

interface ErrorTrendChartProps {
  data: ErrorTrendData[]
}

type PeriodOption = "4W" | "8W" | "12W"

const lineConfigs = [
  { key: "total", label: "Total", color: "#ef4444", defaultChecked: true },
  { key: "contactMiss", label: "Contact Miss", color: "#f97316", defaultChecked: true },
  { key: "photoDefect", label: "Photo Defect", color: "#eab308", defaultChecked: true },
  { key: "noPhoto", label: "No Photo", color: "#22c55e", defaultChecked: false },
  { key: "otpMiss", label: "OTP Miss", color: "#3b82f6", defaultChecked: false },
  { key: "failedAttempts", label: "Failed Attempts", color: "#8b5cf6", defaultChecked: false },
]

export function ErrorTrendChart({ data }: ErrorTrendChartProps) {
  const [period, setPeriod] = useState<PeriodOption>("8W")
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(lineConfigs.map((c) => [c.key, c.defaultChecked])),
  )

  const periodWeeks = { "4W": 4, "8W": 8, "12W": 12 }
  const filteredData = data.slice(-periodWeeks[period])

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Calculate insight
  const firstWeek = filteredData[0]
  const lastWeek = filteredData[filteredData.length - 1]
  const contactMissChange = ((lastWeek.contactMiss - firstWeek.contactMiss) / firstWeek.contactMiss) * 100
  const insight =
    contactMissChange > 15
      ? `Contact Miss en hausse de +${contactMissChange.toFixed(0)}% sur ${periodWeeks[period]} semaines.`
      : contactMissChange < -10
        ? `Contact Miss en amélioration de ${contactMissChange.toFixed(0)}% sur ${periodWeeks[period]} semaines.`
        : `Contact Miss stable sur ${periodWeeks[period]} semaines.`

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Évolution des erreurs</CardTitle>
          <p className="text-sm text-muted-foreground">{periodWeeks[period]} dernières semaines</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["4W", "8W", "12W"] as PeriodOption[]).map((p) => (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              className={cn("h-7 px-3 text-xs", period === p && "bg-muted")}
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              {lineConfigs.map(
                (config) =>
                  visibleLines[config.key] && (
                    <Line
                      key={config.key}
                      type="monotone"
                      dataKey={config.key}
                      name={config.label}
                      stroke={config.color}
                      strokeWidth={config.key === "total" ? 2.5 : 1.5}
                      dot={false}
                      strokeDasharray={config.key === "total" ? undefined : "5 5"}
                    />
                  ),
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
          {lineConfigs.map((config) => (
            <label key={config.key} className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={visibleLines[config.key]}
                onCheckedChange={() => toggleLine(config.key)}
                className="border-border"
              />
              <div className="h-0.5 w-4" style={{ backgroundColor: config.color }} />
              <span className="text-sm">{config.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          {contactMissChange > 15 ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          ) : (
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          )}
          <p className="text-sm">
            <span className="font-medium">Insight :</span> {insight}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
