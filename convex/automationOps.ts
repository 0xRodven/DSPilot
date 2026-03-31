import { type FunctionReference, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import {
  type ReportAlertSummary,
  type ReportDocument,
  type ReportDriverSummary,
  renderReportAscii,
  renderReportHtml,
} from "../src/lib/reports/templates";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { shouldAutoSend } from "./lib/automationPolicy";
import { checkStationAccess, requireWriteAccess } from "./lib/permissions";
import { getTier, type Tier } from "./lib/tier";

const logicalChannelValidator = v.union(
  v.literal("ops"),
  v.literal("alerts"),
  v.literal("reports_daily"),
  v.literal("reports_weekly"),
);

const reportTypeValidator = v.union(v.literal("daily"), v.literal("weekly"));

const reportAudienceValidator = v.union(v.literal("internal"), v.literal("manager"));

const runStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("success"),
  v.literal("partial"),
  v.literal("failed"),
);

const artifactInputValidator = v.object({
  artifactType: v.string(),
  logicalSource: v.string(),
  filename: v.string(),
  storagePath: v.string(),
  mimeType: v.optional(v.string()),
  sizeBytes: v.optional(v.number()),
  sha256: v.optional(v.string()),
  stationCode: v.optional(v.string()),
  year: v.optional(v.number()),
  week: v.optional(v.number()),
});

const DEFAULT_AUTOMATION_CONFIG = {
  enabled: true,
  timezone: "Europe/Paris",
  autoApproveMinConfidence: 0.85,
  channelMappings: {
    ops: "ops",
    alerts: "alerts",
    reportsDaily: "reports-daily",
    reportsWeekly: "reports-weekly",
  },
  audiences: ["internal", "manager"] as Array<"internal" | "manager">,
};

const getStationAutomationConfigInternalRef = makeFunctionReference(
  "automationOps:getStationAutomationConfigInternal",
) as unknown as FunctionReference<
  "query",
  "internal",
  { stationId: Id<"stations"> },
  {
    _id?: Id<"stationAutomationConfigs">;
    stationId: Id<"stations">;
    enabled: boolean;
    timezone: string;
    autoApproveMinConfidence: number;
    channelMappings: {
      ops: string;
      alerts: string;
      reportsDaily: string;
      reportsWeekly: string;
    };
    audiences: Array<"internal" | "manager">;
    updatedBy: string;
    updatedAt: number;
  }
>;

const getImportedWeekSnapshotRef = makeFunctionReference(
  "automationOps:getImportedWeekSnapshot",
) as unknown as FunctionReference<
  "query",
  "internal",
  { stationId: Id<"stations">; year: number; week: number },
  ImportedWeekSnapshot
>;

const storeReportDeliveryInternalRef = makeFunctionReference(
  "automationOps:storeReportDeliveryInternal",
) as unknown as FunctionReference<
  "mutation",
  "internal",
  {
    stationId: Id<"stations">;
    runId?: Id<"automationRuns">;
    importId?: Id<"imports">;
    reportType: "daily" | "weekly";
    logicalChannel: "ops" | "alerts" | "reports_daily" | "reports_weekly";
    audience: "internal" | "manager";
    periodLabel: string;
    year?: number;
    week?: number;
    title: string;
    summary: string;
    asciiContent: string;
    htmlContent: string;
    pdfStatus: "pending" | "generated" | "failed" | "skipped";
    pdfPath?: string;
    deliveryStatus: "pending" | "sent" | "failed" | "skipped";
    targetPath?: string;
    confidenceScore: number;
  },
  Id<"reportDeliveries">
>;

const finalizeAutomationRunRef = makeFunctionReference(
  "automationOps:finalizeAutomationRun",
) as unknown as FunctionReference<
  "mutation",
  "internal",
  {
    runId: Id<"automationRuns">;
    status: "pending" | "running" | "success" | "partial" | "failed";
    artifactCount: number;
    alertCount: number;
    reportCount: number;
    summary?: string;
    error?: string;
  },
  void
