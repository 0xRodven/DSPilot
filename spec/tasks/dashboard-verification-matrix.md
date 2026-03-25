# DSPilot Dashboard Verification Matrix

Date: 2026-03-25
Status: Audit scaffold

## Objective

For each major UI block, verify:

- displayed metric
- source report
- derivation rule
- selected period behavior
- expected user interpretation
- current confidence level

## Dashboard KPI Strip

### DWC score

- Source:
  - weekly `DWC-IADC` export
- Expected period:
  - selected week only
- Check:
  - station aggregate matches import
  - not blended with daily data
- Risk:
  - medium until full source-to-widget trace is confirmed

### IADC score

- Source:
  - weekly `DWC-IADC` export
- Expected period:
  - selected week only
- Check:
  - station aggregate matches import

### Drivers count

- Source:
  - likely driver set active in selected week or station roster
- Check:
  - exact business rule must be explicit
- Risk:
  - high if one screen means `all rostered` and another means `active this week`

### Fantastic count

- Source:
  - DSPilot tiering over weekly score
- Check:
  - threshold set is canonical
  - widget label states it is a derived tier count
- Risk:
  - high today because tier logic is not yet globally unified

## Tier Distribution

### Segment counts

- Source:
  - derived from weekly driver scores
- Check:
  - thresholds identical in UI, backend, alerts, coaching, and PDFs
  - driver count matches exact bucket membership
- Risk:
  - high today

### Tooltip definitions

- Required:
  - exact threshold band
  - source metric
  - whether DSPilot-defined or Amazon-official

## Driver Ranking Widget

### DWC mode

- Source:
  - weekly driver DWC score
- Check:
  - descending ranking
  - title says `Top drivers - DWC`

### IADC mode

- Source:
  - weekly driver IADC score
- Check:
  - descending ranking
  - title says `Top drivers - IADC`

### Days active mode

- Source:
  - derived from daily records in selected range
- Check:
  - formula is documented
  - title says `Most active drivers`

### Photo defects mode

- Source:
  - weekly export breakdown
- Check:
  - title should not imply this is a positive ranking
  - likely better framed as `Drivers with most photo defects`

## Driver Detail Page

### Weekly KPI cards

- Check:
  - every KPI has source, unit, and scope
  - percent-like formatting is actually justified

### Error breakdown

- Check:
  - all categories map to real export fields
  - no mixed daily/weekly semantics without labels

### Coaching section

- Check:
  - recommendations cite the underlying weakness
  - recommendation logic uses canonical metrics only

## Calendar / Weekly Summary

### Weekly recap cell

- Check:
  - reflects selected week source completeness
  - not shown as complete if imports are partial

### Suggested additions

- import health marker
- missing report marker
- weekly PDF link
- generated narrative summary

## PDF / WhatsApp Outputs

### Weekly PDF

- Every exported figure must carry:
  - source report family
  - selected week
  - generation timestamp

### WhatsApp summary

- Only use:
  - canonical driver identity
  - canonical daily or weekly metric
  - canonical threshold wording

## Confidence Labels

Use during audit:

- `trusted`
- `trusted with derivation`
- `ambiguous`
- `misleading`
- `not production ready`

This matrix should eventually be filled row by row for every visible KPI or chart.
