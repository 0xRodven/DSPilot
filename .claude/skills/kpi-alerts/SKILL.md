---
name: kpi-alerts
description: Create and manage KPI alerts for DWC drops, tier downgrades, and coaching deadlines. Use for alert system features, notification UI, and post-import alert generation.
allowed-tools: Read, Write, Edit
---

# KPI Alerts Skill for DSPilot

## When to Use
- Implementing alert generation logic
- Building alert notification UI
- Creating alert badges/counters
- Managing alert lifecycle (read/dismiss)
- Post-import alert processing
- Working with the confidence scoring system

## Reference Implementation
- `/convex/alerts.ts` - Alert mutations and queries
- `/convex/lib/automationPolicy.ts` - Confidence scoring and qualify functions

## Alert Types

| Type | Description | Trigger Condition |
|------|-------------|-------------------|
| `dwc_drop` | Significant DWC decrease | DWC dropped >= 5% week-over-week |
| `dwc_critical` | Critical performance | DWC < 90% (poor tier) |
| `coaching_pending` | Coaching overdue | Pending action > 14 days |
| `new_driver` | New driver detected | First week of data |
| `tier_downgrade` | Tier regression | Tier changed to lower level |

```typescript
type AlertType =
  | "dwc_drop"
  | "dwc_critical"
  | "coaching_pending"
  | "new_driver"
  | "tier_downgrade"
```

## Alert Severity

| Severity | Visual | Use Case |
|----------|--------|----------|
| `warning` | Yellow | Attention needed |
| `critical` | Red | Immediate action required |

```typescript
type AlertSeverity = "warning" | "critical"

// Severity by alert type
const alertSeverity: Record<AlertType, AlertSeverity> = {
  dwc_drop: "warning",
  dwc_critical: "critical",
  coaching_pending: "warning",
  new_driver: "warning",
  tier_downgrade: "critical",
}
```

## Confidence Scoring System (automationPolicy.ts)

All alerts are scored for confidence before creation. The system uses `QualifiedAlertCandidate` objects enriched with evidence and recommended actions.

### Types

```typescript
type AutomationSeverity = "info" | "warning" | "critical"
type AutomationConfidenceLevel = "low" | "medium" | "high"
type AutomationDecisionType = "alert" | "digest" | "report_daily" | "report_weekly"
type LogicalChannel = "ops" | "alerts" | "reports_daily" | "reports_weekly"

type AlertEvidence = {
  label: string
  value: string
}

type QualifiedAlertCandidate = {
  type: "dwc_drop" | "dwc_critical" | "coaching_pending" | "new_driver" | "tier_downgrade"
  severity: Exclude<AutomationSeverity, "info">
  title: string
  message: string
  summary: string
  confidenceScore: number
  confidenceLevel: AutomationConfidenceLevel
  logicalChannel: LogicalChannel
  evidence: AlertEvidence[]
  recommendedAction: string
  targetPath?: string
  currentValue?: number
  previousValue?: number
  threshold?: number
}
```

### toConfidenceLevel()

```typescript
function toConfidenceLevel(score: number): AutomationConfidenceLevel {
  if (score >= 0.85) return "high"
  if (score >= 0.65) return "medium"
  return "low"
}
```

### shouldAutoSend()

```typescript
function shouldAutoSend(confidenceScore: number, minConfidence: number): boolean {
  return confidenceScore >= minConfidence
}
```

### Qualify Functions and Confidence Scores

#### 1. qualifyDwcCriticalAlert
- DWC < 88%: severity `"critical"`, confidence `0.96`
- DWC < 90% but >= 88%: severity `"warning"`, confidence `0.90`
- logicalChannel: `"alerts"`

#### 2. qualifyDwcDropAlert
- Drop >= 10 points: severity `"critical"`, confidence `0.92`
- Drop >= 5 but < 10: severity `"warning"`, confidence `0.82`
- logicalChannel: `"alerts"`

#### 3. qualifyTierDowngradeAlert
- Current tier is `"poor"`: severity `"critical"`, confidence `0.90`
- Otherwise: severity `"warning"`, confidence `0.78`
- logicalChannel: `"alerts"`

