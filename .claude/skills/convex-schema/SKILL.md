---
name: convex-schema
description: Complete reference of all DSPilot Convex tables, fields, indexes, and validators. Use when working with the database schema, creating queries, or adding new fields.
allowed-tools: Read, Write, Edit
---

# DSPilot Convex Schema Reference

Source: `/convex/schema.ts`

## Shared Validators

| Validator | Type | Values |
|---|---|---|
| `dwcBreakdownValidator` | `v.object` | `{ contactMiss, photoDefect, noPhoto, otpMiss, other }` (all `v.number()`) |
| `iadcBreakdownValidator` | `v.object` | `{ mailbox, unattended, safePlace, other }` (all `v.number()`) |
| `tierDistributionValidator` | `v.object` | `{ fantastic, great, fair, poor }` (all `v.number()`) |
| `confidenceLevelValidator` | `v.union` | `"low" \| "medium" \| "high"` |
| `automationRunStatusValidator` | `v.union` | `"pending" \| "running" \| "success" \| "partial" \| "failed"` |
| `logicalChannelValidator` | `v.union` | `"ops" \| "alerts" \| "reports_daily" \| "reports_weekly"` |
| `reportTypeValidator` | `v.union` | `"daily" \| "weekly"` |
| `reportAudienceValidator` | `v.union` | `"internal" \| "manager"` |
| `rosterStatusValidator` | `v.union` | `"ACTIVE" \| "ONBOARDING" \| "OFFBOARDED" \| "UNKNOWN"` |
| `rosterMatchMethodValidator` | `v.union` | `"normalized_name" \| "unmatched"` |
| `deliveryStatusValidator` | `v.union` | `"pending" \| "sent" \| "failed" \| "skipped"` |
| `pdfStatusValidator` | `v.union` | `"pending" \| "generated" \| "failed" \| "skipped"` |
| `decisionTypeValidator` | `v.union` | `"alert" \| "digest" \| "report_daily" \| "report_weekly"` |
| `decisionStatusValidator` | `v.union` | `"draft" \| "queued" \| "sent" \| "suppressed"` |
| `channelMappingsValidator` | `v.object` | `{ ops, alerts, reportsDaily, reportsWeekly }` (all `v.string()`) |

## Tables (19 total)

### 1. stations

| Field | Type | Notes |
|---|---|---|
| `code` | `v.string()` | e.g. "DIF1" |
| `name` | `v.string()` | e.g. "Paris Denfert" |
| `region` | `v.optional(v.string())` | |
| `organizationId` | `v.optional(v.string())` | Clerk org ID |
| `ownerId` | `v.string()` | Clerk user ID (creator) |
| `plan` | `v.union("free","pro","enterprise")` | |
| `createdAt` | `v.number()` | |

**Indexes:** `by_organization` [organizationId], `by_owner` [ownerId], `by_code` [code]

### 2. stationAccess

| Field | Type | Notes |
|---|---|---|
| `organizationId` | `v.string()` | Clerk org ID |
| `userId` | `v.string()` | Clerk user ID |
| `stationId` | `v.id("stations")` | FK -> stations |
| `role` | `v.union("manager","viewer")` | |
| `grantedBy` | `v.string()` | Who granted |
| `grantedAt` | `v.number()` | |

**Indexes:** `by_user` [userId], `by_station` [stationId], `by_org_user` [organizationId, userId]

### 3. drivers

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `amazonId` | `v.string()` | Transporter ID from CSV |
| `name` | `v.string()` | |
| `isActive` | `v.boolean()` | |
| `firstSeenWeek` | `v.optional(v.string())` | "2025-32" format |
| `phoneNumber` | `v.optional(v.string())` | E.164 format |
| `whatsappOptIn` | `v.optional(v.boolean())` | Explicit WhatsApp consent |
| `createdAt` | `v.number()` | |
| `updatedAt` | `v.number()` | |

**Indexes:** `by_station` [stationId], `by_station_amazon` [stationId, amazonId], `by_station_active` [stationId, isActive]

### 4. driverDailyStats

