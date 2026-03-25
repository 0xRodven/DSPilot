# DSPilot Product Truth Audit

Date: 2026-03-25
Status: Draft working baseline

## Goal

Before scaling browser automation, alerts, WhatsApp, or premium PDF reports, DSPilot needs a single product truth:

- which metrics come directly from Amazon
- which metrics are DSPilot interpretations or aggregations
- which thresholds are official, inferred, or product-defined
- which UI blocks are reliable, ambiguous, or misleading today

This audit is the baseline for that alignment.

## Source Hierarchy

Use this order of trust:

1. Amazon Logistics exported reports
2. Amazon Logistics portal pages when an export is not available
3. DSPilot ingestion and parsing logic
4. DSPilot UI labels, cards, and derived rankings
5. Public Amazon marketing or PR content

Important:

- Public Amazon pages confirm DSP program context, but do not publish exact formulas for DWC, DNR, RTS, DPMO, POD/photo defect, or driver-tier thresholds.
- Exact formulas and thresholds must therefore be treated as Amazon-portal truth, not public-web truth.

## Current Data Reality

### Reliable core sources

- `DWC-IADC weekly report`: core weekly scorecard source
- `Daily Report / Associate Daily`: core daily operational source
- `Roster`: core driver identity and status source
- `DNR Investigations`: useful enrichment source, not core for v1

### Lower-priority or phase 2 sources

- `Itineraries`: useful for same-day ops, not core performance v1
- `Fleet`: low priority for DSPilot's manager-performance use case
- interactive dashboards such as `Driver Support Dashboard` and `DSP Quality Insights Dashboard`: useful exploration surfaces, but weaker ingestion sources than exported reports

### Known data issue

The currently scraped history for scorecard-like pages is not reliable:

- adjacent weeks are duplicated across the local `quality_by_week` dataset
- adjacent weeks are duplicated across the local `associates_by_week` dataset

Conclusion:

- do not treat the current historical portal scrape as a trustworthy source of week-over-week truth
- prefer exported reports from `Supplementary Reports`

## Metric Classification

### Amazon-native metrics or entities

These should be modeled as first-class canonical objects in DSPilot:

- DWC / DCR weekly score
- IADC weekly score
- DNR counts and rate fields when present in exports
- DPMO when present in daily/associate reports
- RTS when present in daily/associate reports
- roster identity fields: Amazon associate id, name, phone, email, status
- report metadata: report type, station code, report date/week, generation time

### DSPilot-derived metrics

These are valid product abstractions, but they must be labeled as such:

- driver tier when derived from threshold bands
- top drivers rankings
- days active
- coaching priority scores
- driver health score or risk score
- alert severity bands
- weekly summary narrative

### Ambiguous items that need explicit definition

- `Photo defects`
- `Days active`
- `Packages` on driver cards if shown as a percent-like KPI
- any score shown with a percentage symbol when the underlying unit is not actually a percentage

Each of these needs a tooltip with formula and source.

## Major Product Findings

### 1. Tier distribution is not a stable truth today

The app currently contains conflicting threshold logic for tiers.

Observed threshold families in the codebase include:

- `95 / 90 / 88`
- `98.5 / 96 / 90`

Implication:

- the same driver can be classified differently depending on the screen or query path
- any dashboard card, coaching rule, alert, or PDF relying on tiers is currently exposed to inconsistency

Product decision required:

- define one canonical tier model
- document whether it is:
  - an Amazon-native classification
  - a DSPilot abstraction
  - a station-level concept reused for drivers

Current best working assumption:

- `Fantastic / Great / Fair / Poor` appears to be used in DSPilot as a driver segmentation abstraction
- this should not be presented as unquestionably official Amazon logic until verified against portal exports

### 2. "Top drivers" is useful but semantically imprecise

The dashboard block is currently more like:

- top by DWC
- top by IADC
- top by activity volume
- worst or most impacted by photo defects

This is not one single concept.

Recommendations:

- rename the widget dynamically based on the selected metric
- examples:
  - `Top drivers - DWC`
  - `Most active drivers`
  - `Drivers with the most photo defects`
- avoid showing a negative metric under the same "Top drivers" framing

### 3. Manager comprehension needs more context on every KPI

A DSP manager should be able to answer three questions instantly:

1. What does this metric actually measure?
2. Why does it matter operationally?
3. What action should I take if it drops?

Today, several UI blocks are likely understandable only to someone already deep in Amazon Logistics.

