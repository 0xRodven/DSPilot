"use client";

import Link from "next/link";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { HelpCircle } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipContent, TooltipProvider, TooltipTrigger, Tooltip as UITooltip } from "@/components/ui/tooltip";
import { useFilters } from "@/lib/filters";
import { useDashboardStore } from "@/lib/store";

// Chart configuration with DWC% range colors (gradient-based)
const dwcRangeChartConfig = {
  drivers: { label: "Drivers" },
  above95: { label: "≥95%", color: "#10b981" }, // emerald-500
  pct90to95: { label: "90-95%", color: "#3b82f6" }, // blue-500
  pct85to90: { label: "85-90%", color: "#f59e0b" }, // amber-500
  pct80to85: { label: "80-85%", color: "#f97316" }, // orange-500
  below80: { label: "<80%", color: "#ef4444" }, // red-500
} satisfies ChartConfig;

type DwcRangeKey = "above95" | "pct90to95" | "pct85to90" | "pct80to85" | "below80";

export function TierDistribution() {
  const { selectedStation } = useDashboardStore();
  const { period, year, weekNum, date, normalizedTime } = useFilters();

  // Get station from Convex - skip if no code yet (prevents race condition on navigation)
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  // Get KPIs from Convex - choose query based on mode
  const kpisWeekly = useQuery(
    api.stats.getDashboardKPIs,
    station && period === "week" ? { stationId: station._id, year, week: weekNum } : "skip",
  );

  const kpisDaily = useQuery(
    api.stats.getDashboardKPIsDaily,
    station && period === "day" ? { stationId: station._id, date } : "skip",
  );

  const kpisRange = useQuery(
    api.stats.getDashboardKPIsRange,
    station && period === "range"
      ? { stationId: station._id, startDate: normalizedTime.start, endDate: normalizedTime.end }
      : "skip",
  );

  const kpis = period === "day" ? kpisDaily : period === "range" ? kpisRange : kpisWeekly;

  // Loading state
  if (!station || kpis === undefined) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!kpis || !kpis.dwcDistribution) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-semibold text-base">Distribution DWC%</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">Aucune donnee disponible</p>
        </CardContent>
      </Card>
    );
  }

  // Transform dwcDistribution data for recharts
  const chartData = (["above95", "pct90to95", "pct85to90", "pct80to85", "below80"] as DwcRangeKey[]).map((range) => ({
    range,
    drivers: kpis.dwcDistribution[range] || 0,
    fill: `var(--color-${range})`,
  }));

  const totalDrivers = chartData.reduce((sum, item) => sum + item.drivers, 0);

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="font-semibold text-base">Distribution DWC%</CardTitle>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  Repartition des drivers par plage de score DWC% : ≥95%, 90-95%, 85-90%, 80-85%, &lt;80%
                </p>
              </TooltipContent>
            </UITooltip>
          </div>
        </CardHeader>

        <CardContent className="h-48">
          <ChartContainer config={dwcRangeChartConfig} className="size-full">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="drivers"
                nameKey="range"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                cornerRadius={4}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground font-bold text-3xl tabular-nums"
                          >
                            {totalDrivers.toLocaleString()}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className="fill-muted-foreground text-sm">
                            Drivers
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
              <ChartLegend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                content={() => (
                  <ul className="ml-8 flex flex-col gap-3">
                    {chartData.map((item) => (
                      <li key={item.range} className="flex w-32 items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ background: item.fill }} />
                          <span className="text-muted-foreground text-sm">{dwcRangeChartConfig[item.range].label}</span>
                        </span>
                        <span className="font-medium text-sm tabular-nums">{item.drivers}</span>
                      </li>
                    ))}
                  </ul>
                )}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>

        <CardFooter className="gap-2 pt-0">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/dashboard/drivers">Voir les drivers</Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Exporter
          </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
