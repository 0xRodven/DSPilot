import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Breakdown types réutilisables
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

const tierDistributionValidator = v.object({
  fantastic: v.number(),
  great: v.number(),
  fair: v.number(),
  poor: v.number(),
});

const confidenceLevelValidator = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

const automationRunStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("success"),
  v.literal("partial"),
  v.literal("failed"),
);

const logicalChannelValidator = v.union(
  v.literal("ops"),
  v.literal("alerts"),
  v.literal("reports_daily"),
  v.literal("reports_weekly"),
);

const reportTypeValidator = v.union(v.literal("daily"), v.literal("weekly"));

const reportAudienceValidator = v.union(v.literal("internal"), v.literal("manager"));

const rosterStatusValidator = v.union(
  v.literal("ACTIVE"),
  v.literal("ONBOARDING"),
  v.literal("OFFBOARDED"),
  v.literal("UNKNOWN"),
);

const rosterMatchMethodValidator = v.union(v.literal("normalized_name"), v.literal("unmatched"));

const deliveryStatusValidator = v.union(
  v.literal("pending"),
  v.literal("sent"),
  v.literal("failed"),
  v.literal("skipped"),
);

const pdfStatusValidator = v.union(
  v.literal("pending"),
  v.literal("generated"),
  v.literal("failed"),
  v.literal("skipped"),
);

const decisionTypeValidator = v.union(
  v.literal("alert"),
  v.literal("digest"),
  v.literal("report_daily"),
  v.literal("report_weekly"),
);

const decisionStatusValidator = v.union(
  v.literal("draft"),
  v.literal("queued"),
  v.literal("sent"),
  v.literal("suppressed"),
);

const channelMappingsValidator = v.object({
  ops: v.string(),
  alerts: v.string(),
  reportsDaily: v.string(),
  reportsWeekly: v.string(),
});

