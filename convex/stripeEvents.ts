import { v } from "convex/values";

import { internalMutation } from "./_generated/server";

export const recordEvent = internalMutation({
  args: {
    stripeEventId: v.string(),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeEvents")
      .withIndex("by_stripe_event_id", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first();

    if (existing) {
      return { status: "duplicate", id: existing._id };
    }

    const id = await ctx.db.insert("stripeEvents", {
      stripeEventId: args.stripeEventId,
      type: args.type,
      payload: args.payload,
      processed: false,
      receivedAt: Date.now(),
    });

    return { status: "recorded", id };
  },
});

export const markProcessed = internalMutation({
  args: { id: v.id("stripeEvents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { processed: true });
  },
});
