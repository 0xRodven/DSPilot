"use client"

import { useState, useCallback } from "react"
import { CalendarIcon, Check } from "lucide-react"
import { format, startOfWeek, subWeeks, subDays, getWeek } from "date-fns"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

type Granularity = "day" | "week"

interface DatePresetPickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  granularity: Granularity
  className?: string
}

type PresetKey = "thisWeek" | "lastWeek" | "week2" | "week3" | "week4" | "today" | "yesterday" | "day2" | "day3" | "day7"

interface Preset {
  key: PresetKey
  label: string
  getDate: () => Date
  granularity: Granularity
}

const PRESETS: Preset[] = [
  // Week presets
  {
    key: "thisWeek",
    label: "Cette semaine",
    getDate: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    granularity: "week",
  },
  {
    key: "lastWeek",
    label: "Semaine dernière",
    getDate: () => startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
    granularity: "week",
  },
  {
    key: "week2",
    label: "Il y a 2 semaines",
    getDate: () => startOfWeek(subWeeks(new Date(), 2), { weekStartsOn: 1 }),
    granularity: "week",
  },
  {
    key: "week3",
    label: "Il y a 3 semaines",
    getDate: () => startOfWeek(subWeeks(new Date(), 3), { weekStartsOn: 1 }),
    granularity: "week",
  },
  {
    key: "week4",
    label: "Il y a 4 semaines",
    getDate: () => startOfWeek(subWeeks(new Date(), 4), { weekStartsOn: 1 }),
    granularity: "week",
  },
  // Day presets
  {
    key: "today",
    label: "Aujourd'hui",
    getDate: () => new Date(),
    granularity: "day",
  },
  {
    key: "yesterday",
    label: "Hier",
    getDate: () => subDays(new Date(), 1),
    granularity: "day",
  },
  {
    key: "day2",
    label: "Il y a 2 jours",
    getDate: () => subDays(new Date(), 2),
    granularity: "day",
  },
  {
    key: "day3",
    label: "Il y a 3 jours",
    getDate: () => subDays(new Date(), 3),
    granularity: "day",
  },
  {
    key: "day7",
    label: "Il y a 7 jours",
    getDate: () => subDays(new Date(), 7),
    granularity: "day",
  },
]

export function DatePresetPicker({
  selectedDate,
  onDateChange,
  granularity,
  className,
}: DatePresetPickerProps) {
  const [open, setOpen] = useState(false)
  const [tempDate, setTempDate] = useState<Date>(selectedDate)

  const filteredPresets = PRESETS.filter((p) => p.granularity === granularity)

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setTempDate(selectedDate)
      }
      setOpen(isOpen)
    },
    [selectedDate]
  )

  const handlePresetClick = useCallback((preset: Preset) => {
    const newDate = preset.getDate()
    setTempDate(newDate)
    onDateChange(newDate)
    setOpen(false)
  }, [onDateChange])

  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    if (date) {
      // For week mode, snap to start of week
      const finalDate = granularity === "week"
        ? startOfWeek(date, { weekStartsOn: 1 })
        : date
      setTempDate(finalDate)
    }
  }, [granularity])

  const handleApply = useCallback(() => {
    onDateChange(tempDate)
    setOpen(false)
  }, [tempDate, onDateChange])

  const isPresetSelected = (preset: Preset) => {
    const presetDate = preset.getDate()
    if (granularity === "week") {
      const presetWeek = getWeek(presetDate, { weekStartsOn: 1 })
      const selectedWeek = getWeek(tempDate, { weekStartsOn: 1 })
      return (
        presetWeek === selectedWeek &&
        presetDate.getFullYear() === tempDate.getFullYear()
      )
    }
    return presetDate.toDateString() === tempDate.toDateString()
  }

  const formatTempDate = () => {
    if (granularity === "week") {
      const weekNum = getWeek(tempDate, { weekStartsOn: 1 })
      return `S${weekNum} - ${format(tempDate, "d MMM yyyy", { locale: fr })}`
    }
    return format(tempDate, "EEEE d MMMM yyyy", { locale: fr })
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-7 w-7", className)}>
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Left column: Presets */}
          <div className="w-[160px] border-r p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Raccourcis
            </p>
            <div className="space-y-1">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                    isPresetSelected(preset)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {preset.label}
                  {isPresetSelected(preset) && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right column: Calendar */}
          <div className="p-3">
            <Calendar
              mode="single"
              selected={tempDate}
              onSelect={handleCalendarSelect}
              numberOfMonths={1}
              locale={fr}
              weekStartsOn={1}
              initialFocus
            />

            {/* Selected date display */}
            <div className="mt-3 rounded-md bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground">Sélection</p>
              <p className="text-sm font-medium capitalize">{formatTempDate()}</p>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleApply}>
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
