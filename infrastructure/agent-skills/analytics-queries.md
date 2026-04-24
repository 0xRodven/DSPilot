---
name: analytics-queries
description: Pre-written Convex analytics queries for DSPilot (top/bottom drivers, deltas WoW, tier distribution, DNR by scanType, cohorts, anomalies). Use FIRST when user asks any "stats", "classement", "évolution", "qui a le plus/le moins", "combien de X cette semaine".
---

# analytics-queries — patterns Convex pré-écrits

## Quand l'utiliser

Avant de query Convex à la volée, cherche si un des patterns ci-dessous couvre la question. Ça économise du temps et garantit la cohérence des noms de colonnes.

## Setup common

```bash
cd /root/DSPilot
# Toutes les queries utilisent :
# npx convex data <table> --format jsonLines > /tmp/data.jsonl
# puis jq pour filtrer

STATION_ID="m5793emg00bwkq7n082dyrp4kd841cak"  # DIF1 prod
ORG_ID="org_37Yb7MlFJHFs5h7K28zFYoZ4fUY"
```

## 1. Top/Bottom drivers par DWC

```bash
npx convex data driverWeeklyStats --limit 2000 --format jsonLines > /tmp/dws.jsonl
# Top 10 S17
jq -r 'select(.year==2026 and .week==17 and .stationId=="'$STATION_ID'") | [.driverId, .dwcCompliant, .dwcMisses] | @tsv' /tmp/dws.jsonl \
  | awk -F'\t' 'BEGIN{OFS="\t"} {pct = $2/($2+$3)*100; print $1, pct}' \
  | sort -k2 -rn | head -10

# Bottom 10
# ... | sort -k2 -n | head -10
```

Puis pour avoir les noms drivers :

```bash
npx convex data drivers --format jsonLines > /tmp/drv.jsonl
jq -s '[.[0][] as $d | $d as $stat | (.[1][] | select(._id==$d.driverId)) | {name, dwc: $stat.pct}]' /tmp/dws.jsonl /tmp/drv.jsonl
```

## 2. Delta WoW (week-over-week) pour un driver

```bash
DRIVER_ID="k57xxxxx"
jq -r 'select(.driverId=="'$DRIVER_ID'") | "\(.year)-\(.week): DWC=\(.dwcCompliant/(.dwcCompliant+.dwcMisses)*100)"' /tmp/dws.jsonl \
  | sort
```

## 3. Tier distribution (Fantastic/Great/Fair/Poor) par semaine

```python
import json
tiers = {"fantastic": 0, "great": 0, "fair": 0, "poor": 0}
for line in open("/tmp/dws.jsonl"):
    r = json.loads(line)
    if r.get("year") == 2026 and r.get("week") == 17:
        pct = r["dwcCompliant"] / (r["dwcCompliant"] + r["dwcMisses"]) * 100
        if pct >= 95: tiers["fantastic"] += 1
        elif pct >= 90: tiers["great"] += 1
        elif pct >= 88: tiers["fair"] += 1
        else: tiers["poor"] += 1
print(tiers)
```

## 4. DNR par scanType (catégories livraison)

**Colonne correcte** : `scanType` dans `dnrInvestigations`.

Valeurs connues :
- `DELIVERED_TO_MAIL_SLOT` — Boîte aux lettres
- `DELIVERED_TO_RECEPTIONIST` — Réceptionniste
- `DELIVERED_TO_HOUSEHOLD_MEMBER` — Main propre
- `DELIVERED_TO_SAFE_LOCATION` — Autre lieu sûr
- `DELIVERED_TO_DOORSTEP` — Porte
- `UNKNOWN` — Inconnu

```bash
npx convex data dnrInvestigations --limit 2000 --format jsonLines > /tmp/dnr.jsonl
jq -r 'select(.year==2026 and .week==16 and .entryType=="concession") | .scanType' /tmp/dnr.jsonl \
  | sort | uniq -c | sort -rn
```

**Important** : filtrer `entryType=="concession"` (102 pour DIF1 S16) sinon tu chopes aussi les `investigation` (8) et totalise 110 — faux chiffre.

## 5. DNR par driver (top qui concèdent le plus)

```bash
jq -r 'select(.year==2026 and .week==16 and .entryType=="concession") | .driverName' /tmp/dnr.jsonl \
  | sort | uniq -c | sort -rn | head -10
```

## 6. DNR par code postal (cluster géographique)

```bash
jq -r 'select(.year==2026 and .week==16) | .address.postalCode // "?"' /tmp/dnr.jsonl \
  | sort | uniq -c | sort -rn | head -10
```

