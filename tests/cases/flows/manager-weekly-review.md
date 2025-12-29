# Flow: Revue Hebdomadaire Manager

Parcours complet d'un manager qui consulte les performances de sa station.

## Durée estimée

2-3 minutes

## Prérequis

- Utilisateur authentifié
- Station avec données pour semaine courante et précédente
- Au moins 1 driver en tier "Poor"

---

## Phase 1: Vue d'ensemble Dashboard

### 1.1 Accéder au Dashboard

- **Action**: Naviguer vers `/dashboard`
- **Attendu**: Dashboard charge avec KPIs
- **Screenshot**: `flow-weekly-phase1-dashboard.png`

### 1.2 Noter les KPIs actuels

- **Action**: Observer les 4 KPI cards
- **À noter**:
  - DWC%: ____
  - IADC%: ____
  - Drivers actifs: ____
  - Alertes: ____

### 1.3 Comparer avec semaine précédente

- **Action**: Cliquer flèche gauche du period picker
- **Attendu**:
  - Période change (semaine N-1 affichée)
  - KPIs se mettent à jour
- **À noter**:
  - DWC% semaine précédente: ____
  - Évolution: +/- ____

- **Screenshot**: `flow-weekly-phase1-previous.png`

### 1.4 Revenir à la semaine courante

- **Action**: Cliquer bouton "Aujourd'hui" ou flèche droite
- **Attendu**: Retour semaine courante

---

## Phase 2: Analyse des Drivers

### 2.1 Identifier les drivers Poor

- **Action**: Scroll vers table drivers OU naviguer vers `/dashboard/drivers`
- **Attendu**: Table avec tous les drivers

### 2.2 Filtrer par Poor

- **Action**:
  - Cliquer sur card "Poor" OU
  - Utiliser filtre tier → sélectionner "Poor"
- **Attendu**:
  - Seuls drivers Poor affichés
  - Compteur mis à jour
- **À noter**: Nombre de drivers Poor: ____
- **Screenshot**: `flow-weekly-phase2-poor.png`

### 2.3 Examiner un driver Poor

- **Action**: Cliquer sur le premier driver de la liste
- **Attendu**: Page détail driver s'ouvre
- **À vérifier**:
  - [ ] Historique performance visible
  - [ ] Breakdown erreurs visible
  - [ ] Actions coaching passées (si existantes)
- **Screenshot**: `flow-weekly-phase2-driver.png`

### 2.4 Retour à la liste

- **Action**: Cliquer bouton retour ou breadcrumb
- **Attendu**: Retour liste drivers (filtre peut être reset)

---

## Phase 3: Vérification Coaching

### 3.1 Naviguer vers Coaching

- **Action**: Cliquer "Coaching" dans sidebar
- **Attendu**: Page Kanban charge

### 3.2 Compter les actions en attente

- **Action**: Observer colonne "Attente" / "Pending"
- **À noter**: Actions en attente: ____
- **Screenshot**: `flow-weekly-phase3-coaching.png`

### 3.3 Vérifier follow-ups

- **Action**: Chercher actions avec date follow-up passée
- **Attendu**:
  - Si présentes: identifiables visuellement (couleur, badge)
  - Si absentes: OK

### 3.4 (Optionnel) Créer une action

Si driver Poor identifié sans action:
- **Action**: Créer nouvelle action de coaching
- **Type**: Discussion ou Warning
- **Raison**: "Performance en baisse - revue hebdo"

---

## Phase 4: Vérification Erreurs

### 4.1 Naviguer vers Erreurs

- **Action**: Cliquer "Erreurs" dans sidebar
- **Attendu**: Page analyse erreurs charge

### 4.2 Identifier erreurs principales

- **Action**: Observer top 5 erreurs
- **À noter**:
  - Erreur #1: ____
  - Erreur #2: ____
- **Screenshot**: `flow-weekly-phase4-errors.png`

---

## Rapport Final

```markdown
# Revue Hebdomadaire - {date}

## KPIs Station
| Métrique | Cette semaine | Semaine précédente | Évolution |
|----------|---------------|-------------------|-----------|
| DWC | __% | __% | +/- __% |
| IADC | __% | __% | +/- __% |
| Drivers actifs | __ | __ | +/- __ |

## Drivers à surveiller
- Nombre en tier Poor: __
- Drivers consultés:
  - {nom}: {DWC}%, {observations}

## Coaching
- Actions en attente: __
- Follow-ups à faire: __
- Action créée: Oui/Non

## Erreurs principales
1. {type}: {count}
2. {type}: {count}

## Recommandations
- ...
- ...

## Screenshots
- [Dashboard actuel](./screenshots/flow-weekly-phase1-dashboard.png)
- [Dashboard précédent](./screenshots/flow-weekly-phase1-previous.png)
- [Drivers Poor](./screenshots/flow-weekly-phase2-poor.png)
- [Coaching board](./screenshots/flow-weekly-phase3-coaching.png)
- [Analyse erreurs](./screenshots/flow-weekly-phase4-errors.png)

## Durée totale: __m __s
```

---

## Critères de succès

- [ ] Toutes les navigations réussies
- [ ] Données chargées à chaque page
- [ ] Comparaison temporelle fonctionnelle
- [ ] Filtrage drivers fonctionne
- [ ] Page coaching accessible
- [ ] Pas d'erreurs console critiques

## En cas d'échec

| Étape | Si échec | Action |
|-------|----------|--------|
| 1.1 | Dashboard vide | Vérifier données importées |
| 1.3 | Période ne change pas | Vérifier period picker |
| 2.2 | Pas de driver Poor | Test avec autre tier |
| 3.1 | Coaching vide | Normal si pas d'actions |
