"use client"

import { useState } from "react"
import { useDashboardStore, type PeriodMode } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, getWeek, startOfWeek, endOfWeek } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

export function PeriodPicker() {
  const {
    periodMode,
    setPeriodMode,
    selectedDate,
    setSelectedDate,
    dateRange,
    setDateRange,
    navigatePeriod,
  } = useDashboardStore()

  const [open, setOpen] = useState(false)

  // Format display text based on mode
  const getDisplayText = () => {
    if (periodMode === "day") {
      return format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
    }
    if (periodMode === "week") {
      const weekNum = getWeek(selectedDate, { weekStartsOn: 1 })
      const year = selectedDate.getFullYear()
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
      return `Semaine ${weekNum} (${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM", { locale: fr })})`
    }
    if (periodMode === "range" && dateRange) {
      return `${format(dateRange.from, "d MMM", { locale: fr })} - ${format(dateRange.to, "d MMM yyyy", { locale: fr })}`
    }
    return "Sélectionner une période"
  }

  // Handle mode change
  const handleModeChange = (mode: string) => {
    setPeriodMode(mode as PeriodMode)
    if (mode === "range" && !dateRange) {
      // Initialize with current week when switching to range
      const from = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const to = endOfWeek(selectedDate, { weekStartsOn: 1 })
      setDateRange({ from, to })
    }
  }

  // Handle day selection
  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      if (periodMode === "day") {
        setOpen(false)
      }
    }
  }

  // Handle range selection
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({ from: range.from, to: range.to })
      setOpen(false)
    } else if (range?.from) {
      setDateRange({ from: range.from, to: range.from })
    }
  }

  // Handle week selection (click on any day to select that week)
  const handleWeekSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigatePeriod("prev")}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[240px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* Mode tabs */}
          <div className="border-b p-3">
            <Tabs value={periodMode} onValueChange={handleModeChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day">Jour</TabsTrigger>
                <TabsTrigger value="week">Semaine</TabsTrigger>
                <TabsTrigger value="range">Période</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Calendar based on mode */}
          <div className="p-3">
            {periodMode === "day" && (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDaySelect}
                initialFocus
              />
            )}

            {periodMode === "week" && (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleWeekSelect}
                modifiers={{
                  selectedWeek: (date) => {
                    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
                    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
                    return date >= weekStart && date <= weekEnd
                  },
                }}
                modifiersClassNames={{
                  selectedWeek: "bg-primary/20 text-primary rounded-none first:rounded-l-md last:rounded-r-md",
                }}
                initialFocus
              />
            )}

            {periodMode === "range" && (
              <Calendar
                mode="range"
                selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                initialFocus
              />
            )}
          </div>

          {/* Quick presets for range mode */}
          {periodMode === "range" && (
            <div className="border-t p-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const from = new Date(now.getFullYear(), now.getMonth(), 1)
                    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    setDateRange({ from, to })
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
                    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                    const to = new Date(now.getFullYear(), now.getMonth(), 0)
                    setDateRange({ from, to })
                    setOpen(false)
                  }}
                >
                  Mois dernier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
                    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    setDateRange({ from, to })
                    setOpen(false)
                  }}
                >
                  3 derniers mois
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigatePeriod("next")}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
