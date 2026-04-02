import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { canAccessStation, checkStationAccess, requireWriteAccess } from "./lib/permissions";
import { getTier } from "./lib/tier";

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
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

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

          driverTier = getTier(driverDwc);
        }

        // Calculate waiting days
        const now = Date.now();
        const waitingDays = Math.floor((now - action.createdAt) / (24 * 60 * 60 * 1000));

        return {
          id: action._id,
          stationId: action.stationId,
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
      }),
    );

    // Filter by search if provided
    let result = fullActions.filter((a): a is NonNullable<typeof a> => a !== null);

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      result = result.filter(
        (a) => a.driverName.toLowerCase().includes(searchLower) || a.driverAmazonId.toLowerCase().includes(searchLower),
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
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null;

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
      const totalImprovement = withImprovement.reduce((sum, a) => sum + ((a.dwcAfterAction || 0) - a.dwcAtAction), 0);
      avgImprovement = totalImprovement / withImprovement.length;
    }

    // Count this month's improvements
    const thisMonthImproved = improved.filter((a) => a.evaluatedAt && a.evaluatedAt > thirtyDaysAgo).length;

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
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null;

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
    const evaluated = actions.filter((a) => a.createdAt >= cutoff && a.status !== "pending");

    const improved = evaluated.filter((a) => a.status === "improved");

    // Calculate metrics
    const successRate = evaluated.length > 0 ? Math.round((improved.length / evaluated.length) * 100) : 0;

    const withImprovement = improved.filter((a) => a.dwcAfterAction !== undefined);
    const avgImprovement =
      withImprovement.length > 0
        ? withImprovement.reduce((sum, a) => sum + ((a.dwcAfterAction || 0) - a.dwcAtAction), 0) /
          withImprovement.length
        : 0;

    // Calculate average days to effect
    const withEvalTime = improved.filter((a) => a.evaluatedAt !== undefined);
    const avgDaysToEffect =
      withEvalTime.length > 0
        ? Math.round(
            withEvalTime.reduce((sum, a) => sum + (a.evaluatedAt! - a.createdAt) / (24 * 60 * 60 * 1000), 0) /
              withEvalTime.length,
          )
        : 0;

    // Group by type
    const actionTypes = ["discussion", "warning", "training", "suspension"] as const;
    const byType = actionTypes
      .map((type) => {
        const typeActions = evaluated.filter((a) => a.actionType === type);
        const typeImproved = typeActions.filter((a) => a.status === "improved");
        const typeWithImprovement = typeImproved.filter((a) => a.dwcAfterAction !== undefined);

        return {
          type,
          successRate: typeActions.length > 0 ? Math.round((typeImproved.length / typeActions.length) * 100) : 0,
          successCount: typeImproved.length,
          total: typeActions.length,
          avgImprovement:
            typeWithImprovement.length > 0
              ? typeWithImprovement.reduce((sum, a) => sum + ((a.dwcAfterAction || 0) - a.dwcAtAction), 0) /
                typeWithImprovement.length
              : 0,
        };
      })
      .filter((t) => t.total > 0);

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
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    // Get drivers with poor performance
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    // Get pending coaching actions
    const pendingActions = await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();
    const driversWithPendingAction = new Set(
      pendingActions.filter((a) => a.status === "pending").map((a) => a.driverId),
    );

    const suggestions = await Promise.all(
      weeklyStats.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = total > 0 ? Math.round((stat.dwcCompliant / total) * 1000) / 10 : 0;

        // Skip if DWC is already at the target weekly threshold
        if (dwcPercent >= 95) return null;

        const tier = getTier(dwcPercent);

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
          reason:
            tier === "poor"
              ? `Performance critique: ${dwcPercent}% DWC`
              : `Performance sous le seuil: ${dwcPercent}% DWC`,
          mainError: mainError.name,
          mainErrorCount: mainError.count,
          hasActiveAction,
        };
      }),
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

/**
 * Récupère l'historique de coaching d'un driver (pour la page detail)
 * Vérifie l'accès à la station du driver
 */
