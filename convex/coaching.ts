import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================
// COACHING QUERIES
// ============================================

export const listCoachingActions = query({
  args: {
    stationId: v.id("stations"),
    status: v.optional(v.string()),
    actionType: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all coaching actions for this station
    let actions = await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    // Filter by status if provided
    if (args.status && args.status !== "all") {
      actions = actions.filter((a) => a.status === args.status);
    }

    // Filter by action type if provided
    if (args.actionType && args.actionType !== "all") {
      actions = actions.filter((a) => a.actionType === args.actionType);
    }

    // Build full action data with driver info
    const fullActions = await Promise.all(
      actions.map(async (action) => {
        const driver = await ctx.db.get(action.driverId);
        if (!driver) return null;

        // Get current DWC for driver
        const latestStats = await ctx.db
          .query("driverWeeklyStats")
          .withIndex("by_driver", (q) => q.eq("driverId", action.driverId))
          .order("desc")
          .first();

        let driverDwc = 0;
        let driverTier: "fantastic" | "great" | "fair" | "poor" = "poor";

        if (latestStats) {
          const total = latestStats.dwcCompliant + latestStats.dwcMisses + latestStats.failedAttempts;
          driverDwc = total > 0 ? Math.round((latestStats.dwcCompliant / total) * 1000) / 10 : 0;

          if (driverDwc >= 98.5) driverTier = "fantastic";
          else if (driverDwc >= 96) driverTier = "great";
          else if (driverDwc >= 90) driverTier = "fair";
          else driverTier = "poor";
        }

        // Calculate waiting days
        const now = Date.now();
        const waitingDays = Math.floor((now - action.createdAt) / (24 * 60 * 60 * 1000));

        return {
          id: action._id,
          driverId: driver._id,
          driverName: driver.name,
          driverAmazonId: driver.amazonId,
          driverTier,
          driverDwc,
          actionType: action.actionType,
          status: action.status,
          reason: action.reason,
          targetCategory: action.targetCategory,
          targetSubcategory: action.targetSubcategory,
          dwcAtAction: action.dwcAtAction,
          dwcAfterAction: action.dwcAfterAction,
          notes: action.notes,
          evaluationNotes: action.evaluationNotes,
          createdAt: new Date(action.createdAt).toISOString(),
          evaluatedAt: action.evaluatedAt ? new Date(action.evaluatedAt).toISOString() : undefined,
          followUpDate: action.followUpDate || "",
          escalationDate: action.escalationDate,
          escalationNote: action.escalationNote,
          waitingDays,
        };
      })
    );

    // Filter by search if provided
    let result = fullActions.filter((a): a is NonNullable<typeof a> => a !== null);

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.driverName.toLowerCase().includes(searchLower) ||
          a.driverAmazonId.toLowerCase().includes(searchLower)
      );
    }

    // Sort by createdAt descending
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  },
});

export const getCoachingStats = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const pending = actions.filter((a) => a.status === "pending");
    const improved = actions.filter((a) => a.status === "improved");
    const noEffect = actions.filter((a) => a.status === "no_effect");
    const escalated = actions.filter((a) => a.status === "escalated");

    // Count overdue (pending with followUpDate passed)
    const overdue = pending.filter((a) => {
      if (!a.followUpDate) return false;
      return new Date(a.followUpDate).getTime() < now;
    });

    // Calculate average improvement for successful ones
    let avgImprovement = 0;
    const withImprovement = improved.filter((a) => a.dwcAfterAction !== undefined);
    if (withImprovement.length > 0) {
      const totalImprovement = withImprovement.reduce(
        (sum, a) => sum + ((a.dwcAfterAction || 0) - a.dwcAtAction),
        0
      );
      avgImprovement = totalImprovement / withImprovement.length;
    }

    // Count this month's improvements
    const thisMonthImproved = improved.filter(
      (a) => a.evaluatedAt && a.evaluatedAt > thirtyDaysAgo
    ).length;

    return {
      pending: { count: pending.length, overdueCount: overdue.length },
      improved: { count: improved.length, avgImprovement: Math.round(avgImprovement * 10) / 10 },
      noEffect: { count: noEffect.length },
      escalated: { count: escalated.length },
      total: actions.length,
      thisMonth: thisMonthImproved,
    };
  },
});

