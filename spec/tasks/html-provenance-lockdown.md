# DSPilot HTML Provenance Lockdown

Date: 2026-03-25
Status: Working checklist

## Goal

Lock every important DSPilot number to a traceable chain:

`Amazon source -> raw HTML/report -> parser extraction -> normalized field -> Convex storage -> UI widget / alert / PDF / WhatsApp`

If a number cannot be traced through that chain, it is not production-trustworthy.

## Priority Sources

### 1. Supplementary Reports page

Primary operational discovery surface for report acquisition.

Observed useful exports:

- `Daily-Report`
- `DWC-IADC-Report`
- `DNR_Investigations`

Use:

- find downloadable signed report links
- classify report type
- capture report metadata from filenames and surrounding DOM

Do not use this page as the metric truth itself.
Use it as the report inventory and download gateway.

### 2. DWC-IADC HTML export

Primary weekly performance truth.

Expected role:

- weekly DWC-like score
- weekly IADC score
- weekly breakdown by driver
- weekly station-level aggregates when available

This should be the canonical source for weekly scorecard views and weekly reporting.

### 3. Daily Report / Associate Daily HTML export

Primary daily operational truth.

Expected role:

- daily associate-level performance
- DNR
- DPMO
- RTS
- route/day activity signals

This should be the canonical source for daily alerts and day-by-day manager views.

### 4. Roster source

Canonical identity and status truth.

Expected role:

- associate id
- display name
- email
- phone
- employment / lifecycle status

This is required for clean joins, driver matching, and WhatsApp automation.

## Lockdown Principle

Every important field needs five things:

1. raw source identifier
2. parser extraction rule
3. normalized storage field
4. consuming UI/report surfaces
5. validation rule

## Field-Level Matrix

### Weekly scorecard family

#### `dwcScore`

- Raw source:
  - `DWC-IADC` weekly export
- Extraction:
  - parser reads driver or station score from exported HTML
- Storage:
  - weekly import tables and downstream driver/stat aggregates
- Consumers:
  - dashboard KPI
  - driver profile
  - tiering
  - weekly PDF
  - coaching logic
- Validation:
  - exact match against raw report sample
  - no transformation except numeric normalization
  - unit must remain percent

#### `iadcScore`

- Raw source:
  - `DWC-IADC` weekly export
- Extraction:
  - parser reads driver or station score from exported HTML
- Storage:
  - weekly import tables and derived aggregates
- Consumers:
  - dashboard KPI
  - driver profile
  - weekly PDF
- Validation:
  - exact match against raw report sample

#### `dwcBreakdown.photoDefect`

- Raw source:
  - weekly export breakdown section, if present
- Extraction:
  - parser must read exact breakdown bucket, not infer from text fragments
- Storage:
  - weekly driver-level breakdown
- Consumers:
  - driver detail
  - dashboard risk ranking
  - coaching
- Validation:
  - field must have explicit source label in code and UI
  - if derived from another count or rate, formula must be documented

### Daily operations family

#### `dnr`

- Raw source:
  - Daily Report / Associate Daily export
  - DNR Investigations as enrichment only
- Extraction:
  - parser reads count or rate exactly as exported
- Storage:
  - daily driver stats
- Consumers:
  - alerts
  - daily report
  - weekly narrative rollups
- Validation:
  - distinguish count vs rate
  - never mix investigation rows with daily score rows

#### `dpmo`

- Raw source:
  - Daily Report / Associate Daily export
- Extraction:
  - parser reads exact field label and value
- Storage:
  - daily driver stats
- Consumers:
  - alerts
  - daily report
  - coach-at-risk views
- Validation:
  - unit and formula origin must be documented

#### `rts`

- Raw source:
  - Daily Report / Associate Daily export
- Extraction:
  - parser reads exact field label and value
- Storage:
  - daily driver stats
- Consumers:
  - alerts
  - daily report
  - route quality analysis
