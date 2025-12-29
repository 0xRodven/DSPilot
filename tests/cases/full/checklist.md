# DSPilot - Checklist Test Complète

Checklist exhaustive de tous les éléments à tester. Cocher chaque item après vérification.

**Total: 85 items**

---

## 1. Authentification & Sécurité (6 items)

- [ ] App charge sans écran blanc
- [ ] Pas d'erreurs console au chargement
- [ ] Avatar utilisateur visible (header)
- [ ] Nom/email utilisateur correct
- [ ] Routes protégées (redirect si non-auth)
- [ ] Déconnexion fonctionne (si testable)

---

## 2. Navigation & Layout (8 items)

### Sidebar
- [ ] Logo DSPilot visible
- [ ] Lien Dashboard fonctionne
- [ ] Lien Drivers fonctionne
- [ ] Lien Erreurs fonctionne
- [ ] Lien Import fonctionne
- [ ] Lien Coaching fonctionne
- [ ] Lien Settings fonctionne
- [ ] Sidebar collapse sur mobile

---

## 3. Dashboard - KPI Cards (12 items)

### Affichage
- [ ] 4 cards visibles
- [ ] Card DWC: valeur % affichée
- [ ] Card DWC: badge tier coloré
- [ ] Card DWC: trend vs semaine précédente
- [ ] Card IADC: valeur % affichée
- [ ] Card IADC: badge tier coloré
- [ ] Card Drivers: format X/Y (actifs/total)
- [ ] Card Alertes: nombre affiché
- [ ] Card Alertes: badge "À traiter" si > 0

### Couleurs Tier
- [ ] Fantastic (≥98.5%): emerald/vert
- [ ] Great (≥96%): blue/bleu
- [ ] Fair (≥90%): amber/orange
- [ ] Poor (<90%): red/rouge

---

## 4. Dashboard - Period Picker (7 items)

- [ ] Sélecteur visible
- [ ] Semaine courante affichée
- [ ] Clic ouvre popover/dropdown
- [ ] Flèche gauche: semaine précédente
- [ ] Flèche droite: semaine suivante
- [ ] Bouton "Aujourd'hui" fonctionne
- [ ] Données se mettent à jour après changement

---

## 5. Dashboard - Graphiques & Sections (10 items)

### Tier Distribution
- [ ] Graphique barres visible
- [ ] 4 barres (Fantastic, Great, Fair, Poor)
- [ ] Couleurs correctes
- [ ] Tooltips au hover

### Top 5 Drivers
- [ ] Section visible
- [ ] Max 5 entrées
- [ ] Format: nom, %, tier badge
- [ ] Clic navigue vers détail driver

### Top 5 Erreurs
- [ ] Section visible
- [ ] Format: type, count

---

## 6. Dashboard - Table Drivers (8 items)

- [ ] Table visible
- [ ] Colonnes: Nom, DWC%, IADC%, Tier
- [ ] Tri par DWC fonctionne (clic header)
- [ ] Tri par IADC fonctionne
- [ ] Tri par nom fonctionne
- [ ] Recherche par nom fonctionne
- [ ] Clic ligne navigue vers détail
- [ ] Pagination (si >10 lignes)

---

## 7. Page Drivers (8 items)

- [ ] Page charge correctement
- [ ] Cards stats par tier (4 cards)
- [ ] Fantastic: count correct
- [ ] Great: count correct
- [ ] Fair: count correct
- [ ] Poor: count correct
- [ ] Clic card filtre la table
- [ ] Reset filtre fonctionne

---

## 8. Page Driver Detail (10 items)

- [ ] Page charge avec données
- [ ] Header: nom driver visible
- [ ] Header: tier badge coloré
- [ ] KPIs individuels affichés
- [ ] Graphique historique performance
- [ ] Breakdown erreurs DWC
- [ ] Breakdown erreurs IADC
- [ ] Historique actions coaching
- [ ] Bouton retour fonctionne
- [ ] Navigation vers autre driver (si links)

