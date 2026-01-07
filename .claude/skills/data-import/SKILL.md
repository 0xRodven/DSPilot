---
name: data-import
description: Validate and process Amazon data imports, manage import lifecycle, and handle cascade deletions. Use for import-related features, validation, and data management.
allowed-tools: Read, Write, Edit
---

# Data Import Skill for DSPilot

## When to Use
- Implementing import wizard
- Validating uploaded data
- Managing import lifecycle
- Handling re-imports (replace existing)
- Building import history UI

## Reference Implementation
Location: `/convex/imports.ts`

## Import Lifecycle

```
upload → pending → processing → success
                            ↘ partial (with warnings)
                            ↘ failed (with errors)
```

```typescript
type ImportStatus = "pending" | "processing" | "success" | "partial" | "failed"
```

## Data Schema

```typescript
// Convex schema for imports table
imports: defineTable({
  stationId: v.id("stations"),
  filename: v.string(),
  status: v.string(),
  year: v.number(),
  week: v.number(),

  // Counts
  driverCount: v.number(),
  dailyStatsCount: v.number(),
  weeklyStatsCount: v.number(),

  // Tier distribution at import time
  tierDistribution: v.object({
    fantastic: v.number(),
    great: v.number(),
    fair: v.number(),
    poor: v.number(),
  }),

  // Errors and warnings
  errors: v.array(v.string()),
  warnings: v.array(v.string()),

  // Metadata
  importedBy: v.string(),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_station", ["stationId"])
  .index("by_station_week", ["stationId", "year", "week"])
  .index("by_status", ["status"])
```

## Import Process Flow

```typescript
// Step 1: Create import record
const importId = await ctx.db.insert("imports", {
  stationId,
  filename,
  status: "pending",
  year,
  week,
  driverCount: 0,
  dailyStatsCount: 0,
  weeklyStatsCount: 0,
  tierDistribution: { fantastic: 0, great: 0, fair: 0, poor: 0 },
  errors: [],
  warnings: [],
  importedBy: userId,
  createdAt: Date.now(),
})

// Step 2: Update to processing
await ctx.db.patch(importId, { status: "processing" })

// Step 3: Process data
try {
  // Delete existing data for this week (if re-import)
  await deleteExistingData(ctx, stationId, year, week)

  // Insert new drivers
  for (const driver of parsedReport.transporterIds) {
    await upsertDriver(ctx, stationId, driver)
  }

  // Insert daily stats
  for (const stat of parsedReport.dailyStats) {
    await ctx.db.insert("driverDailyStats", { ...stat, stationId })
  }

  // Insert weekly stats
  for (const stat of parsedReport.weeklyStats) {
    await ctx.db.insert("driverWeeklyStats", { ...stat, stationId })
  }

  // Update import record
  await ctx.db.patch(importId, {
    status: parsedReport.errors.length > 0 ? "partial" : "success",
    driverCount: parsedReport.transporterIds.length,
    dailyStatsCount: parsedReport.dailyStats.length,
    weeklyStatsCount: parsedReport.weeklyStats.length,
    tierDistribution: calculateTierDistribution(parsedReport.weeklyStats),
    errors: parsedReport.errors,
    warnings: parsedReport.warnings,
    completedAt: Date.now(),
  })

  // Generate alerts
  await ctx.scheduler.runAfter(0, internal.alerts.generateAlertsForImport, {
    stationId,
    year,
    week,
  })

} catch (error) {
  await ctx.db.patch(importId, {
    status: "failed",
    errors: [error.message],
    completedAt: Date.now(),
  })
  throw error
}
```

## Cascade Delete Logic

When re-importing data for a week, delete existing data first:

