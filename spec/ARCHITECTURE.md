# DSPilot - Architecture Technique

## Stack Technologique

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16.0.10 | Framework React (App Router) |
| React | 19.2.0 | UI Library |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 4.1.9 | Styling utility-first |
| shadcn/ui | - | Composants UI (Radix) |
| Recharts | 2.15.4 | Graphiques |
| Zustand | 5.0.9 | State management global |
| date-fns | 4.1.0 | Manipulation dates |

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Convex | 1.31.2 | Backend-as-a-Service (BaaS) |
| Clerk | 6.36.3 | Authentication |

### Hosting

| Service | Usage |
|---------|-------|
| Vercel | Hosting Next.js + Edge |
| Convex Cloud | Database + Functions |

---

## Schema Base de Données (Convex)

### Tables Principales

```
stations
├── code: string          # "DIF1", "DLY2"
├── name: string          # "Paris Denfert"
├── region?: string
├── ownerId: string       # Clerk user ID
├── plan: "free" | "pro" | "enterprise"
└── createdAt: number

drivers
├── stationId: Id<stations>
├── amazonId: string      # Transporter ID du CSV
├── name: string
├── isActive: boolean
├── firstSeenWeek?: string # "2025-49"
├── createdAt: number
└── updatedAt: number

driverDailyStats
├── driverId: Id<drivers>
├── stationId: Id<stations>
├── date: string          # "2025-12-09"
├── year: number
├── week: number
├── dwcCompliant: number
├── dwcMisses: number
├── failedAttempts: number
├── iadcCompliant: number
├── iadcNonCompliant: number
├── dwcBreakdown?: { contactMiss, photoDefect, noPhoto, otpMiss, other }
├── iadcBreakdown?: { mailbox, unattended, safePlace, other }
└── createdAt: number

driverWeeklyStats
├── (mêmes champs agrégés)
├── daysWorked: number
└── updatedAt: number

stationWeeklyStats
├── stationId: Id<stations>
├── year: number
├── week: number
├── (totaux DWC/IADC)
├── totalDrivers: number
├── activeDrivers: number
├── tierDistribution: { fantastic, great, fair, poor }
└── (breakdowns agrégés)

coachingActions
├── driverId: Id<drivers>
├── stationId: Id<stations>
├── actionType: "discussion" | "warning" | "training" | "suspension"
├── status: "pending" | "improved" | "no_effect" | "escalated"
├── reason: string
├── notes?: string
├── dwcAtAction: number
├── dwcAfterAction?: number
├── followUpDate?: string
├── evaluatedAt?: number
├── createdBy: string
└── createdAt: number

imports
├── stationId: Id<stations>
├── filename: string
├── year: number
├── week: number
├── status: "pending" | "processing" | "success" | "partial" | "failed"
├── driversImported: number
├── dailyRecordsCount?: number
├── weeklyRecordsCount: number
├── dwcScore?: number
├── iadcScore?: number
├── tierDistribution?: { fantastic, great, fair, poor }
├── errors?: string[]
├── warnings?: string[]
└── importedBy: string
```

### Index Principaux

| Table | Index | Usage |
|-------|-------|-------|
| stations | by_owner, by_code | Lookup rapide |
| drivers | by_station, by_station_amazon | Liste par station |
| driverDailyStats | by_driver_date, by_station_week | Stats par période |
| driverWeeklyStats | by_driver_week, by_station_week | Agrégations |
| coachingActions | by_station_status, by_driver | Filtrage coaching |
| imports | by_station_week | Historique |

---

## Structure des Dossiers

