---
name: batch-import
description: Batch import state machine for DSPilot. The useBatchImport hook manages multi-file Amazon report ingestion with validation and progress tracking. Use when working with import functionality.
allowed-tools: Read, Write, Edit
---

# Batch Import

## useBatchImport() Hook

Located at `src/hooks/use-batch-import.ts`. A React hook that manages multi-file Amazon HTML report ingestion through a state machine with progress tracking, validation, and chunked Convex mutations.

### Options

```ts
interface UseBatchImportOptions {
  stationId: Id<"stations">;
  userId: string;
  onProgress?: (state: BatchImportState) => void;
  onComplete?: (summary: BatchImportSummary) => void;
  onError?: (error: Error) => void;
}
```

### Return Value

```ts
{
  state: BatchImportState;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  startParsing: () => Promise<void>;
  startImport: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
  canStart: boolean;       // phase === "ready" && readyCount > 0
  isProcessing: boolean;   // phase === "parsing" || phase === "processing"
  readyCount: number;      // items with status "ready"
}
```

## State Machine Phases (7 phases)

```
idle -> collecting -> parsing -> validating -> ready -> processing -> complete
```

| Phase | Description |
|---|---|
| `idle` | Initial state, no files loaded |
| `collecting` | Files have been added via `addFiles()`, waiting for user to trigger parse |
| `parsing` | `startParsing()` called -- all files parsed in parallel via `parseHtmlFile()` |
| `validating` | Automatic after parsing -- `validateBatch()` checks station consistency and duplicate weeks |
| `ready` | Validation complete, valid files marked ready. User can review warnings and trigger import |
| `processing` | `startImport()` called -- files uploaded sequentially to Convex |
| `complete` | All files processed, `onComplete` callback fired with `BatchImportSummary` |

## Item Statuses

Each `ImportQueueItem` transitions through:

```
pending -> parsing -> parsed -> validating -> ready -> uploading -> success | failed | skipped
```

| Status | Meaning |
|---|---|
| `pending` | File added, not yet parsed |
| `parsing` | Currently being parsed by `parseHtmlFile()` |
| `parsed` | HTML successfully parsed into `ParsedReport` |
| `validating` | Being checked for station consistency / duplicates |
| `ready` | Passed validation, waiting to be uploaded |
| `uploading` | Currently being sent to Convex via mutations |
| `success` | Import completed successfully |
| `failed` | Parse or upload error (error message stored in `item.error`) |
| `skipped` | Excluded by validation (wrong station or duplicate week) |

## BATCH_SIZE Constant

```ts
const BATCH_SIZE = 50;
```

Daily and weekly stats are sent to Convex in chunks of 50 records per mutation call. This prevents hitting Convex mutation size limits.

## Validation: validateBatch()

Runs automatically after the parsing phase. Two checks:

1. **Station consistency**: All parsed reports must have the same `stationCode`. The first parsed file sets the expected code. Files with a different station code are marked `"skipped"` with a warning.
2. **Duplicate week detection**: If two files cover the same `year-week`, the second one is marked `"skipped"`. The first file wins. Duplicate week keys are tracked and reported in warnings.

Returns `BatchValidationResult` with `valid` items, `warnings` array, `stationCode`, and `duplicateWeeks`.

## Mutation Sequence

Each ready file is uploaded sequentially via `uploadSingleReport()`. The mutations fire in this order:

```
1. createImport         -> creates import record, returns importId
2. startProcessing      -> marks import as processing
3. bulkUpsertDrivers    -> upserts drivers by amazonId, returns driverMap
4. bulkUpsertDailyStats -> chunked in BATCH_SIZE (50) batches
5. bulkUpsertWeeklyStats -> chunked in BATCH_SIZE (50) batches
6. updateStationWeeklyStats -> aggregates station-level weekly stats
7. completeImport       -> finalizes import with counts, scores, tier distribution
```

Between steps, progress is reported via `onFileProgress` callback updating both per-item and total progress percentages.

### Progress Milestones per File

| Percent | Step |
|---|---|
| 5% | `createImport` |
| 15% | `bulkUpsertDrivers` |
| 25-50% | `bulkUpsertDailyStats` (chunked) |
| 55-80% | `bulkUpsertWeeklyStats` (chunked) |
| 85% | `updateStationWeeklyStats` |
| 100% | `completeImport` |

## Post-Import: Alert Generation

After `completeImport`, the Convex backend schedules alert generation via:

```ts
ctx.scheduler.runAfter(0, internal.alerts.generateQualifiedAlertsInternal, {
  stationId,
  year,
  week,
  importId,
});
```

This triggers the automation pipeline to evaluate all drivers for the imported week and create qualified alerts with confidence scores.

## DO NOT

- Do not change the mutation call order. `bulkUpsertDrivers` must run before daily/weekly stats because it returns the `driverMap` (amazonId -> Convex Id) needed by stat upserts.
- Do not increase `BATCH_SIZE` above 50 without verifying Convex mutation payload limits.
- Do not allow parallel `uploadSingleReport` calls. Files are processed sequentially to avoid race conditions on driver upserts.
- Do not skip `startProcessing` -- it sets the import status so the UI can show progress.
- Do not remove the `cancelledRef` checks inside loops. They allow the user to abort a long-running batch.
- Do not mutate `state.items` directly. Always use `updateItem()` which keeps `itemsRef` in sync for async closures.
- Do not assume `itemsRef.current` and `state.items` are the same reference. The ref is the source of truth inside async callbacks to avoid stale closures.
