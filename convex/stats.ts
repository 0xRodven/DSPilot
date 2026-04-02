import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { canAccessStation, checkStationAccess, requireWriteAccess } from "./lib/permissions";
import { getTier } from "./lib/tier";
import { getWeekDateRange, getWeeksInRange } from "./lib/timeQuery";

// Validators réutilisables
const dwcBreakdownValidator = v.object({
  contactMiss: v.number(),
  photoDefect: v.number(),
  noPhoto: v.number(),
  otpMiss: v.number(),
  other: v.number(),
});

const iadcBreakdownValidator = v.object({
  mailbox: v.number(),
  unattended: v.number(),
  safePlace: v.number(),
  attended: v.optional(v.number()),
  other: v.number(),
});

const dailyStatValidator = v.object({
  driverId: v.id("drivers"),
  stationId: v.id("stations"),
  date: v.string(),
  year: v.number(),
  week: v.number(),
  dwcCompliant: v.number(),
  dwcMisses: v.number(),
  failedAttempts: v.number(),
  iadcCompliant: v.number(),
  iadcNonCompliant: v.number(),
  dwcBreakdown: v.optional(dwcBreakdownValidator),
  iadcBreakdown: v.optional(iadcBreakdownValidator),
});

const weeklyStatValidator = v.object({
  driverId: v.id("drivers"),
  stationId: v.id("stations"),
  year: v.number(),
  week: v.number(),
  dwcCompliant: v.number(),
  dwcMisses: v.number(),
  failedAttempts: v.number(),
  iadcCompliant: v.number(),
  iadcNonCompliant: v.number(),
  daysWorked: v.number(),
  dwcBreakdown: v.optional(dwcBreakdownValidator),
  iadcBreakdown: v.optional(iadcBreakdownValidator),
});

/**
 * Bulk upsert des stats daily - idempotent
 * Clé d'unicité: (driverId, date)
 * Nécessite: accès en écriture à la station
 */
export const bulkUpsertDailyStats = mutation({
  args: {
    stats: v.array(dailyStatValidator),
  },
  handler: async (ctx, args) => {
    // Vérifier les permissions sur la station du premier stat
    if (args.stats.length > 0) {
      await requireWriteAccess(ctx, args.stats[0].stationId);
    }

    const now = Date.now();
    let inserted = 0;
    let updated = 0;

    for (const stat of args.stats) {
      const existing = await ctx.db
        .query("driverDailyStats")
        .withIndex("by_driver_date", (q) => q.eq("driverId", stat.driverId).eq("date", stat.date))
        .first();

      if (existing) {
        // Mettre à jour
        await ctx.db.patch(existing._id, {
          ...stat,
        });
        updated++;
      } else {
        // Insérer
        await ctx.db.insert("driverDailyStats", {
          ...stat,
          createdAt: now,
        });
        inserted++;
      }
    }

    return { inserted, updated, total: args.stats.length };
  },
});

/**
 * Bulk upsert des stats weekly - idempotent
 * Clé d'unicité: (driverId, year, week)
 * Nécessite: accès en écriture à la station
 */
export const bulkUpsertWeeklyStats = mutation({
  args: {
    stats: v.array(weeklyStatValidator),
  },
  handler: async (ctx, args) => {
    // Vérifier les permissions sur la station du premier stat
    if (args.stats.length > 0) {
      await requireWriteAccess(ctx, args.stats[0].stationId);
    }

    const now = Date.now();
    let inserted = 0;
    let updated = 0;

    for (const stat of args.stats) {
      const existing = await ctx.db
        .query("driverWeeklyStats")
        .withIndex("by_driver_week", (q) => q.eq("driverId", stat.driverId).eq("year", stat.year).eq("week", stat.week))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...stat,
          updatedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert("driverWeeklyStats", {
          ...stat,
          createdAt: now,
          updatedAt: now,
        });
        inserted++;
      }
    }

    return { inserted, updated, total: args.stats.length };
  },
});

/**
 * Calcule et upsert les stats station weekly (agrégées depuis les drivers)
 * Nécessite: accès en écriture à la station
 */
export const updateStationWeeklyStats = mutation({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier les permissions d'écriture
    await requireWriteAccess(ctx, args.stationId);

    // Récupérer toutes les stats weekly des drivers pour cette semaine
    const driverStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    if (driverStats.length === 0) {
      return null;
    }

    // Agréger les volumes
    let dwcCompliant = 0;
    let dwcMisses = 0;
    let failedAttempts = 0;
    let iadcCompliant = 0;
    let iadcNonCompliant = 0;

    const dwcBreakdown = {
      contactMiss: 0,
      photoDefect: 0,
      noPhoto: 0,
      otpMiss: 0,
      other: 0,
    };

    const iadcBreakdown = {
      mailbox: 0,
      unattended: 0,
      safePlace: 0,
      other: 0,
    };

    // Calculer les tiers distribution
    const tiers = {
      fantastic: 0,
      great: 0,
      fair: 0,
      poor: 0,
    };

    const dwcDist = { above95: 0, pct90to95: 0, pct85to90: 0, pct80to85: 0, below80: 0 };

    for (const stat of driverStats) {
      dwcCompliant += stat.dwcCompliant;
      dwcMisses += stat.dwcMisses;
      failedAttempts += stat.failedAttempts;
      iadcCompliant += stat.iadcCompliant;
      iadcNonCompliant += stat.iadcNonCompliant;

      // Agréger breakdowns
      if (stat.dwcBreakdown) {
        dwcBreakdown.contactMiss += stat.dwcBreakdown.contactMiss;
        dwcBreakdown.photoDefect += stat.dwcBreakdown.photoDefect;
        dwcBreakdown.noPhoto += stat.dwcBreakdown.noPhoto;
        dwcBreakdown.otpMiss += stat.dwcBreakdown.otpMiss;
        dwcBreakdown.other += stat.dwcBreakdown.other;
      }

      if (stat.iadcBreakdown) {
        iadcBreakdown.mailbox += stat.iadcBreakdown.mailbox;
        iadcBreakdown.unattended += stat.iadcBreakdown.unattended;
        iadcBreakdown.safePlace += stat.iadcBreakdown.safePlace;
        iadcBreakdown.other += stat.iadcBreakdown.other;
      }

      // Calculer le tier du driver depuis la politique canonique
      const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      if (total > 0) {
        const dwcPercent = (stat.dwcCompliant / total) * 100;
        tiers[getTier(dwcPercent)]++;
        if (dwcPercent >= 95) dwcDist.above95++;
        else if (dwcPercent >= 90) dwcDist.pct90to95++;
        else if (dwcPercent >= 85) dwcDist.pct85to90++;
        else if (dwcPercent >= 80) dwcDist.pct80to85++;
        else dwcDist.below80++;
      }
    }

    const now = Date.now();

    // Upsert station stats
    const existing = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .first();

    const stationStats = {
      stationId: args.stationId,
      year: args.year,
      week: args.week,
      dwcCompliant,
      dwcMisses,
      failedAttempts,
      iadcCompliant,
      iadcNonCompliant,
      totalDrivers: driverStats.length,
      activeDrivers: driverStats.length,
      tierDistribution: tiers,
      dwcDistribution: dwcDist,
      dwcBreakdown,
      iadcBreakdown,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, stationStats);
      return existing._id;
    }
    return await ctx.db.insert("stationWeeklyStats", {
      ...stationStats,
      createdAt: now,
    });
  },
});

