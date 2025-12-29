# CLAUDE.md - Règles du Projet DSPilot

## Contexte

DSPilot est une plateforme SaaS de gestion des performances livreurs Amazon (DWC/IADC).

**Stack**: Next.js 16 + React 19 + Convex + Clerk + Tailwind + shadcn

---

## Commandes

```bash
# Développement
npm run dev              # Lance Next.js + Convex dev server

# Build
npm run build            # Build production
npm run lint             # Linting ESLint

# Convex
npx convex dev           # Lance Convex séparément
npx convex deploy        # Déploie en production
```

---

## Règles de Code

### TypeScript

- Mode strict activé (`strict: true`)
- Toujours typer les props des composants
- Utiliser `type` pour les unions, `interface` pour les objets extensibles
- Import types avec `import type { ... }`
- **Jamais de `any`** - utiliser `unknown` si nécessaire

### React / Next.js

- **App Router** uniquement (pas de pages/)
- `"use client"` explicite pour composants interactifs
- Server Components par défaut
- **Pas de useEffect pour le data fetching** → utiliser Convex

### Convex

- **Queries** = lecture seule, mise en cache auto
- **Mutations** = modifications, optimistic updates possible
- Toujours valider les args avec `v.*` validators
- Utiliser les **indexes** pour les queries fréquentes
- **`"skip"`** si les args ne sont pas prêts

### Styling

- **Tailwind CSS uniquement** (pas de CSS modules)
- shadcn/ui pour composants de base
- `cn()` pour merger les classes (voir `lib/utils.ts`)
- Variables CSS du thème: `foreground`, `muted`, `primary`, etc.

---

## Patterns à Suivre

### 1. Query Pattern avec Loading/Empty States

```tsx
const station = useQuery(api.stations.getStationByCode, { code })
const data = useQuery(
  api.stats.getData,
  station ? { stationId: station._id } : "skip"
)

if (!station || data === undefined) {
  return <Skeleton className="h-32 w-full" />
}

if (!data || data.length === 0) {
  return (
    <div className="flex flex-col items-center py-8 text-muted-foreground">
      <Database className="h-8 w-8 mb-2" />
      <p>Aucune donnée disponible</p>
    </div>
  )
}

return <DataDisplay data={data} />
```

### 2. Composant Dashboard Standard

```tsx
"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useDashboardStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MyComponent() {
  const { selectedStation, selectedDate, granularity } = useDashboardStore()
  // ... queries et logique

  return (
    <Card>
      <CardHeader>
        <CardTitle>Titre</CardTitle>
      </CardHeader>
      <CardContent>
        {/* contenu */}
      </CardContent>
    </Card>
  )
}
```

### 3. Tier Colors

```tsx
import { getTier, getTierColor, getTierBgColor } from "@/lib/utils/tier"

const tier = getTier(dwcPercent) // "fantastic" | "great" | "fair" | "poor"
const textColor = getTierColor(tier) // "text-emerald-400"
const bgColor = getTierBgColor(tier)  // "bg-emerald-500/20 text-emerald-400"

// Thresholds
// fantastic: >= 98.5%
// great: >= 96%
// fair: >= 90%
// poor: < 90%
```

### 4. Mutations avec Feedback

```tsx
import { useMutation } from "convex/react"
import { toast } from "sonner"

const createAction = useMutation(api.coaching.createAction)

const handleCreate = async (data: FormData) => {
  try {
    await createAction({
      driverId,
      actionType: data.type,
      reason: data.reason,
      // ...
    })
    toast.success("Action de coaching créée")
  } catch (error) {
    toast.error("Erreur lors de la création")
    console.error(error)
  }
}
```

---

## Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `convex/schema.ts` | Schema base de données |
| `src/lib/store.ts` | State global Zustand |
| `src/lib/types.ts` | Types TypeScript centralisés |
| `src/lib/utils/tier.ts` | Classification et couleurs des tiers |
| `src/lib/parser/index.ts` | Parser HTML Amazon |

---

## Ce qu'il NE FAUT PAS Faire