```
/
├── convex/                    # Backend Convex
│   ├── _generated/            # Auto-généré (NE PAS MODIFIER)
│   ├── schema.ts              # Schema base de données
│   ├── auth.config.ts         # Config Clerk
│   ├── stations.ts            # Queries/Mutations stations
│   ├── drivers.ts             # Queries/Mutations drivers
│   ├── stats.ts               # Queries KPIs et agrégations
│   ├── coaching.ts            # CRUD coaching
│   ├── imports.ts             # Gestion imports
│   └── admin.ts               # Fonctions admin/debug
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout + providers
│   │   ├── page.tsx           # Landing page
│   │   ├── globals.css        # Tailwind base
│   │   └── dashboard/
│   │       ├── layout.tsx     # Dashboard layout (sidebar)
│   │       ├── page.tsx       # Dashboard principal
│   │       ├── drivers/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── coaching/page.tsx
│   │       ├── errors/page.tsx
│   │       ├── import/page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── dashboard/         # Composants dashboard
│   │   ├── drivers/           # Composants drivers
│   │   ├── coaching/          # Composants coaching
│   │   ├── errors/            # Composants erreurs
│   │   ├── import/            # Composants import
│   │   └── settings/          # Composants settings
│   │
│   ├── lib/
│   │   ├── store.ts           # Zustand store global
│   │   ├── types.ts           # Types TypeScript
│   │   ├── utils.ts           # Utilitaires (cn, etc)
│   │   ├── mock-data.ts       # À SUPPRIMER (legacy)
│   │   ├── calculations.ts    # Calculs DWC/IADC
│   │   ├── utils/
│   │   │   ├── tier.ts        # getTier, getTierColor
│   │   │   └── status.ts      # Status utilities
│   │   └── parser/
│   │       ├── index.ts       # Parser orchestrator
│   │       ├── html-extractor.ts
│   │       ├── csv-parser.ts
│   │       ├── aggregator.ts
│   │       └── types.ts
│   │
│   ├── hooks/
│   │   ├── use-import.ts
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   │
│   └── providers/
│       └── convex-client-provider.tsx
│
├── spec/                      # Documentation
│   ├── PRD.md
│   └── ARCHITECTURE.md
│
├── .claude/
│   ├── settings.local.json    # Permissions Claude
│   └── tasks/                 # Tâches structurées
│
├── CLAUDE.md                  # Règles projet
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.js
└── components.json            # Config shadcn
```

---

## Patterns & Conventions

### 1. Queries Convex avec États

```tsx
// Pattern standard pour queries avec loading/empty states
const data = useQuery(
  api.stats.getData,
  station ? { stationId: station._id, year, week } : "skip"
)

// Gestion des 3 états
if (!station || data === undefined) {
  return <LoadingSkeleton />
}

if (!data || data.length === 0) {
  return <EmptyState message="Aucune donnée" />
}

return <DataDisplay data={data} />
```

### 2. Composants Dashboard

```tsx
"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useDashboardStore } from "@/lib/store"

export function MyComponent() {
  const { selectedStation, selectedDate, granularity } = useDashboardStore()
  const station = useQuery(api.stations.getStationByCode, {
    code: selectedStation.code
  })

  const data = useQuery(
    api.stats.getMyData,
    station ? { stationId: station._id } : "skip"
  )

  // ...
}
```

### 3. Tier Classification

```tsx
import { getTier, getTierColor, getTierBgColor } from "@/lib/utils/tier"

// Classification
const tier = getTier(dwcPercent) // "fantastic" | "great" | "fair" | "poor"

// Couleurs
const textColor = getTierColor(tier) // "text-emerald-400"
const bgColor = getTierBgColor(tier)  // "bg-emerald-500/20 text-emerald-400"
```

### 4. Store Zustand

```tsx
// Lecture
const { selectedStation, selectedDate, granularity } = useDashboardStore()

// Actions
const { setSelectedStation, setSelectedDate, navigatePeriod } = useDashboardStore()
```

### 5. Mutations avec Toast

```tsx
import { useMutation } from "convex/react"
import { toast } from "sonner"

const createAction = useMutation(api.coaching.createAction)

const handleCreate = async () => {
  try {
    await createAction({ ... })
    toast.success("Action créée")
  } catch (error) {
    toast.error("Erreur lors de la création")
  }
}
```

---

## Calculs DWC/IADC

### Formules

```typescript
// DWC% = Compliant / (Compliant + Misses + Failed)
const dwcPercent = dwcCompliant / (dwcCompliant + dwcMisses + failedAttempts) * 100

// IADC% = Compliant / (Compliant + NonCompliant)
const iadcPercent = iadcCompliant / (iadcCompliant + iadcNonCompliant) * 100
```

### Tier Thresholds

```typescript
export const TIER_THRESHOLDS = {
  fantastic: 98.5,
  great: 96,
  fair: 90,
  poor: 0
}
```

---

## Sécurité

### Authentication Flow

```
1. User → Clerk (login)
2. Clerk → JWT Token
3. Token → Convex Auth
4. Convex → Queries/Mutations avec userId
```

### Autorisation Convex

```typescript
// Toutes les queries filtrent par ownerId
export const getStations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    return await ctx.db
      .query("stations")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .collect()
  }
})
```

---

## Performance

### Optimisations Convex

- **Indexes** sur toutes les queries fréquentes
- **Batch operations** pour imports (50 records/batch)
- **Pagination** sur les tables volumineuses
- **Skip** pour éviter queries inutiles

### Optimisations Frontend

- **React 19** avec compiler optimizations
- **Tailwind CSS** avec tree-shaking
- **Dynamic imports** pour les composants lourds (charts)
- **Image optimization** via Next.js

---

## Déploiement

### Variables d'Environnement

```env
# Convex
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Next.js
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### CI/CD

- **Vercel** déploie automatiquement sur push main
- **Preview deployments** sur PR
- **Convex** se sync automatiquement avec `convex dev`
