---
name: project-architecture
description: Complete architectural map of DSPilot — pages, components, Convex modules, data flow, and navigation. Use when navigating the codebase or understanding how parts connect.
allowed-tools: Read, Grep, Glob
---

# DSPilot Project Architecture

## Tech Stack

Next.js 16.1.1 + React 19.2.3 + Convex 1.31.2 + Clerk 6.36.3 + Tailwind 4.1.5 + shadcn/ui + Zustand + Recharts + @react-pdf/renderer + React Hook Form + Zod + nuqs

## Page Routes (21 pages)

| Route | Purpose | Key Components |
|-------|---------|----------------|
| `/` | Marketing home | Landing page |
| `/sign-in`, `/sign-up` | Auth | Clerk components |
| `/dashboard` | KPI dashboard | KPICards, PerformanceChart, TierDistribution, DriversTable |
| `/dashboard/drivers` | Driver list | TierStatsCards, DriversListTable, CSV export |
| `/dashboard/drivers/[id]` | Driver detail | DriverKpis, DailyPerformanceChart, ErrorBreakdown, CoachingHistory |
| `/dashboard/coaching` | Coaching Kanban | CoachingKPIs, CoachingKanban (3 columns), NewActionModal |
| `/dashboard/coaching/recaps` | Weekly recaps | DataTable, RecapModal, PDF generation |
| `/dashboard/coaching/calendar` | Coaching calendar | FullCalendar (month/week/day views) |
| `/dashboard/errors` | Error breakdown | ErrorTabs (DWC/IADC), BreakdownChart, TopDriversErrors |
| `/dashboard/import` | Data import | Dropzone, CsvDropzone, ImportHistory, CoverageStats |
| `/dashboard/stats` | Station stats | StatsDropzone, StatsTable, delivery overview |
| `/dashboard/settings` | Configuration | Organization, Account, WhatsApp, Subscription tabs |

## Convex Modules (22 files in convex/)

| Category | Modules |
|----------|---------|
| Core | schema.ts, admin.ts, auth.config.ts |
| Data | stations.ts, drivers.ts, stats.ts, stationDeliveryStats.ts |
| Import | imports.ts, automation.ts, automationOps.ts |
| Coaching | coaching.ts |
| Alerts | alerts.ts |
| Notifications | whatsapp.ts, whatsappCron.ts |
| AI | agent.ts, chat.ts, embeddings.ts, rag.ts |
| Utils | crons.ts, seed.ts, demo.ts |
| Shared libs | lib/permissions.ts, lib/tier.ts, lib/automationPolicy.ts, lib/timeQuery.ts, lib/utils.ts |

## Component Structure (199 TSX files)

| Directory | Count | Purpose |
|-----------|-------|---------|
| ui/ | 63 | shadcn/ui base components |
| full-calendar/ | 39 | Multi-view calendar with DnD |
| coaching/ | 17 | Kanban, action cards, modals |
| dashboard/ | 16 | KPI cards, charts, pickers |
| drivers/ | 14 | Table, detail view, charts |
| import/ | 8 | Upload, validation, progress |
| settings/ | 7 | Configuration UI |
| data-table/ | 6 | TanStack Table wrapper |
| errors/ | 6 | Breakdown, charts, drill-down |

## Key Lib Files

| File | Purpose |
|------|---------|
| `src/lib/store.ts` | Zustand: selectedStation, time, sidebar |
| `src/lib/types.ts` | Central TypeScript types |
| `src/lib/utils.ts` | cn() classname utility |
| `src/lib/utils/tier.ts` | Tier classification + colors |
| `src/lib/calculations.ts` | DWC/IADC computation |
| `src/lib/parser/` | 12 files for Amazon HTML/CSV parsing |
| `src/lib/filters/` | nuqs URL filtering system |
| `src/lib/pdf/` | PDF export components |

## Data Flow

```
Amazon HTML -> src/lib/parser/ -> Convex mutations -> Stats aggregation
-> stationWeeklyStats -> Dashboard UI (via useQuery + useFilters)
-> Alert generation -> decisionScores -> alerts table -> AlertsDropdown
-> Report delivery -> reportDeliveries table
```

## Navigation (Sidebar)

- **Principal**: Dashboard, Stats, Drivers, Erreurs, Import
- **Coaching**: Planification, Calendrier, Recapitulatifs
- **Configuration**: Parametres
