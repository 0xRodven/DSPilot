# Task 02: Rendre la liste des stations dynamique

## Phase
Phase 1 - Finalisation MVP

## Priorité
HAUTE

## Objectif
Charger les stations depuis Convex au lieu de la liste hardcodée dans `store.ts`

## Contexte
Actuellement, `src/lib/store.ts` contient une liste hardcodée:
```typescript
const stations = [
  { id: "1", name: "FR-PSUA-DIF1", code: "FR-PSUA-DIF1" },
  { id: "2", name: "Lyon Est", code: "DLY2" },
  { id: "3", name: "Marseille Sud", code: "DMS3" },
]
```

Ces stations doivent venir de Convex.

## Fichiers à Modifier

- `src/lib/store.ts` - Garder uniquement `selectedStation` (pas la liste)
- `src/components/dashboard/header.tsx` - Charger les stations via query
- `convex/stations.ts` - Ajouter query `listUserStations`

## Approche

### 1. Query Convex

```typescript
// convex/stations.ts
export const listUserStations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    return await ctx.db
      .query("stations")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .collect()
  }
})
```

### 2. Modifier le Header

```tsx
// header.tsx
const stations = useQuery(api.stations.listUserStations)
const { selectedStation, setSelectedStation } = useDashboardStore()

// Si aucune station sélectionnée, prendre la première
useEffect(() => {
  if (stations?.length && !selectedStation.id) {
    setSelectedStation({
      id: stations[0]._id,
      name: stations[0].name,
      code: stations[0].code
    })
  }
}, [stations])
```

### 3. Gérer le cas "aucune station"

- Si l'utilisateur n'a pas de station → afficher message + bouton "Importer"
- Rediriger vers `/dashboard/import`

## Steps

1. Créer `listUserStations` dans `convex/stations.ts`
2. Modifier le store pour ne garder que `selectedStation`
3. Modifier `header.tsx` pour charger les stations via query
4. Ajouter effet pour sélectionner la première station
5. Gérer l'état "aucune station"
6. Tester avec utilisateur ayant 0, 1, N stations

## Acceptance Criteria

- [ ] Stations chargées depuis Convex
- [ ] Sélecteur affiche les vraies stations de l'utilisateur
- [ ] Première station sélectionnée par défaut
- [ ] Station sélectionnée persiste (Zustand persist)
- [ ] Message clair si aucune station
- [ ] Navigation vers import si aucune station
