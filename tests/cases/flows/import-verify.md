# Flow: Import & Verify

Parcours complet pour importer des données et vérifier leur intégration.

## Durée estimée

2-3 minutes (sans fichier réel: observation seulement)

## Prérequis

- Utilisateur authentifié
- Fichier test (optionnel): HTML DWC ou CSV driver names
- Station configurée

---

## Phase 1: Accéder à l'Import

### 1.1 Naviguer vers Import

- **Action**: Cliquer "Import" dans sidebar
- **Attendu**: Page import charge

### 1.2 Observer l'État Initial

- **À noter**:
  - Dernière semaine importée: ____
  - Nombre total d'imports: ____
  - Statuts des imports récents: ____

- **Screenshot**: `flow-import-phase1-initial.png`

---

## Phase 2: Examiner la Dropzone

### 2.1 Vérifier la Zone de Drop

- **Assertions**:
  - [ ] Zone clairement délimitée
  - [ ] Icône upload visible
  - [ ] Instructions présentes
  - [ ] Formats acceptés indiqués (HTML, CSV)

### 2.2 Tester le Hover (si possible)

- **Action**: Passer la souris sur la zone
- **Attendu**: Feedback visuel (changement bordure/couleur)

---

## Phase 3: Examiner l'Historique

### 3.1 Observer la Liste des Imports

- **Assertions**:
  - [ ] Tableau ou liste visible
  - [ ] Colonnes: Date, Semaine, Fichier, Statut, Records

### 3.2 Vérifier les Statuts

- **Couleurs attendues**:
  - Success: vert
  - Failed: rouge
  - Processing: jaune/orange
  - Partial: orange

### 3.3 Détails Import (si cliquable)

- **Action**: Cliquer sur un import passé
- **Attendu**:
  - Détails affichés (modal ou expansion)
  - Nombre de records
  - Erreurs/warnings si applicable

- **Screenshot**: `flow-import-phase3-history.png`

---

## Phase 4: Simuler Upload (Optionnel)

> Note: Cette phase nécessite un fichier test réel

### 4.1 Préparer le Fichier

- **Fichier**: HTML DWC ou CSV
- **Semaine**: Différente des imports existants

### 4.2 Upload

- **Action**: Drag & drop ou clic pour sélectionner
- **Attendu**:
  - Fichier accepté
  - Preview ou parsing

### 4.3 Preview (si disponible)

- **Attendu**:
  - Nombre de drivers détectés
  - Semaine identifiée
  - Bouton confirmer/annuler

### 4.4 Confirmer

- **Action**: Cliquer "Importer" / "Confirmer"
- **Attendu**:
  - Progress indicator
  - Toast success
  - Historique mis à jour

- **Screenshot**: `flow-import-phase4-success.png`

---

## Phase 5: Vérifier dans Dashboard

### 5.1 Naviguer vers Dashboard

- **Action**: Cliquer "Dashboard" dans sidebar
- **Attendu**: Dashboard charge

### 5.2 Vérifier Period Picker

- **Action**: Sélectionner la semaine importée
- **Attendu**: Données de la semaine affichées

### 5.3 Vérifier KPIs

- **Assertions**:
  - [ ] DWC% affiché
  - [ ] IADC% affiché
  - [ ] Nombre drivers correct

- **Screenshot**: `flow-import-phase5-dashboard.png`

### 5.4 Vérifier Table Drivers

- **Action**: Scroll vers table
- **Attendu**: Drivers de l'import visibles

---

## Phase 6: Vérifier dans Drivers

### 6.1 Naviguer vers Drivers

- **Action**: Aller /dashboard/drivers

### 6.2 Vérifier Compteurs

- **Assertions**:
  - [ ] Total drivers cohérent
  - [ ] Répartition par tier cohérente

### 6.3 Vérifier un Driver

- **Action**: Cliquer sur un driver
- **Attendu**: Données de la semaine importée visibles dans historique

---

## Rapport Final

```markdown
# Flow Import & Verify - {date}

## Import effectué: OUI/NON (observation seulement)

## Résultat: PASS/FAIL
## Durée: Xm Xs

## Phase 1: Accès
- [ ] Page import charge: OK/FAIL
- [ ] État initial noté: OK/FAIL

## Phase 2: Dropzone
- [ ] Zone visible: OK/FAIL
- [ ] Instructions présentes: OK/FAIL
- [ ] Formats indiqués: OK/FAIL

## Phase 3: Historique
- [ ] Liste imports visible: OK/FAIL
- [ ] Statuts colorés: OK/FAIL
- [ ] Détails accessibles: OK/FAIL/N/A

## Phase 4: Upload (si effectué)
- [ ] Fichier accepté: OK/FAIL/SKIP
- [ ] Preview correct: OK/FAIL/SKIP
- [ ] Import success: OK/FAIL/SKIP

## Phase 5: Dashboard
- [ ] Semaine sélectionnable: OK/FAIL
- [ ] KPIs affichés: OK/FAIL
- [ ] Données cohérentes: OK/FAIL

## Phase 6: Drivers
- [ ] Compteurs corrects: OK/FAIL
- [ ] Données driver: OK/FAIL

## État Historique Import

| Date | Semaine | Statut | Records |
|------|---------|--------|---------|
| ... | ... | ... | ... |

## Screenshots
- [Page import](./screenshots/flow-import-phase1-initial.png)
- [Historique](./screenshots/flow-import-phase3-history.png)
- [Dashboard après](./screenshots/flow-import-phase5-dashboard.png)

## Bugs détectés
...
```

---

## Critères de succès

- [ ] Page import accessible
- [ ] Dropzone fonctionnelle visuellement
- [ ] Historique imports visible
- [ ] Statuts colorés correctement
- [ ] (Si upload) Import réussit
- [ ] Dashboard reflète les données
- [ ] Cross-page cohérent
