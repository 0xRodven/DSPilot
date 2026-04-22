# DSPilot — Checklist Beta Testing

**Cible** : DSP Manager co-fondateur, station réelle (DIF1, ~113 livreurs).
**Date** : 2026-04-22
**Version app** : pre-beta
**Durée estimée** : 2h30 pour tout cocher

---

## Comment utiliser cette checklist

1. **Ouvre l'app** : `https://dspilot.app` (login Clerk)
2. **Semaine de test** : choisis une semaine récente où tu as les fichiers Amazon en main (HTML DWC + CSV Associate Overview + Concessions)
3. **Garde Amazon Partner Central ouvert** en parallèle pour comparer les chiffres
4. **Règle d'or** : **si un chiffre diffère de >0.5% vs Amazon**, coche `❌` + note la page + semaine + lignes concernées dans un bloc `NOTES BUG`.
5. **Convention semaine Amazon** : TOUJOURS **dimanche → samedi** (PAS ISO lundi-dimanche). Si un chiffre est faux, vérifie d'abord que la semaine affichée dans l'app correspond bien à la semaine Amazon.

Légende :
- `[ ]` = à vérifier
- `✅` = OK
- `❌` = bug (note ci-dessous)
- `⚠️` = OK mais comportement étrange
- `N/A` = pas applicable cette semaine

---

# 📋 FOND — Sources de données

## Rappel critique des sources

| Métrique | Source Amazon | Fichier / Rapport | Formule dans l'app |
|---|---|---|---|
| **DWC %** | Partner Central → DWC Report | HTML `DWC_Weekly_Report_*.html` | `dwcCompliant ÷ (dwcCompliant + dwcMisses + failedAttempts) × 100` |
| **IADC %** | Même HTML DWC | Section IADC du même fichier | `iadcCompliant ÷ (iadcCompliant + iadcNonCompliant) × 100` |
| **Colis livrés (total)** | Amazon Associate Overview | CSV `Associate_Overview_*.csv` | Somme `packagesDelivered` par livreur (⚠️ **PAS le volume DWC**) |
| **DNR count** | Amazon Concessions | Scraper VPS → `_dsp_delivery_concessions.html` | Count distinct `dnrInvestigations.trackingId` |
| **Error Breakdown (Contact Miss, Photo Defect…)** | HTML DWC → colonne "Shipment Reason" | Même HTML | Agrégation `driverDailyStats.dwcBreakdown` |
| **IADC Breakdown (Mailbox, Unattended…)** | HTML IADC → colonne "Group" | Même HTML | Agrégation `driverDailyStats.iadcBreakdown` |
| **Delivery Overview (Colis station / DNR / RTS)** | Amazon Delivery Overview | CSV `DSP_Delivery_Overview_*.csv` | Import manuel direct |
| **Warnings / Coaching Actions** | — | Saisie manuelle manager | — |

**Tiers DWC** (hardcodés, ne JAMAIS varier) :
- **Fantastic** ≥ 95.00 %
- **Great** ≥ 90.00 %
- **Fair** ≥ 88.00 %
- **Poor** < 88.00 %

---

# 🖥️ Page 1 : `/dashboard` (Overview)

## Fond — Données

### KPI Cards (6 cartes en haut)
- [ ] **DWC %** = Amazon DWC report (même semaine). Tolérance < 0.1 %.
- [ ] **DWC Trend** (flèche ↑↓ + delta) : delta = DWC S-actuelle − DWC S-1. Cohérent avec Amazon ?
- [ ] **IADC %** = Amazon DWC report section IADC. Tolérance < 0.1 %.
- [ ] **IADC Trend** : delta vs S-1 cohérent ?
- [ ] **Colis livrés** = somme des `packagesDelivered` du CSV Associate Overview (PAS le total DWC). Vérifier à la ligne près.
- [ ] **DNR** = nombre de concessions Amazon pour la semaine (scraper VPS). Valider ce chiffre avec Amazon Concessions page.
- [ ] **DNR Trend** : delta vs S-1 cohérent.
- [ ] **Drivers** affiche `actifs / total` — actifs = livreurs ayant livré ≥ 1 jour cette semaine. Valider au moins le total.
- [ ] **Alertes** = nombre d'alertes non-dismissed cette semaine.

