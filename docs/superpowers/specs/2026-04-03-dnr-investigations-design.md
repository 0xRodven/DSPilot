# DNR Investigations + Table Harmonization — Design Spec

**Date**: 2026-04-03
**Status**: Approved
**Scope**: Scraper, Convex ingestion, page DNR, intégration drivers, harmonisation tableaux

---

## 1. Contexte

Les DNR (Did Not Receive) sont des réclamations client signalant qu'un colis n'a pas été reçu. Amazon fournit :

- **Page live `dsp_delivery_concessions`** : tableau de toutes les investigations avec détail par tracking (livreur, adresse, GPS, notes client)
- **HTML statique `DNR_Investigations`** : résumé hebdo (investigations/responses/prevention rate) + tracking IDs en cours — données pauvres, colonnes souvent vides, pas de nom de livreur

**Décision** : scraper directement la page live `dsp_delivery_concessions`. Le HTML statique est ignoré.

Volume typique : 1-8 investigations par semaine par station.

---

## 2. Data Pipeline

### 2.1 Scraper — `scraper/amazon_concessions_sync.py`

Nouveau script Python basé sur le pattern `amazon_supplementary_sync.py` (nodriver + BeautifulSoup).

**Flow** :
1. Naviguer sur `https://logistics.amazon.fr/performance?pageId=dsp_delivery_concessions&tabId=delivery-concessions-weekly-tab&timeFrame=Weekly&to={week}`
2. Parser le tableau principal — chaque ligne = une investigation
3. Pour chaque tracking ID, cliquer pour ouvrir le détail (popup/page) et extraire :
   - Livreur + Transporter ID
   - Date de livraison (`deliveryDatetime`)
   - Date de concession (`concessionDatetime`)
   - Scan type / lieu de dépôt (`DELIVERED_TO_HOUSEHOLD_MEMBER`, `DELIVERED_TO_MAIL_SLOT`, etc.)
   - Adresse complète : rue, bâtiment, étage, code postal, ville
   - GPS planifié (lat, lng) + GPS réel (lat, lng)
   - Distance en mètres entre planifié et réel
   - Notes du client
4. Sauvegarder en JSON dans `.artifacts/concessions/{week-slug}/concessions.json`
5. Supporter `--weeks N` pour backfill multi-semaines
6. Supporter `--invoke-ingest` pour appeler la mutation Convex après extraction

**Cron VPS** : `dspilot-concessions-daily` — 6h15 Paris, après le scrape Amazon daily (5h35). Engine: Claude Opus.

### 2.2 Table Convex — `dnrInvestigations`

```typescript
dnrInvestigations: defineTable({
  // Identifiers
  organizationId: v.string(),
  stationId: v.id("stations"),
  trackingId: v.string(),

  // Driver link
  driverId: v.optional(v.id("drivers")),
  transporterId: v.string(),
  driverName: v.string(),

  // Temporal
  year: v.number(),
  week: v.number(),
  deliveryDatetime: v.string(),   // ISO 8601
  concessionDatetime: v.string(), // ISO 8601

  // Delivery details
  scanType: v.string(),
  address: v.object({
    street: v.string(),
    building: v.optional(v.string()),
    floor: v.optional(v.string()),
    postalCode: v.string(),
    city: v.string(),
  }),
  gpsPlanned: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  gpsActual: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  gpsDistanceMeters: v.optional(v.number()),
  customerNotes: v.optional(v.string()),

  // Status
  status: v.union(
    v.literal("ongoing"),
    v.literal("resolved"),
    v.literal("confirmed_dnr")
  ),
})
  .index("by_org", ["organizationId"])
  .index("by_station_week", ["stationId", "year", "week"])
  .index("by_tracking", ["trackingId"])
  .index("by_driver", ["driverId", "year", "week"])
  .index("by_station_driver", ["stationId", "driverId"])
```

### 2.3 Ingestion — `convex/dnr.ts`

**Mutation `dnr.ingestConcessions`** :
- Input : array d'investigations JSON
- Upsert par `trackingId` (même tracking = update statut/détails)
- Résout `driverId` via `transporterId` → lookup dans table `drivers`
- Si driver inconnu : stocke quand même avec `driverId: undefined`, log warning