---

## 9. Page Import (6 items)

- [ ] Dropzone visible
- [ ] Instructions formats acceptés
- [ ] Zone drag visuelle (bordure)
- [ ] Historique imports affiché
- [ ] Statuts colorés (success/failed)
- [ ] Date/semaine affichées

---

## 10. Page Coaching - Kanban (8 items)

### Board
- [ ] 4 colonnes visibles
- [ ] Colonne "Attente" avec compteur
- [ ] Colonne "Amélioration" avec compteur
- [ ] Colonne "Sans effet" avec compteur
- [ ] Colonne "Escaladé" avec compteur
- [ ] Cards actions affichées (si existantes)
- [ ] Card: nom driver visible
- [ ] Card: type action visible

---

## 11. Page Coaching - Création Action (7 items)

- [ ] Bouton "+ Nouvelle action" visible
- [ ] Clic ouvre modal
- [ ] Select driver fonctionne
- [ ] Select type (4 options): Discussion, Warning, Training, Suspension
- [ ] Champ raison
- [ ] Bouton Créer
- [ ] Bouton Annuler ferme modal

---

## 12. Page Coaching - Évaluation (5 items)

- [ ] Clic sur card ouvre modal détail
- [ ] Infos action affichées
- [ ] DWC au moment action vs actuel
- [ ] Options évaluation disponibles
- [ ] Sauvegarde met à jour le board

---

## 13. Page Errors (7 items)

- [ ] Page charge correctement
- [ ] Tabs DWC / IADC / False Scans
- [ ] Switch entre tabs fonctionne
- [ ] Liste erreurs par type
- [ ] Count par erreur
- [ ] Tri par count
- [ ] Drilldown/détail (si disponible)

---

## 14. Page Settings (4 items)

- [ ] Page charge correctement
- [ ] Section compte utilisateur
- [ ] Section station (nom, code)
- [ ] Infos correctement affichées

---

## 15. Cross-Page Navigation (7 items)

- [ ] Dashboard → clic driver → page détail
- [ ] Driver détail → bouton retour → Dashboard
- [ ] Dashboard → clic erreur → page Errors
- [ ] Drivers list → clic driver → détail
- [ ] Driver détail → retour → liste Drivers
- [ ] Sidebar: navigation entre toutes les pages
- [ ] Breadcrumbs (si présents) fonctionnent

---

## 16. Console & Erreurs (4 items)

- [ ] Pas d'erreurs rouges console
- [ ] Pas de warnings critiques
- [ ] Network requests: pas d'erreurs 4xx/5xx
- [ ] Pas de "undefined" ou "NaN" affichés

---

## 17. Responsive (6 items)

### Desktop (1920x1080)
- [ ] Layout correct
- [ ] Sidebar visible

### Mobile (390x844)
- [ ] Sidebar collapse/hidden
- [ ] Tables adaptées (scroll horizontal ou cards)
- [ ] Modals adaptés
- [ ] Touch interactions OK

---

## 18. Performance (2 items)

- [ ] Chargement initial < 5s
- [ ] Navigation entre pages < 2s

---

## Résumé

| Section | Items | Passés | Échecs |
|---------|-------|--------|--------|
| Auth & Sécurité | 6 | | |
| Navigation | 8 | | |
| Dashboard KPIs | 12 | | |
| Period Picker | 7 | | |
| Graphiques | 10 | | |
| Table Drivers | 8 | | |
| Page Drivers | 8 | | |
| Driver Detail | 10 | | |
| Import | 6 | | |
| Coaching Kanban | 8 | | |
| Coaching Création | 7 | | |
| Coaching Évaluation | 5 | | |
| Errors | 7 | | |
| Settings | 4 | | |
| Cross-Page | 7 | | |
| Console | 4 | | |
| Responsive | 6 | | |
| Performance | 2 | | |
| **TOTAL** | **85** | | |
