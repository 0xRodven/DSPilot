"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Bar, ComposedChart, Line, XAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface DnrSparklineProps {
  stationId: Id<"stations">;
  year: number;
  week: number;
}

const chartConfig = {
  investigations: {
    label: "Investigations",
    color: "hsl(var(--chart-1))",
  },
  confirmedDnr: {
    label: "DNR confirmés",
    color: "hsl(var(--destructive))",
  },
};

export function DnrSparkline({ stationId, year, week }: DnrSparklineProps) {
  const trend = useQuery(api.dnr.getTrend, { stationId, year, week });

  if (trend === undefined) {
    return <Skeleton className="h-[60px] w-full" />;
  }

  const data = trend.map((t) => ({
    label: `S${t.week}`,
    investigations: t.investigations,
    confirmedDnr: t.confirmedDnr,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[60px] w-full">
      <ComposedChart data={data}>
        <XAxis dataKey="label" hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="confirmedDnr" fill="var(--color-confirmedDnr)" radius={[2, 2, 0, 0]} barSize={12} />
        <Line
          dataKey="investigations"
          stroke="var(--color-investigations)"
          strokeWidth={2}
          dot={false}
          type="monotone"
        />
      </ComposedChart>
    </ChartContainer>
  );
}
