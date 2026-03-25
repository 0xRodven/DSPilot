import { v } from "convex/values"
import { mutation, query, internalMutation } from "./_generated/server"
import { checkStationAccess, requireWriteAccess } from "./lib/permissions"
import { getTier } from "./lib/tier"

// Alert type definitions
export type AlertType =
  | "dwc_drop"
  | "dwc_critical"
  | "coaching_pending"
  | "new_driver"
  | "tier_downgrade"

export type AlertSeverity = "warning" | "critical"

// ============================================
// QUERIES
// ============================================

/**
 * Get all unread alerts for a station
 */
export const getUnreadAlerts = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, { stationId }) => {
    const hasAccess = await checkStationAccess(ctx, stationId)
    if (!hasAccess) return []

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_station_unread", (q) =>
        q.eq("stationId", stationId).eq("isRead", false)
      )
      .filter((q) => q.eq(q.field("isDismissed"), false))
      .order("desc")
      .take(50)

    // Enrich with driver info
    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert) => {
        let driverName = null
        if (alert.driverId) {
          const driver = await ctx.db.get(alert.driverId)
          driverName = driver?.name || null
        }
        return { ...alert, driverName }
      })
    )

    return enrichedAlerts
  },
})

/**
 * Get alert count for a station (for badge display)
 */
export const getAlertCount = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, { stationId }) => {
    const hasAccess = await checkStationAccess(ctx, stationId)
    if (!hasAccess) return 0

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_station_unread", (q) =>
        q.eq("stationId", stationId).eq("isRead", false)
      )
      .filter((q) => q.eq(q.field("isDismissed"), false))
      .collect()

    return alerts.length
  },
})

/**
 * Get all alerts for a station (including read/dismissed)
 */
export const getAllAlerts = query({
  args: {
    stationId: v.id("stations"),
    year: v.optional(v.number()),
    week: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { stationId, year, week, limit }) => {
    const hasAccess = await checkStationAccess(ctx, stationId)
    if (!hasAccess) return []

    let alertsQuery = ctx.db
      .query("alerts")
      .withIndex("by_station", (q) => q.eq("stationId", stationId))

    if (year !== undefined && week !== undefined) {
      alertsQuery = ctx.db
        .query("alerts")
        .withIndex("by_station_week", (q) =>
          q.eq("stationId", stationId).eq("year", year).eq("week", week)
        )
    }

    const alerts = await alertsQuery.order("desc").take(limit || 100)

    // Enrich with driver info
    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert) => {
        let driverName = null
        if (alert.driverId) {
          const driver = await ctx.db.get(alert.driverId)
          driverName = driver?.name || null
        }
        return { ...alert, driverName }
      })
    )

    return enrichedAlerts
  },
})

// ============================================
// MUTATIONS
// ============================================

/**
 * Mark an alert as read
 */
export const markAsRead = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.db.get(alertId)
    if (!alert) return false

    await requireWriteAccess(ctx, alert.stationId)

    await ctx.db.patch(alertId, { isRead: true })
    return true
  },
})

/**
 * Mark all alerts as read for a station
 */
export const markAllAsRead = mutation({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, { stationId }) => {
    await requireWriteAccess(ctx, stationId)

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_station_unread", (q) =>
        q.eq("stationId", stationId).eq("isRead", false)
      )
      .collect()

    for (const alert of alerts) {
      await ctx.db.patch(alert._id, { isRead: true })
    }

    return alerts.length
  },
})

/**
 * Dismiss an alert
 */
export const dismissAlert = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.db.get(alertId)
    if (!alert) return false

    await requireWriteAccess(ctx, alert.stationId)

    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject || "system"

    await ctx.db.patch(alertId, {
      isDismissed: true,
      dismissedBy: userId,
      dismissedAt: Date.now(),
    })
    return true
  },
})

/**
 * Generate alerts for a station based on current data
 * This should be called after importing new data
 */
