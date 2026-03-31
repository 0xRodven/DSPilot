import { v } from "convex/values";

import { mutation } from "./_generated/server";

// Clear all data for testing purposes
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete in order to respect foreign key-like relationships
    const tables = [
      "coachingActions",
      "imports",
      "stationWeeklyStats",
      "driverWeeklyStats",
      "driverDailyStats",
      "drivers",
      "stations",
    ] as const;

    const counts: Record<string, number> = {};

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      counts[table] = docs.length;
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    return counts;
  },
});

// Upsert a station for automation/bootstrap flows.
// Protected in practice by deployment-key-only CLI usage.
export const upsertStation = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    region: v.optional(v.string()),
    organizationId: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        region: args.region,
        organizationId: args.organizationId,
        ownerId: args.ownerId ?? existing.ownerId,
        plan: args.plan ?? existing.plan,
      });

      return await ctx.db.get(existing._id);
    }

    const stationId = await ctx.db.insert("stations", {
      code: args.code,
      name: args.name,
      region: args.region,
      organizationId: args.organizationId,
      ownerId: args.ownerId ?? "system-automation",
      plan: args.plan ?? "pro",
      createdAt: Date.now(),
    });

    return await ctx.db.get(stationId);
  },
});
