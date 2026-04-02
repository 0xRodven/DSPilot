import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { checkStationAccess, getUserContext, requireWriteAccess } from "./lib/permissions";

// Default objectives (used if none configured)
export const DEFAULTS = {
  dwcTarget: 92,
  iadcTarget: 65,
  dwcAlertDrop: 5,
  dnrDpmoMax: 1500,
  coachingMaxDays: 14,
};

export const getObjectives = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, { stationId }) => {
    const hasAccess = await checkStationAccess(ctx, stationId);
    if (!hasAccess) return DEFAULTS;

    const objectives = await ctx.db
      .query("stationObjectives")
      .withIndex("by_station", (q) => q.eq("stationId", stationId))
      .first();

    if (!objectives) return { ...DEFAULTS, stationId };
    return objectives;
  },
});

export const updateObjectives = mutation({
  args: {
    stationId: v.id("stations"),
    dwcTarget: v.number(),
    iadcTarget: v.number(),
    dwcAlertDrop: v.number(),
    dnrDpmoMax: v.number(),
    coachingMaxDays: v.number(),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx, args.stationId);
    const { userId } = await getUserContext(ctx);

    const existing = await ctx.db
      .query("stationObjectives")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedBy: userId,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("stationObjectives", {
      ...args,
      updatedBy: userId,
      updatedAt: Date.now(),
    });
  },
});
