// convex/lib/timeQuery.ts
// Factory et helpers pour les queries avec filtrage temporel

import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Validateur pour les arguments temporels des queries
 * À utiliser dans les définitions de query
 */
export const timeQueryArgs = {
  stationId: v.optional(v.id("stations")),
  mode: v.union(v.literal("day"), v.literal("week"), v.literal("range")),
  // Mode day
  date: v.optional(v.string()),
  // Mode week
  year: v.optional(v.number()),
  week: v.optional(v.number()),
  // Mode range
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  granularity: v.optional(v.union(v.literal("day"), v.literal("week"))),
};

// ============================================================================
// TYPES
// ============================================================================

export type TimeQueryArgs = {
  stationId?: Id<"stations">;
  mode: "day" | "week" | "range";
  date?: string;
  year?: number;
  week?: number;
  startDate?: string;
  endDate?: string;
  granularity?: "day" | "week";
};

interface TimeQueryHandlers<T> {
  day: (ctx: QueryCtx, date: string) => Promise<T>;
  week: (ctx: QueryCtx, year: number, week: number) => Promise<T>;
  range: (ctx: QueryCtx, startDate: string, endDate: string, granularity: "day" | "week") => Promise<T>;
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Factory pour créer des handlers de query temporelle.
 * Gère automatiquement le dispatch selon le mode.
 *
 * @example
 * ```ts
 * export const getKPIs = query({
 *   args: timeQueryArgs,
 *   handler: async (ctx, args) => {
 *     return getTimeFilteredData(ctx, args, {
 *       day: async (ctx, date) => { ... },
 *       week: async (ctx, year, week) => { ... },
 *       range: async (ctx, startDate, endDate, granularity) => { ... },
 *     })
 *   }
 * })
 * ```
 */
export async function getTimeFilteredData<T>(
  ctx: QueryCtx,
  args: TimeQueryArgs,
  handlers: TimeQueryHandlers<T>,
): Promise<T> {
  switch (args.mode) {
    case "day":
      if (!args.date) {
        throw new Error("date is required for mode 'day'");
      }
      return handlers.day(ctx, args.date);

    case "week":
      if (args.year === undefined || args.week === undefined) {
        throw new Error("year and week are required for mode 'week'");
      }
      return handlers.week(ctx, args.year, args.week);

    case "range":
      if (!args.startDate || !args.endDate) {
        throw new Error("startDate and endDate are required for mode 'range'");
      }
      return handlers.range(ctx, args.startDate, args.endDate, args.granularity ?? "week");

    default:
      throw new Error(`Unknown mode: ${args.mode}`);
  }
}

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Retourne la liste des semaines (year, week) dans une plage de dates
 */
export function getWeeksInRange(startDate: string, endDate: string): Array<{ year: number; week: number }> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const weeks: Array<{ year: number; week: number }> = [];

  let current = getStartOfWeek(start);
  const endWeek = getStartOfWeek(end);

  while (current <= endWeek) {
    weeks.push({
      year: current.getFullYear(),
      week: getWeekNumber(current),
    });
    current = addWeeks(current, 1);
  }

  return weeks;
}

/**
 * Retourne la liste des jours dans une plage de dates
 */
export function getDaysInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: string[] = [];

  let current = new Date(start);
  while (current <= end) {
    days.push(formatDate(current));
    current = addDays(current, 1);
  }

  return days;
}

// Pure JS date helpers (pas de dépendance externe dans Convex)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Retourne les dates de début (dimanche) et fin (samedi) pour une semaine Amazon donnée
 * Amazon utilise des semaines Dimanche→Samedi (pas ISO Lundi→Dimanche)
 * Gère correctement les cas aux frontières d'année
 */
export function getWeekDateRange(year: number, week: number): { start: string; end: string } {
  // Amazon weeks: Dimanche → Samedi
  // Trouver le 1er janvier
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Day = jan1.getUTCDay(); // 0=dimanche, 6=samedi

  // Dimanche de la semaine 1 (peut être en décembre de l'année précédente)
  const week1Sunday = new Date(jan1);
  week1Sunday.setUTCDate(jan1.getUTCDate() - jan1Day);

  // Dimanche de la semaine demandée
  const targetSunday = new Date(week1Sunday);
  targetSunday.setUTCDate(week1Sunday.getUTCDate() + (week - 1) * 7);

  // Samedi de la semaine demandée
  const targetSaturday = new Date(targetSunday);
  targetSaturday.setUTCDate(targetSunday.getUTCDate() + 6);

  return {
    start: formatDate(targetSunday),
    end: formatDate(targetSaturday),
  };
}

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

