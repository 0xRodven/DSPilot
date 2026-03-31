import { type FunctionReference, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { getTier } from "./lib/tier";

const dwcBreakdownValidator = v.object({
  contactMiss: v.number(),
  photoDefect: v.number(),
  noPhoto: v.number(),
  otpMiss: v.number(),
  other: v.number(),
});

const iadcBreakdownValidator = v.object({
  mailbox: v.number(),
  unattended: v.number(),
  safePlace: v.number(),
  other: v.number(),
});

const driverNameMappingValidator = v.object({
  amazonId: v.string(),
  name: v.string(),
});

const associateWeeklyStatValidator = v.object({
  amazonId: v.string(),
  name: v.string(),
  packagesDelivered: v.optional(v.number()),
  dnrCount: v.optional(v.number()),
  dnrDpmo: v.optional(v.number()),
  packagesShipped: v.optional(v.number()),
  rtsCount: v.optional(v.number()),
  rtsPercent: v.optional(v.number()),
  rtsDpmo: v.optional(v.number()),
});

const dailyReportStatValidator = v.object({
  transporterId: v.string(),
  date: v.string(),
  rtsCount: v.number(),
  dnrCount: v.number(),
  podFails: v.number(),
  ccFails: v.number(),
});

const driverRosterEntryValidator = v.object({
  name: v.string(),
  providerId: v.string(),
  dspName: v.optional(v.string()),
  email: v.optional(v.string()),
  phoneNumber: v.optional(v.string()),
  onboardingTasks: v.optional(v.string()),
  status: v.union(v.literal("ACTIVE"), v.literal("ONBOARDING"), v.literal("OFFBOARDED"), v.literal("UNKNOWN")),
  serviceArea: v.optional(v.string()),
});

const deliveryMetricValidator = v.object({
  metricName: v.string(),
  year: v.number(),
  week: v.number(),
  value: v.string(),
  numericValue: v.optional(v.number()),
});

const automationArtifactValidator = v.object({
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

const dailyStatInputValidator = v.object({
  transporterId: v.string(),
  date: v.string(),
  year: v.number(),
  week: v.number(),
  dwcCompliant: v.number(),
  dwcMisses: v.number(),
  failedAttempts: v.number(),
  iadcCompliant: v.number(),
  iadcNonCompliant: v.number(),
  dwcBreakdown: v.optional(dwcBreakdownValidator),
  iadcBreakdown: v.optional(iadcBreakdownValidator),
});

const weeklyStatInputValidator = v.object({
  transporterId: v.string(),
  year: v.number(),
  week: v.number(),
  dwcCompliant: v.number(),
  dwcMisses: v.number(),
  failedAttempts: v.number(),
  iadcCompliant: v.number(),
  iadcNonCompliant: v.number(),
  dwcBreakdown: v.optional(dwcBreakdownValidator),
  iadcBreakdown: v.optional(iadcBreakdownValidator),
});

type IngestParsedAmazonReportArgs = {
  stationId: Id<"stations">;
  filename: string;
  year: number;
  week: number;
  importedBy: string;
  reportStationCode: string;
  transporterIds: string[];
  dailyStats: Array<{
    transporterId: string;
    date: string;
    year: number;
    week: number;
    dwcCompliant: number;
    dwcMisses: number;
    failedAttempts: number;
    iadcCompliant: number;
    iadcNonCompliant: number;
    dwcBreakdown?: {
      contactMiss: number;
      photoDefect: number;
      noPhoto: number;
      otpMiss: number;
      other: number;
    };
    iadcBreakdown?: {
      mailbox: number;
      unattended: number;
      safePlace: number;
      other: number;
    };
  }>;
  weeklyStats: Array<{
    transporterId: string;
    year: number;
    week: number;
    dwcCompliant: number;
    dwcMisses: number;
    failedAttempts: number;
    iadcCompliant: number;
    iadcNonCompliant: number;
    dwcBreakdown?: {
      contactMiss: number;
      photoDefect: number;
      noPhoto: number;
      otpMiss: number;
      other: number;
    };
    iadcBreakdown?: {
      mailbox: number;
      unattended: number;
      safePlace: number;
      other: number;
    };
  }>;
  driverMappings?: Array<{
    amazonId: string;
    name: string;
  }>;
  associateWeeklyStats?: Array<{
    amazonId: string;
    name: string;
    packagesDelivered?: number;
    dnrCount?: number;
    dnrDpmo?: number;
    packagesShipped?: number;
    rtsCount?: number;
    rtsPercent?: number;
    rtsDpmo?: number;
  }>;
  driverRosterEntries?: Array<{
    name: string;
    providerId: string;
    dspName?: string;
    email?: string;
    phoneNumber?: string;
    onboardingTasks?: string;
    status: "ACTIVE" | "ONBOARDING" | "OFFBOARDED" | "UNKNOWN";
    serviceArea?: string;
  }>;
  deliveryMetrics?: Array<{
    metricName: string;
    year: number;
    week: number;
    value: string;
    numericValue?: number;
  }>;
  source?: string;
  artifacts?: Array<{
    artifactType: string;
    logicalSource: string;
    filename: string;
    storagePath: string;
    mimeType?: string;
    sizeBytes?: number;
    sha256?: string;
    stationCode?: string;
    year?: number;
    week?: number;
  }>;
  warnings?: string[];
};

type ApplyAutomationImportArgs = Omit<IngestParsedAmazonReportArgs, "importedBy" | "source" | "artifacts"> & {
  importId: Id<"imports">;
};

type AutomationImportResult = {
  runId?: Id<"automationRuns">;
  importId: Id<"imports">;
  stationId: Id<"stations">;
  filename: string;
  reportStationCode: string;
  year: number;
  week: number;
  driversImported: number;
  newDriversCount: number;
  namesUpdated: number;
  dailyRecordsCount: number;
  weeklyRecordsCount: number;
  deliveryMetricsCount: number;
  associateStatsCount?: number;
  rosterEntriesCount?: number;
  rosterLinkedCount?: number;
  dwcScore: number;
  iadcScore: number;
  tierDistribution: {
    fantastic: number;
    great: number;
    fair: number;
    poor: number;
  };
  warnings: string[];
  automation?: {
    status: "success" | "partial" | "failed";
    alertCount: number;
    reportCount: number;
  };
};

const createAutomationImportRef = makeFunctionReference(
  "automation:createAutomationImport",
) as unknown as FunctionReference<
  "mutation",
  "internal",
  {
    stationId: Id<"stations">;
    filename: string;
    year: number;
    week: number;
    importedBy: string;
  },
  Id<"imports">
>;

const applyAutomationParsedReportRef = makeFunctionReference(
  "automation:applyAutomationParsedReport",
) as unknown as FunctionReference<"mutation", "internal", ApplyAutomationImportArgs, AutomationImportResult>;

const failAutomationImportRef = makeFunctionReference(
  "automation:failAutomationImport",
) as unknown as FunctionReference<
  "mutation",
  "internal",
  {
    importId: Id<"imports">;
    errors: string[];
  },
  void
>;

const createAutomationRunRef = makeFunctionReference(
  "automationOps:createAutomationRun",
) as unknown as FunctionReference<
  "mutation",
  "internal",
  {
    stationId: Id<"stations">;
    importId?: Id<"imports">;
    trigger: "amazon_ingest" | "manual" | "cron";
    source: string;
    year?: number;
    week?: number;
    filename?: string;
    reportStationCode?: string;
    importedBy?: string;
  },
  Id<"automationRuns">
>;

const recordAutomationArtifactsRef = makeFunctionReference(
  "automationOps:recordAutomationArtifacts",
) as unknown as FunctionReference<
  "mutation",
  "internal",
  {
    stationId: Id<"stations">;
    runId: Id<"automationRuns">;
    importId?: Id<"imports">;
    artifacts: Array<{
      artifactType: string;
      logicalSource: string;
      filename: string;
      storagePath: string;
      mimeType?: string;
      sizeBytes?: number;
      sha256?: string;
      stationCode?: string;
      year?: number;
      week?: number;
    }>;
  },
  number
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

const processImportedWeekRef = makeFunctionReference(
  "automationOps:processImportedWeek",
) as unknown as FunctionReference<
  "action",
  "internal",
  {
    runId: Id<"automationRuns">;
    importId: Id<"imports">;
    stationId: Id<"stations">;
    year: number;
    week: number;
  },
  {
    runId: Id<"automationRuns">;
    alertCount: number;
    reportCount: number;
    status: "success" | "partial" | "failed";
  }
>;

export const resolveStationByCode = internalQuery({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const station = await ctx.db
      .query("stations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!station) {
      return null;
    }

    return {
      _id: station._id,
      code: station.code,
      name: station.name,
      organizationId: station.organizationId,
    };
  },
});

export const createAutomationImport = internalMutation({
  args: {
    stationId: v.id("stations"),
    filename: v.string(),
    year: v.number(),
    week: v.number(),
    importedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("imports")
      .withIndex("by_station_week", (q) =>
        q.eq("stationId", args.stationId).eq("year", args.year).eq("week", args.week),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "failed" as const,
        errors: ["Remplacé par un nouvel import automation"],
        completedAt: Date.now(),
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

export const applyAutomationParsedReport = internalMutation({
  args: {
    importId: v.id("imports"),
    stationId: v.id("stations"),
    filename: v.string(),
    year: v.number(),
    week: v.number(),
    reportStationCode: v.string(),
    transporterIds: v.array(v.string()),
    dailyStats: v.array(dailyStatInputValidator),
    weeklyStats: v.array(weeklyStatInputValidator),
    driverMappings: v.optional(v.array(driverNameMappingValidator)),
    associateWeeklyStats: v.optional(v.array(associateWeeklyStatValidator)),
    driverRosterEntries: v.optional(v.array(driverRosterEntryValidator)),
    deliveryMetrics: v.optional(v.array(deliveryMetricValidator)),
    dailyReportStats: v.optional(v.array(dailyReportStatValidator)),
    warnings: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const effectiveTransporterIds = Array.from(
      new Set(
        [
          ...args.transporterIds,
          ...(args.driverMappings || []).map((mapping) => mapping.amazonId),
          ...(args.associateWeeklyStats || []).map((row) => row.amazonId),
        ].filter(Boolean),
      ),
    );

    if (effectiveTransporterIds.length === 0) {
      throw new Error("Aucun transporter Amazon trouvé dans le report");
    }

    if (args.weeklyStats.length === 0) {
      throw new Error("Le report ne contient aucune stat hebdomadaire");
    }

    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord) {
      throw new Error("Import automation introuvable");
    }

    const station = await ctx.db.get(args.stationId);
    if (!station) {
      throw new Error("Station DSPilot introuvable");
    }

    const now = Date.now();
    const weekKey = `${args.year}-${args.week.toString().padStart(2, "0")}`;

    await ctx.db.patch(args.importId, {
      status: "processing",
    });

    await deleteExistingWeekData(ctx, args.stationId, args.year, args.week);

    const { driverMap, newDriversCount } = await ensureDriversForWeek(ctx, {
      stationId: args.stationId,
      transporterIds: effectiveTransporterIds,
      weekKey,
      now,
    });

    const namesUpdated = await updateDriverNames(
      ctx,
      args.stationId,
      mergeDriverMappings(args.driverMappings || [], args.associateWeeklyStats || []),
      now,
    );

    const dailyReportMap = new Map<string, { rtsCount: number; dnrCount: number; podFails: number; ccFails: number }>();
    for (const dr of args.dailyReportStats || []) {
      dailyReportMap.set(`${dr.transporterId}|${dr.date}`, {
        rtsCount: dr.rtsCount,
        dnrCount: dr.dnrCount,
        podFails: dr.podFails,
        ccFails: dr.ccFails,
      });
    }

    for (const stat of args.dailyStats) {
      const drEntry = dailyReportMap.get(`${stat.transporterId}|${stat.date}`);
      await ctx.db.insert("driverDailyStats", {
        driverId: getDriverId(driverMap, stat.transporterId),
        stationId: args.stationId,
        date: stat.date,
        year: stat.year,
        week: stat.week,
        dwcCompliant: stat.dwcCompliant,
        dwcMisses: stat.dwcMisses,
        failedAttempts: stat.failedAttempts,
        iadcCompliant: stat.iadcCompliant,
        iadcNonCompliant: stat.iadcNonCompliant,
        dwcBreakdown: stat.dwcBreakdown,
        iadcBreakdown: stat.iadcBreakdown,
        ...(drEntry ?? {}),
        createdAt: now,
      });
    }

    const daysWorkedByTransporter = computeDaysWorkedByTransporter(args.dailyStats);

    for (const stat of args.weeklyStats) {
      await ctx.db.insert("driverWeeklyStats", {
        driverId: getDriverId(driverMap, stat.transporterId),
        stationId: args.stationId,
        year: stat.year,
        week: stat.week,
        dwcCompliant: stat.dwcCompliant,
        dwcMisses: stat.dwcMisses,
        failedAttempts: stat.failedAttempts,
        iadcCompliant: stat.iadcCompliant,
        iadcNonCompliant: stat.iadcNonCompliant,
        daysWorked: daysWorkedByTransporter.get(stat.transporterId) || 0,
        dwcBreakdown: stat.dwcBreakdown,
        iadcBreakdown: stat.iadcBreakdown,
        createdAt: now,
        updatedAt: now,
      });
    }

    const stationAggregation = aggregateStationWeek(args.weeklyStats);

    await ctx.db.insert("stationWeeklyStats", {
      stationId: args.stationId,
      year: args.year,
      week: args.week,
      dwcCompliant: stationAggregation.dwcCompliant,
      dwcMisses: stationAggregation.dwcMisses,
      failedAttempts: stationAggregation.failedAttempts,
      iadcCompliant: stationAggregation.iadcCompliant,
      iadcNonCompliant: stationAggregation.iadcNonCompliant,
      totalDrivers: args.weeklyStats.length,
      activeDrivers: args.weeklyStats.length,
      tierDistribution: stationAggregation.tierDistribution,
      dwcBreakdown: stationAggregation.dwcBreakdown,
      iadcBreakdown: stationAggregation.iadcBreakdown,
      createdAt: now,
      updatedAt: now,
    });

    for (const metric of args.deliveryMetrics || []) {
      await ctx.db.insert("stationDeliveryStats", {
        stationId: args.stationId,
        metricName: metric.metricName,
        year: metric.year,
        week: metric.week,
        value: metric.value,
        numericValue: metric.numericValue,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const stat of args.associateWeeklyStats || []) {
      await ctx.db.insert("driverAssociateStats", {
        stationId: args.stationId,
        driverId: getDriverId(driverMap, stat.amazonId),
        amazonId: stat.amazonId,
        year: args.year,
        week: args.week,
        packagesDelivered: stat.packagesDelivered,
        dnrCount: stat.dnrCount,
        dnrDpmo: stat.dnrDpmo,
        packagesShipped: stat.packagesShipped,
        rtsCount: stat.rtsCount,
        rtsPercent: stat.rtsPercent,
        rtsDpmo: stat.rtsDpmo,
        createdAt: now,
        updatedAt: now,
      });
    }

    const rosterLinkedCount = await syncDriverRosterSnapshots(ctx, {
      stationId: args.stationId,
      year: args.year,
      week: args.week,
      entries: args.driverRosterEntries || [],
      now,
    });

    const fleetScores = calculateFleetScores(args.weeklyStats);
    const warnings = args.warnings || [];

    await ctx.db.patch(args.importId, {
      status: warnings.length > 0 ? "partial" : "success",
      driversImported: effectiveTransporterIds.length,
      dailyRecordsCount: args.dailyStats.length,
      weeklyRecordsCount: args.weeklyStats.length,
      newDriversCount,
      dwcScore: fleetScores.dwcScore,
      iadcScore: fleetScores.iadcScore,
      tierDistribution: stationAggregation.tierDistribution,
      warnings: warnings.length > 0 ? warnings : undefined,
      completedAt: now,
    });

    return {
      importId: args.importId,
      stationId: args.stationId,
      filename: args.filename,
      reportStationCode: args.reportStationCode,
      year: args.year,
      week: args.week,
      driversImported: effectiveTransporterIds.length,
      newDriversCount,
      namesUpdated,
      dailyRecordsCount: args.dailyStats.length,
      weeklyRecordsCount: args.weeklyStats.length,
      deliveryMetricsCount: (args.deliveryMetrics || []).length,
      associateStatsCount: (args.associateWeeklyStats || []).length,
      rosterEntriesCount: (args.driverRosterEntries || []).length,
      rosterLinkedCount,
      dwcScore: fleetScores.dwcScore,
      iadcScore: fleetScores.iadcScore,
      tierDistribution: stationAggregation.tierDistribution,
      warnings,
    };
  },
});

export const failAutomationImport = internalMutation({
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

export const ingestParsedAmazonReport = internalAction({
  args: {
    stationId: v.id("stations"),
    filename: v.string(),
    year: v.number(),
    week: v.number(),
    importedBy: v.string(),
    reportStationCode: v.string(),
    transporterIds: v.array(v.string()),
    dailyStats: v.array(dailyStatInputValidator),
    weeklyStats: v.array(weeklyStatInputValidator),
    driverMappings: v.optional(v.array(driverNameMappingValidator)),
    associateWeeklyStats: v.optional(v.array(associateWeeklyStatValidator)),
    driverRosterEntries: v.optional(v.array(driverRosterEntryValidator)),
    deliveryMetrics: v.optional(v.array(deliveryMetricValidator)),
    dailyReportStats: v.optional(v.array(dailyReportStatValidator)),
    source: v.optional(v.string()),
    artifacts: v.optional(v.array(automationArtifactValidator)),
    warnings: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const importId = await ctx.runMutation(createAutomationImportRef, {
      stationId: args.stationId,
      filename: args.filename,
      year: args.year,
      week: args.week,
      importedBy: args.importedBy,
    });

    const runId = await ctx.runMutation(createAutomationRunRef, {
      stationId: args.stationId,
      importId,
      trigger: "amazon_ingest",
      source: args.source || "amazon_artifacts_dir",
      year: args.year,
      week: args.week,
      filename: args.filename,
      reportStationCode: args.reportStationCode,
      importedBy: args.importedBy,
    });
    let recordedArtifactsCount = 0;

    try {
      const { importedBy: _importedBy, source: _source, artifacts: _artifacts, ...applyArgs } = args;

      if (args.artifacts && args.artifacts.length > 0) {
        recordedArtifactsCount = await ctx.runMutation(recordAutomationArtifactsRef, {
          stationId: args.stationId,
          runId,
          importId,
          artifacts: args.artifacts,
        });
      }

      const importResult = await ctx.runMutation(applyAutomationParsedReportRef, {
        importId,
        ...applyArgs,
      });

      const automationResult = await ctx.runAction(processImportedWeekRef, {
        runId,
        importId,
        stationId: args.stationId,
        year: args.year,
        week: args.week,
      });

      return {
        ...importResult,
        runId,
        automation: {
          status: automationResult.status,
          alertCount: automationResult.alertCount,
          reportCount: automationResult.reportCount,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant l'import automation";

      await ctx.runMutation(failAutomationImportRef, {
        importId,
        errors: [message],
      });

      await ctx.runMutation(finalizeAutomationRunRef, {
        runId,
        status: "failed",
        artifactCount: recordedArtifactsCount,
        alertCount: 0,
        reportCount: 0,
        error: message,
      });

      throw error;
    }
  },
});

async function deleteExistingWeekData(ctx: MutationCtx, stationId: Id<"stations">, year: number, week: number) {
  const dailyStats = await ctx.db
    .query("driverDailyStats")
    .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", year).eq("week", week))
    .collect();

  for (const stat of dailyStats) {
    await ctx.db.delete(stat._id);
  }

  const weeklyStats = await ctx.db
    .query("driverWeeklyStats")
    .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", year).eq("week", week))
    .collect();

  for (const stat of weeklyStats) {
    await ctx.db.delete(stat._id);
  }

  const stationStats = await ctx.db
    .query("stationWeeklyStats")
    .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", year).eq("week", week))
    .collect();

  for (const stat of stationStats) {
    await ctx.db.delete(stat._id);
  }

  const deliveryStats = await ctx.db
    .query("stationDeliveryStats")
    .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", year).eq("week", week))
    .collect();

  for (const stat of deliveryStats) {
    await ctx.db.delete(stat._id);
  }

  const associateStats = await ctx.db
    .query("driverAssociateStats")
    .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", year).eq("week", week))
    .collect();

  for (const stat of associateStats) {
    await ctx.db.delete(stat._id);
  }

  const rosterSnapshots = await ctx.db
    .query("driverRosterSnapshots")
    .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", year).eq("week", week))
    .collect();

  for (const snapshot of rosterSnapshots) {
    await ctx.db.delete(snapshot._id);
  }

  const alerts = await ctx.db
    .query("alerts")
    .withIndex("by_station_week", (q) => q.eq("stationId", stationId).eq("year", year).eq("week", week))
    .collect();

  for (const alert of alerts) {
    await ctx.db.delete(alert._id);
  }
}

async function ensureDriversForWeek(
  ctx: MutationCtx,
  args: {
    stationId: Id<"stations">;
    transporterIds: string[];
    weekKey: string;
    now: number;
  },
) {
  const driverMap = new Map<string, Id<"drivers">>();
  let newDriversCount = 0;

  for (const amazonId of args.transporterIds) {
    const existing = await ctx.db
      .query("drivers")
      .withIndex("by_station_amazon", (q) => q.eq("stationId", args.stationId).eq("amazonId", amazonId))
      .first();

    if (existing) {
      if (!existing.isActive) {
        await ctx.db.patch(existing._id, {
          isActive: true,
          updatedAt: args.now,
        });
      }

      driverMap.set(amazonId, existing._id);
      continue;
    }

    const driverId = await ctx.db.insert("drivers", {
      stationId: args.stationId,
      amazonId,
      name: amazonId,
      isActive: true,
      firstSeenWeek: args.weekKey,
      createdAt: args.now,
      updatedAt: args.now,
    });

    driverMap.set(amazonId, driverId);
    newDriversCount++;
  }

  return { driverMap, newDriversCount };
}

async function updateDriverNames(
  ctx: MutationCtx,
  stationId: Id<"stations">,
  mappings: Array<{ amazonId: string; name: string }>,
  now: number,
) {
  let updated = 0;

  for (const mapping of mappings) {
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_station_amazon", (q) => q.eq("stationId", stationId).eq("amazonId", mapping.amazonId))
      .first();

    if (!driver || !mapping.name || driver.name === mapping.name) {
      continue;
    }

    await ctx.db.patch(driver._id, {
      name: mapping.name,
      updatedAt: now,
    });
    updated++;
  }

  return updated;
}

function mergeDriverMappings(
  mappings: Array<{ amazonId: string; name: string }>,
  associateStats: Array<{ amazonId: string; name: string }>,
) {
  const merged = new Map<string, string>();

  for (const stat of associateStats) {
    if (stat.amazonId && stat.name) {
      merged.set(stat.amazonId, stat.name);
    }
  }

  for (const mapping of mappings) {
    if (mapping.amazonId && mapping.name) {
      merged.set(mapping.amazonId, mapping.name);
    }
  }

  return Array.from(merged.entries()).map(([amazonId, name]) => ({
    amazonId,
    name,
  }));
}

function normalizeDriverName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeRosterPhoneNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 9) {
    return `+33${digits}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `+33${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith("33")) {
    return `+${digits}`;
  }
  return undefined;
}

async function syncDriverRosterSnapshots(
  ctx: MutationCtx,
  args: {
    stationId: Id<"stations">;
    year: number;
    week: number;
    entries: Array<{
      name: string;
      providerId: string;
      dspName?: string;
      email?: string;
      phoneNumber?: string;
      onboardingTasks?: string;
      status: "ACTIVE" | "ONBOARDING" | "OFFBOARDED" | "UNKNOWN";
      serviceArea?: string;
    }>;
    now: number;
  },
) {
  if (args.entries.length === 0) {
    return 0;
  }

  const drivers = await ctx.db
    .query("drivers")
    .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
    .collect();

  const driversByName = new Map<string, Array<(typeof drivers)[number]>>();
  for (const driver of drivers) {
    const key = normalizeDriverName(driver.name);
    const existing = driversByName.get(key) || [];
    existing.push(driver);
    driversByName.set(key, existing);
  }

  let linkedCount = 0;

  for (const entry of args.entries) {
    const matchingDrivers = driversByName.get(normalizeDriverName(entry.name)) || [];
    const matchedDriver = matchingDrivers.length === 1 ? matchingDrivers[0] : null;
    const normalizedPhoneNumber = normalizeRosterPhoneNumber(entry.phoneNumber);

    if (matchedDriver) {
      const nextIsActive =
        entry.status === "UNKNOWN"
          ? matchedDriver.isActive
          : entry.status === "ACTIVE" || entry.status === "ONBOARDING";
      const patch: Partial<(typeof drivers)[number]> = {
        isActive: nextIsActive,
        updatedAt: args.now,
      };

      if (normalizedPhoneNumber && matchedDriver.phoneNumber !== normalizedPhoneNumber) {
        patch.phoneNumber = normalizedPhoneNumber;
      }

      await ctx.db.patch(matchedDriver._id, patch);
      linkedCount += 1;
    }

    await ctx.db.insert("driverRosterSnapshots", {
      stationId: args.stationId,
      driverId: matchedDriver?._id,
      year: args.year,
      week: args.week,
      name: entry.name,
      providerId: entry.providerId,
      dspName: entry.dspName,
      email: entry.email,
      phoneNumber: entry.phoneNumber,
      onboardingTasks: entry.onboardingTasks,
      status: entry.status,
      serviceArea: entry.serviceArea,
      matchMethod: matchedDriver ? "normalized_name" : "unmatched",
      matchConfidence: matchedDriver ? 0.85 : 0,
      createdAt: args.now,
      updatedAt: args.now,
    });
  }

  return linkedCount;
}

function computeDaysWorkedByTransporter(dailyStats: IngestParsedAmazonReportArgs["dailyStats"]) {
  const datesByTransporter = new Map<string, Set<string>>();

  for (const stat of dailyStats) {
    const total = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
    if (total <= 0) {
      continue;
    }

    const dates = datesByTransporter.get(stat.transporterId) || new Set<string>();
    dates.add(stat.date);
    datesByTransporter.set(stat.transporterId, dates);
  }

  const daysWorkedByTransporter = new Map<string, number>();

  for (const [transporterId, dates] of datesByTransporter.entries()) {
    daysWorkedByTransporter.set(transporterId, dates.size);
  }

  return daysWorkedByTransporter;
}

function aggregateStationWeek(weeklyStats: IngestParsedAmazonReportArgs["weeklyStats"]) {
  const dwcBreakdown = {
    contactMiss: 0,
    photoDefect: 0,
    noPhoto: 0,
    otpMiss: 0,
    other: 0,
  };

  const iadcBreakdown = {
    mailbox: 0,
    unattended: 0,
    safePlace: 0,
    other: 0,
  };

  const tierDistribution = {
    fantastic: 0,
    great: 0,
    fair: 0,
    poor: 0,
  };

  let dwcCompliant = 0;
  let dwcMisses = 0;
  let failedAttempts = 0;
  let iadcCompliant = 0;
  let iadcNonCompliant = 0;

  for (const stat of weeklyStats) {
    dwcCompliant += stat.dwcCompliant;
    dwcMisses += stat.dwcMisses;
    failedAttempts += stat.failedAttempts;
    iadcCompliant += stat.iadcCompliant;
    iadcNonCompliant += stat.iadcNonCompliant;

    if (stat.dwcBreakdown) {
      dwcBreakdown.contactMiss += stat.dwcBreakdown.contactMiss;
      dwcBreakdown.photoDefect += stat.dwcBreakdown.photoDefect;
      dwcBreakdown.noPhoto += stat.dwcBreakdown.noPhoto;
      dwcBreakdown.otpMiss += stat.dwcBreakdown.otpMiss;
      dwcBreakdown.other += stat.dwcBreakdown.other;
    }

    if (stat.iadcBreakdown) {
      iadcBreakdown.mailbox += stat.iadcBreakdown.mailbox;
      iadcBreakdown.unattended += stat.iadcBreakdown.unattended;
      iadcBreakdown.safePlace += stat.iadcBreakdown.safePlace;
      iadcBreakdown.other += stat.iadcBreakdown.other;
    }

    const totalDwc = stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
    if (totalDwc <= 0) {
      continue;
    }

    const dwcPercent = (stat.dwcCompliant / totalDwc) * 100;
    tierDistribution[getTier(dwcPercent)]++;
  }

  return {
    dwcCompliant,
    dwcMisses,
    failedAttempts,
    iadcCompliant,
    iadcNonCompliant,
    dwcBreakdown,
    iadcBreakdown,
    tierDistribution,
  };
}

function calculateFleetScores(weeklyStats: IngestParsedAmazonReportArgs["weeklyStats"]) {
  let dwcCompliant = 0;
  let dwcTotal = 0;
  let iadcCompliant = 0;
  let iadcTotal = 0;

  for (const stat of weeklyStats) {
    dwcCompliant += stat.dwcCompliant;
    dwcTotal += stat.dwcCompliant + stat.dwcMisses + stat.failedAttempts;
    iadcCompliant += stat.iadcCompliant;
    iadcTotal += stat.iadcCompliant + stat.iadcNonCompliant;
  }

  return {
    dwcScore: dwcTotal > 0 ? (dwcCompliant / dwcTotal) * 100 : 0,
    iadcScore: iadcTotal > 0 ? (iadcCompliant / iadcTotal) * 100 : 0,
  };
}

function getDriverId(driverMap: Map<string, Id<"drivers">>, transporterId: string) {
  const driverId = driverMap.get(transporterId);

  if (!driverId) {
    throw new Error(`Driver introuvable pour ${transporterId}`);
  }

  return driverId;
}
