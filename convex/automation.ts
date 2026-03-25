import { type FunctionReference, makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
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

const deliveryMetricValidator = v.object({
  metricName: v.string(),
  year: v.number(),
  week: v.number(),
  value: v.string(),
  numericValue: v.optional(v.number()),
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
  deliveryMetrics?: Array<{
    metricName: string;
    year: number;
    week: number;
    value: string;
    numericValue?: number;
  }>;
  warnings?: string[];
};

type ApplyAutomationImportArgs = Omit<IngestParsedAmazonReportArgs, "importedBy"> & {
  importId: Id<"imports">;
};

type AutomationImportResult = {
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
  dwcScore: number;
  iadcScore: number;
  tierDistribution: {
    fantastic: number;
    great: number;
    fair: number;
    poor: number;
  };
  warnings: string[];
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
    deliveryMetrics: v.optional(v.array(deliveryMetricValidator)),
    warnings: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    if (args.transporterIds.length === 0) {
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
      transporterIds: args.transporterIds,
      weekKey,
      now,
    });

    const namesUpdated = await updateDriverNames(ctx, args.stationId, args.driverMappings || [], now);

    for (const stat of args.dailyStats) {
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

    const fleetScores = calculateFleetScores(args.weeklyStats);
    const warnings = args.warnings || [];

    await ctx.db.patch(args.importId, {
      status: warnings.length > 0 ? "partial" : "success",
      driversImported: args.transporterIds.length,
      dailyRecordsCount: args.dailyStats.length,
      weeklyRecordsCount: args.weeklyStats.length,
      newDriversCount,
      dwcScore: fleetScores.dwcScore,
      iadcScore: fleetScores.iadcScore,
      tierDistribution: stationAggregation.tierDistribution,
      warnings: warnings.length > 0 ? warnings : undefined,
      completedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.alerts.generateAlertsInternal, {
      stationId: importRecord.stationId,
      year: importRecord.year,
      week: importRecord.week,
    });

    return {
      importId: args.importId,
      stationId: args.stationId,
      filename: args.filename,
      reportStationCode: args.reportStationCode,
      year: args.year,
      week: args.week,
      driversImported: args.transporterIds.length,
      newDriversCount,
      namesUpdated,
      dailyRecordsCount: args.dailyStats.length,
      weeklyRecordsCount: args.weeklyStats.length,
      deliveryMetricsCount: (args.deliveryMetrics || []).length,
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
    deliveryMetrics: v.optional(v.array(deliveryMetricValidator)),
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

    try {
      const { importedBy: _importedBy, ...applyArgs } = args;

      return await ctx.runMutation(applyAutomationParsedReportRef, {
        importId,
        ...applyArgs,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant l'import automation";

      await ctx.runMutation(failAutomationImportRef, {
        importId,
        errors: [message],
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