export const getDriverCoachingHistory = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès via le driver
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return [];

    const hasAccess = await canAccessStation(ctx, driver.stationId);
    if (!hasAccess) return [];

    const actions = await ctx.db
      .query("coachingActions")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .order("desc")
      .take(20);

    // Format for the CoachingAction type used in DriverDetail
    return actions.map((action) => {
      // Calculate week from createdAt
      const date = new Date(action.createdAt);
      const weekNum = getWeekNumber(date);
      const _year = date.getFullYear();

      // Map status to result
      let result: "ameliore" | "complete" | "en-cours";
      if (action.status === "improved") result = "ameliore";
      else if (action.status === "pending") result = "en-cours";
      else result = "complete";

      // Map actionType to type
      let type: "discussion" | "formation" | "suivi";
      if (action.actionType === "training") type = "formation";
      else if (action.actionType === "discussion") type = "discussion";
      else type = "suivi";

      // Calculate impact if we have before/after
      let impactPercent: number | undefined;
      if (action.dwcAfterAction !== undefined) {
        impactPercent = Math.round((action.dwcAfterAction - action.dwcAtAction) * 10) / 10;
      }

      return {
        id: action._id,
        week: `S${weekNum}`,
        date: date.toISOString().split("T")[0],
        type,
        subject: action.reason,
        result,
        impactPercent,
      };
    });
  },
});

// Helper to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ============================================
// COACHING MUTATIONS
// ============================================

export const createCoachingAction = mutation({
  args: {
    stationId: v.id("stations"),
    driverId: v.id("drivers"),
    actionType: v.union(v.literal("discussion"), v.literal("warning"), v.literal("training"), v.literal("suspension")),
    reason: v.string(),
    targetCategory: v.optional(v.string()),
    targetSubcategory: v.optional(v.string()),
    notes: v.optional(v.string()),
    dwcAtAction: v.number(),
    followUpDate: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Vérifier les permissions d'écriture
    await requireWriteAccess(ctx, args.stationId);

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
    result: v.union(v.literal("improved"), v.literal("no_effect"), v.literal("escalated")),
    dwcAfterAction: v.optional(v.number()),
    evaluationNotes: v.optional(v.string()),
    escalationNote: v.optional(v.string()),
    escalationDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Récupérer l'action pour vérifier les permissions
    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throw new Error("Action not found");
    }

    // Vérifier les permissions d'écriture
    await requireWriteAccess(ctx, action.stationId);

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

/**
 * Get coaching actions for calendar view
 * Returns actions with follow-up dates for display on a calendar
 */
export const getCalendarEvents = query({
  args: {
    stationId: v.id("stations"),
    startDate: v.string(), // ISO date string
    endDate: v.string(), // ISO date string
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    // Get all coaching actions for this station
    const actions = await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    // Filter to actions with follow-up dates in the range
    const startTime = new Date(args.startDate).getTime();
    const endTime = new Date(args.endDate).getTime();

    const events = await Promise.all(
      actions
        .filter((action) => {
          if (!action.followUpDate) return false;
          const followUpTime = new Date(action.followUpDate).getTime();
          return followUpTime >= startTime && followUpTime <= endTime;
        })
        .map(async (action) => {
          const driver = await ctx.db.get(action.driverId);
          if (!driver) return null;

          // Map action type to color
          const colorMap: Record<string, string> = {
            discussion: "blue",
            warning: "orange",
            training: "purple",
            suspension: "red",
          };

          // Map status to variant
          const statusVariant = action.status === "pending" ? "default" : "secondary";

          return {
            id: action._id,
            title: driver.name,
            description: action.reason,
            startDate: action.followUpDate,
            endDate: action.followUpDate,
            color: colorMap[action.actionType] || "gray",
            variant: statusVariant,
            // Metadata
            driverId: action.driverId,
            driverName: driver.name,
            actionType: action.actionType,
            status: action.status,
            createdAt: new Date(action.createdAt).toISOString(),
          };
        }),
    );

    return events.filter((e): e is NonNullable<typeof e> => e !== null);
  },
});

/**
 * Get follow-up dates for a month (for calendar dots)
 */
export const getFollowUpDatesForMonth = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    month: v.number(), // 1-12
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    // Get all pending coaching actions for this station
    const actions = await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    // Filter to pending actions with follow-up dates in the specified month
    const startOfMonth = new Date(args.year, args.month - 1, 1);
    const endOfMonth = new Date(args.year, args.month, 0);

    const datesWithFollowUps: { date: string; count: number; types: string[] }[] = [];
    const dateMap = new Map<string, { count: number; types: Set<string> }>();

    for (const action of actions) {
      if (!action.followUpDate || action.status !== "pending") continue;

      const followUpDate = new Date(action.followUpDate);
      if (followUpDate >= startOfMonth && followUpDate <= endOfMonth) {
        const dateKey = action.followUpDate.split("T")[0];
        const existing = dateMap.get(dateKey) || { count: 0, types: new Set<string>() };
        existing.count++;
        existing.types.add(action.actionType);
        dateMap.set(dateKey, existing);
      }
    }

    for (const [date, data] of dateMap) {
      datesWithFollowUps.push({
        date,
        count: data.count,
        types: Array.from(data.types),
      });
    }

    return datesWithFollowUps;
  },
});

