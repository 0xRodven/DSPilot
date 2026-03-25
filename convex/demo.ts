import { v } from "convex/values"
import { mutation, query, internalMutation } from "./_generated/server"
import { format, subDays, getYear, getISOWeek } from "date-fns"
import { getUserContext } from "./lib/permissions"
import { getTier } from "./lib/tier"

// Demo station code - identifiable
const DEMO_STATION_CODE = "DEMO1"
const DEMO_STATION_NAME = "Station Démo Paris"

// Realistic French driver names
const DEMO_DRIVERS = [
  "Amadou Diallo", "Fatou Sylla", "Moussa Konaté", "Ibrahim Touré",
  "Mariama Bah", "Ousmane Diop", "Aïssatou Fall", "Cheikh Ndiaye",
  "Aminata Sow", "Mamadou Camara", "Kadiatou Barry", "Sékou Traoré",
  "Fatoumata Diarra", "Abdoulaye Cissé", "Mariam Keita", "Boubacar Sanogo",
  "Oumou Coulibaly", "Modibo Sidibé", "Rokia Dramé", "Issa Kouyaté"
]

/**
 * Check if demo station exists
 */
export const getDemoStation = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", DEMO_STATION_CODE))
      .first()
  },
})

/**
 * Check if a station is the demo station
 */
export const isDemoStation = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, { stationId }) => {
    const station = await ctx.db.get(stationId)
    return station?.code === DEMO_STATION_CODE
  },
})

/**
 * Create or reset demo station with full sample data
 * This generates:
 * - 1 demo station
 * - 20 drivers with realistic names
 * - 12 weeks of daily stats
 * - 8-10 coaching actions
 * - Some alerts
 */
