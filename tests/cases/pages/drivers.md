# Test: Drivers List

Test de la page liste des drivers.

## Prérequis

- Utilisateur authentifié
- Station avec drivers importés

## URL

`/dashboard/drivers`

## Tests

### T1: Affichage initial

**Étapes**:
1. Naviguer vers la page drivers
2. Attendre chargement

**Assertions**:
- [ ] Titre page visible ("Drivers" ou "Livreurs")
- [ ] Cards stats par tier en haut (4 cards)
- [ ] Table/liste des drivers visible
- [ ] Compteur total visible

---

### T2: Cards Stats Tier

**Étapes**:
1. Observer les 4 cards de stats

**Assertions**:
- [ ] Card Fantastic: compte + couleur emerald
- [ ] Card Great: compte + couleur blue
- [ ] Card Fair: compte + couleur amber
- [ ] Card Poor: compte + couleur red
- [ ] Total des 4 cards = nombre total drivers

---

### T3: Filtrage par Tier

**Étapes**:
1. Cliquer sur card "Poor"
2. Observer la table

**Assertions**:
- [ ] Table ne montre que drivers Poor
- [ ] Badge filter visible indiquant le filtre actif
- [ ] Compteur mis à jour

**Reset**:
- [ ] Cliquer à nouveau ou "Tous" pour reset
- [ ] Table revient à tous les drivers

---

### T4: Recherche par nom

**Étapes**:
1. Localiser champ de recherche
2. Taper un nom partiel

**Assertions**:
- [ ] Table filtrée en temps réel
- [ ] Seuls drivers correspondants affichés
- [ ] Effacer → retour liste complète

---

### T5: Tri

**Étapes**:
1. Cliquer header colonne "DWC"
2. Observer ordre

**Assertions**:
- [ ] Premier clic: tri décroissant (meilleur en haut)
- [ ] Second clic: tri croissant
- [ ] Indicateur de tri visible (flèche)

**Autres colonnes à tester**:
- [ ] Nom (alphabétique)
- [ ] IADC (pourcentage)

---

### T6: Navigation détail

**Étapes**:
1. Cliquer sur une ligne driver
2. Observer navigation

**Assertions**:
- [ ] Navigation vers `/dashboard/drivers/[id]`
- [ ] Page détail charge correctement
- [ ] Bouton retour fonctionne

---

### T7: Responsive

**Étapes**:
1. Réduire largeur viewport à mobile

**Assertions**:
- [ ] Table s'adapte (scroll horizontal ou layout cards)
- [ ] Filtres toujours accessibles
- [ ] Pas de contenu coupé

---

## Durée estimée

3-4 minutes

## Rapport

```markdown
# Test Drivers - {date}

## Résultat: PASS/FAIL

| Test | Résultat | Notes |
|------|----------|-------|
| T1: Affichage | OK/FAIL | |
| T2: Cards Stats | OK/FAIL | |
| T3: Filtrage Tier | OK/FAIL | |
| T4: Recherche | OK/FAIL | |
| T5: Tri | OK/FAIL | |
| T6: Navigation | OK/FAIL | |
| T7: Responsive | OK/FAIL | |

## Screenshots
- [Liste complète](./screenshots/drivers-list.png)
- [Filtré Poor](./screenshots/drivers-poor.png)
- [Recherche](./screenshots/drivers-search.png)
```