- **NE PAS** modifier `convex/_generated/` (auto-généré)
- **NE PAS** utiliser `useState` pour les données serveur (utiliser Convex)
- **NE PAS** hardcoder de données (tout via Convex)
- **NE PAS** créer de fichiers CSS (Tailwind only)
- **NE PAS** utiliser `any` en TypeScript
- **NE PAS** utiliser `useEffect` pour fetch data
- **NE PAS** importer depuis `mock-data.ts` (legacy à supprimer)

---

## Documentation

- **PRD**: `spec/PRD.md` - Vision produit et features
- **Architecture**: `spec/ARCHITECTURE.md` - Stack et patterns techniques
- **Tasks**: `.claude/tasks/` - Tâches structurées par phase

---

## Commandes Claude Recommandées

### Pour les bugs simples
```
/one-shot <description du bug>
```
Mode autonome, pas de questions, exécution directe.

### Pour les features moyennes
```
/apex <description de la feature>
```
Crée un plan, pose des questions, puis implémente.

### Pour les features complexes
```
/apex-file analyze <description>
/apex-file plan
/apex-file implement
```
Workflow en plusieurs étapes avec fichiers d'analyse.

---

## Vérifications Qualité

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build (vérifie tout)
npm run build
```

---

## Testing avec Claude Chrome Extension

Ce projet utilise l'extension Chrome de Claude Code pour les tests, pas Playwright/Jest.

### Lancer les tests

```bash
# 1. S'assurer que l'app tourne
npm run dev

# 2. Lancer Claude avec Chrome
claude --chrome

# 3. Utiliser les slash commands
/test-smoke              # Test rapide (~30s)
/test-page dashboard     # Tester une page
/test-flow weekly-review # Parcours utilisateur
/test-visual dashboard   # Screenshots
```

### Commandes disponibles

| Commande | Description | Durée |
|----------|-------------|-------|
| `/test-smoke` | Vérification rapide santé app | ~30s |
| `/test-page [page]` | Test complet d'une page | 3-5 min |
| `/test-flow [flow]` | Parcours utilisateur multi-pages | 3-5 min |
| `/test-visual [page]` | Captures pour régression visuelle | 2 min |
| `/test-full` | **Test complet 85 items** | 20-30 min |

### Pages testables

`dashboard`, `drivers`, `driver-detail`, `import`, `coaching`, `errors`, `settings`

### Flows testables

`weekly-review`, `coach-driver`, `import-verify`

### Test Full (Couverture Complète)

Le `/test-full` exécute **85 vérifications** en 6 phases:
1. Auth & Navigation
2. Dashboard complet
3. Drivers & Detail
4. Import & Coaching
5. Errors & Settings
6. Cross-page & Responsive

Checklist: `tests/cases/full/checklist.md`
Rapports: `tests/reports/full/`

### Best Practices

1. **Avant de tester**
   - `npm run dev` actif sur localhost:3005
   - Être authentifié dans Chrome (Clerk)
   - Avoir des données importées

2. **Gestion contexte**
   - Un test à la fois
   - `/compact` si contexte > 50%
   - Rapports générés dans `tests/reports/`

3. **Attente Convex**
   - Attendre disparition des skeletons
   - Ne pas vérifier valeurs exactes (données varient)
   - Vérifier présence d'éléments, pas contenu

4. **Screenshots**
   - Pleine page, pas section par section
   - Format: `{page}-{action}-{date}.png`
   - Stockés dans `tests/reports/screenshots/`

### Structure tests

```
tests/
├── cases/           # Définitions tests (Markdown)
│   ├── smoke/       # Tests santé
│   ├── pages/       # Tests par page (7 pages)
│   ├── flows/       # Parcours utilisateur (3 flows)
│   └── full/        # Checklist complète (85 items)
├── helpers/         # Instructions réutilisables
└── reports/
    ├── screenshots/ # Captures
    └── full/        # Rapports test-full
```

### Format cas de test

```markdown
# Test: {Nom}

## Prérequis
- Condition 1

## Tests
### T1: Nom test
- Action: Ce qu'il faut faire
- Attendu: Ce qu'on doit voir

## Assertions
- [ ] Check 1
```

### Limitations

- Pas de CI/CD automatisé (tests manuels via `claude --chrome`)
- Chrome uniquement (pas Brave/Arc)
- Consomme du contexte Claude
