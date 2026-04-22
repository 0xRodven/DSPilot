---
globs:
  - "src/components/**"
  - "src/app/**"
  - "src/lib/**"
---

# Règles Frontend DSPilot

## React / Next.js
- App Router uniquement — jamais de `pages/`
- Server Components par défaut — `"use client"` uniquement pour : forms, state, hooks, event handlers
- Jamais `useEffect` pour fetch — utiliser Convex queries (`useQuery`)
- Jamais `useState` pour data serveur

## Styling
- Tailwind CSS uniquement — jamais de CSS modules
- `cn()` pour merger les classes (import depuis `@/lib/utils`)
- shadcn/ui pour les composants de base
- Variables CSS du thème : `foreground`, `muted`, `primary`, `card`

## Patterns Convex côté client
- `useQuery(api.x.y, station ? { stationId } : "skip")` — "skip" si args pas prêts
- Skeletons pendant le chargement (`undefined` = loading, `null` = not found)
- Optimistic updates via `useMutation` + `optimisticUpdate`

## Tiers DWC
- fantastic ≥ 95% | great ≥ 90% | fair ≥ 88% | poor < 88%
- Toujours utiliser `getTier()` / `getTierColor()` depuis `@/lib/utils/tier`
- Jamais hardcoder les couleurs de tier