## 7. Évolution DNR 4 dernières semaines

```bash
jq -r 'select(.entryType=="concession") | "\(.year)-\(.week)"' /tmp/dnr.jsonl \
  | sort | uniq -c | sort -k2 | tail -4
```

## 8. Drivers sous 88% (coaching candidates)

```python
import json
at_risk = []
for line in open("/tmp/dws.jsonl"):
    r = json.loads(line)
    if r.get("year") == 2026 and r.get("week") == 17:
        pct = r["dwcCompliant"] / (r["dwcCompliant"] + r["dwcMisses"]) * 100
        if pct < 88:
            at_risk.append({"driverId": r["driverId"], "dwc": round(pct, 2), "misses": r["dwcMisses"]})
for d in sorted(at_risk, key=lambda x: x["dwc"]):
    print(d)
```

## 9. Contact Miss top offenders

```bash
jq -r 'select(.year==2026 and .week==17) | "\(.dwcBreakdown.contactMiss)\t\(.driverId)"' /tmp/dws.jsonl \
  | sort -rn | head -10
```

## 10. Jours travaillés (daysWorked) par driver

```bash
jq -r 'select(.year==2026 and .week==17) | "\(.daysWorked)\t\(.driverId)"' /tmp/dws.jsonl \
  | sort -n | head -20  # les moins présents
```

## 11. Station DWC globale S17 depuis stationDeliveryStats

```bash
npx convex data stationDeliveryStats --format jsonLines \
  | jq 'select(.year==2026 and .week==17)'
```

(colis livrés, colis expédiés, concessions Amazon officielles)

## 12. DriverAssociateStats (vue officielle Amazon)

```bash
npx convex data driverAssociateStats --format jsonLines > /tmp/das.jsonl
# C'est la source la plus fiable pour le DWC driver (post-calcul Amazon)
jq 'select(.year==2026 and .week==16)' /tmp/das.jsonl | head -3
```

## 13. Drivers nouveaux (firstSeenWeek récente)

```bash
jq -r 'select(.firstSeenWeek=="2026-16") | .name' /tmp/drv.jsonl
```

## 14. Actions coaching en cours

```bash
npx convex data coachingActions --format jsonLines \
  | jq 'select(.status!="resolved")'
```

## 15. Warnings actifs

```bash
npx convex data driverWarnings --format jsonLines \
  | jq 'select(.resolvedAt==null)'
```

## 16. Rapports générés récents

```bash
npx convex data reports --format jsonLines \
  | jq 'select(.type=="weekly" and .year==2026 and .week>=16)'
```

## 17. Anomaly detection — DWC drop > 5 points WoW

```python
import json
from collections import defaultdict
stats = defaultdict(dict)
for line in open("/tmp/dws.jsonl"):
    r = json.loads(line)
    key = r["driverId"]
    pct = r["dwcCompliant"] / (r["dwcCompliant"] + r["dwcMisses"]) * 100
    stats[key][(r["year"], r["week"])] = pct

anomalies = []
for driver, weeks in stats.items():
    s16 = weeks.get((2026, 16))
    s17 = weeks.get((2026, 17))
    if s16 and s17 and s16 - s17 > 5:
        anomalies.append({"driver": driver, "s16": s16, "s17": s17, "delta": s17 - s16})
for a in sorted(anomalies, key=lambda x: x["delta"]):
    print(a)
```

## 18. DNR investigations formelles (pas juste concessions)

```bash
jq 'select(.entryType=="investigation")' /tmp/dnr.jsonl | jq -s 'length'
```

## 19. Adresses répétées (group stops potentiels)

```bash
jq -r 'select(.year==2026 and .week==16) | "\(.address.street) \(.address.postalCode)"' /tmp/dnr.jsonl \
  | sort | uniq -c | sort -rn | head -5
```

## 20. Validation croisée — DWC agent vs Aperçu Amazon

```bash
# Somme DWC drivers
jq 's | add / length' /tmp/dws.jsonl   # moyenne driver-side
# vs stationDeliveryStats officiel
npx convex data stationDeliveryStats --format jsonLines | jq 'select(.week==16) | .dwcGlobal'
```

## Règles d'utilisation

- **Toujours filtrer par `stationId`** pour éviter les leaks cross-tenant
- **Toujours filtrer par `entryType=="concession"` sur `dnrInvestigations`** pour le bon chiffre (102 DIF1 S16)
- **Stocker le jsonl dump dans `/tmp/`** pour éviter de réinterroger Convex à chaque sous-question
- **S17 est partielle** si date < samedi — toujours préciser dans la réponse
