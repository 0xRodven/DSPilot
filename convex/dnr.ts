import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { checkStationAccess } from "./lib/permissions";

// --- Ingestion ---

const statusValidator = v.union(
  v.literal("ongoing"),
  v.literal("resolved"),
  v.literal("confirmed_dnr"),
  v.literal("under_investigation"),
  v.literal("investigation_closed"),
);

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
        status: statusValidator,
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
        entryType: "concession" as const,
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

// Ingest formal investigations — links to existing DNR by trackingId
export const ingestInvestigations = mutation({
  args: {
    organizationId: v.string(),
    stationCode: v.string(),
    entries: v.array(
      v.object({
        trackingId: v.string(),
        transporterId: v.string(),
        driverName: v.string(),
        year: v.number(),
        week: v.number(),
        deliveryDatetime: v.string(),
        concessionDatetime: v.string(),
        scanType: v.optional(v.string()),
        investigationReason: v.optional(v.string()),
        investigationDate: v.optional(v.string()),
        investigationVerdict: v.optional(v.string()),
        status: statusValidator,
      }),
    ),
  },
  handler: async (ctx, args) => {
    const station = await ctx.db
      .query("stations")
      .filter((q) => q.eq(q.field("code"), args.stationCode))
      .first();
    if (!station) throw new Error(`Station not found: ${args.stationCode}`);

    let linked = 0;
    let created = 0;

    for (const entry of args.entries) {
      const driver = await ctx.db
        .query("drivers")
        .filter((q) => q.and(q.eq(q.field("stationId"), station._id), q.eq(q.field("amazonId"), entry.transporterId)))
        .first();

      // Try to find existing DNR by trackingId
      const existing = await ctx.db
        .query("dnrInvestigations")
        .withIndex("by_tracking", (q) => q.eq("trackingId", entry.trackingId))
        .first();

      if (existing) {
        // Escalate existing DNR → investigation
        const patch: Record<string, unknown> = {
          status: entry.status,
          entryType: "investigation",
          investigationReason: entry.investigationReason,
          investigationDate: entry.investigationDate,
          investigationVerdict: entry.investigationVerdict,
        };
        // Fill scanType if existing has UNKNOWN but investigation has real value
        if (existing.scanType === "UNKNOWN" && entry.scanType) {
          patch.scanType = entry.scanType;
        }
        await ctx.db.patch(existing._id, patch);
        linked++;
      } else {
        // New investigation without prior DNR
        await ctx.db.insert("dnrInvestigations", {
          organizationId: args.organizationId,
          stationId: station._id,
          trackingId: entry.trackingId,
          driverId: driver?._id,
          transporterId: entry.transporterId,
          driverName: entry.driverName,
          year: entry.year,
          week: entry.week,
          deliveryDatetime: entry.deliveryDatetime,
          concessionDatetime: entry.concessionDatetime,
          scanType: entry.scanType || "UNKNOWN",
          address: { street: "", postalCode: "", city: "" },
          entryType: "investigation",
          investigationReason: entry.investigationReason,
          investigationDate: entry.investigationDate,
          investigationVerdict: entry.investigationVerdict,
          status: entry.status,
        });
        created++;
      }
    }

    return { linked, created, stationId: station._id };
  },
});

// --- Maintenance ---

export const deleteByWeekRange = mutation({
  args: {
    stationId: v.id("stations"),
    yearFrom: v.number(),
    weekFrom: v.number(),
    yearTo: v.number(),
    weekTo: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("dnrInvestigations")
      .filter((q) => q.eq(q.field("stationId"), args.stationId))
      .collect();

    let deleted = 0;
    for (const inv of all) {
      const key = inv.year * 100 + inv.week;
      const from = args.yearFrom * 100 + args.weekFrom;
      const to = args.yearTo * 100 + args.weekTo;
      if (key >= from && key <= to) {
        await ctx.db.delete(inv._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

// --- Queries ---

export const getInvestigations = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
    driverId: v.optional(v.id("drivers")),
    status: v.optional(statusValidator),
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

    // Enrich investigations with data from matching concessions (same trackingId)
    // The S3 Investigations report only has trackingId + date + scanType,
    // but the concession for the same tracking has full detail (driver, address, GPS)
    const enriched = await Promise.all(
      raw.map(async (entry) => {
        const needsEnrichment =
          entry.entryType === "investigation" &&
          (!entry.driverName || entry.scanType === "UNKNOWN" || entry.scanType === "");

        if (!needsEnrichment) return entry;

        // Find matching concession by trackingId
        const concession = await ctx.db
          .query("dnrInvestigations")
          .withIndex("by_tracking", (q) => q.eq("trackingId", entry.trackingId))
          .collect()
          .then((matches) => matches.find((m) => m._id !== entry._id && m.driverName));

        if (!concession) return entry;

        // Merge: keep investigation fields, fill gaps from concession
        return {
          ...entry,
          driverName: entry.driverName || concession.driverName,
          driverId: entry.driverId ?? concession.driverId,
          transporterId: entry.transporterId || concession.transporterId,
          scanType: entry.scanType === "UNKNOWN" || !entry.scanType ? concession.scanType : entry.scanType,
          address: entry.address.street ? entry.address : concession.address,
          gpsPlanned: entry.gpsPlanned ?? concession.gpsPlanned,
          gpsActual: entry.gpsActual ?? concession.gpsActual,
          gpsDistanceMeters: entry.gpsDistanceMeters ?? concession.gpsDistanceMeters,
          customerNotes: entry.customerNotes ?? concession.customerNotes,
        };
      }),
    );

    const results = args.status ? enriched.filter((r) => r.status === args.status) : enriched;

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
    const underInvestigation = current.filter(
      (i) => i.status === "under_investigation" || i.entryType === "investigation",
    ).length;
    const concessions = current.filter((i) => i.entryType !== "investigation").length;
    const preventionRate = current.length > 0 ? ((current.length - confirmedDnr) / current.length) * 100 : 0;

    // Top récidivistes — current week only
    const driverCounts: Record<string, { name: string; count: number }> = {};
    for (const inv of current) {
      if (!driverCounts[inv.driverName]) {
        driverCounts[inv.driverName] = { name: inv.driverName, count: 0 };
      }
      driverCounts[inv.driverName].count++;
    }
    const topOffenders = Object.values(driverCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      investigationsCount: current.length,
      investigationsDelta: current.length - previous.length,
      formalInvestigationsCount: underInvestigation,
      concessionsCount: concessions,
      preventionRate: Math.round(preventionRate),
      topOffenders,
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