>;

const generateQualifiedAlertsInternalRef = makeFunctionReference(
  "alerts:generateQualifiedAlertsInternal",
) as unknown as FunctionReference<
  "mutation",
  "internal",
  {
    stationId: Id<"stations">;
    year: number;
    week: number;
    runId?: Id<"automationRuns">;
    importId?: Id<"imports">;
  },
  {
    alertCount: number;
    maxConfidenceScore: number;
    lowConfidenceCount: number;
    artifactCount: number;
    alerts: AutomationAlertResultSummary[];
  }
>;

type ImportedWeekSnapshot = {
  station: Doc<"stations">;
  currentDrivers: Array<{
    id: Id<"drivers">;
    name: string;
    dwcPercent: number;
    iadcPercent: number;
    deliveryMissesRisk: number;
    photoDefects: number;
    tier: Tier;
    trend: number | null;
  }>;
  dailyDrivers: Array<{
    id: Id<"drivers">;
    name: string;
    dwcPercent: number;
    iadcPercent: number;
    deliveryMissesRisk: number;
    photoDefects: number;
    tier: Tier;
    trend: number | null;
  }>;
  latestDailyDate: string | null;
  stationDwc: number;
  stationIadc: number;
  stationDeliveryMissesRisk: number;
  dailyDwc: number;
  dailyIadc: number;
  dailyDeliveryMissesRisk: number;
  dailyPhotoDefects: number;
  tierDistribution: {
    fantastic: number;
    great: number;
    fair: number;
    poor: number;
  };
  associateTotals: {
    packagesDelivered: number;
    dnrCount: number;
    avgDnrDpmo: number | null;
    packagesShipped: number;
    rtsCount: number;
    avgRtsPercent: number | null;
    avgRtsDpmo: number | null;
  };
  rosterSummary: {
    total: number;
    active: number;
    onboarding: number;
    offboarded: number;
    unknown: number;
    matched: number;
    unmatched: number;
    withPhone: number;
  };
  previousStationStats: Doc<"stationWeeklyStats"> | null;
};

type AutomationAlertResultSummary = {
  severity: "info" | "warning" | "critical";
  title: string;
  summary: string;
  targetPath?: string;
};

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function formatDateTime(value: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(value);
}

function buildDriverSummary(driver: {
  name: string;
  dwcPercent: number;
  iadcPercent: number;
  deliveryMissesRisk: number;
  photoDefects: number;
  tier: string;
  trend: number | null;
}): ReportDriverSummary {
  return {
    name: driver.name,
    dwcPercent: driver.dwcPercent,
    iadcPercent: driver.iadcPercent,
    deliveryMissesRisk: driver.deliveryMissesRisk,
    photoDefects: driver.photoDefects,
    tier: driver.tier,
    trend: driver.trend,
  };
}

function toAlertSummary(alert: {
  severity: "info" | "warning" | "critical";
  title: string;
  summary: string;
  targetPath?: string;
}): ReportAlertSummary {
  return {
    severity: alert.severity,
    title: alert.title,
    summary: alert.summary,
    targetPath: alert.targetPath,
  };
}

