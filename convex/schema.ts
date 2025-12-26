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

export default defineSchema({
  // Stations (DSP delivery stations)
  stations: defineTable({
    code: v.string(), // "DIF1"
    name: v.string(), // "Paris Denfert"
    region: v.optional(v.string()),
    ownerId: v.string(), // Clerk user ID
    plan: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_code", ["code"]),

  // Drivers
  drivers: defineTable({
    stationId: v.id("stations"),
    amazonId: v.string(), // Transporter ID du CSV
    name: v.string(),
    isActive: v.boolean(),
    firstSeenWeek: v.optional(v.string()), // "2025-32" pour activeSince
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

  // Coaching actions for drivers
  coachingActions: defineTable({
    driverId: v.id("drivers"),
    stationId: v.id("stations"),

    actionType: v.union(
      v.literal("discussion"),
      v.literal("warning"),
      v.literal("training"),
      v.literal("suspension")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("improved"),
      v.literal("no_effect"),
      v.literal("escalated")
    ),

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
      v.literal("failed")
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
});