export default defineSchema({
  // Stations (DSP delivery stations)
  stations: defineTable({
    code: v.string(), // "DIF1"
    name: v.string(), // "Paris Denfert"
    region: v.optional(v.string()),
    organizationId: v.optional(v.string()), // Clerk org ID (optional for migration)
    ownerId: v.string(), // Clerk user ID (creator)
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_owner", ["ownerId"])
    .index("by_code", ["code"]),

  // Station access for Managers/Viewers (granular access control)
  stationAccess: defineTable({
    organizationId: v.string(), // Clerk org ID
    userId: v.string(), // Clerk user ID
    stationId: v.id("stations"), // Station granted access to
    role: v.union(v.literal("manager"), v.literal("viewer")),
    grantedBy: v.string(), // Who granted access
    grantedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_station", ["stationId"])
    .index("by_org_user", ["organizationId", "userId"]),

  // Drivers
  drivers: defineTable({
    stationId: v.id("stations"),
    amazonId: v.string(), // Transporter ID du CSV
    name: v.string(),
    isActive: v.boolean(),
    firstSeenWeek: v.optional(v.string()), // "2025-32" pour activeSince
    phoneNumber: v.optional(v.string()), // Format E.164: +33612345678
    whatsappOptIn: v.optional(v.boolean()), // Consentement explicite WhatsApp
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_station_amazon", ["stationId", "amazonId"])
    .index("by_station_active", ["stationId", "isActive"]),

  // Daily stats per driver (données brutes importées)
  driverDailyStats: defineTable({
    driverId: v.id("drivers"),
    stationId: v.id("stations"),
    date: v.string(), // "2025-12-09"
    year: v.number(),
    week: v.number(),

    // DWC - VOLUMES (pas pourcentages)
    dwcCompliant: v.number(), // Type = "Compliant"
    dwcMisses: v.number(), // Type = "Delivery Misses - DNR Risk"
    failedAttempts: v.number(), // Type = "Failed Attempts Misses"

    // IADC - VOLUMES
    iadcCompliant: v.number(), // Group starts with "Compliant"
    iadcNonCompliant: v.number(), // Group starts with "Not Compliant"

    // Breakdowns DWC (par Shipment Reason)
    dwcBreakdown: v.optional(dwcBreakdownValidator),

    // Breakdowns IADC (par Group)
    iadcBreakdown: v.optional(iadcBreakdownValidator),

    // Champs bruts Daily Report (Amazon "Rapports supplémentaires")
    rtsCount: v.optional(v.number()), // Return to Station
    dnrCount: v.optional(v.number()), // Did Not Receive
    podFails: v.optional(v.number()), // Proof of Delivery failures
    ccFails: v.optional(v.number()), // Contact Compliance failures

    createdAt: v.number(),
  })
    .index("by_driver_date", ["driverId", "date"])
    .index("by_driver_week", ["driverId", "year", "week"])
    .index("by_station_date", ["stationId", "date"])
    .index("by_station_week", ["stationId", "year", "week"]),

  // Weekly aggregated stats per driver
  driverWeeklyStats: defineTable({
    driverId: v.id("drivers"),
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),

    // Volumes agrégés
    dwcCompliant: v.number(),
    dwcMisses: v.number(),
    failedAttempts: v.number(),
    iadcCompliant: v.number(),
    iadcNonCompliant: v.number(),

    // Métadonnées
    daysWorked: v.number(),

    // Breakdowns agrégés
    dwcBreakdown: v.optional(dwcBreakdownValidator),
    iadcBreakdown: v.optional(iadcBreakdownValidator),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_driver", ["driverId"])
    .index("by_driver_week", ["driverId", "year", "week"])
    .index("by_station", ["stationId"])
    .index("by_station_week", ["stationId", "year", "week"]),

  // Weekly aggregated stats per station
  stationWeeklyStats: defineTable({
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),

    // Volumes totaux
    dwcCompliant: v.number(),
    dwcMisses: v.number(),
    failedAttempts: v.number(),
    iadcCompliant: v.number(),
    iadcNonCompliant: v.number(),

    // Compteurs drivers
    totalDrivers: v.number(),
    activeDrivers: v.number(),

    // Distribution tiers (comptés après calcul DWC%)
    tierDistribution: tierDistributionValidator,

    // Breakdowns station
    dwcBreakdown: v.optional(dwcBreakdownValidator),
    iadcBreakdown: v.optional(iadcBreakdownValidator),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_station_week", ["stationId", "year", "week"]),

  // Station delivery overview stats (from CSV import)
  stationDeliveryStats: defineTable({
    stationId: v.id("stations"),
    metricName: v.string(), // "Colis livrés", "DNR", etc.
    year: v.number(),
    week: v.number(),
    value: v.string(), // "24 436" (formatted)
    numericValue: v.optional(v.number()), // 24436 (parsed)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_station_week", ["stationId", "year", "week"])
    .index("by_station_metric_week", ["stationId", "metricName", "year", "week"]),

  driverAssociateStats: defineTable({
    stationId: v.id("stations"),
    driverId: v.id("drivers"),
    amazonId: v.string(),
    year: v.number(),
    week: v.number(),
    packagesDelivered: v.optional(v.number()),
    dnrCount: v.optional(v.number()),
    dnrDpmo: v.optional(v.number()),
    packagesShipped: v.optional(v.number()),
    rtsCount: v.optional(v.number()),
    rtsPercent: v.optional(v.number()),
    rtsDpmo: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_driver", ["driverId"])
    .index("by_station_week", ["stationId", "year", "week"])
    .index("by_station_driver_week", ["stationId", "driverId", "year", "week"]),

  driverRosterSnapshots: defineTable({
    stationId: v.id("stations"),
    driverId: v.optional(v.id("drivers")),
    year: v.number(),
    week: v.number(),
    name: v.string(),
    providerId: v.string(),
    dspName: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    onboardingTasks: v.optional(v.string()),
    status: rosterStatusValidator,
    serviceArea: v.optional(v.string()),
    matchMethod: rosterMatchMethodValidator,
    matchConfidence: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_driver", ["driverId"])
    .index("by_station_week", ["stationId", "year", "week"])
    .index("by_station_status_week", ["stationId", "status", "year", "week"]),

  // Coaching actions for drivers
  coachingActions: defineTable({
    driverId: v.id("drivers"),
    stationId: v.id("stations"),

    actionType: v.union(v.literal("discussion"), v.literal("warning"), v.literal("training"), v.literal("suspension")),
    status: v.union(v.literal("pending"), v.literal("improved"), v.literal("no_effect"), v.literal("escalated")),

    reason: v.string(),
    targetCategory: v.optional(v.string()),
    targetSubcategory: v.optional(v.string()),
    notes: v.optional(v.string()),

    // Métriques au moment de l'action
    dwcAtAction: v.number(),
    dwcAfterAction: v.optional(v.number()),

    // Dates
    followUpDate: v.optional(v.string()),
    evaluatedAt: v.optional(v.number()),
    evaluationNotes: v.optional(v.string()),

    // Escalade
    escalationDate: v.optional(v.string()),
    escalationNote: v.optional(v.string()),

    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_driver", ["driverId"])
    .index("by_station", ["stationId"])
    .index("by_station_status", ["stationId", "status"])
    .index("by_driver_status", ["driverId", "status"]),

  // Import history
  imports: defineTable({
    stationId: v.id("stations"),
    filename: v.string(),
    year: v.number(),
    week: v.number(),

    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed"),
    ),

    // Stats import
    driversImported: v.number(),
    dailyRecordsCount: v.optional(v.number()),
    weeklyRecordsCount: v.number(),
    newDriversCount: v.optional(v.number()),

    // Scores calculés (pour affichage rapide)
    dwcScore: v.optional(v.number()),
    iadcScore: v.optional(v.number()),
    tierDistribution: v.optional(tierDistributionValidator),

    // Erreurs
    errors: v.optional(v.array(v.string())),
    warnings: v.optional(v.array(v.string())),

    importedBy: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_station", ["stationId"])
    .index("by_station_week", ["stationId", "year", "week"])
    .index("by_status", ["status"]),

  automationRuns: defineTable({
    stationId: v.id("stations"),
    importId: v.optional(v.id("imports")),
    trigger: v.union(v.literal("amazon_ingest"), v.literal("manual"), v.literal("cron")),
    source: v.string(),
    status: automationRunStatusValidator,
    year: v.optional(v.number()),
    week: v.optional(v.number()),
    filename: v.optional(v.string()),
    reportStationCode: v.optional(v.string()),
    importedBy: v.optional(v.string()),
    artifactCount: v.number(),
    alertCount: v.number(),
    reportCount: v.number(),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_station", ["stationId"])
    .index("by_station_status", ["stationId", "status"])
    .index("by_station_week", ["stationId", "year", "week"]),

  sourceArtifacts: defineTable({
    stationId: v.id("stations"),
    runId: v.optional(v.id("automationRuns")),
    importId: v.optional(v.id("imports")),
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
    createdAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_run", ["runId"])
    .index("by_import", ["importId"])
    .index("by_station_week", ["stationId", "year", "week"]),

  decisionScores: defineTable({
    stationId: v.id("stations"),
    runId: v.optional(v.id("automationRuns")),
    importId: v.optional(v.id("imports")),
    driverId: v.optional(v.id("drivers")),
    year: v.optional(v.number()),
    week: v.optional(v.number()),
    decisionType: decisionTypeValidator,
    logicalChannel: logicalChannelValidator,
    title: v.string(),
    summary: v.string(),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    confidenceScore: v.number(),
    confidenceLevel: confidenceLevelValidator,
    status: decisionStatusValidator,
    targetPath: v.optional(v.string()),
    evidence: v.array(v.string()),
    recommendedAction: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_run", ["runId"])
    .index("by_station_week", ["stationId", "year", "week"])
    .index("by_station_channel", ["stationId", "logicalChannel"]),

  reportDeliveries: defineTable({
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
    pdfStatus: pdfStatusValidator,
    pdfPath: v.optional(v.string()),
    deliveryStatus: deliveryStatusValidator,
    targetPath: v.optional(v.string()),
    confidenceScore: v.number(),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
  })
    .index("by_station", ["stationId"])
    .index("by_run", ["runId"])
    .index("by_station_type", ["stationId", "reportType"])
    .index("by_station_week", ["stationId", "year", "week"]),

  stationAutomationConfigs: defineTable({
    stationId: v.id("stations"),
    enabled: v.boolean(),
    timezone: v.string(),
    autoApproveMinConfidence: v.number(),
    channelMappings: channelMappingsValidator,
    audiences: v.array(reportAudienceValidator),
    updatedBy: v.string(),
    updatedAt: v.number(),
  }).index("by_station", ["stationId"]),

  // WhatsApp settings per station
  whatsappSettings: defineTable({
    stationId: v.id("stations"),
    enabled: v.boolean(),
    sendDay: v.number(), // 0-6 (dimanche-samedi)
    sendHour: v.number(), // 0-23
    timezone: v.string(), // "Europe/Paris"
    updatedBy: v.string(), // Clerk user ID
    updatedAt: v.number(),
  }).index("by_station", ["stationId"]),

  // Alerts for KPI drops and other notifications
  alerts: defineTable({
    stationId: v.id("stations"),
    driverId: v.optional(v.id("drivers")), // Optional: driver-specific alerts
    type: v.union(
      v.literal("dwc_drop"), // DWC dropped > 5%
      v.literal("dwc_critical"), // DWC under 90%
      v.literal("coaching_pending"), // Coaching > 14 days pending
      v.literal("new_driver"), // New driver needs attention
      v.literal("tier_downgrade"), // Driver dropped tier
    ),
    severity: v.union(v.literal("warning"), v.literal("critical")),
    title: v.string(),
    message: v.string(),
    // Context data
    currentValue: v.optional(v.number()),
    previousValue: v.optional(v.number()),
    threshold: v.optional(v.number()),
    confidenceScore: v.optional(v.number()),
    confidenceLevel: v.optional(confidenceLevelValidator),
    logicalChannel: v.optional(logicalChannelValidator),
    targetPath: v.optional(v.string()),
    evidence: v.optional(v.array(v.string())),
    recommendedAction: v.optional(v.string()),
    sourceRunId: v.optional(v.id("automationRuns")),
    decisionScoreId: v.optional(v.id("decisionScores")),
    year: v.number(),
    week: v.number(),
    // Status
    isRead: v.boolean(),
    isDismissed: v.boolean(),
    dismissedBy: v.optional(v.string()),
    dismissedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_station_unread", ["stationId", "isRead"])
    .index("by_station_week", ["stationId", "year", "week"])
    .index("by_driver", ["driverId"]),

  // WhatsApp messages audit trail
  whatsappMessages: defineTable({
    stationId: v.id("stations"),
    driverId: v.id("drivers"),
    year: v.number(),
    week: v.number(),
    phoneNumber: v.string(),
    messageContent: v.string(),
    messageSid: v.optional(v.string()), // Twilio message SID
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("undelivered"),
    ),
    errorMessage: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_station_week", ["stationId", "year", "week"])
    .index("by_driver", ["driverId"])
    .index("by_status", ["status"]),
});
