import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getUserContext,
  getAccessibleStations,
  canAccessStation,
  requireWriteAccess,
  requireOwner,
} from "./lib/permissions";
import { slugify } from "./lib/utils";

/**
 * Récupère ou crée une station par son code
 * Owner only pour la création
 */
export const getOrCreateStation = mutation({
  args: {
    code: v.string(),
    name: v.optional(v.string()),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, orgId } = await getUserContext(ctx);

    // Chercher la station existante
    const existing = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) {
      // Vérifier l'accès à la station existante
      const hasAccess = await canAccessStation(ctx, existing._id);
      if (!hasAccess) {
        throw new Error("Cette station existe mais vous n'y avez pas accès");
      }
      return existing;
    }

    // Créer la station (avec organizationId si disponible)
    const stationId = await ctx.db.insert("stations", {
      code: args.code,
      name: args.name || args.code,
      organizationId: orgId ?? undefined,
      ownerId: args.ownerId || userId,
      plan: "free",
      createdAt: Date.now(),
    });

    return await ctx.db.get(stationId);
  },
});

/**
 * Crée une nouvelle station (Owner only)
 */
export const createStation = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const { userId, orgId } = await getUserContext(ctx);

    // Vérifier l'unicité du code
    const existing = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) {
      throw new Error("Ce code de station existe déjà");
    }

    const stationId = await ctx.db.insert("stations", {
      code: args.code,
      name: args.name,
      region: args.region,
      organizationId: orgId ?? undefined,
      ownerId: userId,
      plan: "free",
      createdAt: Date.now(),
    });

    return await ctx.db.get(stationId);
  },
});

/**
 * Liste les stations d'un utilisateur (legacy - avec ownerId explicite)
 * @deprecated Utiliser listUserStations à la place
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
 * Liste les stations accessibles par l'utilisateur connecté
 * @deprecated Utiliser getStationForCurrentOrg() - 1 org = 1 station
 */
export const listUserStations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await getAccessibleStations(ctx);
  },
});

/**
 * Récupère LA station de l'organisation courante
 * Architecture 1 Org = 1 Station
 * Retourne null si pas d'org ou pas de station
 */
export const getStationForCurrentOrg = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const { orgId } = await getUserContext(ctx, false);

    // Pas d'org sélectionnée
    if (!orgId) return null;

    // Chercher la station de cette org
    const station = await ctx.db
      .query("stations")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .first();

    return station;
  },
});

/**
 * Récupère ou crée la station de l'organisation courante
 * Architecture 1 Org = 1 Station
 * - Si station existe pour l'org → la retourne
 * - Si pas de station → en crée une avec le nom de l'org
 */
export const getOrCreateStationForCurrentOrg = mutation({
  args: {
    orgName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, orgId } = await getUserContext(ctx);

    if (!orgId) {
      throw new Error("Vous devez être dans une organisation pour importer des données");
    }

    // Chercher station existante pour cette org
    let station = await ctx.db
      .query("stations")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .first();

    // Si station existe, la retourner
    if (station) {
      return station;
    }

    // Créer une nouvelle station pour cette org
    const stationName = args.orgName || `Station ${orgId.substring(4, 12)}`;
    // Code = nom de l'org slugifié, ou fallback sur l'ancien format
    const stationCode = args.orgName
      ? slugify(args.orgName)
      : orgId.substring(4, 14).toUpperCase().replace(/[^A-Z0-9]/g, "");

    const stationId = await ctx.db.insert("stations", {
      code: stationCode,
      name: stationName,
      organizationId: orgId,
      ownerId: userId,
      plan: "free",
      createdAt: Date.now(),
    });

    station = await ctx.db.get(stationId);
    return station;
  },
});

/**
 * Récupère une station par son ID (avec vérification d'accès)
 */
export const getStation = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const station = await ctx.db.get(args.stationId);
    if (!station) return null;

    // Vérifier l'accès (optionnel - pour certaines queries publiques)
    // Pour une vérification stricte, décommenter :
    // const hasAccess = await canAccessStation(ctx, args.stationId);
    // if (!hasAccess) return null;

    return station;
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
    const station = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!station) return null;

    // Vérifier l'accès
    const hasAccess = await canAccessStation(ctx, station._id);
    if (!hasAccess) return null;

    return station;
  },
});

/**
 * Met à jour une station (avec vérification d'accès en écriture)
 */
