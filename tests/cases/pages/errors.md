# Test: Errors Analysis

Test complet de la page d'analyse des erreurs.

## Prérequis

- Utilisateur authentifié
- Données avec erreurs (DWC misses, IADC non-compliant)

## URL

`/dashboard/errors`

---

## Tests

### T1: Affichage Initial

**Étapes**:
1. Naviguer vers /dashboard/errors
2. Attendre chargement

**Assertions**:
- [ ] Page charge sans erreur
- [ ] Titre visible ("Erreurs" ou "Analyse Erreurs")
- [ ] Tabs de catégorie visibles

---

### T2: Tabs Catégories

**Étapes**:
1. Observer les tabs disponibles

**Assertions**:
- [ ] Tab DWC présent
- [ ] Tab IADC présent
- [ ] Tab False Scans présent (si applicable)
- [ ] Tab actif visuellement distinct
- [ ] Compteur par tab (si disponible)

---

### T3: Switch Entre Tabs

**Étapes**:
1. Cliquer sur tab DWC
2. Observer contenu
3. Cliquer sur tab IADC
4. Observer contenu
5. Cliquer sur tab False Scans (si présent)

**Assertions**:
- [ ] Contenu change selon tab
- [ ] Pas de flash/flicker
- [ ] Données cohérentes avec catégorie
- [ ] Pas d'erreur console

---

### T4: Liste Erreurs DWC

**Étapes**:
1. Être sur tab DWC
2. Observer la liste

**Assertions**:
- [ ] Types d'erreurs listés:
  - Contact Compliance Miss
  - Photo on Delivery Defect
  - No Photo
  - OTP Miss
  - Other
- [ ] Count par type visible
- [ ] Pourcentage ou proportion (si disponible)
- [ ] Trié par count (plus fréquent en premier)

---

### T5: Liste Erreurs IADC

**Étapes**:
1. Cliquer tab IADC
2. Observer la liste

**Assertions**:
- [ ] Types d'erreurs listés:
  - Mailbox Delivery
  - Unattended Delivery
  - Safe Place
  - Other
- [ ] Count par type visible
- [ ] Trié par count

---

### T6: KPIs Erreurs (si présents)

**Étapes**:
1. Observer cards KPI en haut de page

**Assertions**:
- [ ] Total erreurs DWC
- [ ] Total erreurs IADC
- [ ] Trend vs semaine précédente
- [ ] Pourcentage global

---

### T7: Graphique Tendances (si présent)

**Étapes**:
1. Localiser graphique évolution

**Assertions**:
- [ ] Graphique visible
- [ ] Plusieurs semaines/jours
- [ ] Courbes ou barres par type d'erreur
- [ ] Légende lisible
- [ ] Hover pour détails

---

### T8: Top Drivers par Erreur

**Étapes**:
1. Chercher section "Top drivers" ou drilldown

**Assertions**:
- [ ] Liste drivers avec plus d'erreurs
- [ ] Nom driver + count
- [ ] Clic navigue vers driver (si link)

---

### T9: Drilldown/Détail

**Étapes**:
1. Cliquer sur un type d'erreur (si cliquable)

**Assertions**:
- [ ] Détail s'affiche (modal ou expansion)
- [ ] Liste des occurrences
- [ ] Drivers concernés
- [ ] Dates si disponibles

---

### T10: Period Picker (si présent)

**Étapes**:
1. Chercher sélecteur de période

**Assertions**:
- [ ] Même period picker que dashboard
- [ ] Changement période met à jour données
- [ ] Cohérence avec dashboard

---

## Durée estimée

3 minutes

## Rapport

```markdown
# Test Errors - {date}

## Résultat: PASS/FAIL

| Test | Résultat | Notes |
|------|----------|-------|
| T1: Affichage | OK/FAIL | |
| T2: Tabs | OK/FAIL | |
| T3: Switch tabs | OK/FAIL | |
| T4: Liste DWC | OK/FAIL | |
| T5: Liste IADC | OK/FAIL | |
| T6: KPIs | OK/FAIL/N/A | |
| T7: Graphique | OK/FAIL/N/A | |
| T8: Top drivers | OK/FAIL/N/A | |
| T9: Drilldown | OK/FAIL/N/A | |
| T10: Period picker | OK/FAIL/N/A | |

## Données observées

### DWC Errors
| Type | Count |
|------|-------|
| Contact Miss | X |
| Photo Defect | X |
| ... | ... |

### IADC Errors
| Type | Count |
|------|-------|
| Mailbox | X |
| Unattended | X |
| ... | ... |

## Screenshots
- [Tab DWC](./screenshots/errors-dwc.png)
- [Tab IADC](./screenshots/errors-iadc.png)
```