/**
 * Récupère les stats daily d'un driver
 * Vérifie l'accès à la station du driver
 */
export const getDriverDailyStats = query({
  args: {
    driverId: v.id("drivers"),
    year: v.optional(v.number()),
    week: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès via le driver
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return [];
    const hasAccess = await canAccessStation(ctx, driver.stationId);
    if (!hasAccess) return [];

    if (args.year !== undefined && args.week !== undefined) {
      return await ctx.db
        .query("driverDailyStats")
        .withIndex("by_driver_week", (q) =>
          q.eq("driverId", args.driverId).eq("year", args.year!).eq("week", args.week!),
        )
        .collect();
    }

    return await ctx.db
      .query("driverDailyStats")
      .withIndex("by_driver_date", (q) => q.eq("driverId", args.driverId))
      .order("desc")
      .take(30); // Derniers 30 jours par défaut
  },
});

/**
 * Récupère les stats weekly d'un driver
 * Vérifie l'accès à la station du driver
 */
export const getDriverWeeklyStats = query({
  args: {
    driverId: v.id("drivers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès via le driver
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return [];
    const hasAccess = await canAccessStation(ctx, driver.stationId);
    if (!hasAccess) return [];

    return await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .order("desc")
      .take(args.limit || 12); // Dernières 12 semaines par défaut
  },
});

/**
 * Récupère les stats station weekly
 * Nécessite: accès à la station
 */
export const getStationWeeklyStats = query({
  args: {
    stationId: v.id("stations"),
    year: v.optional(v.number()),
    week: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null;

    if (args.year !== undefined && args.week !== undefined) {
      return await ctx.db
        .query("stationWeeklyStats")
        .withIndex("by_station_week", (q) =>
          q.eq("stationId", args.stationId).eq("year", args.year!).eq("week", args.week!),
        )
        .first();
    }

    return await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(12);
  },
});

/**
 * Récupère toutes les stats weekly des drivers d'une station pour une semaine
 * Nécessite: accès à la station
 */
export const getStationDriversWeeklyStats = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    return await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();
  },
});

/**
 * Récupère les KPIs du dashboard pour une station/semaine
 * Nécessite: accès à la station
 */
export const getDashboardKPIs = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null;

    // Current week stats
    const currentStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .first();

    // Previous week stats for trend
    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;
    const prevStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", prevYear).eq("week", prevWeek))
      .first();

    if (!currentStats) {
      return null;
    }

    // Calculate DWC %
    const dwcTotal = currentStats.dwcCompliant + currentStats.dwcMisses + currentStats.failedAttempts;
    const dwcPercent = dwcTotal > 0 ? (currentStats.dwcCompliant / dwcTotal) * 100 : 0;

    // Calculate IADC %
    const iadcTotal = currentStats.iadcCompliant + currentStats.iadcNonCompliant;
    const iadcPercent = iadcTotal > 0 ? (currentStats.iadcCompliant / iadcTotal) * 100 : 0;

    // Calculate trends
    let dwcTrend = 0;
    let iadcTrend = 0;

    if (prevStats) {
      const prevDwcTotal = prevStats.dwcCompliant + prevStats.dwcMisses + prevStats.failedAttempts;
      const prevDwcPercent = prevDwcTotal > 0 ? (prevStats.dwcCompliant / prevDwcTotal) * 100 : 0;
      dwcTrend = Math.round((dwcPercent - prevDwcPercent) * 10) / 10;

      const prevIadcTotal = prevStats.iadcCompliant + prevStats.iadcNonCompliant;
      const prevIadcPercent = prevIadcTotal > 0 ? (prevStats.iadcCompliant / prevIadcTotal) * 100 : 0;
      iadcTrend = Math.round((iadcPercent - prevIadcPercent) * 10) / 10;
    }

    const weekAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();
    const alerts = weekAlerts.filter((alert) => !alert.isDismissed).length;

    return {
      avgDwc: Math.round(dwcPercent * 10) / 10,
      avgIadc: Math.round(iadcPercent * 10) / 10,
      dwcTrend,
      iadcTrend,
      activeDrivers: currentStats.activeDrivers,
      totalDrivers: currentStats.totalDrivers,
      alerts,
      tierDistribution: currentStats.tierDistribution,
      prevWeek,
      // New fields for KPI cards
      totalDeliveries: dwcTotal,
      // "Delivery Misses - DNR Risk" from the DWC/IADC export, not confirmed DNR
      deliveryMissesRisk: currentStats.dwcMisses,
    };
  },
});

