"use client";

import { useState } from "react";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/lib/store";

const referenceLines = [
  { value: 95, label: "95% Fantastic", color: "#34d399" },
  { value: 90, label: "90% Great", color: "#60a5fa" },
  { value: 88, label: "88% Fair", color: "#fbbf24" },
];

export function PerformanceChart() {
  const { selectedStation } = useDashboardStore();
  const [showDwc, setShowDwc] = useState(true);
  const [showIadc, setShowIadc] = useState(true);
  const [showColis, setShowColis] = useState(false);
  const [showDnr, setShowDnr] = useState(false);
  const [showRefLines, setShowRefLines] = useState({ 95: true, 90: true, 88: true });
  const [period, setPeriod] = useState<"4W" | "8W" | "12W">("8W");

  const weeksCount = period === "4W" ? 4 : period === "8W" ? 8 : 12;

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  const performanceData = useQuery(
    api.stats.getPerformanceEvolution,
    station ? { stationId: station._id, weeksCount } : "skip",
  );

  const isLoading = !station || performanceData === undefined;
  const data = performanceData || [];

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1 h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex items-center gap-3 border-border border-l pl-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-end gap-3 pt-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <Skeleton className="w-full rounded-t" style={{ height: `${40 + (i % 3) * 20}%` }} />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-semibold text-card-foreground text-lg">Évolution Performance</CardTitle>
            <p className="text-muted-foreground text-sm">
              {data.length > 0
                ? `S${data[0]?.weekNumber} → S${data[data.length - 1]?.weekNumber} • ${data.length} semaines`
                : "Aucune donnée disponible"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Period selector */}
            <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
              {(["4W", "8W", "12W"] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "secondary" : "ghost"}
                  size="sm"
                  className={period === p ? "bg-card" : ""}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="mt-4 flex flex-wrap items-center gap-6">
          {/* Metric toggles */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={showDwc}
                onCheckedChange={(checked) => setShowDwc(checked === true)}
                className="border-blue-400 data-[state=checked]:bg-blue-500"
              />
              <span className="font-medium text-blue-400 text-sm">DWC</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={showIadc}
                onCheckedChange={(checked) => setShowIadc(checked === true)}
                className="border-amber-400 data-[state=checked]:bg-amber-500"
              />
              <span className="font-medium text-amber-400 text-sm">IADC</span>
            </label>
            <span className="text-muted-foreground">|</span>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={showColis}
                onCheckedChange={(checked) => setShowColis(checked === true)}
                className="border-emerald-400 data-[state=checked]:bg-emerald-500"
              />
              <span className="font-medium text-emerald-400 text-sm">Colis</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={showDnr}
                onCheckedChange={(checked) => setShowDnr(checked === true)}
                className="border-red-400 data-[state=checked]:bg-red-500"
              />
              <span className="font-medium text-red-400 text-sm">DNR</span>
            </label>
          </div>

          {/* Reference line toggles */}
          <div className="flex items-center gap-3 border-border border-l pl-4">
            <span className="text-muted-foreground text-xs">Lignes réf:</span>
            {referenceLines.map((line) => (
              <label key={line.value} className="flex cursor-pointer items-center gap-1.5">
                <Checkbox
                  checked={showRefLines[line.value as keyof typeof showRefLines]}
                  onCheckedChange={(checked) =>
                    setShowRefLines((prev) => ({ ...prev, [line.value]: checked === true }))
                  }
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs" style={{ color: line.color }}>
                  {line.value}%
                </span>
              </label>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 60, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="week" stroke="#666" fontSize={12} tickLine={false} />

              {/* Left Y-axis for percentages */}
              <YAxis
                yAxisId="left"
                domain={[55, 100]}
                stroke="#666"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />

              {/* Right Y-axis for volumes (only shown when Colis or DNR is active) */}
              {(showColis || showDnr) && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => value.toLocaleString("fr-FR")}
                />
              )}

              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(24, 24, 27, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "Colis" || name === "DNR") {
                    return [value.toLocaleString("fr-FR"), name];
                  }
                  return [`${value}%`, name];
                }}
              />

              {/* Reference lines */}
              {referenceLines.map(
                (line) =>
                  showRefLines[line.value as keyof typeof showRefLines] && (
                    <ReferenceLine
                      key={line.value}
                      yAxisId="left"
                      y={line.value}
                      stroke={line.color}
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                    />
                  ),
              )}

              {/* Volume bars */}
              {showColis && (
                <Bar yAxisId="right" dataKey="totalDeliveries" fill="#34d399" fillOpacity={0.3} name="Colis" />
              )}
              {showDnr && (
                <Bar yAxisId="right" dataKey="deliveryMissesRisk" fill="#f87171" fillOpacity={0.3} name="DNR" />
              )}

              {/* Data lines */}
              {showDwc && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="dwc"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={{ fill: "#60a5fa", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#60a5fa" }}
                  name="DWC"
                />
              )}
              {showIadc && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="iadc"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={{ fill: "#fbbf24", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#fbbf24" }}
                  name="IADC"
                />
              )}

              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
