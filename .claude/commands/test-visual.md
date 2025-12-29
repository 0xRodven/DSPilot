# Test Visual

Capture l'état visuel d'une page pour régression visuelle.

## Usage

```
/test-visual [page]
```

**Pages disponibles:**
dashboard, drivers, driver-detail, import, coaching, errors, settings, calendar, recaps

## Arguments

$ARGUMENTS

## Prérequis

- `npm run dev` actif sur localhost:3005
- Utilisateur authentifié
- Page avec données (pas d'état vide)

## Instructions

1. **Naviguer vers la page**
   - Aller à l'URL correspondante
   - Attendre chargement complet

2. **Viewport Desktop (1920x1080)**
   - Redimensionner fenêtre si nécessaire
   - Attendre stabilisation UI
   - Capture pleine page
   - Sauvegarder: `{page}-desktop-{date}.png`

3. **Viewport Mobile (390x844)**
   - Redimensionner à taille iPhone 14
   - Attendre adaptation responsive
   - Capture pleine page
   - Sauvegarder: `{page}-mobile-{date}.png`

4. **Interactions clés (optionnel)**
   - Hover sur éléments importants
   - États ouverts (dropdowns, modals)
   - Capturer ces états

5. **Générer rapport**
   - Sauvegarder dans `tests/reports/visual-{page}-{date}.md`

## Viewports

| Device | Largeur | Hauteur |
|--------|---------|---------|
| Desktop | 1920px | 1080px |
| Tablet | 1024px | 768px |
| Mobile | 390px | 844px |

## Comparaison (si captures précédentes existent)

1. Charger capture précédente
2. Comparer visuellement
3. Noter différences:
   - Mineures: Changements de données
   - Majeures: Changements de layout/style
4. Signaler si régression suspectée

## Rapport Template

```markdown
# Visual Test: {page} - {date}

## Captures

### Desktop (1920x1080)
![Desktop](./screenshots/{page}-desktop-{date}.png)

### Mobile (390x844)
![Mobile](./screenshots/{page}-mobile-{date}.png)

## Observations
- Layout: OK/Issues
- Responsive: OK/Issues
- Éléments manquants: Aucun/Liste

## Comparaison avec précédent
- Différences mineures: ...
- Différences majeures: ...
- Régression: Oui/Non

## Interactions capturées
- [Dropdown ouvert](./screenshots/...)
- [Modal visible](./screenshots/...)
```

## Tips

- Attendre que les animations soient terminées
- Fermer les toasts/notifications avant capture
- S'assurer que les données sont chargées (pas de skeleton)
- Pour les charts: attendre le rendu complet