/**
 * Get coaching pipeline suggestion for a driver
 * Analyzes history and suggests next action based on escalation logic
 */
export const getCoachingPipelineSuggestion = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès via le driver
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return null;

    const hasAccess = await canAccessStation(ctx, driver.stationId);
    if (!hasAccess) return null;

    const actions = await ctx.db
      .query("coachingActions")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .collect();

    // Count by type and status
    const discussionCount = actions.filter((a) => a.actionType === "discussion").length;
    const warningCount = actions.filter((a) => a.actionType === "warning").length;
    const trainingCount = actions.filter((a) => a.actionType === "training").length;
    const suspensionCount = actions.filter((a) => a.actionType === "suspension").length;
    const pendingActions = actions.filter((a) => a.status === "pending").length;

    // Get last action (most recent)
    const sortedActions = [...actions].sort((a, b) => b.createdAt - a.createdAt);
    const lastAction = sortedActions[0];

    // Determine pipeline stage (1-5)
    let pipelineStage: 1 | 2 | 3 | 4 | 5 = 1;
    if (suspensionCount > 0) pipelineStage = 5;
    else if (warningCount > 0) pipelineStage = 4;
    else if (trainingCount > 0) pipelineStage = 3;
    else if (discussionCount > 1) pipelineStage = 2;
    else if (discussionCount === 1) pipelineStage = 1;

    // Apply suggestion logic
    let suggestedAction: "discussion" | "warning" | "training" | "suspension" = "discussion";
    let reason = "";

    // If pending action exists, suggest follow-up
    if (pendingActions > 0) {
      suggestedAction = "discussion";
      reason = "Action en cours - évaluer d'abord le résultat";
    }
    // 3 warnings reached → suggest suspension
    else if (warningCount >= 3) {
      suggestedAction = "suspension";
      reason = "3 avertissements atteints - suspension recommandée";
    }
    // Last action had no effect → escalate
    else if (lastAction?.status === "no_effect") {
      if (lastAction.actionType === "discussion") {
        suggestedAction = trainingCount === 0 ? "training" : "warning";
        reason =
          trainingCount === 0
            ? "Discussion sans effet - formation recommandée"
            : "Discussions sans effet - avertissement recommandé";
      } else if (lastAction.actionType === "training") {
        suggestedAction = "warning";
        reason = `Formation sans effet - avertissement ${warningCount + 1}/3`;
      } else if (lastAction.actionType === "warning") {
        suggestedAction = warningCount >= 2 ? "suspension" : "warning";
        reason =
          warningCount >= 2
            ? "Avertissements sans effet - suspension recommandée"
            : `Avertissement sans effet - avertissement ${warningCount + 1}/3`;
      } else {
        suggestedAction = "discussion";
        reason = "Nouvelle discussion recommandée";
      }
    }
    // First time coaching
    else if (discussionCount === 0) {
      suggestedAction = "discussion";
      reason = "Premier contact - discussion recommandée";
    }
    // After discussions with no training yet
    else if (discussionCount >= 1 && trainingCount === 0) {
      suggestedAction = "training";
      reason = "Discussions effectuées - formation recommandée";
    }
    // After training with no warnings yet
    else if (trainingCount >= 1 && warningCount < 3) {
      suggestedAction = "warning";
      reason = `Formation effectuée - avertissement ${warningCount + 1}/3`;
    }
    // Default
    else {
      suggestedAction = "discussion";
      reason = "Nouvelle discussion recommandée";
    }

    return {
      suggestedAction,
      reason,
      pipelineStage,
      history: {
        discussionCount,
        warningCount,
        trainingCount,
        suspensionCount,
        pendingActions,
        lastAction: lastAction
          ? {
              type: lastAction.actionType,
              date: new Date(lastAction.createdAt).toISOString().split("T")[0],
              status: lastAction.status,
            }
          : undefined,
      },
      canEscalate: warningCount < 3,
    };
  },
});

