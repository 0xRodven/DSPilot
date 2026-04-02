---
name: coaching-workflow
description: Implement driver coaching actions, escalation pipeline, and evaluation workflows. Use for coaching features, driver management, and performance improvement tracking.
allowed-tools: Read, Write, Edit
---

# Coaching Workflow Skill for DSPilot

## When to Use
- Creating/updating coaching actions
- Implementing escalation pipeline
- Building coaching calendar
- Displaying Kanban board
- Calculating coaching effectiveness

## Reference Implementation
Location: `/convex/coaching.ts`

## Action Types

| Type | Description | When to Use |
|------|-------------|-------------|
| `discussion` | Informal chat | First warning, minor issues |
| `warning` | Formal warning | Repeated issues |
| `training` | Remedial training | Skill gaps |
| `suspension` | Temp suspension | Serious issues, 3+ warnings |

```typescript
type ActionType = "discussion" | "warning" | "training" | "suspension"
```

## Action Statuses

| Status | Description | Next Steps |
|--------|-------------|------------|
| `pending` | Awaiting evaluation | Wait for follow-up date |
| `improved` | Performance improved | Close action |
| `no_effect` | No improvement | Consider escalation |
| `escalated` | Escalated to next level | Create new action |

```typescript
type ActionStatus = "pending" | "improved" | "no_effect" | "escalated"
```

## Escalation Pipeline

```
Stage 1: Discussion
    | no improvement
Stage 2: Warning #1
    | no improvement
Stage 3: Warning #2
    | no improvement
Stage 4: Warning #3
    | no improvement
Stage 5: Suspension
```

### Pipeline Stage Calculation
```typescript
function getPipelineStage(actions: CoachingAction[]): number {
  const warningCount = actions.filter(
    a => a.actionType === "warning" && a.status !== "improved"
  ).length

  if (actions.some(a => a.actionType === "suspension")) return 5
  if (warningCount >= 3) return 5
  if (warningCount >= 2) return 4
  if (warningCount >= 1) return 3
  if (actions.some(a => a.actionType === "discussion")) return 2
  return 1
}
```

## Data Schema

```typescript
// Convex schema for coachingActions table
coachingActions: defineTable({
  stationId: v.id("stations"),
  driverId: v.id("drivers"),
  actionType: v.string(),
  status: v.string(),
  reason: v.string(),
  targetCategory: v.optional(v.string()),
  targetSubcategory: v.optional(v.string()),
  dwcAtAction: v.number(),
  dwcAfterAction: v.optional(v.number()),
  notes: v.optional(v.string()),
  evaluationNotes: v.optional(v.string()),
  followUpDate: v.optional(v.string()),
  escalationDate: v.optional(v.string()),
  escalationNote: v.optional(v.string()),
  createdBy: v.string(),
  createdAt: v.number(),
  evaluatedAt: v.optional(v.number()),
})
  .index("by_driver", ["driverId"])
  .index("by_station", ["stationId"])
  .index("by_driver_status", ["driverId", "status"])
  .index("by_station_status", ["stationId", "status"])
```

## Enrichment on List

The `listCoachingActions` query enriches each action with additional driver data:
- **dwc**: The driver's current DWC percentage
- **tier**: The driver's current tier (fantastic/great/fair/poor)
- **waitingDays**: Number of days the action has been in `pending` status

## Kanban Board Structure

```typescript
interface KanbanColumn {
  id: "detect" | "waiting" | "evaluate"
  title: string
  actions: CoachingAction[]
}

// Column definitions
const columns: KanbanColumn[] = [
  {
    id: "detect",
    title: "A detecter",
    // Drivers with poor performance, no pending action
  },
  {
    id: "waiting",
    title: "En attente",
    // Actions with status = "pending"
  },
  {
    id: "evaluate",
    title: "A evaluer",
    // Actions past follow-up date
  },
]
```

## Coaching Suggestions Algorithm

```typescript
interface CoachingSuggestion {
  driverId: Id<"drivers">
  driverName: string
  dwcPercent: number
  tier: Tier
  mainIssue: string
  suggestedAction: ActionType
  priority: "high" | "medium" | "low"
}

function generateSuggestions(
  drivers: Driver[],
  existingActions: CoachingAction[]
): CoachingSuggestion[] {
  return drivers
    .filter(d => {
      const tier = getTier(d.dwcPercent)
      const hasPending = existingActions.some(
        a => a.driverId === d._id && a.status === "pending"
      )
      return (tier === "poor" || tier === "fair") && !hasPending
    })
    .map(d => ({
      driverId: d._id,
      driverName: d.name,
      dwcPercent: d.dwcPercent,
      tier: getTier(d.dwcPercent),
      mainIssue: identifyMainIssue(d.breakdown),
      suggestedAction: suggestAction(d),
      priority: d.dwcPercent < 85 ? "high" : "medium",
    }))
    .sort((a, b) => a.dwcPercent - b.dwcPercent)
}
```

## Follow-Up Date Logic

```typescript
// Default follow-up periods by action type
const followUpDays: Record<ActionType, number> = {
  discussion: 7,  // 1 week
  warning: 14,    // 2 weeks
  training: 21,   // 3 weeks
  suspension: 30, // 1 month
}

function getFollowUpDate(actionType: ActionType): string {
  const days = followUpDays[actionType]
  return dayjs().add(days, "day").format("YYYY-MM-DD")
}
```

## Overdue Calculation

```typescript
function isOverdue(action: CoachingAction): boolean {
  if (action.status !== "pending") return false
  if (!action.followUpDate) return false

  return dayjs(action.followUpDate).isBefore(dayjs(), "day")
}

function getDaysOverdue(action: CoachingAction): number {
  if (!isOverdue(action)) return 0
  return dayjs().diff(dayjs(action.followUpDate), "day")
}
```

## Effectiveness Metrics

```typescript
interface CoachingEffectiveness {
  successRate: number       // % of improved actions
  avgImprovement: number    // Avg DWC increase
  avgTimeToImprove: number  // Days to improvement
  escalationRate: number    // % that escalated
}

function calculateEffectiveness(
  actions: CoachingAction[]
): CoachingEffectiveness {
  const evaluated = actions.filter(a => a.status !== "pending")
  const improved = evaluated.filter(a => a.status === "improved")

  return {
    successRate: improved.length / evaluated.length * 100,
    avgImprovement: calculateAvgImprovement(improved),
    avgTimeToImprove: calculateAvgTime(improved),
    escalationRate: evaluated.filter(a => a.status === "escalated").length / evaluated.length * 100,
  }
}
```

## UI Patterns

### Action Modal
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Nouvelle action de coaching</DialogTitle>
    </DialogHeader>

    <Form>
      <Select name="actionType" options={actionTypes} />
      <Select name="reason" options={reasons} />
      <Textarea name="notes" />
      <DatePicker name="followUpDate" />
    </Form>

    <DialogFooter>
      <Button onClick={handleCreate}>Creer action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Status Badge
```tsx
const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-400",
  improved: "bg-emerald-500/20 text-emerald-400",
  no_effect: "bg-red-500/20 text-red-400",
  escalated: "bg-purple-500/20 text-purple-400",
}

<Badge className={statusColors[action.status]}>
  {statusLabels[action.status]}
</Badge>
```

## DO NOT
- Create actions without driverId
- Skip follow-up date assignment
- Allow evaluation before follow-up date
- Bypass permission checks
- Modify status directly (use mutations)