| Field | Type | Notes |
|---|---|---|
| `driverId` | `v.id("drivers")` | FK -> drivers |
| `stationId` | `v.id("stations")` | FK -> stations |
| `date` | `v.string()` | "2025-12-09" format |
| `year` | `v.number()` | |
| `week` | `v.number()` | |
| `dwcCompliant` | `v.number()` | Volume (not %) |
| `dwcMisses` | `v.number()` | Volume |
| `failedAttempts` | `v.number()` | Volume |
| `iadcCompliant` | `v.number()` | Volume |
| `iadcNonCompliant` | `v.number()` | Volume |
| `dwcBreakdown` | `v.optional(dwcBreakdownValidator)` | |
| `iadcBreakdown` | `v.optional(iadcBreakdownValidator)` | |
| `rtsCount` | `v.optional(v.number())` | Return to Station |
| `dnrCount` | `v.optional(v.number())` | Did Not Receive |
| `podFails` | `v.optional(v.number())` | Proof of Delivery fails |
| `ccFails` | `v.optional(v.number())` | Contact Compliance fails |
| `createdAt` | `v.number()` | |

**Indexes:** `by_driver_date` [driverId, date], `by_driver_week` [driverId, year, week], `by_station_date` [stationId, date], `by_station_week` [stationId, year, week]

### 5. driverWeeklyStats

| Field | Type | Notes |
|---|---|---|
| `driverId` | `v.id("drivers")` | FK -> drivers |
| `stationId` | `v.id("stations")` | FK -> stations |
| `year` | `v.number()` | |
| `week` | `v.number()` | |
| `dwcCompliant` | `v.number()` | Aggregated volume |
| `dwcMisses` | `v.number()` | Aggregated volume |
| `failedAttempts` | `v.number()` | Aggregated volume |
| `iadcCompliant` | `v.number()` | Aggregated volume |
| `iadcNonCompliant` | `v.number()` | Aggregated volume |
| `daysWorked` | `v.number()` | |
| `dwcBreakdown` | `v.optional(dwcBreakdownValidator)` | |
| `iadcBreakdown` | `v.optional(iadcBreakdownValidator)` | |
| `createdAt` | `v.number()` | |
| `updatedAt` | `v.number()` | |

**Indexes:** `by_driver` [driverId], `by_driver_week` [driverId, year, week], `by_station` [stationId], `by_station_week` [stationId, year, week]

### 6. stationWeeklyStats

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `year` | `v.number()` | |
| `week` | `v.number()` | |
| `dwcCompliant` | `v.number()` | Total volume |
| `dwcMisses` | `v.number()` | Total volume |
| `failedAttempts` | `v.number()` | Total volume |
| `iadcCompliant` | `v.number()` | Total volume |
| `iadcNonCompliant` | `v.number()` | Total volume |
| `totalDrivers` | `v.number()` | |
| `activeDrivers` | `v.number()` | |
| `tierDistribution` | `tierDistributionValidator` | { fantastic, great, fair, poor } |
| `dwcBreakdown` | `v.optional(dwcBreakdownValidator)` | |
| `iadcBreakdown` | `v.optional(iadcBreakdownValidator)` | |
| `createdAt` | `v.number()` | |
| `updatedAt` | `v.number()` | |

**Indexes:** `by_station` [stationId], `by_station_week` [stationId, year, week]

### 7. stationDeliveryStats

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `metricName` | `v.string()` | e.g. "Colis livres", "DNR" |
| `year` | `v.number()` | |
| `week` | `v.number()` | |
| `value` | `v.string()` | Formatted: "24 436" |
| `numericValue` | `v.optional(v.number())` | Parsed: 24436 |
| `createdAt` | `v.number()` | |
| `updatedAt` | `v.number()` | |

**Indexes:** `by_station` [stationId], `by_station_week` [stationId, year, week], `by_station_metric_week` [stationId, metricName, year, week]

### 8. driverAssociateStats

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `driverId` | `v.id("drivers")` | FK -> drivers |
| `amazonId` | `v.string()` | |
| `year` | `v.number()` | |
| `week` | `v.number()` | |
| `packagesDelivered` | `v.optional(v.number())` | |
| `dnrCount` | `v.optional(v.number())` | |
| `dnrDpmo` | `v.optional(v.number())` | |
| `packagesShipped` | `v.optional(v.number())` | |
| `rtsCount` | `v.optional(v.number())` | |
| `rtsPercent` | `v.optional(v.number())` | |
| `rtsDpmo` | `v.optional(v.number())` | |
| `createdAt` | `v.number()` | |
| `updatedAt` | `v.number()` | |

**Indexes:** `by_station` [stationId], `by_driver` [driverId], `by_station_week` [stationId, year, week], `by_station_driver_week` [stationId, driverId, year, week]