### Charts
- [ ] **Performance Chart** (DWC + IADC sur plusieurs semaines) — comparer les 4 dernières semaines au graphique Amazon.
- [ ] **Tier Distribution** — somme des 4 tiers = total drivers actifs ?
- [ ] **Top Drivers** (5) — correspond aux top DWC % Amazon ?
- [ ] **Top Errors** (5) — cohérent avec le breakdown DWC Amazon ?

### Cohérence croisée
- [ ] **Somme des drivers par tier** = nombre total de drivers actifs.
- [ ] **DWC % overview** doit être égal à la moyenne pondérée des DWC drivers (pas la moyenne simple).
- [ ] Le **numéro de semaine affiché** (ex: S16) correspond bien à la semaine **dimanche-samedi** Amazon (pas ISO).

## Forme — UI/UX
- [ ] Page charge en < 3s
- [ ] Skeletons pendant le chargement (pas de pop visuel)
- [ ] Responsive mobile (375px largeur)
- [ ] Dark mode lisible (contraste OK)
- [ ] Tier colors : emerald (Fantastic), blue (Great), amber (Fair), red (Poor) — aucun autre
- [ ] Sélecteur de semaine en haut fonctionne (back/forward) sans rechargement complet

---

# 👥 Page 2 : `/dashboard/drivers` (Liste livreurs)

## Fond — Données

### Cartes Tier Stats
- [ ] **Fantastic** : count + % = `fantastic ÷ total × 100`. Vérifier.
- [ ] **Great** : idem
- [ ] **Fair** : idem
- [ ] **Poor** : idem
- [ ] **Total Drivers** affichés = nombre de livreurs dans `drivers` table pour cette station
- [ ] **Active Drivers** = ceux ayant livré cette semaine

### Tableau Drivers
Pour **10 drivers au hasard** (mix tiers) :
- [ ] **Nom / Amazon ID** : identique au CSV drivers importé
- [ ] **DWC %** : identique à Amazon DWC report (ligne livreur)
- [ ] **IADC %** : idem
- [ ] **Tier** : bien calculé via seuils (95/90/88)
  - Exemple : livreur à 94.99 % → Great (pas Fantastic)
  - Livreur à 87.99 % → Poor (pas Fair)
- [ ] **Jours actifs** = nombre de jours travaillés cette semaine (Amazon)
- [ ] **DNR Count** = concessions attribuées à ce livreur cette semaine
- [ ] **Trend** (flèche) : cohérent avec S-1

### Cohérence
- [ ] Somme **DWC %** pondérée (par colis livrés) ≈ DWC station overview
- [ ] Aucun livreur n'apparaît en double
- [ ] Pas de livreur avec `DWC = 100%` et `DWC Misses > 0` (impossible)

## Forme
- [ ] **Recherche** par nom fonctionne (accent-insensitive : "stéphane" matche "Stephane")
- [ ] **Tri** par colonne (DWC, IADC, DNR, tier) fonctionne
- [ ] **Pagination** si > 50 livreurs
- [ ] Clic sur une ligne ouvre `/dashboard/drivers/[id]`
- [ ] Badge **walker** apparait pour les walkers (si pattern amazonId walker)

---

# 👤 Page 3 : `/dashboard/drivers/[id]` (Fiche livreur)

## Fond — Données

Choisis **3 livreurs** (1 Fantastic, 1 Fair, 1 Poor) et vérifie chacun :

### Header
- [ ] Nom + Amazon ID corrects
- [ ] Tier + Rank (position dans la station) cohérents

### KPIs (4 cartes)
- [ ] **DWC %** semaine : vs Amazon DWC report, ligne livreur
- [ ] **IADC %** semaine : vs Amazon IADC
- [ ] **Colis livrés** : **attention source = Associate Overview CSV**, pas DWC
- [ ] **DNR cette semaine** : count concessions du livreur

