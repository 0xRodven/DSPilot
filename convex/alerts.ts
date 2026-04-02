import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx, mutation, query } from "./_generated/server";
import {
  qualifyCoachingPendingAlert,
  qualifyDwcBelowTargetAlert,
  qualifyDwcDropAlert,
  qualifyNewDriverAlert,
} from "./lib/automationPolicy";
import { checkStationAccess, requireWriteAccess } from "./lib/permissions";

// Includes legacy types for backward compatibility with existing data
export type AlertType =
  | "dwc_drop"
  | "dwc_below_target"
  | "dwc_critical" // legacy
  | "coaching_pending"
  | "new_driver"
  | "tier_downgrade"; // legacy

export type AlertSeverity = "warning" | "critical";

type GeneratedAlertSummary = {
  severity: "info" | "warning" | "critical";
  title: string;
  summary: string;
  targetPath?: string;
};

export const getUnreadAlerts = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, { stationId }) => {
    const hasAccess = await checkStationAccess(ctx, stationId);
    if (!hasAccess) return [];

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_station_unread", (q) => q.eq("stationId", stationId).eq("isRead", false))
      .filter((q) => q.eq(q.field("isDismissed"), false))
      .order("desc")
      .take(50);

    return await Promise.all(
      alerts.map(async (alert) => {
        const driverName = alert.driverId ? (await ctx.db.get(alert.driverId))?.name || null : null;
        return { ...alert, driverName };
      }),
    );
  },
});

export const getAlertCount = query({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, { stationId }) => {
    const hasAccess = await checkStationAccess(ctx, stationId);
    if (!hasAccess) return 0;

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_station_unread", (q) => q.eq("stationId", stationId).eq("isRead", false))
      .filter((q) => q.eq(q.field("isDismissed"), false))
      .collect();

    return alerts.length;
  },
});

export const getAllAlerts = query({
  args: {
    stationId: v.id("stations"),
    year: v.optional(v.number()),
    week: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { stationId, year, week, limit }) => {
    const hasAccess = await checkStationAccess(ctx, stationId);
    if (!hasAccess) return [];

    const alerts =
      year !== undefined && week !== undefined
        ? await ctx.db
            .query("alerts")
            .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", year).eq("week", week))
            .order("desc")
            .take(limit || 100)
        : await ctx.db
            .query("alerts")
            .withIndex("by_station", (q) => q.eq("stationId", stationId))
            .order("desc")
            .take(limit || 100);

    return await Promise.all(
      alerts.map(async (alert) => {
        const driverName = alert.driverId ? (await ctx.db.get(alert.driverId))?.name || null : null;
        return { ...alert, driverName };
      }),
    );
  },
});

export const markAsRead = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) return false;

    await requireWriteAccess(ctx, alert.stationId);
    await ctx.db.patch(alertId, { isRead: true });
    return true;
  },
});

export const markAllAsRead = mutation({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, { stationId }) => {
    await requireWriteAccess(ctx, stationId);

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_station_unread", (q) => q.eq("stationId", stationId).eq("isRead", false))
      .collect();

    for (const alert of alerts) {
      await ctx.db.patch(alert._id, { isRead: true });
    }

    return alerts.length;
  },
});

export const dismissAlert = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) return false;

    await requireWriteAccess(ctx, alert.stationId);

    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject || "system";

    await ctx.db.patch(alertId, {
      isDismissed: true,
      dismissedBy: userId,
      dismissedAt: Date.now(),
    });
    return true;
  },
});

export const generateAlerts = mutation({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx, args.stationId);
    const result = await createQualifiedAlerts(ctx, args);
    return { alertsCreated: result.alertCount };
  },
});

export const generateAlertsInternal = internalMutation({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    const result = await createQualifiedAlerts(ctx, args);
    return { alertsCreated: result.alertCount };
  },
});

export const generateQualifiedAlertsInternal = internalMutation({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
    runId: v.optional(v.id("automationRuns")),
    importId: v.optional(v.id("imports")),
  },
  handler: async (ctx, args) => {
    return await createQualifiedAlerts(ctx, args);
  },
});

// Default objectives if station has none configured
const DEFAULT_OBJECTIVES = {
  dwcTarget: 92,
  iadcTarget: 65,
  dwcAlertDrop: 5,
  dnrDpmoMax: 1500,
  coachingMaxDays: 14,
};

