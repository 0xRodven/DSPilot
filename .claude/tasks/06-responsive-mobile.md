# Task 06: Optimiser le responsive mobile

## Phase
Phase 2 - Polish UX

## Priorité
MOYENNE

## Objectif
Vérifier et améliorer l'affichage mobile sur toutes les pages

## Points à Vérifier

### Navigation
- [ ] Sidebar collapse sur mobile
- [ ] Menu hamburger fonctionnel
- [ ] Header adapté (station selector)
- [ ] Navigation tactile fluide

### Dashboard
- [ ] KPI cards en stack vertical
- [ ] Charts scrollables horizontalement
- [ ] Table avec scroll horizontal
- [ ] Sélecteur de date adapté

### Tables
- [ ] Scroll horizontal smooth
- [ ] Colonnes prioritaires fixes
- [ ] Actions accessibles

### Formulaires
- [ ] Inputs full-width
- [ ] Modals adaptés (full screen sur mobile)
- [ ] Touch targets suffisants (44px min)

### Charts
- [ ] Taille adaptée
- [ ] Légendes repositionnées
- [ ] Touch pour tooltips

## Breakpoints Tailwind

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

## Patterns à Appliquer

### Grid responsive

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* KPI Cards */}
</div>
```

### Table responsive

```tsx
<div className="overflow-x-auto">
  <Table className="min-w-[600px]">
    {/* ... */}
  </Table>
</div>
```

### Modal responsive

```tsx
<DialogContent className="max-w-full sm:max-w-lg">
  {/* ... */}
</DialogContent>
```

## Steps

1. Tester chaque page en viewport mobile (375px)
2. Identifier les problèmes de layout
3. Appliquer les fixes responsive
4. Tester les interactions tactiles
5. Vérifier sur plusieurs tailles d'écran

## Acceptance Criteria

- [ ] Toutes pages lisibles sur mobile (375px)
- [ ] Navigation mobile fonctionnelle
- [ ] Tables scrollables
- [ ] Charts adaptés
- [ ] Touch targets >= 44px
- [ ] Pas de scroll horizontal parasite