export const getCoachingEffectiveness = query({
  args: {
    stationId: v.id("stations"),
    period: v.union(v.literal("3M"), v.literal("6M"), v.literal("1Y")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const periodMs = {
      "3M": 90 * 24 * 60 * 60 * 1000,
      "6M": 180 * 24 * 60 * 60 * 1000,
      "1Y": 365 * 24 * 60 * 60 * 1000,
    }[args.period];

    const cutoff = now - periodMs;

    const actions = await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    // Filter to actions within period that have been evaluated
    const evaluated = actions.filter(
      (a) => a.createdAt >= cutoff && a.status !== "pending"
    );

    const improved = evaluated.filter((a) => a.status === "improved");

    // Calculate metrics
    const successRate = evaluated.length > 0
      ? Math.round((improved.length / evaluated.length) * 100)
      : 0;

    const withImprovement = improved.filter((a) => a.dwcAfterAction !== undefined);
    const avgImprovement = withImprovement.length > 0
      ? withImprovement.reduce((sum, a) => sum + ((a.dwcAfterAction || 0) - a.dwcAtAction), 0) / withImprovement.length
      : 0;

    // Calculate average days to effect
    const withEvalTime = improved.filter((a) => a.evaluatedAt !== undefined);
    const avgDaysToEffect = withEvalTime.length > 0
      ? Math.round(
          withEvalTime.reduce(
            (sum, a) => sum + ((a.evaluatedAt! - a.createdAt) / (24 * 60 * 60 * 1000)),
            0
          ) / withEvalTime.length
        )
      : 0;

    // Group by type
    const actionTypes = ["discussion", "warning", "training", "suspension"] as const;
    const byType = actionTypes.map((type) => {
      const typeActions = evaluated.filter((a) => a.actionType === type);
      const typeImproved = typeActions.filter((a) => a.status === "improved");
      const typeWithImprovement = typeImproved.filter((a) => a.dwcAfterAction !== undefined);

      return {
        type,
        successRate: typeActions.length > 0
          ? Math.round((typeImproved.length / typeActions.length) * 100)
          : 0,
        successCount: typeImproved.length,
        total: typeActions.length,
        avgImprovement: typeWithImprovement.length > 0
          ? typeWithImprovement.reduce((sum, a) => sum + ((a.dwcAfterAction || 0) - a.dwcAtAction), 0) / typeWithImprovement.length
          : 0,
      };
    }).filter((t) => t.total > 0);

    return {
      period: args.period,
      successRate,
      successCount: improved.length,
      totalEvaluated: evaluated.length,
      avgImprovement: Math.round(avgImprovement * 10) / 10,
      avgDaysToEffect,
      byType,
    };
  },
});

export const getCoachingSuggestions = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Get drivers with poor performance
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week)
      )
      .collect();

    // Get pending coaching actions
    const pendingActions = await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();
    const driversWithPendingAction = new Set(
      pendingActions.filter((a) => a.status === "pending").map((a) => a.driverId)
    );

    const suggestions = await Promise.all(
      weeklyStats.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = total > 0 ? Math.round((stat.dwcCompliant / total) * 1000) / 10 : 0;

        // Skip if DWC is good
        if (dwcPercent >= 96) return null;

        let tier: "fantastic" | "great" | "fair" | "poor";
        if (dwcPercent >= 98.5) tier = "fantastic";
        else if (dwcPercent >= 96) tier = "great";
        else if (dwcPercent >= 90) tier = "fair";
        else tier = "poor";

        // Find main error
        const breakdown = stat.dwcBreakdown || {
          contactMiss: 0,
          photoDefect: 0,
          noPhoto: 0,
          otpMiss: 0,
          other: 0,
        };
        const errors = [
          { name: "Contact Miss", count: breakdown.contactMiss },
          { name: "Photo Defect", count: breakdown.photoDefect },
          { name: "No Photo", count: breakdown.noPhoto },
          { name: "OTP Miss", count: breakdown.otpMiss },
          { name: "Other", count: breakdown.other },
        ];
        const mainError = errors.reduce((max, e) => (e.count > max.count ? e : max));

        // Determine priority
        let priority: "high" | "negative_trend" | "relapse" | "new_poor" = "new_poor";
        if (tier === "poor") {
          priority = "high";
        }

        const hasActiveAction = driversWithPendingAction.has(stat.driverId);

        return {
          id: `suggestion-${driver._id}`,
          driverId: driver._id,
          driverName: driver.name,
          driverTier: tier,
          driverDwc: dwcPercent,
          priority,
          reason: tier === "poor"
            ? `Performance critique: ${dwcPercent}% DWC`
            : `Performance sous le seuil: ${dwcPercent}% DWC`,
          mainError: mainError.name,
          mainErrorCount: mainError.count,
          hasActiveAction,
        };
      })
    );

    // Filter and sort by priority
    const priorityOrder = { high: 0, negative_trend: 1, relapse: 2, new_poor: 3 };
    return suggestions
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .filter((s) => !s.hasActiveAction) // Hide those with active actions
      .sort((a, b) => {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return a.driverDwc - b.driverDwc; // Lower DWC first
      })
      .slice(0, 10);
  },
});

// ============================================
// COACHING MUTATIONS
// ============================================

export const createCoachingAction = mutation({
  args: {
    stationId: v.id("stations"),
    driverId: v.id("drivers"),
    actionType: v.union(
      v.literal("discussion"),
      v.literal("warning"),
      v.literal("training"),
      v.literal("suspension")
    ),
    reason: v.string(),
    targetCategory: v.optional(v.string()),
    targetSubcategory: v.optional(v.string()),
    notes: v.optional(v.string()),
    dwcAtAction: v.number(),
    followUpDate: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const actionId = await ctx.db.insert("coachingActions", {
      stationId: args.stationId,
      driverId: args.driverId,
      actionType: args.actionType,
      status: "pending",
      reason: args.reason,
      targetCategory: args.targetCategory,
      targetSubcategory: args.targetSubcategory,
      notes: args.notes,
      dwcAtAction: args.dwcAtAction,
      followUpDate: args.followUpDate,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return actionId;
  },
});

export const evaluateCoachingAction = mutation({
  args: {
    actionId: v.id("coachingActions"),
    result: v.union(
      v.literal("improved"),
      v.literal("no_effect"),
      v.literal("escalated")
    ),
    dwcAfterAction: v.optional(v.number()),
    evaluationNotes: v.optional(v.string()),
    escalationNote: v.optional(v.string()),
    escalationDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.actionId, {
      status: args.result,
      dwcAfterAction: args.dwcAfterAction,
      evaluationNotes: args.evaluationNotes,
      escalationNote: args.escalationNote,
      escalationDate: args.escalationDate,
      evaluatedAt: now,
      updatedAt: now,
    });
  },
});
