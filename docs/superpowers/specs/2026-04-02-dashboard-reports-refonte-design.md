# DSPilot Refonte — Dashboard, Métriques & Rapports PDF

**Date:** 2026-04-02
**Auteur:** Ousmane + Claude
**Statut:** En attente de validation

---

## 1. Décision fondamentale

**Supprimer tous les tiers inventés (Fantastic/Great/Fair/Poor).** DSPilot ne classifie plus les drivers dans des catégories. On affiche uniquement des données factuelles issues des rapports Amazon, avec des tendances et des variations.

### Pourquoi

Les tiers Fantastic ≥95%, Great ≥90%, Fair ≥88%, Poor <88% étaient une invention DSPilot basée sur un seul critère (DWC%). Le vrai scorecard Amazon utilise 20+ métriques réparties sur 4 piliers (Safety, Quality, Reliability, Team). Présenter nos tiers comme des classifications de performance est trompeur.

### Ce qui change

| Avant | Après |
|-------|-------|
| 4 tiers par driver (Fantastic/Great/Fair/Poor) | Pas de tiers — DWC% brut avec gradient de couleur |
| Tier distribution (camembert/barre) | Distribution DWC% (histogramme par tranches de 5%) |
| Couleurs par tier (emerald/blue/amber/red) | Gradient continu vert→rouge basé sur le % |
| Seuils hardcodés 95/90/88 | Seuils configurables par le manager (objectifs personnels) |
| "High performers" | "Drivers au-dessus de l'objectif station" |
| Alertes basées sur les tiers | Alertes basées sur les variations (chute de X points) |

---

## 2. Métriques du nouveau dashboard

### 2.1 Données disponibles par source

**DWC/IADC CSV Export (hebdomadaire, par driver par jour)**
- `dwcCompliant`, `dwcMisses`, `failedAttempts` → DWC%
- `iadcCompliant`, `iadcNonCompliant` → IADC%
- Breakdowns DWC : Contact Miss, Photo Defect, No Photo, OTP Miss
- Breakdowns IADC : Mailbox, Unattended, Safe Place, Attended

**Daily Report HTML (par driver par jour)**
- RTS count (Return To Station)
- DNR count (Did Not Receive)
- POD Fails (Proof of Delivery)
- CC Fails (Contact Compliance)

**Associate Overview HTML (par driver, semaine courante)**
- Colis livrés (`packagesDelivered`)
- DNR DPMO (`dnrDpmo`)
- Colis expédiés (`packagesShipped`)
- RTS count, RTS%, RTS DPMO

**Delivery Overview CSV (par station, par semaine)**
- Métriques station brutes (Colis livrés, DNR, etc.)

### 2.2 KPIs principaux du dashboard (station)

| KPI | Source | Calcul | Affichage |
|-----|--------|--------|-----------|
| DWC% station | CSV volumes | compliant / (compliant + misses + failed) × 100 | Pourcentage + delta vs semaine précédente |
| IADC% station | CSV volumes | compliant / (compliant + non-compliant) × 100 | Pourcentage + delta |
| Drivers actifs | Daily report | Count distinct drivers avec données cette semaine | Nombre |
| Colis livrés | Associate Overview / Delivery Overview | Somme | Nombre |
| DNR DPMO moyen | Associate Overview | Moyenne pondérée | Nombre (plus bas = mieux) |
| RTS% moyen | Associate Overview | Moyenne pondérée | Pourcentage (plus bas = mieux) |

### 2.3 Visualisations dashboard

**A. Distribution DWC% des drivers (remplace la tier distribution)**
- Histogramme horizontal par tranches de 5% (100-95, 95-90, 90-85, 85-80, <80)
- Chaque tranche colorée en gradient (vert foncé → vert → jaune → orange → rouge)
- Le nombre de drivers dans chaque tranche est affiché
- Pas de label "Fantastic" ou "Poor" — juste les tranches de pourcentage

**B. Tendance DWC% station (6 semaines)**
- Ligne ou barres horizontales, semaine par semaine
- Objectif station affiché en ligne pointillée (si configuré)