#### 4. qualifyNewDriverAlert
- Always severity `"warning"`, confidence `0.72`
- logicalChannel: `"alerts"`

#### 5. qualifyCoachingPendingAlert
- Days pending > 21: severity `"critical"`, confidence `0.88`
- Days pending <= 21: severity `"warning"`, confidence `0.76`
- logicalChannel: `"ops"`

## Data Schema

```typescript
// Convex schema for alerts table
alerts: defineTable({
  stationId: v.id("stations"),
  driverId: v.optional(v.id("drivers")),
  alertType: v.string(),
  severity: v.string(),
  title: v.string(),
  message: v.string(),
  year: v.number(),
  week: v.number(),
  isRead: v.boolean(),
  isDismissed: v.boolean(),
  dismissedBy: v.optional(v.string()),
  dismissedAt: v.optional(v.number()),
  createdAt: v.number(),
  confidenceScore: v.optional(v.number()),
  confidenceLevel: v.optional(v.string()),
  logicalChannel: v.optional(v.string()),
  targetPath: v.optional(v.string()),
  evidence: v.optional(v.array(v.object({
    label: v.string(),
    value: v.string(),
  }))),
  recommendedAction: v.optional(v.string()),
  sourceRunId: v.optional(v.string()),
  decisionScoreId: v.optional(v.id("decisionScores")),
  metadata: v.optional(v.object({
    previousDwc: v.optional(v.number()),
    currentDwc: v.optional(v.number()),
    previousTier: v.optional(v.string()),
    currentTier: v.optional(v.string()),
    coachingActionId: v.optional(v.id("coachingActions")),
  })),
})
  .index("by_station", ["stationId"])
  .index("by_station_unread", ["stationId", "isRead"])
  .index("by_station_week", ["stationId", "year", "week"])
```

## decisionScores Table Integration

Alerts can reference an entry in the `decisionScores` table via the `decisionScoreId` field. This table logs every automation decision for audit and traceability.

```typescript
decisionScores: defineTable({
  stationId: v.id("stations"),
  decisionType: v.string(),         // "alert" | "digest" | "report_daily" | "report_weekly"
  alertType: v.optional(v.string()),
  confidenceScore: v.number(),
  confidenceLevel: v.string(),
  logicalChannel: v.string(),
  autoSent: v.boolean(),
  createdAt: v.number(),
})
  .index("by_station", ["stationId"])
```

## Alert Generation Logic

### Post-Import Alert Generation
```typescript
export const generateAlertsForImport = internalMutation({
  args: {
    stationId: v.id("stations"),
    year: v.number(),
    week: v.number(),
  },
  handler: async (ctx, { stationId, year, week }) => {
    // Get current week stats
    const currentStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", q =>
        q.eq("stationId", stationId).eq("year", year).eq("week", week)
      )
      .collect()

    // Get previous week stats
    const prevWeek = week === 1 ? { year: year - 1, week: 52 } : { year, week: week - 1 }
    const previousStats = await ctx.db
      .query("driverWeeklyStats")
      .withIndex("by_station_week", q =>
        q.eq("stationId", stationId).eq("year", prevWeek.year).eq("week", prevWeek.week)
      )
      .collect()

    const previousMap = new Map(previousStats.map(s => [s.driverId, s]))

    for (const stat of currentStats) {
      const currentDwc = calculateDwcPercent(stat)
      const currentTier = getTier(currentDwc)
      const previous = previousMap.get(stat.driverId)

      // Check for new driver
      if (!previous) {
        await createAlert(ctx, {
          stationId,
          driverId: stat.driverId,
          alertType: "new_driver",
          year,
          week,
        })
        continue
      }

      const previousDwc = calculateDwcPercent(previous)
      const previousTier = getTier(previousDwc)

      // Check for DWC drop (>= 5%)
      if (previousDwc - currentDwc >= 5) {
        await createAlert(ctx, {
          stationId,
          driverId: stat.driverId,
          alertType: "dwc_drop",
          year,
          week,
          metadata: { previousDwc, currentDwc },
        })
      }

      // Check for critical DWC
      if (currentDwc < 90 && previousDwc >= 90) {
        await createAlert(ctx, {
          stationId,
          driverId: stat.driverId,
          alertType: "dwc_critical",
          year,
          week,
          metadata: { previousDwc, currentDwc },
        })
      }

      // Check for tier downgrade
      if (tierRank(currentTier) < tierRank(previousTier)) {
        await createAlert(ctx, {
          stationId,
          driverId: stat.driverId,
          alertType: "tier_downgrade",
          year,
          week,
          metadata: { previousTier, currentTier },
        })
      }
    }
  },
})
```