export const generateAlerts = mutation({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, { stationId, year, week }) => {
    await requireWriteAccess(ctx, stationId)

    const now = Date.now()
    let alertsCreated = 0

    // Calculate previous week
    const prevWeek = week === 1 ? 52 : week - 1
    const prevYear = week === 1 ? year - 1 : year

    // Get current week stats for all drivers
    const currentStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", stationId).eq("year", year).eq("week", week)
      )
      .collect()

    // Get previous week stats
    const prevStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", stationId).eq("year", prevYear).eq("week", prevWeek)
      )
      .collect()

    // Create map for quick lookup
    const prevStatsMap = new Map(
      prevStats.map((s) => [s.driverId.toString(), s])
    )

    // Check each driver
    for (const stat of currentStats) {
      const driver = await ctx.db.get(stat.driverId)
      if (!driver) continue

      const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts
      const dwcPercent =
        dwcTotal > 0
          ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10
          : 0

      // Check for existing alerts this week for this driver to avoid duplicates
      const existingAlerts = await ctx.db
        .query("alerts")
        .withIndex("by_station_week", (q) =>
          q.eq("stationId", stationId).eq("year", year).eq("week", week)
        )
        .filter((q) => q.eq(q.field("driverId"), stat.driverId))
        .collect()

      const existingTypes = new Set(existingAlerts.map((a) => a.type))

      // 1. DWC Critical (under 90%)
      if (dwcPercent < 90 && !existingTypes.has("dwc_critical")) {
        await ctx.db.insert("alerts", {
          stationId,
          driverId: stat.driverId,
          type: "dwc_critical",
          severity: "critical",
          title: "DWC Critique",
          message: `${driver.name} a un DWC de ${dwcPercent}% (< 90%)`,
          currentValue: dwcPercent,
          threshold: 90,
          year,
          week,
          isRead: false,
          isDismissed: false,
          createdAt: now,
        })
        alertsCreated++
      }

      // 2. DWC Drop (> 5% from previous week)
      const prevStat = prevStatsMap.get(stat.driverId.toString())
      if (prevStat && !existingTypes.has("dwc_drop")) {
        const prevDwcTotal =
          prevStat.dwcCompliant + prevStat.dwcMisses + prevStat.failedAttempts
        const prevDwcPercent =
          prevDwcTotal > 0
            ? Math.round((prevStat.dwcCompliant / prevDwcTotal) * 1000) / 10
            : 0
        const drop = prevDwcPercent - dwcPercent

        if (drop > 5) {
          await ctx.db.insert("alerts", {
            stationId,
            driverId: stat.driverId,
            type: "dwc_drop",
            severity: drop > 10 ? "critical" : "warning",
            title: "Chute DWC",
            message: `${driver.name} a chuté de ${drop.toFixed(1)}% (${prevDwcPercent}% → ${dwcPercent}%)`,
            currentValue: dwcPercent,
            previousValue: prevDwcPercent,
            threshold: 5,
            year,
            week,
            isRead: false,
            isDismissed: false,
            createdAt: now,
          })
          alertsCreated++
        }
      }

      // 3. Tier downgrade
      if (prevStat && !existingTypes.has("tier_downgrade")) {
        const prevDwcTotal =
          prevStat.dwcCompliant + prevStat.dwcMisses + prevStat.failedAttempts
        const prevDwcPercent =
          prevDwcTotal > 0
            ? Math.round((prevStat.dwcCompliant / prevDwcTotal) * 1000) / 10
            : 0

        const currentTier = getTier(dwcPercent)
        const prevTier = getTier(prevDwcPercent)

        const tierOrder = ["fantastic", "great", "fair", "poor"]
        if (tierOrder.indexOf(currentTier) > tierOrder.indexOf(prevTier)) {
          await ctx.db.insert("alerts", {
            stationId,
            driverId: stat.driverId,
            type: "tier_downgrade",
            severity: currentTier === "poor" ? "critical" : "warning",
            title: "Rétrogradation Tier",
            message: `${driver.name} est passé de ${prevTier} à ${currentTier}`,
            currentValue: dwcPercent,
            previousValue: prevDwcPercent,
            year,
            week,
            isRead: false,
            isDismissed: false,
            createdAt: now,
          })
          alertsCreated++
        }
      }

      // 4. New driver (first week with data)
      if (!prevStat && !existingTypes.has("new_driver")) {
        await ctx.db.insert("alerts", {
          stationId,
          driverId: stat.driverId,
          type: "new_driver",
          severity: "warning",
          title: "Nouveau Livreur",
          message: `${driver.name} effectue sa première semaine (DWC: ${dwcPercent}%)`,
          currentValue: dwcPercent,
          year,
          week,
          isRead: false,
          isDismissed: false,
          createdAt: now,
        })
        alertsCreated++
      }
    }

    // 5. Coaching pending > 14 days
    const pendingCoaching = await ctx.db
      .query("coachingActions")
      .withIndex("by_station_status", (q) =>
        q.eq("stationId", stationId).eq("status", "pending")
      )
      .collect()

    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000

    for (const coaching of pendingCoaching) {
      if (coaching.createdAt < fourteenDaysAgo) {
        const driver = await ctx.db.get(coaching.driverId)
        if (!driver) continue

        // Check for existing coaching_pending alert
        const existingAlert = await ctx.db
          .query("alerts")
          .withIndex("by_station_week", (q) =>
            q.eq("stationId", stationId).eq("year", year).eq("week", week)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("driverId"), coaching.driverId),
              q.eq(q.field("type"), "coaching_pending")
            )
          )
          .first()

        if (!existingAlert) {
          const daysPending = Math.floor(
            (now - coaching.createdAt) / (24 * 60 * 60 * 1000)
          )
          await ctx.db.insert("alerts", {
            stationId,
            driverId: coaching.driverId,
            type: "coaching_pending",
            severity: daysPending > 21 ? "critical" : "warning",
            title: "Coaching en Attente",
            message: `Action coaching pour ${driver.name} en attente depuis ${daysPending} jours`,
            currentValue: daysPending,
            threshold: 14,
            year,
            week,
            isRead: false,
            isDismissed: false,
            createdAt: now,
          })
          alertsCreated++
        }
      }
    }

    return { alertsCreated }
  },
})