### Daily Performance (jour par jour)
- [ ] Chaque jour affiché a **DWC journalier = Amazon DWC daily** (si disponible par jour)
- [ ] **Coaching markers** (si actions coachings existent) apparaissent au bon jour
- [ ] **Jours off** (pas de livraison) ne sont pas affichés ou marqués clairement

### Weekly Performance Trend (12 semaines)
- [ ] Affiche bien **12 dernières semaines** dim-sam (pas ISO)
- [ ] Points cohérents avec l'historique Amazon (au moins les 4 dernières semaines)

### Error Breakdown (Week over Week)
Compare semaine-courante vs S-1 :
- [ ] **Contact Miss** count correct
- [ ] **Photo Defect** correct
- [ ] **No Photo** correct
- [ ] **OTP Miss** correct
- [ ] **Other** correct
- [ ] Delta (↑↓) correctement calculé

### Warnings Card
- [ ] Affiche **warnings actifs** du livreur (level first/second/final)
- [ ] Dates correctes
- [ ] Motif + notes complets

### Coaching History
- [ ] Liste des actions coaching ordonnées chronologiquement
- [ ] Status (pending/improved/no_effect/escalated) affiché

## Forme
- [ ] Bouton **retour** vers liste drivers
- [ ] Charts responsive
- [ ] Export PDF du rapport driver fonctionne (si bouton présent)

---

# 📦 Page 4 : `/dashboard/dnr` (DNR & Investigations)

## Fond — Données

### KPI Cards
- [ ] **Nombre DNR** = count Amazon Concessions semaine. **Critique**.
- [ ] **Delta vs S-1** : mathématiquement cohérent
- [ ] **Formal Investigations** = count sous-ensemble avec status "under_investigation"
- [ ] **Concessions** = count entries type "concession"
- [ ] **Prevention Rate** = `(total − confirmed_dnr) ÷ total × 100`
- [ ] **Top Offenders** = top 5 livreurs par count DNR — vérifier les 3 premiers contre Amazon

### Daily DNR Chart
- [ ] Barre par jour dim → sam de la semaine sélectionnée
- [ ] Somme des barres = total DNR affiché en KPI

### Tableau DNR (colonnes)
Prendre **5 lignes au hasard** et vérifier pour chacune :
- [ ] **Tracking ID** correspond à un shipment Amazon réel
- [ ] **Driver Name** correct (lié via amazonId)
- [ ] **Delivery Date** (date de livraison Amazon)
- [ ] **Concession Date** (date de la concession)
- [ ] **Delivery Type** (Boîte aux lettres, Main propre, Safe place…) — correspond au Cortex detail Amazon
- [ ] **Address** : rue + code postal + ville cohérents
- [ ] **GPS Distance** en mètres (si présent) — vérifier ≥ 0
- [ ] **Status** : ongoing / resolved / confirmed_dnr / under_investigation / investigation_closed
- [ ] **Entry Type** : concession vs investigation

### Detail Sheet (clic sur une ligne)
- [ ] Ouvre panneau latéral avec tous les détails
- [ ] **Adresse** et **notes client** sur 2 lignes séparées (pas collées)
- [ ] Historique status visible

## Forme
- [ ] Tri par date, driver, status
- [ ] Filtre par driver / par status
- [ ] Export CSV si présent
- [ ] Si aucun DNR : message clair "Aucun DNR cette semaine"

---

# ⚠️ Page 5 : `/dashboard/warnings` (Avertissements)

## Fond — Données

### KPI Cards
- [ ] **Total actifs** = count `warnings` avec status "active"
- [ ] **1er avertissement** = count level "first" + status "active"
- [ ] **2ème avertissement** = count level "second" + status "active"
- [ ] **Final** = count level "final" + status "active"

### Tableau
Pour les warnings existants :
- [ ] **Livreur** : nom + amazonId corrects + badge "walker" si applicable
- [ ] **Niveau** : couleur correspondante (amber/orange/red)
- [ ] **Motif** : texte complet affiché
- [ ] **Notes** : texte optionnel, bien affiché ou absent
- [ ] **Émis le** : date cohérente avec la création
- [ ] **Expire** : date future ou vide
- [ ] **Statut** : active (vert) / expired / cancelled (gris)