**Query `dnr.getInvestigations`** :
- Filtre par stationId + year/week (utilise filtre global)
- Filtre optionnel par driverId (pour la vue filtrée depuis drivers)
- Filtre optionnel par status
- Retourne investigations triées par `concessionDatetime` desc

**Query `dnr.getDriverDnrCount`** :
- Compte les investigations par driverId pour une semaine donnée
- Utilisé par les tableaux drivers pour afficher la colonne DNR

**Query `dnr.getKpis`** :
- Investigations count cette semaine + delta vs semaine précédente
- Prevention rate (resolved / total)
- Top récidiviste (driver avec le plus de DNR sur 4 semaines glissantes)

**Query `dnr.getTrend`** :
- 8 dernières semaines : investigations count + confirmed DNR count par semaine
- Pour le sparkline

---

## 3. Page `/dashboard/dnr`

### 3.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  [Investigations: 4 ↑2]  [Prevention: 75%]  [Top: Kamara (3)]  │  ← KPI cards
├─────────────────────────────────────────────────────┤
│  ▁▂▅▃▂▁▄▅  (sparkline 8 semaines)                  │  ← Mini trend
├─────────────────────────────────────────────────────┤
│  [Search] [Statut ▾] ← filtres                     │
│  ┌───┬──────────┬──────────┬───────┬──────┬──────┐ │
│  │ # │ Livreur  │ Tracking │ Délai │ Scan │ Dist │ │  ← Tableau
│  ├───┼──────────┼──────────┼───────┼──────┼──────┤ │
│  │ 1 │ Kamara   │ FR303... │ 2j 4h │ HH   │ 27m  │ │
│  │ 2 │ Diallo   │ FR301... │ 1j 2h │ MAIL │ 5m   │ │
│  └───┴──────────┴──────────┴───────┴──────┴──────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.2 KPI Cards (3 cards)

1. **Investigations** : nombre total pour la semaine sélectionnée + delta (flèche verte/rouge vs semaine N-1)
2. **Prevention Rate** : % d'investigations résolues sans DNR confirmé + tendance
3. **Top récidiviste** : nom du driver avec le plus de DNR sur 4 semaines glissantes + son count

### 3.3 Sparkline

Mini graphique 8 semaines avec deux séries :
- Ligne : total investigations
- Barres : DNR confirmés

Compact, pas un gros chart. Hauteur ~60px. Utilise recharts (via shadcn `chart.tsx` existant).

### 3.4 Tableau principal

**Colonnes** :

| Colonne | Align | Format | Notes |
|---------|-------|--------|-------|
| # | left | index | Numéro de ligne |
| Livreur | left | nom + avatar icon | Cliquable → driver detail |
| Amazon ID | right | monospace text-xs | Transporter ID |
| Tracking | left | monospace text-xs | Tracking ID |
| Date livraison | right | JJ/MM HH:mm | |
| Date concession | right | JJ/MM HH:mm | |
| Délai | right | "2j 4h" | Rouge > 3j, amber > 1j, vert < 1j |
| Scan | left | badge | HOUSEHOLD_MEMBER, MAIL_SLOT, etc. (raccourci) |
| Distance GPS | right | "27m" | Rouge > 50m, amber > 20m, vert < 20m |
| Ville | left | text | Code postal + ville |
| Statut | left | badge | ongoing (amber), resolved (emerald), confirmed_dnr (red) |

**Fonctionnalités** :
- Recherche par nom livreur ou tracking ID
- Filtre par statut (All / Ongoing / Resolved / Confirmed DNR)
- Tri par colonne (défaut : date concession desc)
- Le filtre semaine vient du filtre global dashboard (useDashboardStore)
- Pagination si > 20 lignes (peu probable mais safe)
- URL param `?driver={id}` via nuqs (cohérent avec le système de filtres existant dans `src/lib/filters/`)

### 3.5 Sheet détail (clic sur une ligne)

Sheet latéral (côté droit, largeur ~480px) avec :

**Header** : Tracking ID + badge statut

**Section "Livraison"** :
- Livreur (lien vers driver detail)
- Date livraison → Date concession (avec délai calculé)
- Scan type

**Section "Adresse"** :
- Adresse complète formatée
- Notes du client (si présentes, dans un bloc `bg-muted` avec icône info)