### 9. driverRosterSnapshots

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `driverId` | `v.optional(v.id("drivers"))` | FK -> drivers (optional, may be unmatched) |
| `year` | `v.number()` | |
| `week` | `v.number()` | |
| `name` | `v.string()` | |
| `providerId` | `v.string()` | |
| `dspName` | `v.optional(v.string())` | |
| `email` | `v.optional(v.string())` | |
| `phoneNumber` | `v.optional(v.string())` | |
| `onboardingTasks` | `v.optional(v.string())` | |
| `status` | `rosterStatusValidator` | ACTIVE/ONBOARDING/OFFBOARDED/UNKNOWN |
| `serviceArea` | `v.optional(v.string())` | |
| `matchMethod` | `rosterMatchMethodValidator` | normalized_name/unmatched |
| `matchConfidence` | `v.number()` | |
| `createdAt` | `v.number()` | |
| `updatedAt` | `v.number()` | |

**Indexes:** `by_station` [stationId], `by_driver` [driverId], `by_station_week` [stationId, year, week], `by_station_status_week` [stationId, status, year, week]

### 10. coachingActions

| Field | Type | Notes |
|---|---|---|
| `driverId` | `v.id("drivers")` | FK -> drivers |
| `stationId` | `v.id("stations")` | FK -> stations |
| `actionType` | `v.union("discussion","warning","training","suspension")` | |
| `status` | `v.union("pending","improved","no_effect","escalated")` | |
| `reason` | `v.string()` | |
| `targetCategory` | `v.optional(v.string())` | |
| `targetSubcategory` | `v.optional(v.string())` | |
| `notes` | `v.optional(v.string())` | |
| `dwcAtAction` | `v.number()` | DWC% at time of action |
| `dwcAfterAction` | `v.optional(v.number())` | DWC% after evaluation |
| `followUpDate` | `v.optional(v.string())` | |
| `evaluatedAt` | `v.optional(v.number())` | |
| `evaluationNotes` | `v.optional(v.string())` | |
| `escalationDate` | `v.optional(v.string())` | |
| `escalationNote` | `v.optional(v.string())` | |
| `createdBy` | `v.string()` | |
| `createdAt` | `v.number()` | |
| `updatedAt` | `v.number()` | |

**Indexes:** `by_driver` [driverId], `by_station` [stationId], `by_station_status` [stationId, status], `by_driver_status` [driverId, status]

### 11. imports

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `filename` | `v.string()` | |
| `year` | `v.number()` | |
| `week` | `v.number()` | |
| `status` | `v.union("pending","processing","success","partial","failed")` | |
| `driversImported` | `v.number()` | |
| `dailyRecordsCount` | `v.optional(v.number())` | |
| `weeklyRecordsCount` | `v.number()` | |
| `newDriversCount` | `v.optional(v.number())` | |
| `dwcScore` | `v.optional(v.number())` | Computed for quick display |
| `iadcScore` | `v.optional(v.number())` | Computed for quick display |
| `tierDistribution` | `v.optional(tierDistributionValidator)` | |
| `errors` | `v.optional(v.array(v.string()))` | |
| `warnings` | `v.optional(v.array(v.string()))` | |
| `importedBy` | `v.string()` | |
| `createdAt` | `v.number()` | |
| `completedAt` | `v.optional(v.number())` | |

**Indexes:** `by_station` [stationId], `by_station_week` [stationId, year, week], `by_status` [status]

### 12. automationRuns

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `importId` | `v.optional(v.id("imports"))` | FK -> imports |
| `trigger` | `v.union("amazon_ingest","manual","cron")` | |
| `source` | `v.string()` | |
| `status` | `automationRunStatusValidator` | |
| `year` | `v.optional(v.number())` | |
| `week` | `v.optional(v.number())` | |
| `filename` | `v.optional(v.string())` | |
| `reportStationCode` | `v.optional(v.string())` | |
| `importedBy` | `v.optional(v.string())` | |
| `artifactCount` | `v.number()` | |
| `alertCount` | `v.number()` | |
| `reportCount` | `v.number()` | |
| `summary` | `v.optional(v.string())` | |
| `error` | `v.optional(v.string())` | |
| `startedAt` | `v.number()` | |
| `completedAt` | `v.optional(v.number())` | |

**Indexes:** `by_station` [stationId], `by_station_status` [stationId, status], `by_station_week` [stationId, year, week]