function buildWeeklyReportDocument(args: {
  station: Doc<"stations">;
  year: number;
  week: number;
  snapshot: ImportedWeekSnapshot;
  alerts: Array<{
    severity: "info" | "warning" | "critical";
    title: string;
    summary: string;
    targetPath?: string;
  }>;
  confidenceScore: number;
}): ReportDocument {
  const topDrivers = args.snapshot.currentDrivers
    .slice()
    .sort((left, right) => right.dwcPercent - left.dwcPercent)
    .slice(0, 5)
    .map(buildDriverSummary);

  const riskDrivers = args.snapshot.currentDrivers
    .slice()
    .sort((left, right) => {
      if (left.dwcPercent !== right.dwcPercent) {
        return left.dwcPercent - right.dwcPercent;
      }
      return right.deliveryMissesRisk - left.deliveryMissesRisk;
    })
    .slice(0, 5)
    .map(buildDriverSummary);

  const confidenceLabel =
    args.confidenceScore >= 0.85
      ? "Confiance haute"
      : args.confidenceScore >= 0.65
        ? "Confiance moyenne"
        : "Confiance basse";

  const rosterSummary = args.snapshot.rosterSummary;
  const associateTotals = args.snapshot.associateTotals;
  const averageRtsPercent = associateTotals.avgRtsPercent === null ? "—" : formatPercent(associateTotals.avgRtsPercent);
  const averageDnrDpmo = associateTotals.avgDnrDpmo === null ? "—" : `${Math.round(associateTotals.avgDnrDpmo)}`;

  return {
    type: "weekly",
    stationCode: args.station.code,
    stationName: args.station.name,
    periodLabel: `Semaine ${args.week} / ${args.year}`,
    generatedAtLabel: formatDateTime(Date.now()),
    headline: `Weekly performance brief · ${args.station.code}`,
    summary:
      args.alerts.length > 0
        ? `${args.alerts.length} alerte(s) qualifiée(s) détectée(s) après ingestion de la semaine ${args.week}.`
        : `Aucune alerte qualifiée majeure après ingestion de la semaine ${args.week}.`,
    dataFreshness: args.snapshot.latestDailyDate
      ? `Dernière daily visible: ${args.snapshot.latestDailyDate}`
      : "Pas de daily distincte visible dans cette semaine",
    confidenceLabel,
    kpis: [
      {
        label: "DWC",
        value: formatPercent(args.snapshot.stationDwc),
        note: "Amazon export",
      },
      {
        label: "IADC",
        value: formatPercent(args.snapshot.stationIadc),
        note: "Amazon export",
      },
      {
        label: "Risque DNR",
        value: `${args.snapshot.stationDeliveryMissesRisk}`,
        note: "Volume weekly",
      },
      {
        label: "DNR",
        value: `${associateTotals.dnrCount}`,
        note: "Associate overview HTML",
      },
      {
        label: "RTS",
        value: `${associateTotals.rtsCount}`,
        note: `Moyenne ${averageRtsPercent}`,
      },
      {
        label: "Roster",
        value: `${rosterSummary.active} actifs`,
        note: `${rosterSummary.matched}/${rosterSummary.total} maps`,
      },
    ],
    highlights: [
      `Tier distribution DSPilot: ${args.snapshot.tierDistribution.fantastic} fantastic / ${args.snapshot.tierDistribution.great} great / ${args.snapshot.tierDistribution.fair} fair / ${args.snapshot.tierDistribution.poor} poor.`,
      `Les meilleurs drivers montent jusqu'à ${topDrivers[0] ? formatPercent(topDrivers[0].dwcPercent) : "—"} de DWC.`,
      `Les drivers les plus à risque descendent jusqu'à ${riskDrivers[0] ? formatPercent(riskDrivers[0].dwcPercent) : "—"} de DWC.`,
      `Associate overview: ${associateTotals.packagesDelivered} colis livres, ${associateTotals.dnrCount} DNR, DPMO moyen ${averageDnrDpmo}.`,
      `Roster snapshot: ${rosterSummary.active} active / ${rosterSummary.onboarding} onboarding / ${rosterSummary.offboarded} offboarded, ${rosterSummary.withPhone} numeros disponibles.`,
    ],
    priorities: [
      "Traiter d'abord les drivers en tier poor ou sous 90% DWC.",
      "Utiliser le front DSPilot pour inspecter les défauts photo/contact sur les profils drivers ciblés.",
      rosterSummary.unmatched > 0
        ? `Resoudre ${rosterSummary.unmatched} entree(s) roster non mappee(s) avant toute automatisation sortante vers les drivers.`
        : "Le roster est mappe proprement; la priorite suivante est la couverture telephone pour WhatsApp.",
    ],
    topDrivers,
    riskDrivers,
    alerts: args.alerts.map(toAlertSummary),
  };
}

