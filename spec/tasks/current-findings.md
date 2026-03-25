# DSPilot Current Findings

Date: 2026-03-25
Status: Initial findings log

## High Severity

### Tier logic is not yet a single source of truth

Known threshold families observed in the app logic:

- `95 / 90 / 88`
- `98.5 / 96 / 90`

Impact:

- the same driver can fall into different buckets depending on query path or screen
- any tier-based dashboard, alerting, coaching, PDF, or WhatsApp automation is not fully trustworthy yet

Required action:

- define one canonical tier policy
- route all UI, backend, and automation logic through that single policy

### Historical scorecard scraping is not trustworthy

The locally parsed historical scorecard datasets show adjacent-week duplication for both:

- quality datasets
- associate datasets

Impact:

- week-over-week trend screens and derived insights are at risk if they rely on scraped portal navigation instead of exported reports

Required action:

- treat `Supplementary Reports` exports as the primary ingestion path
- do not use portal week-navigation scrape as the truth source for history

## Medium Severity

### "Top drivers" is semantically overloaded

Current concept mixes:

- top by DWC
- top by IADC
- most active
- most photo defects

Impact:

- a manager may misread a risk ranking as a positive leaderboard

Required action:

- rename widget dynamically by metric
- split positive and negative ranking modes

### Several KPIs need provenance and unit clarification

Metrics needing explicit source and formula treatment:

- `daysActive`
- `photoDefects`
- `dnr`
- `dpmo`
- `rts`
- `tier`

Impact:

- users may assume Amazon-native semantics where DSPilot is actually deriving or aggregating a value

Required action:

- add tooltip and provenance metadata from the canonical metrics catalogue

## Live Site Findings

### Landing page contains percent-like placeholders for non-percent concepts

On the public site, the marketing dashboard example shows:

- `Packages` with a percent-style value
- `Routes` with a percent-style value

Impact:

- visually clean, but semantically misleading

Required action:

- replace with realistic units or relabel the mock values

### Landing page wording may overstate current automation maturity

Current claims on the public site include:

- `Dashboard temps réel`
- `Import automatisé`
- `Export PDF et partage WhatsApp`

Impact:

- if production automation is not yet fully live end-to-end, this creates expectation risk

Required action:

- align public copy with actual production readiness
- or accelerate productionization of the advertised flows

## Product Direction Confirmed

The highest-value source priority remains:

1. `DWC-IADC weekly export`
2. `Daily Report / Associate Daily`
3. `Roster`
4. `DNR Investigations`

Lower priority:

- `Itineraries`
- `Fleet`

## Immediate Next Checks

1. fill the KPI traceability matrix field by field
2. add parser fixtures for weekly + daily + roster exports
3. recable tier logic to one policy
4. add provenance tooltips across dashboard and driver views