### 13. sourceArtifacts

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `runId` | `v.optional(v.id("automationRuns"))` | FK -> automationRuns |
| `importId` | `v.optional(v.id("imports"))` | FK -> imports |
| `artifactType` | `v.string()` | |
| `logicalSource` | `v.string()` | |
| `filename` | `v.string()` | |
| `storagePath` | `v.string()` | |
| `mimeType` | `v.optional(v.string())` | |
| `sizeBytes` | `v.optional(v.number())` | |
| `sha256` | `v.optional(v.string())` | |
| `stationCode` | `v.optional(v.string())` | |
| `year` | `v.optional(v.number())` | |
| `week` | `v.optional(v.number())` | |
| `createdAt` | `v.number()` | |

**Indexes:** `by_station` [stationId], `by_run` [runId], `by_import` [importId], `by_station_week` [stationId, year, week]

### 14. decisionScores

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `runId` | `v.optional(v.id("automationRuns"))` | FK -> automationRuns |
| `importId` | `v.optional(v.id("imports"))` | FK -> imports |
| `driverId` | `v.optional(v.id("drivers"))` | FK -> drivers |
| `year` | `v.optional(v.number())` | |
| `week` | `v.optional(v.number())` | |
| `decisionType` | `decisionTypeValidator` | |
| `logicalChannel` | `logicalChannelValidator` | |
| `title` | `v.string()` | |
| `summary` | `v.string()` | |
| `severity` | `v.union("info","warning","critical")` | |
| `confidenceScore` | `v.number()` | |
| `confidenceLevel` | `confidenceLevelValidator` | |
| `status` | `decisionStatusValidator` | |
| `targetPath` | `v.optional(v.string())` | |
| `evidence` | `v.array(v.string())` | |
| `recommendedAction` | `v.optional(v.string())` | |
| `createdAt` | `v.number()` | |

**Indexes:** `by_station` [stationId], `by_run` [runId], `by_station_week` [stationId, year, week], `by_station_channel` [stationId, logicalChannel]

### 15. reportDeliveries

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `runId` | `v.optional(v.id("automationRuns"))` | FK -> automationRuns |
| `importId` | `v.optional(v.id("imports"))` | FK -> imports |
| `reportType` | `reportTypeValidator` | daily/weekly |
| `logicalChannel` | `logicalChannelValidator` | |
| `audience` | `reportAudienceValidator` | internal/manager |
| `periodLabel` | `v.string()` | |
| `year` | `v.optional(v.number())` | |
| `week` | `v.optional(v.number())` | |
| `title` | `v.string()` | |
| `summary` | `v.string()` | |
| `asciiContent` | `v.string()` | |
| `htmlContent` | `v.string()` | |
| `pdfStatus` | `pdfStatusValidator` | |
| `pdfPath` | `v.optional(v.string())` | |
| `deliveryStatus` | `deliveryStatusValidator` | |
| `targetPath` | `v.optional(v.string())` | |
| `confidenceScore` | `v.number()` | |
| `createdAt` | `v.number()` | |
| `sentAt` | `v.optional(v.number())` | |

**Indexes:** `by_station` [stationId], `by_run` [runId], `by_station_type` [stationId, reportType], `by_station_week` [stationId, year, week]

### 16. stationAutomationConfigs

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `enabled` | `v.boolean()` | |
| `timezone` | `v.string()` | |
| `autoApproveMinConfidence` | `v.number()` | |
| `channelMappings` | `channelMappingsValidator` | { ops, alerts, reportsDaily, reportsWeekly } |
| `audiences` | `v.array(reportAudienceValidator)` | |
| `updatedBy` | `v.string()` | |
| `updatedAt` | `v.number()` | |

**Indexes:** `by_station` [stationId]

### 17. whatsappSettings

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `enabled` | `v.boolean()` | |
| `sendDay` | `v.number()` | 0-6 (Sunday-Saturday) |
| `sendHour` | `v.number()` | 0-23 |
| `timezone` | `v.string()` | e.g. "Europe/Paris" |
| `updatedBy` | `v.string()` | Clerk user ID |
| `updatedAt` | `v.number()` | |

**Indexes:** `by_station` [stationId]