/**
 * Récupère les drivers avec leurs stats pour le tableau dashboard
 * Nécessite: accès à la station
 */
export const getDashboardDrivers = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    // Calculate previous week
    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;

    // Get all weekly stats for this week
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    // Get previous week stats for trend calculation
    const prevWeeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", prevYear).eq("week", prevWeek))
      .collect();

    // Create a map for quick lookup of previous week stats by driver
    const prevStatsMap = new Map(prevWeeklyStats.map((stat) => [stat.driverId.toString(), stat]));

    // Get driver info for each stat
    const driversWithStats = await Promise.all(
      weeklyStats.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        // Get daily stats for this driver/week to calculate actual days worked
        // Utilise la range de dates au lieu de year/week pour gérer les frontières ISO
        const { start: weekStart, end: weekEnd } = getWeekDateRange(args.year, args.week);
        const allDailyStats = await ctx.db
          .query("driverDailyStats")
          .withIndex("by_driver_date", (q) => q.eq("driverId", stat.driverId))
          .collect();
        const dailyStats = allDailyStats.filter((d) => d.date >= weekStart && d.date <= weekEnd);

        // Calculate actual days with activity
        const daysActive = dailyStats.filter((d) => {
          const total = d.dwcCompliant + d.dwcMisses + d.failedAttempts;
          return total > 0;
        }).length;

        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : 0;

        const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
        const iadcPercent = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

        const tier = getTier(dwcPercent);

        // Calculate trend from previous week
        let trend: number | null = null;
        const prevStat = prevStatsMap.get(stat.driverId.toString());
        if (prevStat) {
          const prevDwcTotal = prevStat.dwcCompliant + prevStat.dwcMisses + prevStat.failedAttempts;
          const prevDwcPercent = prevDwcTotal > 0 ? Math.round((prevStat.dwcCompliant / prevDwcTotal) * 1000) / 10 : 0;
          trend = Math.round((dwcPercent - prevDwcPercent) * 10) / 10;
        }

        return {
          id: driver._id,
          name: driver.name,
          amazonId: driver.amazonId,
          dwcPercent,
          iadcPercent,
          totalDeliveries: dwcTotal,
          daysActive,
          tier,
          trend, // null if no previous week data
          photoDefects: stat.dwcBreakdown?.photoDefect ?? 0,
        };
      }),
    );

    return driversWithStats.filter((d) => d !== null);
  },
});

// ============================================
// ERROR BREAKDOWN QUERIES
// ============================================

export const getErrorBreakdown = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    // Get station weekly stats for current week
    const currentStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .first();

    // Get previous week stats for trend
    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;
    const prevStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", prevYear).eq("week", prevWeek))
      .first();

    const dwcBreakdown = currentStats?.dwcBreakdown || {
      contactMiss: 0,
      photoDefect: 0,
      noPhoto: 0,
      otpMiss: 0,
      other: 0,
    };

    const prevDwcBreakdown = prevStats?.dwcBreakdown || {
      contactMiss: 0,
      photoDefect: 0,
      noPhoto: 0,
      otpMiss: 0,
      other: 0,
    };

    const iadcBreakdown = currentStats?.iadcBreakdown || {
      mailbox: 0,
      unattended: 0,
      safePlace: 0,
      other: 0,
    };

    const prevIadcBreakdown = prevStats?.iadcBreakdown || {
      mailbox: 0,
      unattended: 0,
      safePlace: 0,
      other: 0,
    };

    // Calculate DWC errors total
    const dwcTotal =
      dwcBreakdown.contactMiss +
      dwcBreakdown.photoDefect +
      dwcBreakdown.noPhoto +
      dwcBreakdown.otpMiss +
      dwcBreakdown.other;
    const prevDwcTotal =
      prevDwcBreakdown.contactMiss +
      prevDwcBreakdown.photoDefect +
      prevDwcBreakdown.noPhoto +
      prevDwcBreakdown.otpMiss +
      prevDwcBreakdown.other;
    const dwcTrend = dwcTotal - prevDwcTotal;
    const dwcTrendPercent = prevDwcTotal > 0 ? Math.round(((dwcTotal - prevDwcTotal) / prevDwcTotal) * 100) : 0;

    // Calculate IADC errors total
    const iadcTotal = iadcBreakdown.mailbox + iadcBreakdown.unattended + iadcBreakdown.safePlace + iadcBreakdown.other;
    const prevIadcTotal =
      prevIadcBreakdown.mailbox + prevIadcBreakdown.unattended + prevIadcBreakdown.safePlace + prevIadcBreakdown.other;
    const iadcTrend = iadcTotal - prevIadcTotal;
    const iadcTrendPercent = prevIadcTotal > 0 ? Math.round(((iadcTotal - prevIadcTotal) / prevIadcTotal) * 100) : 0;

    // Failed attempts (false scans)
    const failedAttempts = currentStats?.failedAttempts || 0;
    const prevFailedAttempts = prevStats?.failedAttempts || 0;
    const faTrend = failedAttempts - prevFailedAttempts;
    const faTrendPercent =
      prevFailedAttempts > 0 ? Math.round(((failedAttempts - prevFailedAttempts) / prevFailedAttempts) * 100) : 0;

    // Helper to calculate percentage
    const pct = (val: number, total: number) => (total > 0 ? Math.round((val / total) * 100) : 0);
    const trendVal = (curr: number, prev: number) => curr - prev;

    return [
      {
        id: "dwc" as const,
        name: "Delivery with Customer (DWC)",
        total: dwcTotal,
        trend: dwcTrend,
        trendPercent: dwcTrendPercent,
        subcategories: [
          {
            name: "Contact Miss",
            count: dwcBreakdown.contactMiss,
            percentage: pct(dwcBreakdown.contactMiss, dwcTotal),
            trend: trendVal(dwcBreakdown.contactMiss, prevDwcBreakdown.contactMiss),
          },
          {
            name: "Photo Defect",
            count: dwcBreakdown.photoDefect,
            percentage: pct(dwcBreakdown.photoDefect, dwcTotal),
            trend: trendVal(dwcBreakdown.photoDefect, prevDwcBreakdown.photoDefect),
          },
          {
            name: "No Photo",
            count: dwcBreakdown.noPhoto,
            percentage: pct(dwcBreakdown.noPhoto, dwcTotal),
            trend: trendVal(dwcBreakdown.noPhoto, prevDwcBreakdown.noPhoto),
          },
          {
            name: "OTP Miss",
            count: dwcBreakdown.otpMiss,
            percentage: pct(dwcBreakdown.otpMiss, dwcTotal),
            trend: trendVal(dwcBreakdown.otpMiss, prevDwcBreakdown.otpMiss),
          },
          {
            name: "Other",
            count: dwcBreakdown.other,
            percentage: pct(dwcBreakdown.other, dwcTotal),
            trend: trendVal(dwcBreakdown.other, prevDwcBreakdown.other),
          },
        ],
      },
      {
        id: "iadc" as const,
        name: "In Address Delivery Compliance",
        total: iadcTotal,
        trend: iadcTrend,
        trendPercent: iadcTrendPercent,
        subcategories: [
          {
            name: "Mailbox",
            count: iadcBreakdown.mailbox,
            percentage: pct(iadcBreakdown.mailbox, iadcTotal),
            trend: trendVal(iadcBreakdown.mailbox, prevIadcBreakdown.mailbox),
          },
          {
            name: "Unattended",
            count: iadcBreakdown.unattended,
            percentage: pct(iadcBreakdown.unattended, iadcTotal),
            trend: trendVal(iadcBreakdown.unattended, prevIadcBreakdown.unattended),
          },
          {
            name: "Safe Place",
            count: iadcBreakdown.safePlace,
            percentage: pct(iadcBreakdown.safePlace, iadcTotal),
            trend: trendVal(iadcBreakdown.safePlace, prevIadcBreakdown.safePlace),
          },
          {
            name: "Other",
            count: iadcBreakdown.other,
            percentage: pct(iadcBreakdown.other, iadcTotal),
            trend: trendVal(iadcBreakdown.other, prevIadcBreakdown.other),
          },
        ],
      },
      {
        id: "false-scans" as const,
        name: "MS - Tentatives échouées",
        total: failedAttempts,
        trend: faTrend,
        trendPercent: faTrendPercent,
        subcategories: [
          {
            name: "MS - Failed Attempts",
            count: failedAttempts,
            percentage: 100,
            trend: faTrend,
          },
        ],
      },
    ];
  },
});

