---
name: amazon-parser
description: Parse Amazon HTML delivery reports (DWC/IADC) and extract driver performance data. Use when implementing import functionality, debugging parsing issues, or working with CSV extraction.
allowed-tools: Read, Write, Edit, Bash, Grep
---

# Amazon Parser Skill for DSPilot

## When to Use
- Implementing HTML report parsing
- Debugging CSV extraction issues
- Working with base64-encoded CSVs
- Handling period type detection (daily/weekly)
- Extracting station codes from reports

## Architecture Reference
Location: `/src/lib/parser/`

| File | Purpose |
|------|---------|
| `index.ts` | Main orchestrator - `parseHtmlFile()` |
| `html-extractor.ts` | Extract base64 CSVs from HTML |
| `csv-parser.ts` | Parse CSV rows |
| `aggregator.ts` | Aggregate daily → weekly stats |
| `types.ts` | TypeScript type definitions |

## Key Types

```typescript
// Raw CSV row from Amazon report
interface RawCsvRow {
  date: string
  transporterId: string
  transporterName: string
  deliveryAttempts: number
  dwcCompliant: number
  dwcMisses: number
  failedAttempts: number
  iadcCompliant: number
  iadcNonCompliant: number
}

// Aggregated stats per driver
interface AggregatedDriverStats {
  transporterId: string
  transporterName: string
  date: string
  dwcCompliant: number
  dwcMisses: number
  failedAttempts: number
  iadcCompliant: number
  iadcNonCompliant: number
  dwcBreakdown: DwcBreakdown
  iadcBreakdown: IadcBreakdown
}

// DWC breakdown categories
interface DwcBreakdown {
  contactMiss: number
  photoDefect: number
  noPhoto: number
  otpMiss: number
  other: number
}

// IADC breakdown categories
interface IadcBreakdown {
  mailbox: number
  unattended: number
  safePlace: number
  other: number
}

// Final parsed report
interface ParsedReport {
  filename: string
  stationCode: string
  reportWeek: string
  year: number
  week: number
  dailyStats: AggregatedDriverStats[]
  weeklyStats: AggregatedDriverStats[]
  transporterIds: string[]
  errors: string[]
  warnings: string[]
}
```

## Parsing Flow

```
1. HTML File Upload
   ↓
2. extractCsvsFromHtml()
   - Find <script> tags with base64 CSV data
   - Decode base64 to CSV text
   - Extract station code from filename/headers
   - Detect period type (daily vs weekly)
   ↓
3. parseCsvRows()
   - Parse CSV headers
   - Map columns to RawCsvRow fields
   - Handle numeric conversions
   - Collect errors/warnings
   ↓
4. aggregateStats()
   - Group by transporter
   - Calculate breakdowns
   - Sum metrics
   ↓
5. Return ParsedReport
```

## HTML Structure Patterns

Amazon reports embed CSVs as base64 in script tags:
```html
<script type="text/csv" data-filename="DWC_daily_2024-W50.csv">
  BASE64_ENCODED_CSV_DATA_HERE
</script>
```

Station code extraction regex:
```javascript
const stationMatch = html.match(/Station:\s*([A-Z]{3}\d+)/i)
const stationCode = stationMatch?.[1] || "UNKNOWN"
```

## Calculation Formulas

### DWC Percentage
```typescript
const dwcPercent = (dwcCompliant / (dwcCompliant + dwcMisses + failedAttempts)) * 100
```

### IADC Percentage
```typescript
const iadcPercent = (iadcCompliant / (iadcCompliant + iadcNonCompliant)) * 100
```

### Fleet Averages (Weighted)
```typescript
// Sum all compliant / sum all total (NOT average of percentages)
const fleetDwc = totalCompliant / totalAttempts * 100
```

## Error Handling Patterns

```typescript
// Collect errors without throwing
const errors: string[] = []
const warnings: string[] = []

try {
  // Parsing logic
} catch (error) {
  errors.push(`Failed to parse CSV: ${error.message}`)
}

// Return with errors for UI display
return { data, errors, warnings }
```

## Common Issues

1. **No CSVs Found**
   - Check HTML structure changed
   - Verify base64 encoding intact
   - Check script tag selectors

2. **Invalid Station Code**
   - Fallback to "UNKNOWN"
   - Log warning for manual review

3. **Missing Transporter Data**
   - Skip row with warning
   - Don't fail entire import

4. **Date Format Mismatch**
   - Amazon uses various formats
   - Use dayjs for parsing

## Testing

```bash
# Test parser with sample HTML
node scripts/test-parser.js test-files/sample-report.html
```

## DO NOT
- Modify `convex/_generated/`
- Hardcode station codes
- Skip error collection
- Throw on partial failures
