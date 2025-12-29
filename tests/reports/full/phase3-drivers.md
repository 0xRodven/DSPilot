# Phase 3: Drivers & Detail

## Résultat: PARTIAL PASS (bugs détectés)

## Date: 2025-12-28

## Vérifications Page Drivers (/dashboard/drivers)
- [x] Page charge: OK
- [!] Synchronisation semaine: BUG - Header affiche "Semaine 49" mais contenu affiche "Semaine 48"
- [ ] 4 cards stats tier: NON TESTABLE (pas de données sur la page drivers)
- [ ] Filtre par tier: NON TESTABLE

## Vérifications Dashboard - Section Drivers
- [x] Table "Tous les Drivers": OK - 82 drivers affichés
- [x] Colonnes: OK - #, Driver, Amazon ID, DWC%, IADC%, Jours, Tier
- [x] Tri DWC%: OK - Fonctionne (ascendant/descendant)
- [x] Recherche: OK - Filtre correctement
- [x] Pagination: OK - "Affichage 1-10 sur 82 drivers"
- [x] Menu "..." sur ligne: OK - S'ouvre avec options
- [!] Option "Voir détail": BUG - Ne navigue pas (onClick manquant)
- [!] Option "Planifier coaching": BUG - Ne navigue pas (onClick manquant)
- [!] Clic sur nom driver: BUG - Ne navigue pas

## Vérifications Top 5 Drivers
- [x] Liste visible: OK - 5 drivers affichés
- [x] Scores DWC%: OK - 100% pour tous les top
- [x] Toggle Top/Bottom: OK - Visible
- [x] Dropdown DWC%: OK - Visible
- [x] Lien "Voir tous": OK - Visible
- [!] Clic sur driver: BUG - Ne navigue pas vers page détail

## Vérifications Page Détail Driver
- [ ] NON TESTABLE - Navigation vers page détail impossible

## Bugs Détectés

### BUG CRITIQUE #1: Navigation vers page détail driver non fonctionnelle
**Localisation**: `src/components/dashboard/drivers-table.tsx:331-334`
**Description**: Le `DropdownMenuItem` "Voir détail" n'a pas de handler onClick
**Impact**: Impossible d'accéder à la page détail d'un driver depuis la table
**Code actuel**:
```tsx
<DropdownMenuItem>
  <Eye className="mr-2 h-4 w-4" />
  Voir détail
</DropdownMenuItem>
```
**Fix suggéré**: Ajouter onClick avec router.push(`/dashboard/drivers/${driver._id}`)

### BUG #2: "Planifier coaching" non fonctionnel
**Localisation**: `src/components/dashboard/drivers-table.tsx:335-338`
**Description**: Le `DropdownMenuItem` "Planifier coaching" n'a pas de handler onClick
**Impact**: Impossible de planifier un coaching depuis la table

### BUG #3: Désynchronisation semaine sur page Drivers
**Description**: La page /dashboard/drivers affiche "Semaine 48" alors que le header global affiche "Semaine 49"
**Impact**: Confusion utilisateur, pas de données affichées

### BUG #4: Top 5 Drivers non cliquables
**Description**: Les drivers dans la section Top 5 ne sont pas cliquables
**Impact**: Mauvaise UX, l'utilisateur s'attend à pouvoir cliquer pour voir les détails

## Observations
- La page détail driver existe (`/dashboard/drivers/[id]/page.tsx`) mais est inaccessible via l'UI
- Les données des drivers sont correctement chargées et affichées
- L'interactivité de la table (tri, recherche, pagination) fonctionne bien

## Recommandations
1. URGENT: Ajouter les handlers onClick aux DropdownMenuItems
2. Synchroniser l'état de la semaine entre le header et la page Drivers
3. Rendre les cards Top 5 Drivers cliquables
