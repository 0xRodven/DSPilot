# Task 01: Connecter la page Driver Detail à Convex

## Phase
Phase 1 - Finalisation MVP

## Priorité
HAUTE

## Objectif
Remplacer les données mock par de vraies queries Convex dans `/dashboard/drivers/[id]`

## Contexte
La page driver detail utilise actuellement `getDriverById` depuis `mock-data.ts`.
Toutes les données affichées sont fictives. Il faut connecter à Convex.

## Fichiers à Modifier

### Page principale
- `src/app/dashboard/drivers/[id]/page.tsx`

### Composants
- `src/components/drivers/driver-header.tsx`
- `src/components/drivers/driver-kpis.tsx`
- `src/components/drivers/driver-performance-chart.tsx`
- `src/components/drivers/error-breakdown.tsx`
- `src/components/drivers/daily-performance.tsx`

### Convex (nouvelles queries si nécessaire)
- `convex/drivers.ts` - Ajouter `getDriverById` avec stats
- `convex/coaching.ts` - Ajouter query par driverId

## Queries Convex à Utiliser/Créer

```typescript
// drivers.ts
export const getDriverDetail = query({
  args: { driverId: v.id("drivers") },
  handler: async (ctx, { driverId }) => {
    const driver = await ctx.db.get(driverId)
    // + enrichir avec stats, coaching, etc.
  }
})

// stats.ts - existe déjà
getDriverWeeklyStats(driverId, year, week)
getDriverDailyStats(driverId, year, week)

// coaching.ts - ajouter
getDriverCoachingHistory(driverId)
```

## Steps

1. **Créer query `getDriverDetail`** dans `convex/drivers.ts`
   - Récupérer le driver par ID
   - Joindre les weekly stats
   - Calculer DWC%, IADC%, tier
   - Retourner objet enrichi

2. **Créer query `getDriverCoachingHistory`** dans `convex/coaching.ts`
   - Lister les actions par driver
   - Trier par date décroissante

3. **Modifier `page.tsx`**
   - Remplacer `getDriverById(id)` par `useQuery(api.drivers.getDriverDetail, { driverId })`
   - Ajouter loading state
   - Gérer le cas driver non trouvé

4. **Modifier composants enfants**
   - Passer les vraies données via props
   - Adapter les types si nécessaire

5. **Tester**
   - Vérifier que toutes les sections s'affichent
   - Tester avec un driver existant après import

## Acceptance Criteria

- [ ] Page charge les vraies données depuis Convex
- [ ] Loading skeleton pendant le chargement
- [ ] Message d'erreur si driver non trouvé
- [ ] KPIs affichent les vraies valeurs
- [ ] Graphique performance fonctionne
- [ ] Historique coaching visible
- [ ] Breakdown erreurs correct

## Notes

- S'assurer que les index Convex sont utilisés
- Prévoir le cas où le driver n'a pas encore de stats