/**
 * Get Kanban data for coaching page
 * Returns 3 columns: detect (need coaching), waiting (pending actions), evaluate (overdue)
 */
export const getKanbanData = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return { detect: [], waiting: [], evaluate: [], done: [] };

    const today = new Date().toISOString().split("T")[0];

    // 1. Get all weekly stats for current week
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    // 2. Get all pending coaching actions for this station
    const allActions = await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    const pendingActions = allActions.filter((a) => a.status === "pending");
    const driversWithPendingAction = new Set(pendingActions.map((a) => a.driverId));

    // 3. Calculate trend for each driver (last 14 days)
    const _trendCache = new Map<string, number>();

    // Helper to get tier
    // COLUMN 1: DETECT - Drivers with DWC < 95% and no pending action
    const detectCards = await Promise.all(
      weeklyStats
        .filter((stat) => {
          const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
          const dwcPercent = total > 0 ? (stat.dwcCompliant / total) * 100 : 0;
          return dwcPercent < 95 && !driversWithPendingAction.has(stat.driverId);
        })
        .map(async (stat) => {
          const driver = await ctx.db.get(stat.driverId);
          if (!driver) return null;

          const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
          const dwcPercent = total > 0 ? Math.round((stat.dwcCompliant / total) * 1000) / 10 : 0;

          // Get previous week stats for trend
          const prevWeek = args.week === 1 ? 52 : args.week - 1;
          const prevYear = args.week === 1 ? args.year - 1 : args.year;
          const prevStats = await ctx.db
            .query("driverWeeklyStats")
            .withIndex("by_driver_week", (q) =>
              q.eq("driverId", stat.driverId).eq("year", prevYear).eq("week", prevWeek),
            )
            .first();

          let trendPercent = 0;
          if (prevStats) {
            const prevTotal = prevStats.dwcCompliant + prevStats.dwcMisses + prevStats.failedAttempts;
            const prevDwc = prevTotal > 0 ? (prevStats.dwcCompliant / prevTotal) * 100 : 0;
            trendPercent = Math.round((dwcPercent - prevDwc) * 10) / 10;
          }

          // Calculate IADC percent
          const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
          const iadcPercent = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

          // Calculate total errors (DWC misses + failed attempts + IADC non-compliant)
          const errorsCount = stat.dwcMisses + stat.failedAttempts + stat.iadcNonCompliant;

          return {
            id: `detect-${driver._id}`,
            driverId: driver._id,
            driverName: driver.name,
            dwcPercent,
            iadcPercent,
            tier: getTier(dwcPercent),
            trendPercent,
            deliveries: total,
            errorsCount,
          };
        }),
    );

    // COLUMN 2: WAITING - Pending actions with followUpDate > today
    const waitingCards = await Promise.all(
      pendingActions
        .filter((action) => {
          if (!action.followUpDate) return false;
          return action.followUpDate > today;
        })
        .map(async (action) => {
          const driver = await ctx.db.get(action.driverId);
          if (!driver) return null;

          // Calculate days until follow-up
          const followUpDate = new Date(action.followUpDate!);
          const todayDate = new Date(today);
          const daysUntilFollowUp = Math.ceil((followUpDate.getTime() - todayDate.getTime()) / (24 * 60 * 60 * 1000));

          return {
            id: action._id,
            driverId: driver._id,
            driverName: driver.name,
            actionType: action.actionType,
            dwcAtAction: action.dwcAtAction,
            reason: action.reason,
            followUpDate: action.followUpDate!,
            daysUntilFollowUp,
            createdAt: new Date(action.createdAt).toISOString(),
          };
        }),
    );

    // COLUMN 3: EVALUATE - Pending actions with followUpDate <= today
    const evaluateCards = await Promise.all(
      pendingActions
        .filter((action) => {
          if (!action.followUpDate) return true; // No date = should evaluate
          return action.followUpDate <= today;
        })
        .map(async (action) => {
          const driver = await ctx.db.get(action.driverId);
          if (!driver) return null;

          // Get current DWC for this driver
          const latestStats = await ctx.db
            .query("driverWeeklyStats")
            .withIndex("by_driver", (q) => q.eq("driverId", action.driverId))
            .order("desc")
            .first();

          let currentDwc = action.dwcAtAction;
          if (latestStats) {
            const total = latestStats.dwcCompliant + latestStats.dwcMisses + latestStats.failedAttempts;
            currentDwc = total > 0 ? Math.round((latestStats.dwcCompliant / total) * 1000) / 10 : 0;
          }

          const dwcDelta = Math.round((currentDwc - action.dwcAtAction) * 10) / 10;

          // Calculate days overdue
          let daysOverdue = 0;
          if (action.followUpDate) {
            const followUpDate = new Date(action.followUpDate);
            const todayDate = new Date(today);
            daysOverdue = Math.max(
              0,
              Math.ceil((todayDate.getTime() - followUpDate.getTime()) / (24 * 60 * 60 * 1000)),
            );
          }

          return {
            id: action._id,
            driverId: driver._id,
            driverName: driver.name,
            actionType: action.actionType,
            dwcAtAction: action.dwcAtAction,
            currentDwc,
            dwcDelta,
            reason: action.reason,
            followUpDate: action.followUpDate,
            daysOverdue,
            createdAt: new Date(action.createdAt).toISOString(),
          };
        }),
    );

    // COLUMN 4: DONE - Evaluated actions from last 30 days (max 10)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const doneActions = allActions.filter(
      (a) =>
        (a.status === "improved" || a.status === "no_effect" || a.status === "escalated") &&
        a.evaluatedAt &&
        a.evaluatedAt > thirtyDaysAgo,
    );

    const doneCards = await Promise.all(
      doneActions
        .sort((a, b) => (b.evaluatedAt || 0) - (a.evaluatedAt || 0)) // Most recent first
        .slice(0, 10) // Limit to 10
        .map(async (action) => {
          const driver = await ctx.db.get(action.driverId);
          if (!driver) return null;

          const dwcDelta =
            action.dwcAfterAction !== undefined
              ? Math.round((action.dwcAfterAction - action.dwcAtAction) * 10) / 10
              : 0;

          return {
            id: action._id,
            driverId: driver._id,
            driverName: driver.name,
            actionType: action.actionType,
            status: action.status,
            dwcAtAction: action.dwcAtAction,
            dwcAfterAction: action.dwcAfterAction,
            dwcDelta,
            reason: action.reason,
            evaluatedAt: action.evaluatedAt ? new Date(action.evaluatedAt).toISOString() : undefined,
          };
        }),
    );

    return {
      detect: detectCards
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .sort((a, b) => a.dwcPercent - b.dwcPercent), // Lowest DWC first
      waiting: waitingCards
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .sort((a, b) => a.daysUntilFollowUp - b.daysUntilFollowUp), // Closest follow-up first
      evaluate: evaluateCards
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .sort((a, b) => b.daysOverdue - a.daysOverdue), // Most overdue first
      done: doneCards.filter((c): c is NonNullable<typeof c> => c !== null),
    };
  },
});
