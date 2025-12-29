// src/lib/filters/types.ts
// Types pour le système de filtrage URL-first

import type { Id } from "@convex/_generated/dataModel"

// ============================================================================
// TIME GRANULARITY
// ============================================================================

export type TimeGranularity = "day" | "week" | "range"

// ============================================================================
// NORMALIZED TIME FILTER
// ============================================================================

/**
 * Format normalisé pour l'API Convex
 * Toutes les queries reçoivent ce format uniforme
 */
export interface NormalizedTimeFilter {
  /** Date de début au format ISO (YYYY-MM-DD) */
  start: string
  /** Date de fin au format ISO (YYYY-MM-DD) */
  end: string
  /** Granularité pour l'agrégation des données */
  granularity: TimeGranularity
  /** Année ISO (pour compatibilité avec queries existantes) */
  year?: number
  /** Semaine ISO (pour compatibilité avec queries existantes) */
  week?: number
  /** Date unique pour mode jour (pour compatibilité) */
  dateStr?: string
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

/**
 * Filtres complets normalisés pour les queries Convex
 */
export interface QueryFilters {
  stationId: Id<"stations">
  time: NormalizedTimeFilter
  // Filtres optionnels spécifiques aux pages
  tier?: "fantastic" | "great" | "fair" | "poor"
  errorType?: string
  search?: string
}

// ============================================================================
// URL STATE
// ============================================================================

/**
 * État brut de l'URL (avant normalisation)
 */
export interface URLFilterState {
  period: "day" | "week" | "range"
  week: { year: number; week: number }
  date: string
  range: { start: Date; end: Date } | null
  station: string
  tier: "all" | "fantastic" | "great" | "fair" | "poor"
  errorType: string
  search: string
}

// ============================================================================
// NAVIGATION
// ============================================================================

export type NavigationDirection = "prev" | "next"

// ============================================================================
// STATION
// ============================================================================

export interface Station {
  id: string
  name: string
  code: string
}

// ============================================================================
// LEGACY COMPAT TYPES
// ============================================================================

/**
 * Pour compatibilité avec les anciens hooks useTimeParams()
 * Sera supprimé après migration complète
 */
export interface LegacyTimeParams {
  year: number
  week: number
  dateStr: string
  mode: "day" | "week"
  time: {
    type: "day" | "week"
    date?: Date
    year?: number
    week?: number
  }
}