export const getTopDriversErrors = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
    limit: v.optional(v.number()),
    errorTypeFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    const limit = args.limit || 10;
    const filter = args.errorTypeFilter || "all";

    // Get all weekly stats for this week
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    // Helper to get error count based on filter
    const getFilteredErrorCount = (
      dwcBreakdown: { contactMiss: number; photoDefect: number; noPhoto: number; otpMiss: number; other: number },
      iadcBreakdown: { mailbox: number; unattended: number; safePlace: number; other: number },
      failedAttempts: number,
    ): number => {
      switch (filter) {
        case "all":
          return (
            dwcBreakdown.contactMiss +
            dwcBreakdown.photoDefect +
            dwcBreakdown.noPhoto +
            dwcBreakdown.otpMiss +
            dwcBreakdown.other +
            failedAttempts
          );
        case "dwc":
          return (
            dwcBreakdown.contactMiss +
            dwcBreakdown.photoDefect +
            dwcBreakdown.noPhoto +
            dwcBreakdown.otpMiss +
            dwcBreakdown.other
          );
        case "iadc":
          return iadcBreakdown.mailbox + iadcBreakdown.unattended + iadcBreakdown.safePlace + iadcBreakdown.other;
        case "contact-miss":
          return dwcBreakdown.contactMiss;
        case "photo-defect":
          return dwcBreakdown.photoDefect;
        case "no-photo":
          return dwcBreakdown.noPhoto;
        case "otp-miss":
          return dwcBreakdown.otpMiss;
        case "dwc-other":
          return dwcBreakdown.other;
        case "mailbox":
          return iadcBreakdown.mailbox;
        case "unattended":
          return iadcBreakdown.unattended;
        case "safe-place":
          return iadcBreakdown.safePlace;
        case "iadc-other":
          return iadcBreakdown.other;
        case "failed-attempts":
          return failedAttempts;
        default:
          return (
            dwcBreakdown.contactMiss +
            dwcBreakdown.photoDefect +
            dwcBreakdown.noPhoto +
            dwcBreakdown.otpMiss +
            dwcBreakdown.other +
            failedAttempts
          );
      }
    };

    // Calculate total errors across all drivers
    let totalStationErrors = 0;

    // Build driver error data
    const driversWithErrors = await Promise.all(
      weeklyStats.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        const dwcBreakdown = stat.dwcBreakdown || {
          contactMiss: 0,
          photoDefect: 0,
          noPhoto: 0,
          otpMiss: 0,
          other: 0,
        };

        const iadcBreakdown = stat.iadcBreakdown || {
          mailbox: 0,
          unattended: 0,
          safePlace: 0,
          other: 0,
        };

        const filteredErrors = getFilteredErrorCount(dwcBreakdown, iadcBreakdown, stat.failedAttempts);
        totalStationErrors += filteredErrors;

        // Find main error type (for display)
        const errorTypes = [
          { name: "Contact Miss", count: dwcBreakdown.contactMiss },
          { name: "Photo Defect", count: dwcBreakdown.photoDefect },
          { name: "No Photo", count: dwcBreakdown.noPhoto },
          { name: "OTP Miss", count: dwcBreakdown.otpMiss },
          { name: "Failed Attempts", count: stat.failedAttempts },
          { name: "Mailbox", count: iadcBreakdown.mailbox },
          { name: "Unattended", count: iadcBreakdown.unattended },
          { name: "Safe Place", count: iadcBreakdown.safePlace },
          { name: "Other", count: dwcBreakdown.other + iadcBreakdown.other },
        ];
        const mainError = errorTypes.reduce((max, curr) => (curr.count > max.count ? curr : max));

        // Calculate DWC percent and tier
        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : 0;

        const tier = getTier(dwcPercent);

        return {
          id: driver._id,
          name: driver.name,
          totalErrors: filteredErrors,
          tier,
          dwcPercent,
          mainError: mainError.name,
          mainErrorCount: mainError.count,
        };
      }),
    );

    // Filter, sort by errors descending, and limit
    const validDrivers = driversWithErrors
      .filter((d): d is NonNullable<typeof d> => d !== null && d.totalErrors > 0)
      .sort((a, b) => b.totalErrors - a.totalErrors)
      .slice(0, limit);

    // Calculate percentages after we know total
    return validDrivers.map((d) => ({
      ...d,
      percentage: totalStationErrors > 0 ? Math.round((d.totalErrors / totalStationErrors) * 100) : 0,
    }));
  },
});

