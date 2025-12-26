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