function buildDailyReportDocument(args: {
  station: Doc<"stations">;
  year: number;
  week: number;
  snapshot: ImportedWeekSnapshot;
  alerts: Array<{
    severity: "info" | "warning" | "critical";
    title: string;
    summary: string;
    targetPath?: string;
  }>;
  confidenceScore: number;
}): ReportDocument | null {
  if (!args.snapshot.dailyDrivers.length || !args.snapshot.latestDailyDate) {
    return null;
  }

  const topDrivers = args.snapshot.dailyDrivers
    .slice()
    .sort((left, right) => right.dwcPercent - left.dwcPercent)
    .slice(0, 5)
    .map(buildDriverSummary);

  const riskDrivers = args.snapshot.dailyDrivers
    .slice()
    .sort((left, right) => {
      if (left.dwcPercent !== right.dwcPercent) {
        return left.dwcPercent - right.dwcPercent;
      }
      return right.deliveryMissesRisk - left.deliveryMissesRisk;
    })
    .slice(0, 5)
    .map(buildDriverSummary);

  const confidenceLabel =
    args.confidenceScore >= 0.85
      ? "Confiance haute"
      : args.confidenceScore >= 0.65
        ? "Confiance moyenne"
        : "Confiance basse";

  return {
    type: "daily",
    stationCode: args.station.code,
    stationName: args.station.name,
    periodLabel: `Daily snapshot · ${args.snapshot.latestDailyDate}`,
    generatedAtLabel: formatDateTime(Date.now()),
    headline: `Daily operations brief · ${args.station.code}`,
    summary: `Synthèse quotidienne issue des stats daily importées pour ${args.snapshot.latestDailyDate}.`,
    dataFreshness: `Dernier daily: ${args.snapshot.latestDailyDate}`,
    confidenceLabel,
    kpis: [
      {
        label: "DWC",
        value: formatPercent(args.snapshot.dailyDwc),
        note: "Agrégation daily",
      },
      {
        label: "IADC",
        value: formatPercent(args.snapshot.dailyIadc),
        note: "Agrégation daily",
      },
      {
        label: "Risque DNR",
        value: `${args.snapshot.dailyDeliveryMissesRisk}`,
        note: "Volume daily",
      },
      {
        label: "Drivers actifs",
        value: `${args.snapshot.dailyDrivers.length}`,
        note: "Date unique",
      },
    ],
    highlights: [
      `Le point daily s'appuie sur ${args.snapshot.dailyDrivers.length} driver(s) actifs.`,
      `Le mix des défauts photo du jour totalise ${args.snapshot.dailyPhotoDefects}.`,
      `Les alertes qualifiées de la semaine restent visibles côté front DSPilot.`,
    ],
    priorities: [
      "Prioriser les drivers du jour avec DWC faible et risque DNR élevé.",
      "Relire les alertes qualifiées avant tout envoi manager élargi.",
      "Vérifier que les données daily correspondent bien au dernier export disponible.",
    ],
    topDrivers,
    riskDrivers,
    alerts: args.alerts.map(toAlertSummary),
  };
}

export const createAutomationRun = internalMutation({
  args: {
    stationId: v.id("stations"),
    importId: v.optional(v.id("imports")),
    trigger: v.union(v.literal("amazon_ingest"), v.literal("manual"), v.literal("cron")),
    source: v.string(),
    year: v.optional(v.number()),
    week: v.optional(v.number()),
    filename: v.optional(v.string()),
    reportStationCode: v.optional(v.string()),
    importedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("automationRuns", {
      ...args,
      status: "running",
      artifactCount: 0,
      alertCount: 0,
      reportCount: 0,
      startedAt: Date.now(),
    });
  },
});

