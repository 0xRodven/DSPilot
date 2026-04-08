import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { canAccessStation, checkStationAccess, requireWriteAccess } from "./lib/permissions";

const levelValidator = v.union(v.literal("first"), v.literal("second"), v.literal("final"));
const statusValidator = v.union(v.literal("active"), v.literal("expired"), v.literal("cancelled"));

/**
 * Returns whether a warning has lapsed based on its expiresAt date.
 * Used to recompute status on read so the UI always shows the right
 * label even if the auto-expire cron hasn't fired yet.
 */
function isExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false;
  return expiresAt < new Date().toISOString().split("T")[0];
}

// ============================================
// QUERIES
// ============================================

/**
 * List all warnings for a station, with their driver info and a
 * recomputed status (active warnings whose expiresAt has lapsed are
 * surfaced as "expired" without needing a write).
 *
 * Filters:
 *  - status: "active" | "expired" | "cancelled" | "all"
 *  - driverId: only warnings for that driver
 *  - level: "first" | "second" | "final"
 */
export const listWarnings = query({
  args: {
    stationId: v.id("stations"),
    status: v.optional(v.union(statusValidator, v.literal("all"))),
    driverId: v.optional(v.id("drivers")),
    level: v.optional(levelValidator),
  },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return [];

    const warnings = await ctx.db
      .query("warnings")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    const enriched = await Promise.all(
      warnings.map(async (w) => {
        const driver = await ctx.db.get(w.driverId);
        if (!driver) return null;

        // Recompute status: active warnings past their expiresAt are
        // shown as expired even if the row hasn't been patched yet.
        const effectiveStatus = w.status === "active" && isExpired(w.expiresAt) ? ("expired" as const) : w.status;

        return {
          id: w._id,
          driverId: w.driverId,
          driverName: driver.name,
          driverAmazonId: driver.amazonId,
          level: w.level,
          reason: w.reason,
          notes: w.notes,
          issuedAt: w.issuedAt,
          issuedBy: w.issuedBy,
          expiresAt: w.expiresAt,
          status: effectiveStatus,
          cancelledAt: w.cancelledAt,
          cancelledBy: w.cancelledBy,
          cancelledReason: w.cancelledReason,
          linkedCoachingActionId: w.linkedCoachingActionId,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        };
      }),
    );

    let result = enriched.filter((w): w is NonNullable<typeof w> => w !== null);

    if (args.status && args.status !== "all") {
      result = result.filter((w) => w.status === args.status);
    }
    if (args.driverId) {
      result = result.filter((w) => w.driverId === args.driverId);
    }
    if (args.level) {
      result = result.filter((w) => w.level === args.level);
    }

    // Most recent first
    result.sort((a, b) => b.issuedAt - a.issuedAt);
    return result;
  },
});

/**
 * Returns the active warnings for a single driver. Used by the driver
 * profile card to display "X active warnings" without loading the full
 * station list.
 */
export const getActiveWarningsForDriver = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return [];

    const hasAccess = await canAccessStation(ctx, driver.stationId);
    if (!hasAccess) return [];

    const warnings = await ctx.db
      .query("warnings")
      .withIndex("by_driver_status", (q) => q.eq("driverId", args.driverId).eq("status", "active"))
      .collect();

    // Filter out lapsed warnings on read
    return warnings
      .filter((w) => !isExpired(w.expiresAt))
      .sort((a, b) => b.issuedAt - a.issuedAt)
      .map((w) => ({
        id: w._id,
        level: w.level,
        reason: w.reason,
        issuedAt: w.issuedAt,
        expiresAt: w.expiresAt,
      }));
  },
});

/**
 * Aggregated counts for the warnings dashboard header.
 */
export const getWarningsStats = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return { total: 0, active: 0, first: 0, second: 0, final: 0 };

    const warnings = await ctx.db
      .query("warnings")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .collect();

    let active = 0;
    let first = 0;
    let second = 0;
    let final = 0;

    for (const w of warnings) {
      const effective = w.status === "active" && isExpired(w.expiresAt) ? "expired" : w.status;
      if (effective !== "active") continue;
      active++;
      if (w.level === "first") first++;
      else if (w.level === "second") second++;
      else if (w.level === "final") final++;
    }

    return { total: warnings.length, active, first, second, final };
  },
});

// ============================================
// MUTATIONS
// ============================================

export const createWarning = mutation({
  args: {
    stationId: v.id("stations"),
    driverId: v.id("drivers"),
    level: levelValidator,
    reason: v.string(),
    notes: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    issuedBy: v.string(),
    linkedCoachingActionId: v.optional(v.id("coachingActions")),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx, args.stationId);

    // Sanity check — driver must belong to the station
    const driver = await ctx.db.get(args.driverId);
    if (!driver || driver.stationId !== args.stationId) {
      throw new Error("Driver does not belong to this station");
    }

    const now = Date.now();
    return await ctx.db.insert("warnings", {
      stationId: args.stationId,
      driverId: args.driverId,
      level: args.level,
      reason: args.reason,
      notes: args.notes,
      expiresAt: args.expiresAt,
      issuedAt: now,
      issuedBy: args.issuedBy,
      status: "active",
      linkedCoachingActionId: args.linkedCoachingActionId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Cancel an active warning. Soft action — keeps the row for audit but
 * sets status to "cancelled" so it stops affecting the escalation
 * pipeline and the active list.
 */
export const cancelWarning = mutation({
  args: {
    warningId: v.id("warnings"),
    cancelledBy: v.string(),
    cancelledReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const warning = await ctx.db.get(args.warningId);
    if (!warning) throw new Error("Warning not found");

    await requireWriteAccess(ctx, warning.stationId);

    const now = Date.now();
    await ctx.db.patch(args.warningId, {
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: args.cancelledBy,
      cancelledReason: args.cancelledReason,
      updatedAt: now,
    });
  },
});