/**
 * Get weekly performance data for the evolution chart
 * Nécessite: accès à la station
 */
export const getPerformanceEvolution = query({
  args: {
    stationId: v.id("stations"),
    weeksCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    const weeksCount = args.weeksCount || 12;

    // Get all station weekly stats
    const allStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    // Sort by year and week descending
    allStats.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });

    // Take only the last N weeks and reverse for chronological order
    const recentStats = allStats.slice(0, weeksCount).reverse();

    return recentStats.map((stat) => {
      // Calculate DWC %
      const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 100 * 10) / 10 : 0;

      // Calculate IADC %
      const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
      const iadcPercent = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 100 * 10) / 10 : 0;

      return {
        week: `S${stat.week}`,
        weekNumber: stat.week,
        year: stat.year,
        dwc: dwcPercent,
        iadc: iadcPercent,
        activeDrivers: stat.activeDrivers,
        // New fields for Performance Evolution chart
        totalDeliveries: dwcTotal,
        // "Delivery Misses - DNR Risk" from the DWC/IADC export, not confirmed DNR
        deliveryMissesRisk: stat.dwcMisses,
      };
    });
  },
});

export const getErrorTrends = query({
  args: {
    stationId: v.id("stations"),
    weeksCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    const weeksCount = args.weeksCount || 8;

    // Get all station weekly stats
    const allStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    // Sort by year and week descending
    allStats.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });

    // Take only the last N weeks
    const recentStats = allStats.slice(0, weeksCount).reverse();

    return recentStats.map((stat) => {
      const breakdown = stat.dwcBreakdown || {
        contactMiss: 0,
        photoDefect: 0,
        noPhoto: 0,
        otpMiss: 0,
        other: 0,
      };

      const total =
        breakdown.contactMiss +
        breakdown.photoDefect +
        breakdown.noPhoto +
        breakdown.otpMiss +
        breakdown.other +
        stat.failedAttempts;

      return {
        week: `S${stat.week}`,
        weekNumber: stat.week,
        total,
        contactMiss: breakdown.contactMiss,
        photoDefect: breakdown.photoDefect,
        noPhoto: breakdown.noPhoto,
        otpMiss: breakdown.otpMiss,
        failedAttempts: stat.failedAttempts,
      };
    });
  },
});

// ============================================
// DAILY QUERIES (for day granularity mode)
// ============================================

/**
 * Récupère les KPIs du dashboard pour une station/jour spécifique
 * Nécessite: accès à la station
 */
