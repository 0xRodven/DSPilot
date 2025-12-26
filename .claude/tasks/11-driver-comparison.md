# Task 11: Comparaison de drivers

## Phase
Phase 3 - Features Additionnelles

## Priorité
BASSE

## Objectif
Permettre de comparer 2-3 drivers côte à côte

## Fonctionnalités

### Sélection
- Checkbox dans la table des drivers
- Maximum 3 drivers sélectionnés
- Bouton "Comparer" quand >= 2 sélectionnés

### Vue Comparaison
- KPIs côte à côte
- Graphique avec courbes superposées
- Breakdown erreurs comparé
- Historique coaching

## Implémentation

### Store

```typescript
// lib/store.ts
interface DashboardState {
  // ...existing
  selectedDriversForComparison: string[]
  addDriverToComparison: (driverId: string) => void
  removeDriverFromComparison: (driverId: string) => void
  clearComparison: () => void
}
```

### Table avec checkbox

```tsx
<TableCell>
  <Checkbox
    checked={selectedDrivers.includes(driver.id)}
    disabled={!selectedDrivers.includes(driver.id) && selectedDrivers.length >= 3}
    onCheckedChange={(checked) => {
      if (checked) {
        addDriverToComparison(driver.id)
      } else {
        removeDriverFromComparison(driver.id)
      }
    }}
  />
</TableCell>
```

### Bouton comparer

```tsx
{selectedDrivers.length >= 2 && (
  <Button onClick={() => router.push(`/dashboard/compare?ids=${selectedDrivers.join(",")}`)}>
    <GitCompare className="h-4 w-4 mr-2" />
    Comparer ({selectedDrivers.length})
  </Button>
)}
```

### Page Comparaison

```tsx
// app/dashboard/compare/page.tsx
export default function ComparePage() {
  const searchParams = useSearchParams()
  const ids = searchParams.get("ids")?.split(",") ?? []

  const drivers = useQuery(api.drivers.getMultipleDrivers, { ids })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {drivers?.map(driver => (
        <DriverComparisonCard key={driver.id} driver={driver} />
      ))}
    </div>
  )
}
```

### Graphique superposé

```tsx
<LineChart>
  {drivers.map((driver, i) => (
    <Line
      key={driver.id}
      dataKey={`driver${i}`}
      stroke={COMPARISON_COLORS[i]}
      name={driver.name}
    />
  ))}
</LineChart>
```

## Steps

1. Ajouter state dans Zustand pour sélection
2. Modifier table drivers avec checkboxes
3. Ajouter bouton "Comparer"
4. Créer page `/dashboard/compare`
5. Créer composants de comparaison
6. Tester avec 2 et 3 drivers

## Acceptance Criteria

- [ ] Sélection multiple dans table (max 3)
- [ ] Bouton comparer visible si >= 2
- [ ] Page de comparaison claire
- [ ] KPIs côte à côte
- [ ] Graphique avec légende
- [ ] Navigation facile vers detail driver
