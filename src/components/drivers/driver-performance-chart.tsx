"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { DriverDetail } from "@/lib/mock-data"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface DriverPerformanceChartProps {
  driver: DriverDetail
}

type Period = "4w" | "8w" | "12w"

export function DriverPerformanceChart({ driver }: DriverPerformanceChartProps) {
  const [period, setPeriod] = useState<Period>("12w")
  const [showDwc, setShowDwc] = useState(true)
  const [showIadc, setShowIadc] = useState(true)
  const [showRefLines, setShowRefLines] = useState(true)

  const periodWeeks = period === "4w" ? 4 : period === "8w" ? 8 : 12
  const data = driver.weeklyHistory.slice(-periodWeeks)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold text-card-foreground">Performance Driver</CardTitle>
          <p className="text-sm text-muted-foreground">{periodWeeks} dernières semaines</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {(["4w", "8w", "12w"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setPeriod(p)}
            >
              {p.toUpperCase()}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="week"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[60, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
              />
              {showRefLines && (
                <>
                  <ReferenceLine
                    y={95}
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    label={{ value: "95% Fantastic", fill: "#10b981", fontSize: 10, position: "right" }}
                  />
                  <ReferenceLine
                    y={90}
                    stroke="#3b82f6"
                    strokeDasharray="5 5"
                    label={{ value: "90% Great", fill: "#3b82f6", fontSize: 10, position: "right" }}
                  />
                  <ReferenceLine
                    y={85}
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    label={{ value: "85% Fair", fill: "#f59e0b", fontSize: 10, position: "right" }}
                  />
                </>
              )}
              {showDwc && (
                <Line
                  type="monotone"
                  dataKey="dwc"
                  name="DWC %"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )}
              {showIadc && (
                <Line
                  type="monotone"
                  dataKey="iadc"
                  name="IADC %"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={showDwc} onCheckedChange={(checked) => setShowDwc(!!checked)} />
            <span className="text-emerald-400">DWC</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={showIadc} onCheckedChange={(checked) => setShowIadc(!!checked)} />
            <span className="text-violet-400">IADC</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={showRefLines} onCheckedChange={(checked) => setShowRefLines(!!checked)} />
            <span className="text-muted-foreground">Lignes de référence</span>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
