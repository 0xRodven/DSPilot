// src/lib/filters/parsers.ts
// Parsers nuqs pour la gestion de l'état URL

import { getISOWeek, getISOWeekYear } from "date-fns";
import { parseAsString } from "nuqs";

// ============================================================================
// TYPES
// ============================================================================

export type WeekValue = { year: number; week: number };
export type RangeValue = { start: Date; end: Date };
export type PeriodMode = "day" | "week" | "range";
// Legacy tier filter type - kept for backward compatibility
export type TierFilter = "all" | "fantastic" | "great" | "fair" | "poor";

// New DWC% range filter type
export type DwcRangeFilter = "all" | "above95" | "pct90to95" | "pct85to90" | "pct80to85" | "below80";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse week string "2025-W49" to WeekValue
 */
export function parseWeekString(value: string): WeekValue | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  if (week < 1 || week > 53) return null;
  return { year, week };
}

/**
 * Serialize WeekValue to "2025-W49" format
 */
export function serializeWeek(value: WeekValue): string {
  return `${value.year}-W${value.week.toString().padStart(2, "0")}`;
}

/**
 * Parse range string "2025-01-01_2025-01-31" to RangeValue
 */
export function parseRangeString(value: string): RangeValue | null {
  if (!value) return null;
  const parts = value.split("_");
  if (parts.length !== 2) return null;
  const [startStr, endStr] = parts;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

/**
 * Serialize RangeValue to "2025-01-01_2025-01-31" format
 */
export function serializeRange(value: RangeValue): string {
  return `${value.start.toISOString().slice(0, 10)}_${value.end.toISOString().slice(0, 10)}`;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

function getCurrentWeekString(): string {
  const now = new Date();
  // Use ISO week year to handle year boundary correctly
  // e.g., Dec 29, 2025 is ISO week 1 of 2026, not week 1 of 2025
  const year = getISOWeekYear(now);
  const week = getISOWeek(now);
  return serializeWeek({ year, week });
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================================
// FILTER PARSERS - Using simple string parsers
// ============================================================================

export const filterParsers = {
  // === Temps ===
  period: parseAsString.withDefault("week"),
  week: parseAsString.withDefault(getCurrentWeekString()),
  date: parseAsString.withDefault(getTodayString()),
  range: parseAsString, // Optional, no default

  // === Station ===
  station: parseAsString.withDefault(""),

  // === Filtres spécifiques pages ===
  tier: parseAsString.withDefault("all"),
  errorType: parseAsString.withDefault("all"),
  search: parseAsString.withDefault(""),
  driver: parseAsString.withDefault(""),
};

// Type pour les valeurs brutes de l'URL
export type RawFilterValues = {
  period: string;
  week: string;
  date: string;
  range: string | null;
  station: string;
  tier: string;
  errorType: string;
  search: string;
  driver: string;
};

// Type pour les valeurs typées (après parsing)
export type FilterValues = {
  period: PeriodMode;
  week: WeekValue;
  date: string;
  range: RangeValue | null;
  station: string;
  tier: TierFilter;
  errorType: string;
  search: string;
};
