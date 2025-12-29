// src/lib/filters/index.ts
// Point d'entrée pour le système de filtrage URL-first

// Hooks
export {
  useFilters,
  useStationFilter,
  useTimeParams, // Legacy compat
  useFilteredHref,
  useBuildFilteredHref,
} from "./hooks"

// Parsers & helpers
export {
  filterParsers,
  parseWeekString,
  serializeWeek,
  parseRangeString,
  serializeRange,
} from "./parsers"

// Types from parsers
export type {
  FilterValues,
  RawFilterValues,
  PeriodMode,
  TierFilter,
  WeekValue,
  RangeValue,
} from "./parsers"

// Types from types file
export type {
  NormalizedTimeFilter,
  QueryFilters,
  URLFilterState,
  NavigationDirection,
  Station,
  TimeGranularity,
} from "./types"

// Normalization helpers
export {
  normalizeTimeFilter,
  formatTimeDisplay,
  navigateTime,
  getTodayValues,
  isCurrentPeriod,
} from "./normalization"
