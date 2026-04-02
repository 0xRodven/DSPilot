"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface WeekSelectorProps {
  year: number;
  week: number;
  onChange: (year: number, week: number) => void;
  latestWeek?: { year: number; week: number };
  className?: string;
}

export function WeekSelector({ year, week, onChange, latestWeek, className }: WeekSelectorProps) {
  const navigate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      // Go to previous week
      if (week === 1) {
        onChange(year - 1, 52); // Simplified: assume 52 weeks per year
      } else {
        onChange(year, week - 1);
      }
    } else {
      // Go to next week (but not beyond latest week)
      if (latestWeek && year === latestWeek.year && week >= latestWeek.week) {
        return; // Can't go beyond latest week
      }
      if (week === 52) {
        onChange(year + 1, 1);
      } else {
        onChange(year, week + 1);
      }
    }
  };

  const isAtLatest = latestWeek && year === latestWeek.year && week >= latestWeek.week;

  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      <Button variant="ghost" size="icon" onClick={() => navigate("prev")} className="h-8 w-8">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex min-w-[160px] items-center justify-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">
          Semaine {week} • {year}
        </span>
      </div>

      <Button variant="ghost" size="icon" onClick={() => navigate("next")} disabled={isAtLatest} className="h-8 w-8">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
