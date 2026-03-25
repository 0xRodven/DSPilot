import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  requireWriteAccess,
  canAccessStation,
  checkStationAccess,
} from "./lib/permissions";
import { getTier } from "./lib/tier";
import type { Id } from "./_generated/dataModel";

const tierDistributionValidator = v.object({
  fantastic: v.number(),
  great: v.number(),
  fair: v.number(),
  poor: v.number(),
});

/**
 * Crée un nouvel import (status: pending)
 * Nécessite: accès en écriture à la station
 */
export const createImport = mutation({
  args: {
    stationId: v.id("stations"),
    filename: v.string(),
    year: v.number(),
    week: v.number(),
    importedBy: v.string(), // Clerk user ID
  },
  handler: async (ctx, args) => {
    // Vérifier les permissions d'écriture
    await requireWriteAccess(ctx, args.stationId);

    // Vérifier s'il existe déjà un import pour cette semaine
    const existing = await ctx.db
      .query("imports")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week)
      )
      .first();

    if (existing) {
      // Marquer l'ancien comme écrasé (on le laisse pour historique)
      await ctx.db.patch(existing._id, {
        status: "failed" as const,
        errors: ["Remplacé par un nouvel import"],
      });
    }

    return await ctx.db.insert("imports", {
      stationId: args.stationId,
      filename: args.filename,
      year: args.year,
      week: args.week,
      status: "pending",
      driversImported: 0,
      weeklyRecordsCount: 0,
      importedBy: args.importedBy,
      createdAt: Date.now(),
    });
  },
});

/**
 * Met à jour le status de l'import en "processing"
 */
export const startProcessing = mutation({
  args: {
    importId: v.id("imports"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.importId, {
      status: "processing",
    });
  },
});

/**
 * Complète un import avec succès
 */
export const completeImport = mutation({
  args: {
    importId: v.id("imports"),
    driversImported: v.number(),
    dailyRecordsCount: v.number(),
    weeklyRecordsCount: v.number(),
    newDriversCount: v.number(),
    dwcScore: v.number(),
    iadcScore: v.number(),
    tierDistribution: tierDistributionValidator,
    warnings: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get the import to retrieve stationId, year, week
    const imp = await ctx.db.get(args.importId);
    if (!imp) {
      throw new Error("Import not found");
    }

    const hasWarnings = args.warnings && args.warnings.length > 0;

    await ctx.db.patch(args.importId, {
      status: hasWarnings ? "partial" : "success",
      driversImported: args.driversImported,
      dailyRecordsCount: args.dailyRecordsCount,
      weeklyRecordsCount: args.weeklyRecordsCount,
      newDriversCount: args.newDriversCount,
      dwcScore: args.dwcScore,
      iadcScore: args.iadcScore,
      tierDistribution: args.tierDistribution,
      warnings: args.warnings,
      completedAt: Date.now(),
    });

    // Generate alerts after successful import
    await ctx.scheduler.runAfter(0, internal.alerts.generateAlertsInternal, {
      stationId: imp.stationId,
      year: imp.year,
      week: imp.week,
    });
  },
});

/**
 * Marque un import comme échoué
 */
export const failImport = mutation({
  args: {
    importId: v.id("imports"),
    errors: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.importId, {
      status: "failed",
      errors: args.errors,
      completedAt: Date.now(),
    });
  },
});

/**
 * Liste les imports d'une station
 * Nécessite: accès à la station
 */
export const listImports = query({
  args: {
    stationId: v.id("stations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    return await ctx.db
      .query("imports")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(args.limit || 20);
  },
});

/**
 * Récupère un import par ID
 * Nécessite: accès à la station de l'import
 */
export const getImport = query({
  args: {
    importId: v.id("imports"),
  },
  handler: async (ctx, args) => {
    const imp = await ctx.db.get(args.importId);
    if (!imp) return null;

    // Vérifier l'accès à la station
    const hasAccess = await canAccessStation(ctx, imp.stationId);
    if (!hasAccess) return null;

    return imp;
  },
});

/**
 * Vérifie si un import existe pour une semaine donnée
 * Nécessite: accès à la station
 */
export const checkExistingImport = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null;

    return await ctx.db
      .query("imports")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week)
      )
      .filter((q) => q.neq(q.field("status"), "failed"))
      .first();
  },
});

/**
 * Récupère les stats globales des imports d'une station
 * Nécessite: accès à la station
 */
