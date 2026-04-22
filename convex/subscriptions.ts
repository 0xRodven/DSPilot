import { v } from "convex/values";

import { mutation } from "./_generated/server";

const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("past_due"),
  v.literal("canceled"),
  v.literal("trialing"),
);

export const recordSubscriptionOnStation = mutation({
  args: {
    stationId: v.id("stations"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    subscriptionStatus: subscriptionStatusValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.stationId, {
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: args.subscriptionStatus,
    });
  },
});

export const updateSubscriptionStatus = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    subscriptionStatus: subscriptionStatusValidator,
  },
  handler: async (ctx, args) => {
    const station = await ctx.db
      .query("stations")
      .filter((q) => q.eq(q.field("stripeSubscriptionId"), args.stripeSubscriptionId))
      .first();

    if (!station) return { status: "not_found" };

    await ctx.db.patch(station._id, { subscriptionStatus: args.subscriptionStatus });
    return { status: "updated", stationId: station._id };
  },
});
