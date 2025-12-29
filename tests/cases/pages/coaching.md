# Test: Coaching

Test de la page Kanban de coaching.

## Prérequis

- Utilisateur authentifié
- Drivers existants (pour créer actions)

## URL

`/dashboard/coaching`

## Tests

### T1: Affichage Kanban

**Étapes**:
1. Naviguer vers la page coaching
2. Observer le layout

**Assertions**:
- [ ] Titre page visible ("Coaching")
- [ ] Board Kanban visible avec colonnes
- [ ] Colonnes: ATTENTE, AMÉLIORATION, SANS EFFET, ESCALADÉ (ou similaire)
- [ ] Chaque colonne a un header avec compteur

---

### T2: Colonnes Kanban

**Étapes**:
1. Observer chaque colonne

**Assertions**:
- [ ] Colonne "Attente/Pending": actions non évaluées
- [ ] Colonne "Amélioration/Improved": succès
- [ ] Colonne "Sans effet/No effect": échecs
- [ ] Colonne "Escaladé/Escalated": cas graves
- [ ] Cards présentes si actions existent

---

### T3: Cards Actions

**Étapes**:
1. Observer une card action (si existante)

**Assertions**:
- [ ] Nom driver visible
- [ ] Type action (Discussion, Warning, Training, Suspension)
- [ ] Date création
- [ ] DWC au moment de l'action
- [ ] Raison résumée

---

### T4: Bouton Nouvelle Action

**Étapes**:
1. Localiser bouton "+ Nouvelle action"
2. Cliquer dessus

**Assertions**:
- [ ] Modal s'ouvre
- [ ] Champs: Driver (select), Type, Raison, Notes
- [ ] Liste drivers disponible dans select
- [ ] Types actions disponibles

**Fermer sans sauver** pour continuer tests

---

### T5: Modal Création (détail)

**Étapes**:
1. Ouvrir modal nouvelle action
2. Remplir les champs

**Assertions**:
- [ ] Select driver: recherche/filtre fonctionne
- [ ] Select type: 4 options (Discussion, Warning, Training, Suspension)
- [ ] Champ raison: texte libre
- [ ] Bouton "Créer" / "Annuler"

**Test création (optionnel)**:
- [ ] Créer action test
- [ ] Toast confirmation
- [ ] Card apparaît dans colonne "Attente"

---

### T6: Évaluation Action

**Étapes**:
1. Cliquer sur une action existante
2. Observer modal évaluation

**Assertions**:
- [ ] Modal détail s'ouvre
- [ ] Infos action affichées
- [ ] Options d'évaluation: Amélioration, Sans effet, Escalader
- [ ] DWC actuel vs DWC action affiché

**Test évaluation (optionnel)**:
- [ ] Évaluer une action
- [ ] Card se déplace vers bonne colonne
- [ ] Toast confirmation

---

### T7: Filtres (si disponibles)

**Étapes**:
1. Chercher filtres (par type, par période)

**Assertions**:
- [ ] Filtres fonctionnent
- [ ] Board se met à jour

---

## Durée estimée

4-5 minutes

## Rapport

```markdown
# Test Coaching - {date}

## Résultat: PASS/FAIL

| Test | Résultat | Notes |
|------|----------|-------|
| T1: Kanban affiché | OK/FAIL | |
| T2: Colonnes | OK/FAIL | |
| T3: Cards | OK/FAIL | |
| T4: Btn nouvelle action | OK/FAIL | |
| T5: Modal création | OK/FAIL | |
| T6: Évaluation | OK/FAIL/SKIP | |
| T7: Filtres | OK/FAIL/N/A | |

## Screenshots
- [Kanban board](./screenshots/coaching-board.png)
- [Modal création](./screenshots/coaching-modal.png)
```