**C. Top 10 / Bottom 10 drivers**
- Tableau trié par DWC% décroissant/croissant
- Colonnes : Rang, Nom, DWC%, IADC%, Colis livrés, Jours actifs
- Couleur du DWC% en gradient continu (pas de catégorie)
- Delta vs semaine précédente (↑ / ↓)

**D. Breakdown erreurs DWC + IADC**
- Barres horizontales, classées par volume décroissant
- "Photo Defect : 38% des non-conformités DWC"
- Comparaison vs semaine précédente

**E. Carte des alertes**
- Basées sur des variations, pas des seuils absolus :
  - "DWC a chuté de X points cette semaine" (seuil configurable, défaut 5 points)
  - "DNR DPMO a augmenté de X%"
  - "Nouveau driver — première semaine de données"
  - "Coaching en attente depuis X jours"

### 2.4 Système de couleurs (gradient, pas catégoriel)

```
DWC% → couleur (gradient continu)
  ≥ 97%  : #059669 (emerald-600, vert foncé)
  95%    : #10b981 (emerald-500)
  92%    : #3b82f6 (blue-500)
  90%    : #60a5fa (blue-400)
  88%    : #f59e0b (amber-500)
  85%    : #f97316 (orange-500)
  < 85%  : #ef4444 (red-500)
```

Interpolation linéaire entre ces points. Pas de saut de couleur brutal. Un driver à 89.9% et un driver à 90.1% ont quasiment la même couleur — pas de frontière artificielle.

### 2.5 Objectifs station (remplace les seuils de tiers)

Le manager peut configurer ses propres objectifs dans les paramètres :
- Objectif DWC% station (ex: 92%)
- Objectif IADC% station (ex: 65%)
- Seuil d'alerte chute DWC (ex: 5 points)
- Seuil d'alerte DNR DPMO (ex: 1500)

Ces objectifs sont affichés en ligne pointillée sur les graphiques et utilisés pour les alertes. Ils sont transparents — "Objectif défini par le manager, pas par Amazon."

---

## 3. Page driver (détail)

### Métriques affichées
- DWC% avec tendance 6 semaines (graphique ligne)
- IADC% avec tendance 6 semaines
- Breakdown DWC par jour (barres empilées : compliant vs misses vs failed)
- DNR, RTS, POD Fails, CC Fails par jour
- Colis livrés par jour (volume)
- Historique coaching (actions DSPilot, pas un tier Amazon)

### Ce qui disparaît
- Badge de tier (Fantastic/Great/Fair/Poor)
- Couleur de bordure par tier
- Comparaison au seuil de tier