export const getDashboardKPIsDaily = query({
  args: {
    stationId: v.id("stations"),
    date: v.string(), // Format: "2024-12-09"
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null;

    // Get all daily stats for this date
    const dailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_date", (q) => q.eq("stationId", args.stationId).eq("date", args.date))
      .collect();

    if (dailyStats.length === 0) {
      return null;
    }

    // Calculate previous date for trend
    const currentDate = new Date(args.date);
    currentDate.setDate(currentDate.getDate() - 1);
    const prevDate = currentDate.toISOString().split("T")[0];

    // Get previous day stats
    const prevDailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_date", (q) => q.eq("stationId", args.stationId).eq("date", prevDate))
      .collect();

    // Aggregate current day stats
    let dwcCompliant = 0;
    let dwcMisses = 0;
    let failedAttempts = 0;
    let iadcCompliant = 0;
    let iadcNonCompliant = 0;
    const tiers = { fantastic: 0, great: 0, fair: 0, poor: 0 };
    const dwcDist = { above95: 0, pct90to95: 0, pct85to90: 0, pct80to85: 0, below80: 0 };

    for (const stat of dailyStats) {
      dwcCompliant += stat.dwcCompliant;
      dwcMisses += stat.dwcMisses;
      failedAttempts += stat.failedAttempts;
      iadcCompliant += stat.iadcCompliant;
      iadcNonCompliant += stat.iadcNonCompliant;

      // Calculate tier for this driver from the canonical policy
      const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      if (total > 0) {
        const dwcPercent = (stat.dwcCompliant / total) * 100;
        tiers[getTier(dwcPercent)]++;
        if (dwcPercent >= 95) dwcDist.above95++;
        else if (dwcPercent >= 90) dwcDist.pct90to95++;
        else if (dwcPercent >= 85) dwcDist.pct85to90++;
        else if (dwcPercent >= 80) dwcDist.pct80to85++;
        else dwcDist.below80++;
      }
    }

    // Calculate DWC %
    const dwcTotal = dwcCompliant + dwcMisses + failedAttempts;
    const dwcPercent = dwcTotal > 0 ? (dwcCompliant / dwcTotal) * 100 : 0;

    // Calculate IADC %
    const iadcTotal = iadcCompliant + iadcNonCompliant;
    const iadcPercent = iadcTotal > 0 ? (iadcCompliant / iadcTotal) * 100 : 0;

    // Calculate trends from previous day
    let dwcTrend = 0;
    let iadcTrend = 0;

    if (prevDailyStats.length > 0) {
      let prevDwcCompliant = 0;
      let prevDwcMisses = 0;
      let prevFailedAttempts = 0;
      let prevIadcCompliant = 0;
      let prevIadcNonCompliant = 0;

      for (const stat of prevDailyStats) {
        prevDwcCompliant += stat.dwcCompliant;
        prevDwcMisses += stat.dwcMisses;
        prevFailedAttempts += stat.failedAttempts;
        prevIadcCompliant += stat.iadcCompliant;
        prevIadcNonCompliant += stat.iadcNonCompliant;
      }

      const prevDwcTotal = prevDwcCompliant + prevDwcMisses + prevFailedAttempts;
      const prevDwcPercent = prevDwcTotal > 0 ? (prevDwcCompliant / prevDwcTotal) * 100 : 0;
      dwcTrend = Math.round((dwcPercent - prevDwcPercent) * 10) / 10;

      const prevIadcTotal = prevIadcCompliant + prevIadcNonCompliant;
      const prevIadcPercent = prevIadcTotal > 0 ? (prevIadcCompliant / prevIadcTotal) * 100 : 0;
      iadcTrend = Math.round((iadcPercent - prevIadcPercent) * 10) / 10;
    }

    const alerts = (
      await ctx.db
        .query("alerts")
        .withIndex("by_station_week", (q) =>
          q.eq("stationId", args.stationId).eq("year", dailyStats[0].year).eq("week", dailyStats[0].week),
        )
        .collect()
    ).filter((alert) => !alert.isDismissed).length;

    return {
      avgDwc: Math.round(dwcPercent * 10) / 10,
      avgIadc: Math.round(iadcPercent * 10) / 10,
      dwcTrend,
      iadcTrend,
      activeDrivers: dailyStats.length,
      totalDrivers: dailyStats.length,
      alerts,
      tierDistribution: tiers,
      dwcDistribution: dwcDist,
      prevDate,
      // New fields for KPI cards
      totalDeliveries: dwcTotal,
      // "Delivery Misses - DNR Risk" from the DWC/IADC export, not confirmed DNR
      deliveryMissesRisk: dwcMisses,
    };
  },
});

/**
 * Récupère les drivers avec leurs stats pour un jour spécifique
 * Nécessite: accès à la station
 */
export const getDashboardDriversDaily = query({
  args: {
    stationId: v.id("stations"),
    date: v.string(), // Format: "2024-12-09"
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    // Get all daily stats for this date
    const dailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_date", (q) => q.eq("stationId", args.stationId).eq("date", args.date))
      .collect();

    // Calculate previous date for trend
    const currentDate = new Date(args.date);
    currentDate.setDate(currentDate.getDate() - 1);
    const prevDate = currentDate.toISOString().split("T")[0];

    // Get previous day stats for trend calculation
    const prevDailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_date", (q) => q.eq("stationId", args.stationId).eq("date", prevDate))
      .collect();

    // Create a map of previous day stats by driver
    const prevStatsByDriver = new Map<string, (typeof prevDailyStats)[0]>();
    for (const stat of prevDailyStats) {
      prevStatsByDriver.set(stat.driverId.toString(), stat);
    }

    // Get driver info for each stat
    const driversWithStats = await Promise.all(
      dailyStats.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : 0;

        const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
        const iadcPercent = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

        const tier = getTier(dwcPercent);

        // Calculate trend from previous day
        let trend = 0;
        const prevStat = prevStatsByDriver.get(stat.driverId.toString());
        if (prevStat) {
          const prevDwcTotal = prevStat.dwcCompliant + prevStat.dwcMisses + prevStat.failedAttempts;
          const prevDwcPercent = prevDwcTotal > 0 ? Math.round((prevStat.dwcCompliant / prevDwcTotal) * 1000) / 10 : 0;
          trend = Math.round((dwcPercent - prevDwcPercent) * 10) / 10;
        }

        return {
          id: driver._id,
          name: driver.name,
          amazonId: driver.amazonId,
          dwcPercent,
          iadcPercent,
          totalDeliveries: dwcTotal,
          daysActive: 1, // Single day
          tier,
          trend,
          photoDefects: stat.dwcBreakdown?.photoDefect ?? 0,
        };
      }),
    );

    return driversWithStats.filter((d) => d !== null);
  },
});

/**
 * Get weekly comparison for recaps page
 * Returns drivers with current week, previous week, and diff
 * Nécessite: accès à la station
 */
export const getWeeklyComparison = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    // Get current week stats
    const currentWeekStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    // Calculate previous week
    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;

    // Get previous week stats
    const prevWeekStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", prevYear).eq("week", prevWeek))
      .collect();

    // Create map of previous week stats by driver
    const prevStatsByDriver = new Map<string, (typeof prevWeekStats)[0]>();
    for (const stat of prevWeekStats) {
      prevStatsByDriver.set(stat.driverId.toString(), stat);
    }

    // Build comparison data for each driver
    const comparisons = await Promise.all(
      currentWeekStats.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        // Calculate current stats
        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : 0;

        const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
        const iadcPercent = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

        const deliveries = dwcTotal;

        // Get previous week stats
        const prevStat = prevStatsByDriver.get(stat.driverId.toString());

        let prevDwcPercent = 0;
        let prevIadcPercent = 0;
        let prevDeliveries = 0;

        if (prevStat) {
          const prevDwcTotal = prevStat.dwcCompliant + prevStat.dwcMisses + prevStat.failedAttempts;
          prevDwcPercent = prevDwcTotal > 0 ? Math.round((prevStat.dwcCompliant / prevDwcTotal) * 1000) / 10 : 0;

          const prevIadcTotal = prevStat.iadcCompliant + prevStat.iadcNonCompliant;
          prevIadcPercent = prevIadcTotal > 0 ? Math.round((prevStat.iadcCompliant / prevIadcTotal) * 1000) / 10 : 0;

          prevDeliveries = prevDwcTotal;
        }

        // Calculate diffs
        const dwcDiff = Math.round((dwcPercent - prevDwcPercent) * 10) / 10;
        const iadcDiff = Math.round((iadcPercent - prevIadcPercent) * 10) / 10;
        const deliveriesDiff = deliveries - prevDeliveries;

        // Determine status
        let status: "ok" | "watch" | "alert" = "ok";
        if (dwcPercent < 90 || dwcDiff < -5) {
          status = "alert";
        } else if (dwcPercent < 95 || dwcDiff < -2) {
          status = "watch";
        }

        return {
          id: driver._id,
          name: driver.name,
          amazonId: driver.amazonId,
          current: {
            deliveries,
            dwc: dwcPercent,
            iadc: iadcPercent,
          },
          previous: {
            deliveries: prevDeliveries,
            dwc: prevDwcPercent,
            iadc: prevIadcPercent,
          },
          diff: {
            deliveries: deliveriesDiff,
            dwc: dwcDiff,
            iadc: iadcDiff,
          },
          status,
        };
      }),
    );

    return comparisons
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => a.current.dwc - b.current.dwc); // Lowest DWC first
  },
});