### Création d'un avertissement
- [ ] Bouton "Nouvel avertissement"
- [ ] Modal : sélection livreur, niveau, motif (obligatoire), notes (optionnel), date expiration
- [ ] Soumission crée l'entry en base
- [ ] Apparait dans le tableau sans refresh

### Annulation (soft delete)
- [ ] Icône poubelle sur chaque ligne
- [ ] Confirmation avant annulation
- [ ] Status passe à "cancelled"
- [ ] Disparait de l'onglet "Actifs"

## Forme
- [ ] **Filtre tabs** : Actifs / Expirés / Annulés / Tous
- [ ] Tri par date, livreur, niveau
- [ ] Responsive mobile

---

# 🚨 Page 6 : `/dashboard/errors` (Analyse erreurs)

## Fond — Données

### Tabs
- [ ] **DWC** tab actif par défaut
- [ ] **IADC** tab disponible
- [ ] (Si présent) **False Scans** tab

### KPIs DWC
- [ ] **Contact Miss** : count = somme `dwcBreakdown.contactMiss` tous drivers/jours. Vérifier contre HTML Amazon (colonne Shipment Reason).
- [ ] **Photo Defect** : idem
- [ ] **No Photo** : idem
- [ ] **OTP Miss** : idem
- [ ] **Other** : idem
- [ ] **Somme totale des 5 catégories ≈ total DWC Misses station** (peut différer légèrement si "Other" catch tout)

### KPIs IADC
- [ ] **Mailbox** : count = somme `iadcBreakdown.mailbox`
- [ ] **Unattended** : idem
- [ ] **Safe Place** : idem
- [ ] **Other** : idem
- [ ] **Somme ≈ IADC Non-Compliant station**

### Charts
- [ ] **Breakdown Chart** (pie/donut) : cohérent avec les KPIs
- [ ] **Top Drivers Errors** : top 10 drivers par count — vérifier top 3 contre Amazon
- [ ] **Error Trend** (8 semaines stacked) : tendances cohérentes avec historique

### Sous-breakdowns (optionnels)
- [ ] **Contact Miss Detail** (mailSlot, receptionist, safeLocation, doorstep, shed, other) — si le parser a extrait le détail
- [ ] Somme des sous-catégories = total Contact Miss

## Forme
- [ ] Tabs fluides, pas de délai
- [ ] Pie chart légendes visibles
- [ ] Hover sur barres → tooltip avec chiffres exacts

---

# 🎯 Page 7 : `/dashboard/coaching` (Pipeline coaching)

## Fond — Données

### KPIs
- [ ] **Total Actions** = count all (non-supprimés)
- [ ] **Améliorés ce mois** = count status "improved" depuis 30 jours
- [ ] **En cours** = count "pending"
- [ ] **Sans effet** = count "no_effect"
- [ ] **Escaladés** = count "escalated"

### Kanban Board
- [ ] 4 colonnes : **Pending** | **Improved** | **No Effect** | **Escalated**
- [ ] Chaque carte affiche : action type, livreur, raison, date
- [ ] **Drag & drop** fonctionne (status update)
- [ ] **Drag** vers "Improved" ouvre modal évaluation

### Création action
- [ ] Bouton "+ Nouvelle action"
- [ ] Modal : livreur, type (discussion/warning/training/suspension), raison, notes
- [ ] Création ajoute carte dans Pending

### Evaluation action
- [ ] Clic sur carte Pending → ouvre modal "Évaluer"
- [ ] Choix : Improved / No Effect / Escalate to warning
- [ ] Si "Escalate" → crée automatiquement un warning lié (vérifier table `warnings`)

### Coaching Effectiveness
- [ ] Stats 3M / 6M / 1Y par type d'action
- [ ] % improvement rate affiché

## Forme
- [ ] Kanban responsive (scroll horizontal mobile)
- [ ] Animations drag smooth
- [ ] Couleurs statuts cohérentes

### Sous-pages
- [ ] `/coaching/recaps` : liste récaps hebdo coaching
- [ ] `/coaching/calendar` : vue calendrier des actions

---

# 📄 Page 8 : `/dashboard/reports` (Rapports)

## Fond — Données

