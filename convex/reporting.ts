/**
 * reporting.ts — Internal queries for the post-ingest report pipeline.
 * No Clerk auth check — accessed via deploy key only.
 */

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getWeekDateRange } from "./lib/timeQuery";

/**
 * Get full report data for a station/week — everything needed to fill ReportData.
 * Returns null if no data for the requested week.
 */
export const getReportData = query({
  args: {
    stationCode: v.string(),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Find station by code
    const station = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.stationCode))
      .first();
    if (!station) return null;

    // Current week station stats
    const currentStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", station._id).eq("year", args.year).eq("week", args.week))
      .first();
    if (!currentStats) return null;

    // Previous week station stats
    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;
    const prevStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", station._id).eq("year", prevYear).eq("week", prevWeek))
      .first();

    // All driver weekly stats for this week
    const driverStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", station._id).eq("year", args.year).eq("week", args.week))
      .collect();

    // Previous week driver stats
    const prevDriverStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", station._id).eq("year", prevYear).eq("week", prevWeek))
      .collect();
    const prevMap = new Map(prevDriverStats.map((s) => [s.driverId.toString(), s]));

    // Resolve driver names + compute percentages
    const { start: weekStart, end: weekEnd } = getWeekDateRange(args.year, args.week);

    const drivers = await Promise.all(
      driverStats.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : 0;

        const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
        const iadcPercent = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

        // Days worked
        const allDaily = await ctx.db
          .query("driverDailyStats")
          .withIndex("by_driver_date", (q) => q.eq("driverId", stat.driverId))
          .collect();
        const daysWorked = allDaily.filter((d) => {
          if (d.date < weekStart || d.date > weekEnd) return false;
          return d.dwcCompliant + d.dwcMisses + d.failedAttempts > 0;
        }).length;

        // Trend vs prev week
        let dwcTrend: number | null = null;
        const prev = prevMap.get(stat.driverId.toString());
        if (prev) {
          const pTotal = prev.dwcCompliant + prev.dwcMisses + prev.failedAttempts;
          const pPct = pTotal > 0 ? Math.round((prev.dwcCompliant / pTotal) * 1000) / 10 : 0;
          dwcTrend = Math.round((dwcPercent - pPct) * 10) / 10;
        }

        return {
          name: driver.name,
          dwcPercent,
          iadcPercent,
          daysWorked,
          dwcTrend,
          totalDeliveries: dwcTotal,
          photoDefects: stat.dwcBreakdown?.photoDefect ?? 0,
          contactMiss: stat.dwcBreakdown?.contactMiss ?? 0,
        };
      }),
    );

    const validDrivers = drivers.filter((d) => d !== null);
    const sorted = [...validDrivers].sort((a, b) => b.dwcPercent - a.dwcPercent);

    // Station KPIs
    const dwcTotal = currentStats.dwcCompliant + currentStats.dwcMisses + currentStats.failedAttempts;
    const avgDwc = dwcTotal > 0 ? Math.round((currentStats.dwcCompliant / dwcTotal) * 1000) / 10 : 0;
    const iadcTotal = currentStats.iadcCompliant + currentStats.iadcNonCompliant;
    const avgIadc = iadcTotal > 0 ? Math.round((currentStats.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

    let dwcChange: number | undefined;
    let iadcChange: number | undefined;
    if (prevStats) {
      const pDwcT = prevStats.dwcCompliant + prevStats.dwcMisses + prevStats.failedAttempts;
      const pDwc = pDwcT > 0 ? Math.round((prevStats.dwcCompliant / pDwcT) * 1000) / 10 : 0;
      dwcChange = Math.round((avgDwc - pDwc) * 10) / 10;
      const pIadcT = prevStats.iadcCompliant + prevStats.iadcNonCompliant;
      const pIadc = pIadcT > 0 ? Math.round((prevStats.iadcCompliant / pIadcT) * 1000) / 10 : 0;
      iadcChange = Math.round((avgIadc - pIadc) * 10) / 10;
    }

    // DWC distribution
    const dwcDistribution = currentStats.dwcDistribution ?? {
      above95: sorted.filter((d) => d.dwcPercent >= 95).length,
      pct90to95: sorted.filter((d) => d.dwcPercent >= 90 && d.dwcPercent < 95).length,
      pct85to90: sorted.filter((d) => d.dwcPercent >= 85 && d.dwcPercent < 90).length,
      pct80to85: sorted.filter((d) => d.dwcPercent >= 80 && d.dwcPercent < 85).length,
      below80: sorted.filter((d) => d.dwcPercent < 80).length,
    };

    // Weekly history (last 8 weeks)
    const allStationStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", station._id))
      .collect();

    // Sort by year/week descending, take last 8 before or including current week
    const sortedStats = allStationStats
      .filter((s) => s.year < args.year || (s.year === args.year && s.week <= args.week))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.week - a.week;
      })
      .slice(0, 8);

    const weeklyHistory = sortedStats
      .map((s) => {
        const total = s.dwcCompliant + s.dwcMisses + s.failedAttempts;
        const avgDwc = total > 0 ? Math.round((s.dwcCompliant / total) * 1000) / 10 : 0;
        const iadcT = s.iadcCompliant + s.iadcNonCompliant;
        const avgIadc = iadcT > 0 ? Math.round((s.iadcCompliant / iadcT) * 1000) / 10 : 0;
        return { week: s.week, year: s.year, avgDwc, avgIadc };
      })
      .reverse(); // ascending order (oldest first for chart)

    return {
      stationId: station._id,
      stationName: station.name,
      stationCode: station.code,
      year: args.year,
      week: args.week,
      kpis: {
        avgDwc,
        avgIadc,
        totalDrivers: currentStats.totalDrivers,
        activeDrivers: currentStats.activeDrivers,
        dwcChange,
        iadcChange,
        totalDelivered: dwcTotal,
      },
      dwcDistribution,
      drivers: sorted.map((d, i) => ({ ...d, rank: i + 1 })),
      prevWeek,
      weeklyHistory,
    };
  },
});

/**
 * Store a generated report. Called by the post-ingest script via deploy key.
 */
/**
 * List reports for a station, optionally filtered by type.
 * Used by the /dashboard/reports page.
 */
export const listReports = query({
  args: {
    stationId: v.id("stations"),
    reportType: v.optional(v.union(v.literal("daily"), v.literal("weekly"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allReports = await ctx.db
      .query("reportDeliveries")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(args.limit ?? 50);

    if (args.reportType) {
      return allReports.filter((r) => r.reportType === args.reportType);
    }
    return allReports;
  },
});

/**
 * Store a generated report. Called by the post-ingest script via deploy key.
 */
export const storeReport = mutation({
  args: {
    stationId: v.id("stations"),
    reportType: v.union(v.literal("daily"), v.literal("weekly")),
    logicalChannel: v.union(v.literal("reports_daily"), v.literal("reports_weekly")),
    audience: v.union(v.literal("internal"), v.literal("manager")),
    periodLabel: v.string(),
    year: v.number(),
    week: v.number(),
    title: v.string(),
    summary: v.string(),
    asciiContent: v.string(),
    htmlContent: v.string(),
    pdfStatus: v.union(v.literal("pending"), v.literal("generated"), v.literal("failed"), v.literal("skipped")),
    deliveryStatus: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    confidenceScore: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reportDeliveries", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