export const setupDemoData = mutation({
  args: {
    userId: v.string(), // The user ID to assign as owner
  },
  handler: async (ctx, { userId }) => {
    const now = Date.now()
    const today = new Date()

    // Get the current organization ID from Clerk
    const { orgId } = await getUserContext(ctx, false)

    // Check if demo station already exists for this org
    let station = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", DEMO_STATION_CODE))
      .first()

    // If exists, clear all related data first
    if (station) {
      await clearDemoDataInternal(ctx, station._id)
      // Update owner and organizationId if needed
      await ctx.db.patch(station._id, {
        ownerId: userId,
        organizationId: orgId ?? undefined,
      })
    } else {
      // Create new demo station linked to the current org
      station = {
        _id: await ctx.db.insert("stations", {
          code: DEMO_STATION_CODE,
          name: DEMO_STATION_NAME,
          region: "Île-de-France",
          organizationId: orgId ?? undefined,
          ownerId: userId,
          plan: "pro",
          createdAt: now,
        }),
        code: DEMO_STATION_CODE,
        name: DEMO_STATION_NAME,
        region: "Île-de-France",
        organizationId: orgId ?? undefined,
        ownerId: userId,
        plan: "pro" as const,
        createdAt: now,
        _creationTime: now,
      }
    }

    const stationId = station._id

    // Create drivers
    const driverIds: { id: string; name: string; tier: string }[] = []

    for (let i = 0; i < DEMO_DRIVERS.length; i++) {
      const name = DEMO_DRIVERS[i]
      const amazonId = `AMZN${String(10000 + i).slice(1)}`

      const driverId = await ctx.db.insert("drivers", {
        stationId,
        amazonId,
        name,
        isActive: true,
        firstSeenWeek: `2024-40`,
        createdAt: now - (90 * 24 * 60 * 60 * 1000), // 90 days ago
        updatedAt: now,
      })

      // Assign tier distribution: 4 fantastic, 6 great, 6 fair, 4 poor
      let tier = "fair"
      if (i < 4) tier = "fantastic"
      else if (i < 10) tier = "great"
      else if (i < 16) tier = "fair"
      else tier = "poor"

      driverIds.push({ id: driverId, name, tier })
    }

    // Generate 12 weeks of data
    const weeksToGenerate = 12
    const weeklyStatsCreated: number[] = []

    for (let weekOffset = weeksToGenerate - 1; weekOffset >= 0; weekOffset--) {
      const weekStart = subDays(today, weekOffset * 7 + today.getDay())
      const year = getYear(weekStart)
      const week = getISOWeek(weekStart)

      let stationDwcCompliant = 0
      let stationDwcMisses = 0
      let stationFailedAttempts = 0
      let stationIadcCompliant = 0
      let stationIadcNonCompliant = 0
      const tierCounts = { fantastic: 0, great: 0, fair: 0, poor: 0 }

      // Generate daily stats for each driver (7 days per week)
      for (const driver of driverIds) {
        let weekDwcCompliant = 0
        let weekDwcMisses = 0
        let weekFailedAttempts = 0
        let weekIadcCompliant = 0
        let weekIadcNonCompliant = 0
        let daysWorked = 0

        // Work 5-6 days per week
        const workDays = 5 + Math.floor(Math.random() * 2)
        const skipDays = new Set<number>()
        while (skipDays.size < 7 - workDays) {
          skipDays.add(Math.floor(Math.random() * 7))
        }

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          if (skipDays.has(dayOffset)) continue

          const date = subDays(today, weekOffset * 7 + (6 - dayOffset))
          const dateStr = format(date, "yyyy-MM-dd")
          daysWorked++

          // Base performance based on tier
          let baseDwc: number
          switch (driver.tier) {
            case "fantastic": baseDwc = 95 + Math.random() * 4.5; break
            case "great": baseDwc = 90 + Math.random() * 5; break
            case "fair": baseDwc = 88 + Math.random() * 2; break
            default: baseDwc = 82 + Math.random() * 8
          }

          // Add slight weekly progression for some drivers
          if (weekOffset > 6) baseDwc -= (weekOffset - 6) * 0.3

          const totalDeliveries = 80 + Math.floor(Math.random() * 50)
          const dwcMissPercent = Math.max(0, 100 - baseDwc)
          const dwcMisses = Math.round(totalDeliveries * dwcMissPercent / 100)
          const dwcCompliant = totalDeliveries - dwcMisses
          const failedAttempts = Math.floor(Math.random() * 4)

          const iadcPercent = baseDwc + Math.random() * 2 - 1
          const iadcNonCompliant = Math.round(totalDeliveries * (100 - iadcPercent) / 100)
          const iadcCompliant = totalDeliveries - iadcNonCompliant

          await ctx.db.insert("driverDailyStats", {
            driverId: driver.id as any,
            stationId,
            date: dateStr,
            year: getYear(date),
            week: getISOWeek(date),
            dwcCompliant,
            dwcMisses,
            failedAttempts,
            iadcCompliant,
            iadcNonCompliant,
            dwcBreakdown: {
              contactMiss: Math.floor(dwcMisses * 0.35),
              photoDefect: Math.floor(dwcMisses * 0.30),
              noPhoto: Math.floor(dwcMisses * 0.20),
              otpMiss: Math.floor(dwcMisses * 0.10),
              other: Math.floor(dwcMisses * 0.05),
            },
            iadcBreakdown: {
              mailbox: Math.floor(iadcNonCompliant * 0.45),
              unattended: Math.floor(iadcNonCompliant * 0.30),
              safePlace: Math.floor(iadcNonCompliant * 0.15),
              other: Math.floor(iadcNonCompliant * 0.10),
            },
            createdAt: date.getTime(),
          })

          weekDwcCompliant += dwcCompliant
          weekDwcMisses += dwcMisses
          weekFailedAttempts += failedAttempts
          weekIadcCompliant += iadcCompliant
          weekIadcNonCompliant += iadcNonCompliant
        }

        // Create weekly stats for driver
        if (daysWorked > 0) {
          await ctx.db.insert("driverWeeklyStats", {
            driverId: driver.id as any,
            stationId,
            year,
            week,
            dwcCompliant: weekDwcCompliant,
            dwcMisses: weekDwcMisses,
            failedAttempts: weekFailedAttempts,
            iadcCompliant: weekIadcCompliant,
            iadcNonCompliant: weekIadcNonCompliant,
            daysWorked,
            dwcBreakdown: {
              contactMiss: Math.floor(weekDwcMisses * 0.35),
              photoDefect: Math.floor(weekDwcMisses * 0.30),
              noPhoto: Math.floor(weekDwcMisses * 0.20),
              otpMiss: Math.floor(weekDwcMisses * 0.10),
              other: Math.floor(weekDwcMisses * 0.05),
            },
            iadcBreakdown: {
              mailbox: Math.floor(weekIadcNonCompliant * 0.45),
              unattended: Math.floor(weekIadcNonCompliant * 0.30),
              safePlace: Math.floor(weekIadcNonCompliant * 0.15),
              other: Math.floor(weekIadcNonCompliant * 0.10),
            },
            createdAt: now,
            updatedAt: now,
          })

          // Calculate tier for station aggregation
          const weekTotal = weekDwcCompliant + weekDwcMisses + weekFailedAttempts
          const weekDwcPercent = weekTotal > 0 ? (weekDwcCompliant / weekTotal) * 100 : 0

          tierCounts[getTier(weekDwcPercent)]++

          stationDwcCompliant += weekDwcCompliant
          stationDwcMisses += weekDwcMisses
          stationFailedAttempts += weekFailedAttempts
          stationIadcCompliant += weekIadcCompliant
          stationIadcNonCompliant += weekIadcNonCompliant
        }
      }

      // Create station weekly stats
      await ctx.db.insert("stationWeeklyStats", {
        stationId,
        year,
        week,
        dwcCompliant: stationDwcCompliant,
        dwcMisses: stationDwcMisses,
        failedAttempts: stationFailedAttempts,
        iadcCompliant: stationIadcCompliant,
        iadcNonCompliant: stationIadcNonCompliant,
        totalDrivers: DEMO_DRIVERS.length,
        activeDrivers: DEMO_DRIVERS.length,
        tierDistribution: tierCounts,
        dwcBreakdown: {
          contactMiss: Math.floor(stationDwcMisses * 0.35),
          photoDefect: Math.floor(stationDwcMisses * 0.30),
          noPhoto: Math.floor(stationDwcMisses * 0.20),
          otpMiss: Math.floor(stationDwcMisses * 0.10),
          other: Math.floor(stationDwcMisses * 0.05),
        },
        iadcBreakdown: {
          mailbox: Math.floor(stationIadcNonCompliant * 0.45),
          unattended: Math.floor(stationIadcNonCompliant * 0.30),
          safePlace: Math.floor(stationIadcNonCompliant * 0.15),
          other: Math.floor(stationIadcNonCompliant * 0.10),
        },
        createdAt: now,
        updatedAt: now,
      })

      // Create import record
      const totalDwc = stationDwcCompliant + stationDwcMisses + stationFailedAttempts
      const dwcScore = totalDwc > 0 ? Math.round((stationDwcCompliant / totalDwc) * 1000) / 10 : 0
      const totalIadc = stationIadcCompliant + stationIadcNonCompliant
      const iadcScore = totalIadc > 0 ? Math.round((stationIadcCompliant / totalIadc) * 1000) / 10 : 0

      await ctx.db.insert("imports", {
        stationId,
        filename: `demo_data_${year}_W${week}.html`,
        year,
        week,
        status: "success",
        driversImported: DEMO_DRIVERS.length,
        dailyRecordsCount: DEMO_DRIVERS.length * 5,
        weeklyRecordsCount: DEMO_DRIVERS.length,
        newDriversCount: weekOffset === weeksToGenerate - 1 ? DEMO_DRIVERS.length : 0,
        dwcScore,
        iadcScore,
        tierDistribution: tierCounts,
        importedBy: userId,
        createdAt: now - weekOffset * 7 * 24 * 60 * 60 * 1000,
        completedAt: now - weekOffset * 7 * 24 * 60 * 60 * 1000,
      })

      weeklyStatsCreated.push(week)
    }

    // Create coaching actions for poor/fair tier drivers
    const coachingTargets = driverIds.filter(d => d.tier === "poor" || d.tier === "fair").slice(0, 6)

    for (let i = 0; i < coachingTargets.length; i++) {
      const driver = coachingTargets[i]
      const actionDate = subDays(today, 30 + i * 7)
      const followUpDate = subDays(today, 16 + i * 7)

      const actionTypes = ["discussion", "training", "warning", "discussion"] as const
      const statuses = ["improved", "pending", "no_effect", "improved"] as const

      await ctx.db.insert("coachingActions", {
        driverId: driver.id as any,
        stationId,
        actionType: actionTypes[i % 4],
        status: statuses[i % 4],
        reason: i % 2 === 0
          ? "Performance DWC insuffisante - Discussion initiale"
          : "Problème récurrent avec les photos de livraison",
        targetCategory: "DWC",
        targetSubcategory: i % 2 === 0 ? "Contact Miss" : "Photo Defect",
        notes: "Action de coaching programmée suite à l'analyse hebdomadaire",
        dwcAtAction: 85 + i * 2,
        dwcAfterAction: statuses[i % 4] === "improved" ? 90 + i * 2 : undefined,
        followUpDate: format(followUpDate, "yyyy-MM-dd"),
        evaluatedAt: statuses[i % 4] !== "pending" ? followUpDate.getTime() : undefined,
        evaluationNotes: statuses[i % 4] === "improved" ? "Amélioration significative constatée" : undefined,
        createdBy: userId,
        createdAt: actionDate.getTime(),
        updatedAt: now,
      })
    }

    // Create some alerts
    const currentWeek = getISOWeek(today)
    const currentYear = getYear(today)

    const poorDrivers = driverIds.filter(d => d.tier === "poor")
    for (const driver of poorDrivers.slice(0, 3)) {
      await ctx.db.insert("alerts", {
        stationId,
        driverId: driver.id as any,
        type: "dwc_critical",
        severity: "critical",
        title: "DWC Critique",
        message: `${driver.name} a un DWC inférieur à 90%`,
        currentValue: 85 + Math.random() * 4,
        threshold: 90,
        year: currentYear,
        week: currentWeek,
        isRead: false,
        isDismissed: false,
        createdAt: now,
      })
    }

    return {
      success: true,
      stationId: stationId,
      stationCode: DEMO_STATION_CODE,
      driversCreated: DEMO_DRIVERS.length,
      weeksOfData: weeksToGenerate,
      coachingActions: coachingTargets.length,
    }
  },
})