### 4. Data provenance is not visible enough

The UI should state, for each major number:

- source report
- time granularity: daily or weekly
- data freshness
- last successful sync
- completeness status

Without that, managers cannot know whether they are looking at:

- last daily export
- last weekly export
- mixed periods
- partially matched driver data

## Screen-by-Screen Audit Direction

### Dashboard

Keep:

- high-level KPI strip
- tier distribution concept
- drill-down into drivers
- weekly recap pattern

Improve:

- add source and freshness badges on KPI cards
- add hover definitions for DWC, IADC, DNR, DPMO, RTS, photo defects, days active
- separate positive ranking widgets from negative-risk widgets
- show whether a metric is daily, weekly, or blended

### Tier Distribution

Keep the visual if useful, but only after canonicalizing the logic.

Needs:

- clear definition of each tier threshold
- note on whether the tier is Amazon-official or DSPilot-defined
- click-through to the exact drivers in each bucket
- delta vs prior week

Potential improvement:

- a stacked trend by week is likely more useful than a single static pie

### Top Drivers / Driver Lists

Needs:

- metric-specific titles
- sort explanation
- toggle between `best`, `at risk`, and `most improved`
- explicit unit on every column

Potential missing views:

- `Drivers to coach this week`
- `Drivers improving fastest`
- `Drivers newly below threshold`

### Driver Profile

Strong concept.

Needs:

- exact source mapping for each KPI
- error breakdown definitions
- weekly narrative summary
- recommended coaching action linked to actual metric weakness

### Calendar / Weekly Summary

This is strategically strong and should probably become a core manager surface.

Recommended additions:

- week status: complete / partial / missing source
- key events: import completed, report missing, threshold breach, coaching sent
- one-line weekly executive summary
- link to export weekly PDF

## Missing UI Elements Worth Adding

### KPI glossary layer

Add hover or info-panel definitions for:

- DWC
- IADC
- DNR
- DPMO
- RTS
- POD/photo quality
- days active
- tier

Each definition should contain:

- plain-language meaning
- business impact
- source report
- update cadence

### Data health layer

Add a compact status block:

- Amazon connection status
- last sync time
- last successful daily import
- last successful weekly import
- unmatched drivers count
- partial imports count

### Confidence and provenance

When a value is inferred or DSPilot-derived, say so.

Examples:

- `DSPilot score`
- `Derived from DWC weekly score`
- `Computed from 5 active days in selected period`

### Root-cause drill-down

For any red KPI, make the next click obvious:

- which drivers caused the drop
- which error type caused it
- whether it is worsening or recovering

## Reporting Strategy

DSPilot should move toward two premium report families:

- daily ops brief
- weekly manager review

### Daily ops brief

Use case:

- identify new risks today
- decide who to coach now
- see what changed since yesterday

Suggested sections:

- station health snapshot
- new at-risk drivers
- DNR / RTS / photo issue watchlist
- roster changes
- manager action list

### Weekly manager review

Use case:

- review station trend
- review driver distribution by tier
- understand who improved or degraded
- prepare coaching and leadership updates

Suggested sections:

- executive summary
- KPI trend
- tier movement
- top improvements
- key deteriorations
- coaching priorities
- appendix per driver

Rendering direction:

- use the PCP/PCM premium HTML-to-PDF rendering approach
- avoid low-fidelity export patterns for executive reporting

## Automation Readiness Order

### Phase 1

- lock canonical metric dictionary
- lock canonical tier model
- expose data freshness and provenance in UI

### Phase 2

- run Amazon supplementary reports sync in production
- ingest daily + weekly + roster reliably
- track sync health and failures

### Phase 3

- activate alerts based on canonical metrics
- generate daily and weekly premium reports
- send WhatsApp summaries per driver

### Phase 4

- enrich with DNR investigations
- add itinerary-based same-day ops signals if still valuable

## Immediate Decisions Needed

1. Decide whether driver tiers are:
   - official Amazon nomenclature
   - DSPilot abstraction
   - station-tier language adapted to drivers

2. Pick one threshold model and remove all other variants.

3. Define canonical formulas for:
   - days active
   - photo defects
   - top driver ranking modes

4. Add UI provenance and glossary before shipping broad automation.

## Recommended Next Deliverable

Build a small internal `metrics dictionary` artifact in the app and use it as the single source for:

- tooltips
- thresholds
- labels
- PDF report footnotes
- alert logic
- WhatsApp phrasing

That is the clean bridge between product truth and automation truth.