export const getImportStats = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null;

    const imports = await ctx.db
      .query("imports")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    const successful = imports.filter((i) => i.status === "success" || i.status === "partial");
    const failed = imports.filter((i) => i.status === "failed");

    // Trouver la semaine la plus récente
    const latestImport = successful.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    })[0];

    // Calculer les semaines importées
    const importedWeeks = new Set(successful.map((i) => `${i.year}-${i.week}`));

    return {
      totalImports: imports.length,
      successfulImports: successful.length,
      failedImports: failed.length,
      latestWeek: latestImport ? `${latestImport.year}-${latestImport.week}` : null,
      weeksImported: importedWeeks.size,
    };
  },
});

/**
 * Récupère la couverture des semaines pour une année
 * Nécessite: accès à la station
 */
export const getWeekCoverage = query({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès à la station (sans throw si non authentifié)
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    const imports = await ctx.db
      .query("imports")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .filter((q) => q.eq(q.field("year"), args.year))
      .collect();

    // Build coverage for weeks 1-52
    const coverage: { week: number; year: number; status: "complete" | "partial" | "failed" | "missing" }[] = [];

    for (let week = 1; week <= 52; week++) {
      const imp = imports.find((i) => i.week === week && i.status !== "failed");
      if (imp) {
        coverage.push({
          week,
          year: args.year,
          status: imp.status === "success" ? "complete" : imp.status === "partial" ? "partial" : "failed",
        });
      } else {
        coverage.push({ week, year: args.year, status: "missing" });
      }
    }

    return coverage;
  },
});

/**
 * Supprime un import et toutes les données associées (cascade delete)
 * Nécessite: accès en écriture à la station
 */
export const deleteImport = mutation({
  args: {
    importId: v.id("imports"),
  },
  handler: async (ctx, args) => {
    // 1. Récupérer l'import pour avoir year/week/stationId
    const imp = await ctx.db.get(args.importId);
    if (!imp) {
      throw new Error("Import not found");
    }

    // Vérifier les permissions d'écriture
    await requireWriteAccess(ctx, imp.stationId);

    const { stationId, year, week } = imp;

    // 2. Supprimer tous les driverDailyStats de cette semaine/station
    const dailyStats = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", stationId).eq("year", year).eq("week", week)
      )
      .collect();

    for (const stat of dailyStats) {
      await ctx.db.delete(stat._id);
    }

    // 3. Supprimer tous les driverWeeklyStats de cette semaine/station
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", stationId).eq("year", year).eq("week", week)
      )
      .collect();

    for (const stat of weeklyStats) {
      await ctx.db.delete(stat._id);
    }

    // 4. Supprimer le stationWeeklyStats de cette semaine/station
    const stationStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", stationId).eq("year", year).eq("week", week)
      )
      .first();

    if (stationStats) {
      await ctx.db.delete(stationStats._id);
    }

    // 5. Supprimer l'import lui-même
    await ctx.db.delete(args.importId);

    return {
      deletedDailyStats: dailyStats.length,
      deletedWeeklyStats: weeklyStats.length,
      deletedStationStats: stationStats ? 1 : 0,
    };
  },
});

/**
 * Récupère les données d'un import pour export CSV
 * Nécessite: accès à la station
 */
export const getImportData = query({
  args: {
    importId: v.id("imports"),
  },
  handler: async (ctx, args) => {
    // 1. Récupérer l'import
    const imp = await ctx.db.get(args.importId);
    if (!imp) {
      return null;
    }

    // Vérifier l'accès à la station
    const hasAccess = await canAccessStation(ctx, imp.stationId);
    if (!hasAccess) return null;

    // 2. Récupérer les driverWeeklyStats de cette semaine/station
    const weeklyStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", imp.stationId).eq("year", imp.year).eq("week", imp.week)
      )
      .collect();

    // 3. Récupérer les drivers associés
    const driversData = await Promise.all(
      weeklyStats.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;

        // Calculate DWC and IADC percentages
        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const dwcPercent = dwcTotal > 0
          ? Math.round((stat.dwcCompliant / dwcTotal) * 1000) / 10
          : 0;

        const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
        const iadcPercent = iadcTotal > 0
          ? Math.round((stat.iadcCompliant / iadcTotal) * 1000) / 10
          : 0;

        // Determine tier from the canonical policy
        const tierKey = getTier(dwcPercent);
        const tier = tierKey.charAt(0).toUpperCase() + tierKey.slice(1);

        return {
          name: driver.name,
          amazonId: driver.amazonId,
          dwcPercent,
          iadcPercent,
          daysWorked: stat.daysWorked,
          tier,
          dwcCompliant: stat.dwcCompliant,
          dwcMisses: stat.dwcMisses,
          failedAttempts: stat.failedAttempts,
          iadcCompliant: stat.iadcCompliant,
          iadcNonCompliant: stat.iadcNonCompliant,
        };
      })
    );

    return {
      import: imp,
      drivers: driversData.filter((d) => d !== null),
    };
  },
});
