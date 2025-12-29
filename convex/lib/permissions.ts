// convex/lib/permissions.ts
// Helpers pour la gestion des permissions RBAC avec Clerk Organizations

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Types de rôles Clerk Organizations
export type OrgRole = "org:admin" | "org:manager" | "org:viewer";

// Type pour les infos utilisateur extraites du JWT
export type UserContext = {
  userId: string;
  orgId: string | null;
  orgRole: OrgRole | null;
};

/**
 * Extrait les informations utilisateur du contexte d'authentification
 * Inclut l'organization ID et le rôle depuis le JWT Clerk
 * @param throwIfUnauthenticated - Si true, throw une erreur si non authentifié
 */
export async function getUserContext(
  ctx: QueryCtx | MutationCtx,
  throwIfUnauthenticated = true
): Promise<UserContext> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    if (throwIfUnauthenticated) {
      throw new Error("Non authentifié");
    }
    return {
      userId: "",
      orgId: null,
      orgRole: null,
    };
  }

  // Clerk envoie org_id et org_role dans le JWT quand l'user est dans une org
  const orgId = (identity as Record<string, unknown>).org_id as string | undefined;
  const orgRole = (identity as Record<string, unknown>).org_role as string | undefined;

  return {
    userId: identity.subject,
    orgId: orgId ?? null,
    orgRole: (orgRole as OrgRole) ?? null,
  };
}

/**
 * Vérifie si l'utilisateur peut accéder à une station spécifique
 * Architecture simplifiée : 1 Org = 1 Station
 * - Tous les membres de l'org ont accès à la station de l'org
 * @param throwIfUnauthenticated - Si false, retourne false au lieu de throw si non authentifié
 */
export async function canAccessStation(
  ctx: QueryCtx | MutationCtx,
  stationId: Id<"stations">,
  throwIfUnauthenticated = false
): Promise<boolean> {
  const { userId, orgId } = await getUserContext(ctx, throwIfUnauthenticated);

  // Si l'utilisateur n'est pas authentifié
  if (!userId) return false;

  const station = await ctx.db.get(stationId);
  if (!station) return false;

  // Mode legacy : pas d'org, vérifier ownership direct
  if (!orgId) {
    return station.ownerId === userId;
  }

  // 1 Org = 1 Station : vérifier que la station appartient à l'org courante
  // Tous les membres de l'org ont automatiquement accès
  return station.organizationId === orgId;
}

/**
 * Vérifie si l'utilisateur peut écrire (importer, créer coaching, etc.)
 * Seuls Owner et Manager peuvent écrire
 */
export async function canWrite(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const { orgRole } = await getUserContext(ctx);

  // Mode legacy sans org : autoriser (backward compat)
  if (!orgRole) return true;

  return orgRole === "org:admin" || orgRole === "org:manager";
}

/**
 * Vérifie si l'utilisateur peut écrire sur une station spécifique
 * Combine canAccessStation + canWrite
 */
export async function canWriteStation(
  ctx: QueryCtx | MutationCtx,
  stationId: Id<"stations">
): Promise<boolean> {
  const hasAccess = await canAccessStation(ctx, stationId);
  if (!hasAccess) return false;

  return await canWrite(ctx);
}

/**
 * Vérifie si l'utilisateur peut inviter un autre utilisateur avec un rôle donné
 * - Owner peut inviter tout le monde
 * - Manager peut inviter seulement des Viewers
 * - Viewer ne peut inviter personne
 */
export async function canInvite(
  ctx: QueryCtx | MutationCtx,
  targetRole: "manager" | "viewer"
): Promise<boolean> {
  const { orgRole } = await getUserContext(ctx);

  if (!orgRole) return false;

  // Owner peut inviter tout le monde
  if (orgRole === "org:admin") return true;

  // Manager peut inviter seulement des viewers
  if (orgRole === "org:manager" && targetRole === "viewer") return true;

  return false;
}

/**
 * Vérifie si l'utilisateur est Owner (org:admin)
 */
export async function isOwner(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const { orgRole } = await getUserContext(ctx);
  return orgRole === "org:admin";
}

/**
 * Récupère toutes les stations accessibles par l'utilisateur
 * Architecture simplifiée : 1 Org = 1 Station
 */
export async function getAccessibleStations(ctx: QueryCtx | MutationCtx) {
  const { userId, orgId } = await getUserContext(ctx);

  // Mode legacy sans org : retourner les stations dont l'user est owner
  if (!orgId) {
    return await ctx.db
      .query("stations")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
  }

  // 1 Org = 1 Station : retourner la station de l'org courante
  // Tous les membres de l'org voient la même station
  return await ctx.db
    .query("stations")
    .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
    .collect();
}

/**
 * Vérifie si l'utilisateur est authentifié et a accès à la station
 * Retourne true si accès autorisé, false sinon (sans throw)
 * Utilisé dans les queries pour retourner des résultats vides si pas d'accès
 */
export async function checkStationAccess(
  ctx: QueryCtx | MutationCtx,
  stationId: Id<"stations">
): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;

  return await canAccessStation(ctx, stationId, false);
}

/**
 * Wrapper pour les queries qui nécessitent un accès à une station
 * Throw une erreur si l'accès est refusé
 * ATTENTION: Préférer checkStationAccess pour les queries et retourner null/empty si pas d'accès
 */
export async function requireStationAccess(
  ctx: QueryCtx | MutationCtx,
  stationId: Id<"stations">
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Non authentifié");
  }

  const hasAccess = await canAccessStation(ctx, stationId, true);
  if (!hasAccess) {
    throw new Error("Accès non autorisé à cette station");
  }
}

/**
 * Wrapper pour les mutations qui nécessitent un accès en écriture à une station
 * Throw une erreur si l'accès est refusé
 */
export async function requireWriteAccess(
  ctx: MutationCtx,
  stationId: Id<"stations">
): Promise<void> {
  const canModify = await canWriteStation(ctx, stationId);
  if (!canModify) {
    throw new Error("Vous n'avez pas les droits pour modifier cette station");
  }
}

/**
 * Wrapper pour les mutations réservées aux Owners
 * Throw une erreur si l'utilisateur n'est pas Owner
 */
export async function requireOwner(ctx: MutationCtx): Promise<void> {
  const owner = await isOwner(ctx);
  if (!owner) {
    throw new Error("Cette action est réservée aux propriétaires");
  }
}
