"use client"

import { useState } from "react"
import { useFilters, type PeriodMode } from "@/lib/filters"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { getWeek, getYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, addWeeks } from "date-fns"
import { getDateFromWeek } from "@/lib/utils/time-context"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

export function PeriodPicker() {
  const {
    period,
    week,
    date,
    range,
    setPeriod,
    setWeek,
    setDate,
    setRange,
    setFilters,
    navigate,
    displayLabel,
    canNavigate,
  } = useFilters()

  const [open, setOpen] = useState(false)

  // Get current mode
  const currentMode: PeriodMode = period

  // Handle mode change
  const handleModeChange = (mode: string) => {
    const now = new Date()

    switch (mode as PeriodMode) {
      case "day":
        setFilters({
          period: "day",
          date: now.toISOString().slice(0, 10),
        })
        break
      case "week":
        setFilters({
          period: "week",
          week: {
            year: getYear(now),
            week: getWeek(now, { weekStartsOn: 1 }),
          },
        })
        break
      case "range":
        // Initialize with current week when switching to range
        const from = startOfWeek(now, { weekStartsOn: 1 })
        const to = endOfWeek(now, { weekStartsOn: 1 })
        setFilters({
          period: "range",
          range: { start: from, end: to },
        })
        break
    }
  }

  // Handle day selection
  const handleDaySelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate.toISOString().slice(0, 10))
      setOpen(false)
    }
  }

  // Handle week selection (click on any day to select that week)
  const handleWeekSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setWeek({
        year: getYear(selectedDate),
        week: getWeek(selectedDate, { weekStartsOn: 1 }),
      })
      setOpen(false)
    }
  }

  // Handle range selection
  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    if (selectedRange?.from && selectedRange?.to) {
      setRange({
        start: selectedRange.from,
        end: selectedRange.to,
      })
      setOpen(false)
    } else if (selectedRange?.from) {
      // Partial selection, don't close yet
      setRange({
        start: selectedRange.from,
        end: selectedRange.from,
      })
    }
  }

  // Get selected date for calendar (for week mode highlighting)
  const getSelectedDate = (): Date => {
    if (period === "day") return new Date(date)
    if (period === "week") {
      return getDateFromWeek(week.year, week.week)
    }
    if (period === "range" && range) return range.start
    return new Date()
  }

  const selectedDate = getSelectedDate()

  // Show navigation for all modes except relative (which we don't have anymore)
  const showNavigation = canNavigate

  // Handle relative presets (convert to actual range)
  const handleRelativePreset = (offsetWeeks: number) => {
    const now = new Date()
    const end = endOfWeek(now, { weekStartsOn: 1 })
    const start = startOfWeek(addWeeks(now, offsetWeeks), { weekStartsOn: 1 })
    setFilters({
      period: "range",
      range: { start, end },
    })
    setOpen(false)
  }

  const handleMonthsPreset = (offsetMonths: number) => {
    const now = new Date()
    const end = now
    const start = subMonths(now, Math.abs(offsetMonths))
    setFilters({
      period: "range",
      range: { start, end },
    })
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-1 md:gap-2">
      {/* Navigation buttons */}
      {showNavigation && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("prev")}
          className="h-7 w-7 md:h-8 md:w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[140px] md:min-w-[240px] justify-start text-left font-normal h-8 md:h-9 text-xs md:text-sm"
            )}
          >
            <CalendarIcon className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
            <span className="truncate">{displayLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* Mode tabs */}
          <div className="border-b p-3">
            <Tabs value={currentMode} onValueChange={handleModeChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day">Jour</TabsTrigger>
                <TabsTrigger value="week">Semaine</TabsTrigger>
                <TabsTrigger value="range">Période</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Calendar based on mode */}
          <div className="p-3">
            {currentMode === "day" && (
              <Calendar
                mode="single"
                selected={new Date(date)}
                onSelect={handleDaySelect}
                initialFocus
              />
            )}

            {currentMode === "week" && (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleWeekSelect}
                modifiers={{
                  selectedWeek: (d) => {
                    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
                    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
                    return d >= weekStart && d <= weekEnd
                  },
                }}
                modifiersClassNames={{
                  selectedWeek: "bg-primary/20 text-primary rounded-none first:rounded-l-md last:rounded-r-md",
                }}
                initialFocus
              />
            )}

            {currentMode === "range" && (
              <Calendar
                mode="range"
                selected={range ? { from: range.start, to: range.end } : undefined}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                initialFocus
              />
            )}
          </div>

          {/* Quick presets for range mode */}
          {currentMode === "range" && (
            <div className="border-t p-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRelativePreset(-4)}
                >
                  4 semaines
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRelativePreset(-8)}
                >
                  8 semaines
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const from = startOfMonth(now)
                    const to = endOfMonth(now)
                    setFilters({
                      period: "range",
                      range: { start: from, end: to },
                    })
                    setOpen(false)
                  }}
                >
                  Ce mois
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const from = startOfMonth(subMonths(now, 1))
                    const to = endOfMonth(subMonths(now, 1))
                    setFilters({
                      period: "range",
                      range: { start: from, end: to },
                    })
                    setOpen(false)
                  }}
                >
                  Mois dernier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthsPreset(-3)}
                >
                  3 mois
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Navigation buttons */}
      {showNavigation && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("next")}
          className="h-7 w-7 md:h-8 md:w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