```typescript
async function deleteExistingData(
  ctx: MutationCtx,
  stationId: Id<"stations">,
  year: number,
  week: number
): Promise<void> {
  // Delete daily stats for this week
  const dailyStats = await ctx.db
    .query("driverDailyStats")
    .withIndex("by_station_date", q => q.eq("stationId", stationId))
    .filter(q =>
      q.and(
        q.eq(q.field("year"), year),
        q.eq(q.field("week"), week)
      )
    )
    .collect()

  for (const stat of dailyStats) {
    await ctx.db.delete(stat._id)
  }

  // Delete weekly stats for this week
  const weeklyStats = await ctx.db
    .query("driverWeeklyStats")
    .withIndex("by_station_week", q =>
      q.eq("stationId", stationId).eq("year", year).eq("week", week)
    )
    .collect()

  for (const stat of weeklyStats) {
    await ctx.db.delete(stat._id)
  }

  // Delete station weekly stats
  const stationStats = await ctx.db
    .query("stationWeeklyStats")
    .withIndex("by_station_week", q =>
      q.eq("stationId", stationId).eq("year", year).eq("week", week)
    )
    .first()

  if (stationStats) {
    await ctx.db.delete(stationStats._id)
  }

  // Delete alerts for this week
  const alerts = await ctx.db
    .query("alerts")
    .withIndex("by_station_week", q =>
      q.eq("stationId", stationId).eq("year", year).eq("week", week)
    )
    .collect()

  for (const alert of alerts) {
    await ctx.db.delete(alert._id)
  }
}
```

## Validation Checks

```typescript
interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

function validateImport(parsedReport: ParsedReport): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (parsedReport.stationCode === "UNKNOWN") {
    errors.push("Station code could not be determined")
  }

  if (parsedReport.transporterIds.length === 0) {
    errors.push("No drivers found in report")
  }

  // Data quality
  if (parsedReport.weeklyStats.length === 0) {
    errors.push("No weekly stats found")
  }

  // Warnings
  if (parsedReport.dailyStats.length === 0) {
    warnings.push("No daily stats found (only weekly data)")
  }

  if (parsedReport.errors.length > 0) {
    warnings.push(...parsedReport.errors)
  }

  // Check for negative values
  for (const stat of parsedReport.weeklyStats) {
    if (stat.dwcCompliant < 0 || stat.dwcMisses < 0) {
      errors.push(`Invalid negative values for driver ${stat.transporterName}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
```

## Import History UI

```tsx
function ImportHistory({ stationId }: { stationId: Id<"stations"> }) {
  const imports = useQuery(api.imports.listImports, { stationId })

  return (
    <DataTable
      columns={[
        {
          header: "Semaine",
          accessor: row => `S${row.week} ${row.year}`
        },
        {
          header: "Status",
          accessor: "status",
          cell: ({ value }) => <ImportStatusBadge status={value} />
        },
        {
          header: "Chauffeurs",
          accessor: "driverCount"
        },
        {
          header: "Importe par",
          accessor: "importedBy"
        },
        {
          header: "Date",
          accessor: "createdAt",
          cell: ({ value }) => formatDate(value)
        },
        {
          header: "Actions",
          cell: ({ row }) => (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => viewDetails(row._id)}>
                  Voir details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deleteImport(row._id)}
                  className="text-destructive"
                >
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      ]}
      data={imports || []}
    />
  )
}
```

## Status Badge

```tsx
const statusConfig = {
  pending: { label: "En attente", color: "bg-gray-500/20 text-gray-400" },
  processing: { label: "En cours", color: "bg-blue-500/20 text-blue-400" },
  success: { label: "Succes", color: "bg-emerald-500/20 text-emerald-400" },
  partial: { label: "Partiel", color: "bg-amber-500/20 text-amber-400" },
  failed: { label: "Echec", color: "bg-red-500/20 text-red-400" },
}

function ImportStatusBadge({ status }: { status: ImportStatus }) {
  const config = statusConfig[status]
  return <Badge className={config.color}>{config.label}</Badge>
}
```

## Week Coverage Check

```typescript
// Check which weeks have been imported
async function getWeekCoverage(
  ctx: QueryCtx,
  stationId: Id<"stations">,
  year: number
): Promise<number[]> {
  const imports = await ctx.db
    .query("imports")
    .withIndex("by_station", q => q.eq("stationId", stationId))
    .filter(q =>
      q.and(
        q.eq(q.field("year"), year),
        q.neq(q.field("status"), "failed")
      )
    )
    .collect()

  return imports.map(i => i.week).sort((a, b) => a - b)
}
```

## DO NOT
- Import without station ID verification
- Skip cascade delete on re-import
- Ignore validation errors
- Allow imports for future weeks
- Store raw HTML in database (only parsed data)