### Tabs
- [ ] **Tous** / **Hebdomadaires** / **Quotidiens** / **Livreurs**

### Tableau Station Reports
- [ ] **Type** : badge Weekly (bleu) / Daily (gris)
- [ ] **Titre** : correspond au `reportDeliveries.title`
- [ ] **Période** : label + semaine/année cohérents
- [ ] **Créé le** : date + heure génération (auto cron)
- [ ] **Confiance** : % ≥ 70% → badge vert
- [ ] **Actions** : bouton **Open** (HTML dans nouvel onglet) + **Download** (PDF)

### Contenu rapport (ouvrir 1 rapport weekly)
Comparer avec les chiffres des autres pages :
- [ ] **DWC semaine** = DWC overview dashboard
- [ ] **IADC semaine** = IADC overview
- [ ] **Top drivers** = cohérents avec page drivers
- [ ] **DNR count** = cohérent avec page DNR
- [ ] **Coaching actions** mentionnées cohérentes

### Tab Livreurs (reports/drivers)
- [ ] Liste 1 rapport par livreur (généré lundi 13h par cron "drivers")
- [ ] Colonnes : Driver Name, DWC%, Rank, DWC Trend, Actions
- [ ] Clic "Open" ouvre rapport HTML individuel
- [ ] PDF téléchargeable

## Forme
- [ ] Recherche / filtre par livreur fonctionne (onglet Livreurs)
- [ ] Tri par date descendante par défaut
- [ ] Loading state si rapport en génération

---

# 📈 Page 9 : `/dashboard/stats` (Delivery Overview)

## Fond — Données

### Import CSV
- [ ] Drag & drop fichier `DSP_Delivery_Overview_*.csv` fonctionne
- [ ] Parser détecte bien les colonnes Amazon : Colis livrés, DNR, RTS, Conformité, etc.
- [ ] Confirmation d'import
- [ ] Stats apparaissent dans le tableau après import

### Tableau Stats
- [ ] Colonnes : **metricName**, **week**, **year**, **value** (formaté), **numericValue**
- [ ] Filtrage par semaine
- [ ] Valeurs correspondent ligne à ligne au CSV Amazon
- [ ] Pourcentages affichent bien le symbole `%`
- [ ] Grands nombres formatés avec séparateurs (ex: 12 456)

## Forme
- [ ] Drop zone visible et claire
- [ ] Messages d'erreur explicites si format incorrect
- [ ] Historique des imports visible

---

# 📥 Page 10 : `/dashboard/import` (Import données)

## Fond — Données

### Upload HTML DWC/IADC
- [ ] Drop d'un HTML valide → parsing démarre
- [ ] **Station Code** détecté automatiquement
- [ ] **Semaine** détectée correctement (dim-sam)
- [ ] **Drivers importés** : count = nb drivers du rapport
- [ ] **Daily records** : count = somme `(drivers × jours travaillés)`
- [ ] **Weekly records** : count = nb drivers
- [ ] **DWC Score** station = DWC Amazon
- [ ] **IADC Score** station = IADC Amazon
- [ ] **Tier Distribution** : Fantastic/Great/Fair/Poor counts cohérents

### Preview → Confirm
- [ ] Preview complet avant import
- [ ] Confirmation crée les records en base
- [ ] Message succès après import
- [ ] Navigation auto vers dashboard après succès (ou bouton)

