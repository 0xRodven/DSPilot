# Task 03: Implémenter les Settings Station

## Phase
Phase 1 - Finalisation MVP

## Priorité
MOYENNE

## Objectif
Permettre de modifier les informations de la station (nom, code)

## Fichiers à Modifier

- `src/components/settings/station-settings.tsx`
- `convex/stations.ts` - Ajouter mutation `updateStation`

## Fonctionnalités

### Affichage
- Nom de la station (éditable)
- Code de la station (éditable avec validation)
- Date de création (lecture seule)
- Plan actuel (lecture seule pour MVP)

### Édition
- Formulaire inline ou modal
- Validation du code (unique)
- Feedback avec toast

## Implémentation

### Mutation Convex

```typescript
// convex/stations.ts
export const updateStation = mutation({
  args: {
    stationId: v.id("stations"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
  },
  handler: async (ctx, { stationId, name, code }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const station = await ctx.db.get(stationId)
    if (!station || station.ownerId !== identity.subject) {
      throw new Error("Station not found or not owned")
    }

    // Vérifier unicité du code si changé
    if (code && code !== station.code) {
      const existing = await ctx.db
        .query("stations")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first()
      if (existing) {
        throw new Error("Ce code de station existe déjà")
      }
    }

    await ctx.db.patch(stationId, {
      ...(name && { name }),
      ...(code && { code }),
    })
  }
})
```

### Composant UI

```tsx
// station-settings.tsx
"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useState } from "react"
import { toast } from "sonner"

export function StationSettings() {
  const { selectedStation } = useDashboardStore()
  const station = useQuery(api.stations.getStationByCode, {
    code: selectedStation.code
  })
  const updateStation = useMutation(api.stations.updateStation)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")

  const handleSave = async () => {
    try {
      await updateStation({
        stationId: station._id,
        name,
        code,
      })
      toast.success("Station mise à jour")
      setIsEditing(false)
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ...
}
```

## Steps

1. Créer mutation `updateStation` dans `convex/stations.ts`
2. Modifier `station-settings.tsx` pour afficher les vraies données
3. Ajouter mode édition (inline ou modal)
4. Implémenter la sauvegarde avec feedback
5. Tester la validation du code unique

## Acceptance Criteria

- [ ] Affiche les infos de la station actuelle
- [ ] Permet de modifier le nom
- [ ] Permet de modifier le code (avec validation unicité)
- [ ] Toast de succès/erreur
- [ ] Mise à jour reflétée dans le header
