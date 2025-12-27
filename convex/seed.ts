import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { subDays, addDays, format, getYear, getISOWeek } from "date-fns"

/**
 * Debug query to list available stations and drivers for seeding
 */
export const listSeedTargets = query({
  args: {},
  handler: async (ctx) => {
    const stations = await ctx.db.query("stations").collect()
    const result: {
      stationId: string
      stationCode: string
      stationName: string
      drivers: { driverId: string; name: string; amazonId: string }[]
    }[] = []

    for (const station of stations) {
      const drivers = await ctx.db
        .query("drivers")
        .withIndex("by_station", (q) => q.eq("stationId", station._id))
        .take(10)

      result.push({
        stationId: station._id,
        stationCode: station.code,
        stationName: station.name,
        drivers: drivers.map((d) => ({
          driverId: d._id,
          name: d.name,
          amazonId: d.amazonId,
        })),
      })
    }

    return result
  },
})

/**
 * Seed test data for coaching flow testing
 * Generates 90 days of daily stats + 4 coaching actions
 * Simulates a driver improving over 3 months after coaching interventions
 */
export const seedTestCoachingData = mutation({
  args: {
    stationId: v.id("stations"),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const today = new Date()

    // First, delete any existing daily stats for this driver in the last 90 days
    const startDate = format(subDays(today, 90), "yyyy-MM-dd")
    const existingStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_driver_date", (q) => q.eq("driverId", args.driverId))
      .collect()

    const statsToDelete = existingStats.filter((s) => s.date >= startDate)
    for (const stat of statsToDelete) {
      await ctx.db.delete(stat._id)
    }

    // Delete existing coaching actions for this driver
    const existingActions = await ctx.db
      .query("coachingActions")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .collect()

    for (const action of existingActions) {
      await ctx.db.delete(action._id)
    }

    // Generate 90 days of daily stats with progressive improvement
    const dailyStatsInserted: string[] = []

    for (let i = 0; i < 90; i++) {
      const date = subDays(today, 90 - i)
      const dateStr = format(date, "yyyy-MM-dd")
      const year = getYear(date)
      const week = getISOWeek(date)

      // Progression: poor (days 1-30) → fair (days 31-60) → great (days 61-90)
      let baseDwc: number
      let baseIadc: number

      if (i < 30) {
        // Phase 1: Poor performance (85-91% DWC)
        baseDwc = 85 + Math.random() * 6
        baseIadc = 88 + Math.random() * 5
      } else if (i < 60) {
        // Phase 2: Fair performance (91-95% DWC)
        baseDwc = 91 + Math.random() * 4
        baseIadc = 92 + Math.random() * 4
      } else {
        // Phase 3: Great performance (95-98.5% DWC)
        baseDwc = 95 + Math.random() * 3.5
        baseIadc = 95 + Math.random() * 3
      }

      // Simulate volumes
      const totalDeliveries = 80 + Math.floor(Math.random() * 40) // 80-120 per day
      const dwcMisses = Math.round(totalDeliveries * (100 - baseDwc) / 100)
      const dwcCompliant = totalDeliveries - dwcMisses
      const failedAttempts = Math.floor(Math.random() * 3)

      const iadcNonCompliant = Math.round(totalDeliveries * (100 - baseIadc) / 100)
      const iadcCompliant = totalDeliveries - iadcNonCompliant

      await ctx.db.insert("driverDailyStats", {
        driverId: args.driverId,
        stationId: args.stationId,
        date: dateStr,
        year,
        week,
        dwcCompliant,
        dwcMisses,
        failedAttempts,
        iadcCompliant,
        iadcNonCompliant,
        dwcBreakdown: {
          contactMiss: Math.floor(dwcMisses * 0.4),
          photoDefect: Math.floor(dwcMisses * 0.3),
          noPhoto: Math.floor(dwcMisses * 0.2),
          otpMiss: Math.floor(dwcMisses * 0.1),
          other: 0,
        },
        iadcBreakdown: {
          mailbox: Math.floor(iadcNonCompliant * 0.5),
          unattended: Math.floor(iadcNonCompliant * 0.3),
          safePlace: Math.floor(iadcNonCompliant * 0.2),
          other: 0,
        },
        createdAt: date.getTime(),
      })

      dailyStatsInserted.push(dateStr)
    }

    // Create 4 coaching actions at key dates
    const coachingData = [
      {
        day: 15,
        type: "discussion" as const,
        status: "improved" as const,
        dwcAt: 87,
        dwcAfter: 92,
        reason: "Performance DWC insuffisante - Discussion initiale sur les bonnes pratiques",
      },
      {
        day: 35,
        type: "training" as const,
        status: "improved" as const,
        dwcAt: 92,
        dwcAfter: 94,
        reason: "Formation sur la gestion des photos de livraison",
      },
      {
        day: 55,
        type: "discussion" as const,
        status: "improved" as const,
        dwcAt: 94,
        dwcAfter: 96,
        reason: "Suivi post-formation - Discussion sur les progrès",
      },
      {
        day: 75,
        type: "discussion" as const,
        status: "improved" as const,
        dwcAt: 96,
        dwcAfter: 97.5,
        reason: "Évaluation finale - Félicitations pour l'amélioration",
      },
    ]

    const coachingActionsInserted: string[] = []

    for (const c of coachingData) {
      const actionDate = subDays(today, 90 - c.day)
      const followUpDate = addDays(actionDate, 14)

      await ctx.db.insert("coachingActions", {
        driverId: args.driverId,
        stationId: args.stationId,
        actionType: c.type,
        status: c.status,
        reason: c.reason,
        dwcAtAction: c.dwcAt,
        dwcAfterAction: c.dwcAfter,
        followUpDate: format(followUpDate, "yyyy-MM-dd"),
        createdBy: "system-seed",
        createdAt: actionDate.getTime(),
        updatedAt: actionDate.getTime(),
        evaluatedAt: followUpDate.getTime(),
        evaluationNotes: `Amélioration constatée: ${c.dwcAt}% → ${c.dwcAfter}%`,
      })

      coachingActionsInserted.push(format(actionDate, "yyyy-MM-dd"))
    }

    return {
      success: true,
      dailyStatsCount: dailyStatsInserted.length,
      coachingActionsCount: coachingActionsInserted.length,
      dateRange: {
        start: dailyStatsInserted[0],
        end: dailyStatsInserted[dailyStatsInserted.length - 1],
      },
      coachingDates: coachingActionsInserted,
    }
  },
})

/**
 * Clear all test data for a driver (useful for re-testing)
 */
export const clearDriverTestData = mutation({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    // Delete all daily stats
    const dailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_driver_date", (q) => q.eq("driverId", args.driverId))
      .collect()

    for (const stat of dailyStats) {
      await ctx.db.delete(stat._id)
    }

    // Delete all coaching actions
    const coachingActions = await ctx.db
      .query("coachingActions")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .collect()

    for (const action of coachingActions) {
      await ctx.db.delete(action._id)
    }

    return {
      deleted: {
        dailyStats: dailyStats.length,
        coachingActions: coachingActions.length,
      },
    }
  },
})
