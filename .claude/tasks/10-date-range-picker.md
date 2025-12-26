# Task 10: Sélecteur de période amélioré

## Phase
Phase 3 - Features Additionnelles

## Priorité
MOYENNE

## Objectif
Permettre la sélection de plages de dates custom

## Contexte
Actuellement, on peut seulement naviguer semaine par semaine.
Besoin de pouvoir sélectionner une plage personnalisée.

## Composant shadcn

Utiliser le `DateRangePicker` de shadcn/ui:
```bash
npx shadcn@latest add date-range-picker
```

## Implémentation

### Store Zustand

```typescript
// lib/store.ts
interface DashboardState {
  // ...existing
  dateRange: { from: Date; to: Date } | null
  setDateRange: (range: { from: Date; to: Date } | null) => void
}
```

### Composant Header

```tsx
import { DatePickerWithRange } from "@/components/ui/date-range-picker"

export function DateSelector() {
  const { dateRange, setDateRange, selectedDate } = useDashboardStore()

  return (
    <div className="flex items-center gap-2">
      {/* Mode semaine */}
      <Button variant="outline" size="sm" onClick={prevWeek}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[240px]">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange
              ? `${format(dateRange.from, "d MMM")} - ${format(dateRange.to, "d MMM")}`
              : `Semaine ${getWeek(selectedDate)}`
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="sm" onClick={nextWeek}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

### Queries Convex

Adapter les queries pour supporter les ranges:

```typescript
// stats.ts
export const getStatsForDateRange = query({
  args: {
    stationId: v.id("stations"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { stationId, startDate, endDate }) => {
    return await ctx.db
      .query("driverDailyStats")
      .withIndex("by_station_date", (q) =>
        q.eq("stationId", stationId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect()
  }
})
```

## Steps

1. Installer DateRangePicker de shadcn
2. Modifier le store pour stocker dateRange
3. Remplacer le sélecteur de date dans le header
4. Créer/modifier les queries pour supporter les ranges
5. Adapter les composants dashboard pour les ranges
6. Tester avec différentes plages

## Acceptance Criteria

- [ ] Sélection de plage via calendrier
- [ ] Affichage clair de la plage sélectionnée
- [ ] Navigation rapide semaine +/-
- [ ] Presets: "Cette semaine", "Mois dernier", etc.
- [ ] Queries adaptées aux ranges
- [ ] Agrégation correcte sur la période
