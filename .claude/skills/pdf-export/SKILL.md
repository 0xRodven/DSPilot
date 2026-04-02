---
name: pdf-export
description: PDF export using @react-pdf/renderer for DSPilot weekly recaps. Two versions - DSP (full names) and LIVREURS (blurred names). Use when working with PDF generation or export features.
allowed-tools: Read, Write, Edit
---

# PDF Export

## WeeklyRecapDocument Component

Located at `src/lib/pdf/weekly-recap-document.tsx`. A `@react-pdf/renderer` `<Document>` component that renders an A4 weekly recap PDF.

### Props

```ts
interface WeeklyRecapDocumentProps {
  data: WeeklyRecapData;
  /** If true, driver names will be blurred for privacy (RECAP LIVREURS version) */
  blurDriverNames?: boolean;
}
```

## Data Types

All defined in the same file:

```ts
interface PDFDriver {
  rank: number;
  name: string;
  amazonId: string;
  dwcPercent: number;
  iadcPercent: number;
  tier: "fantastic" | "great" | "fair" | "poor";
  daysWorked: number;
}

interface PDFKPIs {
  avgDwc: number;
  avgIadc: number;
  totalDrivers: number;
  activeDrivers: number;
  dwcChange?: number;
  iadcChange?: number;
}

interface PDFTierDistribution {
  fantastic: number;
  great: number;
  fair: number;
  poor: number;
}

interface WeeklyRecapData {
  stationName: string;
  stationCode: string;
  week: number;
  year: number;
  generatedAt: string;
  kpis: PDFKPIs;
  tierDistribution: PDFTierDistribution;
  topDrivers: PDFDriver[];
  bottomDrivers: PDFDriver[];
}
```

## blurName() Function

Blurs driver names for the LIVREURS export version:

```ts
function blurName(name: string): string {
  return name
    .split(" ")
    .map((part) => (part.length > 0 ? `${part[0]}***` : ""))
    .join(" ");
}
```

Example: `"Jean Dupont"` becomes `"J*** D***"`

Applied to both `topDrivers` and `bottomDrivers` when `blurDriverNames` is `true`.

## PDF Sections

The document renders a single A4 page with these sections in order:

1. **Header**: "DSPilot" logo text (blue, 24pt bold) + subtitle with station name, code, and version indicator ("Version Livreurs" when blurred)
2. **KPIs** (4 cards in a row):
   - Score DWC (with week-over-week change)
   - Score IADC (with week-over-week change)
   - Livreurs Actifs (active / total count)
   - Taux Fantastic (percentage + count of fantastic-tier drivers)
3. **Tier Distribution**: 4 items in a row showing count per tier with labels (Fantastic >=95%, Great >=90%, Fair >=88%, Poor <88%)
4. **Top 5 Performers**: Table with columns #, Livreur, DWC %, IADC %, Jours, Tier
5. **Livreurs a Coacher** (Bottom 5): Same table layout, only rendered if `bottomDrivers.length > 0`
6. **Footer**: "Genere le {date}" on the left, "DSPilot - dspilot.fr" on the right

## Two Export Modes

| Mode | `blurDriverNames` | Name Display | Subtitle |
|---|---|---|---|
| **PDF DSP** | `false` (default) | Full names (e.g., "Jean Dupont") | Standard |
| **PDF LIVREURS** | `true` | Blurred names (e.g., "J*** D***") | Appends " - Version Livreurs" |

## Tier Colors in PDF (hex values)

Used via `StyleSheet.create` styles for tier badges:

| Tier | Background | Text Color |
|---|---|---|
| Fantastic | `#d1fae5` | `#065f46` |
| Great | `#dbeafe` | `#1e40af` |
| Fair | `#fef3c7` | `#92400e` |
| Poor | `#fee2e2` | `#991b1b` |

Tier distribution counts use different display colors: Fantastic `#10b981`, Great `#3b82f6`, Fair `#f59e0b`, Poor `#ef4444`.

## DO NOT

- Do not use Tailwind CSS classes in this file. `@react-pdf/renderer` does not support Tailwind. All styles must use `StyleSheet.create()` with inline-style-like objects.
- Do not use `<div>`, `<span>`, `<p>`, or any HTML tags. Only use `@react-pdf/renderer` primitives: `<Document>`, `<Page>`, `<View>`, `<Text>`, `<Image>`, `<Link>`.
- Do not use `flexGrow`, `gap`, or CSS Grid. `@react-pdf/renderer` uses a subset of flexbox. Use `flexDirection`, `justifyContent`, `alignItems`, and percentage `width` for layout.
- Do not add custom fonts without registering them via `Font.register()`. The document defaults to `fontFamily: "Helvetica"`.
- Do not use `rem`, `em`, or `vh`/`vw` units. Only `pt` (default) and explicit numeric values are supported.
- Do not render the "Livreurs a Coacher" section when `bottomDrivers` is empty. The component already guards this with a conditional render.
- Do not import from `react-dom`. This component runs in a Node/PDF renderer context, not a browser DOM.
