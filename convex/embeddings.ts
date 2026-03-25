import { v } from "convex/values"
import { action, internalAction, internalQuery } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { getTier } from "./lib/tier"
import { rag } from "./rag"

/**
 * DSPilot Embeddings Indexer
 *
 * Converts structured database records into semantic text for RAG search.
 * Namespace isolation: Each admin (ownerId) has their own namespace.
 */

function calcDwcPercent(compliant: number, misses: number, failed: number): number {
  const total = compliant + misses + failed
  return total > 0 ? (compliant / total) * 100 : 0
}

function calcIadcPercent(compliant: number, nonCompliant: number): number {
  const total = compliant + nonCompliant
  return total > 0 ? (compliant / total) * 100 : 0
}

/**
 * Index a driver's weekly performance as searchable text
 */
export const indexDriverWeeklyPerformance = internalAction({
  args: {
    ownerId: v.string(),
    stationId: v.id("stations"),
    driverId: v.id("drivers"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Fetch driver info
    const driver = await ctx.runQuery(internal.embeddings.getDriver, {
      driverId: args.driverId,
    })
    if (!driver) return { success: false, error: "Driver not found" }

    // Fetch weekly stats
    const stats = await ctx.runQuery(internal.embeddings.getDriverWeeklyStats, {
      driverId: args.driverId,
      year: args.year,
      week: args.week,
    })
    if (!stats) return { success: false, error: "Stats not found" }

    // Calculate metrics
    const dwcPercent = calcDwcPercent(
      stats.dwcCompliant,
      stats.dwcMisses,
      stats.failedAttempts
    )
    const iadcPercent = calcIadcPercent(stats.iadcCompliant, stats.iadcNonCompliant)
    const tier = getTier(dwcPercent)
    const totalDeliveries = stats.dwcCompliant + stats.dwcMisses + stats.failedAttempts

    // Build semantic text
    const text = `
Performance du livreur ${driver.name} - Semaine ${args.week}/${args.year}

Metriques de performance:
- DWC (Delivery with Customer): ${dwcPercent.toFixed(1)}%
- IADC (In Address Delivery Compliance): ${iadcPercent.toFixed(1)}%
- Tier: ${tier.toUpperCase()} ${tier === "fantastic" ? "(Excellent)" : tier === "great" ? "(Tres bien)" : tier === "fair" ? "(Correct)" : "(A ameliorer)"}
- Livraisons totales: ${totalDeliveries}
- Jours travailles: ${stats.daysWorked}

Details DWC:
- Livraisons conformes: ${stats.dwcCompliant}
- Delivery Misses (DNR Risk): ${stats.dwcMisses}
- Tentatives echouees: ${stats.failedAttempts}

Details IADC:
- Conformes: ${stats.iadcCompliant}
- Non conformes: ${stats.iadcNonCompliant}

${
  stats.dwcBreakdown
    ? `
Repartition erreurs DWC:
- Contact Miss: ${stats.dwcBreakdown.contactMiss}
- Photo Defect: ${stats.dwcBreakdown.photoDefect}
- Pas de photo: ${stats.dwcBreakdown.noPhoto}
- OTP Miss: ${stats.dwcBreakdown.otpMiss}
- Autres: ${stats.dwcBreakdown.other}
`
    : ""
}

Statut: ${driver.isActive ? "Actif" : "Inactif"}
Premiere semaine: ${driver.firstSeenWeek || "Inconnu"}
`.trim()

    // Add to RAG
    await rag.add(ctx, {
      namespace: args.ownerId, // Tenant isolation
      key: `driver_${args.driverId}_${args.year}_${args.week}`,
      text,
      title: `${driver.name} - S${args.week}/${args.year}`,
      filterValues: [
        { name: "stationId", value: args.stationId },
        { name: "dataType", value: "driver" },
        { name: "tier", value: tier },
      ],
    })

    return { success: true, tier, dwcPercent }
  },
})

/**
 * Index a coaching action as searchable text
 */
export const indexCoachingAction = internalAction({
  args: {
    ownerId: v.string(),
    coachingId: v.id("coachingActions"),
  },
  handler: async (ctx, args) => {
    // Fetch coaching action
    const coaching = await ctx.runQuery(internal.embeddings.getCoachingAction, {
      coachingId: args.coachingId,
    })
    if (!coaching) return { success: false, error: "Coaching not found" }

    // Fetch driver info
    const driver = await ctx.runQuery(internal.embeddings.getDriver, {
      driverId: coaching.driverId,
    })
    if (!driver) return { success: false, error: "Driver not found" }

    const actionTypeLabels: Record<string, string> = {
      discussion: "Discussion",
      warning: "Avertissement",
      training: "Formation",
      suspension: "Suspension",
    }

    const statusLabels: Record<string, string> = {
      pending: "En attente",
      improved: "Ameliore",
      no_effect: "Sans effet",
      escalated: "Escalade",
    }

    // Build semantic text
    const text = `
Action de coaching pour ${driver.name}

Type d'action: ${actionTypeLabels[coaching.actionType] || coaching.actionType}
Statut: ${statusLabels[coaching.status] || coaching.status}
Date de creation: ${new Date(coaching.createdAt).toLocaleDateString("fr-FR")}

Raison: ${coaching.reason}
${coaching.targetCategory ? `Categorie ciblee: ${coaching.targetCategory}` : ""}
${coaching.targetSubcategory ? `Sous-categorie: ${coaching.targetSubcategory}` : ""}

Metriques:
- DWC au moment de l'action: ${coaching.dwcAtAction.toFixed(1)}%
${coaching.dwcAfterAction !== undefined ? `- DWC apres action: ${coaching.dwcAfterAction.toFixed(1)}%` : ""}

${coaching.notes ? `Notes: ${coaching.notes}` : ""}
${coaching.followUpDate ? `Date de suivi: ${coaching.followUpDate}` : ""}
${coaching.evaluationNotes ? `Notes d'evaluation: ${coaching.evaluationNotes}` : ""}
`.trim()

    // Determine tier from DWC at action
    const tier = getTier(coaching.dwcAtAction)

    // Add to RAG
    await rag.add(ctx, {
      namespace: args.ownerId,
      key: `coaching_${args.coachingId}`,
      text,
      title: `Coaching ${driver.name} - ${actionTypeLabels[coaching.actionType]}`,
      filterValues: [
        { name: "stationId", value: coaching.stationId },
        { name: "dataType", value: "coaching" },
        { name: "tier", value: tier },
      ],
    })

    return { success: true }
  },
})

/**
 * Index all drivers for a station for a given week
 */
export const indexStationWeek = action({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Get station to verify ownership
    const station = await ctx.runQuery(internal.embeddings.getStation, {
      stationId: args.stationId,
    })
    if (!station) throw new Error("Station not found")

    // Get all weekly stats for this station/week
    const weeklyStats = await ctx.runQuery(internal.embeddings.listWeeklyStatsByStation, {
      stationId: args.stationId,
      year: args.year,
      week: args.week,
    })

    let indexed = 0
    for (const stat of weeklyStats) {
      await ctx.runAction(internal.embeddings.indexDriverWeeklyPerformance, {
        ownerId: station.ownerId,
        stationId: args.stationId,
        driverId: stat.driverId,
        year: args.year,
        week: args.week,
      })
      indexed++
    }

    // Index all coaching actions for this station
    const coachingActions = await ctx.runQuery(
      internal.embeddings.listCoachingByStation,
      { stationId: args.stationId }
    )

    let coachingIndexed = 0
    for (const coaching of coachingActions) {
      await ctx.runAction(internal.embeddings.indexCoachingAction, {
        ownerId: station.ownerId,
        coachingId: coaching._id,
      })
      coachingIndexed++
    }

    return {
      driversIndexed: indexed,
      coachingIndexed,
      total: indexed + coachingIndexed,
    }
  },
})

// Internal queries for fetching data

export const getDriver = internalQuery({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.driverId)
  },
})

export const getDriverWeeklyStats = internalQuery({
  args: {
    driverId: v.id("drivers"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_driver_week", (q) =>
        q.eq("driverId", args.driverId).eq("year", args.year).eq("week", args.week)
      )
      .first()
  },
})

export const getCoachingAction = internalQuery({
  args: { coachingId: v.id("coachingActions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.coachingId)
  },
})

export const getStation = internalQuery({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.stationId)
  },
})

export const listWeeklyStatsByStation = internalQuery({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week)
      )
      .collect()
  },
})

export const listCoachingByStation = internalQuery({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachingActions")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect()
  },
})
