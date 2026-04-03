import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { checkStationAccess } from "./lib/permissions";

// --- Ingestion ---

export const ingestConcessions = mutation({
  args: {
    organizationId: v.string(),
    stationCode: v.string(),
    investigations: v.array(
      v.object({
        trackingId: v.string(),
        transporterId: v.string(),
        driverName: v.string(),
        year: v.number(),
        week: v.number(),
        deliveryDatetime: v.string(),
        concessionDatetime: v.string(),
        scanType: v.string(),
        address: v.object({
          street: v.string(),
          building: v.optional(v.string()),
          floor: v.optional(v.string()),
          postalCode: v.string(),
          city: v.string(),
        }),
        gpsPlanned: v.optional(v.object({ lat: v.number(), lng: v.number() })),
        gpsActual: v.optional(v.object({ lat: v.number(), lng: v.number() })),
        gpsDistanceMeters: v.optional(v.number()),
        customerNotes: v.optional(v.string()),
        deliveryType: v.optional(v.string()),
        status: v.union(v.literal("ongoing"), v.literal("resolved"), v.literal("confirmed_dnr")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const station = await ctx.db
      .query("stations")
      .filter((q) => q.eq(q.field("code"), args.stationCode))
      .first();
    if (!station) {
      throw new Error(`Station not found: ${args.stationCode}`);
    }

    let upserted = 0;
    for (const inv of args.investigations) {
      // Resolve driver via transporterId
      const driver = await ctx.db
        .query("drivers")
        .filter((q) => q.and(q.eq(q.field("stationId"), station._id), q.eq(q.field("amazonId"), inv.transporterId)))
        .first();

      const existing = await ctx.db
        .query("dnrInvestigations")
        .withIndex("by_tracking", (q) => q.eq("trackingId", inv.trackingId))
        .first();

      const doc = {
        organizationId: args.organizationId,
        stationId: station._id,
        trackingId: inv.trackingId,
        driverId: driver?._id,
        transporterId: inv.transporterId,
        driverName: inv.driverName,
        year: inv.year,
        week: inv.week,
        deliveryDatetime: inv.deliveryDatetime,
        concessionDatetime: inv.concessionDatetime,
        scanType: inv.scanType,
        address: inv.address,
        gpsPlanned: inv.gpsPlanned,
        gpsActual: inv.gpsActual,
        gpsDistanceMeters: inv.gpsDistanceMeters,
        customerNotes: inv.customerNotes,
        deliveryType: inv.deliveryType,
        status: inv.status,
      };

      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("dnrInvestigations", doc);
      }
      upserted++;
    }

    return { upserted, stationId: station._id };
  },
});

// --- Queries ---

export const getInvestigations = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
    driverId: v.optional(v.id("drivers")),
    status: v.optional(v.union(v.literal("ongoing"), v.literal("resolved"), v.literal("confirmed_dnr"))),
  },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    const raw = args.driverId
      ? await ctx.db
          .query("dnrInvestigations")
          .withIndex("by_driver", (q) =>
            q
              .eq("driverId", args.driverId as typeof args.driverId & string)
              .eq("year", args.year)
              .eq("week", args.week),
          )
          .collect()
      : await ctx.db
          .query("dnrInvestigations")
          .withIndex("by_station_week", (q) =>
            q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
          )
          .collect();

    const results = args.status ? raw.filter((r) => r.status === args.status) : raw;

    results.sort((a, b) => new Date(b.concessionDatetime).getTime() - new Date(a.concessionDatetime).getTime());

    return results;
  },
});

export const getDriverDnrCount = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return {};

    const investigations = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    const counts: Record<string, number> = {};
    for (const inv of investigations) {
      const key = inv.driverId ?? inv.transporterId;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  },
});

export const getKpis = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess)
      return {
        investigationsCount: 0,
        investigationsDelta: 0,
        preventionRate: 0,
        topOffender: null,
      };

    const current = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;
    const previous = await ctx.db
      .query("dnrInvestigations")
      .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", prevYear).eq("week", prevWeek))
      .collect();

    const confirmedDnr = current.filter((i) => i.status === "confirmed_dnr").length;
    const preventionRate = current.length > 0 ? ((current.length - confirmedDnr) / current.length) * 100 : 0;

    // Top offender over last 4 weeks
    const allRecent: Array<{ driverName: string }> = [];
    let w = args.week;
    let y = args.year;
    for (let i = 0; i < 4; i++) {
      const wkData = await ctx.db
        .query("dnrInvestigations")
        .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", y).eq("week", w))
        .collect();
      allRecent.push(...wkData.map((d) => ({ driverName: d.driverName })));
      w--;
      if (w === 0) {
        w = 52;
        y--;
      }
    }

    const driverCounts: Record<string, { name: string; count: number }> = {};
    for (const r of allRecent) {
      if (!driverCounts[r.driverName]) {
        driverCounts[r.driverName] = { name: r.driverName, count: 0 };
      }
      driverCounts[r.driverName].count++;
    }

    const topOffender = Object.values(driverCounts).sort((a, b) => b.count - a.count)[0] ?? null;

    return {
      investigationsCount: current.length,
      investigationsDelta: current.length - previous.length,
      preventionRate: Math.round(preventionRate),
      topOffender,
    };
  },
});

export const getTrend = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    const trend: Array<{
      year: number;
      week: number;
      investigations: number;
      confirmedDnr: number;
    }> = [];

    let w = args.week;
    let y = args.year;

    for (let i = 0; i < 8; i++) {
      const weekData = await ctx.db
        .query("dnrInvestigations")
        .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", y).eq("week", w))
        .collect();

      trend.unshift({
        year: y,
        week: w,
        investigations: weekData.length,
        confirmedDnr: weekData.filter((d) => d.status === "confirmed_dnr").length,
      });

      w--;
      if (w === 0) {
        w = 52;
        y--;
      }
    }

    return trend;
  },
});

export const getDriverRecentDnr = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("dnrInvestigations")
      .filter((q) => q.eq(q.field("driverId"), args.driverId))
      .collect();

    results.sort((a, b) => new Date(b.concessionDatetime).getTime() - new Date(a.concessionDatetime).getTime());

    return results.slice(0, 3);
  },
});