/**
 * Internal version of generateAlerts for scheduler calls
 * Called automatically after imports complete
 */
export const generateAlertsInternal = internalMutation({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, { stationId, year, week }) => {
    const now = Date.now()
    let alertsCreated = 0

    // Calculate previous week
    const prevWeek = week === 1 ? 52 : week - 1
    const prevYear = week === 1 ? year - 1 : year

    // Get current week stats for all drivers
    const currentStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", stationId).eq("year", year).eq("week", week)
      )
      .collect()

    // Get previous week stats
    const prevStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", stationId).eq("year", prevYear).eq("week", prevWeek)
      )
      .collect()

    // Create map for quick lookup
    const prevStatsMap = new Map(
      prevStats.map((s) => [s.driverId.toString(), s])
    )

    // Check each driver
    for (const stat of currentStats) {
      const driver = await ctx.db.get(stat.driverId)
      if (!driver) continue

      const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts
      const dwcPercent =
        dwcTotal > 0
          ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10
          : 0

      // Check for existing alerts this week for this driver to avoid duplicates
      const existingAlerts = await ctx.db
        .query("alerts")
        .withIndex("by_station_week", (q) =>
          q.eq("stationId", stationId).eq("year", year).eq("week", week)
        )
        .filter((q) => q.eq(q.field("driverId"), stat.driverId))
        .collect()

      const existingTypes = new Set(existingAlerts.map((a) => a.type))

      // 1. DWC Critical (under 90%)
      if (dwcPercent < 90 && !existingTypes.has("dwc_critical")) {
        await ctx.db.insert("alerts", {
          stationId,
          driverId: stat.driverId,
          type: "dwc_critical",
          severity: "critical",
          title: "DWC Critique",
          message: `${driver.name} a un DWC de ${dwcPercent}% (< 90%)`,
          currentValue: dwcPercent,
          threshold: 90,
          year,
          week,
          isRead: false,
          isDismissed: false,
          createdAt: now,
        })
        alertsCreated++
      }

      // 2. DWC Drop (> 5% from previous week)
      const prevStat = prevStatsMap.get(stat.driverId.toString())
      if (prevStat && !existingTypes.has("dwc_drop")) {
        const prevDwcTotal =
          prevStat.dwcCompliant + prevStat.dwcMisses + prevStat.failedAttempts
        const prevDwcPercent =
          prevDwcTotal > 0
            ? Math.round((prevStat.dwcCompliant / prevDwcTotal) * 1000) / 10
            : 0
        const drop = prevDwcPercent - dwcPercent

        if (drop > 5) {
          await ctx.db.insert("alerts", {
            stationId,
            driverId: stat.driverId,
            type: "dwc_drop",
            severity: drop > 10 ? "critical" : "warning",
            title: "Chute DWC",
            message: `${driver.name} a chuté de ${drop.toFixed(1)}% (${prevDwcPercent}% → ${dwcPercent}%)`,
            currentValue: dwcPercent,
            previousValue: prevDwcPercent,
            threshold: 5,
            year,
            week,
            isRead: false,
            isDismissed: false,
            createdAt: now,
          })
          alertsCreated++
        }
      }

      // 3. Tier downgrade
      if (prevStat && !existingTypes.has("tier_downgrade")) {
        const prevDwcTotal =
          prevStat.dwcCompliant + prevStat.dwcMisses + prevStat.failedAttempts
        const prevDwcPercent =
          prevDwcTotal > 0
            ? Math.round((prevStat.dwcCompliant / prevDwcTotal) * 1000) / 10
            : 0

        const currentTier = getTier(dwcPercent)
        const prevTier = getTier(prevDwcPercent)

        const tierOrder = ["fantastic", "great", "fair", "poor"]
        if (tierOrder.indexOf(currentTier) > tierOrder.indexOf(prevTier)) {
          await ctx.db.insert("alerts", {
            stationId,
            driverId: stat.driverId,
            type: "tier_downgrade",
            severity: currentTier === "poor" ? "critical" : "warning",
            title: "Rétrogradation Tier",
            message: `${driver.name} est passé de ${prevTier} à ${currentTier}`,
            currentValue: dwcPercent,
            previousValue: prevDwcPercent,
            year,
            week,
            isRead: false,
            isDismissed: false,
            createdAt: now,
          })
          alertsCreated++
        }
      }

      // 4. New driver (first week with data)
      if (!prevStat && !existingTypes.has("new_driver")) {
        await ctx.db.insert("alerts", {
          stationId,
          driverId: stat.driverId,
          type: "new_driver",
          severity: "warning",
          title: "Nouveau Livreur",
          message: `${driver.name} effectue sa première semaine (DWC: ${dwcPercent}%)`,
          currentValue: dwcPercent,
          year,
          week,
          isRead: false,
          isDismissed: false,
          createdAt: now,
        })
        alertsCreated++
      }
    }

    // 5. Coaching pending > 14 days
    const pendingCoaching = await ctx.db
      .query("coachingActions")
      .withIndex("by_station_status", (q) =>
        q.eq("stationId", stationId).eq("status", "pending")
      )
      .collect()

    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000

    for (const coaching of pendingCoaching) {
      if (coaching.createdAt < fourteenDaysAgo) {
        const driver = await ctx.db.get(coaching.driverId)
        if (!driver) continue

        // Check for existing coaching_pending alert
        const existingAlert = await ctx.db
          .query("alerts")
          .withIndex("by_station_week", (q) =>
            q.eq("stationId", stationId).eq("year", year).eq("week", week)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("driverId"), coaching.driverId),
              q.eq(q.field("type"), "coaching_pending")
            )
          )
          .first()

        if (!existingAlert) {
          const daysPending = Math.floor(
            (now - coaching.createdAt) / (24 * 60 * 60 * 1000)
          )
          await ctx.db.insert("alerts", {
            stationId,
            driverId: coaching.driverId,
            type: "coaching_pending",
            severity: daysPending > 21 ? "critical" : "warning",
            title: "Coaching en Attente",
            message: `Action coaching pour ${driver.name} en attente depuis ${daysPending} jours`,
            currentValue: daysPending,
            threshold: 14,
            year,
            week,
            isRead: false,
            isDismissed: false,
            createdAt: now,
          })
          alertsCreated++
        }
      }
    }

    return { alertsCreated }
  },
})