### Ce qui le remplace
- DWC% en gros avec couleur gradient
- Flèche tendance (↑↓) vs semaine précédente
- Position dans la flotte : "24ème sur 54 drivers cette semaine" (factuel, c'est un rang)

---

## 4. Rapports PDF

### 4.1 Rapport Station Hebdomadaire (3 pages A4)

**Page 1 — Vue d'ensemble**
- Hero header avec logo DSPilot + station + semaine
- Synthèse IA (générée par Claude API — analyse factuelle des données, pas de classification)
- 6 KPIs : DWC%, IADC%, Drivers actifs, Colis livrés, DNR DPMO, RTS%
- Distribution DWC% des drivers (histogramme par tranches)
- Tendance DWC% 6 semaines

**Page 2 — Détail drivers + erreurs**
- Top 10 drivers par DWC% (tableau)
- Bottom 10 drivers par DWC% (tableau)
- Breakdown DWC (barres horizontales)
- Breakdown IADC (barres horizontales)

**Page 3 — Coaching + alertes + recommandations**
- Pipeline coaching (à détecter / en attente / à évaluer)
- Alertes de la semaine (basées sur variations)
- Recommandations IA (actions concrètes basées sur les données)

### 4.2 Fiche Driver Individuelle (1 page A4)

- Header : nom, DWC%, IADC%, rang dans la flotte
- Tendance DWC% 6 semaines (mini graphique)
- Breakdown erreurs du driver
- Colis livrés, DNR, RTS
- Actions de coaching en cours
- Recommandation IA personnalisée

### 4.3 Design system des rapports

- Police : SF Pro (Apple system font) pour le corps, pas de serif
- Fond blanc pur, pas de dark mode
- Gradient bleu→cyan DSPilot pour le hero header uniquement
- Tableaux : lignes horizontales uniquement, pas de bordures verticales
- Alignement strict des colonnes numériques (tabular-nums, right-aligned)
- Border-radius: 0 partout (consulting grade)
- Rendu : HTML → Playwright/Chrome → PDF (pas @react-pdf/renderer)
- Logo DSPilot intégré en PNG avec filter brightness pour le hero

---

## 5. Système d'alertes (refonte)

### Alertes basées sur les variations (pas sur des seuils inventés)

| Alerte | Condition | Sévérité |
|--------|-----------|----------|
| Chute DWC | DWC% a baissé de ≥ X points vs semaine précédente | Critique si ≥ 10pp, Warning si ≥ 5pp |
| DWC bas | DWC% sous l'objectif station (configurable) | Warning |
| DNR DPMO élevé | DNR DPMO au-dessus du seuil station (configurable) | Warning |
| Nouveau driver | Première semaine de données | Info |
| Coaching en retard | Action en attente depuis > X jours (configurable) | Warning si > 14j, Critique si > 21j |

### Ce qui disparaît
- `dwc_critical` (basé sur le seuil inventé de 90%)
- `tier_downgrade` (les tiers n'existent plus)

### Ce qui reste mais évolue
- `dwc_drop` → basé sur la variation, seuil configurable
- `coaching_pending` → inchangé
- `new_driver` → inchangé

---

## 6. Coaching (ajustements)

Le coaching reste un outil DSPilot — c'est légitime car c'est un outil opérationnel du manager, pas une classification Amazon.

### Ce qui change
- Le coaching n'est plus déclenché par un tier (ex: "driver Poor → coaching")
- Il est déclenché par le manager manuellement ou par les alertes de variation
- La page coaching ne mentionne plus les tiers
- Les suggestions de coaching sont basées sur le breakdown des erreurs ("Photo Defect élevé → briefing photo")

---

## 7. Impact technique

### Fichiers à modifier

**Supprimer/refactorer :**
- `src/lib/utils/tier.ts` → remplacer par `src/lib/utils/performance-color.ts` (gradient continu)
- `convex/lib/tier.ts` → supprimer les fonctions de tier
- `stationWeeklyStats.tierDistribution` → remplacer par `dwcDistribution` (comptage par tranche de 5%)
- Toutes les refs à `getTier()`, `getTierColor()`, `getTierBgColor()`, `getTierBorderColor()`

**Ajouter :**
- `src/lib/utils/performance-color.ts` — fonction de gradient continu DWC% → couleur
- `stationObjectives` table dans Convex — objectifs configurables par station
- `src/lib/pdf/report-renderer.ts` — nouveau pipeline HTML → Chrome → PDF
- Templates HTML pour les 3 types de rapports

**Modifier :**
- Dashboard page + tous les composants dashboard
- Driver detail page
- Coaching page (retirer les refs aux tiers)
- Export PDF (nouveau renderer)
- Alertes (retirer tier_downgrade, dwc_critical)
- Skills Claude (tier-calculator → performance-metrics)

### Migration des données
- `stationWeeklyStats.tierDistribution` → ajouter `dwcDistribution` en parallèle
- Garder l'ancien champ pour backward compat pendant la transition
- Les données brutes (volumes) ne changent pas

---

## 8. Ce qu'on NE fait PAS

- On ne tente pas de reproduire le scorecard Amazon complet (on n'a pas les données Safety, Reliability, Team)
- On ne prétend pas que nos métriques sont celles d'Amazon
- On n'invente pas de score composite
- On ne supprime pas les données existantes — on change la présentation

---

## 9. Ordre d'implémentation suggéré

1. **Performance color system** — gradient continu (remplace les tiers)
2. **Station objectives** — table + UI settings
3. **Dashboard KPIs** — 6 nouveaux KPIs
4. **Distribution chart** — histogramme par tranches (remplace tier bar)
5. **Tables drivers** — retirer les badges tier, ajouter rang + gradient
6. **Alertes** — refonte vers variations
7. **Driver detail page** — tendances + breakdown
8. **Coaching** — découpler des tiers
9. **Rapport PDF** — nouveau renderer HTML → Chrome → PDF
10. **Rapport PDF contenu** — les 3 types de rapports
