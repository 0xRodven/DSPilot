// src/lib/filters/index.ts
// Point d'entrée pour le système de filtrage URL-first

// Hooks
export {
  useBuildFilteredHref,
  useFilteredHref,
  useFilters,
  useStationFilter,
  useTimeParams, // Legacy compat
} from "./hooks";
// Normalization helpers
export {
  formatTimeDisplay,
  getTodayValues,
  isCurrentPeriod,
  navigateTime,
  normalizeTimeFilter,
} from "./normalization";
// Types from parsers
export type {
  FilterValues,
  PeriodMode,
  RangeValue,
  RawFilterValues,
  TierFilter,
  WeekValue,
} from "./parsers";
// Parsers & helpers
export {
  filterParsers,
  parseRangeString,
  parseWeekString,
  serializeRange,
  serializeWeek,
} from "./parsers";
// Types from types file
export type {
  NavigationDirection,
  NormalizedTimeFilter,
  QueryFilters,
  Station,
  TimeGranularity,
  URLFilterState,
} from "./types";