// ============================================
// RANGE QUERIES (for period/range mode)
// ============================================

/**
 * Récupère les KPIs du dashboard pour une plage de dates
 * Agrège les valeurs brutes (pas de moyenne pondérée de %)
 * Nécessite: accès à la station
 */
export const getDashboardKPIsRange = query({
  args: {
    stationId: v.id("stations"),
    startDate: v.string(), // "2025-11-01"
    endDate: v.string(), // "2025-12-01"
  },
  handler: async (ctx, { stationId, startDate, endDate }) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, stationId);
    if (!hasAccess) return null;

    // 1. Récupérer les semaines dans la plage
    const weeks = getWeeksInRange(startDate, endDate);
    if (weeks.length === 0) return null;

    // 2. Fetch stats brutes de chaque semaine
    const weeklyStats = [];
    for (const w of weeks) {
      const stats = await ctx.db
        .query("stationWeeklyStats")
        .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", w.year).eq("week", w.week))
        .first();
      if (stats) weeklyStats.push(stats);
    }

    if (weeklyStats.length === 0) return null;

    // 3. Sommer les valeurs brutes (PAS les pourcentages!)
    const totals = weeklyStats.reduce(
      (acc, s) => ({
        dwcCompliant: acc.dwcCompliant + s.dwcCompliant,
        dwcMisses: acc.dwcMisses + s.dwcMisses,
        failedAttempts: acc.failedAttempts + s.failedAttempts,
        iadcCompliant: acc.iadcCompliant + s.iadcCompliant,
        iadcNonCompliant: acc.iadcNonCompliant + s.iadcNonCompliant,
      }),
      {
        dwcCompliant: 0,
        dwcMisses: 0,
        failedAttempts: 0,
        iadcCompliant: 0,
        iadcNonCompliant: 0,
      },
    );

    // 4. Calculer % depuis les totaux agrégés
    const dwcTotal = totals.dwcCompliant + totals.dwcMisses + totals.failedAttempts;
    const avgDwc = dwcTotal > 0 ? (totals.dwcCompliant / dwcTotal) * 100 : 0;

    const iadcTotal = totals.iadcCompliant + totals.iadcNonCompliant;
    const avgIadc = iadcTotal > 0 ? (totals.iadcCompliant / iadcTotal) * 100 : 0;

    // 5. Trend = dernière semaine - première semaine (en %)
    const first = weeklyStats[0];
    const last = weeklyStats[weeklyStats.length - 1];

    const firstDwcTotal = first.dwcCompliant + first.dwcMisses + first.failedAttempts;
    const firstDwc = firstDwcTotal > 0 ? (first.dwcCompliant / firstDwcTotal) * 100 : 0;

    const lastDwcTotal = last.dwcCompliant + last.dwcMisses + last.failedAttempts;
    const lastDwc = lastDwcTotal > 0 ? (last.dwcCompliant / lastDwcTotal) * 100 : 0;

    const dwcTrend = Math.round((lastDwc - firstDwc) * 10) / 10;

    const firstIadcTotal = first.iadcCompliant + first.iadcNonCompliant;
    const firstIadc = firstIadcTotal > 0 ? (first.iadcCompliant / firstIadcTotal) * 100 : 0;

    const lastIadcTotal = last.iadcCompliant + last.iadcNonCompliant;
    const lastIadc = lastIadcTotal > 0 ? (last.iadcCompliant / lastIadcTotal) * 100 : 0;

    const iadcTrend = Math.round((lastIadc - firstIadc) * 10) / 10;

    // 6. Drivers et alertes
    const activeDrivers = Math.max(...weeklyStats.map((s) => s.activeDrivers));
    const totalDrivers = Math.max(...weeklyStats.map((s) => s.totalDrivers));

    const allDailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_date", (q) => q.eq("stationId", stationId))
      .collect();

    const filteredDailyStats = allDailyStats.filter((s) => s.date >= startDate && s.date <= endDate);

    // Grouper par driver et calculer leur DWC moyen
    const byDriver = new Map<string, typeof filteredDailyStats>();
    for (const stat of filteredDailyStats) {
      const key = stat.driverId.toString();
      if (!byDriver.has(key)) byDriver.set(key, []);
      byDriver.get(key)!.push(stat);
    }

    const periodAlertsRaw = await Promise.all(
      weeks.map(
        async (w) =>
          await ctx.db
            .query("alerts")
            .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", w.year).eq("week", w.week))
            .collect(),
      ),
    );
    const alerts = periodAlertsRaw.flat().filter((alert) => !alert.isDismissed).length;

    // 7. Calculer tierDistribution depuis les drivers uniques
    const tierDistribution = { fantastic: 0, great: 0, fair: 0, poor: 0 };
    const dwcDistribution = { above95: 0, pct90to95: 0, pct85to90: 0, pct80to85: 0, below80: 0 };

    for (const stats of byDriver.values()) {
      const driverTotals = stats.reduce(
        (acc, s) => ({
          dwcCompliant: acc.dwcCompliant + s.dwcCompliant,
          dwcMisses: acc.dwcMisses + s.dwcMisses,
          failedAttempts: acc.failedAttempts + s.failedAttempts,
        }),
        { dwcCompliant: 0, dwcMisses: 0, failedAttempts: 0 },
      );
      const total = driverTotals.dwcCompliant + driverTotals.dwcMisses + driverTotals.failedAttempts;
      if (total > 0) {
        const driverDwc = (driverTotals.dwcCompliant / total) * 100;

        // Calculer le tier du driver unique depuis la politique canonique
        tierDistribution[getTier(driverDwc)]++;
        if (driverDwc >= 95) dwcDistribution.above95++;
        else if (driverDwc >= 90) dwcDistribution.pct90to95++;
        else if (driverDwc >= 85) dwcDistribution.pct85to90++;
        else if (driverDwc >= 80) dwcDistribution.pct80to85++;
        else dwcDistribution.below80++;
      }
    }

    return {
      avgDwc: Math.round(avgDwc * 10) / 10,
      avgIadc: Math.round(avgIadc * 10) / 10,
      dwcTrend,
      iadcTrend,
      activeDrivers,
      totalDrivers,
      alerts,
      tierDistribution,
      dwcDistribution,
      periodWeeks: weeklyStats.length,
      // New fields for KPI cards
      totalDeliveries: dwcTotal,
      // "Delivery Misses - DNR Risk" from the DWC/IADC export, not confirmed DNR
      deliveryMissesRisk: totals.dwcMisses,
    };
  },
});

