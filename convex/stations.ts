import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Récupère ou crée une station par son code
 */
export const getOrCreateStation = mutation({
  args: {
    code: v.string(),
    name: v.optional(v.string()),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Chercher la station existante
    const existing = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) {
      return existing;
    }

    // Créer la station
    const stationId = await ctx.db.insert("stations", {
      code: args.code,
      name: args.name || args.code,
      ownerId: args.ownerId,
      plan: "free",
      createdAt: Date.now(),
    });

    return await ctx.db.get(stationId);
  },
});

/**
 * Liste les stations d'un utilisateur
 */
export const listStations = query({
  args: {
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stations")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

/**
 * Récupère une station par son ID
 */
export const getStation = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.stationId);
  },
});

/**
 * Récupère une station par son code
 */
export const getStationByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});

/**
 * Met à jour une station
 */
export const updateStation = mutation({
  args: {
    stationId: v.id("stations"),
    name: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, string> = {};
    if (args.name) updates.name = args.name;
    if (args.region) updates.region = args.region;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.stationId, updates);
    }

    return await ctx.db.get(args.stationId);
  },
});
