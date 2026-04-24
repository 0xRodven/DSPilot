---
name: generate-map
description: Generate a map PNG (DNR concessions clusters, driver routes, station coverage) via folium + staticmap. Use when user asks "map", "carte", "où sont", "plot sur carte", "cluster géographique".
---

# generate-map — cartes DSPilot

## Quand l'utiliser

- "Montre-moi où sont les DNR de la semaine"
- "Carte des concessions S17 par livreur"
- "Heatmap des zones à risque"
- "Zoom Montmartre sur les 3 derniers scrapes"

## Étapes

1. **Query Convex** : `dnrInvestigations` avec filtre semaine/driver. Récupère `lat`, `lng`, `address`, `driverName`, `scanType`.
2. **Si lat/lng manquants** : geocode via **BAN API** (gratuit, officiel FR) :
   ```bash
   curl "https://api-adresse.data.gouv.fr/search/?q=10+rue+de+Paris+Ivry&limit=1"
   ```
3. **Choisir le rendu** :
   - < 50 markers → `staticmap` Python (léger, PNG direct)
   - 50-500 markers → `folium` avec `MarkerCluster` (HTML interactive, screenshot via chromium)
   - > 500 → `folium` + `HeatMap` plugin
4. **Save PNG** dans `/tmp/map_${name}_${week}.png`
5. **Reply Telegram** avec image + résumé (nb points, pattern dominant ex "75018 concentre 36%")

## Template staticmap (pour < 50 points)

```python
from staticmap import StaticMap, CircleMarker
m = StaticMap(1580, 900, url_template='https://tile.openstreetmap.org/{z}/{x}/{y}.png')

# Palette drivers (cycle sur 12 couleurs)
palette = ["#2563EB", "#F87171", "#34D399", "#FBBF24", "#60A5FA", "#A78BFA",
           "#F472B6", "#FB923C", "#10B981", "#EF4444", "#8B5CF6", "#14B8A6"]
driver_colors = {}
for i, driver in enumerate(sorted(set(d["driverName"] for d in points))):
    driver_colors[driver] = palette[i % 12]

for p in points:
    if p.get("lat") and p.get("lng"):
        m.add_marker(CircleMarker((p["lng"], p["lat"]), driver_colors[p["driverName"]], 12))

img = m.render()
img.save("/tmp/map_dnr_s17.png")
```

## Template folium (pour interactive + screenshot)

```python
import folium
from folium.plugins import MarkerCluster, HeatMap

center = [48.8566, 2.3522]  # Paris
m = folium.Map(location=center, zoom_start=12, tiles="OpenStreetMap")

cluster = MarkerCluster().add_to(m)
for p in points:
    folium.Marker(
        location=[p["lat"], p["lng"]],
        popup=f"{p['driverName']}<br>{p['address']}<br>{p['scanType']}",
        icon=folium.Icon(color="blue", icon="info-sign")
    ).add_to(cluster)

# Heatmap layer optionnelle
HeatMap([[p["lat"], p["lng"]] for p in points]).add_to(m)

m.save("/tmp/map.html")
# Screenshot via chromium headless
import subprocess
subprocess.run(["chromium-browser", "--headless", "--no-sandbox",
    "--window-size=1580,900", "--screenshot=/tmp/map.png", "file:///tmp/map.html"])
```

## Geocoding bulk via BAN (pour addresses sans lat/lng)

```python
import requests, pandas as pd

addresses = [{"id": d["_id"], "addr": d["address"]} for d in dnrs if not d.get("lat")]
df = pd.DataFrame(addresses)
df.to_csv("/tmp/addrs.csv", index=False)

# BAN batch geocoding (free, 100% official FR)
resp = requests.post("https://api-adresse.data.gouv.fr/search/csv/",
    files={"data": open("/tmp/addrs.csv", "rb")},
    data={"columns": "addr"})
# Returns CSV with latitude, longitude columns appended
```

## Légende obligatoire sur toute map envoyée

- Titre (ex: "Concessions S17 (25/30) — DIF1")
- Liste drivers avec leur couleur + nb de points
- Footer : "Données anonymisées conformes RGPD" (pour les maps publiques demo)

## Règles reply

- Si cluster > 30% sur un code postal → mentionner explicitement dans le résumé
- Si drivers adjacents sur même rue/stop → flag comme "group stop potentiel"
- Toujours joindre le PNG ET envoyer le résumé dessous (pas dans caption image)
