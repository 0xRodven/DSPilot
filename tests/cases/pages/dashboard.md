# Test: Dashboard

Test complet de la page dashboard principale.

## Prérequis

- Utilisateur authentifié
- Station avec données importées (au moins 1 semaine)
- `npm run dev` actif

## URL

`/dashboard`

## Tests

### T1: KPI Cards

**Objectif**: Vérifier l'affichage des 4 KPI cards

**Étapes**:
1. Observer les 4 cards en haut de page
2. Vérifier chaque card

**Assertions**:
- [ ] Card DWC:
  - Titre "DWC" visible
  - Valeur pourcentage (format: XX.X%)
  - Badge tier (Fantastic/Great/Fair/Poor)
  - Couleur tier correcte:
    - Fantastic (≥98.5%): emerald/vert
    - Great (≥96%): blue/bleu
    - Fair (≥90%): amber/orange
    - Poor (<90%): red/rouge
  - Trend vs semaine précédente (flèche + valeur)

- [ ] Card IADC:
  - Même structure que DWC

- [ ] Card Drivers:
  - Titre "Drivers" ou "Livreurs"
  - Format "X/Y" (actifs/total)

- [ ] Card Alertes:
  - Titre "Alertes"
  - Nombre affiché
  - Badge "À traiter" si alertes > 0

---

### T2: Period Picker

**Objectif**: Tester la navigation temporelle

**Étapes**:
1. Localiser le sélecteur de période (header ou sous KPIs)
2. Cliquer dessus pour ouvrir

**Interactions à tester**:
- [ ] Clic ouvre le popover/dropdown
- [ ] Semaine courante affichée par défaut
- [ ] Flèche gauche: naviguer semaine précédente
- [ ] Vérifier mise à jour des KPIs (valeurs changent)
- [ ] Bouton "Aujourd'hui": retour semaine courante
- [ ] Toggle Semaine/Jour si disponible

**Screenshots**:
- Picker ouvert
- Après changement de période

---

### T3: Tier Distribution

**Objectif**: Vérifier le graphique de distribution

**Étapes**:
1. Localiser section "Distribution des tiers" ou graphique barres
2. Vérifier les 4 barres

**Assertions**:
- [ ] 4 barres présentes (Fantastic, Great, Fair, Poor)
- [ ] Couleurs correctes (emerald, blue, amber, red)
- [ ] Hover affiche tooltip avec nombre exact
- [ ] Proportions visuellement correctes

---

### T4: Top 5 Drivers

**Objectif**: Vérifier la section Top 5

**Étapes**:
1. Localiser section "Top 5 DWC" ou similaire
2. Vérifier les entrées

**Assertions**:
- [ ] Maximum 5 lignes affichées
- [ ] Chaque ligne: nom driver, pourcentage, badge tier
- [ ] Trié par DWC décroissant (meilleur en premier)
- [ ] Clic sur un driver ouvre sa page détail

---

### T5: Top 5 Erreurs

**Objectif**: Vérifier la section erreurs

**Étapes**:
1. Localiser section "Top 5 Erreurs" ou similaire
2. Vérifier les entrées

**Assertions**:
- [ ] Erreurs listées avec type et count
- [ ] Trié par count décroissant
- [ ] Clic ouvre détail (page errors ou tooltip)

---

### T6: Table Drivers

**Objectif**: Tester la table complète

**Étapes**:
1. Scroll vers table drivers
2. Tester les fonctionnalités

**Assertions**:
- [ ] Table visible avec colonnes (Nom, DWC%, IADC%, Tier, etc.)
- [ ] Au moins 1 ligne de données

**Interactions**:
- [ ] Tri par DWC: clic header "DWC" → ordre change
- [ ] Tri par nom: clic header "Nom" → ordre alphabétique
- [ ] Recherche: taper dans champ recherche → table filtrée
- [ ] Clic ligne: navigation vers page détail driver

**Screenshots**:
- Table initiale
- Après tri
- Après recherche

---

## Assertions finales

- [ ] Pas d'erreurs console pendant le test
- [ ] Toutes les sections chargées (pas de skeleton persistant)
- [ ] Interactions fonctionnelles (clics répondent)
- [ ] Responsive: sidebar se collapse sur viewport étroit

## Durée estimée

3-5 minutes

## Rapport

```markdown
# Test Dashboard - {date}

## Résultat: PASS/FAIL

| Test | Résultat | Notes |
|------|----------|-------|
| T1: KPI Cards | OK/FAIL | |
| T2: Period Picker | OK/FAIL | |
| T3: Tier Distribution | OK/FAIL | |
| T4: Top 5 Drivers | OK/FAIL | |
| T5: Top 5 Erreurs | OK/FAIL | |
| T6: Table Drivers | OK/FAIL | |

## Erreurs console
...

## Screenshots
- [Initial](./screenshots/dashboard-initial.png)
- [Period changed](./screenshots/dashboard-period.png)
```
