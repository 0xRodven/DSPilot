import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getTier, type Tier } from "./lib/tier";

/**
 * Canonical demo station code.
 *
 * The DSPilot Demo tenant is provisioned by `scripts/create-demo-tenant.ts`,
 * which clones DIF1 drivers (anonymized via SHA-256) and copies their
 * weekly stats into a Clerk org named "DSPilot Demo".
 *
 * The /demo public page reads from this station via getDashboardPublic.
 */
const DEMO_STATION_CODE = "DEMO";

export const getDemoStation = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", DEMO_STATION_CODE))
      .first();
  },
});

export const isDemoStation = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, { stationId }) => {
    const station = await ctx.db.get(stationId);
    return station?.code === DEMO_STATION_CODE;
  },
});

/**
 * Internal helper used by scripts/create-demo-tenant.ts to materialize
 * the demo station row before seeding.
 */
export const createDemoStationRow = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    organizationId: v.string(),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stations", {
      code: args.code,
      name: args.name,
      organizationId: args.organizationId,
      ownerId: args.ownerId,
      plan: "business",
      subscriptionStatus: "active",
      initialSetupStatus: "ready",
      createdAt: Date.now(),
    });
  },
});

/**
 * Internal helper used by scripts/create-demo-tenant.ts to read source-station
 * drivers before they are anonymized client-side.
 */
export const getDIF1DriversForClone = query({
  args: { sourceStationId: v.id("stations") },
  handler: async (ctx, args) => {
    const drivers = await ctx.db
      .query("drivers")
      .withIndex("by_station", (q) => q.eq("stationId", args.sourceStationId))
      .collect();
    return drivers.map((d) => ({ _id: d._id, name: d.name, amazonId: d.amazonId }));
  },
});

/**
 * Copy driverWeeklyStats from source → target, rewriting driverId via driverMap.
 * The driverMap is built by the caller (create-demo-tenant.ts) with anonymized
 * names + Amazon IDs. Idempotency is the caller's responsibility.
 */
export const seedDemoStation = mutation({
  args: {
    sourceStationId: v.id("stations"),
    targetStationId: v.id("stations"),
    driverMap: v.array(
      v.object({
        srcId: v.id("drivers"),
        name: v.string(),
        amazonId: v.string(),
      }),
    ),
    weeksBack: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const idMap = new Map<Id<"drivers">, Id<"drivers">>();

    for (const d of args.driverMap) {
      const newId = await ctx.db.insert("drivers", {
        stationId: args.targetStationId,
        amazonId: d.amazonId,
        name: d.name,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      idMap.set(d.srcId, newId);
    }

    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station", (q) => q.eq("stationId", args.sourceStationId))
      .collect();

    let copied = 0;
    for (const row of weeklyStats) {
      const tgtDriverId = idMap.get(row.driverId);
      if (!tgtDriverId) continue;
      const { _id, _creationTime, ...rest } = row;
      void _id;
      void _creationTime;
      await ctx.db.insert("driverWeeklyStats", {
        ...rest,
        stationId: args.targetStationId,
        driverId: tgtDriverId,
      });
      copied++;
    }

    return { driversCreated: args.driverMap.length, weeklyStatsCopied: copied };
  },
});

/**
 * Public read-only dashboard data for /demo page.
 * Aggregates from drivers + driverWeeklyStats — no PII, names already anonymized.
 */
export const getDashboardPublic = query({
  args: {},
  handler: async (ctx) => {
    const station = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", DEMO_STATION_CODE))
      .first();

    if (!station) return null;

    const drivers = await ctx.db
      .query("drivers")
      .withIndex("by_station", (q) => q.eq("stationId", station._id))
      .collect();

    const weekly = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station", (q) => q.eq("stationId", station._id))
      .collect();

    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter((d) => d.isActive).length;

    if (weekly.length === 0) {
      return {
        station: { code: station.code, name: station.name },
        drivers: { total: totalDrivers, active: activeDrivers },
        latestWeek: null,
        topDrivers: [],
        bottomDrivers: [],
        weeksOfData: 0,
      };
    }

    let latestYear = 0;
    let latestWeek = 0;
    for (const w of weekly) {
      if (w.year > latestYear || (w.year === latestYear && w.week > latestWeek)) {
        latestYear = w.year;
        latestWeek = w.week;
      }
    }

    const latestRows = weekly.filter((w) => w.year === latestYear && w.week === latestWeek);
    const driverNameById = new Map(drivers.map((d) => [d._id, d.name] as const));

    const driverScores = latestRows.map((row) => {
      const totalDwc = row.dwcCompliant + row.dwcMisses + row.failedAttempts;
      const dwcScore = totalDwc > 0 ? (row.dwcCompliant / totalDwc) * 100 : 0;
      const totalIadc = row.iadcCompliant + row.iadcNonCompliant;
      const iadcScore = totalIadc > 0 ? (row.iadcCompliant / totalIadc) * 100 : 0;
      return {
        driverId: row.driverId,
        name: driverNameById.get(row.driverId) ?? "—",
        dwcScore,
        iadcScore,
        tier: getTier(dwcScore),
      };
    });

    const totals = latestRows.reduce(
      (acc, row) => {
        acc.dwcCompliant += row.dwcCompliant;
        acc.dwcMisses += row.dwcMisses;
        acc.failedAttempts += row.failedAttempts;
        acc.iadcCompliant += row.iadcCompliant;
        acc.iadcNonCompliant += row.iadcNonCompliant;
        return acc;
      },
      { dwcCompliant: 0, dwcMisses: 0, failedAttempts: 0, iadcCompliant: 0, iadcNonCompliant: 0 },
    );

    const stationDwcTotal = totals.dwcCompliant + totals.dwcMisses + totals.failedAttempts;
    const stationDwcScore = stationDwcTotal > 0 ? (totals.dwcCompliant / stationDwcTotal) * 100 : 0;
    const stationIadcTotal = totals.iadcCompliant + totals.iadcNonCompliant;
    const stationIadcScore = stationIadcTotal > 0 ? (totals.iadcCompliant / stationIadcTotal) * 100 : 0;

    const tierDistribution: Record<Tier, number> = { fantastic: 0, great: 0, fair: 0, poor: 0 };
    for (const d of driverScores) tierDistribution[d.tier]++;

    const round1 = (n: number) => Math.round(n * 10) / 10;
    const sorted = [...driverScores].sort((a, b) => b.dwcScore - a.dwcScore);
    const topDrivers = sorted.slice(0, 3).map(({ name, dwcScore, tier }) => ({
      name,
      dwcScore: round1(dwcScore),
      tier,
    }));
    const bottomDrivers = sorted
      .slice(-3)
      .reverse()
      .map(({ name, dwcScore, tier }) => ({
        name,
        dwcScore: round1(dwcScore),
        tier,
      }));

    const uniqueWeeks = new Set(weekly.map((w) => `${w.year}-${w.week}`));

    return {
      station: { code: station.code, name: station.name },
      drivers: { total: totalDrivers, active: activeDrivers },
      latestWeek: {
        year: latestYear,
        week: latestWeek,
        dwcScore: round1(stationDwcScore),
        iadcScore: round1(stationIadcScore),
        tierDistribution,
      },
      topDrivers,
      bottomDrivers,
      weeksOfData: uniqueWeeks.size,
    };
  },
});
