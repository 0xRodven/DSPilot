---
name: automation-pipeline
description: Full import-to-delivery automation pipeline for DSPilot. Covers alert generation, confidence scoring, decision scores, and report delivery. Use when working with post-import automation or alert system.
allowed-tools: Read, Write, Edit
---

# Automation Pipeline

## Pipeline Flow

```
HTML parse -> import -> stats -> alert generation -> decision scoring -> report delivery
```

1. **HTML parse**: Amazon HTML report is parsed client-side (or via automation ingest action) into `ParsedReport`
2. **Import**: `createImport` / `createAutomationImport` creates an import record, then `applyAutomationParsedReport` upserts drivers, daily stats, weekly stats, and station stats
3. **Stats**: `bulkUpsertDailyStats`, `bulkUpsertWeeklyStats`, `updateStationWeeklyStats` persist the parsed numbers
4. **Alert generation**: `generateQualifiedAlertsInternal` (or `generateAlerts`) runs qualification functions against current vs. previous week stats. Scheduled post-import via `ctx.scheduler.runAfter`
5. **Decision scoring**: Each qualified alert produces a `decisionScores` row with confidence score, severity, and status
6. **Report delivery**: `reportDeliveries` records track sent digests/reports routed through logical channels

## Tables

| Table | Purpose |
|---|---|
| `automationRuns` | Top-level run record per automation trigger (amazon_ingest, manual, cron) |
| `sourceArtifacts` | Raw files/artifacts attached to a run (indexed by `by_run`) |
| `decisionScores` | Per-driver confidence-scored decisions (alert, digest, report_daily, report_weekly) |
| `reportDeliveries` | Delivery tracking for sent reports |
| `stationAutomationConfigs` | Per-station automation settings (min confidence, enabled channels) |
| `alerts` | Generated alerts with severity, confidence, evidence, and read/dismiss state |

## QualifiedAlertCandidate Type

Defined in `convex/lib/automationPolicy.ts`:

```ts
type QualifiedAlertCandidate = {
  type: "dwc_drop" | "dwc_critical" | "coaching_pending" | "new_driver" | "tier_downgrade";
  severity: "warning" | "critical";
  title: string;
  message: string;
  summary: string;
  confidenceScore: number;
  confidenceLevel: "low" | "medium" | "high";
  logicalChannel: "ops" | "alerts" | "reports_daily" | "reports_weekly";
  evidence: { label: string; value: string }[];
  recommendedAction: string;
  targetPath?: string;
  currentValue?: number;
  previousValue?: number;
  threshold?: number;
};
```

## Qualify Functions

All 5 functions live in `convex/lib/automationPolicy.ts` and return a `QualifiedAlertCandidate`.

### qualifyDwcCriticalAlert

Triggers when DWC < 90%.

| Condition | Severity | Confidence Score |
|---|---|---|
| `dwcPercent < 88` | critical | 0.96 |
| `dwcPercent >= 88` (but < 90) | warning | 0.90 |

Channel: `alerts`

### qualifyDwcDropAlert

Triggers when week-over-week DWC drop > 5 points.

| Condition | Severity | Confidence Score |
|---|---|---|
| `drop >= 10` | critical | 0.92 |
| `drop < 10` (but > 5) | warning | 0.82 |

Channel: `alerts`

### qualifyTierDowngradeAlert

Triggers when the driver's tier rank worsens (e.g., great -> fair). Uses `getTier()` on current and previous DWC.

| Condition | Severity | Confidence Score |
|---|---|---|
| `currentTier === "poor"` | critical | 0.90 |
| `currentTier !== "poor"` | warning | 0.78 |

Channel: `alerts`

### qualifyNewDriverAlert

Triggers when a driver has no previous-week stats (first appearance).

| Condition | Severity | Confidence Score |
|---|---|---|
| Always | warning | 0.72 |

Channel: `alerts`

### qualifyCoachingPendingAlert

Triggers for coaching actions with status `"pending"` older than 14 days.

| Condition | Severity | Confidence Score |
|---|---|---|
| `daysPending > 21` | critical | 0.88 |
| `daysPending <= 21` (but > 14) | warning | 0.76 |

Channel: `ops`

## toConfidenceLevel()

Converts a numeric confidence score to a categorical level:

```
score >= 0.85  ->  "high"
score >= 0.65  ->  "medium"
score <  0.65  ->  "low"
```

## shouldAutoSend()

```ts
function shouldAutoSend(confidenceScore: number, minConfidence: number): boolean {
  return confidenceScore >= minConfidence;
}
```

Used by the delivery layer to decide whether an alert/report should be sent automatically based on the station's configured minimum confidence threshold.

## Logical Channels

| Channel | Purpose |
|---|---|
| `ops` | Operational alerts (e.g., coaching_pending) |
| `alerts` | Performance alerts (DWC critical, DWC drop, tier downgrade, new driver) |
| `reports_daily` | Daily digest reports |
| `reports_weekly` | Weekly recap reports |

## DO NOT

- Do not call qualify functions without checking for duplicate alerts first. The `createQualifiedAlerts` function builds a `Set` of `"driverId:type"` keys from existing week alerts to skip duplicates.
- Do not bypass the `buildCandidate` helper -- it attaches `confidenceLevel` via `toConfidenceLevel()`. Always use it.
- Do not hardcode confidence thresholds for auto-send. Read the station's `stationAutomationConfigs` for the configured `minConfidence`.
- Do not mix up `AutomationSeverity` (includes `"info"`) with alert severity (only `"warning" | "critical"`). `QualifiedAlertCandidate.severity` excludes `"info"`.
- Do not forget that `qualifyCoachingPendingAlert` uses the `"ops"` channel, not `"alerts"` like the other four functions.
- Do not create alerts without also inserting a `decisionScores` row when `runId` or `importId` is available. The two records are linked via `decisionScoreId`.