### Duplicate Prevention
```typescript
async function alertExists(
  ctx: MutationCtx,
  stationId: Id<"stations">,
  driverId: Id<"drivers"> | undefined,
  alertType: AlertType,
  year: number,
  week: number
): Promise<boolean> {
  const existing = await ctx.db
    .query("alerts")
    .withIndex("by_station_week", q =>
      q.eq("stationId", stationId).eq("year", year).eq("week", week)
    )
    .filter(q =>
      q.and(
        q.eq(q.field("alertType"), alertType),
        driverId ? q.eq(q.field("driverId"), driverId) : true
      )
    )
    .first()

  return existing !== null
}
```

## Alert Title/Message Templates

```typescript
const alertTemplates: Record<AlertType, { title: string; message: (data: any) => string }> = {
  dwc_drop: {
    title: "Baisse DWC significative",
    message: (d) => `DWC passe de ${d.previousDwc.toFixed(1)}% a ${d.currentDwc.toFixed(1)}% (-${(d.previousDwc - d.currentDwc).toFixed(1)}%)`,
  },
  dwc_critical: {
    title: "Performance critique",
    message: (d) => `DWC a ${d.currentDwc.toFixed(1)}% - Action de coaching recommandee`,
  },
  coaching_pending: {
    title: "Action de coaching en retard",
    message: (d) => `L'action de coaching est en attente depuis ${d.daysOverdue} jours`,
  },
  new_driver: {
    title: "Nouveau chauffeur detecte",
    message: () => "Premiere semaine de donnees importees",
  },
  tier_downgrade: {
    title: "Regression de tier",
    message: (d) => `Passage de ${d.previousTier} a ${d.currentTier}`,
  },
}
```

## UI Components

### Alert Badge (Header)
```tsx
function AlertBadge({ stationId }: { stationId: Id<"stations"> }) {
  const count = useQuery(api.alerts.getAlertCount, { stationId })

  if (!count || count === 0) return null

  return (
    <Badge variant="destructive" className="ml-2">
      {count > 99 ? "99+" : count}
    </Badge>
  )
}
```

### Alert List
```tsx
function AlertList({ stationId }: { stationId: Id<"stations"> }) {
  const alerts = useQuery(api.alerts.getUnreadAlerts, { stationId })
  const markAsRead = useMutation(api.alerts.markAsRead)
  const dismiss = useMutation(api.alerts.dismissAlert)

  return (
    <div className="space-y-2">
      {alerts?.map(alert => (
        <Card
          key={alert._id}
          className={cn(
            "p-4",
            alert.severity === "critical" && "border-red-500",
            alert.severity === "warning" && "border-amber-500"
          )}
        >
          <div className="flex justify-between">
            <div>
              <h4 className="font-medium">{alert.title}</h4>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              {alert.driverName && (
                <p className="text-sm">Chauffeur: {alert.driverName}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markAsRead({ alertId: alert._id })}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismiss({ alertId: alert._id })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

### Alert Dropdown (Header)
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      <AlertBadge stationId={stationId} />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-80">
    <AlertList stationId={stationId} />
  </DropdownMenuContent>
</DropdownMenu>
```

## Thresholds

```typescript
const ALERT_THRESHOLDS = {
  DWC_DROP_PERCENT: 5,        // Alert if DWC drops 5% or more
  DWC_CRITICAL: 90,           // Alert if DWC below 90%
  COACHING_OVERDUE_DAYS: 14,  // Alert if coaching pending > 14 days
}
```

## DO NOT
- Create duplicate alerts for same driver/week/type
- Generate alerts for future weeks
- Skip permission checks on mutations
- Show dismissed alerts in main feed
- Expose alert IDs to unauthorized users
