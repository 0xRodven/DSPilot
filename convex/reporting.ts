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

    // --- DNR & Investigations data ---
    const dnrCurrent = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_week", (q) => q.eq("stationId", station._id).eq("year", args.year).eq("week", args.week))
      .collect();
    const dnrPrev = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_week", (q) => q.eq("stationId", station._id).eq("year", prevYear).eq("week", prevWeek))
      .collect();

    const totalConcessions = dnrCurrent.filter((d) => d.entryType !== "investigation").length;
    const formalInvestigations = dnrCurrent.filter(
      (d) => d.entryType === "investigation" || d.status === "under_investigation",
    ).length;
    const confirmedDnr = dnrCurrent.filter((d) => d.status === "confirmed_dnr").length;
    const resolutionRate =
      dnrCurrent.length > 0 ? Math.round(((dnrCurrent.length - confirmedDnr) / dnrCurrent.length) * 100) : 100;

    // Top DNR offenders
    const dnrByDriver: Record<string, { name: string; count: number }> = {};
    for (const d of dnrCurrent) {
      const name = d.driverName || "Inconnu";
      if (!dnrByDriver[name]) dnrByDriver[name] = { name, count: 0 };
      dnrByDriver[name].count++;
    }
    const topDnrOffenders = Object.values(dnrByDriver)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Per-driver DNR count for the drivers array
    const driverDnrMap: Record<string, number> = {};
    for (const d of dnrCurrent) {
      const key = d.driverId?.toString() ?? d.driverName;
      driverDnrMap[key] = (driverDnrMap[key] || 0) + 1;
    }

    // Investigation details
    const investigationDetails = dnrCurrent
      .filter((d) => d.entryType === "investigation" || d.status === "under_investigation")
      .map((d) => ({
        trackingId: d.trackingId,
        driverName: d.driverName,
        status: d.status,
        investigationReason: d.investigationReason ?? "",
      }));

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
      dnr: {
        totalConcessions,
        formalInvestigations,
        confirmedDnr,
        resolutionRate,
        deltaVsPrevWeek: dnrCurrent.length - dnrPrev.length,
        topOffenders: topDnrOffenders,
        investigationDetails,
      },
      drivers: sorted.map((d, i) => ({
        ...d,
        rank: i + 1,
        dnrCount: driverDnrMap[d.name] ?? 0,
      })),
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
    year: v.optional(v.number()),
    week: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use week-specific index when year+week are provided
    if (args.year !== undefined && args.week !== undefined) {
      const reports = await ctx.db
        .query("reportDeliveries")
        .withIndex("by_station_week", (q) =>
          q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
        )
        .order("desc")
        .collect();

      if (args.reportType) {
        return reports.filter((r) => r.reportType === args.reportType);
      }
      return reports;
    }

    // Fallback: all reports for station
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
    // Upsert: find existing report for same station+week+type and update it
    const existing = await ctx.db
      .query("reportDeliveries")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();
    // For daily reports, match on periodLabel too (one report per day)
    const match = existing.find(
      (r) => r.reportType === args.reportType && (args.reportType === "weekly" || r.periodLabel === args.periodLabel),
    );

    if (match) {
      await ctx.db.patch(match._id, {
        ...args,
        createdAt: Date.now(),
      });
      return match._id;
    }

    return await ctx.db.insert("reportDeliveries", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const deleteReport = mutation({
  args: { reportId: v.id("reportDeliveries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.reportId);
  },
});

/**
 * Get individual driver report data for a station/week.
 * Returns all drivers with their stats, rank, and history for individual reports.
 */
export const getDriverReportData = query({
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

    // Get all driver weekly stats for this week
    const driverStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", station._id).eq("year", args.year).eq("week", args.week))
      .collect();

    if (driverStats.length === 0) return null;

    // Previous week stats for delta calculation
    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;
    const prevStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", station._id).eq("year", prevYear).eq("week", prevWeek))
      .collect();
    const prevMap = new Map(prevStats.map((s) => [s.driverId.toString(), s]));

    // Build 4-week history
    const historyWeeks: Array<{ week: number; year: number }> = [];
    let hw = args.week;
    let hy = args.year;
    for (let i = 0; i < 4; i++) {
      historyWeeks.push({ week: hw, year: hy });
      hw = hw === 1 ? 52 : hw - 1;
      if (hw === 52 && i < 3) hy = hy - 1;
    }

    // Get all historical stats for drivers
    const allHistoricalStats = await Promise.all(
      historyWeeks.map(async ({ week, year }) => {
        const stats = await ctx.db
          .query("driverWeeklyStats")
          .withIndex("by_station_week", (q) => q.eq("stationId", station._id).eq("year", year).eq("week", week))
          .collect();
        return { week, year, stats };
      }),
    );

    // Build driver history map
    const driverHistoryMap = new Map<string, Array<{ week: number; year: number; dwcPercent: number }>>();
    for (const { week, year, stats } of allHistoricalStats) {
      for (const stat of stats) {
        const key = stat.driverId.toString();
        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : 0;
        if (!driverHistoryMap.has(key)) {
          driverHistoryMap.set(key, []);
        }
        driverHistoryMap.get(key)?.push({ week, year, dwcPercent });
      }
    }

    // Get week date range for days worked calculation
    const { start: weekStart, end: weekEnd } = getWeekDateRange(args.year, args.week);

    // Build driver data
    const drivers = await Promise.all(
      driverStats.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : 0;
        const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
        const iadcPercent = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

        // Delta vs prev week
        let dwcChange: number | undefined;
        const prev = prevMap.get(stat.driverId.toString());
        if (prev) {
          const pTotal = prev.dwcCompliant + prev.dwcMisses + prev.failedAttempts;
          const pPct = pTotal > 0 ? Math.round((prev.dwcCompliant / pTotal) * 1000) / 10 : 0;
          dwcChange = Math.round((dwcPercent - pPct) * 10) / 10;
        }

        // Days worked from daily stats
        const allDaily = await ctx.db
          .query("driverDailyStats")
          .withIndex("by_driver_date", (q) => q.eq("driverId", stat.driverId))
          .collect();
        const daysWorked = allDaily.filter((d) => {
          if (d.date < weekStart || d.date > weekEnd) return false;
          return d.dwcCompliant + d.dwcMisses + d.failedAttempts > 0;
        }).length;

        // Get 4-week history for this driver
        const history = driverHistoryMap.get(stat.driverId.toString()) ?? [];
        // Sort oldest first for chart display
        const sortedHistory = [...history].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.week - b.week;
        });

        // Daily performance breakdown for the week
        const weekDailyStats = allDaily.filter((d) => d.date >= weekStart && d.date <= weekEnd);
        const dailyPerformance = weekDailyStats
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((d) => {
            const dayDwcTotal = d.dwcCompliant + d.dwcMisses + d.failedAttempts;
            const dayDwc = dayDwcTotal > 0 ? Math.round((d.dwcCompliant / dayDwcTotal) * 1000) / 10 : 0;
            const dayIadcTotal = d.iadcCompliant + d.iadcNonCompliant;
            const dayIadc = dayIadcTotal > 0 ? Math.round((d.iadcCompliant / dayIadcTotal) * 1000) / 10 : 0;
            return {
              date: d.date,
              dwcPercent: dayDwc,
              iadcPercent: dayIadc,
              deliveries: dayDwcTotal,
              errors: d.dwcMisses + d.failedAttempts,
            };
          });

        // Error breakdown
        const errorBreakdown = {
          contactMiss: stat.dwcBreakdown?.contactMiss ?? 0,
          photoDefect: stat.dwcBreakdown?.photoDefect ?? 0,
          rts: stat.failedAttempts,
        };

        // DNR for this driver (from dnrInvestigations)
        const driverDnr = await ctx.db
          .query("dnrInvestigations")
          .withIndex("by_driver", (q) =>
            q.eq("driverId", stat.driverId).eq("year", args.year).eq("week", args.week),
          )
          .collect();

        const dnrEntries = driverDnr.map((d) => ({
          trackingId: d.trackingId,
          date: d.concessionDatetime?.split(" ")[0] ?? "",
          scanType: d.scanType,
          status: d.status,
          entryType: d.entryType ?? "concession",
        }));

        // DNR per day (for daily performance table)
        const dnrByDay: Record<string, number> = {};
        for (const d of driverDnr) {
          const date = d.concessionDatetime?.split(" ")[0] ?? "";
          if (date) dnrByDay[date] = (dnrByDay[date] || 0) + 1;
        }

        return {
          driverId: driver._id,
          driverName: driver.name,
          amazonId: driver.amazonId,
          dwcPercent,
          iadcPercent,
          dwcChange,
          totalDeliveries: dwcTotal,
          daysWorked,
          history: sortedHistory,
          dailyPerformance,
          errorBreakdown,
          dnrEntries,
          dnrByDay,
          dnrCount: driverDnr.length,
          investigationCount: driverDnr.filter((d) => d.entryType === "investigation" || d.status === "under_investigation").length,
        };
      }),
    );

    const valid = drivers.filter((d): d is NonNullable<typeof d> => d !== null);
    const sorted = [...valid].sort((a, b) => b.dwcPercent - a.dwcPercent);
    const ranked = sorted.map((d, i) => ({ ...d, rank: i + 1 }));

    return {
      stationId: station._id,
      stationName: station.name,
      stationCode: station.code,
      year: args.year,
      week: args.week,
      totalDrivers: ranked.length,
      drivers: ranked,
    };
  },
});

