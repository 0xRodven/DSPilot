"use client";

// src/components/filters/filter-section.tsx
// Composant wrapper pour créer un contexte de filtrage local

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { useDashboardStore } from "@/lib/store";
import type { FilterSectionContextValue, TimeContext, TimePreset, TimeQueryParams } from "@/lib/types/filters";
import { cn } from "@/lib/utils";
import { timeContextToQueryParams } from "@/lib/utils/time-context";

import { FilterBadge } from "./filter-badge";
import { LocalTimePicker } from "./local-time-picker";

// ============================================================================
// CONTEXT
// ============================================================================

const FilterSectionContext = createContext<FilterSectionContextValue | null>(null);

// ============================================================================
// PROPS
// ============================================================================

interface FilterSectionProps {
  children: ReactNode;

  // Surcharge optionnelle de la période (état initial local)
  timeOverride?: TimeContext;

  // Affichage
  title?: string;
  description?: string;
  showBadge?: boolean;
  showLocalPicker?: boolean;

  // Options du picker local
  allowedModes?: TimeContext["type"][];
  presets?: TimePreset[];

  // Style
  className?: string;
  variant?: "default" | "card" | "subtle";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilterSection({
  children,
  timeOverride,
  title,
  description,
  showBadge = true,
  showLocalPicker = false,
  allowedModes = ["day", "week", "range"],
  presets,
  className,
  variant = "default",
}: FilterSectionProps) {
  // Global state
  const globalTime = useDashboardStore((s) => s.time);

  // Local state (null = use global)
  const [localTime, setLocalTime] = useState<TimeContext | null>(timeOverride ?? null);

  // Computed
  const effectiveTime = localTime ?? globalTime;
  const isOverridden = localTime !== null;
  const queryParams = useMemo(() => timeContextToQueryParams(effectiveTime), [effectiveTime]);

  // Actions
  const resetToGlobal = useCallback(() => {
    setLocalTime(null);
  }, []);

  // Context value
  const contextValue = useMemo<FilterSectionContextValue>(
    () => ({
      time: effectiveTime,
      setTime: setLocalTime,
      resetToGlobal,
      isOverridden,
      queryParams,
    }),
    [effectiveTime, isOverridden, queryParams, resetToGlobal],
  );

  // Variant styles
  const variantStyles = {
    default: cn("relative", isOverridden && "ring-1 ring-amber-500/30 rounded-xl"),
    card: cn("relative rounded-xl border bg-card", isOverridden && "ring-1 ring-amber-500/30"),
    subtle: cn("relative", isOverridden && "bg-amber-500/5 rounded-xl"),
  };

  const hasHeader = title || description || showBadge || showLocalPicker;

  return (
    <FilterSectionContext.Provider value={contextValue}>
      <div className={cn(variantStyles[variant], className)}>
        {/* Override indicator */}
        {isOverridden && variant === "default" && (
          <div className="-top-2.5 absolute left-4 z-10">
            <span className="rounded bg-amber-500/15 px-2 py-0.5 font-medium text-[10px] text-amber-600 dark:text-amber-400">
              Filtre local actif
            </span>
          </div>
        )}

        {/* Header */}
        {hasHeader && (
          <div
            className={cn(
              "flex items-center justify-between gap-4",
              variant === "card" ? "border-b px-4 py-3" : "px-4 py-2",
              isOverridden && variant === "default" && "pt-4",
            )}
          >
            <div className="min-w-0 flex-1">
              {title && <h3 className="font-semibold text-foreground text-sm">{title}</h3>}
              {description && <p className="mt-0.5 text-muted-foreground text-xs">{description}</p>}
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              {showBadge && <FilterBadge time={effectiveTime} isOverridden={isOverridden} />}

              {showLocalPicker && (
                <LocalTimePicker
                  value={localTime}
                  onChange={setLocalTime}
                  onReset={resetToGlobal}
                  allowedModes={allowedModes}
                  presets={presets}
                  isOverridden={isOverridden}
                />
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn(variant === "card" && "p-4")}>{children}</div>
      </div>
    </FilterSectionContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour consommer le contexte de section.
 * Fallback automatique sur le store global si pas de FilterSection parent.
 */
export function useFilterSection(): FilterSectionContextValue {
  const context = useContext(FilterSectionContext);
  const globalTime = useDashboardStore((s) => s.time);
  const setTime = useDashboardStore((s) => s.setTime);

  // Si pas de contexte de section, utiliser le global
  if (!context) {
    return {
      time: globalTime,
      setTime: setTime,
      resetToGlobal: () => {},
      isOverridden: false,
      queryParams: timeContextToQueryParams(globalTime),
    };
  }

  return context;
}

/**
 * Hook simplifié pour obtenir juste les query params
 */
export function useFilterSectionQueryParams(): TimeQueryParams & {
  stationId?: string;
} {
  const { queryParams } = useFilterSection();
  const selectedStation = useDashboardStore((s) => s.selectedStation);

  return {
    stationId: selectedStation.id || undefined,
    ...queryParams,
  };
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { FilterBadge } from "./filter-badge";
export { LocalTimePicker, PeriodToggle } from "./local-time-picker";
