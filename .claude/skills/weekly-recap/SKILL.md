---
name: weekly-recap
description: Generate weekly performance recaps for drivers and stations. Use for PDF exports, WhatsApp messages, dashboard summaries, and weekly review features.
allowed-tools: Read, Write, Edit
---

# Weekly Recap Skill for DSPilot

## When to Use
- Generating PDF weekly reports
- Creating WhatsApp recap messages
- Building weekly comparison views
- Implementing driver recap cards
- Creating station performance summaries

## Reference Implementations
- `/convex/whatsapp.ts` - Message generation
- `/src/lib/coaching/recap-generator.ts` - Recap data structure
- `/src/app/(main)/dashboard/weekly-recap/` - PDF export UI

## Recap Data Structure

```typescript
interface DriverRecap {
  driverId: Id<"drivers">
  driverName: string
  amazonId: string
  phoneNumber?: string

  // Current week
  currentWeek: {
    year: number
    week: number
    dwcPercent: number
    iadcPercent: number
    tier: Tier
    rank: number
    totalDrivers: number
  }

  // Previous week (for comparison)
  previousWeek?: {
    dwcPercent: number
    iadcPercent: number
    tier: Tier
    rank: number
  }

  // Trend
  trend: {
    direction: "up" | "down" | "stable"
    change: number
    tierChange: "upgraded" | "downgraded" | "same"
  }

  // Top errors
  topErrors: {
    category: string
    count: number
    percentage: number
  }[]

  // Coaching status
  coachingStatus?: {
    hasActiveAction: boolean
    lastActionType?: ActionType
    lastActionDate?: string
  }
}
```

## WhatsApp Message Template

```typescript
function generateRecapMessage(recap: DriverRecap): string {
  const tierEmoji = {
    fantastic: "🌟",
    great: "💙",
    fair: "⚠️",
    poor: "🔴",
  }

  const trendArrow = {
    up: "📈",
    down: "📉",
    stable: "➡️",
  }

  return `
*Recap Semaine ${recap.currentWeek.week}* 📊

Salut ${recap.driverName.split(" ")[0]} !

*Ta performance:*
DWC: ${recap.currentWeek.dwcPercent.toFixed(1)}% ${tierEmoji[recap.currentWeek.tier]}
IADC: ${recap.currentWeek.iadcPercent.toFixed(1)}%
Classement: ${recap.currentWeek.rank}/${recap.currentWeek.totalDrivers}

*Tendance:* ${trendArrow[recap.trend.direction]} ${recap.trend.change > 0 ? "+" : ""}${recap.trend.change.toFixed(1)}%

${recap.topErrors.length > 0 ? `*Top erreurs:*
${recap.topErrors.map(e => `- ${e.category}: ${e.count}`).join("\n")}` : ""}

${getPersonalizedTip(recap)}

Bonne semaine ! 💪
`.trim()
}
```

## Personalized Tips by Tier

```typescript
function getPersonalizedTip(recap: DriverRecap): string {
  const { tier } = recap.currentWeek
  const mainError = recap.topErrors[0]?.category

  const tips: Record<Tier, string[]> = {
    fantastic: [
      "Continue comme ca, tu es au top ! 🎯",
      "Excellent travail, garde ce rythme ! 🏆",
      "Tu es un exemple pour l'equipe ! ⭐",
    ],
    great: [
      "Tres bien ! Encore un petit effort pour le Fantastic 💪",
      "Belle performance ! Tu es proche du top 🎯",
      "Continue, tu y es presque ! 🚀",
    ],
    fair: [
      mainError === "contactMiss"
        ? "Pense a bien verifier les consignes client 📱"
        : mainError === "photoDefect"
        ? "Attention a la qualite des photos 📸"
        : "Concentre-toi sur les details, tu peux y arriver ! 💪",
    ],
    poor: [
      "On compte sur toi pour remonter la semaine prochaine 💪",
      "Besoin d'aide ? N'hesite pas a en parler !",
      "Chaque livraison compte, reste concentre ! 🎯",
    ],
  }

  const tierTips = tips[tier]
  return tierTips[Math.floor(Math.random() * tierTips.length)]
}
```

## PDF Export Structure

```typescript
interface PDFRecapData {
  station: {
    code: string
    name: string
  }
  period: {
    year: number
    week: number
    startDate: string
    endDate: string
  }
  summary: {
    totalDrivers: number
    fleetDwc: number
    fleetIadc: number
    tierDistribution: TierDistribution
  }
  topPerformers: DriverRecap[]  // Top 5
  needsAttention: DriverRecap[] // Bottom 5
  fullRanking: DriverRecap[]    // All drivers
}
```

## PDF Sections

1. **Header**
   - Station name and code
   - Week period (ex: "Semaine 50 - Dec 9-15, 2024")
   - Generation date

2. **Fleet Summary**
   - Fleet DWC average
   - Fleet IADC average
   - Tier distribution pie chart
   - Week-over-week trend

3. **Top Performers (5)**
   - Name, DWC%, trend, tier badge

4. **Needs Attention (5)**
   - Name, DWC%, main issues, coaching status

5. **Full Ranking Table**
   - Rank, Name, DWC%, IADC%, Tier, Trend

## Station Weekly Recap

```typescript
interface StationRecap {
  stationId: Id<"stations">
  period: { year: number; week: number }

  // Fleet metrics
  fleet: {
    dwcPercent: number
    iadcPercent: number
    totalDeliveries: number
    driverCount: number
  }

  // Tier distribution
  tierDistribution: {
    fantastic: number
    great: number
    fair: number
    poor: number
  }

  // Week-over-week comparison
  trend: {
    dwcChange: number
    driverCountChange: number
  }

  // Top performers
  topDrivers: {
    name: string
    dwcPercent: number
    tier: Tier
  }[]

  // Alerts generated
  alertsGenerated: number
  coachingActionsCreated: number
}
```

## Comparison View

```typescript
interface WeekComparison {
  currentWeek: { year: number; week: number }
  previousWeek: { year: number; week: number }

  drivers: {
    driverId: Id<"drivers">
    name: string
    current: { dwc: number; tier: Tier; rank: number }
    previous: { dwc: number; tier: Tier; rank: number }
    change: {
      dwc: number
      tierChange: "upgraded" | "downgraded" | "same"
      rankChange: number
    }
  }[]

  summary: {
    improved: number
    declined: number
    stable: number
    newDrivers: number
    leftDrivers: number
  }
}
```

## Calendar Integration

```typescript
// For coaching calendar events
interface RecapCalendarEvent {
  date: string  // Monday of recap week
  type: "weekly_recap"
  stationId: Id<"stations">
  data: {
    week: number
    year: number
    driversToReview: number
    coachingNeeded: number
  }
}
```

## DO NOT
- Generate recaps for future weeks
- Send WhatsApp without opt-in check
- Include driver phone numbers in PDF
- Skip trend calculation
- Use unweighted averages for fleet metrics
