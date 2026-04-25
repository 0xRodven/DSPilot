---
name: dspilot-metrics-sources
description: Table de correspondance metric → source Convex authoritative. Use AVANT toute question chiffrée ("DNR", "colis livrés", "Contact Miss", "DWC", "tier"). Évite d'utiliser reporting:getReportData ou driverWeeklyStats comme source unique — ces vues sont dérivées et divergent parfois des tables brutes.
---

# dspilot-metrics-sources

Règle d'or : pour chaque métrique chiffrée, interroge la **table brute** qui la produit, pas la vue `reporting:getReportData`. Cette vue agrège et peut compter différemment (ex: tentatives vs livrés, breakdown DWC vs concessions réelles).

## Mapping metric → table source

| Métrique demandée                          | Source authoritative                         | Piège à éviter                                                    |
|--------------------------------------------|----------------------------------------------|-------------------------------------------------------------------|
| Colis livrés (station, semaine)            | `stationDeliveryStats` (`metricName="Colis livrés"`, `numericValue`) | Ne PAS sommer `reporting.drivers[].totalDeliveries` ni lire `kpis` |
| Colis expected (station, semaine)          | `stationDeliveryStats` (`metricName` expected) | Idem, passer par stationDeliveryStats                              |
| DNR totaux (station, semaine)              | `dnrInvestigations` (tous `entryType`) **+** toute entrée du scraper `dsp_delivery_concessions` si exposée. Compter TOUTES les entrées, pas seulement `entryType="concession"` | Ne PAS se limiter à `dnrInvestigations` sans filtrer par week/stationId au préalable — et paginer au-delà de 500 lignes si nécessaire |
| DWC moyen station                          | `stationWeeklyStats` (dériver de `dwcCompliant` / (`dwcCompliant` + `dwcMisses`)) | Pas de confusion avec `reporting.kpis.avgDwc` qui peut arrondir |
| Tier distribution (fantastic/great/fair/poor) | `stationWeeklyStats.tierDistribution` ou `dwcDistribution` | L'user n'aime PAS les labels tier (règle Claude.md). Donner juste le count sans coller le label. Attention au seuil inclusif : `poor` dans le schéma = DWC < 88 ; si l'user demande "< 88%", cross-check avec `dwcDistribution` et avec les `drivers[].dwcPercent` individuels pour détecter les off-by-one |
| Contact Miss par livreur                   | Compter les entrées de `dnrInvestigations` où le driver apparaît + croiser avec `driverWeeklyStats.dwcBreakdown.contactMiss` | ⚠ `driverWeeklyStats.dwcBreakdown.contactMiss` est un breakdown DWC, PAS le compte de DNR/Contact Miss du partner report. Les deux chiffres peuvent diverger. Si l'user dit "Contact Miss" dans le vocabulaire partner-report → c'est le compte `dnrInvestigations` filtré par driverId |
| DNR / Concessions par livreur              | `dnrInvestigations` filtré par `driverId` + `year` + `week` | Pagination : augmenter `--limit 2000` si la table est grosse |
| Jours travaillés (driver/semaine)          | `driverWeeklyStats.daysWorked`               | OK, champ direct                                                   |
| DWC% par livreur                           | `driverWeeklyStats` (dwcCompliant / (dwcCompliant+dwcMisses)) ou `reporting.drivers[].dwcPercent` | Les deux doivent s'accorder ; si l'écart > 0.5pt, prendre la table brute |

## Protocole avant de répondre

1. Identifie la métrique demandée → regarde le mapping ci-dessus.
2. Query la table brute autorative (pas `reporting:getReportData` sauf mention explicite).
3. Si deux sources divergent (ex: `reporting.kpis.totalDeliveries` ≠ `stationDeliveryStats.numericValue`), **fait confiance à la table brute** et mentionne l'écart.
4. Pour les compteurs (DNR, Contact Miss), toujours paginer avec `--limit 2000` minimum et filtrer **en Python après le dump**, pas via Convex CLI.

## Vocabulaire partner-report (important)

Dans les rapports partenaires DSPilot, **"Contact Miss" = DNR attribuée au livreur** (entrées `dnrInvestigations` filtrées par driverId). Ce n'est PAS le champ `dwcBreakdown.contactMiss` (qui compte des events DWC techniques, parfois surestimés par duplication avec Photo Defect). Si l'user parle "Contact Miss" dans un contexte performance livreur, privilégie le compte DNR.

## Exemple — "Colis livrés DIF1 S16"

```bash
cd /root/DSPilot
npx convex data stationDeliveryStats --prod --limit 500 --format jsonl 2>/dev/null | python3 -c "
import json, sys
STATION='m5793emg00bwkq7n082dyrp4kd841cak'  # DIF1
for l in sys.stdin:
    r = json.loads(l)
    if r.get('stationId')==STATION and r.get('year')==2026 and r.get('week')==16 and r.get('metricName')=='Colis livrés':
        print(r.get('value'), '|', r.get('numericValue'))
"
```

## Exemple — "Top Contact Miss DIF1 S16"

```bash
# Compter par driverId dans dnrInvestigations
cd /root/DSPilot
npx convex data dnrInvestigations --prod --limit 2000 --format jsonl 2>/dev/null | python3 -c "
import json, sys
from collections import Counter
STATION='m5793emg00bwkq7n082dyrp4kd841cak'
c = Counter()
for l in sys.stdin:
    r = json.loads(l)
    if r.get('stationId')==STATION and r.get('year')==2026 and r.get('week')==16:
        if r.get('driverId'): c[r['driverId']] += 1
# Puis résoudre les driverId → noms via npx convex data drivers
for did, n in c.most_common(5): print(did, n)
"
```

## Ne JAMAIS

- Répondre un chiffre sans avoir query la table brute citée ici.
- Confondre `dwcBreakdown.contactMiss` avec le compte DNR partner-report.
- Tirer `kpis.totalDeliveries` de `reporting:getReportData` pour "colis livrés" sans cross-check `stationDeliveryStats`.
