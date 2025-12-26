# Task 08: Ajouter animations subtiles

## Phase
Phase 2 - Polish UX

## Priorité
BASSE

## Objectif
Améliorer le feedback visuel avec des animations subtiles

## Types d'Animations

### 1. Transitions de page

```tsx
// Fade in au chargement
<main className="animate-in fade-in duration-300">
  {/* contenu */}
</main>
```

### 2. Hover effects

```tsx
// Cards
<Card className="transition-shadow hover:shadow-md">

// Buttons
<Button className="transition-transform active:scale-95">

// Table rows
<TableRow className="transition-colors hover:bg-muted/50">
```

### 3. Loading → Data transition

```tsx
// Skeleton → Content fade
<div className={cn(
  "transition-opacity duration-300",
  data ? "opacity-100" : "opacity-0"
)}>
  {data && <Content data={data} />}
</div>
```

### 4. Success animations

```tsx
// Checkmark après action réussie
import { motion, AnimatePresence } from "framer-motion"

<AnimatePresence>
  {success && (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    >
      <CheckCircle className="text-green-500" />
    </motion.div>
  )}
</AnimatePresence>
```

### 5. Charts animations

```tsx
// Recharts a des animations built-in
<LineChart>
  <Line
    animationDuration={500}
    animationEasing="ease-out"
  />
</LineChart>
```

### 6. Numbers count-up

```tsx
// Pour les KPIs
import { useSpring, animated } from "@react-spring/web"

function AnimatedNumber({ value }: { value: number }) {
  const { number } = useSpring({
    from: { number: 0 },
    to: { number: value },
    config: { tension: 300, friction: 20 }
  })
  return <animated.span>{number.to(n => n.toFixed(1))}</animated.span>
}
```

## Librairies Optionnelles

- `framer-motion` - Animations complexes
- `@react-spring/web` - Physics-based animations
- `tailwindcss-animate` - Déjà installé

## Steps

1. Ajouter transitions CSS de base (hover, focus)
2. Animer les skeletons → data
3. Ajouter hover effects sur cards/buttons
4. Animer les charts (built-in Recharts)
5. (Optionnel) Ajouter count-up sur KPIs

## Acceptance Criteria

- [ ] Hover effects sur éléments interactifs
- [ ] Transitions smooth entre états
- [ ] Charts animés au premier render
- [ ] Pas de jank/saccades
- [ ] Animations désactivables (prefers-reduced-motion)