export const recordAutomationArtifacts = internalMutation({
  args: {
    stationId: v.id("stations"),
    runId: v.id("automationRuns"),
    importId: v.optional(v.id("imports")),
    artifacts: v.array(artifactInputValidator),
  },
  handler: async (ctx, args) => {
    let count = 0;
    for (const artifact of args.artifacts) {
      await ctx.db.insert("sourceArtifacts", {
        stationId: args.stationId,
        runId: args.runId,
        importId: args.importId,
        ...artifact,
        createdAt: Date.now(),
      });
      count += 1;
    }

    await ctx.db.patch(args.runId, {
      artifactCount: count,
    });

    return count;
  },
});

export const finalizeAutomationRun = internalMutation({
  args: {
    runId: v.id("automationRuns"),
    status: runStatusValidator,
    artifactCount: v.number(),
    alertCount: v.number(),
    reportCount: v.number(),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: args.status,
      artifactCount: args.artifactCount,
      alertCount: args.alertCount,
      reportCount: args.reportCount,
      summary: args.summary,
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

export const storeReportDeliveryInternal = internalMutation({
  args: {
    stationId: v.id("stations"),
    runId: v.optional(v.id("automationRuns")),
    importId: v.optional(v.id("imports")),
    reportType: reportTypeValidator,
    logicalChannel: logicalChannelValidator,
    audience: reportAudienceValidator,
    periodLabel: v.string(),
    year: v.optional(v.number()),
    week: v.optional(v.number()),
    title: v.string(),
    summary: v.string(),
    asciiContent: v.string(),
    htmlContent: v.string(),
    pdfStatus: v.union(v.literal("pending"), v.literal("generated"), v.literal("failed"), v.literal("skipped")),
    pdfPath: v.optional(v.string()),
    deliveryStatus: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    targetPath: v.optional(v.string()),
    confidenceScore: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reportDeliveries", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getStationAutomationConfigInternal = internalQuery({
  args: {
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stationAutomationConfigs")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .first();

    if (existing) {
      return existing;
    }

    return {
      _id: undefined,
      stationId: args.stationId,
      ...DEFAULT_AUTOMATION_CONFIG,
      updatedBy: "system:default",
      updatedAt: 0,
    };
  },
});

export const upsertStationAutomationConfig = mutation({
  args: {
    stationId: v.id("stations"),
    enabled: v.boolean(),
    timezone: v.string(),
    autoApproveMinConfidence: v.number(),
    channelMappings: v.object({
      ops: v.string(),
      alerts: v.string(),
      reportsDaily: v.string(),
      reportsWeekly: v.string(),
    }),
    audiences: v.array(reportAudienceValidator),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx, args.stationId);
    const identity = await ctx.auth.getUserIdentity();
    const updatedBy = identity?.subject || "system";

    const existing = await ctx.db
      .query("stationAutomationConfigs")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedBy,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("stationAutomationConfigs", {
      ...args,
      updatedBy,
      updatedAt: Date.now(),
    });
  },
});

export const getAutomationOverview = query({
  args: {
    stationId: v.id("stations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null;

    const config = await ctx.db
      .query("stationAutomationConfigs")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .first();

    const runs = await ctx.db
      .query("automationRuns")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(args.limit || 10);

    const reports = await ctx.db
      .query("reportDeliveries")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(10);

    return {
      config: config || DEFAULT_AUTOMATION_CONFIG,
      runs,
      reports,
    };
  },
});

export const getImportedWeekSnapshot = internalQuery({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    const station = await ctx.db.get(args.stationId);
    if (!station) {
      throw new Error("Station introuvable pour le snapshot automation");
    }

    const currentStationStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .first();

    if (!currentStationStats) {
      throw new Error("Aucune stat station trouvée pour la semaine importée");
    }

    const prevWeek = args.week === 1 ? 52 : args.week - 1;
    const prevYear = args.week === 1 ? args.year - 1 : args.year;

    const previousStationStats = await ctx.db
      .query("stationWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", prevYear).eq("week", prevWeek))
      .first();

    const currentDrivers = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    const previousDrivers = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", (q) => q.eq("stationId", args.stationId).eq("year", prevYear).eq("week", prevWeek))
      .collect();

    const previousMap = new Map(previousDrivers.map((stat) => [stat.driverId.toString(), stat]));

    const latestDaily = await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    let latestDailyDate: string | null = null;
    for (const stat of latestDaily) {
      if (!latestDailyDate || stat.date > latestDailyDate) {
        latestDailyDate = stat.date;
      }
    }

    const latestDailyStats = latestDailyDate ? latestDaily.filter((stat) => stat.date === latestDailyDate) : [];

    const currentDriverPayload = await Promise.all(
      currentDrivers.map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;
        const previous = previousMap.get(stat.driverId.toString());
        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
        const previousTotal = previous ? previous.dwcCompliant + previous.dwcMisses + previous.failedAttempts : 0;
        const dwcPercent = dwcTotal > 0 ? (stat.dwcCompliant / dwcTotal) * 100 : 0;
        const iadcPercent = iadcTotal > 0 ? (stat.iadcCompliant / iadcTotal) * 100 : 0;
        const previousDwc = previous && previousTotal > 0 ? (previous.dwcCompliant / previousTotal) * 100 : null;

        return {
          id: driver._id,
          name: driver.name,
          dwcPercent: Math.round(dwcPercent * 10) / 10,
          iadcPercent: Math.round(iadcPercent * 10) / 10,
          deliveryMissesRisk: stat.dwcMisses,
          photoDefects: stat.dwcBreakdown?.photoDefect ?? 0,
          tier: getTier(dwcPercent),
          trend: previousDwc === null ? null : Math.round((dwcPercent - previousDwc) * 10) / 10,
        };
      }),
    );

    const latestDailyMap = new Map(latestDailyStats.map((stat) => [stat.driverId.toString(), stat]));
    const dailyDriverPayload = await Promise.all(
      Array.from(latestDailyMap.values()).map(async (stat) => {
        const driver = await ctx.db.get(stat.driverId);
        if (!driver) return null;
        const dwcTotal = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
        const iadcTotal = stat.iadcCompliant + stat.iadcNonCompliant;
        const dwcPercent = dwcTotal > 0 ? (stat.dwcCompliant / dwcTotal) * 100 : 0;
        const iadcPercent = iadcTotal > 0 ? (stat.iadcCompliant / iadcTotal) * 100 : 0;

        return {
          id: driver._id,
          name: driver.name,
          dwcPercent: Math.round(dwcPercent * 10) / 10,
          iadcPercent: Math.round(iadcPercent * 10) / 10,
          deliveryMissesRisk: stat.dwcMisses,
          photoDefects: stat.dwcBreakdown?.photoDefect ?? 0,
          tier: getTier(dwcPercent),
          trend: null,
        };
      }),
    );

    const dailyTotals = latestDailyStats.reduce(
      (acc, stat) => {
        acc.dwcCompliant += stat.dwcCompliant;
        acc.dwcMisses += stat.dwcMisses;
        acc.failedAttempts += stat.failedAttempts;
        acc.iadcCompliant += stat.iadcCompliant;
        acc.iadcNonCompliant += stat.iadcNonCompliant;
        acc.photoDefects += stat.dwcBreakdown?.photoDefect ?? 0;
        return acc;
      },
      {
        dwcCompliant: 0,
        dwcMisses: 0,
        failedAttempts: 0,
        iadcCompliant: 0,
        iadcNonCompliant: 0,
        photoDefects: 0,
      },
    );

    const dailyDwcTotal = dailyTotals.dwcCompliant + dailyTotals.dwcMisses + dailyTotals.failedAttempts;
    const dailyIadcTotal = dailyTotals.iadcCompliant + dailyTotals.iadcNonCompliant;

    const stationDwcTotal =
      currentStationStats.dwcCompliant + currentStationStats.dwcMisses + currentStationStats.failedAttempts;
    const stationIadcTotal = currentStationStats.iadcCompliant + currentStationStats.iadcNonCompliant;

    const associateStats = await ctx.db
      .query("driverAssociateStats")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    const rosterSnapshots = await ctx.db
      .query("driverRosterSnapshots")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .collect();

    const associateTotals = associateStats.reduce(
      (acc, stat) => {
        acc.packagesDelivered += stat.packagesDelivered ?? 0;
        acc.dnrCount += stat.dnrCount ?? 0;
        acc.dnrDpmoSum += stat.dnrDpmo ?? 0;
        acc.dnrDpmoCount += stat.dnrDpmo === undefined ? 0 : 1;
        acc.packagesShipped += stat.packagesShipped ?? 0;
        acc.rtsCount += stat.rtsCount ?? 0;
        acc.rtsPercentSum += stat.rtsPercent ?? 0;
        acc.rtsPercentCount += stat.rtsPercent === undefined ? 0 : 1;
        acc.rtsDpmoSum += stat.rtsDpmo ?? 0;
        acc.rtsDpmoCount += stat.rtsDpmo === undefined ? 0 : 1;
        return acc;
      },
      {
        packagesDelivered: 0,
        dnrCount: 0,
        dnrDpmoSum: 0,
        dnrDpmoCount: 0,
        packagesShipped: 0,
        rtsCount: 0,
        rtsPercentSum: 0,
        rtsPercentCount: 0,
        rtsDpmoSum: 0,
        rtsDpmoCount: 0,
      },
    );

    const rosterSummary = rosterSnapshots.reduce(
      (acc, entry) => {
        acc.total += 1;
        acc.withPhone += entry.phoneNumber ? 1 : 0;
        acc.matched += entry.driverId ? 1 : 0;
        acc.unmatched += entry.driverId ? 0 : 1;

        switch (entry.status) {
          case "ACTIVE":
            acc.active += 1;
            break;
          case "ONBOARDING":
            acc.onboarding += 1;
            break;
          case "OFFBOARDED":
            acc.offboarded += 1;
            break;
          default:
            acc.unknown += 1;
            break;
        }

        return acc;
      },
      {
        total: 0,
        active: 0,
        onboarding: 0,
        offboarded: 0,
        unknown: 0,
        matched: 0,
        unmatched: 0,
        withPhone: 0,
      },
    );

    return {
      station,
      currentDrivers: currentDriverPayload.filter((driver): driver is NonNullable<typeof driver> => driver !== null),
      dailyDrivers: dailyDriverPayload.filter((driver): driver is NonNullable<typeof driver> => driver !== null),
      latestDailyDate,
      stationDwc: stationDwcTotal > 0 ? (currentStationStats.dwcCompliant / stationDwcTotal) * 100 : 0,
      stationIadc: stationIadcTotal > 0 ? (currentStationStats.iadcCompliant / stationIadcTotal) * 100 : 0,
      stationDeliveryMissesRisk: currentStationStats.dwcMisses,
      dailyDwc: dailyDwcTotal > 0 ? (dailyTotals.dwcCompliant / dailyDwcTotal) * 100 : 0,
      dailyIadc: dailyIadcTotal > 0 ? (dailyTotals.iadcCompliant / dailyIadcTotal) * 100 : 0,
      dailyDeliveryMissesRisk: dailyTotals.dwcMisses,
      dailyPhotoDefects: dailyTotals.photoDefects,
      tierDistribution: currentStationStats.tierDistribution,
      associateTotals: {
        packagesDelivered: associateTotals.packagesDelivered,
        dnrCount: associateTotals.dnrCount,
        avgDnrDpmo: associateTotals.dnrDpmoCount > 0 ? associateTotals.dnrDpmoSum / associateTotals.dnrDpmoCount : null,
        packagesShipped: associateTotals.packagesShipped,
        rtsCount: associateTotals.rtsCount,
        avgRtsPercent:
          associateTotals.rtsPercentCount > 0 ? associateTotals.rtsPercentSum / associateTotals.rtsPercentCount : null,
        avgRtsDpmo: associateTotals.rtsDpmoCount > 0 ? associateTotals.rtsDpmoSum / associateTotals.rtsDpmoCount : null,
      },
      rosterSummary,
      previousStationStats,
    };
  },
});