### Gestion erreurs
- [ ] Upload HTML cassé → message erreur clair (pas de crash)
- [ ] **Import multi-semaines** : refusé ou warning (ne JAMAIS importer > 1 semaine d'un coup)

### CSV Driver Names
- [ ] Upload `amazonId,name` CSV fonctionne
- [ ] Match drivers existants par amazonId
- [ ] Met à jour les noms (mutation `bulkUpdateDriverNames`)

### Import History
- [ ] Liste tous les imports passés
- [ ] Status : success / error
- [ ] Filename, dates, drivers count

### Coverage Stats
- [ ] Affiche semaines couvertes cette année
- [ ] **Semaines manquantes** signalées en rouge/warning

## Forme
- [ ] Dropzone claire (drag-over highlight)
- [ ] Progress bar pendant parsing
- [ ] **Format Guide** accessible (help text)

---

# ⚙️ Page 11 : `/dashboard/settings` (Paramètres)

## Fond — Données

### Onglet Organisation
- [ ] Code station correct (ex: DIF1)
- [ ] Nom station affiché

### Onglet Compte
- [ ] Email user Clerk
- [ ] Nom affiché
- [ ] Bouton "Gérer mon compte" redirige vers Clerk user profile

### Onglet WhatsApp
- [ ] Toggle on/off
- [ ] Jour de la semaine (sélecteur)
- [ ] Heure (sélecteur)
- [ ] Sauvegarde persiste après refresh

### Onglet Abonnement
- [ ] Plan actuel affiché (Free / Pro / Enterprise)
- [ ] Lien Stripe portal (si Pro/Enterprise)
- [ ] Date renouvellement (si applicable)

### Onglet Objectifs Station
Valeurs par défaut recommandées à ajuster :
- [ ] **dwcTarget** : 92% par défaut → réglable
- [ ] **iadcTarget** : 65% par défaut → réglable
- [ ] **dwcAlertDrop** : 5 points → réglable
- [ ] **dnrDpmoMax** : 1500 DPMO → réglable
- [ ] **coachingMaxDays** : 14 jours → réglable
- [ ] Sauvegarde persistante

## Forme
- [ ] Tabs cliquables, URL update
- [ ] Formulaires avec validation (pas de valeurs négatives, etc.)
- [ ] Messages succès après save
- [ ] Annulation des changements possible avant save

---

# 🔐 Tests transversaux (à faire une fois)

## Auth / Multi-tenant
- [ ] Login Clerk fonctionne (email + password ou SSO)
- [ ] Logout redirige vers page publique
- [ ] **Impossibilité de voir les données d'une autre station** (même en bidouillant l'URL avec un autre `stationId`)
- [ ] Rôles (admin / manager / viewer) donnent bien les bons accès

## Semaines Amazon
- [ ] Changer de semaine partout (dashboard, drivers, dnr, errors) met à jour toutes les données
- [ ] Semaine courante affichée par défaut
- [ ] **Semaine 1 janvier** : s'affiche bien comme dim-sam (pas ISO)
- [ ] **Semaine chevauchant l'année** : ex semaine 52/2025 → s'affiche bien

## Performance
- [ ] Aucune page > 3s pour charger
- [ ] Aucun pop visuel (skeletons partout)
- [ ] Real-time Convex : modifier un warning sur une tab, voir update instantanée sur autre tab

## Responsive
- [ ] iPhone portrait (375×812) : toutes les pages utilisables
- [ ] iPad (820×1180) : layouts corrects
- [ ] Desktop (1440+) : pas de whitespace inutile

## Dark mode / Light mode
- [ ] Toggle fonctionne
- [ ] Contrastes OK dans les 2 modes
- [ ] Charts lisibles dans les 2 modes

## Exports
- [ ] Export PDF rapports (station + livreurs) fonctionne
- [ ] PDFs ouvrent dans un navigateur standard
- [ ] Chiffres du PDF = chiffres de l'app

## Notifications / Alertes
- [ ] Dropdown notifications affiche les alertes
- [ ] Clic sur alerte navigue vers le bon contexte
- [ ] Dismiss fonctionne

---

# 🐛 NOTES BUG (à remplir par le testeur)

Format à utiliser :

```
### Bug #1
- **Page** : /dashboard/drivers
- **Semaine** : S16/2026
- **Description** : Livreur X a DWC = 94.8 % affiché mais Amazon dit 95.2 %
- **Reproduction** : ouvrir page, scroll jusqu'à livreur X
- **Gravité** : critique / haute / moyenne / basse
- **Screenshots** : (à joindre)
```

---

# ✅ Validation finale

Une fois la checklist complète :
- [ ] Nombre de `✅` : ___ / ___
- [ ] Nombre de `❌` : ___
- [ ] Nombre de `⚠️` : ___
- [ ] Verdict : **GO BETA** / **NO-GO** / **GO après fix des bugs critiques**

**Signature testeur** : _______________ **Date** : _______________
