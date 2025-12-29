import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * List all stations (for finding station ID to use in seed)
 *
 * Usage:
 * npx convex run seed/seedCoaching:listStationsForSeed
 */
export const listStationsForSeed = query({
  args: {},
  handler: async (ctx) => {
    const stations = await ctx.db.query("stations").collect();
    return stations.map((s) => ({
      id: s._id,
      code: s.code,
      name: s.name,
    }));
  },
});

/**
 * Seed coaching data for testing
 * Creates varied coaching actions across multiple drivers
 *
 * Usage:
 * npx convex run seed/seedCoaching:seedCoachingData '{"stationId": "your-station-id"}'
 */
export const seedCoachingData = mutation({
  args: {
    stationId: v.id("stations"),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const createdBy = args.createdBy || "seed-script";

    // 1. Get drivers with DWC < 96% (poor/fair performers)
    const allStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    // Get unique drivers and their latest stats
    const driverStatsMap = new Map<string, typeof allStats[0]>();
    for (const stat of allStats) {
      const existing = driverStatsMap.get(stat.driverId);
      if (!existing || stat.year > existing.year || (stat.year === existing.year && stat.week > existing.week)) {
        driverStatsMap.set(stat.driverId, stat);
      }
    }

    // Filter to drivers with DWC < 96%
    const targetDrivers: { driverId: Id<"drivers">; dwc: number }[] = [];
    for (const [driverId, stat] of driverStatsMap) {
      const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      const dwc = total > 0 ? Math.round((stat.dwcCompliant / total) * 1000) / 10 : 0;
      if (dwc < 96) {
        targetDrivers.push({ driverId: driverId as Id<"drivers">, dwc });
      }
    }

    // Sort by DWC (worst first) and take up to 10
    targetDrivers.sort((a, b) => a.dwc - b.dwc);
    const selectedDrivers = targetDrivers.slice(0, 10);

    if (selectedDrivers.length === 0) {
      return {
        success: false,
        message: "Aucun driver avec DWC < 96% trouvé. Importez d'abord des données.",
        created: 0,
      };
    }

    // 2. Define action scenarios
    type ActionScenario = {
      actionType: "discussion" | "warning" | "training" | "suspension";
      status: "pending" | "improved" | "no_effect" | "escalated";
      daysAgo: number;
      followUpDaysFromCreation?: number;
      dwcImprovement?: number;
    };

    const scenarios: ActionScenario[] = [
      // Completed actions - IMPROVED
      { actionType: "discussion", status: "improved", daysAgo: 56, dwcImprovement: 2.5 },
      { actionType: "discussion", status: "improved", daysAgo: 42, dwcImprovement: 1.8 },
      { actionType: "training", status: "improved", daysAgo: 35, dwcImprovement: 3.2 },

      // Completed actions - NO EFFECT (led to escalation)
      { actionType: "discussion", status: "no_effect", daysAgo: 28 },
      { actionType: "training", status: "no_effect", daysAgo: 21 },

      // Pending actions - OVERDUE (followUpDate passed)
      { actionType: "warning", status: "pending", daysAgo: 14, followUpDaysFromCreation: 7 },
      { actionType: "discussion", status: "pending", daysAgo: 10, followUpDaysFromCreation: 5 },

      // Pending actions - UPCOMING
      { actionType: "discussion", status: "pending", daysAgo: 7, followUpDaysFromCreation: 14 },
      { actionType: "training", status: "pending", daysAgo: 5, followUpDaysFromCreation: 10 },
      { actionType: "warning", status: "pending", daysAgo: 3, followUpDaysFromCreation: 14 },
    ];

    // Reasons templates
    const reasons: Record<string, string[]> = {
      discussion: [
        "Performance DWC en baisse - discussion de sensibilisation",
        "Contact Miss récurrents - discussion sur les procédures",
        "Photo Defect multiples - rappel des bonnes pratiques",
        "Tendance négative sur 2 semaines",
      ],
      warning: [
        "Performance critique - premier avertissement",
        "Pas d'amélioration après formation - avertissement",
        "Non-respect des procédures malgré discussions",
      ],
      training: [
        "Formation sur les procédures de livraison",
        "Refresh formation Photo/OTP",
        "Session accompagnement terrain",
      ],
      suspension: [
        "Suspension temporaire suite à avertissements",
      ],
    };

    // 3. Create coaching actions
    const createdActions: Id<"coachingActions">[] = [];

    for (let i = 0; i < Math.min(selectedDrivers.length, scenarios.length); i++) {
      const driver = selectedDrivers[i];
      const scenario = scenarios[i];

      const createdAt = now - scenario.daysAgo * day;
      const reasonOptions = reasons[scenario.actionType];
      const reason = reasonOptions[Math.floor(Math.random() * reasonOptions.length)];

      // Calculate followUpDate if applicable
      let followUpDate: string | undefined;
      if (scenario.followUpDaysFromCreation !== undefined) {
        const followUpTimestamp = createdAt + scenario.followUpDaysFromCreation * day;
        followUpDate = new Date(followUpTimestamp).toISOString().split("T")[0];
      }

      // Calculate evaluatedAt and dwcAfterAction for completed actions
      let evaluatedAt: number | undefined;
      let dwcAfterAction: number | undefined;
      if (scenario.status === "improved" || scenario.status === "no_effect") {
        evaluatedAt = createdAt + 14 * day; // Evaluated 2 weeks after creation
        if (scenario.dwcImprovement) {
          dwcAfterAction = Math.min(driver.dwc + scenario.dwcImprovement, 99);
        }
      }

      const actionId = await ctx.db.insert("coachingActions", {
        stationId: args.stationId,
        driverId: driver.driverId,
        actionType: scenario.actionType,
        status: scenario.status,
        reason,
        dwcAtAction: driver.dwc,
        dwcAfterAction,
        followUpDate,
        evaluatedAt,
        createdBy,
        createdAt,
        updatedAt: scenario.status === "pending" ? createdAt : (evaluatedAt || createdAt),
      });

      createdActions.push(actionId);
    }

    // 4. Create a few more actions for variety (multiple actions per driver)
    if (selectedDrivers.length >= 2) {
      // Driver 0: Add escalation chain (discussion -> no_effect -> warning)
      const chainDriver = selectedDrivers[0];

      // Old discussion that failed
      await ctx.db.insert("coachingActions", {
        stationId: args.stationId,
        driverId: chainDriver.driverId,
        actionType: "discussion",
        status: "no_effect",
        reason: "Discussion initiale - pas d'amélioration constatée",
        dwcAtAction: chainDriver.dwc - 1,
        followUpDate: new Date(now - 45 * day).toISOString().split("T")[0],
        evaluatedAt: now - 35 * day,
        evaluationNotes: "Aucune amélioration visible, escalade vers formation",
        createdBy,
        createdAt: now - 50 * day,
        updatedAt: now - 35 * day,
      });
      createdActions.push("chain-1" as unknown as Id<"coachingActions">);

      // Training that also failed
      await ctx.db.insert("coachingActions", {
        stationId: args.stationId,
        driverId: chainDriver.driverId,
        actionType: "training",
        status: "no_effect",
        reason: "Formation Photo/OTP suite à discussions inefficaces",
        dwcAtAction: chainDriver.dwc - 0.5,
        followUpDate: new Date(now - 25 * day).toISOString().split("T")[0],
        evaluatedAt: now - 15 * day,
        evaluationNotes: "Formation complétée mais performance toujours insuffisante",
        escalationNote: "Passage à l'avertissement formel",
        createdBy,
        createdAt: now - 35 * day,
        updatedAt: now - 15 * day,
      });
      createdActions.push("chain-2" as unknown as Id<"coachingActions">);

      // Driver 1: Success story
      const successDriver = selectedDrivers[1];
      await ctx.db.insert("coachingActions", {
        stationId: args.stationId,
        driverId: successDriver.driverId,
        actionType: "discussion",
        status: "improved",
        reason: "Discussion de sensibilisation sur Contact Miss",
        dwcAtAction: successDriver.dwc - 3,
        dwcAfterAction: successDriver.dwc + 1.5,
        followUpDate: new Date(now - 40 * day).toISOString().split("T")[0],
        evaluatedAt: now - 30 * day,
        evaluationNotes: "Excellente amélioration! Driver très réceptif.",
        createdBy,
        createdAt: now - 50 * day,
        updatedAt: now - 30 * day,
      });
      createdActions.push("success-1" as unknown as Id<"coachingActions">);
    }

    return {
      success: true,
      message: `${createdActions.length} actions de coaching créées`,
      created: createdActions.length,
      driversUsed: selectedDrivers.length,
      scenarios: [
        `Improved: 3+`,
        `No Effect: 2+`,
        `Pending (overdue): 2`,
        `Pending (upcoming): 3`,
      ],
    };
  },
});

/**
 * Clear all coaching actions for a station (for testing)
 */
export const clearCoachingData = mutation({
  args: {
    stationId: v.id("stations"),
    confirm: v.literal("DELETE_ALL_COACHING"),
  },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    for (const action of actions) {
      await ctx.db.delete(action._id);
    }

    return {
      success: true,
      deleted: actions.length,
    };
  },
});