- Validation:
  - distinguish count, rate, and projected value if multiple are present

#### `daysActive`

- Raw source:
  - derived from daily records, not a native Amazon field by default
- Extraction:
  - count unique active days within the selected period
- Storage:
  - preferably computed or cached as a derived metric
- Consumers:
  - dashboard ranking
  - driver profile summaries
- Validation:
  - explicitly labeled as `DSPilot-derived`
  - exact counting rule must be documented

### Identity family

#### `driverAmazonId`

- Raw source:
  - roster or exported report identity field
- Extraction:
  - stable identifier preferred over name matching
- Storage:
  - canonical driver identity table
- Consumers:
  - import matching
  - coaching
  - WhatsApp
  - PDFs
- Validation:
  - required for robust joins
  - fallback to fuzzy name matching should be exceptional and logged

#### `driverStatus`

- Raw source:
  - roster
- Extraction:
  - active / onboarding / offboarded or similar
- Storage:
  - driver profile snapshot
- Consumers:
  - driver lists
  - automation recipient filtering
  - roster health
- Validation:
  - status change should be dateable when possible

## HTML Audit Checklist

### Raw artifact integrity

- save original filename
- save capture timestamp
- save report type
- save station code
- save report date or week
- save artifact hash

Reason:

- same report can be re-downloaded with different signed URLs
- hash lets us detect duplicates and reimports safely

### Parser integrity

For every parser:

- avoid brittle regex over whole-page text when a stable DOM selector exists
- document selector assumptions
- fail loudly on missing critical sections
- record parsing warnings, not only hard failures

### Normalization integrity

For every numeric field:

- document whether it is a percentage, count, rate, ratio, or score
- normalize decimal separators consistently
- preserve raw value alongside normalized value when useful
- never silently convert missing to zero

### Join integrity

For every driver row:

- prefer stable Amazon id
- if joined by name, log the confidence and ambiguity
- track unmatched rows

### Storage integrity

For every import:

- preserve source artifact metadata
- preserve import timestamp
- preserve week/date scope
- replace or upsert with explicit rules, not accidental overwrite

## Validation Modes

### Golden fixture validation

Maintain a small set of checked raw HTML fixtures:

- one `DWC-IADC` weekly export
- one `Daily Report`
- one `Roster`
- one `DNR Investigations` sample

For each fixture:

- expected parsed JSON snapshot
- expected row counts
- expected named driver values

This is the fastest way to prevent parser regressions.

### Cross-layer validation

For a selected driver and week/day:

1. raw HTML value
2. parsed JSON value
3. Convex stored value
4. UI rendered value

All four must match or have a documented derivation.

### Semantic validation

Examples:

- a percentage field should not be displayed as a count
- a count should not be ranked as if higher is always better
- a weekly metric should not be mixed into a daily card without labeling

## Must-Lock UI Metadata

Every major KPI card should expose:

- source report
- period scope
- freshness
- whether the metric is raw Amazon or DSPilot-derived

Examples:

- `DWC - weekly Amazon export`
- `Days active - DSPilot derived from Daily Report over selected period`
- `Photo defects - weekly export breakdown`

## Failure Conditions

The following should block production trust:

- parser succeeds while critical table/section is missing
- same metric has different formulas in different code paths
- UI shows a metric without source or unit
- import overwrites data without explicit period key
- tier logic depends on more than one threshold set

## Immediate Engineering Actions

1. Add a canonical metrics dictionary in code.
2. Add fixture-based parser tests for raw HTML exports.
3. Add source metadata to stored imports and major KPIs.
4. Add UI tooltips and provenance labels.
5. Remove duplicate or conflicting metric formulas.

## Desired Outcome

At the end of this process, any manager or engineer should be able to answer:

- where does this number come from
- how was it parsed
- how was it transformed
- where is it stored
- why does the UI show exactly this value

That is the minimum bar before full automation.