**Section "Géolocalisation"** :
- Mini carte OpenStreetMap/Leaflet (~200px hauteur)
  - Pin bleu = GPS planifié
  - Pin rouge = GPS réel
  - Ligne entre les deux avec distance affichée
- Distance en gros (`text-2xl font-bold` coloré selon seuil)

**Section "Actions"** :
- Bouton "Créer action coaching" → ouvre le flow coaching pré-rempli (driver, motif "DNR", tracking comme contexte)

**Lib carte** : `react-leaflet` + tiles OpenStreetMap (gratuit, pas de clé API). Lazy-loaded uniquement dans le sheet.

---

## 4. Intégration pages existantes

### 4.1 Colonne DNR dans les tableaux drivers

Ajouter une colonne **DNR** dans :
- **Dashboard drivers table** (`src/components/dashboard/drivers-table/`)
- **Drivers list table** (`src/components/drivers/drivers-table/`)
- **Driver detail daily performance** (`src/components/drivers/daily-performance.tsx`)

**Comportement** :
- Affiche le nombre d'investigations pour la période (semaine ou jour)
- Si > 0 : badge rouge cliquable → navigue vers `/dashboard/dnr?driver={driverId}`
- Si 0 : affiche "—" en `text-muted-foreground`
- Position : après la colonne IADC%

### 4.2 Driver detail page

- **Nouveau KPI card** : "DNR" — nombre d'investigations cette semaine + tendance 4 semaines
- **Section "Dernières investigations DNR"** sous le tableau daily performance :
  - Mini tableau (3 dernières investigations max)
  - Colonnes : Tracking, Date, Scan, Distance, Statut
  - Lien "Voir tout →" vers `/dashboard/dnr?driver={id}`
  - Masqué si 0 investigations

### 4.3 Sidebar navigation

Nouvel item dans la sidebar principale :
- Label : "DNR"
- Icône : `PackageX` (lucide-react)
- Position : entre "Erreurs" et "Coaching"
- Badge count si investigations ongoing > 0

---

## 5. Harmonisation des tableaux

Règles appliquées uniformément sur TOUS les tableaux du site :

### 5.1 Alignement

| Type de contenu | Alignement header | Alignement cellule |
|----------------|-------------------|-------------------|
| Texte (nom, description, ville) | `text-left` | `text-left` |
| Nombres (%, count, distance) | `text-right` | `text-right tabular-nums` |
| IDs (Amazon ID, Tracking) | `text-right` | `text-right font-mono text-xs` |
| Badges/Statuts | `text-left` | `text-left` |
| Actions (boutons) | `text-right` | `text-right` |
| Index (#) | `text-left` | `text-left font-mono` |

### 5.2 Styles communs

```
Header:     text-muted-foreground text-sm font-medium
Cell:       p-2 px-3 align-middle whitespace-nowrap
Row hover (cliquable):  hover:bg-muted/50 cursor-pointer transition-colors
Row hover (lecture):    hover:bg-transparent
Container:  rounded-lg border
```

### 5.3 Tables impactées

1. **Dashboard drivers table** — `src/components/dashboard/drivers-table/`
2. **Drivers list table** — `src/components/drivers/drivers-table/`
3. **Driver detail daily perf** — `src/components/drivers/daily-performance.tsx`
4. **Reports table** — `src/app/(main)/dashboard/reports/page.tsx`
5. **Coaching recaps table** — `src/components/coaching/recaps/data-table.tsx`
6. **Settings invoices table** — `src/components/settings/subscription-settings.tsx`
7. **New DNR table** — built from scratch with these rules

### 5.4 Colonne Amazon ID — alignement droite

Spécifiquement demandé : dans tous les tableaux qui affichent un Amazon ID, le header ET le contenu sont alignés à droite, avec `font-mono text-xs`.

---

## 6. Scope explicitement exclu

- **Carte pleine page** (split view table/carte) — V2 si besoin
- **HTML statique DNR** — ignoré, la page live a toutes les données
- **Scraping Cortex** (page détaillée au-delà du popup) — pas nécessaire, le popup a déjà tout
- **Alertes DNR automatiques** — V2
- **Export CSV des DNR** — V2