/**
 * Get daily report data for a station/date — everything needed for DailyReportData.
 * No auth check — accessed via deploy key only.
 */
export const getDailyReportData = query({
  args: {
    stationCode: v.string(),
    date: v.string(), // "2026-04-01"
  },
  handler: async (ctx, args) => {
    const station = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.stationCode))
      .first();
    if (!station) return null;

    // Get daily stats for the date
    const dailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_date", (q) => q.eq("stationId", station._id).eq("date", args.date))
      .collect();

    if (dailyStats.length === 0) return null;

    // Get previous day stats for trend
    const prevDate = new Date(args.date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split("T")[0];
    const prevStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_date", (q) => q.eq("stationId", station._id).eq("date", prevDateStr))
      .collect();
    const _prevByDriver = new Map(prevStats.map((s) => [s.driverId.toString(), s]));

    // Get all drivers for the station (to find absents)
    const allDrivers = await ctx.db
      .query("drivers")
      .withIndex("by_station", (q) => q.eq("stationId", station._id))
      .collect();
    const activeDriverIds = new Set(dailyStats.map((s) => s.driverId.toString()));
    const absentDrivers = allDrivers.filter((d) => !activeDriverIds.has(d._id.toString())).map((d) => d.name);

    // Aggregate KPIs
    let totalDwcCompliant = 0;
    let totalDwcMisses = 0;
    let totalFailed = 0;
    let totalIncidents = 0;

    const drivers = await Promise.all(
      dailyStats.map(async (stat, _i) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : 0;

        totalDwcCompliant += stat.dwcCompliant;
        totalDwcMisses += stat.dwcMisses;
        totalFailed += stat.failedAttempts;
        totalIncidents += stat.dwcMisses + stat.failedAttempts;

        return {
          name: driver.name,
          dwcPercent,
          totalDeliveries: dwcTotal,
          dnrCount: stat.dwcBreakdown?.contactMiss ?? 0,
          photoDefects: stat.dwcBreakdown?.photoDefect ?? 0,
          rtsCount: stat.failedAttempts,
          isAlert: dwcPercent < 85,
        };
      }),
    );

    const validDrivers = drivers
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => b.dwcPercent - a.dwcPercent)
      .map((d, i) => ({ ...d, rank: i + 1 }));

    const totalDelivered = totalDwcCompliant + totalDwcMisses + totalFailed;
    const avgDwc = totalDelivered > 0 ? Math.round((totalDwcCompliant / totalDelivered) * 1000) / 10 : 0;

    // Previous day avg DWC for trend
    let prevAvgDwc: number | undefined;
    if (prevStats.length > 0) {
      let pComp = 0;
      let pTotal = 0;
      for (const s of prevStats) {
        pComp += s.dwcCompliant;
        pTotal += s.dwcCompliant + s.dwcMisses + s.failedAttempts;
      }
      prevAvgDwc = pTotal > 0 ? Math.round((pComp / pTotal) * 1000) / 10 : undefined;
    }

    // Week progress: determine day of week (1=Mon, 7=Sun)
    const dateObj = new Date(args.date);
    const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();

    // --- DNR concessions for this specific day ---
    // Get week number for the date to query dnrInvestigations
    const janFirst = new Date(Date.UTC(dateObj.getFullYear(), 0, 1));
    const dayNum = janFirst.getUTCDay() || 7;
    const weekNum = Math.ceil(((dateObj.getTime() - janFirst.getTime()) / 86400000 + dayNum) / 7);

    const allDnrWeek = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", station._id).eq("year", dateObj.getFullYear()).eq("week", weekNum),
      )
      .collect();

    // Filter to this specific day by concessionDatetime
    const dayDnr = allDnrWeek.filter((d) => {
      const dt = d.concessionDatetime?.split(" ")[0] ?? d.concessionDatetime?.split("T")[0] ?? "";
      return dt === args.date;
    });

    const dayConcessions = dayDnr.filter((d) => d.entryType !== "investigation").length;
    const dayInvestigations = dayDnr.filter(
      (d) => d.entryType === "investigation" || d.status === "under_investigation",
    ).length;

    // Top DNR drivers for this day
    const dayDnrByDriver: Record<string, { name: string; count: number }> = {};
    for (const d of dayDnr) {
      const name = d.driverName || "Inconnu";
      if (!dayDnrByDriver[name]) dayDnrByDriver[name] = { name, count: 0 };
      dayDnrByDriver[name].count++;
    }
    const topDnrDay = Object.values(dayDnrByDriver)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      stationId: station._id,
      stationName: station.name ?? station.code,
      stationCode: station.code,
      date: args.date,
      kpis: {
        activeDrivers: validDrivers.length,
        activeDriversChange: prevStats.length > 0 ? validDrivers.length - prevStats.length : undefined,
        totalDelivered,
        avgDwc,
        dwcChange: prevAvgDwc !== undefined ? Math.round((avgDwc - prevAvgDwc) * 10) / 10 : undefined,
        incidents: totalIncidents,
      },
      dnr: {
        newConcessions: dayConcessions,
        investigationsActive: dayInvestigations,
        topDrivers: topDnrDay,
      },
      weekProgress: {
        dayNumber: dayOfWeek,
        weekDwcSoFar: avgDwc,
      },
      drivers: validDrivers,
      absentDrivers,
    };
  },
});