/**
 * Internal helper to clear demo data
 */
async function clearDemoDataInternal(ctx: any, stationId: any) {
  // Delete all alerts
  const alerts = await ctx.db
    .query("alerts")
    .withIndex("by_station", (q: any) => q.eq("stationId", stationId))
    .collect()
  for (const alert of alerts) {
    await ctx.db.delete(alert._id)
  }

  // Delete all coaching actions
  const coachingActions = await ctx.db
    .query("coachingActions")
    .withIndex("by_station", (q: any) => q.eq("stationId", stationId))
    .collect()
  for (const action of coachingActions) {
    await ctx.db.delete(action._id)
  }

  // Delete all imports
  const imports = await ctx.db
    .query("imports")
    .withIndex("by_station", (q: any) => q.eq("stationId", stationId))
    .collect()
  for (const imp of imports) {
    await ctx.db.delete(imp._id)
  }

  // Delete all station weekly stats
  const stationStats = await ctx.db
    .query("stationWeeklyStats")
    .withIndex("by_station", (q: any) => q.eq("stationId", stationId))
    .collect()
  for (const stat of stationStats) {
    await ctx.db.delete(stat._id)
  }

  // Get all drivers for this station
  const drivers = await ctx.db
    .query("drivers")
    .withIndex("by_station", (q: any) => q.eq("stationId", stationId))
    .collect()

  for (const driver of drivers) {
    // Delete driver daily stats
    const dailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_driver_date", (q: any) => q.eq("driverId", driver._id))
      .collect()
    for (const stat of dailyStats) {
      await ctx.db.delete(stat._id)
    }

    // Delete driver weekly stats
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_driver", (q: any) => q.eq("driverId", driver._id))
      .collect()
    for (const stat of weeklyStats) {
      await ctx.db.delete(stat._id)
    }

    // Delete driver
    await ctx.db.delete(driver._id)
  }
}

/**
 * Clear all demo data (public mutation)
 */
export const clearDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const station = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", DEMO_STATION_CODE))
      .first()

    if (!station) {
      return { success: false, message: "Demo station not found" }
    }

    await clearDemoDataInternal(ctx, station._id)
    await ctx.db.delete(station._id)

    return { success: true, message: "Demo data cleared" }
  },
})