export const updateStation = mutation({
  args: {
    stationId: v.id("stations"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Vérifier l'accès en écriture
    await requireWriteAccess(ctx, args.stationId);

    const station = await ctx.db.get(args.stationId);
    if (!station) {
      throw new Error("Station non trouvée");
    }

    // Si le code change, vérifier l'unicité
    if (args.code && args.code !== station.code) {
      const newCode = args.code;
      const existing = await ctx.db
        .query("stations")
        .withIndex("by_code", (q) => q.eq("code", newCode))
        .first();
      if (existing) {
        throw new Error("Ce code de station existe déjà");
      }
    }

    // Construire les mises à jour
    const updates: Record<string, string> = {};
    if (args.name) updates.name = args.name;
    if (args.code) updates.code = args.code;
    if (args.region) updates.region = args.region;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.stationId, updates);
    }

    return await ctx.db.get(args.stationId);
  },
});

/**
 * Supprime une station (Owner only)
 */
export const deleteStation = mutation({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);

    const station = await ctx.db.get(args.stationId);
    if (!station) {
      throw new Error("Station non trouvée");
    }

    // Vérifier que la station appartient à l'org de l'utilisateur
    const hasAccess = await canAccessStation(ctx, args.stationId);
    if (!hasAccess) {
      throw new Error("Accès non autorisé");
    }

    // Supprimer les accès associés
    const accesses = await ctx.db
      .query("stationAccess")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    for (const access of accesses) {
      await ctx.db.delete(access._id);
    }

    // Supprimer la station
    await ctx.db.delete(args.stationId);

    return { success: true };
  },
});

// ============================================================================
// GESTION DES ACCÈS (stationAccess) - DÉPRÉCIÉ
// ============================================================================
// NOTE: Avec l'architecture 1 Org = 1 Station, ces fonctions ne sont plus utilisées.
// Les membres sont invités via Clerk et ont automatiquement accès à la station de l'org.
// Ces fonctions sont gardées temporairement pour compatibilité.

/**
 * @deprecated Plus nécessaire avec 1 Org = 1 Station. Utiliser Clerk pour inviter des membres.
 */
export const grantStationAccess = mutation({
  args: {
    stationId: v.id("stations"),
    userId: v.string(),
    role: v.union(v.literal("manager"), v.literal("viewer")),
  },
  handler: async () => {
    throw new Error(
      "Cette fonction est dépréciée. Utilisez Clerk pour inviter des membres à l'organisation."
    );
  },
});

/**
 * @deprecated Plus nécessaire avec 1 Org = 1 Station. Utiliser Clerk pour retirer des membres.
 */
export const revokeStationAccess = mutation({
  args: {
    stationId: v.id("stations"),
    userId: v.string(),
  },
  handler: async () => {
    throw new Error(
      "Cette fonction est dépréciée. Utilisez Clerk pour retirer des membres de l'organisation."
    );
  },
});

/**
 * @deprecated Plus nécessaire avec 1 Org = 1 Station.
 */
export const listStationAccess = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async () => {
    // Retourne tableau vide - les membres sont gérés par Clerk
    return [];
  },
});

/**
 * @deprecated Plus nécessaire avec 1 Org = 1 Station.
 */
export const listAllStationAccess = query({
  args: {},
  handler: async () => {
    // Retourne tableau vide - les membres sont gérés par Clerk
    return [];
  },
});

// ============================================================================
// MIGRATION
// ============================================================================

/**
 * Force la réassignation d'une station à l'organisation courante
 * Utilisé quand une station est "coincée" dans une mauvaise org
 * Seul le owner original peut faire cette opération
 */
export const forceReassignStationToCurrentOrg = mutation({
  args: {
    stationCode: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, orgId, orgRole } = await getUserContext(ctx);

    if (!orgId) {
      throw new Error("Vous devez être dans une organisation");
    }

    if (orgRole !== "org:admin") {
      throw new Error("Seul le Owner (org:admin) peut réassigner une station");
    }

    // Trouver la station par code
    const station = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.stationCode))
      .first();

    if (!station) {
      throw new Error(`Station "${args.stationCode}" non trouvée`);
    }

    // Vérifier que l'utilisateur est le owner original
    if (station.ownerId !== userId) {
      throw new Error("Vous n'êtes pas le propriétaire original de cette station");
    }

    // Réassigner à l'org courante
    await ctx.db.patch(station._id, {
      organizationId: orgId,
    });

    return {
      success: true,
      station: station.name,
      newOrgId: orgId,
    };
  },
});