async function createQualifiedAlerts(
  ctx: MutationCtx,
  args: {
    stationId: Id<"stations">;
    year: number;
    week: number;
    runId?: Id<"automationRuns">;
    importId?: Id<"imports">;
  },
) {
  const now = Date.now();
  let alertCount = 0;
  let maxConfidenceScore = 0;
  let lowConfidenceCount = 0;
  const alertSummaries: GeneratedAlertSummary[] = [];

  // Fetch station objectives (or use defaults)
  const stationObjectives = await ctx.db
    .query("stationObjectives")
    .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
    .unique();

  const objectives = stationObjectives ?? DEFAULT_OBJECTIVES;

  const prevWeek = args.week === 1 ? 52 : args.week - 1;
  const prevYear = args.week === 1 ? args.year - 1 : args.year;

  const currentStats = await ctx.db
    .query("driverWeeklyStats")
    .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week))
    .collect();

  const prevStats = await ctx.db
    .query("driverWeeklyStats")
    .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", prevYear).eq("week", prevWeek))
    .collect();

  const prevStatsMap = new Map(prevStats.map((stat) => [stat.driverId.toString(), stat]));
  const weekAlerts = await ctx.db
    .query("alerts")
    .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week))
    .collect();

  const existingKeys = new Set(weekAlerts.map((alert) => `${alert.driverId || "station"}:${alert.type}`));

  for (const stat of currentStats) {
    const driver = await ctx.db.get(stat.driverId);
    if (!driver) continue;

    const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
    const dwcPercent = dwcTotal > 0 ? (stat.dwcCompliant / dwcTotal) * 100 : 0;

    const candidates = [];

    // Alert if DWC is below the station's target
    if (dwcPercent < objectives.dwcTarget) {
      candidates.push(
        qualifyDwcBelowTargetAlert({
          driverName: driver.name,
          driverId: driver._id,
          dwcPercent,
          dwcTarget: objectives.dwcTarget,
        }),
      );
    }

    const prevStat = prevStatsMap.get(stat.driverId.toString());
    if (prevStat) {
      const prevTotal = prevStat.dwcCompliant + prevStat.dwcMisses + prevStat.failedAttempts;
      const prevDwc = prevTotal > 0 ? (prevStat.dwcCompliant / prevTotal) * 100 : 0;
      const drop = prevDwc - dwcPercent;

      // Alert if drop exceeds station's configured threshold
      if (drop > objectives.dwcAlertDrop) {
        candidates.push(
          qualifyDwcDropAlert({
            driverName: driver.name,
            driverId: driver._id,
            currentDwc: dwcPercent,
            previousDwc: prevDwc,
            dropThreshold: objectives.dwcAlertDrop,
          }),
        );
      }

      // tier_downgrade alerts removed - tiers are invented and no longer used
    } else {
      candidates.push(
        qualifyNewDriverAlert({
          driverName: driver.name,
          driverId: driver._id,
          dwcPercent,
        }),
      );
    }

    for (const candidate of candidates) {
      const key = `${driver._id}:${candidate.type}`;
      if (existingKeys.has(key)) {
        continue;
      }

      const decisionScoreId =
        args.runId || args.importId
          ? await ctx.db.insert("decisionScores", {
              stationId: args.stationId,
              runId: args.runId,
              importId: args.importId,
              driverId: driver._id,
              year: args.year,
              week: args.week,
              decisionType: "alert",
              logicalChannel: candidate.logicalChannel,
              title: candidate.title,
              summary: candidate.summary,
              severity: candidate.severity,
              confidenceScore: candidate.confidenceScore,
              confidenceLevel: candidate.confidenceLevel,
              status: "queued",
              targetPath: candidate.targetPath,
              evidence: candidate.evidence.map((evidence) => `${evidence.label}: ${evidence.value}`),
              recommendedAction: candidate.recommendedAction,
              createdAt: now,
            })
          : undefined;

      await ctx.db.insert("alerts", {
        stationId: args.stationId,
        driverId: driver._id,
        type: candidate.type,
        severity: candidate.severity,
        title: candidate.title,
        message: candidate.message,
        currentValue: candidate.currentValue,
        previousValue: candidate.previousValue,
        threshold: candidate.threshold,
        confidenceScore: candidate.confidenceScore,
        confidenceLevel: candidate.confidenceLevel,
        logicalChannel: candidate.logicalChannel,
        targetPath: candidate.targetPath,
        evidence: candidate.evidence.map((evidence) => `${evidence.label}: ${evidence.value}`),
        recommendedAction: candidate.recommendedAction,
        sourceRunId: args.runId,
        decisionScoreId,
        year: args.year,
        week: args.week,
        isRead: false,
        isDismissed: false,
        createdAt: now,
      });

      existingKeys.add(key);
      alertCount += 1;
      maxConfidenceScore = Math.max(maxConfidenceScore, candidate.confidenceScore);
      if (candidate.confidenceScore < 0.85) {
        lowConfidenceCount += 1;
      }
      alertSummaries.push({
        severity: candidate.severity,
        title: candidate.title,
        summary: candidate.summary,
        targetPath: candidate.targetPath,
      });
    }
  }

  const pendingCoaching = await ctx.db
    .query("coachingActions")
    .withIndex("by_station_status", (q) => q.eq("stationId", args.stationId).eq("status", "pending"))
    .collect();

  const maxDaysMs = objectives.coachingMaxDays * 24 * 60 * 60 * 1000;
  const thresholdDate = now - maxDaysMs;

  for (const coaching of pendingCoaching) {
    if (coaching.createdAt >= thresholdDate) continue;

    const driver = await ctx.db.get(coaching.driverId);
    if (!driver) continue;

    const key = `${coaching.driverId}:coaching_pending`;
    if (existingKeys.has(key)) continue;

    const daysPending = Math.floor((now - coaching.createdAt) / (24 * 60 * 60 * 1000));
    const candidate = qualifyCoachingPendingAlert({
      driverName: driver.name,
      driverId: driver._id,
      daysPending,
      maxDays: objectives.coachingMaxDays,
    });

    const decisionScoreId =
      args.runId || args.importId
        ? await ctx.db.insert("decisionScores", {
            stationId: args.stationId,
            runId: args.runId,
            importId: args.importId,
            driverId: driver._id,
            year: args.year,
            week: args.week,
            decisionType: "alert",
            logicalChannel: candidate.logicalChannel,
            title: candidate.title,
            summary: candidate.summary,
            severity: candidate.severity,
            confidenceScore: candidate.confidenceScore,
            confidenceLevel: candidate.confidenceLevel,
            status: "queued",
            targetPath: candidate.targetPath,
            evidence: candidate.evidence.map((evidence) => `${evidence.label}: ${evidence.value}`),
            recommendedAction: candidate.recommendedAction,
            createdAt: now,
          })
        : undefined;

    await ctx.db.insert("alerts", {
      stationId: args.stationId,
      driverId: driver._id,
      type: candidate.type,
      severity: candidate.severity,
      title: candidate.title,
      message: candidate.message,
      currentValue: candidate.currentValue,
      previousValue: candidate.previousValue,
      threshold: candidate.threshold,
      confidenceScore: candidate.confidenceScore,
      confidenceLevel: candidate.confidenceLevel,
      logicalChannel: candidate.logicalChannel,
      targetPath: candidate.targetPath,
      evidence: candidate.evidence.map((evidence) => `${evidence.label}: ${evidence.value}`),
      recommendedAction: candidate.recommendedAction,
      sourceRunId: args.runId,
      decisionScoreId,
      year: args.year,
      week: args.week,
      isRead: false,
      isDismissed: false,
      createdAt: now,
    });

    existingKeys.add(key);
    alertCount += 1;
    maxConfidenceScore = Math.max(maxConfidenceScore, candidate.confidenceScore);
    if (candidate.confidenceScore < 0.85) {
      lowConfidenceCount += 1;
    }
    alertSummaries.push({
      severity: candidate.severity,
      title: candidate.title,
      summary: candidate.summary,
      targetPath: candidate.targetPath,
    });
  }

  const artifactCount = args.runId
    ? (
        await ctx.db
          .query("sourceArtifacts")
          .withIndex("by_run", (q) => q.eq("runId", args.runId))
          .collect()
      ).length
    : 0;

  return {
    alertCount,
    maxConfidenceScore,
    lowConfidenceCount,
    artifactCount,
    alerts: alertSummaries,
  };
}
