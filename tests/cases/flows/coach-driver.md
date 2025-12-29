# Flow: Coach Driver Session

Parcours complet pour créer et suivre une action de coaching pour un driver.

## Durée estimée

3-4 minutes

## Prérequis

- Utilisateur authentifié
- Au moins 1 driver en tier Poor ou Fair
- Page coaching accessible

---

## Phase 1: Identifier le Driver à Coacher

### 1.1 Accéder au Dashboard

- **Action**: Naviguer vers /dashboard
- **Attendu**: Dashboard charge avec KPIs

### 1.2 Identifier Driver Poor

- **Action**: Observer les KPIs ou Top 5 Drivers
- **Alternative**: Aller sur /dashboard/drivers → filtrer Poor
- **À noter**: Nom du driver sélectionné: ____

### 1.3 Consulter le Détail

- **Action**: Cliquer sur le driver
- **Attendu**: Page détail charge
- **À vérifier**:
  - DWC% actuel: ____
  - IADC% actuel: ____
  - Erreurs principales: ____
  - Actions coaching existantes: ____

- **Screenshot**: `flow-coach-phase1-driver.png`

---

## Phase 2: Créer l'Action de Coaching

### 2.1 Naviguer vers Coaching

- **Action**: Cliquer "Coaching" dans sidebar
- **Attendu**: Kanban board charge

### 2.2 Ouvrir Modal Création

- **Action**: Cliquer bouton "+ Nouvelle action"
- **Attendu**: Modal s'ouvre

### 2.3 Remplir le Formulaire

- **Action**: Compléter les champs:
  - Driver: Sélectionner le driver identifié
  - Type: Choisir selon gravité (Discussion/Warning/Training)
  - Raison: Décrire le problème
  - Notes: Ajouter contexte (optionnel)

- **Screenshot**: `flow-coach-phase2-modal.png`

### 2.4 Créer l'Action

- **Action**: Cliquer "Créer" / "Sauvegarder"
- **Attendu**:
  - Modal se ferme
  - Toast confirmation
  - Card apparaît dans colonne "Attente"

### 2.5 Vérifier la Card

- **Action**: Localiser la nouvelle card dans Kanban
- **Attendu**:
  - Nom driver visible
  - Type action visible
  - Date création

- **Screenshot**: `flow-coach-phase2-card.png`

---

## Phase 3: Évaluer l'Action (Simulation)

### 3.1 Ouvrir le Détail

- **Action**: Cliquer sur la card créée
- **Attendu**: Modal détail s'ouvre

### 3.2 Vérifier les Infos

- **Attendu**:
  - Infos driver correctes
  - Type action correct
  - Raison affichée
  - DWC au moment de l'action

### 3.3 Options d'Évaluation

- **Vérifier disponibilité**:
  - [ ] Option "Amélioration"
  - [ ] Option "Sans effet"
  - [ ] Option "Escalader"

- **Screenshot**: `flow-coach-phase3-eval.png`

### 3.4 Évaluer (Optionnel)

- **Si test avec données réelles**:
  - Sélectionner une évaluation
  - Sauvegarder
  - Vérifier que card se déplace vers bonne colonne

- **Sinon**: Annuler et ne pas modifier

---

## Phase 4: Vérifier Cross-Page

### 4.1 Retourner au Driver

- **Action**: Naviguer vers page détail du driver
- **Attendu**: Nouvelle action visible dans historique coaching

### 4.2 Vérifier Dashboard

- **Action**: Retourner au dashboard
- **Attendu**: Compteur alertes/actions mis à jour (si applicable)

---

## Rapport Final

```markdown
# Flow Coach Driver - {date}

## Driver coaché: {nom}
## Action créée: {type}

## Résultat: PASS/FAIL
## Durée: Xm Xs

## Phase 1: Identification
- [ ] Driver identifié: OK/FAIL
- [ ] DWC observé: ___%
- [ ] Détail consulté: OK/FAIL

## Phase 2: Création
- [ ] Modal ouvert: OK/FAIL
- [ ] Formulaire rempli: OK/FAIL
- [ ] Action créée: OK/FAIL
- [ ] Card visible: OK/FAIL

## Phase 3: Évaluation
- [ ] Détail ouvert: OK/FAIL
- [ ] Options disponibles: OK/FAIL
- [ ] Évaluation effectuée: OK/FAIL/SKIP

## Phase 4: Cross-Page
- [ ] Historique driver: OK/FAIL
- [ ] Dashboard cohérent: OK/FAIL

## Screenshots
- [Driver sélectionné](./screenshots/flow-coach-phase1-driver.png)
- [Modal création](./screenshots/flow-coach-phase2-modal.png)
- [Card créée](./screenshots/flow-coach-phase2-card.png)
- [Modal évaluation](./screenshots/flow-coach-phase3-eval.png)

## Bugs détectés
...

## Notes
...
```

---

## Critères de succès

- [ ] Driver identifié via dashboard ou liste
- [ ] Modal création fonctionne
- [ ] Tous les champs remplissables
- [ ] Action créée avec succès
- [ ] Card apparaît dans Kanban
- [ ] Modal évaluation accessible
- [ ] Cross-page: action visible dans historique driver