interface WeeklyStats {
  avgDwcPercent: number;
  avgIadcPercent: number;
  totalDrivers: number;
  tierDistribution: {
    fantastic: number;
    great: number;
    fair: number;
    poor: number;
  };
}

interface AggregatedKPIs {
  dwcPercent: number;
  iadcPercent: number;
  totalDrivers: number;
  tierDistribution: {
    fantastic: number;
    great: number;
    fair: number;
    poor: number;
  };
  dwcDelta: number;
  iadcDelta: number;
  periodWeeks: number;
}

/**
 * Agrège des stats hebdomadaires sur plusieurs semaines
 */
export function aggregateWeeklyStats(stats: (WeeklyStats | null)[]): AggregatedKPIs {
  const validStats = stats.filter((s): s is WeeklyStats => s !== null);

  if (validStats.length === 0) {
    return emptyKPIs();
  }

  // Moyenne pondérée par nombre de drivers
  const totalDriverWeeks = validStats.reduce((sum, s) => sum + s.totalDrivers, 0);

  const avgDwc =
    totalDriverWeeks > 0
      ? validStats.reduce((sum, s) => sum + s.avgDwcPercent * s.totalDrivers, 0) / totalDriverWeeks
      : 0;

  const avgIadc =
    totalDriverWeeks > 0
      ? validStats.reduce((sum, s) => sum + s.avgIadcPercent * s.totalDrivers, 0) / totalDriverWeeks
      : 0;

  // Tier distribution : moyenne
  const tierDistribution = {
    fantastic: Math.round(validStats.reduce((sum, s) => sum + s.tierDistribution.fantastic, 0) / validStats.length),
    great: Math.round(validStats.reduce((sum, s) => sum + s.tierDistribution.great, 0) / validStats.length),
    fair: Math.round(validStats.reduce((sum, s) => sum + s.tierDistribution.fair, 0) / validStats.length),
    poor: Math.round(validStats.reduce((sum, s) => sum + s.tierDistribution.poor, 0) / validStats.length),
  };

  // Tendance : première vs dernière semaine
  const first = validStats[0];
  const last = validStats[validStats.length - 1];
  const dwcDelta = last.avgDwcPercent - first.avgDwcPercent;
  const iadcDelta = last.avgIadcPercent - first.avgIadcPercent;

  return {
    dwcPercent: avgDwc,
    iadcPercent: avgIadc,
    totalDrivers: Math.round(totalDriverWeeks / validStats.length),
    tierDistribution,
    dwcDelta,
    iadcDelta,
    periodWeeks: validStats.length,
  };
}

export function emptyKPIs(): AggregatedKPIs {
  return {
    dwcPercent: 0,
    iadcPercent: 0,
    totalDrivers: 0,
    tierDistribution: { fantastic: 0, great: 0, fair: 0, poor: 0 },
    dwcDelta: 0,
    iadcDelta: 0,
    periodWeeks: 0,
  };
}

// ============================================================================
// COMPUTE HELPERS
// ============================================================================

interface DailyStats {
  totalDeliveries: number;
  dwcCompliant: number;
  iadcCompliant: number;
}

/**
 * Calcule les KPIs depuis des stats journalières
 */
export function computeDailyKPIs(stats: DailyStats[]) {
  if (stats.length === 0) {
    return {
      dwcPercent: 0,
      iadcPercent: 0,
      totalDeliveries: 0,
      activeDays: 0,
    };
  }

  const totalDeliveries = stats.reduce((sum, s) => sum + s.totalDeliveries, 0);
  const dwcCompliant = stats.reduce((sum, s) => sum + s.dwcCompliant, 0);
  const iadcCompliant = stats.reduce((sum, s) => sum + s.iadcCompliant, 0);

  return {
    dwcPercent: totalDeliveries > 0 ? (dwcCompliant / totalDeliveries) * 100 : 0,
    iadcPercent: totalDeliveries > 0 ? (iadcCompliant / totalDeliveries) * 100 : 0,
    totalDeliveries,
    activeDays: stats.length,
  };
}

/**
 * Calcule le pourcentage DWC depuis les volumes
 */
export function computeDwcPercent(compliant: number, misses: number): number {
  const total = compliant + misses;
  return total > 0 ? (compliant / total) * 100 : 0;
}

/**
 * Calcule le pourcentage IADC depuis les volumes
 */
export function computeIadcPercent(compliant: number, nonCompliant: number): number {
  const total = compliant + nonCompliant;
  return total > 0 ? (compliant / total) * 100 : 0;
}

/**
 * Calcule le delta par rapport à la période précédente
 * Note: Cette fonction est un placeholder - le delta est calculé dans les queries spécifiques
 */
export function computePercentDelta(current: number, previous: number): number {
  return current - previous;
}
