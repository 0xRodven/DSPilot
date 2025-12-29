import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Récupère ou crée un driver par son Amazon ID
 */
export const getOrCreateDriver = mutation({
  args: {
    stationId: v.id("stations"),
    amazonId: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Chercher le driver existant
    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_station_amazon", (q) =>
        q.eq("stationId", args.stationId).eq("amazonId", args.amazonId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Créer le driver
    const now = Date.now();
    return await ctx.db.insert("drivers", {
      stationId: args.stationId,
      amazonId: args.amazonId,
      name: args.name || args.amazonId, // Utilise amazonId comme nom par défaut
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Bulk upsert des drivers - retourne un map amazonId -> driverId
 */
export const bulkUpsertDrivers = mutation({
  args: {
    stationId: v.id("stations"),
    amazonIds: v.array(v.string()),
    weekKey: v.optional(v.string()), // "2025-49" pour firstSeenWeek
  },
  handler: async (ctx, args) => {
    const driverMap: Record<string, Id<"drivers">> = {};
    const now = Date.now();

    for (const amazonId of args.amazonIds) {
      // Chercher le driver existant
      const existing = await ctx.db
        .query("drivers")
        .withIndex("by_station_amazon", (q) =>
          q.eq("stationId", args.stationId).eq("amazonId", amazonId)
        )
        .first();

      if (existing) {
        // Mettre à jour le driver existant (le réactiver si inactif)
        if (!existing.isActive) {
          await ctx.db.patch(existing._id, {
            isActive: true,
            updatedAt: now,
          });
        }
        driverMap[amazonId] = existing._id;
      } else {
        // Créer un nouveau driver
        const driverId = await ctx.db.insert("drivers", {
          stationId: args.stationId,
          amazonId,
          name: amazonId, // Sera mis à jour manuellement plus tard
          isActive: true,
          firstSeenWeek: args.weekKey,
          createdAt: now,
          updatedAt: now,
        });
        driverMap[amazonId] = driverId;
      }
    }

    return driverMap;
  },
});

/**
 * Liste les drivers d'une station
 */
export const listDrivers = query({
  args: {
    stationId: v.id("stations"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("drivers")
        .withIndex("by_station_active", (q) =>
          q.eq("stationId", args.stationId).eq("isActive", true)
        )
        .collect();
    }

    return await ctx.db
      .query("drivers")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();
  },
});

/**
 * Met à jour le nom d'un driver
 */
export const updateDriverName = mutation({
  args: {
    driverId: v.id("drivers"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.driverId, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mise à jour en masse des noms de drivers depuis un CSV
 * Retourne le nombre de drivers mis à jour et non trouvés
 */
export const bulkUpdateDriverNames = mutation({
  args: {
    stationId: v.id("stations"),
    mappings: v.array(
      v.object({
        amazonId: v.string(),
        name: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    let notFound = 0;
    const now = Date.now();

    for (const { amazonId, name } of args.mappings) {
      // Chercher le driver par stationId + amazonId (utilise l'index existant)
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_station_amazon", (q) =>
          q.eq("stationId", args.stationId).eq("amazonId", amazonId)
        )
        .first();

      if (driver) {
        // Mettre à jour le nom seulement s'il est différent
        if (driver.name !== name) {
          await ctx.db.patch(driver._id, {
            name,
            updatedAt: now,
          });
          updated++;
        }
      } else {
        notFound++;
      }
    }

    return { updated, notFound, total: args.mappings.length };
  },
});

/**
 * Désactive un driver
 */
export const deactivateDriver = mutation({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.driverId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Récupère un driver par son ID
 */
export const getDriver = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.driverId);
  },
});

/**
 * Compte les drivers par station
 */
export const countDrivers = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("drivers")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    const active = all.filter((d) => d.isActive);

    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
    };
  },
});

/**
 * Récupère les détails complets d'un driver (pour la page detail)
 */
export const getDriverDetail = query({
  args: {
    driverId: v.id("drivers"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Get driver info
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return null;

    // 2. Get current week stats
    const currentWeekStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_driver_week", (q) =>
        q.eq("driverId", args.driverId).eq("year", args.year).eq("week", args.week)
      )
      .first();

    // 3. Get previous week stats for trend
    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;
    const prevWeekStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_driver_week", (q) =>
        q.eq("driverId", args.driverId).eq("year", prevYear).eq("week", prevWeek)
      )
      .first();

    // 4. Get weekly history (last 12 weeks)
    const weeklyHistory = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .order("desc")
      .take(12);

    // 5. Get daily stats for current week
    const dailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_driver_week", (q) =>
        q.eq("driverId", args.driverId).eq("year", args.year).eq("week", args.week)
      )
      .collect();

    // 6. Get all drivers in station for ranking
    const allStationDriverStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", driver.stationId).eq("year", args.year).eq("week", args.week)
      )
      .collect();

    // Calculate DWC% for current week
    let dwcPercent = 0;
    let iadcPercent = 0;
    let totalDeliveries = 0;
    let totalErrors = 0;

    if (currentWeekStats) {
      const dwcTotal = currentWeekStats.dwcCompliant + currentWeekStats.dwcMisses + currentWeekStats.failedAttempts;
      dwcPercent = dwcTotal > 0 ? Math.round((currentWeekStats.dwcCompliant / dwcTotal) * 1000) / 10 : 0;

      const iadcTotal = currentWeekStats.iadcCompliant + currentWeekStats.iadcNonCompliant;
      iadcPercent = iadcTotal > 0 ? Math.round((currentWeekStats.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

      totalDeliveries = dwcTotal;
      totalErrors = currentWeekStats.dwcMisses + currentWeekStats.failedAttempts;
    }

    // Calculate trend
    let trend = 0;
    if (prevWeekStats) {
      const prevDwcTotal = prevWeekStats.dwcCompliant + prevWeekStats.dwcMisses + prevWeekStats.failedAttempts;
      const prevDwcPercent = prevDwcTotal > 0 ? (prevWeekStats.dwcCompliant / prevDwcTotal) * 100 : 0;
      trend = Math.round((dwcPercent - prevDwcPercent) * 10) / 10;
    }

    // Determine tier
    let tier: "fantastic" | "great" | "fair" | "poor";
    if (dwcPercent >= 98.5) tier = "fantastic";
    else if (dwcPercent >= 96) tier = "great";
    else if (dwcPercent >= 90) tier = "fair";
    else tier = "poor";

    // Calculate rank among station drivers
    const driversWithDwc = allStationDriverStats.map((stat) => {
      const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      return {
        driverId: stat.driverId,
        dwcPercent: total > 0 ? (stat.dwcCompliant / total) * 100 : 0,
      };
    });
    driversWithDwc.sort((a, b) => b.dwcPercent - a.dwcPercent);
    const rank = driversWithDwc.findIndex((d) => d.driverId === args.driverId) + 1;

    // Format daily performance
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const dailyPerformance = dailyStats.map((stat) => {
      const date = new Date(stat.date);
      const dayIndex = date.getDay();
      const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      const dailyDwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : null;
      const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
      const dailyIadcPercent = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10 : null;

      let status: "excellent" | "tres-bon" | "bon" | "moyen" | "non-travaille" = "non-travaille";
      if (dailyDwcPercent !== null) {
        if (dailyDwcPercent >= 98.5) status = "excellent";
        else if (dailyDwcPercent >= 96) status = "tres-bon";
        else if (dailyDwcPercent >= 90) status = "bon";
        else status = "moyen";
      }

      return {
        day: dayNames[dayIndex],
        date: stat.date,
        dwcPercent: dailyDwcPercent,
        iadcPercent: dailyIadcPercent,
        deliveries: dwcTotal > 0 ? dwcTotal : null,
        errors: dwcTotal > 0 ? stat.dwcMisses + stat.failedAttempts : null,
        status,
      };
    });

    // Sort by date
    dailyPerformance.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Format error breakdown
    const dwcBreakdown = currentWeekStats?.dwcBreakdown || {
      contactMiss: 0,
      photoDefect: 0,
      noPhoto: 0,
      otpMiss: 0,
      other: 0,
    };
    const iadcBreakdown = currentWeekStats?.iadcBreakdown || {
      mailbox: 0,
      unattended: 0,
      safePlace: 0,
      other: 0,
    };

    const errorBreakdown = {
      dwcMisses: {
        total: dwcBreakdown.contactMiss + dwcBreakdown.photoDefect + dwcBreakdown.noPhoto + dwcBreakdown.otpMiss + dwcBreakdown.other,
        categories: [
          { name: "Contact Miss", count: dwcBreakdown.contactMiss, subcategories: [] },
          { name: "Photo Defect", count: dwcBreakdown.photoDefect, subcategories: [] },
          { name: "No Photo", count: dwcBreakdown.noPhoto, subcategories: [] },
          { name: "OTP Miss", count: dwcBreakdown.otpMiss, subcategories: [] },
          { name: "Other", count: dwcBreakdown.other, subcategories: [] },
        ].filter((c) => c.count > 0),
      },
      iadcNonCompliant: {
        total: iadcBreakdown.mailbox + iadcBreakdown.unattended + iadcBreakdown.safePlace + iadcBreakdown.other,
        categories: [
          { name: "Mailbox", count: iadcBreakdown.mailbox },
          { name: "Unattended", count: iadcBreakdown.unattended },
          { name: "Safe Place", count: iadcBreakdown.safePlace },
          { name: "Other", count: iadcBreakdown.other },
        ].filter((c) => c.count > 0),
      },
    };

    // Format weekly history
    const formattedWeeklyHistory = weeklyHistory.map((stat) => {
      const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      const dwc = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : 0;
      const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
      const iadc = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10 : 0;

      return {
        week: `S${stat.week}`,
        weekNumber: stat.week,
        dwc,
        iadc,
      };
    }).reverse(); // Chronological order

    // Calculate streak (consecutive weeks >= 96%)
    let streak = 0;
    for (const week of weeklyHistory) {
      const total = week.dwcCompliant + week.dwcMisses + week.failedAttempts;
      const pct = total > 0 ? (week.dwcCompliant / total) * 100 : 0;
      if (pct >= 96) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate daysActive from dailyStats (more accurate than stored daysWorked)
    const daysActive = dailyStats.filter((stat) => {
      const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      return total > 0;
    }).length;

    return {
      id: driver._id,
      name: driver.name,
      amazonId: driver.amazonId,
      dwcPercent,
      iadcPercent,
      daysActive,
      tier,
      trend,
      deliveries: totalDeliveries,
      errors: totalErrors,
      activeSince: driver.firstSeenWeek || "Inconnu",
      streak,
      rank,
      totalDrivers: allStationDriverStats.length,
      dailyPerformance,
      errorBreakdown,
      coachingHistory: [], // Will be filled by separate query
      weeklyHistory: formattedWeeklyHistory,
    };
  },
});

/**
 * Récupère l'historique complet d'un driver (indépendant de la semaine globale)
 * Utilisé pour la page détail avec filtre local
 */
export const getDriverWithFullHistory = query({
  args: {
    driverId: v.id("drivers"),
    weeksLimit: v.optional(v.number()), // undefined = 12, 0 = all
    year: v.optional(v.number()),       // Semaine spécifique à afficher
    week: v.optional(v.number()),       // Semaine spécifique à afficher
  },
  handler: async (ctx, args) => {
    // 1. Get driver info
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return null;

    // 2. Get weekly history (limited or full)
    const limit = args.weeksLimit === 0 ? 100 : (args.weeksLimit ?? 12);
    const weeklyHistory = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .order("desc")
      .take(limit);

    if (weeklyHistory.length === 0) {
      // No stats at all - return with defaults
      return {
        id: driver._id,
        name: driver.name,
        amazonId: driver.amazonId,
        dwcPercent: 0,
        iadcPercent: 0,
        daysActive: 0,
        tier: "poor" as const,
        trend: 0,
        deliveries: 0,
        errors: 0,
        activeSince: driver.firstSeenWeek || "Inconnu",
        streak: 0,
        rank: null, // No ranking when no data
        totalDrivers: 0,
        dailyPerformance: [],
        errorBreakdown: {
          dwcMisses: { total: 0, categories: [] },
          iadcNonCompliant: { total: 0, categories: [] },
        },
        coachingHistory: [],
        weeklyHistory: [],
        hasData: false,
        hasDataForSelectedWeek: false, // No data for any week
        latestWeek: null,
        selectedWeek: null,
        totalWeeksInHistory: 0,
      };
    }

    // 3. Determine which week to display
    // If year/week specified, use that; otherwise use most recent
    const latestStats = weeklyHistory[0];
    const latestYear = latestStats.year;
    const latestWeek = latestStats.week;

    // Find the target week stats
    const targetYear = args.year ?? latestYear;
    const targetWeek = args.week ?? latestWeek;

    // Find stats for target week (could be different from latest)
    // IMPORTANT: Do NOT fallback to latestStats if target week doesn't exist
    let targetStats: typeof latestStats | null = null;
    let hasDataForSelectedWeek = true;

    if (args.year !== undefined && args.week !== undefined) {
      // Look for exact week match
      const foundStats = weeklyHistory.find(
        (s) => s.year === args.year && s.week === args.week
      );
      if (foundStats) {
        targetStats = foundStats;
      } else {
        // If not in history, query directly
        const directQuery = await ctx.db
          .query("driverWeeklyStats")
          .withIndex("by_driver_week", (q) =>
            q.eq("driverId", args.driverId).eq("year", targetYear).eq("week", targetWeek)
          )
          .first();
        if (directQuery) {
          targetStats = directQuery;
        } else {
          // No data for this specific week - mark as no data
          hasDataForSelectedWeek = false;
        }
      }
    } else {
      // No specific week requested, use latest
      targetStats = latestStats;
    }

    // 4. Get previous week for trend (relative to target week)
    const targetWeekIndex = weeklyHistory.findIndex(
      (s) => s.year === targetYear && s.week === targetWeek
    );
    const prevStats = targetWeekIndex >= 0 && targetWeekIndex < weeklyHistory.length - 1
      ? weeklyHistory[targetWeekIndex + 1]
      : null;

    // 5. Get daily stats for TARGET week (not necessarily latest)
    const dailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_driver_week", (q) =>
        q.eq("driverId", args.driverId).eq("year", targetYear).eq("week", targetWeek)
      )
      .collect();

    // 6. Get station stats for ranking (for target week)
    const allStationDriverStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", driver.stationId).eq("year", targetYear).eq("week", targetWeek)
      )
      .collect();

    // Calculate DWC% for TARGET week (handle null targetStats)
    let dwcTotal = 0;
    let dwcPercent = 0;
    let iadcTotal = 0;
    let iadcPercent = 0;
    let totalErrors = 0;

    if (targetStats) {
      dwcTotal = targetStats.dwcCompliant + targetStats.dwcMisses + targetStats.failedAttempts;
      dwcPercent = dwcTotal > 0 ? Math.round((targetStats.dwcCompliant / dwcTotal) * 1000) / 10 : 0;
      iadcTotal = targetStats.iadcCompliant + targetStats.iadcNonCompliant;
      iadcPercent = iadcTotal > 0 ? Math.round((targetStats.iadcCompliant / iadcTotal) * 1000) / 10 : 0;
      totalErrors = targetStats.dwcMisses + targetStats.failedAttempts;
    }

    // Calculate DWC trend
    let trend = 0;
    if (targetStats && prevStats) {
      const prevDwcTotal = prevStats.dwcCompliant + prevStats.dwcMisses + prevStats.failedAttempts;
      const prevDwcPercent = prevDwcTotal > 0 ? (prevStats.dwcCompliant / prevDwcTotal) * 100 : 0;
      trend = Math.round((dwcPercent - prevDwcPercent) * 10) / 10;
    }

    // Calculate IADC trend
    let iadcTrend = 0;
    if (targetStats && prevStats) {
      const prevIadcTotal = prevStats.iadcCompliant + prevStats.iadcNonCompliant;
      const prevIadcPercent = prevIadcTotal > 0 ? (prevStats.iadcCompliant / prevIadcTotal) * 100 : 0;
      iadcTrend = Math.round((iadcPercent - prevIadcPercent) * 10) / 10;
    }

    // Calculate deliveries trend (absolute difference)
    let deliveriesTrend = 0;
    if (targetStats && prevStats) {
      const prevDeliveries = prevStats.dwcCompliant + prevStats.dwcMisses + prevStats.failedAttempts;
      deliveriesTrend = dwcTotal - prevDeliveries;
    }

    // Calculate errors trend (absolute difference)
    let errorsTrend = 0;
    if (targetStats && prevStats) {
      const prevErrors = prevStats.dwcMisses + prevStats.failedAttempts;
      errorsTrend = totalErrors - prevErrors;
    }

    // Determine tier
    let tier: "fantastic" | "great" | "fair" | "poor";
    if (dwcPercent >= 98.5) tier = "fantastic";
    else if (dwcPercent >= 96) tier = "great";
    else if (dwcPercent >= 90) tier = "fair";
    else tier = "poor";

    // Calculate rank (returns null if driver not found in week's data)
    const driversWithDwc = allStationDriverStats.map((stat) => {
      const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      return {
        driverId: stat.driverId,
        dwcPercent: total > 0 ? (stat.dwcCompliant / total) * 100 : 0,
      };
    });
    driversWithDwc.sort((a, b) => b.dwcPercent - a.dwcPercent);
    const rankIndex = driversWithDwc.findIndex((d) => d.driverId === args.driverId);
    // Return null if driver not found (instead of 0)
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;

    // Format daily performance
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const dailyPerformance = dailyStats.map((stat) => {
      const date = new Date(stat.date);
      const dayIndex = date.getDay();
      const dTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      const dailyDwcPercent = dTotal > 0 ? Math.round((stat.dwcCompliant / dTotal) * 1000) / 10 : null;
      const iTotal = stat.iadcCompliant + stat.iadcNonCompliant;
      const dailyIadcPercent = iTotal > 0 ? Math.round((stat.iadcCompliant / iTotal) * 1000) / 10 : null;

      let status: "excellent" | "tres-bon" | "bon" | "moyen" | "non-travaille" = "non-travaille";
      if (dailyDwcPercent !== null) {
        if (dailyDwcPercent >= 98.5) status = "excellent";
        else if (dailyDwcPercent >= 96) status = "tres-bon";
        else if (dailyDwcPercent >= 90) status = "bon";
        else status = "moyen";
      }

      return {
        day: dayNames[dayIndex],
        date: stat.date,
        dwcPercent: dailyDwcPercent,
        iadcPercent: dailyIadcPercent,
        deliveries: dTotal > 0 ? dTotal : null,
        errors: dTotal > 0 ? stat.dwcMisses + stat.failedAttempts : null,
        status,
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Error breakdown for TARGET week (handle null targetStats)
    const emptyDwcBreakdown = {
      contactMiss: 0,
      photoDefect: 0,
      noPhoto: 0,
      otpMiss: 0,
      other: 0,
    };
    const emptyIadcBreakdown = {
      mailbox: 0,
      unattended: 0,
      safePlace: 0,
      other: 0,
    };
    const dwcBreakdown = targetStats?.dwcBreakdown || emptyDwcBreakdown;
    const iadcBreakdown = targetStats?.iadcBreakdown || emptyIadcBreakdown;

    const errorBreakdown = {
      dwcMisses: {
        total: dwcBreakdown.contactMiss + dwcBreakdown.photoDefect + dwcBreakdown.noPhoto + dwcBreakdown.otpMiss + dwcBreakdown.other,
        categories: [
          { name: "Contact Miss", count: dwcBreakdown.contactMiss, subcategories: [] },
          { name: "Photo Defect", count: dwcBreakdown.photoDefect, subcategories: [] },
          { name: "No Photo", count: dwcBreakdown.noPhoto, subcategories: [] },
          { name: "OTP Miss", count: dwcBreakdown.otpMiss, subcategories: [] },
          { name: "Other", count: dwcBreakdown.other, subcategories: [] },
        ].filter((c) => c.count > 0),
      },
      iadcNonCompliant: {
        total: iadcBreakdown.mailbox + iadcBreakdown.unattended + iadcBreakdown.safePlace + iadcBreakdown.other,
        categories: [
          { name: "Mailbox", count: iadcBreakdown.mailbox },
          { name: "Unattended", count: iadcBreakdown.unattended },
          { name: "Safe Place", count: iadcBreakdown.safePlace },
          { name: "Other", count: iadcBreakdown.other },
        ].filter((c) => c.count > 0),
      },
    };

    // Format weekly history for chart
    const formattedWeeklyHistory = weeklyHistory.map((stat) => {
      const t = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      const dwc = t > 0 ? Math.round((stat.dwcCompliant / t) * 1000) / 10 : 0;
      const iT = stat.iadcCompliant + stat.iadcNonCompliant;
      const iadc = iT > 0 ? Math.round((stat.iadcCompliant / iT) * 1000) / 10 : 0;

      return {
        week: `S${stat.week}`,
        weekNumber: stat.week,
        year: stat.year,
        dwc,
        iadc,
      };
    }).reverse();

    // Calculate streak
    let streak = 0;
    for (const week of weeklyHistory) {
      const total = week.dwcCompliant + week.dwcMisses + week.failedAttempts;
      const pct = total > 0 ? (week.dwcCompliant / total) * 100 : 0;
      if (pct >= 96) streak++;
      else break;
    }

    // Calculate daysActive from dailyStats (more accurate than stored daysWorked)
    const daysActive = dailyStats.filter((stat) => {
      const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      return total > 0;
    }).length;

    return {
      id: driver._id,
      name: driver.name,
      amazonId: driver.amazonId,
      dwcPercent,
      iadcPercent,
      daysActive,
      tier,
      trend,
      iadcTrend,
      deliveriesTrend,
      errorsTrend,
      deliveries: dwcTotal,
      errors: totalErrors,
      activeSince: driver.firstSeenWeek || "Inconnu",
      streak,
      rank,
      totalDrivers: allStationDriverStats.length,
      dailyPerformance,
      errorBreakdown,
      coachingHistory: [],
      weeklyHistory: formattedWeeklyHistory,
      hasData: true,
      hasDataForSelectedWeek, // New flag to indicate if selected week has data
      latestWeek: { year: latestYear, week: latestWeek },
      selectedWeek: { year: targetYear, week: targetWeek },
      totalWeeksInHistory: weeklyHistory.length,
    };
  },
});

/**
 * Get daily performance data with coaching action markers
 * Used for the daily chart with coaching overlays
 */
export const getDriverDailyPerformanceWithCoaching = query({
  args: {
    driverId: v.id("drivers"),
    startDate: v.string(), // ISO date "2025-12-01"
    endDate: v.string(),   // ISO date "2025-12-31"
  },
  handler: async (ctx, args) => {
    // 1. Get driver info
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return null;

    // 2. Get daily stats within date range
    // Use by_driver_date index (we can query just on driverId prefix)
    const allDailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_driver_date", (q) => q.eq("driverId", args.driverId))
      .collect();

    // Filter to date range
    const dailyStats = allDailyStats.filter((stat) => {
      return stat.date >= args.startDate && stat.date <= args.endDate;
    });

    // 3. Get coaching actions for this driver
    const coachingActions = await ctx.db
      .query("coachingActions")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .collect();

    // 4. Filter coaching actions to those within date range
    const actionsInRange = coachingActions.filter((action) => {
      const actionDate = new Date(action.createdAt).toISOString().split("T")[0];
      return actionDate >= args.startDate && actionDate <= args.endDate;
    });

    // 5. Build a map of date -> coaching action
    const actionsByDate = new Map<string, typeof coachingActions[0]>();
    for (const action of actionsInRange) {
      const actionDate = new Date(action.createdAt).toISOString().split("T")[0];
      // If multiple actions on same day, keep the latest one
      const existing = actionsByDate.get(actionDate);
      if (!existing || action.createdAt > existing.createdAt) {
        actionsByDate.set(actionDate, action);
      }
    }

    // 6. Build daily data with coaching markers
    const dailyData = dailyStats.map((stat) => {
      const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
      const dwcPercent = dwcTotal > 0 ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10 : null;

      const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
      const iadcPercent = iadcTotal > 0 ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10 : null;

      const coachingAction = actionsByDate.get(stat.date);

      return {
        date: stat.date,
        dwcPercent,
        iadcPercent,
        deliveries: dwcTotal,
        errors: stat.dwcMisses + stat.failedAttempts,
        coachingAction: coachingAction
          ? {
              id: coachingAction._id,
              actionType: coachingAction.actionType,
              status: coachingAction.status,
              reason: coachingAction.reason,
              dwcAtAction: coachingAction.dwcAtAction,
              dwcAfterAction: coachingAction.dwcAfterAction,
              followUpDate: coachingAction.followUpDate,
              notes: coachingAction.notes,
              createdAt: coachingAction.createdAt,
            }
          : null,
      };
    });

    // Sort by date ascending
    dailyData.sort((a, b) => a.date.localeCompare(b.date));

    return {
      dailyData,
      coachingActions: actionsInRange.map((action) => ({
        id: action._id,
        actionType: action.actionType,
        status: action.status,
        reason: action.reason,
        dwcAtAction: action.dwcAtAction,
        dwcAfterAction: action.dwcAfterAction,
        followUpDate: action.followUpDate,
        notes: action.notes,
        createdAt: action.createdAt,
      })),
      dateRange: {
        start: args.startDate,
        end: args.endDate,
      },
    };
  },
});

/**
 * Recherche des drivers par nom (partiel accepté)
 * Utilisé par l'agent AI pour trouver un driver
 */
export const searchDriversByName = query({
  args: {
    stationId: v.id("stations"),
    name: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchTerm = args.name.toLowerCase().trim();
    const limit = args.limit || 5;

    // Get all active drivers for station
    const allDrivers = await ctx.db
      .query("drivers")
      .withIndex("by_station_active", (q) =>
        q.eq("stationId", args.stationId).eq("isActive", true)
      )
      .collect();

    // Filter by name (case-insensitive partial match)
    const matches = allDrivers
      .filter((d) => d.name.toLowerCase().includes(searchTerm))
      .slice(0, limit);

    return matches.map((d) => ({
      _id: d._id,
      name: d.name,
      amazonId: d.amazonId,
    }));
  },
});