/**
 * Migration: Lie les stations existantes de l'utilisateur à son organisation
 * - Trouve les stations dont l'utilisateur est owner ET qui n'ont pas d'organizationId
 * - Les associe à l'organisation courante de l'utilisateur
 */
export const migrateStationsToOrganization = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId, orgId, orgRole } = await getUserContext(ctx);

    if (!orgId) {
      throw new Error("Vous devez être dans une organisation pour migrer les stations");
    }

    if (orgRole !== "org:admin") {
      throw new Error("Seul le Owner (org:admin) peut migrer les stations");
    }

    // Trouver toutes les stations dont l'utilisateur est owner et sans organizationId
    const stationsToMigrate = await ctx.db
      .query("stations")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const migrated: string[] = [];
    const skipped: string[] = [];

    for (const station of stationsToMigrate) {
      if (!station.organizationId) {
        // Migrer vers l'organisation courante
        await ctx.db.patch(station._id, {
          organizationId: orgId,
        });
        migrated.push(`${station.name} (${station.code})`);
      } else if (station.organizationId === orgId) {
        skipped.push(`${station.name} (${station.code}) - déjà dans cette org`);
      } else {
        skipped.push(`${station.name} (${station.code}) - appartient à une autre org`);
      }
    }

    return {
      migrated,
      skipped,
      totalMigrated: migrated.length,
      totalSkipped: skipped.length,
    };
  },
});

/**
 * Migration: Met à jour les codes stations pour utiliser le format slugifié
 * Les stations avec un code cryptique (sans tiret) seront mises à jour
 * pour utiliser le nom slugifié
 */
export const migrateStationCodes = mutation({
  args: {},
  handler: async (ctx) => {
    // Pas de vérification d'auth - mutation de migration one-shot
    // À supprimer après utilisation
    const stations = await ctx.db.query("stations").collect();

    const migrated: string[] = [];
    const skipped: string[] = [];

    for (const station of stations) {
      // Si le code ne contient pas de tiret et qu'on a un name valide
      // alors c'est probablement un ancien code cryptique
      if (station.name && !station.code.includes("-")) {
        const newCode = slugify(station.name);

        // Vérifier que le nouveau code n'existe pas déjà
        const existing = await ctx.db
          .query("stations")
          .withIndex("by_code", (q) => q.eq("code", newCode))
          .first();

        if (!existing || existing._id === station._id) {
          await ctx.db.patch(station._id, { code: newCode });
          migrated.push(`${station.name}: ${station.code} → ${newCode}`);
        } else {
          skipped.push(`${station.name}: code "${newCode}" déjà utilisé`);
        }
      } else {
        skipped.push(`${station.name}: déjà au bon format (${station.code})`);
      }
    }

    return {
      migrated,
      skipped,
      totalMigrated: migrated.length,
      totalSkipped: skipped.length,
    };
  },
});

// DEBUG: Vérifier l'état des données avec contexte auth
export const debugDataWithAuth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = identity ? (identity as Record<string, unknown>).org_id as string | undefined : null;

    // Toutes les stations
    const allStations = await ctx.db.query("stations").collect();

    // Station trouvée par organizationId
    const stationByOrg = orgId
      ? await ctx.db.query("stations")
          .withIndex("by_organization", q => q.eq("organizationId", orgId))
          .first()
      : null;

    // Tous les drivers
    const allDrivers = await ctx.db.query("drivers").collect();

    // Drivers par station
    const driversByStation: Record<string, number> = {};
    for (const d of allDrivers) {
      const key = d.stationId as string;
      driversByStation[key] = (driversByStation[key] || 0) + 1;
    }

    return {
      clerkOrgId: orgId || "PAS CONNECTÉ À UNE ORG",
      allStations: allStations.map(s => ({
        _id: s._id,
        name: s.name,
        code: s.code,
        organizationId: s.organizationId || "MISSING!",
        matchesClerkOrg: s.organizationId === orgId,
      })),
      stationFoundByOrgId: stationByOrg ? {
        _id: stationByOrg._id,
        name: stationByOrg.name,
      } : "AUCUNE STATION TROUVÉE POUR CETTE ORG",
      totalDrivers: allDrivers.length,
      activeDrivers: allDrivers.filter(d => d.isActive).length,
      driversByStation,
    };
  },
});
