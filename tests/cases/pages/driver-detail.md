# Test: Driver Detail

Test complet de la page détail d'un driver.

## Prérequis

- Utilisateur authentifié
- Au moins 1 driver avec données
- Historique de plusieurs semaines (pour graphique)

## URL

`/dashboard/drivers/[id]`

## Navigation

Accéder via:
1. Dashboard → clic ligne table drivers
2. Drivers list → clic sur un driver
3. Top 5 drivers → clic sur un nom

---

## Tests

### T1: Header Driver

**Étapes**:
1. Observer le header de la page

**Assertions**:
- [ ] Nom du driver visible
- [ ] Badge tier coloré (Fantastic/Great/Fair/Poor)
- [ ] Couleur tier correcte
- [ ] ID ou infos secondaires (si présents)

---

### T2: KPIs Individuels

**Étapes**:
1. Observer les cards KPI

**Assertions**:
- [ ] DWC% individuel affiché
- [ ] IADC% individuel affiché
- [ ] Nombre de livraisons/jours travaillés
- [ ] Trend vs période précédente (si disponible)
- [ ] Valeurs cohérentes avec liste drivers

---

### T3: Graphique Historique Performance

**Étapes**:
1. Observer le graphique de performance

**Assertions**:
- [ ] Graphique visible (ligne ou barres)
- [ ] Axe X: semaines ou jours
- [ ] Axe Y: pourcentage
- [ ] Points de données visibles
- [ ] Légende (DWC, IADC)
- [ ] Hover affiche tooltips avec valeurs

---

### T4: Breakdown Erreurs DWC

**Étapes**:
1. Localiser section breakdown DWC

**Assertions**:
- [ ] Section visible
- [ ] Types d'erreurs listés:
  - Contact Miss
  - Photo Defect
  - No Photo
  - OTP Miss
  - Other
- [ ] Count par type
- [ ] Total cohérent avec KPI DWC

---

### T5: Breakdown Erreurs IADC

**Étapes**:
1. Localiser section breakdown IADC

**Assertions**:
- [ ] Section visible
- [ ] Types d'erreurs listés:
  - Mailbox
  - Unattended
  - Safe Place
  - Other
- [ ] Count par type
- [ ] Total cohérent avec KPI IADC

---

### T6: Historique Actions Coaching

**Étapes**:
1. Localiser section coaching

**Assertions**:
- [ ] Section visible
- [ ] Liste actions passées (si existantes)
- [ ] Chaque action: type, date, statut
- [ ] Lien vers détail action (si cliquable)
- [ ] Message "Aucune action" si vide

---

### T7: Performance Quotidienne (si disponible)

**Étapes**:
1. Chercher section performance par jour

**Assertions**:
- [ ] Table ou graphique des jours
- [ ] Date, DWC%, IADC% par jour
- [ ] Jours non travaillés marqués

---

### T8: Actions Disponibles

**Étapes**:
1. Chercher boutons d'action

**Assertions**:
- [ ] Bouton "Créer action coaching" (si présent)
- [ ] Bouton "Voir historique complet" (si présent)
- [ ] Bouton retour visible et fonctionnel

---

### T9: Navigation Retour

**Étapes**:
1. Cliquer bouton retour ou breadcrumb

**Assertions**:
- [ ] Navigation vers page précédente
- [ ] Pas d'erreur
- [ ] État précédent préservé (filtres, scroll)

---

### T10: Responsive

**Étapes**:
1. Réduire viewport à mobile (390px)

**Assertions**:
- [ ] Layout s'adapte
- [ ] Graphiques lisibles
- [ ] Pas de contenu coupé
- [ ] Scroll fonctionne

---

## Durée estimée

3-4 minutes

## Rapport

```markdown
# Test Driver Detail - {date}

## Driver testé: {nom}

## Résultat: PASS/FAIL

| Test | Résultat | Notes |
|------|----------|-------|
| T1: Header | OK/FAIL | |
| T2: KPIs | OK/FAIL | |
| T3: Graphique | OK/FAIL | |
| T4: Breakdown DWC | OK/FAIL | |
| T5: Breakdown IADC | OK/FAIL | |
| T6: Historique coaching | OK/FAIL | |
| T7: Perf quotidienne | OK/FAIL/N/A | |
| T8: Actions | OK/FAIL | |
| T9: Navigation retour | OK/FAIL | |
| T10: Responsive | OK/FAIL | |

## Screenshots
- [Header](./screenshots/driver-detail-header.png)
- [Graphique](./screenshots/driver-detail-chart.png)

## Bugs détectés
...
```
