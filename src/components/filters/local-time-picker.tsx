"use client";

// src/components/filters/local-time-picker.tsx
// Picker de période pour les FilterSection

import { useState } from "react";

import { Calendar, CalendarDays, CalendarRange, ChevronDown, Clock, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TimeContext, TimePreset } from "@/lib/types/filters";
import { cn } from "@/lib/utils";
import { formatTimeContext } from "@/lib/utils/time-context";

// ============================================================================
// PROPS
// ============================================================================

interface LocalTimePickerProps {
  value: TimeContext | null;
  onChange: (time: TimeContext) => void;
  onReset: () => void;
  allowedModes?: TimeContext["type"][];
  presets?: TimePreset[];
  isOverridden?: boolean;
  className?: string;
}

// ============================================================================
// DEFAULT PRESETS
// ============================================================================

const DEFAULT_PRESETS: TimePreset[] = [
  {
    label: "4 dernières semaines",
    shortLabel: "4S",
    value: { type: "relative", anchor: "now", offset: -4, unit: "weeks" },
  },
  {
    label: "8 dernières semaines",
    shortLabel: "8S",
    value: { type: "relative", anchor: "now", offset: -8, unit: "weeks" },
  },
  {
    label: "12 dernières semaines",
    shortLabel: "12S",
    value: { type: "relative", anchor: "now", offset: -12, unit: "weeks" },
  },
  {
    label: "3 derniers mois",
    shortLabel: "3M",
    value: { type: "relative", anchor: "now", offset: -3, unit: "months" },
  },
  {
    label: "6 derniers mois",
    shortLabel: "6M",
    value: { type: "relative", anchor: "now", offset: -6, unit: "months" },
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function getPresetIcon(time: TimeContext) {
  switch (time.type) {
    case "day":
      return CalendarDays;
    case "week":
      return Calendar;
    case "range":
      return CalendarRange;
    case "relative":
      return Clock;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LocalTimePicker({
  value,
  onChange,
  onReset,
  allowedModes = ["day", "week", "range", "relative"],
  presets = DEFAULT_PRESETS,
  isOverridden = false,
  className,
}: LocalTimePickerProps) {
  const [open, setOpen] = useState(false);

  // Filter presets based on allowed modes
  const filteredPresets = presets.filter((p) => allowedModes.includes(p.value.type));

  const handleSelect = (preset: TimePreset) => {
    onChange(preset.value);
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-7 gap-1.5 font-normal text-xs",
            isOverridden && "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10",
            className,
          )}
        >
          {value ? (
            <>
              <span className="text-muted-foreground">Période:</span>
              <span className={cn(isOverridden && "text-amber-600 dark:text-amber-400")}>
                {formatTimeContext(value, { short: true })}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Changer la période</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[240px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Rechercher..." className="h-9" />
          <CommandList>
            <CommandEmpty>Aucun résultat.</CommandEmpty>

            {/* Reset button */}
            {isOverridden && (
              <>
                <CommandGroup>
                  <CommandItem onSelect={handleReset} className="text-muted-foreground">
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    <span>Utiliser le filtre global</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Relative presets */}
            {filteredPresets.some((p) => p.value.type === "relative") && (
              <CommandGroup heading="Périodes relatives">
                {filteredPresets
                  .filter((p) => p.value.type === "relative")
                  .map((preset) => {
                    const Icon = getPresetIcon(preset.value);
                    const isSelected =
                      value &&
                      value.type === preset.value.type &&
                      JSON.stringify(value) === JSON.stringify(preset.value);

                    return (
                      <CommandItem
                        key={preset.label}
                        onSelect={() => handleSelect(preset)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{preset.label}</span>
                        </div>
                        {preset.shortLabel && (
                          <Badge
                            variant="secondary"
                            className={cn("px-1.5 text-[10px]", isSelected && "bg-amber-500/20 text-amber-600")}
                          >
                            {preset.shortLabel}
                          </Badge>
                        )}
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            )}

            {/* Fixed range presets */}
            {filteredPresets.some((p) => p.value.type === "range") && (
              <CommandGroup heading="Périodes fixes">
                {filteredPresets
                  .filter((p) => p.value.type === "range")
                  .map((preset) => {
                    const Icon = getPresetIcon(preset.value);
                    return (
                      <CommandItem
                        key={preset.label}
                        onSelect={() => handleSelect(preset)}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{preset.label}</span>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// SIMPLE PERIOD TOGGLE
// ============================================================================

interface PeriodToggleProps {
  value: number;
  onChange: (weeks: number) => void;
  options?: number[];
  className?: string;
}

/**
 * Toggle simple pour sélectionner le nombre de semaines (4W/8W/12W)
 * Alternative plus légère au LocalTimePicker pour les graphiques
 */
export function PeriodToggle({ value, onChange, options = [4, 8, 12], className }: PeriodToggleProps) {
  return (
    <div className={cn("inline-flex items-center rounded-md border bg-muted p-0.5", className)}>
      {options.map((weeks) => (
        <button
          key={weeks}
          onClick={() => onChange(weeks)}
          className={cn(
            "rounded-sm px-2 py-0.5 font-medium text-xs transition-colors",
            value === weeks ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {weeks}S
        </button>
      ))}
    </div>
  );
}