/**
 * Récupère les drivers avec leurs stats agrégées sur une plage de dates
 * Nécessite: accès à la station
 */
export const getDashboardDriversRange = query({
  args: {
    stationId: v.id("stations"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { stationId, startDate, endDate }) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, stationId);
    if (!hasAccess) return [];

    // 1. Fetch daily stats dans la plage
    const allStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_date", (q) => q.eq("stationId", stationId))
      .collect();

    const filtered = allStats.filter((s) => s.date >= startDate && s.date <= endDate);

    if (filtered.length === 0) return [];

    // 2. Grouper par driver
    const byDriver = new Map<string, typeof filtered>();
    for (const stat of filtered) {
      const key = stat.driverId.toString();
      if (!byDriver.has(key)) byDriver.set(key, []);
      byDriver.get(key)!.push(stat);
    }

    // 3. Pour chaque driver, sommer valeurs brutes et calculer %
    const driversWithStats = await Promise.all(
      Array.from(byDriver.entries()).map(async ([driverId, stats]) => {
        const driver = await ctx.db.get(driverId as Id<"drivers">);
        if (!driver) return null;

        // Sommer valeurs brutes
        const totals = stats.reduce(
          (acc, s) => ({
            dwcCompliant: acc.dwcCompliant + s.dwcCompliant,
            dwcMisses: acc.dwcMisses + s.dwcMisses,
            failedAttempts: acc.failedAttempts + s.failedAttempts,
            iadcCompliant: acc.iadcCompliant + s.iadcCompliant,
            iadcNonCompliant: acc.iadcNonCompliant + s.iadcNonCompliant,
          }),
          {
            dwcCompliant: 0,
            dwcMisses: 0,
            failedAttempts: 0,
            iadcCompliant: 0,
            iadcNonCompliant: 0,
          },
        );

        // Calculer % depuis totaux
        const dwcTotal = totals.dwcCompliant + totals.dwcMisses + totals.failedAttempts;
        const dwcPercent = dwcTotal > 0 ? Math.round((totals.dwcCompliant / dwcTotal) * 1000) / 10 : 0;

        const iadcTotal = totals.iadcCompliant + totals.iadcNonCompliant;
        const iadcPercent = iadcTotal > 0 ? Math.round((totals.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

        const tier = getTier(dwcPercent);

        // Trend = dernier jour - premier jour
        const sorted = [...stats].sort((a, b) => a.date.localeCompare(b.date));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const firstTotal = first.dwcCompliant + first.dwcMisses + first.failedAttempts;
        const firstPercent = firstTotal > 0 ? (first.dwcCompliant / firstTotal) * 100 : 0;

        const lastTotal = last.dwcCompliant + last.dwcMisses + last.failedAttempts;
        const lastPercent = lastTotal > 0 ? (last.dwcCompliant / lastTotal) * 100 : 0;

        const trend = Math.round((lastPercent - firstPercent) * 10) / 10;

        // Sum photo defects from all stats
        const photoDefects = stats.reduce((sum, s) => sum + (s.dwcBreakdown?.photoDefect ?? 0), 0);

        return {
          id: driver._id,
          name: driver.name,
          amazonId: driver.amazonId,
          dwcPercent,
          iadcPercent,
          totalDeliveries: dwcTotal,
          daysActive: stats.length,
          tier,
          trend,
          photoDefects,
        };
      }),
    );

    return driversWithStats.filter((d) => d !== null);
  },
});

/**
 * Récupère la dernière semaine avec des données pour une station
 * Utilisé pour initialiser le dashboard sur la semaine la plus récente
 * Nécessite: accès à la station
 */
export const getLatestWeekWithData = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, { stationId }) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, stationId);
    if (!hasAccess) return null;

    // Récupérer toutes les stats de la station
    const allStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station", (q) => q.eq("stationId", stationId))
      .collect();

    if (allStats.length === 0) return null;

    // Trier par année et semaine décroissantes pour trouver la plus récente
    allStats.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });

    const latest = allStats[0];
    return {
      year: latest.year,
      week: latest.week,
    };
  },
});
