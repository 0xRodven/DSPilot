# Task 05: Améliorer les loading states

## Phase
Phase 2 - Polish UX

## Priorité
MOYENNE

## Objectif
Ajouter des skeletons cohérents sur toutes les pages

## Contexte
Actuellement, certains composants utilisent `animate-pulse` mais de manière inconsistante.
Besoin d'un système unifié de skeletons.

## Composants à Améliorer

### Dashboard
- `kpi-cards.tsx` - 4 cartes skeleton
- `performance-chart.tsx` - Chart skeleton
- `tier-distribution.tsx` - Pie chart skeleton
- `top-drivers.tsx` - Liste skeleton
- `top-errors.tsx` - Liste skeleton
- `drivers-table.tsx` - Table skeleton

### Drivers
- `tier-stats-cards.tsx` - Cartes skeleton
- `drivers-list-table.tsx` - Table skeleton

### Driver Detail
- Tous les composants

### Coaching
- `coaching-kpis.tsx`
- `coaching-suggestions.tsx`
- `action-card.tsx`

### Errors
- `error-kpis.tsx`
- `breakdown-chart.tsx`

## Patterns

### Skeleton Card

```tsx
function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}
```

### Skeleton Table

```tsx
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" /> {/* Header */}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
```

### Skeleton Chart

```tsx
function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-end gap-2 p-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1"
          style={{ height: `${30 + Math.random() * 70}%` }}
        />
      ))}
    </div>
  )
}
```

## Steps

1. Créer `src/components/ui/skeletons.tsx` avec les patterns réutilisables
2. Remplacer les `animate-pulse` par les vrais Skeleton
3. S'assurer que les skeletons matchent la structure des données
4. Tester visuellement sur chaque page

## Acceptance Criteria

- [ ] Skeletons sur toutes les pages
- [ ] Structure similaire aux données finales
- [ ] Transition smooth vers les vraies données
- [ ] Pas de layout shift au chargement