### 18. alerts

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `driverId` | `v.optional(v.id("drivers"))` | FK -> drivers (optional) |
| `type` | `v.union("dwc_drop","dwc_critical","coaching_pending","new_driver","tier_downgrade")` | |
| `severity` | `v.union("warning","critical")` | |
| `title` | `v.string()` | |
| `message` | `v.string()` | |
| `currentValue` | `v.optional(v.number())` | |
| `previousValue` | `v.optional(v.number())` | |
| `threshold` | `v.optional(v.number())` | |
| `confidenceScore` | `v.optional(v.number())` | |
| `confidenceLevel` | `v.optional(confidenceLevelValidator)` | |
| `logicalChannel` | `v.optional(logicalChannelValidator)` | |
| `targetPath` | `v.optional(v.string())` | |
| `evidence` | `v.optional(v.array(v.string()))` | |
| `recommendedAction` | `v.optional(v.string())` | |
| `sourceRunId` | `v.optional(v.id("automationRuns"))` | FK -> automationRuns |
| `decisionScoreId` | `v.optional(v.id("decisionScores"))` | FK -> decisionScores |
| `year` | `v.number()` | |
| `week` | `v.number()` | |
| `isRead` | `v.boolean()` | |
| `isDismissed` | `v.boolean()` | |
| `dismissedBy` | `v.optional(v.string())` | |
| `dismissedAt` | `v.optional(v.number())` | |
| `createdAt` | `v.number()` | |

**Indexes:** `by_station` [stationId], `by_station_unread` [stationId, isRead], `by_station_week` [stationId, year, week], `by_driver` [driverId]

### 19. whatsappMessages

| Field | Type | Notes |
|---|---|---|
| `stationId` | `v.id("stations")` | FK -> stations |
| `driverId` | `v.id("drivers")` | FK -> drivers |
| `year` | `v.number()` | |
| `week` | `v.number()` | |
| `phoneNumber` | `v.string()` | |
| `messageContent` | `v.string()` | |
| `messageSid` | `v.optional(v.string())` | Twilio message SID |
| `status` | `v.union("pending","sent","delivered","failed","undelivered")` | |
| `errorMessage` | `v.optional(v.string())` | |
| `sentAt` | `v.optional(v.number())` | |
| `deliveredAt` | `v.optional(v.number())` | |
| `createdAt` | `v.number()` | |

**Indexes:** `by_station_week` [stationId, year, week], `by_driver` [driverId], `by_status` [status]

## Table Relationships (Foreign Keys)

```
stations (root)
  |
  +-- stationAccess.stationId
  +-- drivers.stationId
  |     +-- driverDailyStats.driverId
  |     +-- driverWeeklyStats.driverId
  |     +-- driverAssociateStats.driverId
  |     +-- driverRosterSnapshots.driverId (optional)
  |     +-- coachingActions.driverId
  |     +-- whatsappMessages.driverId
  |     +-- decisionScores.driverId (optional)
  |     +-- alerts.driverId (optional)
  |
  +-- driverDailyStats.stationId
  +-- driverWeeklyStats.stationId
  +-- stationWeeklyStats.stationId
  +-- stationDeliveryStats.stationId
  +-- driverAssociateStats.stationId
  +-- driverRosterSnapshots.stationId
  +-- coachingActions.stationId
  +-- imports.stationId
  |     +-- automationRuns.importId (optional)
  |     +-- sourceArtifacts.importId (optional)
  |     +-- decisionScores.importId (optional)
  |     +-- reportDeliveries.importId (optional)
  |
  +-- automationRuns.stationId
  |     +-- sourceArtifacts.runId (optional)
  |     +-- decisionScores.runId (optional)
  |     +-- reportDeliveries.runId (optional)
  |     +-- alerts.sourceRunId (optional)
  |
  +-- decisionScores.stationId
  |     +-- alerts.decisionScoreId (optional)
  |
  +-- reportDeliveries.stationId
  +-- stationAutomationConfigs.stationId
  +-- whatsappSettings.stationId
  +-- alerts.stationId
  +-- whatsappMessages.stationId
```

Every data table has `stationId` as a foreign key to `stations`. Most time-series tables also have a `by_station_week` index on `[stationId, year, week]`.

## DO NOT

- **Do NOT store percentages** in daily/weekly stats tables. Store raw volumes (compliant, misses, nonCompliant) and compute percentages at query time using `computeDwcPercent()` / `computeIadcPercent()`.
- **Do NOT add fields without a validator.** Every union/enum field must use a shared validator defined at the top of schema.ts.
- **Do NOT create new tables without a `stationId` foreign key.** All data is scoped to a station for multi-tenancy.
- **Do NOT use `v.id("tableName")` without also adding the corresponding index** (at minimum `by_station` for any station-scoped table).
- **Do NOT duplicate data across daily and weekly tables manually.** Weekly tables are computed by aggregation during import.
- **Do NOT add `organizationId` to data tables.** Station-level scoping is sufficient; org scoping is only on `stations` and `stationAccess`.
- **Do NOT use ISO week numbering in the schema.** Amazon uses Sunday-Saturday weeks. The `year` + `week` fields follow Amazon's convention.
