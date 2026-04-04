"use client";

import { useMemo } from "react";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import type { DnrRow } from "./dnr-table/columns";

interface DnrDailyChartProps {
  data: DnrRow[];
  selectedDay: string | null;
  onDayClick: (day: string | null) => void;
}

const chartConfig = {
  concessions: {
    label: "DNR",
    color: "hsl(217 91% 60%)", // blue-500
  },
  investigations: {
    label: "Investigations",
    color: "hsl(263 70% 58%)", // violet-500
  },
};

const DAYS_FR_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function DnrDailyChart({ data, selectedDay, onDayClick }: DnrDailyChartProps) {
  const chartData = useMemo(() => {
    // Group by date
    const byDate = new Map<string, { concessions: number; investigations: number }>();

    for (const row of data) {
      const dateStr = row.concessionDatetime?.split(" ")[0] ?? row.concessionDatetime?.split("T")[0] ?? "";
      if (!dateStr) continue;

      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, { concessions: 0, investigations: 0 });
      }
      const entry = byDate.get(dateStr)!;
      if (row.entryType === "investigation") {
        entry.investigations++;
      } else {
        entry.concessions++;
      }
    }

    // Sort by date and build chart data
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, counts]) => {
        let dayLabel: string;
        try {
          const d = parseISO(dateStr);
          dayLabel = `${DAYS_FR_SHORT[d.getDay()]} ${format(d, "dd/MM", { locale: fr })}`;
        } catch {
          dayLabel = dateStr;
        }

        return {
          date: dateStr,
          dayLabel,
          ...counts,
          total: counts.concessions + counts.investigations,
        };
      });
  }, [data]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-card-foreground text-sm">DNR & Investigations par jour</h3>
          {selectedDay && (
            <button
              type="button"
              className="mt-1 text-muted-foreground text-xs hover:text-foreground"
              onClick={() => onDayClick(null)}
            >
              Affichage filtré — cliquer pour tout afficher
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-blue-500" />
            <span className="text-muted-foreground">DNR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-violet-500" />
            <span className="text-muted-foreground">Investigations</span>
          </div>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[180px] w-full">
        <BarChart
          data={chartData}
          onClick={(state) => {
            if (state?.activePayload?.[0]) {
              const clickedDate = state.activePayload[0].payload.date as string;
              onDayClick(clickedDate === selectedDay ? null : clickedDate);
            }
          }}
          className="cursor-pointer"
        >
          <XAxis
            dataKey="dayLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            width={30}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="concessions" stackId="stack" fill="var(--color-concessions)" radius={[0, 0, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={`c-${entry.date}`} opacity={selectedDay && selectedDay !== entry.date ? 0.3 : 1} />
            ))}
          </Bar>
          <Bar dataKey="investigations" stackId="stack" fill="var(--color-investigations)" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={`i-${entry.date}`} opacity={selectedDay && selectedDay !== entry.date ? 0.3 : 1} />
            ))}
            <LabelList
              dataKey="total"
              position="top"
              className="fill-muted-foreground text-xs font-medium"
              offset={6}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
