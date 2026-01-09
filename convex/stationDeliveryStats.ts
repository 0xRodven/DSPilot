import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireWriteAccess, checkStationAccess } from "./lib/permissions";

/**
 * Bulk upsert delivery stats - idempotent
 * Key: (stationId, metricName, year, week)
 * Requires: write access to station
 */
export const bulkUpsertDeliveryStats = mutation({
  args: {
    stationId: v.id("stations"),
    stats: v.array(
      v.object({
        metricName: v.string(),
        year: v.number(),
        week: v.number(),
        value: v.string(),
        numericValue: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx, args.stationId);

    const now = Date.now();
    let inserted = 0;
    let updated = 0;

    for (const stat of args.stats) {
      // Check for existing record with same key
      const existing = await ctx.db
        .query("stationDeliveryStats")
        .withIndex("by_station_metric_week", (q) =>
          q
            .eq("stationId", args.stationId)
            .eq("metricName", stat.metricName)
            .eq("year", stat.year)
            .eq("week", stat.week)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value: stat.value,
          numericValue: stat.numericValue,
          updatedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert("stationDeliveryStats", {
          stationId: args.stationId,
          metricName: stat.metricName,
          year: stat.year,
          week: stat.week,
          value: stat.value,
          numericValue: stat.numericValue,
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
 * Get all delivery stats for a station, grouped by week
 * Returns: { weeks: [...], metrics: [...], data: { metricName: { weekKey: value } } }
 * Requires: read access to station
 */
export const getDeliveryStatsByStation = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null;

    const stats = await ctx.db
      .query("stationDeliveryStats")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    if (stats.length === 0) return null;

    // Extract unique weeks and metrics
    const weeksSet = new Map<string, { year: number; week: number }>();
    const metricsSet = new Set<string>();

    for (const stat of stats) {
      const weekKey = `${stat.year}-W${stat.week.toString().padStart(2, "0")}`;
      weeksSet.set(weekKey, { year: stat.year, week: stat.week });
      metricsSet.add(stat.metricName);
    }

    // Sort weeks chronologically
    const weeks = Array.from(weeksSet.entries())
      .sort(([keyA, a], [keyB, b]) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
      })
      .map(([key, w]) => ({ key, ...w }));

    // Preserve original metric order from first import
    const metrics = Array.from(metricsSet);

    // Build data map: metricName -> weekKey -> value
    const data: Record<string, Record<string, string>> = {};
    for (const stat of stats) {
      const weekKey = `${stat.year}-W${stat.week.toString().padStart(2, "0")}`;
      if (!data[stat.metricName]) {
        data[stat.metricName] = {};
      }
      data[stat.metricName][weekKey] = stat.value;
    }

    return { weeks, metrics, data };
  },
});

/**
 * Get available weeks with data for a station
 * Requires: read access to station
 */
export const getAvailableWeeks = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    const stats = await ctx.db
      .query("stationDeliveryStats")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    // Extract unique weeks
    const weeksMap = new Map<string, { year: number; week: number }>();
    for (const stat of stats) {
      const key = `${stat.year}-${stat.week}`;
      weeksMap.set(key, { year: stat.year, week: stat.week });
    }

    // Sort chronologically (most recent first)
    return Array.from(weeksMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });
  },
});

/**
 * Delete all delivery stats for a specific week
 * Requires: write access to station
 */
export const deleteDeliveryStatsForWeek = mutation({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx, args.stationId);

    const stats = await ctx.db
      .query("stationDeliveryStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week)
      )
      .collect();

    for (const stat of stats) {
      await ctx.db.delete(stat._id);
    }

    return { deleted: stats.length };
  },
});

/**
 * Delete all delivery stats for a station
 * Requires: write access to station
 */
export const deleteAllDeliveryStats = mutation({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx, args.stationId);

    const stats = await ctx.db
      .query("stationDeliveryStats")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    for (const stat of stats) {
      await ctx.db.delete(stat._id);
    }

    return { deleted: stats.length };
  },
});