export const processImportedWeek = internalAction({
  args: {
    runId: v.id("automationRuns"),
    importId: v.id("imports"),
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const [config, snapshot, alertResult] = await Promise.all([
        ctx.runQuery(getStationAutomationConfigInternalRef, {
          stationId: args.stationId,
        }),
        ctx.runQuery(getImportedWeekSnapshotRef, {
          stationId: args.stationId,
          year: args.year,
          week: args.week,
        }),
        ctx.runMutation(generateQualifiedAlertsInternalRef, {
          stationId: args.stationId,
          year: args.year,
          week: args.week,
          runId: args.runId,
          importId: args.importId,
        }),
      ]);

      const confidenceScore =
        alertResult.maxConfidenceScore > 0 ? alertResult.maxConfidenceScore : config.autoApproveMinConfidence;

      const weeklyDoc = buildWeeklyReportDocument({
        station: snapshot.station,
        year: args.year,
        week: args.week,
        snapshot,
        alerts: alertResult.alerts,
        confidenceScore,
      });

      const dailyDoc = buildDailyReportDocument({
        station: snapshot.station,
        year: args.year,
        week: args.week,
        snapshot,
        alerts: alertResult.alerts,
        confidenceScore,
      });

      let reportCount = 0;

      for (const audience of config.audiences) {
        await ctx.runMutation(storeReportDeliveryInternalRef, {
          stationId: args.stationId,
          runId: args.runId,
          importId: args.importId,
          reportType: "weekly",
          logicalChannel: "reports_weekly",
          audience,
          periodLabel: weeklyDoc.periodLabel,
          year: args.year,
          week: args.week,
          title: weeklyDoc.headline,
          summary: weeklyDoc.summary,
          asciiContent: renderReportAscii(weeklyDoc),
          htmlContent: renderReportHtml(weeklyDoc),
          pdfStatus: "pending",
          deliveryStatus: shouldAutoSend(confidenceScore, config.autoApproveMinConfidence) ? "pending" : "skipped",
          targetPath: `/dashboard/recaps?year=${args.year}&week=${args.week}`,
          confidenceScore,
        });
        reportCount += 1;

        if (dailyDoc) {
          await ctx.runMutation(storeReportDeliveryInternalRef, {
            stationId: args.stationId,
            runId: args.runId,
            importId: args.importId,
            reportType: "daily",
            logicalChannel: "reports_daily",
            audience,
            periodLabel: dailyDoc.periodLabel,
            year: args.year,
            week: args.week,
            title: dailyDoc.headline,
            summary: dailyDoc.summary,
            asciiContent: renderReportAscii(dailyDoc),
            htmlContent: renderReportHtml(dailyDoc),
            pdfStatus: "pending",
            deliveryStatus: shouldAutoSend(confidenceScore, config.autoApproveMinConfidence) ? "pending" : "skipped",
            targetPath: snapshot.latestDailyDate
              ? `/dashboard?period=day&date=${snapshot.latestDailyDate}`
              : `/dashboard?period=day`,
            confidenceScore,
          });
          reportCount += 1;
        }
      }

      const runStatus = alertResult.lowConfidenceCount > 0 ? "partial" : "success";

      await ctx.runMutation(finalizeAutomationRunRef, {
        runId: args.runId,
        status: runStatus,
        artifactCount: alertResult.artifactCount,
        alertCount: alertResult.alertCount,
        reportCount,
        summary: `${alertResult.alertCount} alerte(s) qualifiée(s), ${reportCount} report delivery row(s).`,
      });

      return {
        runId: args.runId,
        alertCount: alertResult.alertCount,
        reportCount,
        status: runStatus,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant le post-traitement automation";

      await ctx.runMutation(finalizeAutomationRunRef, {
        runId: args.runId,
        status: "failed",
        artifactCount: 0,
        alertCount: 0,
        reportCount: 0,
        error: message,
      });

      throw error;
    }
  },
});
